/* =========================================================================
 * genres.mjs —— 基因注册表：静态元数据 + 动态加载内容生成器
 * ========================================================================= */

export const GENRE_META = {
  horde: {
    id: 'horde', name: '自走塔防', orientation: 'landscape', defaultLevels: 30,
    tags: ['塔防', '自走', '造兵', '守家', '对冲', '防守', '攻城', '围城', 'tower', 'defense', 'auto-battle'],
    hints: ['塔防', '守家', '造兵', '对冲', '自走', '防守', '攻城', '围城', '保卫'],
    suffixes: ['围城', '守卫战', '大作战', '防线', '兵临城下'],
    summary: '造屋自动派兵，与来敌在一条战线上对冲；资源滚雪球，法术救场。',
    defaultTheme: 'jiangshi',
  },
  merge: {
    id: 'merge', name: '合成塔防', orientation: 'portrait', defaultLevels: 24,
    tags: ['合成', '合并', '升级', '进化', '合体', '塔防', 'merge', 'combine'],
    hints: ['合成', '合并', '合体', '进化', '升级', '融合'],
    suffixes: ['合成记', '合体战', '进化录', '合成大作战'],
    summary: '同级单位两两合成，越合越强；自动攻击来敌，守住底线。',
    defaultTheme: 'candy',
  },
  sort: {
    id: 'sort', name: '排序解谜', orientation: 'portrait', defaultLevels: 30,
    tags: ['排序', '停车', '分拣', '分类', '队列', '颜色', '解谜', 'puzzle', 'sort', 'parking'],
    hints: ['排序', '停车', '分拣', '分类', '排队', '归位', '颜色', '整理'],
    suffixes: ['停车难', '分拣站', '排排队', '归位'],
    summary: '把队列里的物件送进有限环道，凑满同色整排清空；顺序就是策略。',
    defaultTheme: 'city',
  },
  survivor: {
    id: 'survivor', name: '割草生存', orientation: 'landscape', defaultLevels: 24,
    tags: ['幸存', '割草', '生存', '弹幕', '躲', '吸血鬼', '无尽', 'survivor', 'roguelike', 'horde'],
    hints: ['幸存', '割草', '生存', '求生', '躲', '僵尸潮', '吸血鬼', '海量'],
    suffixes: ['幸存者', '生存战', '围猎', '生死劫'],
    summary: '走位躲潮，自动攻击；升级三选一，撑到 Boss 倒下。',
    defaultTheme: 'wasteland',
  },
  hook: {
    id: 'hook', name: '钩爪打捞', orientation: 'portrait', defaultLevels: 24,
    tags: ['钩爪', '打捞', '黄金矿工', '抓', '海底', '挖矿', '寻宝', 'hook', 'mining', 'treasure'],
    hints: ['钩爪', '打捞', '抓取', '挖矿', '寻宝', '黄金矿工', '海底'],
    suffixes: ['打捞记', '寻宝', '挖矿', '深海捞金'],
    summary: '摆钩抓宝，越重越慢；限时达标，升级钩爪。',
    defaultTheme: 'ocean',
  },
  idle: {
    id: 'idle', name: '放置经营', orientation: 'portrait', defaultLevels: 24,
    tags: ['放置', '经营', '模拟', '养成', '主播', '店铺', '挂机', '天数', 'idle', 'tycoon', 'management'],
    hints: ['放置', '经营', '模拟', '养成', '主播', '店铺', '创业', '挂机', '打理', '当老板'],
    suffixes: ['经营记', '养成计划', '创业史', '白日梦'],
    summary: '按天经营，选节目/员工/升级，滚大收益，在期限内达成目标。',
    defaultTheme: 'city',
  },
};

export const GENRE_IDS = Object.keys(GENRE_META);

/* 动态加载各基因的内容生成器（缺失的基因返回 null，forge 会给出明确错误） */
export async function loadGenreBuilders() {
  const out = {};
  for (const id of GENRE_IDS) {
    try {
      const mod = await import(new URL(`./genre-${id}.mjs`, import.meta.url).href);
      out[id] = mod;
    } catch (e) {
      out[id] = null;
    }
  }
  return out;
}

export function genreMeta(id) { return GENRE_META[id] || GENRE_META.horde; }
