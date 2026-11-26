#!/usr/bin/env node
/* =========================================================================
 * build/genre.mjs —— 「放置经营」内容生成器（纯函数：同样入参 → 同样输出）
 *   buildContent({ theme, title, subtitle, tagline, levelCount, seed, brief })
 *   node build/genre.mjs --write        # 落盘 js/content.js
 *   node build/genre.mjs --json         # 打印内容 JSON
 *
 * 设计：所有金币量（成本/工资/租金/事件收益）乘以关卡经济倍率 econMul，
 *       使 24 关是「同一套经营模型 × 不同难度系数」的 30 天挑战；
 *       难度 = 目标占可达收益的比例（hard 0.52 → 0.86）+ 目标粉丝压力。
 * ========================================================================= */
import path from 'node:path';
import { fileURLToPath } from 'node:url';



/* 引擎内置兜底主题（仅在调用方未传 theme 时使用） */
const JIANGSHI = {
  id: 'jiangshi', name: '中式僵尸', mood: 'night',
  palette: { sky: ['#0d1024', '#2a1633'], ground: '#3b2b3f', groundDark: '#211827', accent: '#ffcf5c', accent2: '#ff7a59', hero: '#8fd3ff', hero2: '#3f7ea8', enemy: '#c85a6a', enemy2: '#6f2436', gold: '#ffd76a', danger: '#ff5d5d', ok: '#62d68f', ui: 'rgba(14,18,32,.86)', ui2: 'rgba(255,255,255,.12)', ink: '#0d1024', text: '#ffffff' },
  music: { root: -9, scale: [0, 2, 4, 7, 9], tempo: 78 },
  vocab: { hero: ['道童', '弩手', '法师', '医师', '剑客', '符师'], enemy: ['游尸', '跳尸', '铁尸', '巫尸', '尸傀', '飞僵'], boss: ['跳尸王', '血尸', '铜甲尸将', '飞僵将军'], building: ['草庐', '箭楼', '法阵', '医庐', '符箓堂', '天师殿'], item: ['铜钱', '符纸', '纸人', '糯米', '桃木剑', '铃铛', '灯笼', '罗盘'], place: ['荒村', '山门', '乱葬岗', '鬼市', '尸王殿', '后山'], power: ['天雷', '五雷正法', '三昧真火', '冰封', '回春', '符阵'], currency: '铜钱' },
};

export const meta = {
  id: 'idle',
  name: '放置经营',
  orientation: 'portrait',
  defaultLevels: 24,
  tags: ['放置', '模拟经营', '经营', 'idle', '员工', '天数循环', '升级'],
  summary: '30 天循环经营：招募员工、升级场地、上节目，日结收益，达标通关。',
  briefHints: ['放置', '经营', '模拟', '开店', '直播', '员工', '天数', '收益'],
};

/* 难度曲线（由 tools/sim 逐关实测「可达营业额/粉丝」拟合，econMul 已包含在实测值里）
 *   可达营业额  A(id) ≈ 4717 × 1.0854^(id-1)
 *   目标营业额  T(id) = 0.48 → 0.62 × A(id)（越往后越贴近上限）
 *   可达粉丝    F(id) ≈ 184 × 1.0795^(id-1)
 *   粉丝目标    = 0.48 → 0.57 × F(id)
 * 机器人实测余量 ≥ 1.28 倍，普通玩家有明确追赶空间。 */
const TARGET_BASE = 2320;
const TARGET_GROWTH = 1.08128;
const FAN_BASE = 100;
const FAN_GROWTH = 1.07601;
const HARD_SLOPE = 0.2727;  // 0.48（第1关）→ 0.62（末关）

const r2 = (v) => Math.round(v * 100) / 100;

export function buildContent({ theme, title, subtitle, tagline, levelCount = 24, seed = 1, brief = '' } = {}) {
  const th = theme || JIANGSHI;
  const V = th.vocab || JIANGSHI.vocab;
  const palette = th.palette || JIANGSHI.palette;
  const hero = V.hero && V.hero.length ? V.hero : JIANGSHI.vocab.hero;
  const building = V.building && V.building.length ? V.building : JIANGSHI.vocab.building;
  const power = V.power && V.power.length ? V.power : JIANGSHI.vocab.power;
  const place = V.place && V.place.length ? V.place : JIANGSHI.vocab.place;
  const item = V.item && V.item.length ? V.item : JIANGSHI.vocab.item;
  const CUR = V.currency || '金币';

  /* ---------- 员工（主题 hero 名词 = 员工名） ---------- */
  const roles = [
    { id: 'staff', name: hero[0 % hero.length], cost: 38, rate: 3.0, fans: 0.24, wage: 3, role: 'melee', color: palette.hero, desc: '基础店员，便宜稳产' },
    { id: 'host', name: hero[1 % hero.length], cost: 88, rate: 3.4, fans: 1.05, wage: 6, role: 'ranged', color: palette.accent, desc: '前台主播，粉丝增长快' },
    { id: 'tech', name: hero[2 % hero.length], cost: 152, rate: 5.8, fans: 0.46, wage: 9, role: 'mage', color: palette.accent2, desc: '技术骨干，单人产出最高' },
    { id: 'star', name: hero[3 % hero.length], cost: 268, rate: 8.8, fans: 0.80, wage: 15, role: 'tank', color: palette.gold, desc: '明星大咖，产出粉丝全能' },
  ];

  /* ---------- 场地（主题 building 名词 = 场地，逐级加容量/单价） ---------- */
  const venues = [
    { name: building[0 % building.length], cap: 2, price: 1.00, rent: 8, upCost: 120, base: 2.0 },
    { name: building[1 % building.length], cap: 3, price: 1.14, rent: 15, upCost: 210, base: 3.0 },
    { name: building[2 % building.length], cap: 4, price: 1.30, rent: 24, upCost: 360, base: 4.0 },
    { name: building[3 % building.length], cap: 5, price: 1.48, rent: 36, upCost: 600, base: 5.0 },
    { name: building[4 % building.length], cap: 6, price: 1.68, rent: 52, upCost: 0, base: 6.0 },
  ];

  /* ---------- 节目（主题 power 名词 = 技能/节目，每日可选一次） ---------- */
  const shows = [
    { id: 'boom', name: power[0 % power.length], cost: 40, incomeMul: 1.75, fansMul: 1.0, desc: '今日收入 ×1.75' },
    { id: 'live', name: power[1 % power.length], cost: 34, incomeMul: 1.0, fansMul: 2.2, desc: '今日粉丝 ×2.2' },
    { id: 'party', name: power[2 % power.length], cost: 58, incomeMul: 1.25, fansMul: 1.4, wageFree: 1, desc: '收入 ×1.25、粉丝 ×1.4、免当日工资' },
  ];

  /* ---------- 随机事件（二选一，收益量随 econMul 缩放） ---------- */
  const events = [
    {
      id: 'rush', title: '旺季客流', text: '街上人潮涌来，怎么接？',
      opts: [
        { label: '加价收割', coins: 42, fans: -10, ap: 0 },
        { label: '薄利涨粉', coins: 10, fans: 30, ap: 0 },
      ],
    },
    {
      id: 'viral', title: '网红探店', text: '一位博主上门，要合作吗？',
      opts: [
        { label: '请他直播', coins: -36, fans: 20, incomeMul: 1.5, ap: 0 },
        { label: '婉拒送礼', coins: -12, fans: 8, ap: 1 },
      ],
    },
    {
      id: 'rain', title: '暴雨停电', text: '设备跳闸，只能二选一。',
      opts: [
        { label: '花钱抢修', coins: -40, incomeMul: 1.2, ap: 0 },
        { label: '提前歇业', coins: 0, fans: -8, ap: 1 },
      ],
    },
    {
      id: 'supplier', title: '供货商来访', text: `一批${item[0 % item.length]}低价出，吃下吗？`,
      opts: [
        { label: '整批吃下', coins: -50, fans: 6, incomeMul: 1.45, ap: 0 },
        { label: '只要样品', coins: 6, fans: 14, ap: 0 },
      ],
    },
    {
      id: 'rival', title: '同行挖人', text: '隔壁店想挖你的员工，怎么谈？',
      opts: [
        { label: '加薪留人', coins: -30, fans: 12, incomeMul: 1.15, ap: 0 },
        { label: '放人拿补偿', coins: 55, fans: -14, ap: 0 },
      ],
    },
    {
      id: 'festival', title: '节日庆典', text: '要不要报名参加市集？',
      opts: [
        { label: '摊费换客流', coins: -28, fans: 26, incomeMul: 1.3, ap: 0 },
        { label: '留店稳经营', coins: 16, fans: 0, ap: 1 },
      ],
    },
  ];

  const levels = buildLevels({ levelCount, seed, place, roles, venues, shows });
  const chapters = buildChapters(levelCount, place);

  return {
    slug: 'idle-dev',
    genre: meta.id,
    title: title || '三十天开张',
    subtitle: subtitle || `${CUR}与粉丝的三十天`,
    tagline: tagline || '招人、升级、上节目：30 天把生意做起来',
    orientation: meta.orientation,
    config: { seed, maxLevel: levelCount },
    theme: { id: th.id, name: th.name, mood: th.mood, palette, music: th.music, vocab: V },
    chapters,
    help: {
      goal: `30 天为一轮：每天花行动点招人或升级，点「开始营业」结算当日收益。第 30 天结束时，${CUR}与粉丝都达到目标即通关；中途发不出工资或租金就算破产失败。`,
      controls: [
        '点员工卡「招募」：花行动点 + 铜钱雇人，自动产出',
        '点下方员工头像：花行动点 + 铜钱升级（最高 Lv.5）',
        '点「升级场地」：加容量、加单价，但每日租金变高',
        '点节目按钮：当天收入/粉丝加成（每天限一次）',
        '点「开始营业」进入当日结算，结算面板里点「下一天」继续',
      ],
      tips: [
        '前 3 天先招满场地容量，收入才会滚起来',
        '留足第二天的工资与租金，欠费会直接破产',
        '粉丝越多收入越高（上限 +90%），主播值得早招',
        '节目只在当天生效，安排在能回本的日子',
        '第 30 天结算后才判定胜负，最后几天别再乱花钱',
        '星级看营业额超出目标的幅度：超 8% 两星、超 22% 三星',
        '键盘：空格=营业/下一天，1~4=招募，U=升级场地',
      ],
    },
    defs: { roles, venues, shows, events },
    levels,
    saveDefaults: { seenIntro: false },
  };
}

/* ---------- 关卡：24 关 = 同一经营模型 × 难度系数 ---------- */
function buildLevels({ levelCount, seed, place, roles, venues, shows }) {
  const fixed = {
    days: 30,
    ap: 2,
    bizSeconds: 3.2,
    roles, venues, shows,
  };
  const suffixes = ['开张', '夜市', '旺季', '淡季', '庆典', '分号'];
  const out = [];
  for (let id = 1; id <= levelCount; id++) {
    const t = levelCount > 1 ? (id - 1) / (levelCount - 1) : 0;
    const econMul = r2(1 + 0.05 * (id - 1));                       // 1.00 → 2.15（金币量缩放）
    const hard = 1 + HARD_SLOPE * t;                                // 0.48 → 0.66（目标/可达）
    const boss = id % 5 === 0 || id === levelCount;
    const startCoins = Math.round((80 + 10 * (id - 1)) * econMul);
    const target = Math.round(TARGET_BASE * TARGET_GROWTH ** (id - 1) * hard * (boss ? 1.04 : 1));
    const fanHard = 1 + 0.2364 * t;
    const fanTarget = Math.round(FAN_BASE * FAN_GROWTH ** (id - 1) * fanHard * (boss ? 1.03 : 1));
    const evDays = eventDays(seed, id, fixed.days);
    const n = id - 1;
    const p = place[(n * 5 + Math.floor(n / 6)) % place.length];
    out.push({
      id,
      chapter: Math.min(6, Math.ceil(id / Math.ceil(levelCount / 6))),
      name: `${p}${suffixes[n % suffixes.length]}`.slice(0, 5),
      days: fixed.days,
      ap: fixed.ap,
      bizSeconds: fixed.bizSeconds,
      econMul,
      startCoins,
      target,
      fanTarget,
      eventDays: evDays,
      boss,
      scale: { target: +hard.toFixed(3), fan: +fanTarget.toFixed(0) },
    });
  }
  return out;
}

function eventDays(seed, id, days) {
  // 固定 6/12/18/24/30 天必来事件，再按 (seed,id) 确定性插入 1~3 个
  const set = new Set([6, 12, 18, 24, 30].filter((d) => d <= days));
  let a = (seed >>> 0) ^ Math.imul(id, 2654435761);
  const rnd = () => { a = (Math.imul(a ^ (a >>> 13), 1274126177) + 1013904223) >>> 0; return a / 4294967296; };
  const extra = 1 + Math.floor(rnd() * 3);
  for (let k = 0; k < extra; k++) {
    const d = 3 + Math.floor(rnd() * (days - 4));
    set.add(d);
  }
  return [...set].sort((x, y) => x - y);
}

function buildChapters(levelCount, place) {
  const per = Math.ceil(levelCount / 6);
  const names = [0, 1, 2, 3, 4, 5].map((i) => `${place[i % place.length]}篇`);
  const chapters = [];
  for (let i = 0; i < 6; i++) {
    const ids = [];
    for (let id = i * per + 1; id <= Math.min(levelCount, (i + 1) * per); id++) ids.push(id);
    if (ids.length) chapters.push({ name: names[i], levels: ids });
  }
  return chapters;
}

/* ============================== CLI ============================== */
const IS_MAIN = (() => {
  try { return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url); }
  catch (e) { return false; }
})();
if (IS_MAIN) {
  const argv = process.argv.slice(2);
  const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
  const seed = parseInt(arg('seed', '20261127'), 10);
  const levelCount = parseInt(arg('levels', String(meta.defaultLevels)), 10);
  const content = buildContent({
    theme: JIANGSHI, title: '三十天开张', subtitle: '铜钱与粉丝的三十天',
    tagline: '招人、升级、上节目：30 天把生意做起来', levelCount, seed,
  });
  if (argv.includes('--json')) {
    console.log(JSON.stringify(content, null, 2));
  } else if (argv.includes('--write')) {
    const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    const file = path.join(ROOT, 'js', 'content.js');
    const header = `/* =========================================================================
 * content.js —— 本作全部内容数据（由 build/genre.mjs 生成，可直接手改后重跑）
 *   生成命令：node build/genre.mjs --write
 *   主题：${content.theme.id} · 关卡：${levelCount} · seed：${seed}
 * ========================================================================= */
`;
    const body = `export const CONTENT = ${JSON.stringify(content, null, 2)};\n`;
    const { writeFileSync } = await import('node:fs');
    writeFileSync(file, header + body, 'utf8');
    console.log(`✅ 已写入 js/content.js（${levelCount} 关，${(header + body).length} 字节）`);
    console.log(`   目标曲线：第1关 ${content.levels[0].target} → 第${levelCount}关 ${content.levels[levelCount - 1].target}`);
  } else {
    console.log('用法：node build/genre.mjs --write [--seed 1] [--levels 24] | --json');
  }
}
