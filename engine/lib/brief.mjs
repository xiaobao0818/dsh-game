/* =========================================================================
 * brief.mjs —— 一句话描述解析：题材 / 玩法基因 / 标题 / 关卡数 / 平台方向
 * 纯函数，不联网；同一输入永远得到同一结果（seed 可固定）。
 * ========================================================================= */
import { THEMES, THEME_LIST } from './themes.mjs';
import { GENRE_META } from './genres.mjs';
import { hashString } from './core-hash.mjs';

/** 解析用户描述，返回生成所需的一切决策 */
export function parseBrief(brief, opts = {}) {
  const text = String(brief || '').trim();
  const lower = text.toLowerCase();
  const seed = opts.seed != null ? Number(opts.seed) >>> 0 : (hashString(text) ^ 0x9e3779b9) >>> 0;

  // ---------- 玩基因：标签/提示词计分 ----------
  let genre = opts.genre && GENRE_META[opts.genre] ? opts.genre : null;
  if (!genre) {
    let bestG = 0;
    for (const g of Object.values(GENRE_META)) {
      let s = 0;
      for (const kw of g.hints) if (kw && text.includes(kw)) s += 4;
      for (const kw of g.tags) if (kw && lower.includes(String(kw).toLowerCase())) s += 2;
      if (s > bestG) { bestG = s; genre = g.id; }
    }
    if (!genre) genre = 'horde';
  }
  const meta = GENRE_META[genre];

  // ---------- 题材：关键词计分（0 分时用基因默认题材） ----------
  let theme = null, best = 0;
  const scores = {};
  for (const t of THEME_LIST) {
    let s = 0;
    for (const kw of t.keywords) {
      if (kw && lower.includes(kw.toLowerCase())) s += Math.min(6, kw.length);
    }
    scores[t.id] = s;
    if (s > best) { best = s; theme = t; }
  }
  if (!theme) theme = THEMES[opts.theme && THEMES[opts.theme] ? opts.theme : (meta.defaultTheme || 'jiangshi')];
  if (opts.theme && THEMES[opts.theme]) theme = THEMES[opts.theme];

  // ---------- 标题 ----------
  let title = opts.title || '';
  if (!title) {
    const m = text.match(/《([^》]{1,16})》/);
    if (m) title = m[1].trim();
  }
  if (!title) {
    const v = theme.vocab;
    const place = v.place[seed % Math.min(3, v.place.length)];
    let suffix = meta.suffixes[seed % meta.suffixes.length];
    if (text.includes('僵尸') || text.includes('尸')) suffix = meta.suffixes[0];
    if (genre === 'horde' && (text.includes('山门') || text.includes('围山门'))) suffix = '围山门';
    title = place + suffix;
    if (title.length > 12) title = title.slice(0, 12);
  }

  // ---------- 关卡数 / 平台方向 ----------
  let levelCount = meta.defaultLevels;
  const lv = text.match(/(\d{1,3})\s*(关|levels?|个?关卡|波)/i);
  if (lv) levelCount = Math.max(6, Math.min(60, parseInt(lv[1], 10)));
  if (opts.levels) levelCount = Math.max(6, Math.min(60, parseInt(opts.levels, 10)));
  const orientation = meta.orientation;
  const portrait = orientation === 'portrait';

  // ---------- 副标题 / 一句话 ----------
  const v = theme.vocab;
  const hero = v.hero[seed % v.hero.length];
  const subtitle = opts.subtitle || `${theme.name} · ${hero}的${genre === 'idle' ? '生意' : '冒险'}`;
  const tagline = opts.tagline || meta.summary;

  return {
    brief: text, seed: seed >>> 0, theme, genre, meta, title, subtitle, tagline,
    levelCount, orientation, portrait, scores,
  };
}

/** 一句话可解释性：为什么选了这个基因/题材（写进 README 与工具回执） */
export function explainPlan(plan) {
  const tops = Object.entries(plan.scores).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return {
    theme: plan.theme.id,
    themeReason: tops.length ? tops.map(([id, s]) => `${id}(${s})`).join(' / ') : 'default',
    genre: plan.genre,
    genreReason: (plan.meta.hints.filter((k) => plan.brief.includes(k)).join(',') || 'default'),
    title: plan.title,
    levels: plan.levelCount,
    orientation: plan.orientation,
  };
}
