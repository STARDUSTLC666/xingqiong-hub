// ComfyUI Launcher — local server for Gemini Sanctuary WD Tagger
// Usage: node comfy-launcher.js
// Listens on :18433, controls ComfyUI lifecycle

const { spawn, execSync } = require('child_process');
const http = require('http');
const net = require('net');

const PORT = 18433;
const COMFY_DIR = 'E:\\Codex\\ComfyUI';
const COMFY_PORT = 8188;
const PYTHON = 'E:\\Codex\\ComfyUI\\.venv\\Scripts\\python.exe';

let comfyProcess = null;
let comfyPid = null;

function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }

function findComfyProcs() {
  try {
    const out = execSync('wmic process where "name=\'python.exe\'" get processid,commandline /format:csv', { encoding: 'utf8', timeout: 5000 });
    const lines = out.split('\n');
    const pids = [];
    for (const line of lines) {
      if (line.includes('main.py') && line.includes('ComfyUI')) {
        const m = line.match(/(\d+)\s*$/);
        if (m) pids.push(parseInt(m[1]));
      }
    }
    return pids;
  } catch (e) {
    return [];
  }
}

function checkPort(port) {
  return new Promise(resolve => {
    const sock = new net.Socket();
    sock.setTimeout(1000);
    sock.on('connect', () => { sock.destroy(); resolve(true); });
    sock.on('error', () => { sock.destroy(); resolve(false); });
    sock.on('timeout', () => { sock.destroy(); resolve(false); });
    sock.connect(port, '127.0.0.1');
  });
}

async function startComfy() {
  // Check if already running
  const running = await checkPort(COMFY_PORT);
  if (running) {
    log('ComfyUI already running on port ' + COMFY_PORT);
    return { ok: true, msg: 'ComfyUI 已在运行', port: COMFY_PORT };
  }

  // Look for existing processes
  const existingPids = findComfyProcs();
  for (const pid of existingPids) {
    try { process.kill(pid); log('Killed stale ComfyUI pid ' + pid); } catch {}
  }
  await new Promise(r => setTimeout(r, 1500));

  // Spawn ComfyUI
  log('Starting ComfyUI...');
  try {
    comfyProcess = spawn(PYTHON, ['main.py'], {
      cwd: COMFY_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
      windowsHide: true,
      env: { ...process.env, HF_ENDPOINT: 'https://hf-mirror.com' }
    });

    comfyPid = comfyProcess.pid;
    log('Spawned PID: ' + comfyPid);

    comfyProcess.stdout.on('data', d => log('COMFY: ' + d.toString().trim()));
    comfyProcess.stderr.on('data', d => log('COMFY ERR: ' + d.toString().trim()));
    comfyProcess.on('exit', code => { log('ComfyUI exited with code ' + code); comfyProcess = null; comfyPid = null; });

    // Wait for it to come online
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const alive = await checkPort(COMFY_PORT);
      if (alive) {
        log('ComfyUI is ready!');
        return { ok: true, msg: 'ComfyUI 启动成功', port: COMFY_PORT };
      }
    }
    return { ok: false, msg: 'ComfyUI 启动超时，请检查控制台输出' };
  } catch (e) {
    log('Failed to start: ' + e.message);
    return { ok: false, msg: '启动失败: ' + e.message };
  }
}

async function stopComfy() {
  const results = [];

  // Kill our managed process
  if (comfyProcess) {
    try {
      comfyProcess.kill('SIGTERM');
      log('Sent SIGTERM to managed process');
    } catch (e) {
      try { comfyProcess.kill('SIGKILL'); } catch {}
    }
    comfyProcess = null;
    comfyPid = null;
    results.push('已终止管理进程');
  }

  // Kill any remaining ComfyUI pythons
  const pids = findComfyProcs();
  for (const pid of pids) {
    try { process.kill(pid); log('Killed pid ' + pid); results.push('已终止 PID ' + pid); } catch {}
  }

  if (results.length === 0) {
    const running = await checkPort(COMFY_PORT);
    if (!running) return { ok: true, msg: 'ComfyUI 未在运行' };
    return { ok: false, msg: 'ComfyUI 仍在运行，无法停止' };
  }

  // Wait for port to free
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const stillUp = await checkPort(COMFY_PORT);
    if (!stillUp) break;
  }

  return { ok: true, msg: 'ComfyUI 已停止' };
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  const url = new URL(req.url, 'http://localhost');
  log('REQ: ' + url.pathname);

  try {
    if (url.pathname === '/start') {
      const result = await startComfy();
      res.writeHead(result.ok ? 200 : 500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    }
    else if (url.pathname === '/stop') {
      const result = await stopComfy();
      res.writeHead(result.ok ? 200 : 500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    }
    else if (url.pathname === '/status') {
      const running = await checkPort(COMFY_PORT);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ running, port: COMFY_PORT, pid: comfyPid }));
    }
    else {
      res.writeHead(404);
      res.end('Not Found');
    }
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, msg: e.message }));
  }
});

server.listen(PORT, '127.0.0.1', () => {
  log('ComfyUI Launcher running on http://127.0.0.1:' + PORT);
  log('Endpoints: /start  /stop  /status');
});

// Cleanup on exit
process.on('SIGINT', async () => { await stopComfy(); process.exit(); });
process.on('SIGTERM', async () => { await stopComfy(); process.exit(); });
