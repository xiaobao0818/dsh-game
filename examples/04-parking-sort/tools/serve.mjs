#!/usr/bin/env node
/* 本地预览服务器：node tools/serve.mjs [port]
 * 安全约束：后缀白名单 / 拒绝点文件 / 目录边界 / 只监听回环 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = parseInt(process.argv[2] || '8080', 10);
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
};
const ALLOWED = new Set(Object.keys(MIME));
function send(res, code, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(body);
}
function resolveTarget(rawUrl) {
  let p;
  try { p = decodeURIComponent(rawUrl.split('?')[0].split('#')[0]); } catch (e) { return { code: 400 }; }
  if (p.includes('\0') || !p.startsWith('/')) return { code: 400 };
  if (p.endsWith('/')) p += 'index.html';
  for (const seg of p.split('/')) if (seg.startsWith('.')) return { code: 404 };
  const ext = path.extname(p).toLowerCase();
  if (!ALLOWED.has(ext)) return { code: 404 };
  const abs = path.resolve(ROOT, '.' + path.posix.normalize(p));
  if (abs !== ROOT && !abs.startsWith(ROOT + path.sep)) return { code: 404 };
  let real;
  try { real = fs.realpathSync(abs); if (!fs.statSync(real).isFile()) return { code: 404 }; } catch (e) { return { code: 404 }; }
  if (real !== ROOT && !real.startsWith(ROOT + path.sep)) return { code: 404 };
  return { code: 200, file: real, ext };
}
http.createServer((req, res) => {
  const r = resolveTarget(req.url || '/');
  if (r.code !== 200) { send(res, r.code, String(r.code)); return; }
  fs.readFile(r.file, (err, buf) => {
    if (err) { send(res, 404, '404'); return; }
    res.writeHead(200, { 'Content-Type': MIME[r.ext] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(buf);
  });
}).listen(PORT, '127.0.0.1', () => console.log(`本地预览  http://127.0.0.1:${PORT}`));
