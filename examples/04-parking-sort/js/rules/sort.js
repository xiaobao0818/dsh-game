/* rules/sort.js —— 分拣环道（sort）
 * 候车队列（窗口 3~5）→ 环道（FIFO 容量 5）→ 同色车位（容量 4，满 4 清空）。
 * 车位有闸门（累计清空 N 排才开放）；环道前端送不出去 = 堵塞，塞满且堵塞 = 失败。
 * 星级别看用时，每关 3 次「退回」救堵塞。纯逻辑，update()/bot() 不碰 DOM、不用 Math.random。
 * 环道 FIFO ⇒ 交付顺序 = 点击顺序，所以「一次点击 = 一拍」的求解器与实时节拍等价。 */
import { clamp, lerp, easeOutCubic, TAU, fmtTime } from '../core.js';
import { roundRect, panel, text, icon, bar } from '../render.js';

const FALLBACK_COLORS = [
  { id: 'c0', name: '货物', color: '#ffcf5c', color2: '#8a5a12', shape: 'circle' },
  { id: 'c1', name: '包裹', color: '#8fd3ff', color2: '#2c5f80', shape: 'square' },
  { id: 'c2', name: '行李', color: '#ff7a59', color2: '#8a2c14', shape: 'triangle' },
  { id: 'c3', name: '木箱', color: '#62d68f', color2: '#1f6b3c', shape: 'diamond' },
  { id: 'c4', name: '铁盒', color: '#ff5d5d', color2: '#87201f', shape: 'hex' },
  { id: 'c5', name: '布袋', color: '#c79bff', color2: '#5a3186', shape: 'star' },
];

export function createRule(svc) {
  const { content, level, W, H, audio, fx } = svc;
  const art = svc.art;
  const D = content.defs || {};
  const COLORS = (D.colors && D.colors.length ? D.colors : FALLBACK_COLORS);
  const BELT_CAP = D.beltCap || 5;
  const LANE_CAP = D.laneCap || 4;
  const BEAT = D.beat || 0.45;
  const PULL_MAX = D.pullCharges == null ? 3 : D.pullCharges;
  const SCORE_CLEAR = D.scorePerClear || 120;
  const COMBO_BONUS = D.comboBonus || 60;
  const WIN = Math.max(3, Math.min(5, level.window || 4));
  const N_LANES = Math.max(1, Math.min(6, level.colors || (level.lanes || []).length || 3));
  const colorOf = (i) => COLORS[((i | 0) % COLORS.length + COLORS.length) % COLORS.length];
  /* ------------------------------------------------------------- 状态 */
  const st = {
    queue: [],
    belt: [],            // { c, k } k = 入场动画 [0..1]
    lanes: [],           // { color, preset, lock, items, flash, born }
    clears: 0,
    clearedItems: 0,
    totalItems: 0,
    time: 0,
    score: 0,
    moves: 0,
    pull: PULL_MAX,
    combo: 0,
    comboT: 0,
    beatT: BEAT,
    stallT: 0,
    jam: false,
    flyers: [],
    banner: null,
    bannerT: 0,
    endT: 0,
    solveFails: 0,
    stars: [],
    skyline: [],
    startQueue: 0,
  };
  /* ------------------------------------------------------------- 几何 */
  const G = {
    qRail: null, qSlots: [], beltRail: null, beltSlots: [], lanes: [], pull: null, progress: null,
  };
  function buildLayout() {
    // ---- 候车队列
    const qSize = Math.min(110, Math.floor((W - 72 - (WIN - 1) * 12) / WIN));
    const qW = WIN * qSize + (WIN - 1) * 12;
    const qx = Math.round(W / 2 - qW / 2);
    const qy = 138;
    G.qRail = { x: qx - 18, y: qy - 18, w: qW + 36, h: qSize + 44 };
    G.qLabel = { x: Math.max(24, qx - 18), y: qy - 32 };
    G.qSlots = [];
    for (let i = 0; i < WIN; i++) {
      G.qSlots.push({ x: qx + i * (qSize + 12), y: qy, w: qSize, h: qSize, cx: qx + i * (qSize + 12) + qSize / 2, cy: qy + qSize / 2 });
    }
    G.qSize = qSize;
    // ---- 环道
    const bSize = Math.min(104, Math.floor((W - 96 - (BELT_CAP - 1) * 10) / BELT_CAP));
    const bW = BELT_CAP * bSize + (BELT_CAP - 1) * 10;
    const bx = Math.round(W / 2 - bW / 2);
    const by = 344;
    G.beltRail = { x: bx - 22, y: by - 22, w: bW + 44, h: bSize + 48 };
    G.beltLabel = { x: Math.max(24, bx - 22), y: by - 36 };
    G.beltSlots = [];
    for (let i = 0; i < BELT_CAP; i++) {
      G.beltSlots.push({ x: bx + i * (bSize + 10), y: by, w: bSize, h: bSize, cx: bx + i * (bSize + 10) + bSize / 2, cy: by + bSize / 2 });
    }
    G.bSize = bSize; G.beltCx = bx + bW / 2;
    // ---- 车位（在环道与底栏之间等距铺满）
    const laneTopBase = G.beltRail.y + G.beltRail.h + 22;
    const laneRegion = 1184 - laneTopBase;
    const laneHGap = 22;
    const laneH = clamp(Math.floor((laneRegion - (N_LANES - 1) * laneHGap) / N_LANES), 84, 190);
    const gap = laneHGap;
    const stackH = N_LANES * laneH + (N_LANES - 1) * gap;
    const laneTop = laneTopBase + Math.max(0, Math.floor((laneRegion - stackH) / 2));
    G.lanes = [];
    const slot = clamp(Math.floor(laneH * 0.5), 44, 82);
    const chipD = Math.min(slot, 64);
    for (let i = 0; i < N_LANES; i++) {
      const y = Math.round(laneTop + i * (laneH + gap));
      const rect = { x: 20, y, w: W - 40, h: laneH };
      const cy = y + laneH / 2;
      const chip = { x: 42, cx: 42 + chipD / 2, cy, d: chipD };
      const nameX = 42 + chipD + 14;
      const sx = nameX + 120;
      const slots = [];
      for (let k = 0; k < LANE_CAP; k++) {
        slots.push({ x: sx + k * (slot + 8), y: cy - slot / 2, w: slot, h: slot, cx: sx + k * (slot + 8) + slot / 2, cy });
      }
      G.lanes.push({ rect, chip, nameX, slots, cy, slot, color: st.lanes[i] ? st.lanes[i].color : i });
    }
    G.laneBottom = G.lanes.length ? G.lanes[N_LANES - 1].rect.y + laneH : 1184;
    G.infoX = G.lanes.length ? G.lanes[0].slots[LANE_CAP - 1].x + G.lanes[0].slot + 20 : W - 150;
    // ---- 底部：退回 / 进度
    G.pull = { x: 22, y: 1204, w: 196, h: 60 };
    G.progress = { x: 236, y: 1216, w: 250, h: 14 };
    G.progressLabel = { x: 500, y: 1224 };
    G.hintY = 1252;
  }
  /* ------------------------------------------------------------- 求解器 */
  /* 与 build/genre.mjs 同一套模型；给机器人算出「无堵塞点击顺序」 */
  function laneOfColor(lanes, color) {
    for (const l of lanes) if (l.color === color) return l;
    return null;
  }
  function solveFrom(snap, budgetNodes = 60000) {
    const caps = { beltCap: BELT_CAP, window: WIN };
    const mk = (s) => ({
      queue: s.queue.slice(), belt: s.belt.slice(),
      lanes: s.lanes.map((l) => ({ color: l.color, lock: l.lock, items: l.items })),
      clears: s.clears, beltCap: caps.beltCap, window: caps.window,
    });
    const seen = new Set();
    const plan = [];
    let nodes = 0;
    const key = (s) => s.queue.join(',') + '|' + s.belt.join(',') + '|' + s.lanes.map((l) => l.items).join(',') + '|' + s.clears;
    const canTake = (s, c) => { const ln = laneOfColor(s.lanes, c); return !!ln && s.clears >= ln.lock && ln.items < LANE_CAP; };
    const win = (s) => s.queue.length === 0 && s.belt.length === 0 && s.lanes.every((l) => l.items === 0);
    const dead = (s) => s.belt.length > 0 && !canTake(s, s.belt[0]);
    const click = (s, idx) => {
      if (s.belt.length >= s.beltCap) return false;
      if (idx < 0 || idx >= Math.min(s.window, s.queue.length)) return false;
      const c = s.queue[idx];
      s.queue.splice(idx, 1); s.belt.push(c);
      if (s.belt.length) {
        const f = s.belt[0];
        if (canTake(s, f)) {
          s.belt.shift();
          const ln = laneOfColor(s.lanes, f);
          ln.items++;
          if (ln.items >= LANE_CAP) { ln.items = 0; s.clears++; }
        }
      }
      return true;
    };
    function dfs(s) {
      if (++nodes > budgetNodes) return false;
      if (win(s)) return true;
      const k = key(s);
      if (seen.has(k)) return false;
      seen.add(k);
      const vis = Math.min(s.window, s.queue.length);
      const seenC = new Set();
      const moves = [];
      for (let i = 0; i < vis; i++) {
        const c = s.queue[i];
        if (seenC.has(c)) continue;
        seenC.add(c);
        const ln = laneOfColor(s.lanes, c);
        const open = s.clears >= ln.lock;
        let sc = open ? 1000 : 0;
        sc -= (LANE_CAP - ln.items) * 3; sc -= i;
        if (!open) sc -= (ln.lock - s.clears) * 25;
        moves.push({ i, sc });
      }
      moves.sort((a, b) => b.sc - a.sc);
      for (const m of moves) {
        const sub = mk(s);
        if (!click(sub, m.i)) continue;
        if (win(sub)) { plan.push(m.i); return true; }
        if (dead(sub)) continue;
        plan.push(m.i);
        if (dfs(sub)) return true;
        plan.pop();
      }
      return false;
    }
    return dfs(mk(snap)) ? plan.slice() : null;
  }
  /* ------------------------------------------------------------- 动作 */
  function pushBanner(str, color, t) { st.banner = { str, color }; st.bannerT = t || 1.2; }
  function spawnFlyer(from, to, color, size, dur, kind) {
    st.flyers.push({ x0: from.x, y0: from.y, x1: to.x, y1: to.y, c: color, s0: size, s1: kind === 'lane' ? Math.max(24, size * 0.52) : size, t: 0, dur: dur || 0.18, kind });
  }
  function clickQueue(idx) {
    if (rule.status !== 'playing') return false;
    if (st.belt.length >= BELT_CAP) { svc.toast && svc.toast('环道已满，先等物件入位'); audio.sfx('warn'); return false; }
    const vis = Math.min(WIN, st.queue.length);
    if (idx < 0 || idx >= vis) return false;
    const slot = G.qSlots[idx];
    const c = st.queue.splice(idx, 1)[0];
    st.moves++;
    const back = G.beltSlots[Math.min(BELT_CAP - 1, st.belt.length)];
    st.belt.push({ c, k: 0 });
    spawnFlyer({ x: slot.cx, y: slot.cy }, { x: back.cx, y: back.cy }, c, G.qSize, 0.16, 'belt');
    audio.sfx('pickup');
    if (st.belt.length === 1) st.beatT = Math.min(st.beatT, 0.16);
    return true;
  }
  function pullBack() {
    if (rule.status !== 'playing') return false;
    if (!st.belt.length) { svc.toast && svc.toast('环道是空的'); return false; }
    if (st.pull <= 0) { svc.toast && svc.toast('退回次数用完了'); audio.sfx('warn'); return false; }
    st.pull--;
    const item = st.belt.shift();
    st.queue.unshift(item.c); st.moves++;
    plan = null; planIdx = 0;
    st.beatT = BEAT; st.stallT = 0; st.jam = false;
    const front = G.beltSlots[0];
    spawnFlyer({ x: front.cx, y: front.cy }, { x: G.qSlots[0].cx, y: G.qSlots[0].cy }, item.c, G.bSize, 0.2, 'back');
    audio.sfx('click');
    fx.ring(front.cx, front.cy, 'rgba(255,255,255,.8)', 12, { grow: 220, max: 0.35 });
    return true;
  }
  function deliverBeat() {
    const item = st.belt[0];
    if (!item) return false;
    const ln = st.lanes.find((l) => l.color === item.c);
    if (!ln || st.clears < ln.lock) return false;
    if (ln.items >= LANE_CAP) {
      /* 车位已满又来同色：最里侧物件被挤回环道（容量=4 且立刻清空，正常不会走到） */
      const popped = ln.items > 0 ? ln.color : item.c;
      ln.items = 0;
      st.belt.push({ c: popped, k: 0 });
      return false;
    }
    st.belt.shift(); ln.items++;
    ln.flash = 0.28;
    const laneIdx = st.lanes.indexOf(ln);
    const gl = G.lanes[laneIdx];
    const slot = gl.slots[Math.min(LANE_CAP - 1, ln.items - 1)];
    spawnFlyer({ x: G.beltSlots[0].cx, y: G.beltSlots[0].cy }, { x: slot.cx, y: slot.cy }, item.c, G.bSize, 0.17, 'lane');
    audio.sfx(ln.items >= LANE_CAP ? 'merge' : 'pickup');
    if (ln.items >= LANE_CAP) clearLane(ln, laneIdx);
    return true;
  }
  function clearLane(ln, laneIdx) {
    ln.items = 0; st.clears++;
    st.clearedItems += LANE_CAP; st.combo++;
    st.comboT = 1.5;
    const gain = SCORE_CLEAR + (st.combo - 1) * COMBO_BONUS;
    st.score += gain;
    const gl = G.lanes[laneIdx];
    const cx = gl.rect.x + gl.rect.w - 70;
    const cy = gl.cy;
    const col = colorOf(ln.color).color;
    fx.burst(cx, cy, 22, { color: col, up: 90, speed: 240, life: 0.55 });
    fx.ring(cx, cy, col, 14, { grow: 320, max: 0.45 });
    fx.text(cx - 8, cy - 34, '+' + gain, '#ffe9b0', 26);
    if (st.combo > 1) fx.text(cx - 8, cy - 66, '连锁 x' + st.combo, col, 20);
    fx.shake(2.5 + Math.min(4, st.combo)); audio.sfx('coin');
    // 闸门开放提示
    for (let i = 0; i < st.lanes.length; i++) {
      const l = st.lanes[i];
      if (l.lock > 0 && l.born !== 1 && st.clears >= l.lock) {
        l.born = 1;
        const g2 = G.lanes[i];
        fx.text(g2.rect.x + g2.rect.w - 92, g2.cy + 2, '闸门开！', '#8fffc0', 20);
        fx.ring(g2.chip.cx, g2.cy, '#8fffc0', 16, { grow: 260, max: 0.5 });
        audio.sfx('build');
      }
    }
  }
  /* ------------------------------------------------------------- 更新 */
  function update(dt) {
    // 动画永远推进（结算后也动）
    for (let i = st.flyers.length - 1; i >= 0; i--) { st.flyers[i].t += dt; if (st.flyers[i].t >= st.flyers[i].dur) st.flyers.splice(i, 1); }
    for (const l of st.lanes) {
      if (l.flash > 0) l.flash = Math.max(0, l.flash - dt);
      if (l.pop > 0) l.pop = Math.max(0, l.pop - dt * 2.2);
    }
    if (st.bannerT > 0) st.bannerT -= dt;
    if (rule.status !== 'playing') { st.endT += dt; return; }
    st.time += dt; st.comboT -= dt;
    if (st.comboT <= 0 && st.combo > 0) st.combo = 0;
    for (const item of st.belt) if (item.k < 1) item.k = Math.min(1, item.k + dt * 7);
    // 环道前端的可否送达
    const front = st.belt.length ? st.belt[0] : null;
    const lnFront = front ? st.lanes.find((l) => l.color === front.c) : null;
    const blocked = !!front && (!lnFront || st.clears < lnFront.lock || lnFront.items >= LANE_CAP);
    const canGo = !!front && !blocked;
    if (front) {
      if (canGo) {
        st.stallT = Math.max(0, st.stallT - dt * 3); st.beatT -= dt;
        if (st.beatT <= 0) {
          if (deliverBeat()) st.beatT = BEAT;
          else st.beatT = 0.18;
        }
      } else {
        st.beatT = 0; st.stallT += dt;
      }
    } else {
      st.beatT = BEAT; st.stallT = Math.max(0, st.stallT - dt * 3);
    }
    st.jam = !!(front && blocked);
    // 失败：环道塞满 + 送不出去（等 0.65s 让玩家看懂）；或已无牌可点、无退回可用
    if (st.jam && st.belt.length >= BELT_CAP && st.stallT > 0.65) return lose('环道塞死了');
    if (st.jam && st.stallT > 1.1 && !st.queue.length && st.pull <= 0) return lose('环道卡死，无牌可退');
    // 兜底死角：队列与环道都空，但车位还有货
    if (!st.queue.length && !st.belt.length && st.lanes.some((l) => l.items > 0)) {
      st.deadT = (st.deadT || 0) + dt;
      if (st.deadT > 1.2) return lose('没有可送的物件了');
    } else st.deadT = 0;
    // 胜利
    if (!st.queue.length && !st.belt.length && st.lanes.every((l) => l.items === 0)) {
      st.winT = (st.winT || 0) + dt;
      if (st.winT > 0.45) return win();
    }
  }
  function starsFor() {
    const par = level.par || (st.totalItems * 1.15 + 8);
    if (st.time <= par) return 3;
    if (st.time <= par * 1.45) return 2;
    return 1;
  }
  function win() {
    if (rule.status !== 'playing') return;
    rule.status = 'won'; st.endT = 0;
    pushBanner('全部分拣完毕！', '#ffd76a', 3); fx.flash(0.35);
    fx.shake(6);
    const stars = starsFor();
    svc.finish({
      stars,
      score: Math.round(st.score + st.pull * 40 + Math.max(0, 60 - Math.round(st.time)) * 2),
      coins: 22 + level.id * 4,
      kills: st.clears,
      time: st.time,
    });
  }
  function lose(reason) {
    if (rule.status !== 'playing') return;
    rule.status = 'lost'; st.endT = 0;
    pushBanner(reason || '环道塞死了', '#ff8a8a', 3); fx.shake(9);
    fx.flash(0.22); audio.sfx('lose');
    svc.finish({ stars: 0, score: st.score, coins: 0, kills: st.clears, time: st.time });
  }
  /* ------------------------------------------------------------- 绘制 */
  const SHAPE_DRAW = {
    circle: (ctx, r) => { ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); },
    square: (ctx, r) => { roundRect(ctx, -r * 0.86, -r * 0.86, r * 1.72, r * 1.72, r * 0.3); ctx.fill(); },
    triangle: (ctx, r) => { ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.92, r * 0.72); ctx.lineTo(-r * 0.92, r * 0.72); ctx.closePath(); ctx.fill(); },
    diamond: (ctx, r) => { ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.86, 0); ctx.lineTo(0, r); ctx.lineTo(-r * 0.86, 0); ctx.closePath(); ctx.fill(); },
    hex: (ctx, r) => { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i * TAU / 6; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.fill(); },
    star: (ctx, r) => { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const rr = i % 2 ? r * 0.46 : r; const x = Math.cos(a) * rr, y = Math.sin(a) * rr; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.fill(); },
  };
  function drawItem(ctx, cx, cy, size, colorIdx, o = {}) {
    const def = colorOf(colorIdx);
    const s = size * (o.scale == null ? 1 : o.scale);
    if (s <= 1.5) return;
    const r = Math.max(3, s * 0.24);
    ctx.save(); ctx.translate(cx, cy);
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    // 底座（代替 canvas 阴影，软件渲染更快）
    roundRect(ctx, -s / 2, -s / 2 + s * 0.05, s, s, r); ctx.fillStyle = 'rgba(0,0,0,.34)';
    ctx.fill();
    // 主体
    roundRect(ctx, -s / 2, -s / 2, s, s, r);
    ctx.fillStyle = def.color; ctx.fill();
    // 顶部高光（内缩圆角矩形，免 clip）
    roundRect(ctx, -s * 0.4, -s * 0.42, s * 0.8, s * 0.24, r * 0.6);
    ctx.fillStyle = 'rgba(255,255,255,.26)'; ctx.fill();
    // 描边
    ctx.lineWidth = Math.max(1.4, s * 0.035); ctx.strokeStyle = o.stroke || 'rgba(255,255,255,.5)';
    roundRect(ctx, -s / 2, -s / 2, s, s, r); ctx.stroke();
    // 徽记：白色几何图形 + 深色描边
    const er = s * 0.26;
    ctx.save(); ctx.translate(0, s * 0.015);
    ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2, s * 0.055);
    ctx.strokeStyle = 'rgba(12,15,26,.55)'; ctx.fillStyle = 'rgba(255,255,255,.94)';
    (SHAPE_DRAW[def.shape] || SHAPE_DRAW.circle)(ctx, er); ctx.stroke();
    ctx.restore(); ctx.restore();
  }
  /* 自绘廉价背景：渐变 + 星点 + 城市剪影（比 art.scene 每帧重建场景快得多） */
  function buildBackdrop() {
    const rnd = (n) => { const x = Math.sin((level.id || 1) * 127.1 + n * 311.7) * 43758.5453; return x - Math.floor(x); };
    st.stars = [];
    for (let i = 0; i < 26; i++) st.stars.push({ x: rnd(i) * W, y: rnd(i + 60) * H * 0.52, s: 0.9 + rnd(i + 120) * 1.9, p: rnd(i + 180) * TAU });
    st.skyline = [];
    let x = -20;
    while (x < W + 40) {
      const w = 36 + rnd(x * 0.11) * 96;
      const hh = 46 + rnd(x * 0.07 + 3) * 156;
      st.skyline.push({ x, w, h: hh });
      x += w + 9;
    }
  }
  function drawBackground(ctx, t) {
    const sky = (content.theme && content.theme.palette && content.theme.palette.sky) || ['#101427', '#2b1d3a'];
    const ink = (content.theme && content.theme.palette && content.theme.palette.ink) || '#0b0e18';
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, sky[0]); g.addColorStop(0.55, sky[1]); g.addColorStop(1, ink);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // 星点
    ctx.fillStyle = 'rgba(255,250,232,.9)';
    for (const sp of st.stars) {
      ctx.globalAlpha = 0.18 + 0.5 * (0.5 + 0.5 * Math.sin(t * 0.9 + sp.p)); ctx.fillRect(sp.x, sp.y, sp.s, sp.s);
    }
    ctx.globalAlpha = 1;
    // 城市剪影
    ctx.fillStyle = 'rgba(0,0,0,.46)';
    for (const b of st.skyline) ctx.fillRect(b.x, H - 44 - b.h, b.w, b.h + 44);
    // 暗幕 + 底部压暗
    ctx.fillStyle = 'rgba(7,9,18,.42)'; ctx.fillRect(0, 0, W, H);
    const vg = ctx.createLinearGradient(0, H * 0.6, 0, H);
    vg.addColorStop(0, 'rgba(4,6,12,0)'); vg.addColorStop(1, 'rgba(4,6,12,.55)');
    ctx.fillStyle = vg; ctx.fillRect(0, H * 0.6, W, H * 0.4);
  }
  function drawQueue(ctx, t) {
    const rail = G.qRail;
    panel(ctx, rail.x, rail.y, rail.w, rail.h, { r: 20, fill: 'rgba(18,22,36,.85)', stroke: 'rgba(255,255,255,.12)', shadow: false });
    // 队伍导轨
    ctx.save();
    const gy = G.qSlots[0].cy + G.qSize * 0.5 + 10;
    ctx.strokeStyle = 'rgba(255,255,255,.10)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(rail.x + 14, gy); ctx.lineTo(rail.x + rail.w - 14, gy); ctx.stroke();
    ctx.restore();
    const vis = Math.min(WIN, st.queue.length);
    for (let i = 0; i < WIN; i++) {
      const s = G.qSlots[i];
      if (i < vis) {
        drawItem(ctx, s.cx, s.cy, G.qSize, st.queue[i], { scale: 1 });
      } else {
        ctx.save(); ctx.globalAlpha = 0.5;
        ctx.setLineDash([7, 6]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.16)';
        roundRect(ctx, s.x, s.y, s.w, s.h, G.qSize * 0.24); ctx.stroke();
        ctx.restore();
      }
    }
    // 队伍指引箭头（指向环道）
    const f0 = G.qSlots[0];
    ctx.save(); ctx.globalAlpha = 0.75;
    ctx.fillStyle = '#ffd76a'; ctx.beginPath();
    ctx.moveTo(f0.x - 12, f0.cy - 9); ctx.lineTo(f0.x - 12, f0.cy + 9); ctx.lineTo(f0.x - 26, f0.cy);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function drawBelt(ctx, t) {
    const rail = G.beltRail;
    panel(ctx, rail.x, rail.y, rail.w, rail.h, { r: 22, fill: 'rgba(14,18,30,.9)', stroke: 'rgba(255,255,255,.14)', shadow: false });
    // 传送带纹理
    ctx.save();
    ctx.beginPath(); roundRect(ctx, rail.x + 10, rail.y + 10, rail.w - 20, rail.h - 20, 16); ctx.clip();
    const off = (t * 46) % 26;
    ctx.strokeStyle = 'rgba(255,255,255,.045)'; ctx.lineWidth = 10;
    for (let x = rail.x - 40; x < rail.x + rail.w + 60; x += 26) {
      ctx.beginPath(); ctx.moveTo(x + off, rail.y + rail.h); ctx.lineTo(x + off + 22, rail.y); ctx.stroke();
    }
    ctx.restore();
    // 堵塞红光
    if (st.jam) {
      const a = 0.25 + 0.2 * Math.sin(t * 12);
      ctx.save();
      ctx.strokeStyle = `rgba(255,93,93,${a})`; ctx.lineWidth = 5;
      roundRect(ctx, rail.x - 2, rail.y - 2, rail.w + 4, rail.h + 4, 24); ctx.stroke();
      ctx.restore();
    }
    // 空槽
    for (let i = 0; i < BELT_CAP; i++) {
      const s = G.beltSlots[i];
      ctx.save();
      ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.13)';
      roundRect(ctx, s.x + 3, s.y + 3, s.w - 6, s.h - 6, G.bSize * 0.24); ctx.stroke();
      ctx.restore();
    }
    // 物件（前端在左）
    for (let i = 0; i < st.belt.length; i++) {
      const s = G.beltSlots[i];
      const item = st.belt[i];
      const k = easeOutCubic(clamp(item.k, 0, 1));
      const scale = 0.55 + 0.45 * k;
      drawItem(ctx, s.cx, s.cy + (1 - k) * -6, G.bSize, item.c, { scale });
      if (i === 0 && st.jam) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,93,93,.9)'; ctx.lineWidth = 3;
        roundRect(ctx, s.x - 5, s.y - 5, s.w + 10, s.h + 10, G.bSize * 0.3); ctx.stroke();
        ctx.restore();
      }
    }
    // 出口：箭头指向下（送车位）
    const s0 = G.beltSlots[0];
    ctx.save(); ctx.globalAlpha = st.belt.length ? 0.85 : 0.35;
    ctx.fillStyle = COLORS[0] ? 'rgba(255,255,255,.75)' : '#fff';
    const ay = rail.y + rail.h - 4;
    ctx.beginPath(); ctx.moveTo(s0.cx - 12, ay); ctx.lineTo(s0.cx + 12, ay); ctx.lineTo(s0.cx, ay + 18); ctx.closePath(); ctx.fill();
    ctx.restore();
    // 节拍条
    const beatK = clamp(1 - st.beatT / BEAT, 0, 1);
    if (st.belt.length && !st.jam) {
      bar(ctx, rail.x + 18, rail.y + rail.h - 13, rail.w - 36, 5, beatK, { c1: 'rgba(255,255,255,.35)', c2: '#ffd76a' });
    }
  }
  function drawLanes(ctx, t) {
    for (let i = 0; i < st.lanes.length; i++) {
      const ln = st.lanes[i];
      const gl = G.lanes[i];
      const def = colorOf(ln.color);
      const locked = st.clears < ln.lock;
      const r = gl.rect;
      ctx.save();
      const fill = locked ? 'rgba(15,17,27,.88)' : 'rgba(22,26,43,.88)';
      panel(ctx, r.x, r.y, r.w, r.h, { r: 16, fill, stroke: locked ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.17)', shadow: false });
      // 极淡底色 + 左侧强调条
      if (!locked) {
        ctx.save();
        ctx.globalAlpha = 0.055; ctx.fillStyle = def.color;
        ctx.beginPath(); roundRect(ctx, r.x, r.y, r.w, r.h, 16); ctx.clip();
        ctx.fillRect(r.x, r.y, r.w, r.h); ctx.restore();
      }
      ctx.save(); ctx.globalAlpha = locked ? 0.28 : 0.95;
      ctx.fillStyle = def.color;
      roundRect(ctx, r.x + 5, r.y + 10, 6, r.h - 20, 3); ctx.fill();
      ctx.restore();
      // 颜色圆徽
      const chip = gl.chip;
      ctx.save(); ctx.globalAlpha = locked ? 0.45 : 1;
      ctx.beginPath(); ctx.arc(chip.cx, chip.cy, chip.d / 2, 0, TAU);
      ctx.fillStyle = def.color; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(255,255,255,.42)'; ctx.stroke();
      ctx.fillStyle = 'rgba(20,24,40,.72)';
      ctx.save(); ctx.translate(chip.cx, chip.cy);
      (SHAPE_DRAW[def.shape] || SHAPE_DRAW.circle)(ctx, chip.d * 0.28); ctx.restore();
      ctx.restore();
      // 名称 + 进度（合成一条文本，省一次绘制）
      const nameSize = clamp(Math.round(gl.slot * 0.34), 13, 21);
      text(ctx, def.name + ' ' + ln.items + '/' + LANE_CAP, gl.nameX, gl.cy + 1, {
        size: nameSize, color: locked ? 'rgba(255,255,255,.42)' : '#fff', weight: 800,
      });
      // 4 格
      for (let k = 0; k < LANE_CAP; k++) {
        const sl = gl.slots[k];
        const filled = k < ln.items;
        ctx.save(); roundRect(ctx, sl.x, sl.y, sl.w, sl.h, Math.max(6, sl.w * 0.22));
        ctx.fillStyle = filled ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.30)'; ctx.fill();
        if (!filled) {
          ctx.lineWidth = 1.4;
          ctx.strokeStyle = locked ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.16)'; ctx.stroke();
        }
        ctx.restore();
        if (filled) {
          const pop = ln.flash > 0 ? 1 + ln.flash * 0.45 : 1;
          drawItem(ctx, sl.cx, sl.cy, sl.w * 0.96, ln.color, { scale: pop });
        }
      }
      // 右侧状态
      const infoX = G.infoX;
      const infoY = gl.cy;
      if (locked) {
        const lx = r.x + r.w - 18;
        text(ctx, '还差 ' + (ln.lock - st.clears) + ' 排', lx, infoY + 1, { size: clamp(Math.round(gl.slot * 0.3), 12, 17), color: '#ffb27a', weight: 800, align: 'right' });
        ctx.save(); ctx.globalAlpha = 0.9;
        icon(ctx, 'lock', r.x + r.w - 118, infoY, 19, '#ffb27a'); ctx.restore();
      } else if (ln.items >= LANE_CAP - 1) {
        text(ctx, '即将清空', r.x + r.w - 18, infoY + 1, { size: clamp(Math.round(gl.slot * 0.28), 12, 17), color: '#8fffc0', weight: 800, align: 'right' });
      }
      // 满格闪光
      if (ln.flash > 0) {
        ctx.save(); ctx.globalAlpha = ln.flash * 1.8;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
        roundRect(ctx, r.x - 1, r.y - 1, r.w + 2, r.h + 2, 17); ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }
  }
  function drawFlyers(ctx) {
    for (const f of st.flyers) {
      const k = easeOutCubic(clamp(f.t / f.dur, 0, 1));
      const x = lerp(f.x0, f.x1, k);
      const y = lerp(f.y0, f.y1, k) - Math.sin(k * Math.PI) * 34;
      drawItem(ctx, x, y, lerp(f.s0, f.s1, k), f.c, { scale: 1, alpha: 0.95 - k * 0.5 });
    }
  }
  function drawWorld(ctx, t) {
    drawBackground(ctx, t); drawQueue(ctx, t);
    drawBelt(ctx, t); drawLanes(ctx, t);
    drawFlyers(ctx);
    // 连锁提示
    if (st.combo > 1) {
      ctx.save(); ctx.globalAlpha = clamp(st.comboT, 0, 1);
      text(ctx, '连锁 x' + st.combo, W - 34, G.laneBottom - 8, { size: 24, color: '#ffd76a', align: 'right', weight: 900, stroke: 'rgba(0,0,0,.5)' });
      ctx.restore();
    }
    // 横幅
    if (st.banner && st.bannerT > 0) {
      const a = clamp(st.bannerT, 0, 1) * clamp((1.2 - st.bannerT) * 4, 0, 1);
      ctx.save(); ctx.globalAlpha = Math.max(0.15, a);
      const w = Math.min(W - 80, 470);
      panel(ctx, W / 2 - w / 2, 236, w, 66, { r: 33, fill: 'rgba(8,10,20,.86)', stroke: 'rgba(255,215,106,.45)', shadow: false });
      text(ctx, st.banner.str, W / 2, 270, { size: 28, align: 'center', color: st.banner.color, weight: 900 });
      ctx.restore();
    }
  }
  function drawHUD(ctx, t) {
    // 顶部：关卡 / 分数 / 用时
    const chipY = 18, chipH = 54;
    const levelLabel = (level.boss ? '难关 ' : '') + '第 ' + level.id + ' 关';
    ctx.save();
    panel(ctx, 18, chipY, 186, chipH, { r: 15, fill: 'rgba(10,14,26,.72)', stroke: 'rgba(255,255,255,.14)', shadow: false });
    text(ctx, levelLabel, 30, chipY + chipH / 2 + 1, { size: 22, color: level.boss ? '#ffb27a' : '#fff', weight: 900 });
    panel(ctx, 212, chipY, 152, chipH, { r: 15, fill: 'rgba(10,14,26,.72)', stroke: 'rgba(255,255,255,.14)', shadow: false });
    text(ctx, '得分', 226, chipY + 18, { size: 12, color: 'rgba(255,255,255,.55)', weight: 700 });
    text(ctx, String(Math.round(st.score)), 226, chipY + 38, { size: 21, color: '#ffd76a', weight: 900 });
    panel(ctx, 372, chipY, 148, chipH, { r: 15, fill: 'rgba(10,14,26,.72)', stroke: 'rgba(255,255,255,.14)', shadow: false });
    text(ctx, '用时', 386, chipY + 18, { size: 12, color: 'rgba(255,255,255,.55)', weight: 700 });
    text(ctx, fmtTime(st.time), 386, chipY + 38, { size: 21, color: '#fff', weight: 900 });
    ctx.restore();
    // 候车队列标签
    const vis = Math.min(WIN, st.queue.length);
    text(ctx, '候车队列', G.qLabel.x, G.qLabel.y + 2, { size: 19, color: 'rgba(255,255,255,.8)', weight: 800 });
    text(ctx, `点任意牌送环道 · 剩 ${st.queue.length} 件`, G.qRail.x + G.qRail.w, G.qLabel.y + 2, { size: 15, color: 'rgba(255,255,255,.55)', align: 'right', weight: 700 });
    // 环道标签
    text(ctx, '环道', G.beltLabel.x, G.beltLabel.y + 4, { size: 19, color: 'rgba(255,255,255,.8)', weight: 800 });
    text(ctx, `${st.belt.length} / ${BELT_CAP} 格 · 每拍前送一件`, G.beltRail.x + G.beltRail.w, G.beltLabel.y + 4, { size: 15, color: st.belt.length >= BELT_CAP - 1 ? '#ffb27a' : 'rgba(255,255,255,.5)', align: 'right', weight: 700 });
    // 底部：退回次数 + 进度
    const pr = G.pull;
    panel(ctx, 20, pr.y - 4, W - 40, pr.h + 8, { r: 16, fill: 'rgba(10,14,26,.8)', stroke: 'rgba(255,255,255,.12)', shadow: false });
    for (let i = 0; i < PULL_MAX; i++) {
      const x = pr.x + 8 + i * 23;
      const on = i < st.pull;
      ctx.save(); ctx.globalAlpha = on ? 1 : 0.16;
      ctx.strokeStyle = '#ffd76a'; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x + 13, pr.y + 18); ctx.lineTo(x + 3, pr.y + 26); ctx.lineTo(x + 13, pr.y + 34); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 3, pr.y + 26); ctx.lineTo(x + 18, pr.y + 26); ctx.stroke();
      ctx.restore();
    }
    text(ctx, '退回', pr.x + 84, pr.y + 27, { size: 16, color: 'rgba(255,255,255,.82)', weight: 800 });
    const pgr = G.progress;
    const done = st.totalItems ? st.clearedItems / st.totalItems : 0;
    text(ctx, '分拣进度', pgr.x - 10, pgr.y + pgr.h / 2, { size: 13, color: 'rgba(255,255,255,.46)', align: 'right', weight: 700 });
    bar(ctx, pgr.x, pgr.y, pgr.w, pgr.h, done, { c1: '#62d68f', c2: '#ffd76a' });
    text(ctx, `${st.clearedItems}/${st.totalItems}`, pgr.x + pgr.w + 10, pgr.y + pgr.h / 2, { size: 14, color: 'rgba(255,255,255,.8)', weight: 800 });
    if (st.combo > 1) {
      text(ctx, '连锁 x' + st.combo, W - 34, pgr.y + pgr.h / 2, { size: 17, color: '#ffd76a', align: 'right', weight: 900 });
    } else {
      text(ctx, '连锁 —', W - 34, pgr.y + pgr.h / 2, { size: 14, color: 'rgba(255,255,255,.28)', align: 'right', weight: 700 });
    }
    // 堵塞告警（环道内底部条）
    if (st.jam) {
      const a = 0.6 + 0.4 * Math.sin(t * 10);
      const rr = G.beltRail;
      ctx.save(); ctx.globalAlpha = a;
      roundRect(ctx, rr.x + 26, rr.y + rr.h - 38, rr.w - 52, 28, 14);
      ctx.fillStyle = 'rgba(120,16,26,.92)'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,120,120,.7)'; ctx.lineWidth = 1.5; ctx.stroke();
      text(ctx, st.belt.length >= BELT_CAP ? '环道塞满！点前端退回！' : '环道堵塞 · 点前端退回', W / 2, rr.y + rr.h - 24, { size: 17, align: 'center', color: '#ffd0d0', weight: 900 });
      ctx.restore();
    }
  }
  function fmtClock(s) {
    s = Math.max(0, s);
    const m = Math.floor(s / 60), r = Math.floor(s % 60);
    return m + ':' + String(r).padStart(2, '0');
  }
  /* ------------------------------------------------------------- 输入 */
  function pointer(kind, x, y) {
    if (rule.status !== 'playing') return;
    if (kind === 'key') return;
    if (kind !== 'down') return;
    // 环道前端：退回
    if (st.belt.length) {
      const s = G.beltSlots[0];
      if (x >= s.x - 8 && x <= s.x + s.w + 8 && y >= s.y - 8 && y <= s.y + s.h + 8) { pullBack(); return; }
    }
    // 候车队列
    const vis = Math.min(WIN, st.queue.length);
    for (let i = 0; i < vis; i++) {
      const s = G.qSlots[i];
      if (x >= s.x - 4 && x <= s.x + s.w + 4 && y >= s.y - 4 && y <= s.y + s.h + 4) { clickQueue(i); return; }
    }
  }
  /* ------------------------------------------------------------- 机器人 */
  let plan = null, planIdx = 0, botT = 0, botSolved = false;
  function botStep() {
    if (rule.status !== 'playing') return;
    botSolved = true;
    if (st.belt.length > 0) return;          // 等环道走空，保证「点击 = 一拍」成立
    if (!plan || planIdx >= plan.length) {
      const snap = {
        queue: st.queue.slice(),
        belt: st.belt.map((b) => b.c),
        lanes: st.lanes.map((l) => ({ color: l.color, lock: l.lock, items: l.items })),
        clears: st.clears,
      };
      plan = solveFrom(snap, 60000); planIdx = 0;
      if (!plan) st.solveFails++;
      if (!plan) {
        // 兜底：点队首
        if (st.queue.length) clickQueue(0);
        return;
      }
    }
    const vis = Math.min(WIN, st.queue.length);
    const idx = plan[planIdx];
    if (idx == null || idx >= vis) { plan = null; planIdx = 0; return; }
    if (clickQueue(idx)) planIdx++;
    else { plan = null; planIdx = 0; }
  }
  function bot(dt) {
    if (rule.status !== 'playing') return;
    botT += dt;
    const pace = clamp(29 / Math.max(8, st.startQueue || st.queue.length || 8), 0.72, 1.5);
    if (botT < pace) return;
    botT = 0; botStep();
  }
  /* ------------------------------------------------------------- 初始化 */
  const rule = {
    status: 'playing',
    ui: {},
    init() {
      st.queue = (level.queue || []).slice();
      st.lanes = (level.lanes || []).slice(0, 6).map((l, i) => ({
        color: l.color == null ? i : l.color, preset: l.preset || 0, lock: l.lock || 0,
        items: l.preset || 0, flash: 0, born: 0,
      }));
      while (st.lanes.length < Math.max(1, Math.min(6, level.colors || 3))) {
        const i = st.lanes.length;
        st.lanes.push({ color: i, preset: 0, lock: 0, items: 0, flash: 0, born: 0 });
      }
      st.belt = []; st.flyers = [];
      st.clears = 0; st.clearedItems = 0;
      st.time = 0; st.score = 0;
      st.moves = 0; st.pull = PULL_MAX;
      st.combo = 0; st.comboT = 0;
      st.beatT = BEAT; st.stallT = 0; st.jam = false;
      st.banner = null; st.bannerT = 0; st.endT = 0;
      st.winT = 0; st.deadT = 0;
      st.totalItems = st.queue.length + st.lanes.reduce((s, l) => s + (l.preset || 0), 0);
      st.startQueue = st.queue.length; buildLayout();
      buildBackdrop();
      rule.ui = {
        queues: G.qSlots.map((s) => ({ x: s.x, y: s.y, w: s.w, h: s.h })),
        belt: G.beltSlots.map((s) => ({ x: s.x, y: s.y, w: s.w, h: s.h })),
        lanes: G.lanes.map((g) => ({ ...g.rect })),
        pull: { ...G.pull },
      };
      plan = null; planIdx = 0; botT = 0; botSolved = false;
    },
    update, drawWorld, drawHUD, pointer, bot,
    result() {
      return { stars: rule.status === 'won' ? starsFor() : 0, score: Math.round(st.score), coins: 0, kills: st.clears, time: st.time };
    },
    debug() {
      return {
        time: +st.time.toFixed(2),
        score: Math.round(st.score),
        moves: st.moves,
        kills: st.clears,
        clears: st.clears,
        cleared: st.clearedItems,
        total: st.totalItems,
        queue: st.queue.length,
        belt: st.belt.length,
        pull: st.pull,
        jam: st.jam ? 1 : 0,
        lanes: st.lanes.map((l) => l.items),
        planFails: st.solveFails,
        status: rule.status,
      };
    },
  };
  return rule;
}
