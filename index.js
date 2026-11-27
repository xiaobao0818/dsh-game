/**
 * dsh-game-studio —— 游戏工坊 Host 插件
 *
 * 设计：插件本体只做「工具面 + 随包 skill」的稳定外壳；真正的生成引擎在
 * engine/ 下，每次调用以独立子进程运行（node engine/forge.mjs ...）。
 * 这样改引擎不需要重启 DSH，也不会把长任务压进 Host 事件循环。
 *
 * 工具：
 *   game_genres  列出内置玩法基因
 *   game_plan    解析一句话描述 → 题材/基因/标题/关卡数（不落盘）
 *   game_forge   一句话 → 完整工程 + 单文件 + 自检（核心工具）
 *   game_build   重新构建单文件
 *   game_check   数据/无头仿真/单文件/浏览器自检
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const name = 'dsh-game-studio';
export const inject = ['tools'];

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ENGINE = process.env.DSH_GAME_STUDIO_ENGINE || path.join(HERE, 'engine');
const CLI = path.join(ENGINE, 'forge.mjs');

const text = (s) => [{ type: 'text', text: String(s) }];
const outSchema = {};
const render = (_args, value) => text(JSON.stringify(value, null, 2));

function runEngine(argv, { timeout = 900000 } = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [CLI, ...argv], {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
      cwd: path.dirname(ENGINE),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '', err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    const timer = setTimeout(() => { try { child.kill('SIGKILL'); } catch (e) { /* ignore */ } resolve({ code: -1, out, err: err + '\n(timeout)' }); }, timeout);
    child.on('error', (e) => { clearTimeout(timer); resolve({ code: -2, out, err: String(e && e.message || e) }); });
    child.on('close', (code) => { clearTimeout(timer); resolve({ code, out, err }); });
  });
}

function parseJson(out) {
  const start = out.indexOf('{');
  if (start < 0) return null;
  try { return JSON.parse(out.slice(start)); } catch (e) { return null; }
}

async function engineCall(argv, timeout) {
  const r = await runEngine(argv, { timeout });
  const data = parseJson(r.out);
  if (!data) {
    return { ok: false, error: (r.err || r.out || '引擎没有返回结果').slice(-2500) };
  }
  if (r.code !== 0 && data.ok !== false) data.ok = false;
  return data;
}

function compactForge(data) {
  if (!data || data.ok === false && data.error) return data;
  const isCocos = data.engine === 'cocos';
  const checks = data.checks ? {
    ok: data.checks.ok,
    sim: data.checks.stats?.sim,
    singlefile: data.checks.stats?.singlefile,
    build: data.checks.stats?.build,
    browser: isCocos ? data.checks.stats?.browser && { play: data.checks.stats.browser.play, result: data.checks.stats.browser.result } : data.checks.stats?.browser,
    failures: (data.checks.failures || []).slice(0, 10),
    warnings: (data.checks.warnings || []).slice(0, 10),
  } : null;
  return {
    ok: data.ok,
    engine: data.engine || 'html',
    dir: data.dir,
    title: data.title,
    genre: data.genre,
    genreName: data.genreName,
    theme: data.theme,
    themeName: data.themeName,
    levels: data.levels,
    orientation: data.orientation,
    seed: data.seed,
    creator: data.creator ?? null,
    designResolution: data.designResolution ?? null,
    webBuild: data.webBuild ?? null,
    singleFile: data.singleFile ?? null,
    singleFileKB: data.singleFileKB ?? null,
    plan: data.plan,
    checks,
    warnings: data.warnings || [],
    error: data.error,
    nextSteps: data.ok ? (isCocos ? [
      '用 Cocos Creator 3.8.8 打开工程目录：' + data.dir,
      '构建 Web Mobile：cd ' + data.dir + ' && bash tools/build-web.sh（产物 build/web-mobile/index.html，可直接浏览器打开）',
      '改玩法/数值：' + path.join(data.dir, 'assets', 'scripts', 'game', 'content.ts') + ' 与 ' + path.join(data.dir, 'assets', 'scripts', 'game', 'rules', data.genre + '.ts') + '，再跑 game_build / game_check',
      '截图与冒烟明细：' + path.join(data.dir, 'shots') + '、' + path.join(data.dir, 'cocos-check.json'),
    ] : [
      '打开 ' + (data.singleFile ? path.join(data.dir, 'dist', data.singleFile) : path.join(data.dir, 'dist')) + ' 试玩（双击即玩）',
      '要改玩法/数值：编辑 ' + path.join(data.dir, 'js', 'content.js') + ' 与 ' + path.join(data.dir, 'js', 'rules', data.genre + '.js') + '，再跑 game_build / game_check',
      '截图与自检明细：' + path.join(data.dir, 'shots') + '、' + path.join(data.dir, 'check-report.json'),
    ]) : ['根据 error/failures 修复后重试，或改用 game_plan 调整选型'],
  };
}

const BRIEF_PARAM = {
  type: 'string',
  description: '一句话玩法描述（中文即可）：题材 + 玩法 + 规模/平台。例："做一个僵尸围山门的塔防，30关，手机横屏" / "海底钩爪打捞，24关竖屏"',
};

const DIR_PARAM = {
  type: 'string',
  description: '生成到的目录（绝对路径优先，建议在工作区内新建一个英文/拼音目录名）',
};

export function apply(ctx) {
  const definitions = [
    {
      name: 'game_genres',
      description: '列出游戏工坊内置玩法基因（塔防/割草/合成/排序/钩爪/放置…）、支持的引擎（html / cocos）与各自适配的一句话关键词。做新游戏前可先看这里，或直接 game_forge。',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
      output: { schema: outSchema, render },
      isConcurrencySafe: () => true,
      timeoutMs: 60000,
      execute: async () => engineCall(['genres'], 60000),
    },
    {
      name: 'game_plan',
      description: '只解析不落盘：把一句话描述映射成 题材、玩法基因、标题、关卡数、横竖屏，并解释依据。适合在真正生成前确认选型，或用户描述模糊时先看默认决策。',
      parameters: {
        type: 'object',
        properties: {
          brief: BRIEF_PARAM,
          genre: { type: 'string', description: '强制指定基因 id（可选，见 game_genres）' },
          theme: { type: 'string', description: '强制指定题材 id（可选，见 game_genres 输出里的题材列表）' },
          levels: { type: 'integer', description: '关卡数（可选，6~60）' },
          title: { type: 'string', description: '指定游戏名（可选）' },
          seed: { type: 'integer', description: '随机种子（可选；同种子可复现同一套关卡与标题）' },
        },
        required: ['brief'],
        additionalProperties: false,
      },
      output: { schema: outSchema, render },
      isConcurrencySafe: () => true,
      timeoutMs: 60000,
      execute: async (args) => engineCall(['plan', '--brief', String(args.brief), ...(args.genre ? ['--genre', args.genre] : []), ...(args.theme ? ['--theme', args.theme] : []), ...(args.levels ? ['--levels', String(args.levels)] : []), ...(args.title ? ['--title', args.title] : []), ...(args.seed != null ? ['--seed', String(args.seed)] : [])], 60000),
    },
    {
      name: 'game_forge',
      description: '【核心】一句话生成一个完整可玩游戏，支持两种运行时：engine=html（默认，Canvas2D 单文件离线版，双击即玩）或 engine=cocos（Cocos Creator 3.8 工程，可用 Cocos CLI 构建 Web/Android/iOS/鸿蒙）。流程：解析选型 → 生成内容与关卡 → 写出完整工程 → 构建 → 无头浏览器冒烟与截图（HTML 档还会跑机器人逐关仿真）。描述里出现“Cocos”会自动选 Cocos 工程。返回工程路径、构建产物、自检摘要；生成后编辑 content / rules 再用 game_build / game_check 迭代。',
      parameters: {
        type: 'object',
        properties: {
          brief: BRIEF_PARAM,
          dir: DIR_PARAM,
          genre: { type: 'string', description: '强制玩法基因（可选）' },
          theme: { type: 'string', description: '强制题材（可选）' },
          levels: { type: 'integer', description: '关卡数 6~60（可选，默认按基因）' },
          title: { type: 'string', description: '游戏名（可选，默认由题材+基因生成）' },
          seed: { type: 'integer', description: '随机种子（可选）' },
          engine: { type: 'string', description: '运行时：html（默认）或 cocos（Cocos Creator 3.8 工程）。描述里出现 Cocos 时自动选 cocos' },
          check: { type: 'boolean', description: '是否跑完整自检（默认 true；false 时只写工程+构建，快很多）' },
          browser: { type: 'boolean', description: '自检是否包含无头浏览器与截图（默认 true；机器没有 Chrome 时传 false）' },
          overwrite: { type: 'boolean', description: '目录非空时是否覆盖（默认 false）' },
        },
        required: ['brief', 'dir'],
        additionalProperties: false,
      },
      output: { schema: outSchema, render },
      isConcurrencySafe: () => false,
      timeoutMs: 900000,
      execute: async (args) => {
        const argv = ['forge', '--brief', String(args.brief), '--dir', String(args.dir)];
        if (args.genre) argv.push('--genre', String(args.genre));
        if (args.theme) argv.push('--theme', String(args.theme));
        if (args.levels) argv.push('--levels', String(args.levels));
        if (args.title) argv.push('--title', String(args.title));
        if (args.seed != null) argv.push('--seed', String(args.seed));
        if (args.engine) argv.push('--engine', String(args.engine));
        if (args.check === false) argv.push('--no-check');
        if (args.browser === false) argv.push('--no-browser');
        if (args.overwrite) argv.push('--overwrite');
        const data = await engineCall(argv, 900000);
        return compactForge(data);
      },
    },
    {
      name: 'game_build',
      description: '重新构建游戏产物：HTML 工程 → 单文件离线版 dist/<游戏名>.html；Cocos 工程 → Cocos CLI 构建 build/web-mobile/index.html。改完 content / rules 后用它。',
      parameters: {
        type: 'object',
        properties: { dir: { type: 'string', description: '游戏工程目录（game_forge 返回的 dir）' } },
        required: ['dir'],
        additionalProperties: false,
      },
      output: { schema: outSchema, render },
      isConcurrencySafe: () => true,
      timeoutMs: 180000,
      execute: async (args) => engineCall(['build', '--dir', String(args.dir)], 180000),
    },
    {
      name: 'game_check',
      description: '对已生成工程跑交付自检：HTML 档 = 数据校验 / 机器人逐关仿真（要求全通关且摆烂不通关）/ 单文件零外部引用 / 无头浏览器；Cocos 档 = 工程结构 / Cocos CLI 构建 / 无头 Chrome(WebGL) 启动·战斗·结算冒烟与截图。',
      parameters: {
        type: 'object',
        properties: {
          dir: { type: 'string', description: '游戏工程目录' },
          browser: { type: 'boolean', description: '是否包含浏览器冒烟（默认 true）' },
        },
        required: ['dir'],
        additionalProperties: false,
      },
      output: { schema: outSchema, render },
      isConcurrencySafe: () => true,
      timeoutMs: 600000,
      execute: async (args) => {
        const data = await engineCall(['check', '--dir', String(args.dir), ...(args.browser === false ? ['--no-browser'] : [])], 600000);
        if (data && data.report) return { ok: data.ok, report: data.report };
        return data;
      },
    },
  ];

  for (const def of definitions) {
    ctx.effect(() => ctx.tools.register(def), 'dsh-game-studio: ' + def.name);
  }

  // 随包 skill：与工具配套的「游戏开发方法论 + 流水线作业指导」
  const registerSkill = (c) => {
    try {
      if (!c.skills || typeof c.skills.registerProvider !== 'function') return;
      c.skills.registerProvider(() => skillProvider());
    } catch (e) {
      try { ctx.logger?.warn?.('game-studio skill 注册失败: ' + String(e && e.message || e)); } catch (err) { /* ignore */ }
    }
  };
  try {
    if (typeof ctx.inject === 'function') ctx.inject(['skills'], (c) => registerSkill(c));
    else if (ctx.skills) registerSkill(ctx);
  } catch (e) { /* skill 可选，失败不影响工具面 */ }
}

/* ---------------------------- 随包 skill ---------------------------- */
import { readFileSync } from 'node:fs';

const SKILL_FILE = path.join(HERE, 'skills', 'game-studio', 'SKILL.md');
let cached = null;
function readSkill() {
  if (cached !== null) return cached;
  try {
    const raw = readFileSync(SKILL_FILE, 'utf8');
    const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
    if (!m) { cached = null; return null; }
    const meta = {};
    for (const line of m[1].split(/\r?\n/)) {
      const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
      if (!kv) continue;
      let v = kv[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      meta[kv[1]] = v;
    }
    if (!meta.name || !meta.description) { cached = null; return null; }
    cached = { name: meta.name, description: meta.description, content: raw.slice(m[0].length), file: SKILL_FILE };
    return cached;
  } catch (e) { cached = null; return null; }
}
function skillProvider() {
  const skill = readSkill();
  if (!skill) throw new Error('game-studio skill 文件缺失或 frontmatter 非法');
  const base = { kind: 'directory', path: path.dirname(skill.file).split(path.sep).join('/') };
  const candidate = {
    name: skill.name, description: skill.description,
    invocation: { modelInvocable: true, userInvocable: true },
    source: 'bundled', provider: 'dsh-game-studio', rank: 620,
    resourceBase: base, path: skill.file, locator: skill.file,
  };
  return {
    name: 'dsh-game-studio',
    list: async () => [candidate],
    get: async () => ({ ...candidate, content: skill.content }),
  };
}
