/* =========================================================================
 * forge.mjs ——「一句话 → 完整游戏」编排器
 * plan(brief) → buildContent(theme) → 写工程 → 构建 → 自检 → 回执
 * ========================================================================= */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { parseBrief, explainPlan } from './brief.mjs';
import { loadGenreBuilders, GENRE_META } from './genres.mjs';
import { writeProject, renderHtml, renderCss } from './build.mjs';

export function planGame(brief, opts = {}) {
  const plan = parseBrief(brief, opts);
  plan.reason = explainPlan(plan);
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

export async function forge({ brief, dir, genre, theme, levels, title, seed, check = true, overwrite = false, browser = true }) {
  if (!brief || !String(brief).trim()) throw new Error('缺少 brief（一句话玩法描述）');
  if (!dir) throw new Error('缺少 dir（生成目录，建议绝对路径）');
  const target = path.resolve(dir);
  if (fs.existsSync(target) && fs.readdirSync(target).length > 0) {
    if (!overwrite) throw new Error(`目录已存在且非空：${target}（如确认覆盖请传 overwrite=true）`);
  }
  fs.mkdirSync(target, { recursive: true });

  const plan = planGame(brief, { genre, theme, levels, title, seed });
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

  const written = writeProject({ dir: target, content, plan, ruleId: plan.genre });
  const files = [];
  const walk = (d) => {
    for (const f of fs.readdirSync(d)) {
      if (f === 'node_modules' || f === 'dist' || f === 'shots') continue;
      const abs = path.join(d, f);
      if (fs.statSync(abs).isDirectory()) walk(abs);
      else files.push(path.relative(target, abs));
    }
  };
  walk(target);

  const result = {
    ok: true, dir: target, title: content.title, genre: plan.genre, genreName: plan.meta.name,
    theme: plan.theme.id, themeName: plan.theme.name, levels: content.levels.length,
    orientation: content.orientation, seed: plan.seed, files: files.length,
    plan: plan.reason, checks: null, warnings: [], error: null,
  };

  // 构建单文件
  const build = await run(target, 'tools/build-single.mjs');
  if (build.code !== 0) {
    result.ok = false;
    result.error = '单文件构建失败：' + (build.err || build.out).slice(-600);
    return result;
  }
  result.singleFile = (build.out.match(/dist\/(.+\.html)/) || [])[1] || null;
  result.singleFileKB = parseFloat((build.out.match(/（([\d.]+) KB/) || [])[1] || '0');

  // 自检（数据 + 仿真 + 单文件 + 浏览器）
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

export async function rebuild(dir) {
  const target = path.resolve(dir);
  const build = await run(target, 'tools/build-single.mjs');
  return { ok: build.code === 0, out: (build.out + build.err).trim().slice(-1200) };
}

export async function checkProject(dir, { browser = true } = {}) {
  const target = path.resolve(dir);
  const reportPath = path.join(target, 'check-report.json');
  const args = ['--json', reportPath];
  if (!browser) args.push('--no-browser');
  const chk = await run(target, 'tools/check.mjs', args, 600000);
  let report = null;
  try { report = JSON.parse(fs.readFileSync(reportPath, 'utf8')); } catch (e) { /* ignore */ }
  return { ok: chk.code === 0 && report && report.ok, report, raw: (chk.out + chk.err).trim().slice(-1500) };
}

export function listGenres() {
  return Object.values(GENRE_META).map((g) => ({
    id: g.id, name: g.name, orientation: g.orientation, defaultLevels: g.defaultLevels,
    summary: g.summary, keywords: g.tags,
  }));
}

/* 供 CLI 与插件共享的 HTML/CSS 预览（未落盘时用于快速检查） */
export function previewHtml(content) {
  return { html: renderHtml(content.theme, content.title, content.subtitle), css: renderCss(content.theme) };
}
