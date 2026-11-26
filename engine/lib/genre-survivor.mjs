/* =========================================================================
 * build/genre.mjs —— survivor（割草生存）内容生成器
 *
 *   node build/genre.mjs --write              # 生成 js/content.js（开发用主题）
 *   node build/genre.mjs --json               # 打印内容 JSON
 *   node build/genre.mjs --write --levels 24 --seed 7
 *   node build/genre.mjs --write --theme ../theme-sample.mjs
 *
 * buildContent() 是纯函数：同样入参 → 同样输出；不读文件、不联网、不 Date.now。
 * 主题只从 theme.vocab / theme.palette 取名与配色，不硬编码题材。
 * ========================================================================= */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { RNG, hashString } from './core-hash.mjs';

export const meta = {
  id: 'survivor',
  name: '尸潮幸存者',
  orientation: 'landscape',
  defaultLevels: 24,
  tags: ['割草', '生存', '幸存者', '自动攻击', '升级', 'roguelite', 'survivor'],
  summary: '拖动走位、自动开火的割草生存：击杀爆经验，升级三选一，撑过倒计时并击退 Boss。',
  briefHints: ['幸存者', '割草', '生存', '自动攻击', '升级', '三选一', '尸潮', 'roguelite'],
};

/* 强化（upgrade）模板：名字由主题词库的 item 拼装，效果写在规则层。 */
const UPG = [
  { id: 'atk', icon: 'sword', short: '攻击', adj: '破煞', desc: '伤害 +22%', max: 9 },
  { id: 'rate', icon: 'bolt', short: '攻速', adj: '连珠', desc: '攻击间隔 -16%', max: 9 },
  { id: 'range', icon: 'ring', short: '范围', adj: '远照', desc: '射程 +14%', max: 6 },
  { id: 'hp', icon: 'heart', short: '生命', adj: '续命', desc: '生命上限 +25 并回复 25', max: 6 },
  { id: 'speed', icon: 'wing', short: '移速', adj: '踏风', desc: '移动速度 +10%', max: 6 },
  { id: 'multi', icon: 'split', short: '多弹', adj: '分光', desc: '同时攻击目标 +1', max: 5 },
  { id: 'pierce', icon: 'pierce', short: '穿透', adj: '穿云', desc: '弹道穿透 +1', max: 4 },
  { id: 'magnet', icon: 'magnet', short: '吸附', adj: '聚宝', desc: '拾取范围 +45', max: 4 },
];

const CHAPTER_NUM = ['一', '二', '三', '四', '五', '六', '七', '八'];
const LEVEL_TAG = ['初潮', '夜行', '围困', '血月', '绝境', '终焉', '余烬'];

function vocabOf(theme) {
  const vo = (theme && theme.vocab) || {};
  const pick = (k, d) => (Array.isArray(vo[k]) && vo[k].length ? vo[k] : d);
  return {
    hero: pick('hero', ['幸存者', '游侠', '行者', '术士']),
    enemy: pick('enemy', ['游魂', '疾影', '巨魔']),
    boss: pick('boss', ['魔王', '灾主']),
    item: pick('item', ['碎片', '符文', '护符', '灯']),
    place: pick('place', ['荒原', '废墟', '关隘', '深谷']),
    power: pick('power', ['星火', '雷光', '霜环']),
    currency: vo.currency || '金币',
  };
}

/* ------------------------------------------------------------------ */
/* 内容构建（纯函数）                                                   */
/* ------------------------------------------------------------------ */
export function buildContent({ theme = {}, title, subtitle, tagline, levelCount = 24, seed = 1, brief = '' } = {}) {
  const V = vocabOf(theme);
  const N = Math.max(6, Math.min(48, Math.round(levelCount) || 24));
  const rng = new RNG((seed >>> 0) * 2654435761 + hashString('survivor:' + N));
  const off = rng.int(0, 5); // 让 seed 影响名字排列
  const pal = theme.palette || {};

  const upgrades = UPG.map((u, i) => ({
    id: u.id,
    name: V.item[(i + off) % V.item.length] + '·' + u.adj,
    short: u.short,
    desc: u.desc,
    icon: u.icon,
    max: u.max,
  }));

  const defs = {
    player: {
      hp: 112, speed: 214, atk: 13, rate: 0.42, range: 430,
      projSpeed: 780, radius: 15, magnet: 112, xpBase: 4, xpGrow: 2.2,
    },
    upgrades,
    enemies: [
      { id: 'grunt', name: V.enemy[0], role: 'melee', hp: 15, speed: 58, atk: 8, radius: 14, xp: 1, scale: 1.16, xpDrop: 1 },
      { id: 'runner', name: V.enemy[1], role: 'melee', hp: 10, speed: 104, atk: 6, radius: 11, xp: 1, scale: 1.04, xpDrop: 1 },
      { id: 'brute', name: V.enemy[2] || V.enemy[0], role: 'melee', hp: 52, speed: 40, atk: 17, radius: 20, xp: 3, scale: 1.5, xpDrop: 3 },
    ],
    elite: { hpMul: 2.6, atkMul: 1.45, speedMul: 1.12, xp: 5, scaleMul: 1.3, suffix: '·精英' },
    gem: { value: 1, ttl: 30, magnetSpeed: 760 },
  };

  /* 关卡：4~6 章，每章 6 关；难度按 id 线性爬坡；每关末尾刷 Boss */
  const chapterCount = Math.max(1, Math.ceil(N / 6));
  const chapters = [];
  for (let c = 0; c < chapterCount; c++) {
    const place = V.place[(c + off) % V.place.length];
    chapters.push({ name: place + '·' + CHAPTER_NUM[c % CHAPTER_NUM.length], levels: [] });
  }

  const levels = [];
  for (let id = 1; id <= N; id++) {
    const ramp = (id - 1) / Math.max(1, N - 1);        // 0 → 1
    const chapter = Math.floor((id - 1) / 6) + 1;
    const hard = id % 5 === 0 || id === N;              // 难关（选关里标红）
    const duration = Math.round(92 + ramp * 64 + (hard ? 8 : 0));
    const bossAt = Math.max(30, duration - Math.round(28 - ramp * 8));
    const rate = +(0.8 + ramp * 0.8 + (hard ? 0.12 : 0)).toFixed(2);
    const types = id <= 2 ? ['grunt']
      : id <= 4 ? ['grunt', 'runner']
        : id <= 8 ? ['grunt', 'runner', 'brute']
          : ['grunt', 'grunt', 'runner', 'brute'];
    const place = V.place[(id + off) % V.place.length];
    const tag = LEVEL_TAG[((id - 1) * 3 + chapter) % LEVEL_TAG.length];
    const level = {
      id,
      chapter,
      name: place + '·' + tag,
      hard,
      boss: hard, // 选关高亮用（Boss 每关都有，见 bossName/bossHp）
      duration,
      bossAt,
      rate,
      rateEnd: +(2.3 + ramp * 2.7 + (hard ? 0.25 : 0)).toFixed(2),
      hpMul: +(0.68 + ramp * 0.1).toFixed(3),
      hpEnd: +(1.0 + ramp * 1.1).toFixed(3),
      atkMul: +(0.85 + ramp * 0.85).toFixed(3),
      speedMul: +(0.96 + ramp * 0.24).toFixed(3),
      elite: +(0.015 + ramp * 0.09 + (hard ? 0.025 : 0)).toFixed(3),
      cap: 88 + Math.round(ramp * 62),
      types,
      bossName: V.boss[(id - 1) % V.boss.length],
      bossHp: Math.round(1080 * (1 + ramp * 3.3) * (hard ? 1.12 : 1)),
      bossAtk: +(19 + ramp * 15).toFixed(1),
      bossSpeed: +(62 + ramp * 16).toFixed(1),
    };
    levels.push(level);
    chapters[chapter - 1].levels.push(id);
  }

  const help = {
    goal: `拖动走位、武器自动开火，在尸潮里活到倒计时归零。击杀掉经验宝石，升级时暂停三选一强化；每关最后刷出 Boss，活过倒计时即胜利（提前击杀 Boss 也能立刻结束）。`,
    controls: [
      '触屏：按住屏幕任意处拖动，角色朝拖动方向移动（虚拟摇杆）',
      '桌面：WASD / 方向键移动，也可以按住鼠标拖动',
      '自动攻击最近的敌人，不需要点攻击；升级时点击卡牌或按 1 / 2 / 3',
      'Esc / P 暂停（外壳按钮在右上角）',
    ],
    tips: [
      '先堆攻速与伤害，清怪速度就是生命；宝石要主动去捡',
      '被围住时朝敌人最稀的一侧跑，不要停在原地',
      'Boss 出现后绕圈风筝，贴脸会被连续打掉血',
    ],
  };

  const quote = (s) => String(s == null ? '' : s).trim();
  const content = {
    slug: 'survivor-dev',
    genre: meta.id,
    title: quote(title) || meta.name,
    subtitle: quote(subtitle) || (V.place[off % V.place.length] + ' · ' + chapterCount + ' 章 ' + N + ' 关'),
    tagline: quote(tagline) || '拖动走位 · 自动开火 · 活到最后',
    orientation: meta.orientation,
    config: { seed: seed >>> 0, maxLevel: N },
    theme: {
      id: theme.id || 'jiangshi',
      name: theme.name || '',
      mood: theme.mood || 'night',
      palette: {
        sky: (pal.sky && pal.sky.length >= 2) ? pal.sky : ['#0d1024', '#2a1633'],
        ground: pal.ground || '#3b2b3f', groundDark: pal.groundDark || '#211827',
        accent: pal.accent || '#ffcf5c', accent2: pal.accent2 || '#ff7a59',
        hero: pal.hero || '#8fd3ff', hero2: pal.hero2 || '#3f7ea8',
        enemy: pal.enemy || '#c85a6a', enemy2: pal.enemy2 || '#6f2436',
        gold: pal.gold || '#ffd76a', danger: pal.danger || '#ff5d5d',
        ok: pal.ok || '#62d68f', ui: pal.ui || 'rgba(14,18,32,.86)',
        ui2: pal.ui2 || 'rgba(255,255,255,.12)', ink: pal.ink || '#0d1024',
        text: pal.text || '#ffffff',
      },
      music: theme.music || { root: -9, scale: [0, 2, 4, 7, 9], tempo: 78 },
    },
    chapters,
    help,
    defs,
    levels,
    saveDefaults: {},
    brief: quote(brief),
  };
  return content;
}

/* ------------------------------------------------------------------ */
/* 校验：给仿真/构建前的自检用                                          */
/* ------------------------------------------------------------------ */
export function validateContent(c) {
  const errs = [];
  if (!c || !Array.isArray(c.levels) || !c.levels.length) errs.push('levels 为空');
  if (!c || !c.defs || !Array.isArray(c.defs.upgrades) || !Array.isArray(c.defs.enemies)) errs.push('defs 缺失');
  (c.levels || []).forEach((l, i) => {
    if (l.id !== i + 1) errs.push('关卡 id 不连续：' + l.id);
    if (!(l.duration > 0)) errs.push('关卡时长非法：' + l.id);
    if (!(l.bossAt > 0 && l.bossAt < l.duration)) errs.push('Boss 时间非法：' + l.id);
    if (!Array.isArray(l.types) || !l.types.length) errs.push('敌人类型为空：' + l.id);
    for (const k of ['rate', 'rateEnd', 'hpMul', 'atkMul', 'speedMul', 'elite', 'cap', 'bossHp', 'bossAtk', 'bossSpeed', 'bossName', 'name']) {
      if (l[k] === undefined || l[k] === null || (typeof l[k] === 'number' && !Number.isFinite(l[k]))) errs.push(`关卡 ${l.id} 字段 ${k} 非法`);
    }
  });
  if (!Array.isArray(c.chapters) || !c.chapters.length) errs.push('chapters 为空');
  return errs;
}

/* ------------------------------------------------------------------ */
/* CLI                                                                 */
/* ------------------------------------------------------------------ */
const IS_MAIN = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (IS_MAIN) {
  const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const argv = process.argv.slice(2);
  const has = (k) => argv.includes('--' + k);
  const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };

  async function themeFrom(p) {
    const file = p ? path.resolve(process.cwd(), p) : path.resolve(ROOT, '..', 'theme-sample.mjs');
    try {
      const mod = await import(pathToFileURL(file).href);
      const cand = mod.JIANGSHI || mod.SPACE || mod.default;
      if (cand && cand.palette && cand.vocab) return cand;
      const first = Object.values(mod).find((v) => v && v.palette && v.vocab);
      if (first) return first;
    } catch (e) { console.warn('主题载入失败，使用内置默认主题：', e.message); }
    return null;
  }

  const theme = await themeFrom(arg('theme', ''));
  const levels = parseInt(arg('levels', String(meta.defaultLevels)), 10) || meta.defaultLevels;
  const seed = parseInt(arg('seed', '20261127'), 10) || 20261127;
  const content = buildContent({ theme: theme || {}, levelCount: levels, seed, brief: arg('brief', '') });
  const errs = validateContent(content);
  if (errs.length) { console.error('内容校验失败：\n - ' + errs.join('\n - ')); process.exit(1); }
  if (has('json')) {
    console.log(JSON.stringify(content, null, 2));
  } else {
    const header = [
      '/* =========================================================================',
      ' * content.js —— 本作的全部内容数据（主题 / 章节 / 关卡 / 强化 / 敌人）。',
      ' * 由 build/genre.mjs 生成：node build/genre.mjs --write',
      ' * 生成器是纯函数 + 种子确定性；改主题/种子/关卡数后重跑即可。',
      ' * ========================================================================= */',
      '',
      'export const CONTENT = ',
    ].join('\n');
    const body = header + JSON.stringify(content, null, 2) + ';\n';
    const out = path.join(ROOT, 'js', 'content.js');
    if (has('write')) {
      fs.writeFileSync(out, body, 'utf8');
      const kb = (Buffer.byteLength(body) / 1024).toFixed(1);
      console.log(`✅ 已写入 js/content.js（${kb} KB，${content.levels.length} 关 / ${content.chapters.length} 章 / ${content.defs.upgrades.length} 强化 / ${content.defs.enemies.length} 敌人）`);
      console.log('   标题：' + content.title + ' — ' + content.tagline);
      console.log('   Boss 名：' + [...new Set(content.levels.map((l) => l.bossName))].join(' / '));
    } else {
      console.log(body);
    }
  }
}
