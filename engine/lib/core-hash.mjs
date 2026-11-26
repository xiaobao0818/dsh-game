/* 引擎侧可复现随机 / 哈希（与游戏 js/core.js 同算法，但引擎不依赖生成产物） */
export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function slugify(text) {
  return String(text).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'game';
}

/** 与游戏 js/core.js 同接口的 RNG（引擎侧生成器使用） */
export class RNG {
  constructor(seed) { this.seed = typeof seed === 'string' ? hashString(seed) : (seed >>> 0); this.f = mulberry32(this.seed); }
  next() { return this.f(); }
  range(a, b) { return a + (b - a) * this.f(); }
  int(a, b) { return Math.floor(a + (b - a + 1) * this.f()); }
  pick(arr) { return arr[Math.min(arr.length - 1, (this.f() * arr.length) | 0)]; }
  shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = (this.f() * (i + 1)) | 0; const t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }
  chance(p) { return this.f() < p; }
}
