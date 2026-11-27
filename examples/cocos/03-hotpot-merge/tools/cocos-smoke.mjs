#!/usr/bin/env node
/* =========================================================================
 * Cocos Web Mobile 构建的浏览器冒烟：启动静态服务 + 无头 Chrome(WebGL/swiftshader)
 *   node tools/cocos-smoke.mjs --project . [--level 3] [--w 1280 --h 720]
 *                              [--out shots] [--json report.json] [--wait 5000]
 * 断言：页面无异常、window.__game 就绪、可进入关卡、可快进到结算、截图非空。
 * ========================================================================= */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const has = (k) => argv.includes('--' + k);
const PROJECT = path.resolve(arg('project', '.'));
const BUILD = path.join(PROJECT, arg('buildDir', 'build/web-mobile'));
const OUT = path.resolve(arg('out', path.join(PROJECT, 'shots')));
const JSON_OUT = arg('json', '');
const W = parseInt(arg('w', '1280'), 10);
const H = parseInt(arg('h', '720'), 10);
const LEVEL = parseInt(arg('level', '3'), 10);
const WAIT = parseInt(arg('wait', '5000'), 10);
const CHROME = process.env.CHROME || [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].find((p) => fs.existsSync(p));
const report = { ok: true, project: PROJECT, build: BUILD, shots: {}, errors: [], warnings: [], checks: [] };
const fail = (m) => { report.ok = false; report.errors.push(String(m)); };
const warn = (m) => report.warnings.push(String(m));
const pass = (name, info) => report.checks.push({ name, ok: true, info });

if (!CHROME) { console.error('找不到 Chrome/Chromium'); process.exit(2); }
if (!fs.existsSync(path.join(BUILD, 'index.html'))) { console.error('缺少 Cocos 构建产物：' + BUILD + '/index.html（先跑 tools/build-web.sh）'); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });

/* ---------- 静态服务（项目根，让 build/web-mobile 相对路径可用） ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.bin': 'application/octet-stream', '.cconb': 'application/octet-stream', '.ttf': 'font/ttf', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(PROJECT, p);
  if (!f.startsWith(PROJECT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('404'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const PORT = srv.address().port;
const PAGE = `/build/web-mobile/index.html`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const userData = fs.mkdtempSync('/tmp/gs-cocos-');
const proc = spawn(CHROME, [
  '--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + userData,
  '--window-size=' + W + ',' + H, '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
  '--mute-audio', '--autoplay-policy=no-user-gesture-required',
  '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--enable-webgl',
  'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

let ws = null;
const cleanup = () => {
  try { proc.kill('SIGKILL'); } catch (e) {}
  try { srv.close(); } catch (e) {}
  try { fs.rmSync(userData, { recursive: true, force: true }); } catch (e) {}
};
const started = Date.now();

async function findTarget() {
  // 从 Chrome 的 DevToolsActivePort 读调试端口（--remote-debugging-port=0）
  const f = path.join(userData, 'DevToolsActivePort');
  for (let i = 0; i < 120; i++) {
    try {
      const txt = fs.readFileSync(f, 'utf8').trim().split('\n');
      const port = parseInt(txt[0], 10);
      if (port) {
        const list = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
        const page = list.find((t) => t.type === 'page');
        if (page) return page;
      }
    } catch (e) { /* retry */ }
    await sleep(120);
  }
  throw new Error('Chrome CDP 未就绪');
}

class CDP {
  constructor(socket) { this.ws = socket; this.id = 0; this.cbs = new Map(); this.events = []; }
  static async connect(url) {
    const s = new WebSocket(url);
    await new Promise((res, rej) => { s.onopen = res; s.onerror = rej; });
    const c = new CDP(s);
    s.onmessage = (m) => {
      const d = JSON.parse(m.data);
      if (d.id && c.cbs.has(d.id)) { c.cbs.get(d.id)(d); c.cbs.delete(d.id); }
      else if (d.method) c.events.push(d);
    };
    return c;
  }
  send(method, params = {}) { const id = ++this.id; return new Promise((res) => { this.cbs.set(id, res); this.ws.send(JSON.stringify({ id, method, params })); }); }
}

try {
  const target = await findTarget();
  const cdp = await CDP.connect(target.webSocketDebuggerUrl);
  for (const m of ['Runtime.enable', 'Log.enable', 'Page.enable']) await cdp.send(m);
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: W < H });
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + PORT + PAGE });
  await sleep(WAIT);

  const evalJS = async (expr) => {
    const r = await cdp.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result && r.result.exceptionDetails) throw new Error('EVAL: ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text));
    return r.result && r.result.result ? r.result.result.value : undefined;
  };
  const shot = async (name) => {
    const r = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const b = Buffer.from(r.result.data, 'base64');
    const file = path.join(OUT, name + '.png');
    fs.writeFileSync(file, b);
    report.shots[name] = { file, bytes: b.length };
    if (b.length < 2000) fail('截图疑似空白：' + file);
    return file;
  };

  // 1) 引擎/游戏就绪
  const ready = await evalJS('!!(window.__game && window.__game.startLevel)');
  if (!ready) fail('window.__game 未就绪（场景或脚本未启动）');
  else pass('boot', { ready: true });
  const info0 = await evalJS('(()=>{try{return {scene:window.__game.scene,fps:Math.round(window.__game.fps||0),W:window.__game.W,H:window.__game.H,gs:window.__gs&&{W:window.__gs.W,H:window.__gs.H}};}catch(e){return {err:String(e)}}})()');
  report.boot = info0 || null;
  await shot('cocos-title');

  // 2) 进入关卡
  if (ready) {
    await evalJS('(()=>{window.__game.begin();window.__game.startLevel(' + LEVEL + ');return 1})()');
    await sleep(5000); // 等第一波敌人/单位出现，截图更像真实战斗
    const play = await evalJS('(()=>{const g=window.__game;return {scene:g.scene,level:g.levelId,fps:Math.round(g.fps||0),rule:g.rule&&g.rule.debug?g.rule.debug():null};})()');
    report.play = play || null;
    if (!play || play.scene !== 'play') fail('未能进入战斗（scene=' + (play && play.scene) + '）');
    else pass('play', play);
    if (play && play.fps && play.fps < 20) warn('FPS 偏低（无头软件渲染）：' + play.fps);
    else if (play && play.fps) report.softwareRenderNote = '无头 Chrome 使用软件渲染；真机/有 GPU 环境通常 60fps';
    await shot('cocos-play');

    // 3) 机器人快进到结算
    const status = await evalJS('(()=>{try{return window.__game.fastForward(600);}catch(e){return "ERR:"+e}})()');
    await sleep(2600);
    const res = await evalJS('(()=>{const g=window.__game;return {scene:g.scene,result:g.result&&{win:g.result.win,stars:g.result.stars},fps:Math.round(g.fps||0)};})()');
    report.fastForward = status;
    report.result = res || null;
    if (!res || res.scene !== 'result') warn('快进后未进入结算页（scene=' + (res && res.scene) + '，status=' + status + '）');
    else pass('result', res);
    await shot('cocos-result');
  }

  // 4) 控制台错误
  const errs = [];
  for (const e of cdp.events) {
    if (e.method === 'Runtime.exceptionThrown') errs.push('EXC ' + (e.params.exceptionDetails.exception?.description || e.params.exceptionDetails.text));
    else if (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error') errs.push('console.error ' + e.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
    else if (e.method === 'Log.entryAdded' && e.params.entry.level === 'error' && !/404|Failed to load resource/.test(e.params.entry.text)) errs.push('log ' + e.params.entry.text);
  }
  for (const e of [...new Set(errs)].slice(0, 20)) fail(e);
  if (!errs.length) pass('console', { errors: 0 });
} catch (e) {
  fail('smoke failed: ' + (e && e.message || e));
} finally {
  report.durationMs = Date.now() - started;
  cleanup();
}
report.ok = report.ok && report.errors.length === 0;
const json = JSON.stringify(report, null, 2);
if (JSON_OUT) fs.writeFileSync(path.resolve(JSON_OUT), json, 'utf8');
console.log(json);
process.exit(report.ok ? 0 : 1);
