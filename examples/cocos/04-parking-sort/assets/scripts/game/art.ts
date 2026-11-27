// @ts-nocheck
/* =========================================================================
 * art.js —— 程序化美术：所有画面零外部素材，按主题调色板实时绘制
 *   sky / 场景 / 角色 / 建筑 / 投射物 / 拾取物
 * ========================================================================= */
import { clamp, TAU, hashString, mulberry32 } from './core';
import { roundRect, bar } from './render';

const DEF = {
  sky: ['#101427', '#2b1d3a'], ground: '#3a2d3f', groundDark: '#241a2b',
  accent: '#ffcf5c', accent2: '#ff7a59', hero: '#8fd3ff', hero2: '#3f7ea8',
  enemy: '#c85a6a', enemy2: '#7a2f42', gold: '#ffd76a', text: '#ffffff',
  danger: '#ff5d5d', ok: '#62d68f', ui: 'rgba(16,20,36,.86)', ui2: 'rgba(255,255,255,.12)', ink: '#101427',
};

function pal(theme) {
  const p = { ...DEF, ...(theme.palette || {}) };
  if (!Array.isArray(p.sky)) p.sky = DEF.sky;
  return p;
}

export function makeArt(theme) {
  const C = pal(theme);
  const mood = theme.mood || 'night';
  const seed = hashString(theme.id || 'theme');
  const rnd = mulberry32(seed);

  function sky(ctx, W, H, t) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, C.sky[0]); g.addColorStop(0.65, C.sky[1]); g.addColorStop(1, C.groundDark);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (mood === 'space') {
      for (let i = 0; i < 90; i++) {
        const x = rnd() * W, y = rnd() * H * 0.8, s = rnd() * 2 + 0.4;
        ctx.globalAlpha = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(t * 1.2 + i));
        ctx.fillStyle = '#fff'; ctx.fillRect(x, y, s, s);
      }
      ctx.globalAlpha = 1;
      const gg = ctx.createRadialGradient(W * 0.78, H * 0.22, 4, W * 0.78, H * 0.22, H * 0.34);
      gg.addColorStop(0, 'rgba(140,190,255,.55)'); gg.addColorStop(1, 'rgba(140,190,255,0)');
      ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H);
    } else if (mood === 'night' || mood === 'dusk') {
      for (let i = 0; i < 46; i++) {
        const x = rnd() * W, y = rnd() * H * 0.55, s = rnd() * 1.8 + 0.4;
        ctx.globalAlpha = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * 0.8 + i * 1.7));
        ctx.fillStyle = '#fff8e0'; ctx.fillRect(x, y, s, s);
      }
      ctx.globalAlpha = 1;
      const mx = W * 0.8, my = H * 0.18, mr = Math.min(W, H) * 0.075;
      const mg = ctx.createRadialGradient(mx, my, mr * 0.4, mx, my, mr * 2.6);
      mg.addColorStop(0, 'rgba(255,245,210,.35)'); mg.addColorStop(1, 'rgba(255,245,210,0)');
      ctx.fillStyle = mg; ctx.fillRect(mx - mr * 3, my - mr * 3, mr * 6, mr * 6);
      ctx.fillStyle = '#fff2c4'; ctx.beginPath(); ctx.arc(mx, my, mr, 0, TAU); ctx.fill();
      ctx.fillStyle = C.sky[1]; ctx.beginPath(); ctx.arc(mx - mr * 0.42, my - mr * 0.3, mr * 0.92, 0, TAU); ctx.fill();
    } else if (mood === 'underwater') {
      for (let i = 0; i < 26; i++) {
        const x = rnd() * W, y = H - ((t * (18 + rnd() * 30) + rnd() * H) % H);
        ctx.globalAlpha = 0.18 + rnd() * 0.2; ctx.fillStyle = '#dffcff';
        ctx.beginPath(); ctx.arc(x, y, 2 + rnd() * 5, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
      for (let i = 0; i < 5; i++) {
        ctx.globalAlpha = 0.06; ctx.fillStyle = '#bff3ff';
        ctx.beginPath(); ctx.moveTo(rnd() * W, 0); ctx.lineTo(W * 0.3 + i * 80, H); ctx.lineTo(W * 0.3 + i * 80 + 80, H); ctx.closePath(); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    return g;
  }

  function farLayers(ctx, W, H, t, groundY) {
    const p1 = groundY - H * 0.16;
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath(); ctx.moveTo(0, groundY);
    let x = 0;
    while (x < W) { const w = 120 + rnd() * 200, h = 20 + rnd() * 70; ctx.lineTo(x, p1 - h * 0.3); ctx.lineTo(x + w * 0.5, p1 - h); ctx.lineTo(x + w, p1 - h * 0.2); x += w; }
    ctx.lineTo(W, groundY); ctx.closePath(); ctx.fill();
    // 中景建筑/树剪影
    const base = groundY - 4;
    x = -40;
    while (x < W + 60) {
      const w = 46 + rnd() * 70, h = 50 + rnd() * 120;
      ctx.fillStyle = 'rgba(0,0,0,.28)';
      if (mood === 'underwater') {
        ctx.beginPath(); ctx.ellipse(x + w / 2, base, w * 0.3, h * 0.5, 0, Math.PI, 0); ctx.fill();
      } else if (mood === 'forest') {
        ctx.beginPath(); ctx.moveTo(x + w / 2, base - h); ctx.lineTo(x + w, base); ctx.lineTo(x, base); ctx.closePath(); ctx.fill();
      } else {
        ctx.fillRect(x, base - h, w, h);
        if (rnd() < 0.6) { ctx.fillStyle = 'rgba(255,220,140,.35)'; for (let k = 0; k < 4; k++) ctx.fillRect(x + 8 + rnd() * (w - 20), base - h + 10 + rnd() * (h - 24), 5, 7); }
      }
      x += w + 12;
    }
    // 地平线
    const gg = ctx.createLinearGradient(0, groundY, 0, H);
    gg.addColorStop(0, C.ground); gg.addColorStop(1, C.groundDark);
    ctx.fillStyle = gg; ctx.fillRect(0, groundY, W, H - groundY);
    ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(0, groundY, W, 3);
  }

  /* 静态背景离屏缓存：标题/结算场景每帧重绘天空+远景是主要开销 */
  let bgCache = null, bgKey = '';
  function scene(ctx, W, H, t, o = {}) {
    const groundY = o.groundY == null ? H * 0.72 : o.groundY;
    const key = W + 'x' + H + '@' + Math.round(groundY);
    if (key !== bgKey) {
      bgCache = null; bgKey = key;
      const doc = ctx.canvas && ctx.canvas.ownerDocument;
      if (doc && doc.createElement) {
        const dpr = Math.min(2, (ctx.getTransform && ctx.getTransform().a) || 1);
        const c = doc.createElement('canvas');
        c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
        const g = c.getContext('2d');
        if (g) {
          g.setTransform(dpr, 0, 0, dpr, 0, 0);
          sky(g, W, H, 0);
          farLayers(g, W, H, 0, groundY);
          bgCache = c;
        }
      }
    }
    if (bgCache) { ctx.drawImage(bgCache, 0, 0, W, H); return groundY; }
    sky(ctx, W, H, t);
    farLayers(ctx, W, H, t, groundY);
    return groundY;
  }

  /* 角色：身体 + 头 + 眼睛 + 武器/配件。kind: hero|enemy|boss，role: melee|ranged|mage|heal|tank */
  function char(ctx, x, y, s, o = {}) {
    const kind = o.kind || 'hero';
    const facing = o.facing == null ? 1 : o.facing;
    const role = o.role || 'melee';
    const tier = o.tier || 1;
    const t = o.t || 0;
    const flash = o.flash ? 1 : 0;
    // 受击白闪：直接换配色（原来的 source-atop 叠加会在不透明背景上糊出一个白方块）
    const body = flash ? '#f2f4ff' : kind === 'enemy' ? C.enemy : kind === 'boss' ? C.enemy2 : C.hero;
    const body2 = flash ? '#ffffff' : kind === 'enemy' ? C.enemy2 : kind === 'boss' ? C.danger : C.hero2;
    const hash = hashString((o.name || '') + tier);
    ctx.save(); ctx.translate(x, y);
    const breathe = Math.sin(t * 6 + hash) * 0.02;
    ctx.scale(s * facing, s * (1 + breathe));
    // 影子
    ctx.save(); ctx.scale(1 / Math.max(0.2, facing), 1); ctx.globalAlpha = 0.28; ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(0, 2, 13, 4.5, 0, 0, TAU); ctx.fill(); ctx.restore();
    // 腿（走路摆）
    const walk = o.moving ? Math.sin(t * 9 + hash) * 3 : 0;
    ctx.fillStyle = body2;
    ctx.fillRect(-6, -8 + walk * 0.3, 4.5, 9 + walk * 0.4);
    ctx.fillRect(2, -8 - walk * 0.3, 4.5, 9 - walk * 0.4);
    // 身体
    const bh = 18 + tier * 1.6;
    roundRect(ctx, -9, -8 - bh, 18, bh, 7); ctx.fillStyle = body; ctx.fill();
    // 披风/护甲
    ctx.fillStyle = body2;
    roundRect(ctx, -11, -8 - bh + 4, 22, 5, 2); ctx.fill();
    if (kind !== 'enemy') { ctx.fillStyle = C.accent; ctx.fillRect(-3, -8 - bh + 4, 6, 3); }
    // 头
    const hy = -8 - bh - 8;
    ctx.beginPath(); ctx.arc(0, hy, 9.5, 0, TAU); ctx.fillStyle = kind === 'enemy' ? body2 : '#f6d3aa'; ctx.fill();
    if (kind === 'enemy') { ctx.strokeStyle = C.enemy2; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, hy, 9.5, 0, TAU); ctx.stroke(); }
    // 眼睛
    ctx.fillStyle = kind === 'enemy' ? '#2a0d14' : '#222';
    ctx.beginPath(); ctx.arc(3.4, hy - 1, 1.5, 0, TAU); ctx.fill();
    if (kind === 'boss') {
      ctx.fillStyle = C.gold;
      ctx.beginPath(); ctx.moveTo(-9, hy - 9); ctx.lineTo(-5, hy - 15); ctx.lineTo(-1, hy - 10); ctx.lineTo(3, hy - 16); ctx.lineTo(7, hy - 9); ctx.closePath(); ctx.fill();
    } else if (hash % 3 === 0) {
      ctx.fillStyle = kind === 'enemy' ? C.enemy : C.accent2;
      roundRect(ctx, -10, hy - 10, 20, 4, 2); ctx.fill();
    } else if (hash % 3 === 1) {
      ctx.fillStyle = kind === 'enemy' ? C.enemy2 : C.accent;
      ctx.beginPath(); ctx.arc(0, hy - 10, 5, Math.PI, 0); ctx.fill();
    }
    // 武器
    ctx.strokeStyle = kind === 'enemy' ? C.enemy2 : C.accent2; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    if (role === 'ranged') {
      ctx.beginPath(); ctx.arc(10, -8 - bh * 0.55, 7, -1.2, 1.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(13.5, -8 - bh * 0.55 - 7.6); ctx.lineTo(13.5, -8 - bh * 0.55 + 7.6); ctx.stroke();
    } else if (role === 'mage') {
      ctx.beginPath(); ctx.moveTo(10, -8 - bh * 0.2); ctx.lineTo(14, -8 - bh - 14); ctx.stroke();
      ctx.fillStyle = C.accent; ctx.beginPath(); ctx.arc(14, -8 - bh - 16, 3.4, 0, TAU); ctx.fill();
    } else if (role === 'heal') {
      ctx.beginPath(); ctx.moveTo(9, -8 - bh * 0.6); ctx.lineTo(17, -8 - bh * 0.6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(13, -8 - bh * 0.6 - 4); ctx.lineTo(13, -8 - bh * 0.6 + 4); ctx.stroke();
    } else if (role === 'tank') {
      ctx.fillStyle = C.ui2; roundRect(ctx, 6, -8 - bh * 0.85, 9, bh * 0.8, 4); ctx.fill();
      ctx.strokeStyle = C.accent; ctx.strokeRect(6, -8 - bh * 0.85, 9, bh * 0.8);
    } else {
      ctx.beginPath(); ctx.moveTo(10, -8 - bh * 0.45); ctx.lineTo(19, -8 - bh * 0.95); ctx.stroke();
    }
    ctx.restore();
    if (o.hp != null && o.hp < 1) {
      const w = Math.max(18, s * 22);
      ctx.save(); ctx.translate(x - w / 2, y - s * 46); bar(ctx, 0, 0, w, 4, o.hp, { c1: C.danger, c2: C.ok }); ctx.restore();
    }
  }

  function building(ctx, x, y, w, h, o = {}) {
    const lvl = o.level || 1;
    const t = o.t || 0;
    const kind = o.kind || 0;
    ctx.save(); ctx.translate(x, y);
    ctx.globalAlpha = 0.3; ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(0, 0, w * 0.5, 6, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    // 基座
    ctx.fillStyle = C.groundDark; roundRect(ctx, -w / 2, -8, w, 8, 3); ctx.fill();
    // 主体
    const g = ctx.createLinearGradient(0, -h, 0, 0);
    g.addColorStop(0, C.ui2); g.addColorStop(1, C.groundDark);
    roundRect(ctx, -w * 0.42, -h, w * 0.84, h, 6); ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = o.selected ? C.accent : 'rgba(255,255,255,.18)'; roundRect(ctx, -w * 0.42, -h, w * 0.84, h, 6); ctx.stroke();
    if (kind === 0) { // 兵营
      ctx.fillStyle = C.accent2; ctx.beginPath(); ctx.moveTo(-w * 0.42, -h); ctx.lineTo(0, -h - 14); ctx.lineTo(w * 0.42, -h); ctx.closePath(); ctx.fill();
      ctx.fillStyle = C.ink; roundRect(ctx, -w * 0.14, -h * 0.55, w * 0.28, h * 0.55, 3); ctx.fill();
    } else if (kind === 1) { // 箭塔
      roundRect(ctx, -w * 0.2, -h - 26, w * 0.4, 26, 3); ctx.fillStyle = C.accent2; ctx.fill();
      ctx.fillStyle = C.ink; for (let i = 0; i < 3; i++) { ctx.fillRect(-w * 0.2 + i * w * 0.15, -h - 26, w * 0.07, 8); }
    } else if (kind === 2) { // 法阵
      ctx.strokeStyle = C.accent; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, -h - 8, 8 + Math.sin(t * 3) * 1.5, 0, TAU); ctx.stroke();
      ctx.fillStyle = C.accent; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.arc(0, -h - 8, 3, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    } else { // 墙
      ctx.fillStyle = C.groundDark; for (let i = 0; i < 3; i++) ctx.fillRect(-w * 0.45, -h + i * (h / 3), w * 0.9, h / 6);
    }
    // 等级角标
    if (lvl > 1) {
      ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(w * 0.36, -h + 4, 9, 0, TAU); ctx.fill();
      ctx.fillStyle = C.ink; ctx.font = '900 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(lvl), w * 0.36, -h + 4);
    }
    ctx.restore();
    if (o.hp != null && o.hp < 1) { ctx.save(); ctx.translate(x - w * 0.42, y - h - 10); bar(ctx, 0, 0, w * 0.84, 4, o.hp); ctx.restore(); }
    if (o.cd != null) { ctx.save(); ctx.translate(x - w * 0.42, y - 6); bar(ctx, 0, 0, w * 0.84, 3, 1 - o.cd, { c1: C.accent, c2: C.gold }); ctx.restore(); }
  }

  function projectile(ctx, x, y, o = {}) {
    const kind = o.kind || 'arrow';
    ctx.save(); ctx.translate(x, y);
    if (kind === 'arrow') {
      const a = o.angle || 0; ctx.rotate(a);
      ctx.strokeStyle = o.color || C.accent; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(8, 0); ctx.stroke();
      ctx.fillStyle = o.color || C.accent; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(5, -4); ctx.lineTo(5, 4); ctx.closePath(); ctx.fill();
    } else if (kind === 'orb') {
      const r = o.r || 6;
      const g = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 2);
      g.addColorStop(0, '#fff'); g.addColorStop(0.4, o.color || C.accent); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 2, 0, TAU); ctx.fill();
    } else if (kind === 'shock') {
      ctx.strokeStyle = o.color || C.hero; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, o.r || 10, 0, TAU); ctx.stroke();
    } else {
      ctx.fillStyle = o.color || C.gold;
      ctx.beginPath(); ctx.arc(0, 0, o.r || 4, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  function pickup(ctx, x, y, o = {}) {
    const t = o.t || 0, r = o.r || 9;
    ctx.save(); ctx.translate(x, y + Math.sin(t * 3) * 3);
    ctx.globalAlpha = 0.9;
    const g = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 2);
    g.addColorStop(0, o.color || C.gold); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 2, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = o.color || C.gold;
    if (o.shape === 'gem') { ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.8, 0); ctx.lineTo(0, r); ctx.lineTo(-r * 0.8, 0); ctx.closePath(); ctx.fill(); }
    else if (o.shape === 'star') { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const rr = i % 2 ? r * 0.5 : r; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); }
    ctx.restore();
  }

  function flag(ctx, x, y, color, t) {
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -54); ctx.stroke();
    ctx.fillStyle = color || C.accent;
    ctx.beginPath(); ctx.moveTo(0, -54);
    for (let i = 0; i <= 8; i++) ctx.lineTo(i * 4.4, -54 + Math.sin(t * 5 + i * 0.7) * 2.4 + i * 0.4);
    for (let i = 8; i >= 0; i--) ctx.lineTo(i * 4.4, -54 + Math.sin(t * 5 + i * 0.7) * 2.4 + 14 - i * 0.4);
    ctx.closePath(); ctx.fill(); ctx.restore();
  }

  return { C, mood, sky, scene, char, building, projectile, pickup, flag };
}
