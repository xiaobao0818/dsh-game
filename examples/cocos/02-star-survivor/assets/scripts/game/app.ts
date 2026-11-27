// @ts-nocheck
/* =========================================================================
 * app.js —— 游戏外壳：画布/自适应/固定步长主循环/场景栈（标题-选关-战斗-结算-
 *           设置-说明）/存档/音频解锁/暂停/调试 API
 * 规则层（js/rules/*.js）只负责玩法；这里负责所有通用壳层。
 * ========================================================================= */
import { clamp, makeSave, RNG, fmt, fmtTime } from './core';
import { Layout, Sound, Fx, Input } from './platform';
import { makeArt } from './art';
import * as R from './render';

const STEP = 1 / 60;

export class App {
  constructor(canvas, content, createRule, opts = {}) {
    this.canvas = canvas;
    this.content = content;
    this.createRule = createRule;
    this.cfg = content.config || {};
    this.portrait = (content.orientation || 'landscape') === 'portrait';
    this.W = this.portrait ? 720 : 1280;
    this.H = this.portrait ? 1280 : 720;
    this.layout = new Layout(canvas, this.W, this.H);
    this.art = makeArt(content.theme || {});
    this.audio = new Sound(content.theme || {});
    this.fx = new Fx();
    this.save = makeSave(content.slug || 'game', content.saveDefaults || {});
    this.ctx = canvas.getContext('2d');
    this.scene = 'title';
    this.sceneT = 0;
    this.acc = 0; this.last = 0; this.fps = 60; this.frames = 0; this.fpsT = 0;
    this.buttons = [];
    this.toasts = [];
    this.levelId = 0; this.rule = null; this.pendingResult = null; this.finishing = 0;
    this.paused = false;
    this.started = false;
    this.externalLoop = !!opts.externalLoop;
    this.fixedViewport = !!opts.fixedViewport;
    this.demoT = 0;
    this.tipsSeen = this.save.data.tipsSeen || {};
    this.inputBound = false;
    this.loop = this.loop.bind(this);
    this.input = null;
  }
  mount() {
    this.layout.resize();
    if (!this.fixedViewport) this.layout.applyTransform(this.ctx);
    this.input = new Input(this.canvas, this.layout, {
      onDown: (x, y) => this.onDown(x, y),
      onMove: (x, y) => { if (this.scene === 'play' && this.rule && !this.paused) this.rule.pointer('move', x, y); },
      onUp: (x, y) => { if (this.scene === 'play' && this.rule && !this.paused) this.rule.pointer('up', x, y); },
      onKey: (k) => this.onKey(k),
    });
    if (typeof document !== 'undefined' && document.addEventListener) {
      document.addEventListener('visibilitychange', () => { if (document.hidden && this.scene === 'play') this.setPaused(true); });
    }
    if (!this.externalLoop) requestAnimationFrame(this.loop);
  }
  begin() {
    if (this.started) return;
    this.started = true;
    if (!this.audio.ensure()) { /* 无音频环境也继续 */ }
    for (const k of ['music', 'sfx']) this.audio.setMuted(k, !this.save.settings[k]);
    if (this.save.data.firstRun) { this.save.data.firstRun = false; this.save.flush(); }
  }
  /* ---------------------------- 主循环 ---------------------------- */
  loop(ts) {
    if (!this.last) this.last = ts;
    let dt = (ts - this.last) / 1000; this.last = ts;
    if (dt > 0.25) dt = 0.25;
    this.frame(dt);
    if (!this.externalLoop) requestAnimationFrame(this.loop);
  }
  /** 外部驱动（Cocos 宿主）：由引擎的 update(dt) 调用，不自行 requestAnimationFrame */
  tickExternal(dt) {
    const d = Math.min(dt || 0.016, 0.25);
    this.frame(d);
  }
  frame(dt) {
    this.frames++; this.fpsT += dt;
    if (this.fpsT >= 0.5) { this.fps = this.frames / this.fpsT; this.frames = 0; this.fpsT = 0; }
    this.sceneT += dt; this.demoT += dt;
    if (this.scene === 'play' && !this.paused) {
      this.acc += dt;
      let guard = 0;
      while (this.acc >= STEP && guard < 4) { this.step(STEP); this.acc -= STEP; guard++; }
      if (guard >= 4) this.acc = 0;
    } else {
      this.acc = 0;
    }
    this.fx.update(dt);
    this.updateToasts(dt);
    if (this.scene === 'play' && this.rule && !this.paused) {
      if (this.rule.status !== 'playing' && this.finishing === 0) {
        this.finishing = 0.0001;
        this.audio.sfx(this.rule.status === 'won' ? 'win' : 'lose');
      }
      if (this.finishing > 0) {
        this.finishing += dt;
        if (this.finishing > 1.25) this.finishLevel();
      }
    }
    this.render(dt);
  }
  step(dt) {
    if (!this.rule) return;
    this.rule.update(dt);
  }
  /* 测试用：用机器人策略快进 n 秒（不渲染），返回当前状态 */
  fastForward(seconds) {
    if (this.scene !== 'play' || !this.rule) return 'no-play';
    const steps = Math.round((seconds || 60) * 60);
    for (let i = 0; i < steps && this.rule.status === 'playing'; i++) {
      if (this.rule.bot) this.rule.bot(1 / 60);
      this.step(1 / 60);
    }
    return this.rule.status;
  }
  /* ---------------------------- 场景 ---------------------------- */
  go(scene) {
    this.scene = scene; this.sceneT = 0; this.buttons = [];
    if (scene !== 'play') { this.paused = false; }
    if (scene === 'title') this.audio.musicGain && this.audio.musicGain.gain.setTargetAtTime(0.26, this.audio.ctx.currentTime, 0.2);
  }
  startLevel(id) {
    const levels = this.content.levels || [];
    const lv = levels.find((l) => l.id === id) || levels[0];
    if (!lv) return false;
    this.levelId = lv.id;
    this.finishing = 0; this.pendingResult = null; this.paused = false;
    const self = this;
    const svc = {
      app: this, content: this.content, level: lv, levelId: lv.id,
      W: this.W, H: this.H, portrait: this.portrait,
      rng: new RNG(this.content.slug + ':' + lv.id + ':' + (this.cfg.seed || 0)),
      save: this.save, audio: this.audio, fx: this.fx, art: this.art,
      finish: (payload) => { if (!self.pendingResult) self.pendingResult = payload || {}; },
      toast: (msg) => self.toast(msg),
      replay: () => self.startLevel(self.levelId),
      next: () => self.nextLevel(),
    };
    this.rule = this.createRule(svc);
    this.rule.init();
    this.scene = 'play'; this.sceneT = 0; this.buttons = [];
    this.audio.ensure();
    return true;
  }
  finishLevel() {
    const win = this.rule && this.rule.status === 'won';
    const payload = this.pendingResult || (this.rule && this.rule.result && this.rule.result()) || {};
    const stars = win ? clamp(Math.round(payload.stars == null ? 1 : payload.stars), 1, 3) : 0;
    if (win) {
      this.save.complete(this.levelId, stars, payload.score || 0);
      if (payload.coins) this.save.addCoins(payload.coins);
      this.save.data.playSec = (this.save.data.playSec || 0) + Math.round(this.sceneT);
      this.save.flush();
    }
    this.result = { win, stars, payload };
    this.scene = 'result'; this.sceneT = 0; this.buttons = [];
  }
  nextLevel() {
    const levels = this.content.levels || [];
    const i = levels.findIndex((l) => l.id === this.levelId);
    if (i >= 0 && i + 1 < levels.length) return this.startLevel(levels[i + 1].id);
    this.go('levels');
    return false;
  }
  setPaused(v) { this.paused = !!v; this.sceneT = this.sceneT; this.buttons = []; }
  toast(msg) {
    if (!msg) return;
    this.toasts.push({ msg: String(msg), life: 0, max: 2.2 });
    if (this.toasts.length > 3) this.toasts.shift();
  }
  updateToasts(dt) {
    for (let i = this.toasts.length - 1; i >= 0; i--) { this.toasts[i].life += dt; if (this.toasts[i].life >= this.toasts[i].max) this.toasts.splice(i, 1); }
  }
  /* ---------------------------- 输入分发 ---------------------------- */
  onDown(x, y) {
    this.begin();
    for (let i = this.buttons.length - 1; i >= 0; i--) {
      const b = this.buttons[i];
      if (b.disabled) continue;
      if (x >= b.r.x && x <= b.r.x + b.r.w && y >= b.r.y && y <= b.r.y + b.r.h) {
        this.audio.sfx('click');
        this.vibrate(8);
        b.fn();
        return;
      }
    }
    if (this.scene === 'play' && this.rule && !this.paused) this.rule.pointer('down', x, y);
  }
  onKey(k) {
    if (this.scene === 'play') {
      if (k === 'Escape' || k === 'p' || k === 'P') { this.setPaused(!this.paused); }
      if (this.rule && !this.paused) this.rule.pointer('key', 0, 0, k);
    } else if (k === 'Escape' || k === 'Backspace') {
      if (this.scene === 'levels' || this.scene === 'settings' || this.scene === 'howto') this.go('title');
      if (this.scene === 'result') this.go('levels');
    } else if (k === 'Enter' || k === ' ') {
      if (this.scene === 'title') this.startLevel(this.save.data.unlocked || 1);
      if (this.scene === 'result' && this.result) { this.result.win ? this.nextLevel() : this.startLevel(this.levelId); }
    }
  }
  vibrate(ms) { try { if (this.save.settings.haptic && navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }

  /* ---------------------------- 绘制 ---------------------------- */
  render(dt) {
    const ctx = this.ctx, W = this.W, H = this.H;
    this.layout.applyTransform(ctx);
    ctx.clearRect(0, 0, W, H);
    this.buttons = [];
    if (this.scene === 'title') this.drawTitle(ctx);
    else if (this.scene === 'levels') this.drawLevels(ctx);
    else if (this.scene === 'play') this.drawPlay(ctx);
    else if (this.scene === 'result') this.drawResult(ctx);
    else if (this.scene === 'settings') this.drawSettings(ctx);
    else if (this.scene === 'howto') this.drawHowto(ctx);
    if (this.paused && this.scene === 'play') this.drawPause(ctx);
    this.drawToasts(ctx);
    this.fx.flashDraw(ctx, W, H);
  }
  mkButton(ctx, r, label, fn, o = {}) {
    this.buttons.push({ r, fn, disabled: !!o.disabled });
    R.button(ctx, r, label, o);
  }
  drawBg(ctx, groundY) {
    this.art.scene(ctx, this.W, this.H, this.demoT, { groundY });
  }
  drawTitle(ctx) {
    const W = this.W, H = this.H, t = this.demoT, P = this.portrait;
    const groundY = P ? H * 0.42 : H * 0.60;
    this.drawBg(ctx, groundY);
    const pg = ctx.createLinearGradient(0, 0, 0, H);
    pg.addColorStop(0, 'rgba(0,0,0,.10)'); pg.addColorStop(1, 'rgba(0,0,0,.55)');
    ctx.fillStyle = pg; ctx.fillRect(0, 0, W, H);
    // 角色展示（在标题与按钮之间）
    const art = this.art, n = 4;
    for (let i = 0; i < n; i++) {
      const x = W * (0.5 + (i - (n - 1) / 2) * (P ? 0.19 : 0.15));
      const y = groundY + (i % 2 ? 0 : 8);
      art.char(ctx, x, y, (P ? 2.1 : 1.8) + (i === 1 ? 0.25 : 0), {
        kind: i === 2 ? 'enemy' : 'hero', role: ['melee', 'ranged', 'mage', 'heal'][i],
        facing: i === 2 ? -1 : 1, t: t + i, name: 'showcase' + i, moving: true,
      });
    }
    const titleSize = Math.min(W * 0.085, 92);
    ctx.save();
    ctx.font = `900 ${titleSize}px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const y = P ? H * 0.16 : H * 0.21;
    ctx.lineWidth = titleSize * 0.14; ctx.strokeStyle = 'rgba(8,10,20,.85)'; ctx.lineJoin = 'round';
    ctx.strokeText(this.content.title, W / 2, y);
    const tg = ctx.createLinearGradient(0, y - titleSize / 2, 0, y + titleSize / 2);
    tg.addColorStop(0, '#fff6d8'); tg.addColorStop(0.5, '#ffd76a'); tg.addColorStop(1, '#ff9f43');
    ctx.fillStyle = tg; ctx.fillText(this.content.title, W / 2, y);
    ctx.restore();
    R.text(ctx, this.content.tagline || this.content.subtitle || '', W / 2, y + titleSize * 0.86, {
      size: Math.min(P ? 20 : 23, W * 0.02), color: 'rgba(255,255,255,.85)', align: 'center', weight: 600,
    });
    // 开始按钮
    const bw = Math.min(W * (P ? 0.62 : 0.34), 460), bh = Math.min(86, H * 0.12);
    const bx = W / 2 - bw / 2, by = P ? H * 0.50 : H * 0.66;
    const nextId = Math.min(this.save.data.unlocked || 1, (this.content.levels || []).length || 1);
    const label = (this.save.data.totalClears || 0) > 0 ? `继续游戏 · 第${nextId}关` : '开始游戏';
    this.mkButton(ctx, { x: bx, y: by, w: bw, h: bh }, label, () => this.startLevel(nextId), { size: Math.min(30, bh * 0.38) });
    // 次级按钮
    const sw = Math.min(W * (P ? 0.26 : 0.17), 220), sh = Math.min(58, H * 0.085), gap = 16;
    const y2 = by + bh + (P ? 28 : 18);
    const labels = [['关卡', () => this.go('levels')], ['玩法', () => this.go('howto')], ['设置', () => this.go('settings')]];
    const totalW = labels.length * sw + (labels.length - 1) * gap;
    labels.forEach(([lb, fn], i) => {
      const x = W / 2 - totalW / 2 + i * (sw + gap);
      this.mkButton(ctx, { x, y: y2, w: sw, h: sh }, lb, fn, {
        fill1: 'rgba(255,255,255,.20)', fill2: 'rgba(255,255,255,.10)', color: '#fff', stroke: 'rgba(255,255,255,.35)', size: Math.min(22, sh * 0.4),
      });
    });
    R.text(ctx, '程序化美术 / 合成音频 / 本地存档', W / 2, H - (P ? 40 : 20), { size: 14, color: 'rgba(255,255,255,.45)', align: 'center', weight: 500 });
  }
  /* 选关 */
  drawLevels(ctx) {
    const W = this.W, H = this.H;
    R.gradient(ctx, W, H, ['#12162a', '#1d1730', '#0c0e18']);
    const titleY = this.portrait ? 76 : 64;
    R.text(ctx, '选择关卡', W / 2, titleY, { size: 38, align: 'center', color: '#fff', stroke: 'rgba(0,0,0,.5)' });
    this.mkButton(ctx, { x: 22, y: 20, w: 62, h: 62 }, '←', () => this.go('title'), {
      fill1: 'rgba(255,255,255,.16)', fill2: 'rgba(255,255,255,.08)', color: '#fff', stroke: 'rgba(255,255,255,.25)', size: 26,
    });
    const stars = this.save.totalStars(), maxStars = (this.content.levels || []).length * 3;
    R.text(ctx, `★ ${stars} / ${maxStars}`, W - 26, titleY, { size: 20, align: 'right', color: '#ffd76a' });
    const levels = this.content.levels || [];
    const chapters = this.content.chapters || [{ name: '关卡', levels: levels.map((l) => l.id) }];
    const top = this.portrait ? 120 : 104;
    const bottomPad = 24;
    const rowH = Math.min(this.portrait ? 200 : 108, (H - top - bottomPad) / chapters.length);
    chapters.forEach((ch, ci) => {
      const y0 = top + ci * rowH;
      R.text(ctx, `${ci + 1}. ${ch.name}`, 30, y0 + 14, { size: Math.min(20, rowH * 0.22), color: 'rgba(255,255,255,.7)', weight: 700 });
      const perRow = this.portrait ? 5 : Math.min(10, ch.levels.length);
      const cellW = Math.min(this.portrait ? 118 : 104, (W - 60) / perRow);
      const cellH = Math.min(cellW, rowH - 34);
      ch.levels.forEach((id, i) => {
        const col = i % perRow, row = Math.floor(i / perRow);
        const x = 30 + col * ((W - 60) / perRow) + ((W - 60) / perRow - cellW) / 2;
        const y = y0 + 28 + row * (cellH + 10);
        this.levelCell(ctx, levels.find((l) => l.id === id) || { id, name: '第' + id + '关' }, x, y, cellW, cellH);
      });
      if (this.portrait && ci === 0) { /* 保持布局 */ }
    });
  }
  levelCell(ctx, lv, x, y, w, h) {
    const unlocked = this.save.isUnlocked(lv.id);
    const st = this.save.starOf(lv.id);
    const r = { x, y, w, h };
    const isBoss = !!lv.boss;
    R.panel(ctx, x, y, w, h, {
      r: 14, fill: unlocked ? (isBoss ? 'rgba(120,40,60,.85)' : 'rgba(32,40,64,.9)') : 'rgba(24,26,36,.75)',
      stroke: st > 0 ? 'rgba(255,215,106,.65)' : 'rgba(255,255,255,.12)', shadowBlur: 10,
    });
    if (!unlocked) {
      R.icon(ctx, 'lock', x + w / 2, y + h * 0.42, Math.min(w, h) * 0.28, 'rgba(255,255,255,.3)');
      R.text(ctx, '未解锁', x + w / 2, y + h * 0.78, { size: Math.min(13, w * 0.16), color: 'rgba(255,255,255,.35)', align: 'center' });
    } else {
      R.text(ctx, String(lv.id), x + w / 2, y + h * 0.38, { size: Math.min(26, w * 0.3), color: '#fff', align: 'center', weight: 900 });
      R.text(ctx, lv.name || '', x + w / 2, y + h * 0.64, { size: Math.min(11, w * 0.137), color: 'rgba(255,255,255,.62)', align: 'center', weight: 600 });
      for (let i = 0; i < 3; i++) R.star(ctx, x + w / 2 + (i - 1) * Math.min(17, w * 0.2), y + h * 0.84, Math.min(7, w * 0.09), i < st);
    }
    this.buttons.push({ r, fn: () => { if (unlocked) this.startLevel(lv.id); } });
  }
  /* 战斗场景 */
  drawPlay(ctx) {
    const W = this.W, H = this.H, rule = this.rule;
    if (!rule) return;
    rule.drawWorld(ctx, this.demoT);
    this.fx.draw(ctx);
    // 关卡横幅
    const intro = clamp(1 - this.sceneT / 1.6, 0, 1);
    if (intro > 0) {
      const lv = this.content.levels.find((l) => l.id === this.levelId) || {};
      ctx.globalAlpha = Math.min(1, intro * 1.6);
      R.text(ctx, `第 ${this.levelId} 关`, W / 2, H * 0.16, { size: 22, align: 'center', color: 'rgba(255,255,255,.8)', weight: 700 });
      R.text(ctx, lv.name || '', W / 2, H * 0.16 + 34, { size: 34, align: 'center', color: '#fff', stroke: 'rgba(0,0,0,.6)' });
      ctx.globalAlpha = 1;
    }
    rule.drawHUD(ctx, this.demoT);
    // 暂停按钮：始终最后画，保证在各玩法 HUD 之上可点
    const pr = { x: W - 74, y: 16, w: 56, h: 56 };
    R.panel(ctx, pr.x, pr.y, pr.w, pr.h, { r: 14, fill: 'rgba(10,14,24,.62)', stroke: 'rgba(255,255,255,.2)' });
    R.icon(ctx, 'pause', pr.x + pr.w / 2, pr.y + pr.h / 2, 22, '#fff');
    this.buttons.push({ r: pr, fn: () => this.setPaused(true) });
  }
  /* 暂停 */
  drawPause(ctx) {
    const W = this.W, H = this.H;
    ctx.fillStyle = 'rgba(6,8,16,.66)'; ctx.fillRect(0, 0, W, H);
    const pw = Math.min(W * 0.46, 520), ph = Math.min(H * 0.62, 520);
    const px = W / 2 - pw / 2, py = H / 2 - ph / 2;
    R.panel(ctx, px, py, pw, ph, { fill: 'rgba(20,24,44,.97)', stroke: 'rgba(255,255,255,.2)', r: 24 });
    R.text(ctx, '已暂停', W / 2, py + 58, { size: 34, align: 'center', color: '#fff' });
    const bw = pw * 0.66, bh = 60, bx = W / 2 - bw / 2;
    let by = py + 116;
    this.mkButton(ctx, { x: bx, y: by, w: bw, h: bh }, '继续', () => this.setPaused(false), { size: 26 });
    by += bh + 14;
    this.mkButton(ctx, { x: bx, y: by, w: bw, h: bh }, '重开本关', () => this.startLevel(this.levelId), {
      fill1: 'rgba(255,255,255,.2)', fill2: 'rgba(255,255,255,.1)', color: '#fff', stroke: 'rgba(255,255,255,.3)', size: 24,
    });
    by += bh + 14;
    this.mkButton(ctx, { x: bx, y: by, w: bw, h: bh }, '返回选关', () => { this.setPaused(false); this.go('levels'); }, {
      fill1: 'rgba(255,255,255,.2)', fill2: 'rgba(255,255,255,.1)', color: '#fff', stroke: 'rgba(255,255,255,.3)', size: 24,
    });
    by += bh + 26;
    // 音乐/音效开关
    const tw = (pw - 60) / 2;
    this.toggle(ctx, px + 20, by, tw, 50, '音乐', this.save.settings.music, (v) => { this.save.setSetting('music', v); this.audio.setMuted('music', !v); });
    this.toggle(ctx, px + 40 + tw, by, tw, 50, '音效', this.save.settings.sfx, (v) => { this.save.setSetting('sfx', v); this.audio.setMuted('sfx', !v); });
  }
  toggle(ctx, x, y, w, h, label, on, fn) {
    R.panel(ctx, x, y, w, h, { r: 12, fill: on ? 'rgba(255,215,106,.16)' : 'rgba(255,255,255,.06)', stroke: on ? 'rgba(255,215,106,.6)' : 'rgba(255,255,255,.16)', shadow: false });
    R.text(ctx, label, x + 14, y + h / 2, { size: 18, color: '#fff', weight: 700 });
    const kr = { x: x + w - 62, y: y + 9, w: 46, h: h - 18 };
    R.roundRect(ctx, kr.x, kr.y, kr.w, kr.h, kr.h / 2); ctx.fillStyle = on ? '#ffd76a' : 'rgba(255,255,255,.2)'; ctx.fill();
    ctx.beginPath(); ctx.arc(kr.x + (on ? kr.w - kr.h / 2 : kr.h / 2), kr.y + kr.h / 2, kr.h / 2 - 3, 0, Math.PI * 2);
    ctx.fillStyle = on ? '#241a06' : '#888'; ctx.fill();
    this.buttons.push({ r: { x, y, w, h }, fn: () => fn(!on) });
  }
  /* 结算 */
  drawResult(ctx) {
    const W = this.W, H = this.H, res = this.result || { win: false, stars: 0, payload: {} };
    const t = this.sceneT;
    this.drawBg(ctx, H * 0.78);
    ctx.fillStyle = 'rgba(6,8,16,.62)'; ctx.fillRect(0, 0, W, H);
    const pw = Math.min(W * 0.56, 620), ph = Math.min(H * 0.78, 640);
    const px = W / 2 - pw / 2, py = H / 2 - ph / 2 + 10;
    const pop = R.entering(t, 0.4);
    ctx.save(); ctx.translate(W / 2, py + ph / 2); ctx.scale(0.9 + pop * 0.1, 0.9 + pop * 0.1); ctx.translate(-W / 2, -(py + ph / 2));
    R.panel(ctx, px, py, pw, ph, { fill: 'rgba(22,26,46,.97)', stroke: res.win ? 'rgba(255,215,106,.5)' : 'rgba(255,93,93,.4)', r: 26, shadowBlur: 32 });
    R.text(ctx, res.win ? '通关！' : '再战一次', W / 2, py + 62, { size: 42, align: 'center', color: res.win ? '#ffd76a' : '#ff8a8a', stroke: 'rgba(0,0,0,.5)' });
    R.text(ctx, `第 ${this.levelId} 关`, W / 2, py + 100, { size: 18, align: 'center', color: 'rgba(255,255,255,.55)' });
    for (let i = 0; i < 3; i++) {
      const st = res.win && i < res.stars;
      const delay = 0.35 + i * 0.16;
      const k = clamp((t - delay) / 0.3, 0, 1);
      if (k <= 0) continue;
      ctx.save(); ctx.translate(W / 2 + (i - 1) * 74, py + 170); ctx.scale(0.4 + k * 0.9, 0.4 + k * 0.9); ctx.globalAlpha = k;
      R.star(ctx, 0, 0, 30, st, { c1: '#fff3b0', c2: '#ffb52e' });
      ctx.restore();
    }
    const p = res.payload || {};
    const rows = [
      ['得分', fmt(p.score || 0)],
      [this.content.resultKillLabel || '击杀', fmt(p.kills || 0)],
      ['用时', fmtTime(p.time || this.sceneT)],
    ];
    rows.forEach(([k1, v], i) => {
      const y = py + 234 + i * 30;
      R.text(ctx, k1, px + pw * 0.22, y, { size: 18, color: 'rgba(255,255,255,.55)', weight: 600 });
      R.text(ctx, v, px + pw * 0.78, y, { size: 20, color: '#fff', align: 'right', weight: 800 });
    });
    const bw = pw * 0.68, bh = 62, bx = W / 2 - bw / 2;
    let by = py + ph - 200;
    if (res.win) {
      this.mkButton(ctx, { x: bx, y: by, w: bw, h: bh }, '下一关', () => this.nextLevel(), { size: 26 });
      by += bh + 12;
      this.mkButton(ctx, { x: bx, y: by, w: bw, h: 52 }, '重玩', () => this.startLevel(this.levelId), {
        fill1: 'rgba(255,255,255,.18)', fill2: 'rgba(255,255,255,.08)', color: '#fff', stroke: 'rgba(255,255,255,.25)', size: 22,
      });
      by += 52 + 12;
    } else {
      this.mkButton(ctx, { x: bx, y: by, w: bw, h: bh + 8 }, '再来一次', () => this.startLevel(this.levelId), { size: 26 });
      by += bh + 20;
    }
    this.mkButton(ctx, { x: bx, y: by, w: bw, h: 48 }, '返回选关', () => this.go('levels'), {
      fill1: 'rgba(255,255,255,.06)', fill2: 'rgba(255,255,255,.03)', color: 'rgba(255,255,255,.8)', stroke: 'rgba(255,255,255,.16)', size: 20,
    });
    ctx.restore();
  }
  /* 设置 */
  drawSettings(ctx) {
    const W = this.W, H = this.H;
    R.gradient(ctx, W, H, ['#12162a', '#1d1730', '#0c0e18']);
    R.text(ctx, '设置', W / 2, 66, { size: 38, align: 'center', color: '#fff' });
    this.mkButton(ctx, { x: 22, y: 20, w: 62, h: 62 }, '←', () => this.go('title'), {
      fill1: 'rgba(255,255,255,.16)', fill2: 'rgba(255,255,255,.08)', color: '#fff', stroke: 'rgba(255,255,255,.25)', size: 26,
    });
    const w = Math.min(W * 0.62, 620), x = W / 2 - w / 2;
    let y = 140;
    this.toggle(ctx, x, y, w, 62, '音乐', this.save.settings.music, (v) => { this.save.setSetting('music', v); this.audio.setMuted('music', !v); }); y += 74;
    this.toggle(ctx, x, y, w, 62, '音效', this.save.settings.sfx, (v) => { this.save.setSetting('sfx', v); this.audio.setMuted('sfx', !v); }); y += 74;
    this.toggle(ctx, x, y, w, 62, '震动反馈', this.save.settings.haptic, (v) => this.save.setSetting('haptic', v)); y += 90;
    this.mkButton(ctx, { x, y, w, h: 56 }, '清除存档', () => { if (typeof confirm === 'function' && confirm('确定清空本机进度？')) { this.save.reset(); this.toast('已清除'); } }, {
      fill1: 'rgba(255,93,93,.35)', fill2: 'rgba(200,40,60,.35)', color: '#fff', stroke: 'rgba(255,120,120,.5)', size: 22,
    });
    y += 76;
    R.text(ctx, '存档只保存在本机浏览器；换设备不会同步。', W / 2, y, { size: 15, align: 'center', color: 'rgba(255,255,255,.45)', weight: 500 });
    R.text(ctx, '程序化美术 + 程序化音乐音效', W / 2, y + 26, { size: 15, align: 'center', color: 'rgba(255,255,255,.35)', weight: 500 });
  }
  /* 说明 */
  drawHowto(ctx) {
    const W = this.W, H = this.H;
    R.gradient(ctx, W, H, ['#12162a', '#1d1730', '#0c0e18']);
    R.text(ctx, '玩法说明', W / 2, 66, { size: 38, align: 'center', color: '#fff' });
    this.mkButton(ctx, { x: 22, y: 20, w: 62, h: 62 }, '←', () => this.go('title'), {
      fill1: 'rgba(255,255,255,.16)', fill2: 'rgba(255,255,255,.08)', color: '#fff', stroke: 'rgba(255,255,255,.25)', size: 26,
    });
    const help = this.content.help || {};
    const w = Math.min(W * 0.74, 820), x = W / 2 - w / 2;
    R.panel(ctx, x, 116, w, H - 168, { r: 20, fill: 'rgba(255,255,255,.055)', stroke: 'rgba(255,255,255,.12)', shadow: false });
    let y = 152;
    R.text(ctx, '目标', x + 28, y, { size: 20, color: '#ffd76a' }); y += 30;
    for (const line of wrapLines(ctx, help.goal || '', w - 56, 18)) { R.text(ctx, line, x + 28, y, { size: 18, color: '#fff', weight: 600 }); y += 28; }
    y += 14;
    R.text(ctx, '操作', x + 28, y, { size: 20, color: '#ffd76a' }); y += 30;
    for (const line of help.controls || []) { R.text(ctx, '· ' + line, x + 28, y, { size: 17, color: 'rgba(255,255,255,.85)', weight: 600 }); y += 28; }
    y += 14;
    R.text(ctx, '小提示', x + 28, y, { size: 20, color: '#ffd76a' }); y += 30;
    for (const line of help.tips || []) {
      for (const l2 of wrapLines(ctx, '· ' + line, w - 56, 17)) { R.text(ctx, l2, x + 28, y, { size: 17, color: 'rgba(255,255,255,.7)', weight: 500 }); y += 26; }
    }
  }
  drawToasts(ctx) {
    const W = this.W;
    this.toasts.forEach((tt, i) => {
      const k = tt.life / tt.max;
      const a = k < 0.15 ? k / 0.15 : k > 0.75 ? (1 - k) / 0.25 : 1;
      ctx.globalAlpha = Math.max(0, Math.min(1, a));
      const w = Math.min(W * 0.6, R.measure(ctx, tt.msg, 20, 700) + 56);
      const y = this.H * 0.2 + i * 52;
      R.panel(ctx, W / 2 - w / 2, y, w, 44, { r: 22, fill: 'rgba(10,14,24,.86)', stroke: 'rgba(255,215,106,.35)', shadowBlur: 8 });
      R.text(ctx, tt.msg, W / 2, y + 22, { size: 19, align: 'center', color: '#ffe9b0', weight: 700 });
      ctx.globalAlpha = 1;
    });
  }
}

function wrapLines(ctx, str, maxW, size) {
  const out = [];
  let line = '';
  for (const ch of String(str)) {
    const test = line + ch;
    if (R.measure(ctx, test, size, 600) > maxW && line) { out.push(line); line = ch; }
    else line = test;
  }
  if (line) out.push(line);
  return out;
}
