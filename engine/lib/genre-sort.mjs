/* =========================================================================
 * build/genre.mjs —— sort（分拣环道）内容生成器
 *   · meta：基因元信息（引擎选型用）
 *   · buildContent({theme,...})：纯函数，主题驱动 → 颜色/物件名/25 关
 *   · 关卡生成：随机排布 + 内置求解器验证「无堵塞可解」；确定性 seed 重试
 *   · CLI：node build/genre.mjs --write  →  落盘 js/content.js
 *
 * 玩法模型（与 js/rules/sort.js 完全一致，改规则时两处同步）：
 *   候车队列（只有前 window 个可点）→ 环道（FIFO，容量 beltCap）
 *   → 每拍从环道前端送往同色车位（容量 4，凑满 4 清空得分）
 *   → 车位有闸门（lock = 需要累计清空 N 排才开放）
 * ========================================================================= */

export const meta = {
  id: 'sort',
  name: '分拣环道',
  orientation: 'portrait',
  defaultLevels: 25,
  tags: ['排序', '解谜', '分拣', '投掷', 'sort', 'puzzle', 'traffic'],
  summary: '点候车物件送进环道，同色满四整排清空，别把环道堵死。',
  briefHints: ['排序', '分拣', '停车场', '投掷', '同色', '清空', '环道'],
};

/* ------------------------------------------------------------------ 随机 */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/* ------------------------------------------------------- 规则模型 / 求解器 */
export const LANE_CAP = 4;
export const BELT_CAP = 5;

function makeState(cfg) {
  return {
    queue: cfg.queue.slice(),
    belt: [],
    lanes: cfg.lanes.map((l) => ({ color: l.color, preset: l.preset, lock: l.lock, items: l.preset })),
    clears: 0,
    beltCap: cfg.beltCap || BELT_CAP,
    window: cfg.window || 4,
  };
}
function laneOf(st, color) {
  for (const l of st.lanes) if (l.color === color) return l;
  return null;
}
function canDeliver(st, color) {
  const ln = laneOf(st, color);
  return !!ln && st.clears >= ln.lock && ln.items < LANE_CAP;
}
function beat(st) {
  if (!st.belt.length) return { delivered: false };
  const c = st.belt[0];
  const ln = laneOf(st, c);
  if (ln && st.clears >= ln.lock && ln.items < LANE_CAP) {
    st.belt.shift(); ln.items++;
    if (ln.items >= LANE_CAP) { ln.items = 0; st.clears++; return { delivered: true, cleared: 1, color: c }; }
    return { delivered: true, cleared: 0, color: c };
  }
  return { delivered: false, jam: true };
}
function clickIndex(st, idx) {
  if (st.belt.length >= st.beltCap) return { illegal: true };
  const vis = Math.min(st.window, st.queue.length);
  if (idx < 0 || idx >= vis) return { illegal: true };
  const c = st.queue[idx];
  st.queue.splice(idx, 1);
  st.belt.push(c);
  return { color: c, ...beat(st) };
}
function isWin(st) {
  return st.queue.length === 0 && st.belt.length === 0 && st.lanes.every((l) => l.items === 0);
}
function isDead(st) {
  return st.belt.length > 0 && !canDeliver(st, st.belt[0]);
}

/* 无堵塞点击顺序求解（DFS + 记忆化 + 启发式排序）。
 * 关键性质：环道 FIFO ⇒ 交付顺序 = 点击顺序，所以「一次点击 = 一次一拍」的
 * 抽象与实时节拍等价；堵塞状态不可再推进（无退回时），直接剪枝。 */
export function solve(cfg, budgetNodes = 60000) {
  const st = makeState(cfg);
  const seen = new Set();
  const plan = [];
  let nodes = 0;
  const key = (s) => s.queue.join(',') + '|' + s.belt.join(',') + '|' + s.lanes.map((l) => l.items).join(',') + '|' + s.clears;
  function dfs(s) {
    if (++nodes > budgetNodes) return false;
    if (isWin(s)) return true;
    const k = key(s);
    if (seen.has(k)) return false;
    seen.add(k);
    const vis = Math.min(s.window, s.queue.length);
    const seenColor = new Set();
    const moves = [];
    for (let i = 0; i < vis; i++) {
      const c = s.queue[i];
      if (seenColor.has(c)) continue;
      seenColor.add(c);
      const ln = laneOf(s, c);
      const open = s.clears >= ln.lock;
      let score = open ? 1000 : 0;
      score -= (LANE_CAP - ln.items) * 3; score -= i;
      if (!open) score -= (ln.lock - s.clears) * 25;
      moves.push({ i, score });
    }
    moves.sort((a, b) => b.score - a.score);
    for (const m of moves) {
      const sub = {
        queue: s.queue.slice(), belt: s.belt.slice(),
        lanes: s.lanes.map((l) => ({ ...l })), clears: s.clears, beltCap: s.beltCap, window: s.window,
      };
      const r = clickIndex(sub, m.i);
      if (r.illegal) continue;
      if (isWin(sub)) { plan.push(m.i); return true; }
      if (isDead(sub)) continue;
      plan.push(m.i);
      if (dfs(sub)) return true;
      plan.pop();
    }
    return false;
  }
  return dfs(st) ? plan.slice() : null;
}

/* 「一直点队首」的笨玩家：教学关应当能赢，后面的关必须输（用来说明有策略） */
export function playNaive(cfg) {
  const st = makeState(cfg);
  let guard = 0;
  while (guard++ < 600) {
    if (isWin(st)) return 'won';
    if (isDead(st)) return 'dead';
    if (st.belt.length >= st.beltCap) return 'stuck';
    clickIndex(st, 0);
  }
  return 'stuck';
}

/* ------------------------------------------------------ 主题 → 颜色与命名 */
function hexToRgb(h) {
  h = String(h || '').replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return { r: 200, g: 200, b: 200 };
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
function rgbToHex(r, g, b) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0; const l = (mx + mn) / 2; const d = mx - mn;
  let s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return { h, s, l };
}
function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}
export function darken(hex, k) {
  const c = hexToRgb(hex), h = rgbToHsl(c.r, c.g, c.b);
  const o = hslToRgb(h.h, Math.min(1, h.s * 1.05), Math.max(0.06, h.l * (1 - k)));
  return rgbToHex(o.r, o.g, o.b);
}

const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'hex', 'star'];
const PAL_KEYS = ['accent', 'hero', 'accent2', 'ok', 'danger', 'gold'];

/* 从主题调色板派生 6 个可区分的物件色：色相间隔 ≥ 34°，亮度/饱和落到可读区间 */
export function deriveColors(theme) {
  const pal = (theme && theme.palette) || {};
  const base = [];
  for (const k of PAL_KEYS) {
    const raw = pal[k] || '#cccccc';
    const rgb = hexToRgb(raw);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    base.push({ h: hsl.h, s: Math.max(0.5, Math.min(0.95, hsl.s)), l: Math.max(0.52, Math.min(0.72, hsl.l)) });
  }
  // 贪心：按顺序把色相推开，保证互相区分
  for (let i = 1; i < base.length; i++) {
    let guard = 0;
    while (guard++ < 40) {
      let conflict = -1;
      for (let j = 0; j < i; j++) {
        const dh = Math.abs(((base[i].h - base[j].h + 540) % 360) - 180);
        if (dh < 34) { conflict = j; break; }
      }
      if (conflict < 0) break;
      base[i].h = (base[i].h + 41) % 360;
    }
  }
  return base.map((c, i) => {
    const rgb = hslToRgb(c.h, c.s, c.l);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    return { id: 'c' + i, color: hex, color2: darken(hex, 0.52), shape: SHAPES[i % SHAPES.length] };
  });
}

function itemNames(theme) {
  const vocab = (theme && theme.vocab) || {};
  const pool = Array.isArray(vocab.item) && vocab.item.length >= 3 ? vocab.item.slice() : ['货物', '包裹', '行李', '木箱', '铁盒', '布袋'];
  const out = [];
  const used = new Set();
  for (const name of pool) {
    const key = String(name).slice(0, 1);
    if (used.has(key)) continue;
    used.add(key); out.push(String(name));
    if (out.length >= 6) break;
  }
  let k = 0;
  while (out.length < 6) { k++; const n = '货' + '甲乙丙丁戊己'[k % 6]; if (!out.includes(n)) out.push(n); }
  return out;
}

/* --------------------------------------------------------------- 关卡表 */
/* [颜色数, 可见窗口, 闸门(每色所需累计清空数), 目标物件数, 是否难关] */
const LEVEL_SPECS = [
  [3, 4, [0, 0, 0], 12, false],
  [3, 4, [0, 0, 0], 15, false],
  [3, 4, [0, 0, 1], 18, false],
  [4, 4, [0, 0, 0, 1], 20, false],
  [4, 4, [0, 0, 1, 1], 24, true],
  [4, 4, [0, 0, 0, 1], 22, false],
  [4, 4, [0, 0, 1, 1], 25, false],
  [4, 4, [0, 0, 1, 2], 27, false],
  [4, 4, [0, 0, 1, 2], 29, false],
  [5, 4, [0, 0, 0, 1, 2], 27, true],
  [5, 4, [0, 0, 1, 1, 2], 30, false],
  [5, 4, [0, 0, 1, 2, 2], 32, false],
  [5, 4, [0, 0, 1, 2, 3], 34, false],
  [5, 4, [0, 0, 1, 2, 3], 36, false],
  [6, 4, [0, 0, 0, 1, 2, 3], 32, true],
  [6, 4, [0, 0, 1, 1, 2, 3], 35, false],
  [6, 3, [0, 0, 1, 1, 2, 3], 35, false],
  [6, 3, [0, 0, 1, 2, 2, 3], 37, false],
  [6, 3, [0, 0, 1, 2, 3, 3], 39, false],
  [6, 3, [0, 0, 1, 2, 3, 4], 39, true],
  [6, 3, [0, 0, 1, 2, 3, 4], 40, false],
  [6, 3, [0, 1, 1, 2, 3, 4], 40, false],
  [6, 3, [0, 1, 1, 2, 3, 4], 42, false],
  [6, 3, [0, 1, 1, 2, 3, 4], 42, false],
  [6, 3, [0, 1, 2, 2, 3, 4], 44, true],
];

function confOf(colors, window, locks) {
  return { colors, window, locks: locks.slice() };
}

/* 生成单个关卡：随机排布 → 求解器验证 → 笨玩家必须输（教学关相反） */
function genLevel(id, spec, rng) {
  const [colors, window0, locks0, targetN, boss] = spec;
  const variants = [locks0];
  // 兜底阶梯：闸门逐级放松，保证一定收敛到可解关卡
  for (let i = 0; i < 3; i++) {
    const softer = locks0.map((v) => Math.max(0, v - (i + 1)));
    variants.push(softer);
  }
  variants.push(locks0.map(() => 0));
  for (const locks of variants) {
    for (let attempt = 0; attempt < 220; attempt++) {
      const laneDefs = [];
      const counts = [];
      let used = 0;
      for (let ci = 0; ci < colors; ci++) {
        const remain = targetN - used;
        const remainColors = colors - ci;
        let batches = remain / remainColors > 7.2 ? 2 : 1;
        if (colors <= 3) batches = 1;
        const preset = rng() < 0.34 ? 0 : 1 + ((rng() * (LANE_CAP - 1)) | 0);
        const count = (LANE_CAP - preset) + LANE_CAP * batches;
        used += count; counts.push(count);
        laneDefs.push({ color: ci, preset, lock: locks[ci] || 0 });
      }
      const queue = [];
      for (let ci = 0; ci < colors; ci++) for (let k = 0; k < counts[ci]; k++) queue.push(ci);
      for (let i = queue.length - 1; i > 0; i--) { const j = (rng() * (i + 1)) | 0; const t = queue[i]; queue[i] = queue[j]; queue[j] = t; }
      const cfg = { queue, lanes: laneDefs, beltCap: BELT_CAP, window: window0 };
      const plan = solve(cfg, 60000);
      if (!plan) continue;
      const naive = playNaive(cfg);
      if (id <= 3 && naive !== 'won') continue;   // 教学关：笨玩也能过
      if (id > 3 && naive === 'won') continue;    // 之后必须动脑
      return { cfg, plan, locks, attempts: attempt + 1 };
    }
  }
  // 极端兜底：全开放 + 队首直通（构造式保证可解）
  const lanes = [];
  const queue = [];
  for (let ci = 0; ci < colors; ci++) { lanes.push({ color: ci, preset: 0, lock: 0 }); for (let k = 0; k < LANE_CAP; k++) queue.push(ci); }
  return { cfg: { queue, lanes, beltCap: BELT_CAP, window: window0 }, plan: queue.map((_, i) => 0), locks: lanes.map(() => 0), attempts: -1 };
}

/* ------------------------------------------------------------ 内容构建 */
function chapterName(theme, i) {
  const place = ((theme && theme.vocab && theme.vocab.place) || ['荒村', '山门', '乱葬岗', '鬼市', '尸王殿']);
  return place[i % place.length];
}
function titleOf(theme) {
  const id = (theme && theme.id) || '';
  if (id === 'jiangshi') return { title: '夜市分拣站', subtitle: '候车环道 · 同色归位', tagline: '点货进环道，同色满四，整排清场' };
  if (id === 'space') return { title: '星港分拣环道', subtitle: '轨道货站 · 同色归位', tagline: '把货箱送进环道，同色满四清场' };
  return { title: '分拣环道', subtitle: '候车 · 环道 · 车位', tagline: '点货进环道，同色满四，整排清场' };
}
function levelName(theme, id, boss) {
  const place = ((theme && theme.vocab && theme.vocab.place) || ['荒村', '山门', '乱葬岗', '鬼市', '尸王殿']);
  const item = itemNames(theme);
  const base = place[Math.floor((id - 1) / 5) % place.length];
  const tag = item[(id - 1) % item.length];
  return (boss ? '难关 · ' : '') + base + tag;
}

export function buildContent(opts = {}) {
  const theme = opts.theme || { id: 'plain', name: '空白', palette: {}, vocab: {} };
  const levelCount = Math.max(6, Math.min(30, opts.levelCount || meta.defaultLevels));
  const seed = (opts.seed == null ? 20261127 : opts.seed) >>> 0;
  const base = titleOf(theme);
  const title = opts.title || base.title;
  const subtitle = opts.subtitle || base.subtitle;
  const tagline = opts.tagline || base.tagline;
  const colors = deriveColors(theme);
  const names = itemNames(theme);
  const colorDefs = colors.map((c, i) => ({ ...c, name: names[i] }));
  const levels = [];
  const chapterSize = Math.ceil(levelCount / 5);
  const chapters = [];
  for (let ci = 0; ci < 5; ci++) {
    const ids = [];
    for (let k = 0; k < chapterSize; k++) {
      const id = ci * chapterSize + k + 1;
      if (id > levelCount) break;
      ids.push(id);
    }
    if (ids.length) chapters.push({ name: chapterName(theme, ci), levels: ids });
  }
  for (let id = 1; id <= levelCount; id++) {
    const spec = LEVEL_SPECS[(id - 1) % LEVEL_SPECS.length];
    const rng = mulberry32((seed ^ (id * 2654435761)) >>> 0);
    const built = genLevel(id, spec, rng);
    const colorsN = built.cfg.lanes.length;
    const queue = built.cfg.queue;
    const par = Math.round(queue.length * 1.15 + 8);
    levels.push({
      id,
      chapter: Math.min(chapters.length, Math.floor((id - 1) / chapterSize) + 1),
      name: levelName(theme, id, spec[4]),
      boss: !!spec[4],
      colors: colorsN,
      window: built.cfg.window,
      lanes: built.cfg.lanes.map((l) => ({ color: l.color, preset: l.preset, lock: l.lock })),
      queue,
      par,
      hint: spec[4]
        ? '难关：先清掉开放的颜色，闸门一开立刻补位'
        : (built.cfg.lanes.some((l) => l.lock > 0) ? '只有亮起的车位能收货，闸门要清空别的排才开' : '点物件送进环道，同色满四清一排'),
    });
  }
  /* 自检：每个关卡都必须有解 */
  for (const lv of levels) {
    const cfg = { queue: lv.queue, lanes: lv.lanes, beltCap: BELT_CAP, window: lv.window };
    const plan = solve(cfg, 80000);
    if (!plan) throw new Error(`sort: 第 ${lv.id} 关不可解`);
    lv.solutionLength = plan.length;
  }
  const totalItems = levels.reduce((s, l) => s + l.queue.length, 0);
  const help = {
    goal: '把候车队列里的物件全部清空。点物件送进环道，环道每拍把最前面的物件送给同色车位；车位凑齐 4 个同色就整排清空。把环道塞死就输了。',
    controls: [
      '点「候车队列」里的任意物件，送入环道（只能点最前面几个）',
      '环道自动前进：最前面的物件同色车位开着就自动入位',
      '车位凑满 4 个同色 → 整排清空得分；连锁清空分数更高',
      '点环道最前面的物件可以「退回」队列最前，用来救堵塞（每关 3 次）',
    ],
    tips: [
      '带锁的车位暂时不收货：先清开放颜色，闸门开了再送',
      '堵死时别乱点：环道满了又送不出去就失败，退回是唯一解法',
      '想拿三星就少犹豫——星级看用时',
    ],
  };
  return {
    slug: (opts.slug || 'sort-dev'),
    genre: meta.id,
    title, subtitle, tagline,
    orientation: meta.orientation,
    config: { seed, maxLevel: levelCount },
    theme,
    chapters,
    help,
    defs: {
      beltCap: BELT_CAP,
      laneCap: LANE_CAP,
      windowMax: 5,
      pullCharges: 3,
      beat: 0.45,
      scorePerClear: 120,
      comboBonus: 60,
      starParScale: 1.0,
      colors: colorDefs,
    },
    levels,
    saveDefaults: {},
    stats: { levels: levels.length, totalItems, chapters: chapters.length },
  };
}

/* ------------------------------------------------------------------ CLI */
const IS_MAIN = (() => {
  try { return process.argv[1] && process.argv[1].endsWith('genre.mjs'); } catch (e) { return false; }
})();
if (IS_MAIN) {
  const argv = process.argv.slice(2);
  const has = (k) => argv.includes('--' + k);
  const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
  const themeId = arg('theme', 'jiangshi');
  let theme;
  try {
    const sample = await import(new URL('../../theme-sample.mjs', import.meta.url).href);
    theme = (themeId === 'space' ? sample.SPACE : sample.JIANGSHI) || sample.JIANGSHI;
  } catch (e) {
    theme = { id: 'plain', name: '素色', mood: 'night', palette: {}, vocab: {} };
    console.warn('未找到 theme-sample.mjs，使用兜底主题');
  }
  const content = buildContent({
    theme,
    levelCount: parseInt(arg('levels', String(meta.defaultLevels)), 10),
    seed: parseInt(arg('seed', '20261127'), 10),
    title: arg('title', ''),
    subtitle: arg('subtitle', ''),
    tagline: arg('tagline', ''),
  });
  const summary = {
    title: content.title, levels: content.levels.length,
    items: content.stats.totalItems,
    colors: content.defs.colors.map((c) => c.name + c.color),
    perLevel: content.levels.map((l) => ({ id: l.id, n: l.queue.length, colors: l.colors, window: l.window, locks: l.lanes.map((x) => x.lock).join(''), boss: l.boss || 0 })),
  };
  if (has('json')) console.log(JSON.stringify(summary, null, 2));
  if (has('write')) {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const here = path.dirname(fileURLToPath(import.meta.url));
    const out = path.resolve(here, '..', 'js', 'content.js');
    const header = `/* =========================================================================\n * content.js —— 由 build/genre.mjs 生成（node build/genre.mjs --write），可直接手改。\n * 玩法：候车队列 → 环道 → 同色车位；凑满 4 清空，环道塞死失败。\n * ========================================================================= */\n\n`;
    const body = 'export const CONTENT = ' + JSON.stringify(content, null, 2) + ';\n';
    fs.writeFileSync(out, header + body, 'utf8');
    console.log('✅ 已写入 ' + out + '（' + content.levels.length + ' 关 / ' + content.stats.totalItems + ' 个物件）');
  }
  if (!has('json') && !has('write')) {
    console.log(`生成：${content.title} · ${content.levels.length} 关 · 共 ${content.stats.totalItems} 个物件`);
    for (const l of content.levels) {
      console.log(`  #${String(l.id).padStart(2)} ${l.boss ? '难' : '  '} 物件${String(l.queue.length).padStart(2)} 色${l.colors} 窗${l.window} 闸门[${l.lanes.map((x) => x.lock).join('')}] 预置[${l.lanes.map((x) => x.preset).join('')}] 步${l.solutionLength} 标准${l.par}s`);
    }
  }
}
