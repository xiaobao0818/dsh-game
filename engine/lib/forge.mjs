/* =========================================================================
 * forge.mjs ——「一句话 → 完整游戏」编排器（HTML5 Canvas 或 Cocos Creator 3.8）
 * plan(brief) → buildContent(theme) → 写工程 → 构建 → 自检 → 回执
 * ========================================================================= */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { parseBrief, explainPlan } from './brief.mjs';
import { loadGenreBuilders, GENRE_META } from './genres.mjs';
import { writeProject, renderHtml, renderCss } from './build.mjs';
import { writeCocosProject } from './cocos-build.mjs';
import { checkCocos, buildCocos } from './cocos-check.mjs';

export const ENGINES = ['html', 'cocos'];

export function planGame(brief, opts = {}) {
  const plan = parseBrief(brief, opts);
  plan.reason = explainPlan(plan);
  // 引擎选择：显式参数 > 描述里的 cocos 关键词 > 默认 html
  const mentioned = /cocos|Cocos|COCOS|creator\s*3/i.test(String(brief || ''));
  plan.engine = ENGINES.includes(opts.engine) ? opts.engine : (mentioned ? 'cocos' : 'html');
  plan.reason.engine = plan.engine;
  return plan;
}

function run(cwd, script, args = [], timeout = 240000) {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [path.join(cwd, script), ...args], { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    const t = setTimeout(() => { try { p.kill('SIGKILL'); } catch (e) {} resolve({ code: -1, out, err: err + '\n(timeout)' }); }, timeout);
    p.on('close', (code) => { clearTimeout(t); resolve({ code, out, err }); });
  });
}

export async function forge({ brief, dir, genre, theme, levels, title, seed, engine, check = true, overwrite = false, browser = true }) {
  if (!brief || !String(brief).trim()) throw new Error('缺少 brief（一句话玩法描述）');
  if (!dir) throw new Error('缺少 dir（生成目录，建议绝对路径）');
  const target = path.resolve(dir);
  if (fs.existsSync(target) && fs.readdirSync(target).length > 0) {
    if (!overwrite) throw new Error(`目录已存在且非空：${target}（如确认覆盖请传 overwrite=true）`);
  }
  fs.mkdirSync(target, { recursive: true });

  const plan = planGame(brief, { genre, theme, levels, title, seed, engine });
  const builders = await loadGenreBuilders();
  const builder = builders[plan.genre];
  if (!builder || typeof builder.buildContent !== 'function') {
    throw new Error(`玩法基因「${plan.genre}」的内容生成器尚未安装；可用基因：${Object.keys(builders).filter((k) => builders[k]).join(', ') || 'horde'}`);
  }

  const content = builder.buildContent({
    theme: plan.theme,
    title: plan.title,
    subtitle: plan.subtitle,
    tagline: plan.tagline,
    levelCount: plan.levelCount,
    seed: plan.seed,
    brief: plan.brief,
  });
  content.title = content.title || plan.title;
  content.theme = content.theme || plan.theme;

  const result = {
    ok: true, engine: plan.engine, dir: target, title: content.title, genre: plan.genre, genreName: plan.meta.name,
    theme: plan.theme.id, themeName: plan.theme.name, levels: content.levels.length,
    orientation: content.orientation, seed: plan.seed, plan: plan.reason, checks: null, warnings: [], error: null,
  };

  if (plan.engine === 'cocos') {
    const built = writeCocosProject({ dir: target, content, plan, ruleId: plan.genre });
    result.engine = 'cocos';
    result.creator = '3.8.8';
    result.designResolution = { width: built.W, height: built.H };
    result.webBuild = 'build/web-mobile/index.html';
    result.files = countFiles(target);
    if (check) {
      const report = await checkCocos(target, { build: true, browser, level: Math.min(3, content.levels.length) });
      result.checks = report;
      if (!report.ok) { result.ok = false; result.warnings.push('Cocos 自检未全绿，详见 check-report.json / cocos-smoke.json'); }
      else fs.writeFileSync(path.join(target, 'cocos-check.json'), JSON.stringify(report, null, 2));
    } else {
      // 至少把工程构建一次，保证交付物可运行
      const build = await buildCocos(target);
      result.build = build;
      if (!build.ok) { result.ok = false; result.error = 'Cocos 构建失败：' + build.log; }
    }
    return result;
  }

  const written = writeProject({ dir: target, content, plan, ruleId: plan.genre });
  result.files = countFiles(target);
  result.singleFile = null;

  const build = await run(target, 'tools/build-single.mjs');
  if (build.code !== 0) {
    result.ok = false;
    result.error = '单文件构建失败：' + (build.err || build.out).slice(-600);
    return result;
  }
  result.singleFile = (build.out.match(/dist\/(.+\.html)/) || [])[1] || null;
  result.singleFileKB = parseFloat((build.out.match(/（([\d.]+) KB/) || [])[1] || '0');

  if (check) {
    const reportPath = path.join(target, 'check-report.json');
    const args = ['--json', reportPath];
    if (!browser) args.push('--no-browser');
    const chk = await run(target, 'tools/check.mjs', args, 600000);
    try { result.checks = JSON.parse(fs.readFileSync(reportPath, 'utf8')); } catch (e) { result.checks = { ok: chk.code === 0, raw: (chk.out + chk.err).slice(-1500) }; }
    if (chk.code !== 0) { result.ok = false; result.warnings.push('自检未全绿，详见 check-report.json'); }
  }
  return result;
}

function countFiles(root) {
  let n = 0;
  const walk = (d) => {
    for (const f of fs.readdirSync(d)) {
      if (['node_modules', 'library', 'temp', 'build', 'local', 'profiles', 'dist', 'shots'].includes(f)) continue;
      const abs = path.join(d, f);
      if (fs.statSync(abs).isDirectory()) walk(abs);
      else n++;
    }
  };
  walk(root);
  return n;
}

function projectEngine(dir) {
  try { const g = JSON.parse(fs.readFileSync(path.join(dir, 'game.json'), 'utf8')); return g.engine || 'html'; } catch (e) { return 'html'; }
}

export async function rebuild(dir) {
  const target = path.resolve(dir);
  if (projectEngine(target) === 'cocos') {
    const b = await buildCocos(target);
    return { ok: b.ok, engine: 'cocos', out: (b.ok ? 'Cocos 构建成功：build/web-mobile/index.html（' + Math.round(b.ms / 1000) + 's）' : b.log) };
  }
  const build = await run(target, 'tools/build-single.mjs');
  return { ok: build.code === 0, engine: 'html', out: (build.out + build.err).trim().slice(-1200) };
}

export async function checkProject(dir, { browser = true } = {}) {
  const target = path.resolve(dir);
  const engine = projectEngine(target);
  if (engine === 'cocos') {
    const report = await checkCocos(target, { build: true, browser });
    fs.writeFileSync(path.join(target, 'cocos-check.json'), JSON.stringify(report, null, 2));
    return { ok: report.ok, engine, report };
  }
  const reportPath = path.join(target, 'check-report.json');
  const args = ['--json', reportPath];
  if (!browser) args.push('--no-browser');
  const chk = await run(target, 'tools/check.mjs', args, 600000);
  let report = null;
  try { report = JSON.parse(fs.readFileSync(reportPath, 'utf8')); } catch (e) { /* ignore */ }
  return { ok: chk.code === 0 && report && report.ok, engine, report, raw: (chk.out + chk.err).trim().slice(-1500) };
}

export function listGenres() {
  return Object.values(GENRE_META).map((g) => ({
    id: g.id, name: g.name, orientation: g.orientation, defaultLevels: g.defaultLevels,
    summary: g.summary, keywords: g.tags,
  }));
}

/** 未落盘时的 HTML/CSS 预览（快速检查） */
export function previewHtml(content) {
  return { html: renderHtml(content.theme, content.title, content.subtitle), css: renderCss(content.theme) };
}
