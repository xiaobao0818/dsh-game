#!/usr/bin/env node
/* =========================================================================
 * 浏览器冒烟测试：静态服务 + 无头 Chrome/CDP
 *   node tools/headless.mjs [--shot out.png] [--level 3] [--w 1280 --h 720]
 *                           [--eval "表达式"] [--click "x,y;x,y"] [--wait 900]
 * 断言：无 Runtime.exceptionThrown / console.error / Log error；并把诊断输出成 JSON
 * ========================================================================= */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const has = (k) => argv.includes('--' + k);
const PORT = parseInt(arg('port', '8801'), 10);
const DEBUG = parseInt(arg('debug', '9401'), 10);
const W = parseInt(arg('w', '1280'), 10);
const H = parseInt(arg('h', '720'), 10);
const WAIT = parseInt(arg('wait', '900'), 10);
const SHOT = arg('shot', '');
const EVAL = arg('eval', '');
const AFTER = parseInt(arg('afterwait', '400'), 10);
const LEVEL = arg('level', '');
const CLICKS = arg('click', '');
const PAGE = arg('path', 'index.html');
const CHROME = process.env.CHROME || [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].find((p) => fs.existsSync(p));
if (!CHROME) { console.error('未找到 Chrome/Chromium；可设置 CHROME 环境变量'); process.exit(2); }

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('404'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => srv.listen(PORT, '127.0.0.1', r));

const userData = fs.mkdtempSync('/tmp/gs-chrome-');
const proc = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${DEBUG}`, `--user-data-dir=${userData}`,
  `--window-size=${W},${H}`, '--hide-scrollbars', '--disable-gpu', '--no-first-run',
  '--no-default-browser-check', '--mute-audio', '--autoplay-policy=no-user-gesture-required',
  'about:blank',
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let code = 0;
const errors = [];
try {
  let target;
  for (let i = 0; i < 80; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${DEBUG}/json/list`)).json();
      target = list.find((t) => t.type === 'page');
      if (target) break;
    } catch (e) { /* retry */ }
    await sleep(180);
  }
  if (!target) throw new Error('CDP target 未就绪');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const cbs = new Map();
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && cbs.has(d.id)) { cbs.get(d.id)(d); cbs.delete(d.id); }
    else if (d.method === 'Runtime.exceptionThrown') {
      const ex = d.params.exceptionDetails;
      errors.push('EXC ' + (ex.exception?.description || ex.text) + (ex.url ? ' @' + ex.url + ':' + ex.lineNumber : ''));
    } else if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') {
      errors.push('console.error ' + d.params.args.map((a) => a.value ?? a.description ?? a.type).join(' '));
    } else if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error') {
      errors.push('log ' + d.params.entry.text);
    }
  };
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; cbs.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/${encodeURI(PAGE)}` });
  await sleep(WAIT);

  // 调试 API 就绪
  const ready = await send('Runtime.evaluate', { expression: '!!window.__game && !!window.__game.startLevel', returnByValue: true });
  if (!ready.result?.result?.value) errors.push('window.__game 未就绪');
  // 进入关卡
  const boot = `(()=>{const g=window.__game; if(!g) return 'no game'; g.begin&&g.begin(); const b=document.getElementById('boot'); if(b) b.remove();`;
  if (LEVEL) {
    await send('Runtime.evaluate', { expression: boot + `g.startLevel(${parseInt(LEVEL, 10)}); return 'ok'; })()`, awaitPromise: true, returnByValue: true });
    await sleep(650);
  }
  if (CLICKS) {
    const pts = CLICKS.split(';').map((s) => s.split(',').map((n) => parseFloat(n)));
    for (const [x, y] of pts) {
      await send('Runtime.evaluate', { expression: `window.__game.onDown(${x}, ${y}); window.__game.onUp(${x}, ${y});`, returnByValue: true });
      await sleep(180);
    }
  }
  if (EVAL) {
    const r = await send('Runtime.evaluate', { expression: EVAL, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) errors.push('EVAL ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text));
    else if (r.result?.result?.value !== undefined) console.log('EVAL:', JSON.stringify(r.result.result.value));
  }
  await sleep(AFTER);
  const diag = await send('Runtime.evaluate', {
    expression: `(()=>{const g=window.__game; if(!g) return {ok:false}; return {ok:true, scene:g.scene, level:g.levelId, status:g.rule&&g.rule.status, fps:Math.round(g.fps||0), W:g.W, H:g.H, rule:g.rule&&g.rule.debug?g.rule.debug():null, save:g.save?{unlocked:g.save.data.unlocked,stars:Object.keys(g.save.data.stars).length}:null};})()`,
    returnByValue: true,
  });
  const info = diag.result?.result?.value;
  console.log('DIAG:', JSON.stringify(info));
  if (SHOT) {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(SHOT, Buffer.from(shot.result.data, 'base64'));
    console.log('SHOT:', SHOT);
  }
  if (info && info.fps && info.fps < 30) errors.push('FPS 过低：' + info.fps);
  if (errors.length) { code = 1; console.log('\n=== ERRORS ==='); for (const e of [...new Set(errors)].slice(0, 20)) console.log(' ✗', String(e).slice(0, 500)); }
  else console.log('\n✅ 浏览器冒烟通过（无运行时错误）');
} catch (e) {
  console.error('HEADLESS FAILED:', e.message);
  code = 2;
} finally {
  try { proc.kill('SIGKILL'); } catch (e) {}
  try { srv.close(); } catch (e) {}
  try { fs.rmSync(userData, { recursive: true, force: true }); } catch (e) {}
}
process.exit(code);
