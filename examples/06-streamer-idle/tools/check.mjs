#!/usr/bin/env node
/* =========================================================================
 * 交付自检：数据校验 → 无头仿真 → 单文件构建 → 离线约束 → （可选）浏览器冒烟
 *   node tools/check.mjs              # 全部（浏览器如果找得到 Chrome）
 *   node tools/check.mjs --no-browser
 *   node tools/check.mjs --json out.json
 * 退出码：0 = 全绿；1 = 有问题
 * ========================================================================= */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CONTENT } from '../js/content.js';
import { createRule } from '../js/rules/idle.js';
import { RNG, silentAudio, silentFx } from '../js/core.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const has = (k) => argv.includes('--' + k);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const STEP = 1 / 60;
const report = { ok: true, checks: [], failures: [], warnings: [], stats: {} };

function fail(name, msg) { report.ok = false; report.failures.push({ name, msg }); }
function warn(name, msg) { report.warnings.push({ name, msg }); }
function pass(name, info) { report.checks.push({ name, ok: true, info }); }

/* ------------------------------ 1. 数据 ------------------------------ */
function checkData() {
  const L = CONTENT.levels || [];
  const required = ['slug', 'genre', 'title', 'orientation', 'theme', 'levels'];
  for (const k of required) if (!CONTENT[k]) fail('data', `缺少字段 content.${k}`);
  if (!L.length) { fail('data', '没有关卡'); return; }
  const ids = new Set();
  for (const lv of L) {
    if (!lv || !Number.isInteger(lv.id)) { fail('data', '关卡缺少整数 id'); continue; }
    if (ids.has(lv.id)) fail('data', `关卡 id 重复：${lv.id}`);
    ids.add(lv.id);
  }
  const sorted = [...ids].sort((a, b) => a - b);
  if (sorted[0] !== 1) fail('data', '关卡 id 必须从 1 开始');
  for (let i = 1; i < sorted.length; i++) if (sorted[i] !== sorted[i - 1] + 1) { fail('data', `关卡 id 不连续：${sorted[i - 1]} → ${sorted[i]}`); break; }
  if (sorted.length < 6) fail('data', `关卡太少：${sorted.length}`);
  if (CONTENT.chapters && CONTENT.chapters.length) {
    const covered = new Set(CONTENT.chapters.flatMap((c) => c.levels || []));
    for (const id of ids) if (!covered.has(id)) fail('data', `关卡 ${id} 未归入任何章节`);
  }
  const defs = CONTENT.defs || {};
  if (!Object.keys(defs).length) warn('data', 'content.defs 为空（若玩法不需要可忽略）');
  // 数值有限性
  const seen = JSON.stringify(L);
  if (/NaN|Infinity/.test(seen)) fail('data', '关卡数据里出现 NaN/Infinity');
  pass('data', { levels: L.length, chapters: (CONTENT.chapters || []).length, defs: Object.keys(defs).length });
}

/* ------------------------------ 2. 无头仿真 ------------------------------ */
function runLevel(level, player = true, maxSeconds = 600) {
  let result = null;
  const Wide = CONTENT.orientation === 'portrait' ? 720 : 1280;
  const High = CONTENT.orientation === 'portrait' ? 1280 : 720;
  const svc = {
    content: CONTENT, level, levelId: level.id, W: Wide, H: High,
    rng: new RNG('check:' + level.id), save: { settings: {}, data: {} },
    audio: silentAudio, fx: silentFx, art: null,
    finish: (p) => { if (!result) result = p; }, toast: () => {},
  };
  const rule = createRule(svc);
  rule.init();
  let frames = 0;
  const cap = Math.round(maxSeconds * 60);
  while (rule.status === 'playing' && frames < cap) {
    if (player && rule.bot) rule.bot(STEP);
    rule.update(STEP);
    frames++;
    if (!Number.isFinite(frames)) break;
  }
  const dbg = rule.debug ? rule.debug() : {};
  const dbgStr = JSON.stringify(dbg || {});
  if (/NaN|null,"/.test(dbgStr) && /NaN/.test(dbgStr)) fail('sim-nan', `第 ${level.id} 关状态出现 NaN`);
  return { id: level.id, status: rule.status, seconds: +(frames / 60).toFixed(1), result, debug: dbg };
}
function checkSim() {
  const levels = CONTENT.levels;
  const rows = [];
  let wins = 0, maxSec = 0, minSec = 1e9, simFail = 0;
  for (const lv of levels) {
    const r = runLevel(lv, true, 600);
    rows.push(r);
    if (r.status === 'won') wins++; else { simFail++; fail('sim', `第 ${r.id} 关机器人未能通关（${r.status}，${r.seconds}s）`); }
    maxSec = Math.max(maxSec, r.seconds); minSec = Math.min(minSec, r.seconds);
  }
  // 摆烂测试：不操作时应大概率失败（允许极少数教学关）
  let idleWins = 0;
  for (const lv of levels) {
    const r = runLevel(lv, false, 120);
    if (r.status === 'won') idleWins++;
  }
  const idleRatio = idleWins / levels.length;
  if (idleRatio > 0.25) warn('sim-idle', `不操作也能通关 ${idleWins}/${levels.length} 关，难度可能偏低`);
  report.stats.sim = { wins, total: levels.length, minSec, maxSec, idleWins };
  if (wins !== levels.length) fail('sim', `机器人通关 ${wins}/${levels.length}`);
  if (maxSec > 420) warn('sim-time', `最长单关 ${maxSec}s，节奏偏慢`);
  pass('sim', report.stats.sim);
}

/* ------------------------------ 3. 构建 + 离线 ------------------------------ */
function runNode(script, args = [], timeout = 180000) {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [path.join(ROOT, script), ...args], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    const t = setTimeout(() => { try { p.kill('SIGKILL'); } catch (e) {} resolve({ code: -1, out, err: err + '\n(timeout)' }); }, timeout);
    p.on('close', (code) => { clearTimeout(t); resolve({ code, out, err }); });
  });
}
async function checkBuild() {
  const r = await runNode('tools/build-single.mjs');
  if (r.code !== 0) { fail('build', (r.err || r.out).slice(0, 800)); return; }
  const dist = path.join(ROOT, 'dist');
  const files = fs.existsSync(dist) ? fs.readdirSync(dist).filter((f) => f.endsWith('.html')) : [];
  if (!files.length) { fail('build', 'dist/ 没有 html'); return; }
  let best = null, bestSize = 0;
  for (const f of files) { const s = fs.statSync(path.join(dist, f)).size; if (s > bestSize) { best = f; bestSize = s; } }
  const html = fs.readFileSync(path.join(dist, best), 'utf8');
  const external = [];
  for (const m of html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g)) {
    const u = m[1];
    if (/^(data:|#|javascript:)/.test(u)) continue;
    external.push(u);
  }
  if (external.length) fail('singlefile', '单文件仍有外部引用：' + external.slice(0, 5).join(', '));
  if (bestSize > 900 * 1024) warn('singlefile-size', `单文件 ${(bestSize / 1024).toFixed(0)}KB，偏大`);
  if (!/<script>/.test(html)) fail('singlefile', '没有内联脚本');
  report.stats.singlefile = { file: best, kb: +(bestSize / 1024).toFixed(1), external: external.length };
  pass('singlefile', report.stats.singlefile);
}

/* ------------------------------ 4. 浏览器冒烟 ------------------------------ */
async function checkBrowser() {
  const shotDir = path.join(ROOT, 'shots');
  fs.mkdirSync(shotDir, { recursive: true });
  const level = (CONTENT.levels[2] || CONTENT.levels[0]).id;
  const w = CONTENT.orientation === 'portrait' ? 390 : 844;
  const h = CONTENT.orientation === 'portrait' ? 844 : 390;
  const run = await runNode('tools/headless.mjs', ['--port', String(8861), '--debug', String(9461), '--level', String(level), '--w', String(w), '--h', String(h), '--afterwait', '2200', '--shot', path.join(shotDir, 'play.png')], 120000);
  if (run.code !== 0) { fail('browser', (run.err || run.out).slice(-800)); return; }
  const diagLine = (run.out + run.err).split('\n').find((l) => l.startsWith('DIAG:'));
  if (diagLine) {
    try { report.stats.browser = JSON.parse(diagLine.slice(5)); } catch (e) { /* ignore */ }
  }
  pass('browser', report.stats.browser || { ok: true });
  // 进入结算页（快进机器人）
  const win = await runNode('tools/headless.mjs', ['--port', '8862', '--debug', '9462', '--level', String(level), '--eval', "(()=>{const g=window.__game;return g.fastForward(400);})()", '--afterwait', '2200', '--shot', path.join(shotDir, 'result.png')], 120000);
  if (win.code === 0) pass('browser-result', { ok: true });
  else warn('browser-result', (win.err || win.out).slice(-500));
}

/* ------------------------------ 主流程 ------------------------------ */
console.log('游戏工坊 · 交付自检');
console.log('1) 数据校验…'); checkData();
console.log('2) 无头仿真…'); checkSim();
console.log('3) 单文件构建…'); await checkBuild();
if (!has('no-browser')) {
  console.log('4) 浏览器冒烟…');
  try { await checkBrowser(); } catch (e) { warn('browser', String(e && e.message || e)); }
}
const json = JSON.stringify(report, null, 2);
const outPath = arg('json', '');
if (outPath) fs.writeFileSync(path.resolve(outPath), json, 'utf8');
console.log('\n==== 自检结果 ====');
console.log(json.length > 4000 && !outPath ? json.slice(0, 4000) + '\n…（完整结果可用 --json 保存）' : json);
console.log(report.ok ? '\n✅ 全部通过' : '\n❌ 有 ' + report.failures.length + ' 项未通过');
process.exit(report.ok ? 0 : 1);
