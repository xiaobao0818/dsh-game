/**
 * CanvasSurface —— 把 Canvas2D 子集映射到 Cocos Creator 3.8 的 Graphics + Label 池。
 *
 * 目的：让「游戏工坊」生成的同一套游戏逻辑/绘制代码（app/render/art/rules）
 * 原样跑在 Cocos 引擎里，而不是维护两套玩法实现。
 *
 * 支持的 Canvas2D 能力（游戏代码实际用到的子集）：
 *   save/restore、translate/scale/rotate、globalAlpha、fillStyle/strokeStyle/lineWidth/
 *   lineCap/lineJoin、font/textAlign/textBaseline、beginPath/moveTo/lineTo/quadraticCurveTo/
 *   arc/arcTo/ellipse/closePath/fill/stroke、fillRect/strokeRect/clearRect、
 *   fillText/strokeText/measureText、createLinearGradient/createRadialGradient。
 *
 * 已知近似：渐变按包围盒取色（fillRect 的竖直渐变按条带近似）、阴影/线虚线/径向光晕为近似或忽略、
 * drawImage 不可用（因此背景离屏缓存自动关闭）；文字用 Label 渲染，始终位于 Graphics 之上。
 */
// @ts-nocheck
import { Color, Graphics, Label, LabelOutline, Node, UITransform, Vec3 } from 'cc';
const LineCap = (Graphics as any).LineCap;
const LineJoin = (Graphics as any).LineJoin;

type Mat = [number, number, number, number, number, number];
type Grad = { __grad: string; stops: { o: number; c: string }[]; x0: number; y0: number; x1: number; y1: number; r0: number; r1: number; cx: number; cy: number };
type Pt = { ux: number; uy: number; lx: number; ly: number };

const ID: Mat = [1, 0, 0, 1, 0, 0];

function mul(m: Mat, n: Mat): Mat {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}

/** '#rgb' / '#rrggbb' / 'rgb(r,g,b)' / 'rgba(r,g,b,a)' -> [r,g,b,a] 0..255 */
export function parseColor(c: any): number[] {
  if (Array.isArray(c)) return c;
  if (!c || typeof c !== 'string') return [255, 255, 255, 255];
  const s = c.trim();
  if (s[0] === '#') {
    const h = s.slice(1);
    if (h.length === 3) return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16), 255];
    if (h.length === 6) return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 255];
    if (h.length === 8) return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), parseInt(h.slice(6, 8), 16)];
  }
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const p = m[1].split(',').map((x) => parseFloat(x));
    return [p[0] || 0, p[1] || 0, p[2] || 0, p.length > 3 ? Math.round((p[3] ?? 1) * 255) : 255];
  }
  if (s === 'white') return [255, 255, 255, 255];
  if (s === 'black') return [0, 0, 0, 255];
  return [255, 255, 255, 255];
}
function toColor(c: any, alpha = 1): Color {
  const p = parseColor(c);
  return new Color(Math.round(p[0]), Math.round(p[1]), Math.round(p[2]), Math.max(0, Math.min(255, Math.round(p[3] * alpha))));
}
function mix(a: any, b: any, t: number): string {
  const A = parseColor(a), B = parseColor(b);
  const v = (i: number) => Math.round(A[i] + (B[i] - A[i]) * t);
  return `rgba(${v(0)},${v(1)},${v(2)},${(A[3] + (B[3] - A[3]) * t) / 255})`;
}
function gradColor(g: Grad, x: number, y: number, fallback: any): any {
  if (!g || !g.stops || g.stops.length === 0) return fallback;
  let t: number;
  if (g.__grad === 'linear') {
    const dx = g.x1 - g.x0, dy = g.y1 - g.y0;
    const len2 = dx * dx + dy * dy || 1;
    t = ((x - g.x0) * dx + (y - g.y0) * dy) / len2;
  } else {
    const d = Math.hypot(x - g.cx, y - g.cy);
    t = (d - g.r0) / Math.max(1, g.r1 - g.r0);
  }
  t = Math.max(0, Math.min(1, t));
  const st = g.stops;
  for (let i = 1; i < st.length; i++) {
    if (t <= st[i].o || i === st.length - 1) {
      const a = st[i - 1], b = st[i];
      const k = b.o === a.o ? 0 : (t - a.o) / (b.o - a.o);
      return mix(a.c, b.c, Math.max(0, Math.min(1, k)));
    }
  }
  return st[0].c;
}

class State {
  fill: any = '#ffffff';
  stroke: any = '#ffffff';
  lineWidth = 1;
  alpha = 1;
  font = '600 20px sans-serif';
  fontSize = 20;
  fontWeight = 600;
  align: 'left' | 'center' | 'right' = 'left';
  baseline: 'middle' | 'top' | 'alphabetic' | 'bottom' = 'middle';
  lineCap: any = LineCap.ROUND;
  lineJoin: any = LineJoin.ROUND;
  m: Mat = ID.slice() as Mat;
  shadowColor: any = null;
  shadowBlur = 0;
  shadowOffsetY = 0;
  dash: any = null;
  clipRect: any = null;
  clone(): State { const s = new State(); s.fill = this.fill; s.stroke = this.stroke; s.lineWidth = this.lineWidth; s.alpha = this.alpha; s.font = this.font; s.fontSize = this.fontSize; s.fontWeight = this.fontWeight; s.align = this.align; s.baseline = this.baseline; s.lineCap = this.lineCap; s.lineJoin = this.lineJoin; s.m = this.m.slice() as Mat; s.shadowColor = this.shadowColor; s.shadowBlur = this.shadowBlur; s.shadowOffsetY = this.shadowOffsetY; s.dash = this.dash; s.clipRect = this.clipRect; return s; }
}


/* =========================================================================
 * 离屏画布录制器：让 art.js / 规则里的背景缓存（createElement('canvas') + drawImage）
 * 在 Cocos 端变成「一次性构建的静态 Graphics 节点」，之后每帧零成本。
 * ========================================================================= */
class RecorderCanvas {
  __gsRecorder = true;
  width: number; height: number; ops: any[] = [];
  constructor(w: number, h: number) { this.width = w; this.height = h; }
  getContext() { return new RecorderCtx(this); }
  addEventListener() {} removeEventListener() {}
}
class RecorderCtx {
  cv: RecorderCanvas;
  fs: any = '#ffffff'; ss: any = '#ffffff'; lw = 1; alpha = 1; fnt = '';
  path: { x: number; y: number }[] = []; closed = false;
  stack: any[] = [];
  constructor(cv: RecorderCanvas) { this.cv = cv; }
  save() { this.stack.push({ fs: this.fs, ss: this.ss, lw: this.lw, alpha: this.alpha }); }
  restore() { const s = this.stack.pop(); if (s) { this.fs = s.fs; this.ss = s.ss; this.lw = s.lw; this.alpha = s.alpha; } }
  translate() {} scale() {} rotate() {} setTransform() {} getTransform() { return { a: 1 }; }
  createLinearGradient(x0: number, y0: number, x1: number, y1: number) { return this.mkGrad('linear', x0, y0, x1, y1, 0, 1); }
  createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number) { return this.mkGrad('radial', x0, y0, x1, y1, r0, r1); }
  mkGrad(kind: string, x0: number, y0: number, x1: number, y1: number, r0: number, r1: number) {
    const g: any = { __grad: kind, stops: [], x0, y0, x1, y1, r0, r1, cx: x1, cy: y1 };
    g.addColorStop = (o: number, c: string) => g.stops.push({ o, c });
    return g;
  }
  set fillStyle(v: any) { this.fs = v; } get fillStyle() { return this.fs; }
  set strokeStyle(v: any) { this.ss = v; } get strokeStyle() { return this.ss; }
  set lineWidth(v: number) { this.lw = v; } get lineWidth() { return this.lw; }
  set globalAlpha(v: number) { this.alpha = v; } get globalAlpha() { return this.alpha; }
  set font(v: string) { this.fnt = v; } get font() { return this.fnt; }
  set textAlign(v: any) {} get textAlign() { return 'left'; }
  set textBaseline(v: any) {} get textBaseline() { return 'middle'; }
  set lineCap(v: any) {} set lineJoin(v: any) {}
  set shadowColor(v: any) {} set shadowBlur(v: number) {} set shadowOffsetY(v: number) {}
  setLineDash() {}
  beginPath() { this.path = []; this.closed = false; }
  moveTo(x: number, y: number) { this.path.push({ x, y }); }
  lineTo(x: number, y: number) { this.path.push({ x, y }); }
  quadraticCurveTo(cx: number, cy: number, x: number, y: number) {
    const p0 = this.path[this.path.length - 1] || { x: cx, y: cy };
    for (let i = 1; i <= 10; i++) { const t = i / 10, it = 1 - t; this.path.push({ x: it * it * p0.x + 2 * it * t * cx + t * t * x, y: it * it * p0.y + 2 * it * t * cy + t * t * y }); }
  }
  bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number) {
    const p0 = this.path[this.path.length - 1] || { x: c1x, y: c1y };
    for (let i = 1; i <= 10; i++) {
      const t = i / 10, it = 1 - t;
      this.path.push({ x: it * it * it * p0.x + 3 * it * it * t * c1x + 3 * it * t * t * c2x + t * t * t * x, y: it * it * it * p0.y + 3 * it * it * t * c1y + 3 * it * t * t * c2y + t * t * t * y });
    }
  }
  arc(cx: number, cy: number, r: number, a0: number, a1: number, ccw = false) { this.arcSeg(cx, cy, r, r, a0, a1, ccw); }
  ellipse(cx: number, cy: number, rx: number, ry: number, rot: number, a0: number, a1: number, ccw = false) { this.arcSeg(cx, cy, rx, ry, a0, a1, ccw); }
  arcSeg(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, ccw: boolean) {
    let d = a1 - a0; if (ccw) { while (d > 0) d -= Math.PI * 2; } else { while (d < 0) d += Math.PI * 2; }
    const n = Math.max(8, Math.min(40, Math.ceil(Math.abs(d) / (Math.PI / 16))));
    for (let i = 1; i <= n; i++) { const a = a0 + (d * i) / n; this.path.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry }); }
  }
  arcTo(x1: number, y1: number) { this.path.push({ x: x1, y: y1 }); }
  closePath() { this.closed = true; }
  rect(x: number, y: number, w: number, h: number) { this.path.push({ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }); this.closed = true; }
  roundRect(x: number, y: number, w: number, h: number) { this.rect(x, y, w, h); }
  fill() { if (this.path.length) this.cv.ops.push({ k: 'path', pts: this.path.slice(), closed: this.closed, style: this.fs, alpha: this.alpha }); }
  stroke() { if (this.path.length) this.cv.ops.push({ k: 'path', pts: this.path.slice(), closed: this.closed, stroke: this.ss, lw: this.lw, alpha: this.alpha }); }
  fillRect(x: number, y: number, w: number, h: number) { this.cv.ops.push({ k: 'rect', x, y, w, h, style: this.fs, alpha: this.alpha }); }
  strokeRect(x: number, y: number, w: number, h: number) { this.cv.ops.push({ k: 'rect', x, y, w, h, stroke: this.ss, lw: this.lw, alpha: this.alpha }); }
  clearRect() {}
  fillText() {} strokeText() {} measureText(s: string) { return { width: String(s).length * 10 }; }
  drawImage() {}
}

export class CanvasSurface {
  W: number; H: number;
  root: Node;
  gnode: Node; g: Graphics;
  labelRoot: Node;
  staticRoot: Node;
  images: Map<any, any> = new Map();
  usedImages: Set<any> = new Set();
  labels: Label[] = [];
  labelUsed = 0;
  stack: State[] = [];
  st: State = new State();
  path: Pt[] = [];       // 已按当前矩阵变换到节点局部坐标的点
  pathU: { x: number; y: number }[] = []; // 用户坐标（算渐变用）
  closed = false;
  hasPath = false;
  canvas: any = null;
  dpr = 1;

  constructor(root: Node, W: number, H: number) {
    this.root = root; this.W = W; this.H = H;
    this.gnode = new Node('GS-Draw');
    this.gnode.layer = root.layer;
    root.addChild(this.gnode);
    this.gnode.addComponent(UITransform);
    this.g = this.gnode.addComponent(Graphics);
    this.staticRoot = new Node('GS-Static');
    this.staticRoot.layer = root.layer;
    root.addChild(this.staticRoot);
    this.staticRoot.setSiblingIndex(0);
    this.labelRoot = new Node('GS-Text');
    this.labelRoot.layer = root.layer;
    root.addChild(this.labelRoot);
  }

  /* ---------- 坐标：设计坐标(左上原点,y向下) -> 节点局部(中心原点,y向上) ---------- */
  base(): Mat { return [1, 0, 0, -1, -this.W / 2, this.H / 2]; }
  total(): Mat { return mul(this.base(), this.st.m); }
  mapU(x: number, y: number): [number, number] {
    const m = this.total();
    return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  }
  scaleFactor(): number {
    const m = this.total();
    return Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])) || 1;
  }
  angleDeg(): number {
    const m = this.total();
    return (Math.atan2(m[1], m[0]) * 180) / Math.PI;
  }

  /* ---------- 状态 ---------- */
  save() { this.stack.push(this.st.clone()); }
  restore() { if (this.stack.length) this.st = this.stack.pop(); }
  translate(x: number, y: number) { this.st.m = mul(this.st.m, [1, 0, 0, 1, x, y]); }
  scale(x: number, y: number) { this.st.m = mul(this.st.m, [x, 0, 0, y, 0, 0]); }
  rotate(a: number) { const c = Math.cos(a), s = Math.sin(a); this.st.m = mul(this.st.m, [c, s, -s, c, 0, 0]); }
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number) { this.st.m = [a, b, c, d, e, f]; }
  applyTransform() { /* 固定视口：DPR 变换由 Cocos 负责 */ }

  get fillStyle() { return this.st.fill; }
  set fillStyle(v: any) { this.st.fill = v; }
  get strokeStyle() { return this.st.stroke; }
  set strokeStyle(v: any) { this.st.stroke = v; }
  get lineWidth() { return this.st.lineWidth; }
  set lineWidth(v: number) { this.st.lineWidth = v; }
  get globalAlpha() { return this.st.alpha; }
  set globalAlpha(v: number) { this.st.alpha = v; }
  get font() { return this.st.font; }
  set font(v: string) {
    this.st.font = v;
    const m = /(\d+)?\s*(\d+(?:\.\d+)?)px/.exec(v || '');
    if (m) { this.st.fontSize = parseFloat(m[2]); this.st.fontWeight = m[1] ? parseInt(m[1], 10) : 600; }
  }
  get textAlign() { return this.st.align; }
  set textAlign(v: any) { this.st.align = v; }
  get textBaseline() { return this.st.baseline; }
  set textBaseline(v: any) { this.st.baseline = v; }
  get lineCap() { return this.st.lineCap; }
  set lineCap(v: any) { this.st.lineCap = v === 'round' ? LineCap.ROUND : v === 'square' ? LineCap.SQUARE : LineCap.BUTT; }
  get lineJoin() { return this.st.lineJoin; }
  set lineJoin(v: any) { this.st.lineJoin = v === 'round' ? LineJoin.ROUND : v === 'bevel' ? LineJoin.BEVEL : LineJoin.MITER; }
  get shadowColor() { return this.st.shadowColor; }
  set shadowColor(v: any) { this.st.shadowColor = v; }
  get shadowBlur() { return this.st.shadowBlur; }
  set shadowBlur(v: number) { this.st.shadowBlur = v; }
  get shadowOffsetY() { return this.st.shadowOffsetY; }
  set shadowOffsetY(v: number) { this.st.shadowOffsetY = v; }
  get canvasEl() { return this.canvas; }
  setLineDash(v: any) { this.st.dash = v; }
  getTransform() { return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }; }
  private grad(kind: 'linear' | 'radial', x0: number, y0: number, x1: number, y1: number, r0: number, r1: number): Grad {
    const g: Grad = { __grad: kind, stops: [], x0, y0, x1, y1, r0, r1, cx: x1, cy: y1 };
    (g as any).addColorStop = (o: number, c: string) => { g.stops.push({ o: Math.max(0, Math.min(1, o)), c }); };
    return g;
  }
  createLinearGradient(x0: number, y0: number, x1: number, y1: number) { return this.grad('linear', x0, y0, x1, y1, 0, 1); }
  createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number) { return this.grad('radial', x0, y0, x1, y1, r0, r1); }

  /* ---------- 路径 ---------- */
  beginPath() { this.path = []; this.pathU = []; this.closed = false; this.hasPath = false; }
  private pushP(u: number, v: number) {
    const [lx, ly] = this.mapU(u, v);
    this.path.push({ ux: u, uy: v, lx, ly });
    this.pathU.push({ x: u, y: v });
    this.hasPath = true;
  }
  moveTo(x: number, y: number) { this.pushP(x, y); }
  lineTo(x: number, y: number) { this.pushP(x, y); }
  quadraticCurveTo(cx: number, cy: number, x: number, y: number) {
    const n = 10;
    const p0 = this.pathU.length ? this.pathU[this.pathU.length - 1] : { x: cx, y: cy };
    for (let i = 1; i <= n; i++) {
      const t = i / n, it = 1 - t;
      const u = it * it * p0.x + 2 * it * t * cx + t * t * x;
      const v = it * it * p0.y + 2 * it * t * cy + t * t * y;
      this.pushP(u, v);
    }
  }
  bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number) {
    const n = 14;
    const p0 = this.pathU.length ? this.pathU[this.pathU.length - 1] : { x: c1x, y: c1y };
    for (let i = 1; i <= n; i++) {
      const t = i / n, it = 1 - t;
      const u = it * it * it * p0.x + 3 * it * it * t * c1x + 3 * it * t * t * c2x + t * t * t * x;
      const v = it * it * it * p0.y + 3 * it * it * t * c1y + 3 * it * t * t * c2y + t * t * t * y;
      this.pushP(u, v);
    }
  }
  private sampleArc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, ccw: boolean) {
    let delta = a1 - a0;
    if (ccw) { while (delta > 0) delta -= Math.PI * 2; } else { while (delta < 0) delta += Math.PI * 2; }
    const seg = Math.max(8, Math.min(48, Math.ceil(Math.abs(delta) / (Math.PI / 16))));
    for (let i = 1; i <= seg; i++) {
      const a = a0 + (delta * i) / seg;
      this.pushP(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry);
    }
  }
  arc(cx: number, cy: number, r: number, a0: number, a1: number, ccw = false) { this.sampleArc(cx, cy, r, r, a0, a1, ccw); }
  ellipse(cx: number, cy: number, rx: number, ry: number, rot: number, a0: number, a1: number, ccw = false) {
    if (!rot) { this.sampleArc(cx, cy, rx, ry, a0, a1, ccw); return; }
    const n = 24;
    const c = Math.cos(rot), s = Math.sin(rot);
    for (let i = 1; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      const ex = Math.cos(a) * rx, ey = Math.sin(a) * ry;
      this.pushP(cx + ex * c - ey * s, cy + ex * s + ey * c);
    }
  }
  arcTo(x1: number, y1: number, x2: number, y2: number, r: number) {
    if (!this.pathU.length || r <= 0) { this.lineTo(x1, y1); return; }
    const p0 = this.pathU[this.pathU.length - 1];
    const v1x = p0.x - x1, v1y = p0.y - y1, v2x = x2 - x1, v2y = y2 - y1;
    const l1 = Math.hypot(v1x, v1y) || 1, l2 = Math.hypot(v2x, v2y) || 1;
    const u1x = v1x / l1, u1y = v1y / l1, u2x = v2x / l2, u2y = v2y / l2;
    let dot = u1x * u2x + u1y * u2y; dot = Math.max(-1, Math.min(1, dot));
    const ang = Math.acos(dot);
    if (ang < 0.02) { this.lineTo(x1, y1); return; }
    const tanD = r / Math.tan(ang / 2);
    const tx1 = x1 + u1x * tanD, ty1 = y1 + u1y * tanD;
    const tx2 = x1 + u2x * tanD, ty2 = y1 + u2y * tanD;
    const nx = u1x + u2x, ny = u1y + u2y;
    const nl = Math.hypot(nx, ny) || 1;
    const cxd = x1 + (nx / nl) * (r / Math.sin(ang / 2));
    const cyd = y1 + (ny / nl) * (r / Math.sin(ang / 2));
    this.lineTo(tx1, ty1);
    const a0 = Math.atan2(ty1 - cyd, tx1 - cxd), a1 = Math.atan2(ty2 - cyd, tx2 - cxd);
    this.sampleArc(cxd, cyd, r, r, a0, a1, false);
  }
  closePath() { this.closed = true; }
  /** Cocos 端只支持轴对齐矩形裁剪（路径包围盒）：用于排序/卡片的溢出裁切 */
  clip() {
    if (!this.pathU.length) return;
    const bb = this.bboxU();
    const cur = this.st.clipRect;
    const next = { x0: bb.x0, y0: bb.y0, x1: bb.x1, y1: bb.y1 };
    this.st.clipRect = cur ? {
      x0: Math.max(cur.x0, next.x0), y0: Math.max(cur.y0, next.y0),
      x1: Math.min(cur.x1, next.x1), y1: Math.min(cur.y1, next.y1),
    } : next;
  }
  private clippedOut(x0: number, y0: number, x1: number, y1: number): boolean {
    const c = this.st.clipRect;
    if (!c) return false;
    return x1 < c.x0 || x0 > c.x1 || y1 < c.y0 || y0 > c.y1;
  }
  set lineDashOffset(v: any) { /* 忽略 */ }
  rect(x: number, y: number, w: number, h: number) {
    this.moveTo(x, y); this.lineTo(x + w, y); this.lineTo(x + w, y + h); this.lineTo(x, y + h); this.closePath();
  }
  roundRect(x: number, y: number, w: number, h: number, r: number) {
    const rr = Math.min(r, w / 2, h / 2);
    this.moveTo(x + rr, y);
    this.lineTo(x + w - rr, y); this.arcTo(x + w, y, x + w, y + rr, rr);
    this.lineTo(x + w, y + h - rr); this.arcTo(x + w, y + h, x + w - rr, y + h, rr);
    this.lineTo(x + rr, y + h); this.arcTo(x, y + h, x, y + h - rr, rr);
    this.lineTo(x, y + rr); this.arcTo(x, y, x + rr, y, rr);
    this.closePath();
  }

  private replayPath() {
    const g = this.g;
    if (!this.path.length) return;
    g.moveTo(this.path[0].lx, this.path[0].ly);
    for (let i = 1; i < this.path.length; i++) g.lineTo(this.path[i].lx, this.path[i].ly);
    if (this.closed) g.close();
  }
  private bboxU() {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of this.pathU) { if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x; if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y; }
    if (x0 > x1) { x0 = y0 = 0; x1 = y1 = 1; }
    return { x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  }
  fill() {
    const g = this.g; if (!this.path.length) return;
    const bb = this.bboxU();
    if (this.clippedOut(bb.x0, bb.y0, bb.x1, bb.y1)) return;
    let c: any = this.st.fill;
    if (c && c.__grad) c = gradColor(c, bb.cx, bb.cy, '#ffffff');
    g.fillColor = toColor(c, this.st.alpha);
    this.replayPath();
    g.fill();
  }
  stroke() {
    const g = this.g; if (!this.path.length) return;
    const bb = this.bboxU();
    if (this.clippedOut(bb.x0, bb.y0, bb.x1, bb.y1)) return;
    let c: any = this.st.stroke;
    if (c && c.__grad) c = gradColor(c, bb.cx, bb.cy, '#ffffff');
    g.strokeColor = toColor(c, this.st.alpha);
    g.lineWidth = Math.max(0.5, this.st.lineWidth * this.scaleFactor());
    g.lineCap = this.st.lineCap; g.lineJoin = this.st.lineJoin;
    this.replayPath();
    g.stroke();
  }

  /* ---------- 矩形 ---------- */
  private quad(x: number, y: number, w: number, h: number) {
    const pts = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]].map(([a, b]) => this.mapU(a, b));
    const g = this.g;
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < 4; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.close();
  }
  fillRect(x: number, y: number, w: number, h: number) {
    const c0 = this.st.clipRect;
    if (c0) {
      const nx0 = Math.max(x, c0.x0), ny0 = Math.max(y, c0.y0);
      const nx1 = Math.min(x + w, c0.x1), ny1 = Math.min(y + h, c0.y1);
      if (nx1 <= nx0 || ny1 <= ny0) return;
      x = nx0; y = ny0; w = nx1 - nx0; h = ny1 - ny0;
    }
    const c: any = this.st.fill;
    if (c && c.__grad) {
      const n = 14;
      if (c.__grad === 'linear' && Math.abs(c.x0 - c.x1) < 0.01 && Math.abs(c.y0 - c.y1) > 0.01) {
        const step = h / n;
        for (let i = 0; i < n; i++) {
          this.g.fillColor = toColor(gradColor(c, x + w / 2, y + step * (i + 0.5), '#ffffff'), this.st.alpha);
          this.quad(x, y + i * step, w, step + 0.6);
          this.g.fill();
        }
        return;
      }
      if (c.__grad === 'linear' && Math.abs(c.y0 - c.y1) < 0.01 && Math.abs(c.x0 - c.x1) > 0.01) {
        const step = w / n;
        for (let i = 0; i < n; i++) {
          this.g.fillColor = toColor(gradColor(c, x + step * (i + 0.5), y + h / 2, '#ffffff'), this.st.alpha);
          this.quad(x + i * step, y, step + 0.6, h);
          this.g.fill();
        }
        return;
      }
      if (c.__grad === 'radial') return; // 径向光晕/暗角：Cocos 端直接省略，避免色带

    }
    this.g.fillColor = toColor(c, this.st.alpha);
    this.quad(x, y, w, h);
    this.g.fill();
  }
  strokeRect(x: number, y: number, w: number, h: number) {
    this.g.strokeColor = toColor(this.st.stroke, this.st.alpha);
    this.g.lineWidth = Math.max(0.5, this.st.lineWidth * this.scaleFactor());
    this.quad(x, y, w, h);
    this.g.stroke();
  }
  clearRect(x: number, y: number, w: number, h: number) {
    if (x <= 0 && y <= 0 && w >= this.W && h >= this.H) { this.g.clear(); this.resetLabels(); }
  }
  private resetLabels() { for (const l of this.labels) l.node.active = false; this.labelUsed = 0; }

  /* ---------- 文字 ---------- */
  private labelSlot(): Label {
    while (this.labels.length <= this.labelUsed) {
      const n = new Node('GS-Label');
      n.layer = this.root.layer;
      this.labelRoot.addChild(n);
      n.addComponent(UITransform);
      const l = n.addComponent(Label);
      l.overflow = Label.Overflow.NONE;
      l.useSystemFont = true;
      this.labels.push(l);
    }
    const l = this.labels[this.labelUsed++];
    l.node.active = true;
    return l;
  }
  private measureWidth(str: string): number {
    let w = 0;
    for (const ch of String(str)) w += ch.charCodeAt(0) > 0x2e80 ? this.st.fontSize : this.st.fontSize * 0.56;
    return w;
  }
  measureText(str: string) { return { width: this.measureWidth(str) }; }
  private drawText(str: string, x: number, y: number, stroke: boolean) {
    if (str === undefined || str === null) return;
    if (this.clippedOut(x, y, x, y)) return;
    const text = String(str);
    if (!text) return;
    const l = this.labelSlot();
    const [lx, lyRaw] = this.mapU(x, y);
    const sf = this.scaleFactor();
    const size = Math.max(6, this.st.fontSize * sf);
    l.string = text;
    l.fontSize = Math.round(size * 10) / 10;
    l.lineHeight = l.fontSize * 1.18;
    l.isBold = this.st.fontWeight >= 700;
    let fc: any = this.st.fill;
    if (fc && fc.__grad) fc = gradColor(fc, x, y, '#ffffff');
    l.color = toColor(fc, this.st.alpha);
    const node = l.node;
    const ui = node.getComponent(UITransform);
    let anchorX = 0.5;
    if (this.st.align === 'left') anchorX = 0;
    else if (this.st.align === 'right') anchorX = 1;
    const baseShift = this.st.baseline === 'alphabetic' ? 0.32 * this.st.fontSize : this.st.baseline === 'top' ? -0.45 * this.st.fontSize : this.st.baseline === 'bottom' ? 0.45 * this.st.fontSize : 0;
    const [px, py] = this.mapU(x, y + (this.st.baseline === 'alphabetic' || this.st.baseline === 'top' || this.st.baseline === 'bottom' ? 0 : 0));
    if (ui) ui.setAnchorPoint(anchorX, 0.5);
    node.setPosition(new Vec3(px, py - baseShift * sf, 0));
    const ang = this.angleDeg();
    if (Math.abs(ang) > 1) node.angle = -ang; else node.angle = 0;
    let outline = node.getComponent(LabelOutline);
    if (stroke || (this.st.shadowColor && this.st.fontWeight >= 900 && false)) {
      if (!outline) outline = node.addComponent(LabelOutline);
      let sc: any = this.st.stroke;
      if (sc && sc.__grad) sc = gradColor(sc, x, y, '#ffffff');
      outline.color = toColor(sc, this.st.alpha);
      outline.width = Math.max(1, this.st.lineWidth * sf);
    } else if (outline) { outline.enabled = false; }
  }
  /** 离屏画布 → 一次性静态 Graphics 节点（背景缓存） */
  drawImage(img: any, dx = 0, dy = 0, dw?: number, dh?: number) {
    if (!img || !img.__gsRecorder || !img.ops || !img.ops.length) return;
    let rec = this.images.get(img);
    if (!rec) {
      const node = new Node('GS-BG');
      node.layer = this.root.layer;
      this.staticRoot.addChild(node);
      const g = node.addComponent(Graphics);
      this.replayStatic(g, img.ops);
      rec = { node, w: img.width, h: img.height };
      this.images.set(img, rec);
    }
    rec.node.active = true;
    if (dw && dh && (dw !== rec.w || dh !== rec.h)) {
      rec.node.setScale(dw / rec.w, dh / rec.h, 1);
    } else rec.node.setScale(1, 1, 1);
    this.usedImages.add(img);
  }
  private replayStatic(g: Graphics, ops: any[]) {
    const W = this.W, H = this.H;
    const lx = (x: number) => x - W / 2, ly = (y: number) => H / 2 - y;
    for (const op of ops) {
      if (op.k === 'rect') {
        let st = op.style;
        if (st && st.__grad === 'radial') continue; // 径向光晕/暗角省略，避免色带
        if (st && st.__grad) {
          const n = 10, vertical = Math.abs(st.x0 - st.x1) < 0.01;
          for (let i = 0; i < n; i++) {
            const a = op.x + (vertical ? 0 : (op.w * i) / n), b = op.y + (vertical ? (op.h * i) / n : 0);
            const w2 = vertical ? op.w : op.w / n + 0.6, h2 = vertical ? op.h / n + 0.6 : op.h;
            const c = gradColor(st, a + w2 / 2, b + h2 / 2, '#ffffff');
            g.fillColor = toColor(c, op.alpha == null ? 1 : op.alpha);
            g.rect(lx(a), ly(b + h2), w2, h2); g.fill();
          }
          continue;
        }
        if (!st) continue;
        g.fillColor = toColor(st, op.alpha == null ? 1 : op.alpha);
        if (op.stroke) { g.strokeColor = toColor(op.stroke, op.alpha == null ? 1 : op.alpha); g.lineWidth = op.lw || 1; g.rect(lx(op.x), ly(op.y + op.h), op.w, op.h); g.stroke(); }
        else { g.rect(lx(op.x), ly(op.y + op.h), op.w, op.h); g.fill(); }
        continue;
      }
      if (op.k === 'path' && op.pts.length) {
        if (op.style != null) {
          let st = op.style;
          if (st && st.__grad) {
            let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
            for (const pt of op.pts) { if (pt.x < x0) x0 = pt.x; if (pt.x > x1) x1 = pt.x; if (pt.y < y0) y0 = pt.y; if (pt.y > y1) y1 = pt.y; }
            st = gradColor(st, (x0 + x1) / 2, (y0 + y1) / 2, '#ffffff');
          }
          g.fillColor = toColor(st, op.alpha == null ? 1 : op.alpha);
          g.moveTo(lx(op.pts[0].x), ly(op.pts[0].y));
          for (let i = 1; i < op.pts.length; i++) g.lineTo(lx(op.pts[i].x), ly(op.pts[i].y));
          if (op.closed) g.close();
          g.fill();
        }
        if (op.stroke != null) {
          g.strokeColor = toColor(op.stroke, op.alpha == null ? 1 : op.alpha);
          g.lineWidth = op.lw || 1;
          g.moveTo(lx(op.pts[0].x), ly(op.pts[0].y));
          for (let i = 1; i < op.pts.length; i++) g.lineTo(lx(op.pts[i].x), ly(op.pts[i].y));
          if (op.closed) g.close();
          g.stroke();
        }
      }
    }
  }
  fillText(str: string, x: number, y: number) { this.drawText(str, x, y, false); }
  strokeText(str: string, x: number, y: number) { this.drawText(str, x, y, true); }

  /* ---------- 帧管理 ---------- */
  beginFrame() {
    this.g.clear();
    this.st = new State();
    this.stack = [];
    this.path = []; this.pathU = []; this.closed = false; this.hasPath = false;
    this.resetLabels();
    this.usedImages.clear();
  }
  flush() {
    for (let i = this.labelUsed; i < this.labels.length; i++) this.labels[i].node.active = false;
    for (const [img, rec] of this.images) if (!this.usedImages.has(img)) rec.node.active = false;
  }
}

/** 构造给游戏引擎用的固定视口假 canvas */
export function makeFakeCanvas(surface: CanvasSurface, W: number, H: number) {
  const c: any = {
    __gsFixed: true, width: W, height: H, style: {},
    getContext: () => surface,
    addEventListener() {}, removeEventListener() {},
    setPointerCapture() {}, releasePointerCapture() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: W, height: H, right: W, bottom: H }),
    requestAnimationFrame: null,
    ownerDocument: {
      createElement: (tag: string) => (tag === 'canvas' ? new RecorderCanvas(W, H) : null),
    },
  };
  surface.canvas = c;
  return c;
}
