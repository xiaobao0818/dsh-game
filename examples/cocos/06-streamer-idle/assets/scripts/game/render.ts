// @ts-nocheck
/* =========================================================================
 * render.js —— 通用 Canvas2D 绘制工具：圆角面板 / 文字 / 按钮 / 进度条 /
 *               星星 / 渐变背景 / 图标
 * ========================================================================= */
import { clamp, easeOutCubic } from './core';

export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
export function rect(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
}
export function panel(ctx, x, y, w, h, o = {}) {
  const r = o.r == null ? 18 : o.r;
  ctx.save();
  if (o.shadow !== false) {
    ctx.shadowColor = o.shadowColor || 'rgba(0,0,0,.35)';
    ctx.shadowBlur = o.shadowBlur == null ? 18 : o.shadowBlur;
    ctx.shadowOffsetY = o.shadowOffsetY == null ? 6 : o.shadowOffsetY;
  }
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = o.fill || 'rgba(16,20,36,.86)';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  if (o.stroke) { ctx.lineWidth = o.lineWidth || 2; ctx.strokeStyle = o.stroke; ctx.stroke(); }
  ctx.restore();
}
export function text(ctx, str, x, y, o = {}) {
  ctx.save();
  const size = o.size || 20;
  const weight = o.weight || 800;
  ctx.font = `${weight} ${size}px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.baseline || 'middle';
  if (o.stroke) {
    ctx.lineWidth = o.strokeWidth || Math.max(3, size * 0.16);
    ctx.strokeStyle = o.stroke;
    ctx.lineJoin = 'round';
    ctx.strokeText(str, x, y);
  }
  if (o.shadow) { ctx.shadowColor = o.shadow; ctx.shadowBlur = o.shadowBlur || 8; ctx.shadowOffsetY = o.shadowY || 2; }
  ctx.fillStyle = o.color || '#fff';
  ctx.fillText(str, x, y);
  ctx.restore();
}
export function measure(ctx, str, size, weight = 800) {
  ctx.font = `${weight} ${size}px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif`;
  return ctx.measureText(str).width;
}
export function button(ctx, r, label, o = {}) {
  const pressed = o.pressed ? 2 : 0;
  const y = r.y + pressed;
  ctx.save();
  if (o.shadow !== false) {
    ctx.shadowColor = 'rgba(0,0,0,.30)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = o.pressed ? 2 : 6;
  }
  roundRect(ctx, r.x, y, r.w, r.h, o.r == null ? 16 : o.r);
  const g = ctx.createLinearGradient(0, y, 0, y + r.h);
  if (o.disabled) { g.addColorStop(0, 'rgba(90,96,120,.55)'); g.addColorStop(1, 'rgba(60,66,90,.55)'); }
  else {
    g.addColorStop(0, o.fill1 || '#ffd76a'); g.addColorStop(1, o.fill2 || '#f2a33c');
  }
  ctx.fillStyle = g; ctx.fill();
  ctx.shadowColor = 'transparent';
  if (o.stroke !== false) {
    roundRect(ctx, r.x, y, r.w, r.h, o.r == null ? 16 : o.r);
    ctx.lineWidth = o.lineWidth || 2;
    ctx.strokeStyle = o.disabled ? 'rgba(255,255,255,.14)' : (o.stroke || 'rgba(255,255,255,.55)');
    ctx.stroke();
  }
  // 高光
  if (!o.disabled && o.gloss !== false) {
    roundRect(ctx, r.x + 6, y + 4, r.w - 12, r.h * 0.38, 10);
    ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fill();
  }
  const size = o.size || Math.min(26, r.h * 0.42);
  text(ctx, label, r.x + r.w / 2, y + r.h / 2 + 1, {
    size, color: o.disabled ? 'rgba(255,255,255,.45)' : (o.color || '#3a2408'),
    align: 'center', weight: 900, shadow: o.textShadow === false ? null : null,
  });
  ctx.restore();
}
export function bar(ctx, x, y, w, h, k, o = {}) {
  k = clamp(k, 0, 1);
  roundRect(ctx, x, y, w, h, h / 2); ctx.fillStyle = o.bg || 'rgba(0,0,0,.45)'; ctx.fill();
  if (k > 0) {
    roundRect(ctx, x, y, Math.max(h, w * k), h, h / 2);
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, o.c1 || '#ff6b57'); g.addColorStop(1, o.c2 || '#ffd76a');
    ctx.fillStyle = o.color || g; ctx.fill();
  }
  if (o.stroke) { roundRect(ctx, x, y, w, h, h / 2); ctx.lineWidth = 1.5; ctx.strokeStyle = o.stroke; ctx.stroke(); }
}
export function star(ctx, x, y, r, filled, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  if (filled) {
    const g = ctx.createLinearGradient(0, -r, 0, r);
    g.addColorStop(0, o.c1 || '#ffe58a'); g.addColorStop(1, o.c2 || '#ffb52e');
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.12); ctx.strokeStyle = o.stroke || 'rgba(120,70,0,.55)'; ctx.stroke();
  } else {
    ctx.fillStyle = o.empty || 'rgba(255,255,255,.13)'; ctx.fill();
    ctx.lineWidth = Math.max(1, r * 0.1); ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.stroke();
  }
  ctx.restore();
}
export function gradient(ctx, W, H, colors, vertical = true) {
  const g = ctx.createLinearGradient(0, 0, vertical ? 0 : W, vertical ? H : 0);
  colors.forEach((c, i) => g.addColorStop(i / Math.max(1, colors.length - 1), c));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
export function vignette(ctx, W, H, strength = 0.35) {
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
export function icon(ctx, kind, x, y, s, color) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = color || '#fff'; ctx.fillStyle = color || '#fff';
  ctx.lineWidth = Math.max(2, s * 0.12); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const h = s / 2;
  if (kind === 'play') { ctx.beginPath(); ctx.moveTo(-h * 0.55, -h); ctx.lineTo(h * 0.9, 0); ctx.lineTo(-h * 0.55, h); ctx.closePath(); ctx.fill(); }
  else if (kind === 'pause') { ctx.fillRect(-h * 0.62, -h, h * 0.42, h * 2); ctx.fillRect(h * 0.2, -h, h * 0.42, h * 2); }
  else if (kind === 'back') { ctx.beginPath(); ctx.moveTo(h * 0.35, -h); ctx.lineTo(-h * 0.55, 0); ctx.lineTo(h * 0.35, h); ctx.stroke(); }
  else if (kind === 'restart') { ctx.beginPath(); ctx.arc(0, 0, h * 0.72, -Math.PI * 0.35, Math.PI * 1.45); ctx.stroke(); ctx.beginPath(); ctx.moveTo(h * 0.68, -h * 0.55); ctx.lineTo(h * 0.92, h * 0.05); ctx.lineTo(h * 0.28, -h * 0.06); ctx.fill(); }
  else if (kind === 'gear') {
    ctx.beginPath(); ctx.arc(0, 0, h * 0.34, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * h * 0.52, Math.sin(a) * h * 0.52); ctx.lineTo(Math.cos(a) * h * 0.92, Math.sin(a) * h * 0.92); ctx.stroke(); }
  }
  else if (kind === 'sound') { ctx.beginPath(); ctx.moveTo(-h, -h * 0.35); ctx.lineTo(-h * 0.45, -h * 0.35); ctx.lineTo(h * 0.1, -h * 0.8); ctx.lineTo(h * 0.1, h * 0.8); ctx.lineTo(-h * 0.45, h * 0.35); ctx.lineTo(-h, h * 0.35); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.arc(h * 0.18, 0, h * 0.55, -0.9, 0.9); ctx.stroke(); }
  else if (kind === 'mute') { ctx.beginPath(); ctx.moveTo(-h, -h * 0.3); ctx.lineTo(-h * 0.3, -h * 0.3); ctx.lineTo(h * 0.3, -h * 0.8); ctx.lineTo(h * 0.3, h * 0.8); ctx.lineTo(-h * 0.3, h * 0.3); ctx.lineTo(-h, h * 0.3); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(h * 0.55, -h * 0.4); ctx.lineTo(h * 1.0, h * 0.4); ctx.moveTo(h * 1.0, -h * 0.4); ctx.lineTo(h * 0.55, h * 0.4); ctx.stroke(); }
  else if (kind === 'lock') { ctx.fillRect(-h * 0.6, -h * 0.05, h * 1.2, h * 0.85); ctx.beginPath(); ctx.arc(0, -h * 0.05, h * 0.4, Math.PI, 0); ctx.stroke(); }
  else if (kind === 'home') { ctx.beginPath(); ctx.moveTo(-h, 0); ctx.lineTo(0, -h); ctx.lineTo(h, 0); ctx.stroke(); ctx.fillRect(-h * 0.55, 0, h * 1.1, h * 0.75); }
  else if (kind === 'star') { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const rr = i % 2 ? h * 0.45 : h; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
export function entering(t, dur = 0.35) { return easeOutCubic(clamp(t / dur, 0, 1)); }
