/* =========================================================================
 * cocos-check.mjs —— Cocos 工程交付自检：CLI 构建 + 无头 Chrome 冒烟
 * ========================================================================= */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ENGINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SMOKE = path.join(ENGINE, 'cocos', 'tools', 'cocos-smoke.mjs');

function run(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { cwd: opts.cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    const timer = setTimeout(() => { try { p.kill('SIGKILL'); } catch (e) {} resolve({ code: -1, out, err: err + '\n(timeout)' }); }, opts.timeout || 300000);
    p.on('error', (e) => { clearTimeout(timer); resolve({ code: -2, out, err: String(e && e.message || e) }); });
    p.on('close', (code) => { clearTimeout(timer); resolve({ code, out, err }); });
  });
}

function readGame(dir) {
  try { return JSON.parse(fs.readFileSync(path.join(dir, 'game.json'), 'utf8')); } catch (e) { return {}; }
}

export async function buildCocos(dir, { timeout = 600000 } = {}) {
  const t0 = Date.now();
  const r = await run('bash', ['tools/build-web.sh'], { cwd: dir, timeout });
  const ok = fs.existsSync(path.join(dir, 'build/web-mobile/index.html'));
  return { ok, code: r.code, ms: Date.now() - t0, log: ((r.out + r.err) || '').slice(-2500) };
}

export async function checkCocos(dir, { build = true, browser = true, level } = {}) {
  const report = { ok: true, engine: 'cocos', checks: [], failures: [], warnings: [], stats: {} };
  const fail = (name, msg) => { report.ok = false; report.failures.push({ name, msg }); };
  const pass = (name, info) => report.checks.push({ name, ok: true, info });
  const warn = (name, msg) => report.warnings.push({ name, msg });
  const game = readGame(dir);

  // 1) 结构
  const need = ['package.json', 'assets/scenes/Main.scene', 'assets/scripts/GameRoot.ts', 'assets/scripts/CanvasSurface.ts', 'assets/scripts/game/content.ts', 'tools/build-web.sh', 'tools/cocos-smoke.mjs'];
  for (const f of need) if (!fs.existsSync(path.join(dir, f))) fail('structure', '缺少 ' + f);
  let pkg = {};
  try { pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')); } catch (e) { fail('structure', 'package.json 无法解析'); }
  if (!pkg.creator || !String(pkg.creator.version || '').match(/^3\.8\./)) warn('creator-version', 'Cocos Creator 版本不是 3.8.x：' + JSON.stringify(pkg.creator));
  if (report.ok) pass('structure', { creator: pkg.creator && pkg.creator.version, engine: 'cocos', levels: game.levels });

  // 2) 构建
  if (build) {
    const b = await buildCocos(dir);
    report.stats.build = { ok: b.ok, ms: b.ms };
    if (!b.ok) { fail('build', 'Cocos 构建失败：' + b.log); return report; }
    pass('build', { ms: b.ms, out: 'build/web-mobile/index.html' });
  } else if (!fs.existsSync(path.join(dir, 'build/web-mobile/index.html'))) {
    fail('build', '没有构建产物，且选择了 --no-build');
    return report;
  }

  // 3) 无头浏览器冒烟
  if (browser) {
    const lv = level || Math.min(3, Math.max(1, game.levels || 3));
    const outDir = path.join(dir, 'shots');
    const smokeReport = path.join(dir, 'cocos-smoke.json');
    const portrait = (game.orientation || 'landscape') === 'portrait';
    const vw = portrait ? 390 : 1280, vh = portrait ? 844 : 720;
    const r = await run(process.execPath, [path.join(dir, 'tools/cocos-smoke.mjs'), '--project', dir, '--level', String(lv), '--w', String(vw), '--h', String(vh), '--out', outDir, '--json', smokeReport], { cwd: dir, timeout: 240000 });
    let smoke = null;
    try { smoke = JSON.parse(fs.readFileSync(smokeReport, 'utf8')); } catch (e) { smoke = null; }
    if (!smoke) { fail('browser', '冒烟没有产出报告（exit ' + r.code + '）：' + ((r.out + r.err) || '').slice(-2000)); return report; }
    report.stats.browser = { boot: smoke.boot, play: smoke.play, result: smoke.result, shots: smoke.shots, durationMs: smoke.durationMs };
    if (!smoke.ok) {
      for (const e of (smoke.errors || []).slice(0, 12)) fail('browser', e);
    } else pass('browser', report.stats.browser);
    if (smoke.warnings && smoke.warnings.length) for (const w of smoke.warnings.slice(0, 6)) warn('browser', w);
  } else {
    warn('browser', '未运行浏览器冒烟（--no-browser）');
  }
  return report;
}
