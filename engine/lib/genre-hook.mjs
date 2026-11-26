#!/usr/bin/env node
/* =========================================================================
 * build/genre.mjs —— 「钩爪打捞」内容生成器
 *
 * 用法：
 *   node build/genre.mjs --write     把生成结果写成 js/content.js（静态可读）
 *   node build/genre.mjs --preview   打印关卡表（调试用）
 *
 * 契约：buildContent({ theme, title, subtitle, tagline, levelCount, seed, brief })
 *   - 纯函数：同样入参 → 同样输出；不读文件 / 不联网 / 不取时间
 *   - 物件名与分值档位全部取自 theme.vocab.item
 *   - 关卡难度、时间、目标分、危险物密度、稀有宝物概率按 24 关递进
 * ========================================================================= */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const meta = {
  id: 'hook',
  name: '钩爪打捞',
  orientation: 'portrait',
  defaultLevels: 24,
  tags: ['钩爪', '打捞', '黄金矿工', '瞄准', '升级', 'hook', 'crane', 'treasure'],
  summary: '摆动钩爪捞取海底宝物，重物回收更慢，避开危险物，限时达标并在关卡间升级钩爪。',
  briefHints: ['钩爪', '打捞', '抓取', '黄金矿工', '捞宝', '宝藏'],
};

/* ------------------------------------------------------------------------
 * 开发用主题（引擎会注入真实主题；本地构建/仿真用这套深海配色）
 * --------------------------------------------------------------------- */
export const DEV_THEME = {
  id: 'undersea', name: '深海打捞', mood: 'underwater',
  palette: {
    sky: ['#0a3a4d', '#062033'],
    ground: '#2a4a56', groundDark: '#12262f',
    accent: '#5ce1ff', accent2: '#ffb36b',
    hero: '#9fe8ff', hero2: '#3f8fb8',
    enemy: '#7fd6c1', enemy2: '#2b6d66',
    gold: '#ffd76a', danger: '#ff6b6b', ok: '#5cffb0',
    ui: 'rgba(6,22,32,.86)', ui2: 'rgba(150,230,255,.14)', ink: '#04121c', text: '#ffffff',
  },
  music: { root: -14, scale: [0, 3, 5, 7, 10], tempo: 84 },
  vocab: {
    hero: ['捞宝人', '潜水员', '老船长', '钩手', '水手', '潜工'],
    enemy: ['电水母', '尖刺鱼', '海蛇', '毒藻', '寄居蟹', '深海鳗'],
    boss: ['沉船守卫', '巨章鱼', '海沟领主', '光鳗王'],
    building: ['木筏', '吊机', '绞盘', '灯塔', '渔屋', '码头'],
    item: ['珍珠', '珊瑚', '铜铃', '海螺', '琥珀', '玉璧', '金锚', '龙珠'],
    place: ['近海', '珊瑚湾', '沉船带', '海沟', '暗礁', '深渊'],
    power: ['漩涡', '暗流', '水雷', '鱼雷', '巨浪', '潮汐'],
    currency: '金币',
  },
};

/* ------------------------- 确定性随机（纯函数） ------------------------- */
function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(a) {
  let x = a >>> 0;
  return function () {
    x = (x + 0x6D2B79F5) | 0;
    let t = Math.imul(x ^ (x >>> 15), 1 | x);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------- 分值档位 ------------------------- */
const TIER_DEF = [
  { tier: 0, value: 26, weight: 0.5, r: 20, tag: '轻', shapes: ['coin', 'crystal', 'shell'], color: 'gold' },
  { tier: 1, value: 68, weight: 1.1, r: 23, tag: '中', shapes: ['gem', 'pearl'], color: 'accent' },
  { tier: 2, value: 165, weight: 2.0, r: 27, tag: '重', shapes: ['urn', 'chest'], color: 'hero' },
  { tier: 3, value: 380, weight: 2.4, r: 31, tag: '珍', shapes: ['crown', 'orb'], color: 'ok' },
];
const tierOfIndex = (i, n) => (i < n * 0.25 ? 0 : i < n * 0.5 ? 1 : i < n * 0.78 ? 2 : 3);

/* 物件名 + 分值档位：全部来自 theme.vocab.item */
function buildItemDefs(vocabItem) {
  const names = vocabItem;
  const n = names.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const tier = tierOfIndex(i, n);
    const T = TIER_DEF[tier];
    out.push({
      id: 'i' + i,
      name: names[i],
      tier,
      tag: T.tag,
      value: T.value,
      weight: T.weight,
      r: T.r,
      shape: T.shapes[i % T.shapes.length],
      color: T.color,
    });
  }
  return out;
}

/* 危险物：废品（小扣分）/ 爆弹（大扣分+眩晕）/ 危险生物（中扣分） */
function buildHazardDefs(vocabItem, vocabEnemy) {
  const it = (i) => vocabItem[i % vocabItem.length];
  const en = (i) => vocabEnemy[i % vocabEnemy.length];
  return [
    { id: 'j0', name: '废旧' + it(0), kind: 'junk', value: -12, weight: 1.5, r: 21, shape: 'rubble', color: 'ground' },
    { id: 'j1', name: '废旧' + it(3), kind: 'junk', value: -16, weight: 1.6, r: 21, shape: 'rubble', color: 'ground' },
    { id: 'b0', name: '爆裂' + it(2), kind: 'bomb', value: -78, weight: 2.0, r: 25, shape: 'bomb', color: 'danger' },
    { id: 'b1', name: '爆裂' + it(5), kind: 'bomb', value: -92, weight: 2.2, r: 25, shape: 'bomb', color: 'danger' },
    { id: 'c0', name: en(0), kind: 'beast', value: -58, weight: 1.7, r: 24, shape: 'spike', color: 'enemy' },
    { id: 'c1', name: en(1), kind: 'beast', value: -66, weight: 1.8, r: 24, shape: 'spike', color: 'enemy' },
  ];
}

/* 四条升级线（关卡间商店） */
function buildUpgrades(currency) {
  return [
    { id: 'power', name: '钩爪力度', desc: '发射更快，重物拉得更省力', base: 90, growth: 1.6, max: 5, color: 'accent2' },
    { id: 'reel', name: '回收绞盘', desc: '收绳更快，每趟更省时间', base: 80, growth: 1.6, max: 5, color: 'hero' },
    { id: 'aim', name: '瞄准精度', desc: '摆钩更稳，发射带轻微吸附', base: 100, growth: 1.6, max: 5, color: 'ok' },
    { id: 'luck', name: '潮汐幸运', desc: '稀有宝物出现概率提升', base: 120, growth: 1.6, max: 5, color: 'gold' },
  ].map((u) => ({ ...u, costUnit: currency }));
}

/* ------------------------- 关卡生成 ------------------------- */
function buildLevels({ count, vocab, seed, currency }) {
  const nameRnd = mulberry32(hashString('hook:' + seed + ':' + count));
  const nameOffset = (nameRnd() * vocab.item.length) | 0;   // 种子决定的取名起点
  const places = vocab.place;
  const names = vocab.item;
  const out = [];
  const hardEvery = 4;      // 每章 4 关，章末是难关
  for (let id = 1; id <= count; id++) {
    const ramp = count > 1 ? (id - 1) / (count - 1) : 0;
    const hard = id % hardEvery === 0;
    const chapter = Math.min(6, Math.ceil(id / hardEvery));
    const place = places[(chapter - 1) % places.length];
    const itemName = names[(id - 1 + nameOffset) % names.length];
    const sec = Math.round(62 + (id - 1) * 1.8);                 // 62 ~ 103 秒
    const total = Math.round(32 + (id - 1) * 0.61);              // 32 ~ 46 个物件
    const hazard = +(0.13 + ramp * 0.13 + (hard ? 0.04 : 0)).toFixed(3); // 危险物密度 13% → 30%
    const bomb = +(0.34 + ramp * 0.16).toFixed(3);               // 危险物里爆弹占比
    const tiers = [
      +(0.52 - ramp * 0.19).toFixed(3),   // 轻
      +(0.30).toFixed(3),                 // 中
      +(0.14 + ramp * 0.11).toFixed(3),   // 重
      +(0.04 + ramp * 0.08).toFixed(3),   // 珍
    ];
    const valueScale = +(1 + ramp * 0.55).toFixed(3);
    const avgValue = TIER_DEF.reduce((s, T, i) => s + tiers[i] * T.value, 0) * valueScale;
    const posN = total * (1 - hazard);
    const E = posN * avgValue;                                             // 盘面正面总价值（期望）
    const target = Math.round((E * (0.54 + ramp * 0.06 + (hard ? 0.04 : 0))) / 10) * 10;
    const star2 = Math.max(target + 10, Math.round((E * 0.72) / 10) * 10);
    const star3 = Math.max(star2 + 10, Math.round((E * 0.86) / 10) * 10);
    out.push({
      id,
      chapter,
      name: place + '·' + itemName,
      sec,
      target,
      star2,
      star3,
      items: total,
      tiers,
      hazard,
      bomb,
      valueScale,
      hard,
      boss: hard,
    });
  }
  return out;
}

function buildChapters(levels, vocab) {
  const places = vocab.place;
  const map = new Map();
  for (const lv of levels) {
    if (!map.has(lv.chapter)) map.set(lv.chapter, []);
    map.get(lv.chapter).push(lv.id);
  }
  const out = [];
  for (const [ch, ids] of [...map.entries()].sort((a, b) => a[0] - b[0])) {
    const place = places[(ch - 1) % places.length];
    out.push({ name: place, levels: ids });
  }
  return out;
}

/* ------------------------- 主入口 ------------------------- */
export function buildContent({ theme, title, subtitle, tagline, levelCount = 24, seed = 1, brief = '' } = {}) {
  const th = theme || DEV_THEME;
  const vocabRaw = th.vocab || {};
  const pick = (arr, fb) => (Array.isArray(arr) && arr.length >= 2 ? arr.slice() : fb);
  const vocab = {
    item: pick(vocabRaw.item, ['珍珠', '珊瑚', '铜铃', '海螺', '琥珀', '玉璧', '金锚', '龙珠']),
    enemy: pick(vocabRaw.enemy, ['电水母', '尖刺鱼']),
    place: pick(vocabRaw.place, ['近海', '珊瑚湾', '沉船带', '海沟']),
    currency: vocabRaw.currency || '金币',
  };
  if (vocab.item.length < 4) vocab.item = vocab.item.concat(['珍珠', '珊瑚', '海螺', '玉璧']).slice(0, 4);

  const count = Math.max(6, Math.min(48, levelCount | 0));
  const items = buildItemDefs(vocab.item);
  const hazards = buildHazardDefs(vocab.item, vocab.enemy);
  const upgrades = buildUpgrades(vocab.currency);
  const levels = buildLevels({ count, vocab, seed });
  const chapters = buildChapters(levels, vocab);
  const cur = vocab.currency;

  return {
    slug: 'hook',
    genre: meta.id,
    title: title || meta.name,
    subtitle: subtitle || '深海木筏 · 钩爪捞宝',
    tagline: tagline || '摆钩下潜，捞宝避雷，限时达标',
    orientation: meta.orientation,
    config: { seed, maxLevel: count },
    theme: th,
    chapters,
    help: {
      goal: '站在海底木筏上摆动钩爪，把水里的宝物抓回来。每关限时，得分达到目标分即过关；提前达标可点底部收工按钮结算，剩下的时间继续捞可以拿更高星级。',
      controls: [
        '点击屏幕 / 空格：沿当前摆动方向发射钩爪',
        '抓到宝物加分；越重的宝物回收越慢',
        `危险物（废旧/爆裂/危险生物）会扣分，抓到爆弹还会短暂僵直`,
        `关卡开始前可以用${cur}升级：力度 / 绞盘 / 瞄准 / 幸运`,
      ],
      tips: [
        '摆到目标正上方再出手，斜着打绳子更长、回得更慢',
        '先把目标分稳住，再用富余时间捞重宝冲三星',
        '重宝在深水（画面更上方），要留足回收时间',
      ],
    },
    defs: {
      items,
      hazards,
      upgrades,
      economy: {
        startCoins: 160,
        winBase: 34,
        winPerLevel: 5,
        starBonus: 16,
        scoreCoins: 0.02,
      },
      tiers: TIER_DEF.map((T) => ({ tier: T.tier, tag: T.tag, value: T.value, weight: T.weight, r: T.r })),
    },
    levels,
    resultKillLabel: '捞取',
    saveDefaults: {
      coins: 160,
      upgrades: { power: 0, reel: 0, aim: 0, luck: 0 },
    },
  };
}

/* ------------------------- CLI ------------------------- */
const IS_MAIN = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (IS_MAIN) {
  const write = process.argv.includes('--write');
  const preview = process.argv.includes('--preview');
  const content = buildContent({
    theme: DEV_THEME,
    title: '钩爪打捞',
    subtitle: '深海木筏 · 钩爪捞宝',
    tagline: '摆钩下潜，捞宝避雷，限时达标',
    levelCount: meta.defaultLevels,
    seed: 20261127,
  });
  const header = `/* =========================================================================
 * content.js —— 「${content.title}」全部内容数据：主题、章节、关卡、宝物/危险物/升级。
 * 由 build/genre.mjs 生成（node build/genre.mjs --write），可直接手改。
 * ========================================================================= */

export const CONTENT = `;
  const body = JSON.stringify(content, null, 2);
  const out = header + body + ';\n';
  const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const target = path.join(ROOT, 'js', 'content.js');
  if (write) {
    fs.writeFileSync(target, out, 'utf8');
    const kb = (Buffer.byteLength(out) / 1024).toFixed(1);
    console.log(`✅ 写入 js/content.js（${kb} KB）：${content.levels.length} 关 / ${content.chapters.length} 章`);
    for (const lv of content.levels) {
      console.log(`  #${String(lv.id).padStart(2)} ${lv.name.padEnd(8)} ${String(lv.sec).padStart(3)}s 目标 ${String(lv.target).padStart(5)} ★2 ${String(lv.star2).padStart(5)} ★3 ${String(lv.star3).padStart(5)} 物件 ${lv.items} 危险 ${(lv.hazard * 100).toFixed(0)}% 价值×${lv.valueScale}`);
    }
  } else if (preview) {
    console.log(JSON.stringify(content.levels, null, 2));
  } else {
    console.log(out.slice(0, 1200) + '\n…');
    console.log('提示：加 --write 落盘 js/content.js');
  }
}
