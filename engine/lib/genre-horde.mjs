/* =========================================================================
 * genre-horde.mjs —— 基因 horde（增量自走塔防）的内容生成器
 * 纯函数：buildContent({theme,title,subtitle,tagline,levelCount,seed,brief})
 * ========================================================================= */

export const meta = {
  id: 'horde',
  name: '自走塔防',
  orientation: 'landscape',
  defaultLevels: 30,
  tags: ['塔防', '自走', '造兵', '守家', '对抗', '进攻', '造建筑', '防守', 'tower', 'defense', 'auto-battle', 'idle-battle'],
  summary: '造屋自动派兵，与来敌在一条战线上对冲；铜钱滚雪球，法术救场。',
  briefHints: ['塔防', '守家', '造兵', '对冲', '自走', '防守', '攻城', '围城'],
  titleSuffixes: ['围城', '守卫战', '大作战', '防线', '兵临城下'],
};

const PLACE_SUFFIX = ['前线', '夜', '哨站', '山谷', '桥头', '关隘', '废墟', '阵地', '入口', '深处', '最后防线', '决战'];
function levelName(theme, id, isBoss, bossName) {
  const place = theme.vocab.place[(id - 1) % theme.vocab.place.length];
  const suf = PLACE_SUFFIX[(id - 1) % PLACE_SUFFIX.length];
  return isBoss ? bossName : place + suf;
}

export function buildContent({ theme, title, subtitle, tagline, levelCount = 30, seed = 1, brief = '' }) {
  const v = theme.vocab;
  const levels = buildLevels(levelCount, theme, seed);
  const chapterCount = Math.max(3, Math.min(6, Math.round(levelCount / 6)));
  const per = Math.ceil(levelCount / chapterCount);
  const chapters = [];
  for (let c = 0; c < chapterCount; c++) {
    const ids = [];
    for (let i = c * per + 1; i <= Math.min(levelCount, (c + 1) * per); i++) ids.push(i);
    if (ids.length) chapters.push({ name: v.place[c % v.place.length], levels: ids });
  }
  const cur = v.currency;
  return {
    slug: 'horde-' + (seed >>> 0).toString(36),
    genre: meta.id,
    title: title || `${v.place[0]}${meta.titleSuffixes[0]}`,
    subtitle: subtitle || `${v.place[0]} · ${v.hero[0]}的守夜`,
    tagline: tagline || '造屋派兵，千军对冲，守到最后一波',
    orientation: meta.orientation,
    config: { seed, maxLevel: levelCount },
    theme,
    chapters,
    help: {
      goal: `造屋自动派兵，挡住从右侧涌来的${v.enemy[0]}潮，守住山门。漏怪会啃山门，耐久归零就失败。`,
      controls: [
        `点击下方建筑卡：消耗${cur}建造；再点同类型卡片升级`,
        `点击右下角法术图标，再点战场释放（${v.power[0]} / ${v.power[1]} / ${v.power[2]}）`,
        `击杀敌人获得${cur}，通关获得星级`,
      ],
      tips: [`前排先造${v.building[0]}扛线，后排${v.building[1]}与${v.building[2]}输出`, `${cur}优先升 1~2 个主力建筑，别摊太薄`, 'Boss 波留好大招与急救'],
    },
    defs: buildDefs(theme),
    levels,
    saveDefaults: {},
  };
}

function shortName(name, fallback) {
  const n = String(name || fallback || '技能');
  return n.length > 3 ? n.slice(0, 2) : n;
}

function buildDefs(theme) {
  const v = theme.vocab;
  return {
    buildings: [
      { id: 'barracks', name: v.building[0] || '兵营', role: 'melee', cost: 60, interval: 4.2, desc: '派出近战单位' },
      { id: 'archery', name: v.building[1] || '箭塔', role: 'ranged', cost: 80, interval: 4.6, desc: '远程持续输出' },
      { id: 'mage', name: v.building[2] || '法阵', role: 'mage', cost: 110, interval: 5.6, desc: '范围伤害' },
      { id: 'heal', name: v.building[3] || '医庐', role: 'heal', cost: 90, interval: 6.0, desc: '治疗前排单位' },
    ],
    units: [
      { role: 'melee', name: v.hero[0] || '战士', hp: 62, atk: 13, range: 26, cd: 0.75, speed: 62, radius: 11 },
      { role: 'ranged', name: v.hero[1] || '弓手', hp: 42, atk: 11, range: 190, cd: 0.95, speed: 52, radius: 10 },
      { role: 'mage', name: v.hero[2] || '法师', hp: 38, atk: 19, range: 165, cd: 1.5, speed: 46, radius: 10, aoe: 46 },
      { role: 'heal', name: v.hero[3] || '医师', hp: 46, atk: 0, range: 150, cd: 1.4, speed: 48, radius: 10, heal: 16 },
    ],
    enemies: [
      { id: 'walker', name: v.enemy[0] || '小怪', hp: 52, atk: 9, speed: 34, range: 24, cd: 0.9, gold: 7, radius: 11 },
      { id: 'runner', name: v.enemy[1] || '快怪', hp: 34, atk: 8, speed: 66, range: 22, cd: 0.8, gold: 8, radius: 10 },
      { id: 'brute', name: v.enemy[2] || '重甲', hp: 150, atk: 18, speed: 24, range: 26, cd: 1.1, gold: 18, radius: 15 },
      { id: 'boss', name: v.boss[0] || '首领', hp: 900, atk: 34, speed: 22, range: 34, cd: 1.2, gold: 120, radius: 22, boss: true },
    ],
    spells: [
      { id: 'thunder', name: shortName(v.power[0], '天雷'), cd: 15, radius: 132, dmg: 95, unlock: 1 },
      { id: 'frost', name: shortName(v.power[1], '冰封'), cd: 20, radius: 150, dmg: 26, slow: 0.45, slowT: 3.2, unlock: 4 },
      { id: 'heal', name: shortName(v.power[2], '急救'), cd: 24, radius: 9999, heal: 45, unlock: 7 },
    ],
  };
}

/* 关卡生成：难度爬坡 + 每 5 关 Boss；seed 只影响细节抖动，不影响可通关性 */
function buildLevels(count, theme, seed) {
  const out = [];
  const bossNames = theme.vocab.boss;
  for (let id = 1; id <= count; id++) {
    const isBoss = id % 5 === 0;
    const ramp = (id - 1) / Math.max(1, count - 1);
    const hpScale = 0.82 + ramp * 1.15 + (isBoss ? 0.12 : 0);
    const atkScale = 0.85 + ramp * 0.85;
    const speedScale = 0.95 + ramp * 0.22;
    const waveCount = id <= 4 ? 3 : id <= count * 0.4 ? 4 : id <= count * 0.75 ? 5 : 6;
    const poolDepth = Math.min(4, 1 + Math.floor((id - 1) / Math.max(1, count / 3)));
    const pool = ['walker', 'runner', 'brute'].slice(0, Math.min(3, poolDepth + 1));
    const waves = [];
    for (let w = 0; w < waveCount; w++) {
      const t = 5 + w * (id <= 6 ? 13 : 15);
      const countN = Math.round((3 + w * 1.6 + id * 0.16));
      const groups = [];
      const nTypes = Math.min(pool.length, 1 + Math.floor(w / 2) + (id > count * 0.4 ? 1 : 0));
      for (let g = 0; g < nTypes; g++) {
        const type = pool[(w + g) % pool.length];
        groups.push({ type, count: Math.max(2, Math.round(countN / nTypes)), gap: 0.85, delay: g * 2.2 });
      }
      waves.push({ at: t, groups });
    }
    if (isBoss) waves.push({ at: 5 + waveCount * (id <= 6 ? 13 : 15), groups: [{ type: 'boss', count: 1, gap: 1, delay: 0 }], boss: true });
    out.push({
      id,
      chapter: Math.min(6, Math.ceil(id / Math.ceil(count / 6))),
      name: levelName(theme, id, isBoss, bossNames[Math.min(bossNames.length - 1, Math.floor(id / 5) - 1)] || '首领'),
      startGold: id <= 3 ? 150 : id <= 10 ? 175 : 200,
      baseHp: 120,
      scale: { hp: +hpScale.toFixed(3), atk: +atkScale.toFixed(3), speed: +speedScale.toFixed(3) },
      waves,
      boss: isBoss,
    });
  }
  return out;
}
