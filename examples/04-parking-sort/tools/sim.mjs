#!/usr/bin/env node
/* =========================================================================
 * 无头仿真：不打开浏览器，用固定步长 + 机器人策略跑关卡，验证可玩性
 *   node tools/sim.mjs            # 跑全部关卡，输出汇总
 *   node tools/sim.mjs --level 5  # 单关详情
 *   node tools/sim.mjs --json     # 机器可读结果
 * ========================================================================= */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTENT } from '../js/content.js';
import { createRule } from '../js/rules/sort.js';
import { RNG, silentAudio, silentFx } from '../js/core.js';

const STEP = 1 / 60;
export function runLevel(level, opts = {}) {
  let result = null;
  const svc = {
    content: CONTENT, level, levelId: level.id, W: CONTENT.orientation === 'portrait' ? 720 : 1280,
    H: CONTENT.orientation === 'portrait' ? 1280 : 720,
    rng: new RNG('sim:' + level.id), save: { settings: {} },
    audio: silentAudio, fx: silentFx, art: null,
    finish: (p) => { if (!result) result = p; },
    toast: () => {},
  };
  const rule = createRule(svc);
  rule.init();
  const maxSeconds = opts.maxSeconds || 420;
  const player = opts.player !== false;
  let frames = 0;
  while (rule.status === 'playing' && frames < maxSeconds * 60) {
    if (player) rule.bot(STEP);
    rule.update(STEP);
    frames++;
  }
  const dbg = rule.debug ? rule.debug() : {};
  return {
    id: level.id, status: rule.status, seconds: +(dbg.time || frames / 60).toFixed(1),
    kills: dbg.kills || 0, result, debug: dbg,
  };
}
const argv = process.argv.slice(2);
const has = (k) => argv.includes('--' + k);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
export function runAll(opts = {}) {
  return (CONTENT.levels || []).map((lv) => runLevel(lv, opts));
}
const IS_MAIN = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (IS_MAIN) {
  const only = arg('level');
  const levels = only ? CONTENT.levels.filter((l) => String(l.id) === String(only)) : CONTENT.levels;
  const rows = levels.map((lv) => runLevel(lv));
  const wins = rows.filter((r) => r.status === 'won').length;
  const idle = optsIdle(levels);
  if (has('json')) console.log(JSON.stringify({ rows, wins, total: rows.length, idle }, null, 2));
  else {
    console.log(`仿真 ${rows.length} 关：通关 ${wins}/${rows.length}`);
    for (const r of rows) console.log(`  #${String(r.id).padStart(2)} ${r.status.padEnd(6)} ${String(r.seconds).padStart(5)}s  击杀 ${r.kills}`);
    console.log(`\n摆烂测试（不操作）：${idle.wins}/${idle.rows.length} 关意外通关（应当较少）`);
    process.exit(wins === rows.length ? 0 : 1);
  }
}
function optsIdle(levels) {
  const rows = levels.map((lv) => runLevel(lv, { player: false, maxSeconds: 90 }));
  return { rows, wins: rows.filter((r) => r.status === 'won').length };
}
