// @ts-nocheck
/* =========================================================================
 * core.js —— 纯逻辑层（无 DOM，可在 Node 里跑无头仿真）
 * 数学工具 / 可复现随机 / 版本化存档
 * ========================================================================= */

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));
export const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
export const smoothstep = (t) => t * t * (3 - 2 * t);
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeOutBack = (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
export const TAU = Math.PI * 2;
export const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
export const dist = (ax, ay, bx, by) => Math.sqrt(dist2(ax, ay, bx, by));
export const pointInRect = (x, y, r) => x >= r.x && y >= r.y && x <= r.x + r.w && y <= r.y + r.h;
export const rectsOverlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
export const fmt = (n) => {
  n = Math.floor(n);
  if (n >= 1e8) return (n / 1e8).toFixed(2).replace(/\.?0+$/, '') + '亿';
  if (n >= 1e4) return (n / 1e4).toFixed(1).replace(/\.0$/, '') + '万';
  return String(n);
};
export const fmtTime = (s) => {
  s = Math.max(0, Math.floor(s));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};
export const pick = (rng, arr) => arr[Math.min(arr.length - 1, (rng() * arr.length) | 0)];
export const shuffle = (rng, arr) => {
  for (let i = arr.length - 1; i > 0; i--) { const j = (rng() * (i + 1)) | 0; const t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
  return arr;
};

/* ---------- 可复现随机数（mulberry32） ---------- */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export class RNG {
  constructor(seed) { this.seed = typeof seed === 'string' ? hashString(seed) : (seed >>> 0); this.f = mulberry32(this.seed); }
  next() { return this.f(); }
  range(a, b) { return a + (b - a) * this.f(); }
  int(a, b) { return Math.floor(a + (b - a + 1) * this.f()); }
  pick(arr) { return pick(this.f, arr); }
  shuffle(arr) { return shuffle(this.f, arr); }
  chance(p) { return this.f() < p; }
}

/* ---------- 版本化存档（localStorage 可缺省） ---------- */
const LS = (() => { try { return typeof window === 'undefined' ? null : (window.localStorage || null); } catch (e) { return null; } })();

export function makeSave(slug, customDefault = {}) {
  const KEY = 'gs_' + slug + '_v1';
  const DEFAULT = {
    v: 1,
    unlocked: 1,
    stars: {},
    best: {},
    coins: 0,
    totalClears: 0,
    totalKills: 0,
    playSec: 0,
    firstRun: true,
    settings: { music: true, sfx: true, haptic: true, lowfx: false },
    flags: {},
    ...customDefault,
  };
  const deepMerge = (base, patch) => {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return patch === undefined ? base : patch;
    const out = Array.isArray(base) ? base.slice() : { ...base };
    for (const k of Object.keys(patch)) {
      const b = base ? base[k] : undefined;
      const p = patch[k];
      out[k] = (p && typeof p === 'object' && !Array.isArray(p) && b && typeof b === 'object' && !Array.isArray(b)) ? deepMerge(b, p) : p;
    }
    return out;
  };
  class Save {
    constructor() { this.data = this.load(); }
    load() {
      try {
        const raw = LS && LS.getItem(KEY);
        return raw ? deepMerge(JSON.parse(JSON.stringify(DEFAULT)), JSON.parse(raw)) : JSON.parse(JSON.stringify(DEFAULT));
      } catch (e) { return JSON.parse(JSON.stringify(DEFAULT)); }
    }
    flush() { try { LS && LS.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* 配额不足时静默 */ } }
    reset() { this.data = JSON.parse(JSON.stringify(DEFAULT)); this.flush(); }
    get settings() { return this.data.settings; }
    setSetting(k, v) { this.data.settings[k] = v; this.flush(); }
    starOf(id) { return this.data.stars[id] || 0; }
    isUnlocked(id) { return id <= this.data.unlocked; }
    complete(id, stars, score) {
      const d = this.data;
      d.stars[id] = Math.max(d.stars[id] || 0, stars);
      if (!d.best[id] || score > d.best[id]) d.best[id] = score;
      if (id + 1 > d.unlocked) d.unlocked = id + 1;
      d.totalClears++;
      this.flush();
    }
    totalStars() { return Object.keys(this.data.stars).reduce((s, k) => s + this.data.stars[k], 0); }
    addCoins(n) { this.data.coins = Math.max(0, (this.data.coins || 0) + n); this.flush(); }
    flag(k, v) { this.data.flags[k] = v; this.flush(); }
  }
  return new Save();
}

/* ---------- 无头仿真使用的空服务 ---------- */
export const silentAudio = { sfx() {}, setMuted() {}, music() {}, ok: false };
export const silentFx = { burst() {}, text() {}, shake() {}, flash() {}, ring() {}, beam() {}, ok: false };
