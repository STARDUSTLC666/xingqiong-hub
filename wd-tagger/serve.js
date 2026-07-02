// WD Tagger unified local server
// Serves the UI on http://127.0.0.1:18435 and proxies/controls local services.

const http = require('http');
const fs = require('fs');
const path = require('path');
const net = require('net');
const { spawn, execFile } = require('child_process');

const PORT = 18435;
const WD_PORT = 18434;
const COMFY_PORT = 8188;
const BASE = __dirname;
const ROOT = path.dirname(BASE);
const COMFY_DIR = 'E:\\Codex\\ComfyUI';
const PYTHON = 'E:\\Codex\\ComfyUI\\.venv\\Scripts\\python.exe';
const WD_SCRIPT = path.join(BASE, 'wd14_server.py');
const LOG_DIR = path.join(BASE, 'logs');

let wdProc = null;
let wdStartPromise = null;
let comfyProc = null;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

function log(msg) {
  const line = `[${new Date().toLocaleString()}] ${msg}`;
  console.log(line);
  try { fs.mkdirSync(LOG_DIR, { recursive: true }); fs.appendFileSync(path.join(LOG_DIR, 'serve.log'), line + '\n', 'utf8'); } catch {}
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Private-Network': 'true',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function checkPort(port, host = '127.0.0.1', timeout = 1000) {
  return new Promise(resolve => {
    const sock = new net.Socket();
    let done = false;
    const finish = ok => { if (!done) { done = true; sock.destroy(); resolve(ok); } };
    sock.setTimeout(timeout);
    sock.once('connect', () => finish(true));
    sock.once('error', () => finish(false));
    sock.once('timeout', () => finish(false));
    sock.connect(port, host);
  });
}

function waitForPort(port, timeoutMs = 60000) {
  const started = Date.now();
  return new Promise(resolve => {
    const tick = async () => {
      if (await checkPort(port, '127.0.0.1', 700)) return resolve(true);
      if (Date.now() - started > timeoutMs) return resolve(false);
      setTimeout(tick, 1000);
    };
    tick();
  });
}

function runPowerShell(script, timeoutMs = 10000) {
  return new Promise(resolve => {
    execFile('powershell.exe', ['-NoProfile', '-Command', script], { timeout: timeoutMs, windowsHide: true }, (err, stdout, stderr) => {
      resolve({ ok: !err, stdout: stdout || '', stderr: stderr || '', error: err ? err.message : '' });
    });
  });
}

async function pidsByPort(port) {
  const ps = `netstat -ano | Select-String ':${port}' | Select-String 'LISTENING' | ForEach-Object { (($($_.Line) -split '\\s+') | Where-Object { $_ })[-1] }`;
  const out = await runPowerShell(ps);
  return [...new Set(out.stdout.split(/\r?\n/).map(s => s.trim()).filter(s => /^\d+$/.test(s)).map(Number))];
}

async function comfyPids() {
  const ps = `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and $_.CommandLine.ToLower().Contains('main.py') -and $_.CommandLine.ToLower().Contains('comfyui') } | Select-Object -ExpandProperty ProcessId`;
  const out = await runPowerShell(ps);
  return [...new Set(out.stdout.split(/\r?\n/).map(s => s.trim()).filter(s => /^\d+$/.test(s)).map(Number))];
}

async function wd14Pids() {
  const ps = `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and $_.CommandLine.ToLower().Contains('wd14_server.py') } | Select-Object -ExpandProperty ProcessId`;
  const out = await runPowerShell(ps);
  return [...new Set(out.stdout.split(/\r?\n/).map(s => s.trim()).filter(s => /^\d+$/.test(s)).map(Number))];
}

async function killPids(pids) {
  const unique = [...new Set(pids)].filter(Boolean);
  for (const pid of unique) {
    await runPowerShell(`taskkill /F /PID ${pid} | Out-Null`, 8000);
  }
  return unique.length;
}

async function proxyJson(targetUrl, res, options = {}) {
  const target = new URL(targetUrl);
  const req = http.request({
    hostname: target.hostname,
    port: target.port,
    path: target.pathname + target.search,
    method: options.method || 'GET',
    headers: options.headers || {}
  }, proxyRes => {
    const chunks = [];
    proxyRes.on('data', c => chunks.push(c));
    proxyRes.on('end', () => {
      const raw = Buffer.concat(chunks);
      res.writeHead(proxyRes.statusCode || 200, {
        'Content-Type': proxyRes.headers['content-type'] || 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      });
      res.end(raw);
    });
  });
  req.on('error', e => sendJson(res, 502, { ok: false, error: e.message, target: targetUrl }));
  if (options.body) req.write(options.body);
  req.end();
}

async function spawnWd14Once() {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    const out = fs.openSync(path.join(LOG_DIR, 'wd14.log'), 'a');
    wdProc = spawn(PYTHON, [WD_SCRIPT], { cwd: BASE, stdio: ['ignore', out, out], windowsHide: true, detached: false });
    log('started WD14 pid=' + wdProc.pid);
    wdProc.on('exit', code => { log('WD14 exited code=' + code); wdProc = null; });
    const ready = await waitForPort(WD_PORT, 45000);
    return { ok: ready, running: ready, msg: ready ? 'WD14 已就绪' : 'WD14 启动超时', port: WD_PORT, pid: wdProc?.pid };
  } catch (e) {
    return { ok: false, running: false, msg: e.message };
  }
}

async function ensureWd14(wait = false) {
  if (await checkPort(WD_PORT)) return { ok: true, running: true, msg: 'WD14 已运行', port: WD_PORT };
  if (!fs.existsSync(PYTHON)) return { ok: false, running: false, msg: '找不到 Python: ' + PYTHON };
  if (!fs.existsSync(WD_SCRIPT)) return { ok: false, running: false, msg: '找不到 wd14_server.py' };
  if (!wdStartPromise) {
    wdStartPromise = spawnWd14Once().finally(() => { wdStartPromise = null; });
  }
  if (wait) return await wdStartPromise;
  return { ok: true, running: false, msg: 'WD14 正在启动', port: WD_PORT, pid: wdProc?.pid };
}

async function startComfy() {
  if (await checkPort(COMFY_PORT)) return { ok: true, running: true, msg: 'ComfyUI 已经在运行', port: COMFY_PORT };
  if (!fs.existsSync(PYTHON)) return { ok: false, msg: '找不到 Python: ' + PYTHON };
  if (!fs.existsSync(path.join(COMFY_DIR, 'main.py'))) return { ok: false, msg: '找不到 ComfyUI main.py' };
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    const out = fs.openSync(path.join(LOG_DIR, 'comfyui.log'), 'a');
    comfyProc = spawn(PYTHON, ['-s', 'main.py', '--listen', '127.0.0.1', '--port', String(COMFY_PORT)], {
      cwd: COMFY_DIR,
      stdio: ['ignore', out, out],
      windowsHide: true,
      detached: false,
      env: { ...process.env, HF_ENDPOINT: 'https://hf-mirror.com' }
    });
    log('started ComfyUI pid=' + comfyProc.pid);
    comfyProc.on('exit', code => { log('ComfyUI exited code=' + code); comfyProc = null; });
    const ready = await waitForPort(COMFY_PORT, 120000);
    return { ok: ready, running: ready, msg: ready ? 'ComfyUI 启动成功' : 'ComfyUI 启动超时，请查看 logs/comfyui.log', port: COMFY_PORT, pid: comfyProc?.pid };
  } catch (e) {
    return { ok: false, msg: '启动失败: ' + e.message };
  }
}

async function stopComfy() {
  const pids = [...await pidsByPort(COMFY_PORT), ...await comfyPids()];
  if (comfyProc && comfyProc.pid) pids.push(comfyProc.pid);
  const count = await killPids(pids);
  comfyProc = null;
  return { ok: true, msg: count ? `已停止 ${count} 个 ComfyUI 进程` : 'ComfyUI 未运行', stopped: count };
}

async function stopWd14() {
  const pids = [...await pidsByPort(WD_PORT), ...await wd14Pids()];
  if (wdProc && wdProc.pid) pids.push(wdProc.pid);
  const count = await killPids(pids);
  wdProc = null;
  wdStartPromise = null;
  return { ok: true, msg: count ? `已停止 ${count} 个 WD14 进程` : 'WD14 未运行', stopped: count };
}

function safeStaticPath(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  let file = clean === '/' ? path.join(BASE, 'index.html') : path.join(BASE, clean.replace(/^\//, ''));
  if (!fs.existsSync(file)) file = path.join(ROOT, clean.replace(/^\//, ''));
  const norm = path.normalize(file);
  const allowed = [path.normalize(BASE), path.normalize(ROOT)];
  if (!allowed.some(prefix => norm === prefix || norm.startsWith(prefix + path.sep))) return null;
  return norm;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url, 'http://127.0.0.1:' + PORT);
  try {
    if (url.pathname === '/favicon.ico') {
      res.writeHead(204, { 'Cache-Control': 'max-age=86400' });
      res.end();
      return;
    }
    if (url.pathname === '/api/health') {
      sendJson(res, 200, { ok: true, wd14: await checkPort(WD_PORT), comfy: await checkPort(COMFY_PORT), port: PORT });
      return;
    }
    if (url.pathname === '/api/tagger/status') {
      const running = await checkPort(WD_PORT);
      if (!running && url.searchParams.get('start') === '1') await ensureWd14(false);
      if (await checkPort(WD_PORT)) await proxyJson('http://127.0.0.1:' + WD_PORT + '/', res);
      else sendJson(res, 200, { ok: false, ready: false, status: 'offline', msg: 'WD14 后台未运行' });
      return;
    }
    if (url.pathname === '/api/tagger/start') { sendJson(res, 200, await ensureWd14(true)); return; }
    if (url.pathname === '/api/tagger/stop') { sendJson(res, 200, await stopWd14()); return; }
    if (url.pathname === '/api/tag' && req.method === 'POST') {
      const ready = await ensureWd14(true);
      if (!ready.ok) { sendJson(res, 503, ready); return; }
      const body = await readBody(req);
      await proxyJson('http://127.0.0.1:' + WD_PORT + '/', res, {
        method: 'POST',
        body,
        headers: {
          'Content-Type': req.headers['content-type'] || 'application/octet-stream',
          'Content-Length': body.length,
          'X-Threshold': req.headers['x-threshold'] || '0.35'
        }
      });
      return;
    }
    if (url.pathname === '/api/comfy/status') {
      sendJson(res, 200, { ok: true, running: await checkPort(COMFY_PORT), port: COMFY_PORT });
      return;
    }
    if (url.pathname === '/api/comfy/start') { sendJson(res, 200, await startComfy()); return; }
    if (url.pathname === '/api/comfy/stop') { sendJson(res, 200, await stopComfy()); return; }

    const file = safeStaticPath(req.url);
    if (!file || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    sendJson(res, 500, { ok: false, error: e.message, stack: String(e.stack || '').split('\n').slice(0, 3).join('\n') });
  }
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error('端口 18435 已被占用。请先运行 stop-wd-tagger.cmd，或关闭旧的 WD Tagger 后台。');
  } else console.error(err);
  process.exit(1);
});

server.listen(PORT, '127.0.0.1', async () => {
  const url = `http://127.0.0.1:${PORT}`;
  log('WD Tagger ready: ' + url);
  ensureWd14(false).then(r => log('WD14 startup check: ' + JSON.stringify(r)));
  if (!process.argv.includes('--no-open')) execFile('cmd.exe', ['/c', 'start', '', url], { windowsHide: true });
});

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
