#!/usr/bin/env node
/**
 * 零依赖本地预览服务，用于发布前检查静态站点。
 * 用法：node scripts/dev-server.mjs [port]
 */

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.argv[2] ?? 18446);

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
};

/** 把请求路径解析为仓库内的真实文件，越界一律拒绝。 */
function resolveTarget(requestUrl) {
  const urlPath = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname);
  const target = path.resolve(root, `.${urlPath}`);
  const relative = path.relative(root, target);

  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  if (existsSync(target) && statSync(target).isDirectory()) return path.join(target, 'index.html');
  return target;
}

createServer((request, response) => {
  const target = resolveTarget(request.url);

  if (!target || !existsSync(target)) {
    const notFound = path.join(root, '404.html');
    response.writeHead(404, { 'content-type': MIME['.html'] });
    if (existsSync(notFound)) createReadStream(notFound).pipe(response);
    else response.end('404');
    return;
  }

  response.writeHead(200, {
    'cache-control': 'no-store',
    'content-type': MIME[path.extname(target).toLowerCase()] ?? 'application/octet-stream',
  });
  createReadStream(target).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`星穹枢庭 preview → http://127.0.0.1:${port}/`);
});
