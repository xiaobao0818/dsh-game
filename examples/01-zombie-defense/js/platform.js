/* =========================================================================
 * platform.js —— 浏览器平台层：自适应布局 / WebAudio 合成音乐音效 /
 *                 粒子与屏震 / 指针输入
 * ========================================================================= */
import { clamp, RNG } from './core.js';

/* ------------------------------ 布局 ------------------------------ */
export class Layout {
  constructor(canvas, W, H) {
    this.canvas = canvas;
    this.W = W; this.H = H;
    this.scale = 1; this.ox = 0; this.oy = 0;
    this.resize();
  }
  resize() {
    // 固定视口模式（Cocos 宿主）：设计分辨率由引擎缩放，这里不再做 DOM 适配
    if (this.canvas && this.canvas.__gsFixed) {
      this.scale = 1; this.ox = 0; this.oy = 0; this.dpr = 1;
      this.canvas.width = this.W; this.canvas.height = this.H;
      if (this.canvas.style) {
        this.canvas.style.width = this.W + 'px';
        this.canvas.style.height = this.H + 'px';
        this.canvas.style.marginLeft = '0px';
        this.canvas.style.marginTop = '0px';
      }
      return;
    }
    // 限制总像素（约 240 万），保证竖屏高分设备也能 60fps
    const baseDpr = Math.min(2, window.devicePixelRatio || 1);
    const dpr = Math.max(1, Math.min(baseDpr, Math.sqrt(2400000 / (this.W * this.H))));
    const vw = window.innerWidth, vh = window.innerHeight;
    this.scale = Math.min(vw / this.W, vh / this.H);
    const cw = Math.round(this.W * this.scale), ch = Math.round(this.H * this.scale);
    this.ox = Math.round((vw - cw) / 2); this.oy = Math.round((vh - ch) / 2);
    const c = this.canvas;
    c.width = Math.round(this.W * dpr); c.height = Math.round(this.H * dpr);
    c.style.width = cw + 'px'; c.style.height = ch + 'px';
    // #app 已是 flex 居中：不要再加 margin，否则窗口比例与设计比例不同时画布会被二次偏移
    c.style.marginLeft = '0px'; c.style.marginTop = '0px';
    this.dpr = dpr;
  }
  applyTransform(ctx) { ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); }
  toDesign(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * this.W, y: ((clientY - r.top) / r.height) * this.H };
  }
}

/* ------------------------------ 音频 ------------------------------ */
const NOTE = (semi) => 440 * Math.pow(2, semi / 12); // semi 相对 A4

export class Sound {
  constructor(theme) {
    this.theme = theme || {};
    this.ctx = null; this.master = null; this.musicGain = null; this.sfxGain = null;
    this.muted = { music: false, sfx: false };
    this.started = false; this.timer = null; this.step = 0; this.nextTime = 0; this.rng = new RNG(7);
    this.mood = this.theme.music || { root: -9, scale: [0, 2, 4, 7, 9], tempo: 76 };
  }
  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return true; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.85; this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.26; this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.7; this.sfxGain.connect(this.master);
      this.startMusic();
      return true;
    } catch (e) { this.ctx = null; return false; }
  }
  setMuted(kind, v) {
    this.muted[kind] = v;
    if (!this.ctx) return;
    const g = kind === 'music' ? this.musicGain : this.sfxGain;
    g.gain.setTargetAtTime(v ? 0 : (kind === 'music' ? 0.26 : 0.7), this.ctx.currentTime, 0.08);
  }
  /* 单音：type/freq/dur/gain/slide/attack */
  tone({ type = 'sine', freq = 440, dur = 0.15, gain = 0.25, slide = 0, attack = 0.005, dest = null, when = 0 }) {
    if (!this.ctx || this.muted.sfx) return;
    const t0 = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || this.sfxGain); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  noise({ dur = 0.18, gain = 0.2, freq = 1200, q = 1, type = 'lowpass', when = 0 }) {
    if (!this.ctx || this.muted.sfx) return;
    const t0 = this.ctx.currentTime + when;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain(); g.gain.value = gain;
    src.connect(f); f.connect(g); g.connect(this.sfxGain); src.start(t0);
  }
  sfx(name) {
    if (!this.ctx) return;
    switch (name) {
      case 'click': this.tone({ type: 'triangle', freq: 660, dur: 0.06, gain: 0.16, slide: 1.2 }); break;
      case 'coin': this.tone({ type: 'square', freq: 880, dur: 0.07, gain: 0.1 }); this.tone({ type: 'square', freq: 1320, dur: 0.1, gain: 0.07, when: 0.05 }); break;
      case 'hit': this.noise({ dur: 0.08, gain: 0.12, freq: 900, type: 'bandpass', q: 1.4 }); break;
      case 'punch': this.tone({ type: 'sine', freq: 160, dur: 0.12, gain: 0.3, slide: 0.5 }); break;
      case 'arrow': this.tone({ type: 'sawtooth', freq: 900, dur: 0.08, gain: 0.05, slide: 0.4 }); break;
      case 'explode': this.noise({ dur: 0.35, gain: 0.32, freq: 320, type: 'lowpass' }); this.tone({ type: 'sine', freq: 90, dur: 0.3, gain: 0.28, slide: 0.4 }); break;
      case 'build': this.tone({ type: 'triangle', freq: 330, dur: 0.12, gain: 0.18 }); this.tone({ type: 'triangle', freq: 494, dur: 0.16, gain: 0.15, when: 0.07 }); break;
      case 'upgrade': [523, 659, 784, 1046].forEach((f, i) => this.tone({ type: 'triangle', freq: f, dur: 0.14, gain: 0.12, when: i * 0.06 })); break;
      case 'spell': this.tone({ type: 'sine', freq: 300, dur: 0.4, gain: 0.2, slide: 2.4 }); this.noise({ dur: 0.3, gain: 0.1, freq: 2000, type: 'highpass' }); break;
      case 'freeze': this.tone({ type: 'sine', freq: 1400, dur: 0.3, gain: 0.1, slide: 0.6 }); break;
      case 'merge': this.tone({ type: 'triangle', freq: 440, dur: 0.1, gain: 0.16, slide: 1.6 }); break;
      case 'win': [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone({ type: 'triangle', freq: f, dur: 0.22, gain: 0.14, when: i * 0.1 })); break;
      case 'lose': [392, 330, 262, 196].forEach((f, i) => this.tone({ type: 'sawtooth', freq: f, dur: 0.26, gain: 0.09, when: i * 0.13 })); break;
      case 'warn': this.tone({ type: 'square', freq: 220, dur: 0.18, gain: 0.1, slide: 0.8 }); break;
      case 'pickup': this.tone({ type: 'sine', freq: 1046, dur: 0.06, gain: 0.1 }); this.tone({ type: 'sine', freq: 1568, dur: 0.08, gain: 0.07, when: 0.03 }); break;
      default: this.tone({ type: 'sine', freq: 520, dur: 0.06, gain: 0.1 });
    }
  }
  /* 极简程序化配乐：和弦 pad + 五声音阶琶音，按 mood 换调式 */
  startMusic() {
    if (!this.ctx || this.timer) return;
    const m = this.mood;
    const beat = 60 / (m.tempo || 76);
    this.nextTime = this.ctx.currentTime + 0.1; this.step = 0;
    const tick = () => {
      if (!this.ctx) return;
      while (this.nextTime < this.ctx.currentTime + 0.6) {
        if (!this.muted.music) this.playStep(this.step, this.nextTime - this.ctx.currentTime, beat, m);
        this.nextTime += beat; this.step++;
      }
      this.timer = setTimeout(tick, 180);
    };
    tick();
  }
  playStep(step, when, beat, m) {
    const scale = m.scale || [0, 2, 4, 7, 9];
    const root = m.root ?? -9;
    const bar = Math.floor(step / 8) % 4;
    const chords = [[0, 4, 7], [-3, 2, 5], [-5, 0, 4], [-1, 2, 7]];
    const ch = chords[bar];
    if (step % 8 === 0) {
      for (const s of ch) this.pad(NOTE(root + s - 12), beat * 4, 0.05, when);
    }
    if (step % 2 === 0) {
      const deg = scale[Math.floor(this.rng.next() * scale.length)];
      this.arp(NOTE(root + deg + 12), beat * 0.9, 0.035, when);
    }
    if (step % 8 === 4) this.arp(NOTE(root + ch[2]), beat * 1.4, 0.03, when);
  }
  pad(freq, dur, gain, when) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + when;
    for (let i = 0; i < 2; i++) {
      const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
      o.type = i ? 'sine' : 'triangle'; o.frequency.value = freq * (i ? 1.005 : 1);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(gain, t0 + dur * 0.3);
      g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(this.musicGain); o.start(t0); o.stop(t0 + dur + 0.05);
    }
  }
  arp(freq, dur, gain, when) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(this.musicGain); o.start(t0); o.stop(t0 + dur + 0.05);
  }
}

/* ------------------------------ 粒子 / 表演 ------------------------------ */
export class Fx {
  constructor() { this.parts = []; this.texts = []; this.rings = []; this.shakeAmt = 0; this.flashAmt = 0; this.quality = 1; this.rng = new RNG(99); }
  burst(x, y, n = 8, opts = {}) {
    const color = opts.color || '#fff';
    const speed = opts.speed || 180;
    const count = Math.round(n * this.quality);
    for (let i = 0; i < count; i++) {
      const a = opts.angle != null ? opts.angle + (this.rng.next() - 0.5) * (opts.spread || 1.6) : this.rng.next() * Math.PI * 2;
      const v = speed * (0.4 + this.rng.next() * 0.9);
      this.parts.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (opts.up || 0),
        life: 0, max: (opts.life || 0.5) * (0.6 + this.rng.next() * 0.7),
        size: (opts.size || 3) * (0.6 + this.rng.next() * 0.8),
        color, grav: opts.grav != null ? opts.grav : 420, shape: opts.shape || 'dot', drag: opts.drag || 0.99,
      });
    }
  }
  text(x, y, str, color = '#fff', size = 22, opts = {}) {
    this.texts.push({ x, y, str: String(str), color, size, life: 0, max: opts.max || 0.9, vy: opts.vy != null ? opts.vy : -60, vx: opts.vx || 0 });
    if (this.texts.length > 40) this.texts.shift();
  }
  ring(x, y, color = '#fff', r = 10, opts = {}) { this.rings.push({ x, y, color, r, r0: r, life: 0, max: opts.max || 0.45, grow: opts.grow || 120 }); }
  beam() { /* 预留给技能连接线 */ }
  shake(n) { this.shakeAmt = Math.min(26, this.shakeAmt + n); }
  flash(a) { this.flashAmt = Math.max(this.flashAmt, a); }
  update(dt) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i]; p.life += dt;
      if (p.life >= p.max) { this.parts.splice(i, 1); continue; }
      p.vx *= p.drag; p.vy = p.vy * p.drag + p.grav * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i]; t.life += dt;
      if (t.life >= t.max) { this.texts.splice(i, 1); continue; }
      t.x += t.vx * dt; t.y += t.vy * dt; t.vy += 130 * dt;
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i]; r.life += dt;
      if (r.life >= r.max) { this.rings.splice(i, 1); continue; }
      r.r += r.grow * dt;
    }
    this.shakeAmt *= Math.exp(-7 * dt); if (this.shakeAmt < 0.2) this.shakeAmt = 0;
    this.flashAmt *= Math.exp(-6 * dt); if (this.flashAmt < 0.01) this.flashAmt = 0;
  }
  draw(ctx) {
    for (const p of this.parts) {
      const k = 1 - p.life / p.max;
      ctx.globalAlpha = Math.max(0, k);
      ctx.fillStyle = p.color;
      if (p.shape === 'spark') {
        ctx.fillRect(p.x - p.size * 0.5, p.y - p.size * 0.5, p.size, p.size * 2.2);
      } else if (p.shape === 'ring') {
        ctx.strokeStyle = p.color; ctx.lineWidth = Math.max(1, p.size * 0.5);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.4 - k), 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.4 + k * 0.8), 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    for (const r of this.rings) {
      const k = 1 - r.life / r.max;
      ctx.globalAlpha = Math.max(0, k) * 0.8; ctx.strokeStyle = r.color; ctx.lineWidth = 3 * k + 1;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (const t of this.texts) {
      const k = t.life / t.max;
      ctx.globalAlpha = Math.max(0, 1 - k * k);
      ctx.font = `900 ${t.size}px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.55)';
      ctx.strokeText(t.str, t.x, t.y); ctx.fillStyle = t.color; ctx.fillText(t.str, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }
  flashDraw(ctx, W, H) {
    if (this.flashAmt > 0.01) { ctx.fillStyle = `rgba(255,255,255,${this.flashAmt * 0.5})`; ctx.fillRect(0, 0, W, H); }
  }
}

/* ------------------------------ 输入 ------------------------------ */
export class Input {
  constructor(canvas, layout, handlers) {
    this.canvas = canvas; this.layout = layout; this.h = handlers;
    this.active = new Map();
    this.last = { x: 0, y: 0 };
    const down = (e) => {
      const p = this.pt(e); this.active.set(e.pointerId ?? 0, p); this.last = p;
      this.h.onDown?.(p.x, p.y, e);
      if (e.pointerId != null && canvas.setPointerCapture) { try { canvas.setPointerCapture(e.pointerId); } catch (err) {} }
      e.preventDefault();
    };
    const move = (e) => {
      const p = this.pt(e); this.last = p;
      this.h.onMove?.(p.x, p.y, e);
      e.preventDefault();
    };
    const up = (e) => {
      const p = this.pt(e); this.h.onUp?.(p.x, p.y, e);
      this.active.delete(e.pointerId ?? 0);
      e.preventDefault();
    };
    if (canvas.__gsFixed) return; // Cocos 等固定视口宿主自行转发输入
    canvas.addEventListener('pointerdown', down, { passive: false });
    canvas.addEventListener('pointermove', move, { passive: false });
    canvas.addEventListener('pointerup', up, { passive: false });
    canvas.addEventListener('pointercancel', up, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', (e) => {
      if (this.h.onKey) this.h.onKey(e.key, e);
    });
    window.addEventListener('resize', () => layout.resize());
  }
  pt(e) {
    const t = e.touches ? e.touches[0] : e;
    return this.layout.toDesign(t.clientX, t.clientY);
  }
}
