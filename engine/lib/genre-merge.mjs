/* =========================================================================
 * build/genre.mjs —— merge（合成塔防 / Merge TD）内容生成器
 *
 * 纯函数：同样入参 → 同样输出。不读文件、不联网、不取 Date.now。
 * 题材名全部取自 theme.vocab（hero=单位、enemy/boss=敌人、building=棋盘、
 * place=章节、currency=金币名），颜色取 theme.palette。
 *
 * CLI：node build/genre.mjs --write
 *      → 用开发主题 theme-sample.mjs 生成并落盘 js/content.js
 * ========================================================================= */

export const meta = {
  id: 'merge',
  name: '合成合体',
  orientation: 'portrait',
  defaultLevels: 24,
  tags: ['合成', '塔防', '升级', 'merge', 'combine'],
  summary: '两个同级单位合成更高一级，自动攻击来敌，守住底线。',
  briefHints: ['合成', '升级', '合并', '进化', '合体'],
};

/* ---------------------------- 确定性随机（本地实现，保证纯函数） ---------------------------- */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < String(s).length; i++) { h ^= String(s).charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const r2 = (v) => Math.round(v * 1000) / 1000;

/* ---------------------------- 数值表（调参入口） ---------------------------- */
const BOARD = { cols: 5, rows: 2, summonCost: 10 };

/* 6 级单位：atk / cd / range（合并后 DPS 一定高于两个下级之和） */
const TIER_STATS = [
  { atk: 7, cd: 0.62, range: 382 },
  { atk: 16, cd: 0.60, range: 404 },
  { atk: 35, cd: 0.58, range: 426 },
  { atk: 74, cd: 0.56, range: 449 },
  { atk: 155, cd: 0.54, range: 472 },
  { atk: 330, cd: 0.52, range: 496 },
];

/* 敌人基础值（关卡再乘 level.scale） */
const ENEMY_STATS = [
  { id: 'grunt', hp: 30, speed: 46, gold: 6, dmg: 9, r: 13, gap: 0.7 },
  { id: 'runner', hp: 24, speed: 78, gold: 6, dmg: 8, r: 11, gap: 0.45 },
  { id: 'brute', hp: 100, speed: 34, gold: 14, dmg: 15, r: 17, gap: 0.95 },
];
const BOSS_STATS = { hp: 460, speed: 30, gold: 66, dmg: 40, r: 26, gap: 1.0 };

/* 关卡爬坡（导出以便调参脚本扫描；引擎只需 meta + buildContent） */
export const RAMP = {
  hpMin: 0.9, hpMax: 10.5, hpPow: 1.15,
  bossExtra: 3.2, bossExtraSpan: 2.6,
  speedMin: 0.92, speedMax: 1.24,
  goldMin: 1.0, goldMax: 1.75,
  startGold: 40, startGoldPerLevel: 5.0,
  baseHpMin: 90, baseHpSpan: 90,
  waveHp0: 0.55, waveHpStep: 0.45,
  cntBase: 2, cntWave: 1.5, cntLevel: 0.42,
};

const NAME_SUFFIX = ['来袭', '成群', '出没', '压境', '围城', '逼近'];

function pick(rnd, arr, i) { return arr[i % arr.length]; }

/* ---------------------------- 关卡生成 ---------------------------- */
function buildWaves(rnd, id, isBoss, pool, bossId, levelCount) {
  const waves = [];
  const waveCount = id <= 4 ? 3 : id <= 10 ? 4 : id <= 18 ? 5 : 6;
  const spacing = id <= 3 ? 12 : id <= 12 ? 11 : 10;
  for (let w = 0; w < waveCount; w++) {
    const at = 5 + w * spacing;
    const total = Math.round(RAMP.cntBase + w * RAMP.cntWave + id * RAMP.cntLevel);
    const nTypes = clamp(1 + Math.floor(w / 2), 1, pool.length);
    const groups = [];
    let left = total;
    for (let g = 0; g < nTypes; g++) {
      const type = pool[(w + g) % pool.length];
      const c = g === nTypes - 1 ? left : Math.max(1, Math.round(total / nTypes));
      left -= c;
      const def = ENEMY_STATS.find((e) => e.id === type) || ENEMY_STATS[0];
      groups.push({ type, count: c, gap: def.gap, delay: g * 2.4 });
    }
    waves.push({ at, hpMul: r2(RAMP.waveHp0 + w * RAMP.waveHpStep), groups });
  }
  if (isBoss) {
    waves.push({
      at: 5 + waveCount * spacing, hpMul: 1,
      groups: [{ type: bossId, count: 1, gap: 1, delay: 0 }],
      boss: true,
    });
  }
  return waves;
}

export function buildContent({ theme, title, subtitle, tagline, levelCount = 24, seed = 1, brief = '' }) {
  const T = theme || {};
  const V = T.vocab || {};
  const rnd = mulberry32((seed >>> 0) ^ hashStr(brief || 'merge') ^ 0x9e3779b9);
  // 竖屏选关一屏最多 6 章 × 5 关 = 30 格（app.js 的章节行高固定），故上限 30
  const levelTotal = clamp(Math.round(levelCount) || meta.defaultLevels, 6, 30);
  const chapterCount = clamp(Math.ceil(levelTotal / 5), 4, 6);

  const heroes = (V.hero && V.hero.length ? V.hero : ['单位']).slice();
  const enemies = (V.enemy && V.enemy.length ? V.enemy : ['敌人']).slice();
  const bosses = (V.boss && V.boss.length ? V.boss : ['首领']).slice();
  const buildings = (V.building && V.building.length ? V.building : ['营地']).slice();
  const places = (V.place && V.place.length ? V.place : ['边境']).slice();
  const currency = V.currency || '金币';

  /* ---- defs ---- */
  const tiers = TIER_STATS.map((s, i) => ({
    tier: i + 1,
    name: pick(rnd, heroes, i),
    atk: s.atk, cd: s.cd, range: s.range,
    sell: Math.max(2, Math.round(BOARD.summonCost * Math.pow(2, i) * 0.4)),
  }));
  const enemyDefs = ENEMY_STATS.map((e, i) => ({
    id: e.id, name: pick(rnd, enemies, i), hp: e.hp, speed: e.speed,
    gold: e.gold, dmg: e.dmg, r: e.r, gap: e.gap, boss: false,
  }));
  const bossDefs = bosses.slice(0, Math.max(1, Math.min(bosses.length, 4))).map((name, i) => ({
    id: 'boss' + (i + 1), name, hp: BOSS_STATS.hp, speed: BOSS_STATS.speed,
    gold: BOSS_STATS.gold, dmg: BOSS_STATS.dmg, r: BOSS_STATS.r, gap: BOSS_STATS.gap, boss: true,
  }));
  const defs = {
    board: {
      name: pick(rnd, buildings, 0),
      cols: BOARD.cols, rows: BOARD.rows, summonCost: BOARD.summonCost,
      maxTier: tiers.length, currency,
    },
    tiers,
    enemies: enemyDefs.concat(bossDefs),
  };

  /* ---- 章节 ---- */
  const chapterSizes = [];
  {
    const base = Math.floor(levelTotal / chapterCount);
    const extra = levelTotal % chapterCount;
    for (let i = 0; i < chapterCount; i++) chapterSizes.push(base + (i < extra ? 1 : 0));
  }
  const placePool = places.slice();
  for (let i = placePool.length - 1; i > 0; i--) {
    const j = (rnd() * (i + 1)) | 0;
    const t0 = placePool[i]; placePool[i] = placePool[j]; placePool[j] = t0;
  }
  const chapters = [];
  let cur = 1;
  for (let i = 0; i < chapterCount; i++) {
    const n = chapterSizes[i];
    const ids = [];
    for (let k = 0; k < n; k++) ids.push(cur + k);
    cur += n;
    chapters.push({ name: placePool[i % placePool.length], levels: ids });
  }

  /* ---- 关卡 ---- */
  const poolByChapter = [
    ['grunt'],
    ['grunt', 'runner'],
    ['grunt', 'runner', 'brute'],
    ['grunt', 'runner', 'brute'],
    ['grunt', 'runner', 'brute'],
    ['grunt', 'runner', 'brute'],
  ];
  const levels = [];
  let bossCursor = 0;
  for (let id = 1; id <= levelTotal; id++) {
    const chIdx = chapters.findIndex((c) => c.levels.includes(id));
    const t = levelTotal === 1 ? 0 : (id - 1) / (levelTotal - 1);
    const isBoss = id % 5 === 0 || id === levelTotal;
    const pool = poolByChapter[Math.min(poolByChapter.length - 1, chIdx)];
    const bossDef = bossDefs[bossCursor % bossDefs.length];
    if (isBoss) bossCursor++;
    const hpScale = RAMP.hpMin + Math.pow(t, RAMP.hpPow) * (RAMP.hpMax - RAMP.hpMin) + (isBoss ? 0.1 : 0);
    const bossBoost = isBoss ? RAMP.bossExtra + t * RAMP.bossExtraSpan : 1;
    const scale = {
      hp: r2(hpScale),
      bossHp: r2(bossBoost),
      speed: r2(RAMP.speedMin + t * (RAMP.speedMax - RAMP.speedMin)),
      gold: r2(RAMP.goldMin + t * (RAMP.goldMax - RAMP.goldMin)),
    };
    const waves = buildWaves(rnd, id, isBoss, pool, bossDef.id, levelTotal);
    const lastType = pool[pool.length - 1];
    const nameEnemy = (defs.enemies.find((e) => e.id === lastType) || {}).name || enemies[0];
    const name = isBoss
      ? bossDef.name
      : nameEnemy + NAME_SUFFIX[(id - 1 + chIdx) % NAME_SUFFIX.length];
    levels.push({
      id,
      chapter: chIdx + 1,
      name,
      boss: isBoss,
      baseHp: Math.round(RAMP.baseHpMin + t * RAMP.baseHpSpan),
      startGold: Math.round(RAMP.startGold + (id - 1) * RAMP.startGoldPerLevel),
      summonCost: BOARD.summonCost,
      scale,
      waves,
    });
  }

  /* ---- 帮助文案 ---- */
  const help = {
    goal: `用「${currency}」召唤单位，两个同级合体升一级（最高 ${tiers.length} 级）；单位自动向中路来敌射击。敌人走到城门会扣基地耐久，耐久归零即失败，坚持到最后一波全灭就算通关。`,
    controls: [
      `点「召唤」：花 ${BOARD.summonCost} ${currency}，在随机空格生成 1 级单位`,
      '点一个单位选中（高亮），再点另一个同级单位 → 合体升级',
      '点选后点空位 / 不同级单位 → 交换位置；也能直接拖动单位',
      '点「出售」把选中的单位换回部分金币，用来腾格子',
    ],
    tips: [
      '合并永远是赚的：两个同级合成后攻击与射程都会变强',
      '上排格子离路更近，射程覆盖更远，优先把主力放上排',
      `金币只来自击杀：输出越高滚雪球越快，别把 ${currency} 一直攒着`,
      '棋盘满且暂时合不动时，先把低级单位卖掉腾格子',
      '星级看基地剩余耐久：掉血越少，结算星级越高',
      '每 5 关是 Boss 关（红色格子），留好高等级单位再开波',
    ],
  };

  return {
    slug: 'merge-dev',
    genre: meta.id,
    title: title || meta.name,
    subtitle: subtitle || '合成塔防 · 十格合成台',
    tagline: tagline || '两个同级合体升级，守住最后一道门',
    orientation: meta.orientation,
    config: { seed, maxLevel: levelTotal },
    theme: T,
    chapters,
    help,
    defs,
    levels,
    saveDefaults: {},
  };
}

/* ---------------------------- CLI：落盘 js/content.js ---------------------------- */
const isMain = (() => {
  try { return process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href; } catch (e) { return false; }
})();

if (isMain && process.argv.includes('--write')) {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const url = await import('node:url');
  const here = path.dirname(url.fileURLToPath(import.meta.url));
  const root = path.resolve(here, '..');
  let theme = null;
  for (const rel of ['../../theme-sample.mjs', '../theme-sample.mjs']) {
    try {
      const mod = await import(path.resolve(here, rel));
      theme = mod.JIANGSHI || mod.default || null;
      if (theme) break;
    } catch (e) { /* 尝试下一个 */ }
  }
  if (!theme) { console.error('未找到 theme-sample.mjs，无法生成 content.js'); process.exit(2); }
  const content = buildContent({
    theme,
    title: '合成合体',
    subtitle: '合成塔防 · 十格合成台',
    tagline: '两个同级合体升级，守住最后一道门',
    levelCount: meta.defaultLevels,
    seed: 20261127,
    brief: '合成 塔防 合体 守城',
  });
  const header = `/* =========================================================================
 * content.js —— 本作全部内容数据（主题 / 章节 / 关卡 / 单位与敌人）
 * 由 build/genre.mjs 生成：改了生成器就重跑  node build/genre.mjs --write
 * 也可以直接手改；改完重跑 tools/build-single.mjs 即可。
 * ========================================================================= */

`;
  fs.writeFileSync(path.join(root, 'js', 'content.js'), header + 'export const CONTENT = ' + JSON.stringify(content, null, 2) + ';\n');
  console.log(`✅ js/content.js 已写入：${content.levels.length} 关 / ${content.chapters.length} 章 / ${content.defs.tiers.length} 级单位 / ${content.defs.enemies.length} 种敌人`);
}
