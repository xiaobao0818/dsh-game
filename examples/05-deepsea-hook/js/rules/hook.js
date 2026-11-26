/* =========================================================================
 * rules/hook.js —— 「钩爪打捞」：摆动钩爪 / 抓宝避雷 / 限时达标 / 关卡间升级
 *
 * 场地：竖屏 720x1280。海底木筏在画面下方，绞盘吊臂在木筏中央；钩爪以吊臂为
 * 圆心来回摆动，点击沿当前摆动方向发射，抓到物件后回收。越重回收越慢。
 * 纯逻辑：update()/bot() 只用 svc.rng，不碰 DOM，可在 Node 里无头仿真。
 * ========================================================================= */
import { clamp, dist, fmt, fmtTime } from '../core.js';
import { panel, text, button, bar, roundRect } from '../render.js';

const TAU = Math.PI * 2;

export function createRule(svc) {
  const { content, level, W, H, audio, fx } = svc;
  const art = svc.art;
  const P = (content.theme && content.theme.palette) || {};
  const D = content.defs;
  const rng = svc.rng;
  const S = svc.save && svc.save.data ? svc.save : null;
  const unit = (D.economy && D.economy.costUnit) || (content.theme && content.theme.vocab && content.theme.vocab.currency) || '金币';

  /* ----------------------- 调色板（全部来自 theme.palette） ----------------------- */
  const C = {
    gold: P.gold || '#ffd76a', accent: P.accent || '#5ce1ff', accent2: P.accent2 || '#ffb36b',
    hero: P.hero || '#9fe8ff', hero2: P.hero2 || '#3f8fb8', ok: P.ok || '#5cffb0',
    danger: P.danger || '#ff6b6b', enemy: P.enemy || '#7fd6c1', enemy2: P.enemy2 || '#2b6d66',
    ground: P.ground || '#2a4a56', groundDark: P.groundDark || '#12262f',
    ink: P.ink || '#04121c', ui: P.ui || 'rgba(6,22,32,.86)', ui2: P.ui2 || 'rgba(150,230,255,.14)',
    sky: Array.isArray(P.sky) && P.sky.length >= 2 ? P.sky : ['#0a3a4d', '#062033'],
  };
  const col = (k) => C[k] || C.gold;

  /* ----------------------- 场地常量 ----------------------- */
  const PIVOT = { x: W / 2, y: Math.round(H * 0.79) };    // 绞盘吊臂（钩爪圆心）
  const DECK_Y = Math.round(H * 0.815);                   // 木筏甲板
  const SAND_Y = Math.round(H * 0.9);                     // 海床
  const SURFACE_Y = Math.round(H * 0.07);                 // 水面
  const X0 = 66, X1 = W - 66;                             // 物件横向范围
  const Y0 = Math.round(H * 0.168), Y1 = PIVOT.y - 106;   // 物件纵向范围
  const SWING_AMP = 0.88;
  const ROPE_BASE = 900;

  const state = {
    phase: 'shop', shopT: 0, time: 0, left: level.sec,
    score: 0, grabs: 0, shots: 0, stun: 0,
    phaseA: -Math.PI / 2,
    coins: S ? (S.data.coins || 0) : 0,
    up: { power: 0, reel: 0, aim: 0, luck: 0 },
    warnNext: 10, reached: false,
  };
  const hook = { state: 'swing', a: 0, len: 0, spd: 0, item: null };
  const items = [];

  /* ----------------------- 升级数值 ----------------------- */
  const up = (k) => state.up[k] | 0;
  const defUp = (k) => D.upgrades.find((u) => u.id === k) || D.upgrades[0];
  const costOf = (u, lv) => Math.round(u.base * Math.pow(u.growth, lv));
  const maxRope = () => Math.min(1080, ROPE_BASE + 26 * up('power'));
  const fireSpeed = () => 1240 + 95 * up('power');
  const swingSpeed = () => 1.55 - 0.06 * up('aim');
  const aimSnap = () => 0.06 + 0.02 * up('aim');
  function retractSpeed(it) {
    const base = 760 * (1 + 0.17 * up('reel'));
    if (!it) return base;
    const wf = 0.4 * Math.max(0.3, 1 - 0.13 * up('power'));
    return base / (1 + it.weight * wf);
  }
  const coins = () => (S ? (S.data.coins || 0) : state.coins);
  function spend(n) {
    if (coins() < n) return false;
    if (S) { S.data.coins = Math.max(0, (S.data.coins || 0) - n); S.flush(); }
    else state.coins = Math.max(0, state.coins - n);
    return true;
  }

  /* ----------------------- 小工具 ----------------------- */
  function fade(input, a) {
    const s = String(input || '');
    if (s[0] !== '#') return s;
    let h = s.slice(1);
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (h.length < 6) return s;
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${clamp(a, 0, 1).toFixed(3)})`;
  }
  const inRect = (x, y, r) => !!r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  function angDiff(a, b) {
    let d = a - b;
    while (d > Math.PI) d -= TAU;
    while (d < -Math.PI) d += TAU;
    return d;
  }
  function tipPos() {
    return { x: PIVOT.x + Math.sin(hook.a) * hook.len, y: PIVOT.y - Math.cos(hook.a) * hook.len };
  }

  /* ----------------------- 物件生成 ----------------------- */
  /* 分层抽取：保证每关的档位数量与设计一致（稀有宝物真的会出现），
   * 再用 rng 洗牌决定顺序 → 关卡总量稳定、每局布局又不同。 */
  function makeDeck() {
    const total = level.items || 30;
    const hazN = clamp(Math.round(total * (level.hazard || 0.15)), 2, total - 6);
    const posN = total - hazN;
    const p = level.tiers || [0.52, 0.3, 0.14, 0.04];
    const luck = up('luck');
    // 幸运只改变"档位比例"，整体仍是 posN 个物件（按比例归一化，不会凭空变多）
    const w = [p[0], p[1], p[2] * (1 + 0.1 * luck), p[3] * (1 + 0.22 * luck)];
    const wsum = w[0] + w[1] + w[2] + w[3] || 1;
    const n3 = Math.round(posN * (w[3] / wsum));
    const n2 = Math.round(posN * (w[2] / wsum));
    const n1 = Math.round(posN * (w[1] / wsum));
    const n0 = Math.max(0, posN - n1 - n2 - n3);
    const list = [];
    for (let t = 0; t < 4; t++) {
      const n = [n0, n1, n2, n3][t];
      for (let i = 0; i < n; i++) list.push({ tier: t });
    }
    const bombN = Math.round(hazN * (level.bomb || 0.4));
    const junkN = Math.round((hazN - bombN) * 0.45);
    const beastN = hazN - bombN - junkN;
    for (let i = 0; i < bombN; i++) list.push({ hazard: 'bomb' });
    for (let i = 0; i < junkN; i++) list.push({ hazard: 'junk' });
    for (let i = 0; i < beastN; i++) list.push({ hazard: 'beast' });
    for (let i = list.length - 1; i > 0; i--) {
      const j = (rng.next() * (i + 1)) | 0;
      const t = list[i]; list[i] = list[j]; list[j] = t;
    }
    return list;
  }
  const SHAPES = [['coin', 'crystal', 'shell'], ['gem', 'pearl'], ['urn', 'chest'], ['crown', 'orb']];
  function placeItems() {
    const deck = makeDeck();
    const seen = [0, 0, 0, 0];
    const defs = deck.map((e) => {
      if (e.hazard) {
        const pool = D.hazards.filter((h) => h.kind === e.hazard);
        return rng.pick(pool.length ? pool : D.hazards);
      }
      const pool = D.items.filter((d) => d.tier === e.tier);
      const base = rng.pick(pool.length ? pool : D.items);
      const shapes = SHAPES[e.tier] || ['coin'];
      return { ...base, shape: shapes[(seen[e.tier]++) % shapes.length] };
    });
    const limit = 872;                              // 基础绳长内可及（留余量）
    for (let i = 0; i < defs.length; i++) {
      const def = defs[i];
      let x = PIVOT.x, y = Y0 + 40, ok = false;
      for (let tr = 0; tr < 150 && !ok; tr++) {
        x = rng.range(X0 + def.r * 0.5, X1 - def.r * 0.5);
        y = rng.range(Y0 + def.r * 0.5, Y1);
        const d = dist(x, y, PIVOT.x, PIVOT.y);
        if (d > limit || d < 148) continue;
        if (Math.abs(Math.atan2(x - PIVOT.x, PIVOT.y - y)) > 0.72) continue;   // 落在摆钩可及角度内
        if (def.tier === 3 && y > PIVOT.y - 320) continue;     // 稀有宝更靠深水
        let bad = false;
        for (let k = 0; k < items.length; k++) {
          const o = items[k];
          if (dist(x, y, o.x, o.y) < o.r + def.r + 11) { bad = true; break; }
        }
        if (bad) continue;
        ok = true; break;
      }
      if (!ok) { x = clamp(x, X0 + 20, X1 - 20); y = clamp(y, Y0 + 20, Y1 - 20); }
      items.push({
        id: def.id, name: def.name, kind: def.kind || 'treasure', tier: def.tier == null ? 0 : def.tier,
        shape: def.shape, color: def.color, r: def.r, weight: def.weight,
        value: def.value, val: Math.round(def.value > 0 ? def.value * (level.valueScale || 1) : def.value),
        x, y, grabbed: false, bob: rng.range(0, TAU),
      });
    }
  }

  /* ----------------------- 动作 ----------------------- */
  function buy(id) {
    const u = defUp(id), lv = up(id);
    if (!u) return false;
    if (lv >= u.max) { svc.toast?.('已经满级'); return false; }
    const cost = costOf(u, lv);
    if (!spend(cost)) { svc.toast?.(`${unit}不足（需要 ${cost}）`); audio.sfx('warn'); return false; }
    state.up[id] = lv + 1;
    if (S) { S.data.upgrades = S.data.upgrades || {}; S.data.upgrades[id] = lv + 1; S.flush(); }
    audio.sfx('upgrade');
    const i = D.upgrades.findIndex((q) => q.id === id);
    const y = 356 + i * 110 + 50;
    fx.burst(104, y, 14, { color: col(u.color), up: 40, speed: 170 });
    fx.text(360, y - 34, u.name + ' Lv.' + (lv + 1), col(u.color), 20);
    return true;
  }
  function startPlay() {
    if (state.phase !== 'shop') return;
    state.phase = 'play';
    state.time = 0;
    state.left = level.sec;
    audio.sfx('click');
    fx.ring(PIVOT.x, PIVOT.y, col('accent'), 10, { grow: 220, max: 0.5 });
    if (level.id <= 2) svc.toast?.('点击屏幕发射钩爪');
  }
  function fire() {
    if (state.phase !== 'play' || rule.status !== 'playing') return false;
    if (hook.state !== 'swing' || state.stun > 0) return false;
    // 瞄准吸附：把钩爪轻推到最近的物件方向
    let snapAng = null, bestD = aimSnap();
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.grabbed || it.val <= 0) continue;         // 吸附只帮忙对宝物，不会吸到危险物
      const ang = Math.atan2(it.x - PIVOT.x, PIVOT.y - it.y);
      const d = Math.abs(angDiff(ang, hook.a));
      if (d < bestD) { bestD = d; snapAng = ang; }
    }
    if (snapAng != null) hook.a = snapAng;
    hook.state = 'fire';
    hook.len = 24;
    hook.spd = 0;
    state.shots++;
    audio.sfx('arrow');
    fx.burst(PIVOT.x, PIVOT.y, 5, { color: col('hero'), speed: 90, up: 20 });
    return true;
  }
  function grab(it) {
    it.grabbed = true;
    hook.item = it;
    hook.spd = retractSpeed(it);
    hook.state = 'reel';
    audio.sfx('pickup');
    fx.ring(it.x, it.y, col(it.color), 8, { grow: 120, max: 0.3 });
  }
  function applyItem(it) {
    const tip = tipPos(), fxX = PIVOT.x + (tip.x - PIVOT.x) * 0.35, fxY = PIVOT.y - 74;
    const v = Math.round(it.val), big = it.tier >= 2;
    state.grabs++;
    if (it.kind === 'treasure') {
      state.score += v;
      audio.sfx('coin');
      fx.text(fxX, fxY, '+' + fmt(v), col('gold'), big ? 28 : 22);
      fx.burst(tip.x, tip.y, big ? 18 : 10, { color: col(it.color), up: 50, speed: 200, grav: 240 });
      fx.ring(tip.x, tip.y, col('gold'), 9, { grow: big ? 260 : 160, max: 0.4 });
      if (big) {
        fx.shake(it.tier >= 3 ? 6 : 3); fx.flash(it.tier >= 3 ? 0.18 : 0.08);
        fx.text(tip.x, tip.y - 36, it.name, col('ok'), 18, { max: 0.8 });
      }
    } else if (it.kind === 'bomb') {
      state.score = Math.max(0, state.score + v);
      state.stun = 0.85;
      fx.shake(15); fx.flash(0.35);
      fx.burst(tip.x, tip.y, 26, { color: col('danger'), up: 30, speed: 330 });
      fx.ring(tip.x, tip.y, col('danger'), 12, { grow: 460, max: 0.45 });
      fx.text(fxX, fxY, String(v), col('danger'), 28, { max: 1.1 });
      audio.sfx('explode');
    } else {
      state.score = Math.max(0, state.score + v);
      fx.shake(3); fx.burst(tip.x, tip.y, 8, { color: col('enemy'), speed: 150 });
      fx.text(fxX, fxY, String(v), col('danger'), 20);
      audio.sfx('hit');
    }
    const i = items.indexOf(it);
    if (i >= 0) items.splice(i, 1);
    if (!state.reached && state.score >= level.target) {
      state.reached = true;
      svc.toast?.('达标！可以继续捞或点「收工」');
      fx.flash(0.12); audio.sfx('upgrade');
    }
  }
  function land() {
    const it = hook.item;
    hook.item = null;
    hook.state = 'swing';
    if (it) applyItem(it);
  }
  function claim() {
    if (state.phase !== 'play' || rule.status !== 'playing') return;
    if (state.score < level.target) { svc.toast?.('还没达标，再捞几个'); audio.sfx('warn'); return; }
    endLevel();
  }
  function endLevel() {
    if (rule.status !== 'playing') return;
    const win = state.score >= level.target;
    const stars = win ? (state.score >= level.star3 ? 3 : state.score >= level.star2 ? 2 : 1) : 0;
    const eco = D.economy || { winBase: 30, winPerLevel: 5, starBonus: 15, scoreCoins: 0.02 };
    const reward = win ? Math.round(eco.winBase + level.id * eco.winPerLevel + stars * eco.starBonus + state.score * eco.scoreCoins) : 0;
    rule.status = win ? 'won' : 'lost';
    state.phase = 'over';
    hook.state = 'swing';
    svc.finish({ stars, score: Math.round(state.score), coins: reward, kills: state.grabs, time: Math.round(state.time * 10) / 10 });
  }

  /* ----------------------- 钩爪物理 ----------------------- */
  function hookStep(dt) {
    if (hook.state === 'fire') {
      const step = fireSpeed() * dt;
      const n = Math.max(1, Math.ceil(step / 13));
      for (let i = 0; i < n; i++) {
        hook.len += step / n;
        if (hook.len >= maxRope()) {
          hook.len = maxRope();
          hook.state = 'reel';
          hook.spd = retractSpeed(null);
          hook.item = null;
          break;
        }
        const tip = tipPos();
        let hit = null;
        for (let k = 0; k < items.length; k++) {
          const it = items[k];
          if (it.grabbed) continue;
          if (dist(tip.x, tip.y, it.x, it.y) <= it.r + 10) { hit = it; break; }
        }
        if (hit) { grab(hit); break; }
      }
    } else if (hook.state === 'reel') {
      hook.len -= hook.spd * dt;
      if (hook.len <= 0) { hook.len = 0; land(); }
    }
  }

  /* ----------------------- 更新 ----------------------- */
  function update(dt) {
    if (rule.status !== 'playing') return;
    if (state.phase === 'shop') { state.shopT += dt; return; }
    if (state.phase !== 'play') return;
    state.time += dt;
    state.left = Math.max(0, level.sec - state.time);
    state.stun = Math.max(0, state.stun - dt);
    if (hook.state === 'swing') {
      state.phaseA += dt * swingSpeed();
      hook.a = Math.sin(state.phaseA) * SWING_AMP;
      hook.len = 24;                                   // 待发状态：钩爪停在绞盘上方
    } else {
      hookStep(dt);
    }
    if (state.left > 0 && state.left <= 10) {
      const sec = Math.ceil(state.left);
      if (sec < state.warnNext) {
        state.warnNext = sec;
        if (sec === 5 || sec === 3 || sec === 1) audio.sfx('warn');
      }
    }
    if (state.left <= 0) { state.left = 0; endLevel(); }
  }

  /* ----------------------- 机器人（无头仿真） ----------------------- */
  function botShop() {
    const order = ['aim', 'reel', 'power', 'luck'];
    for (let guard = 0; guard < 30; guard++) {
      let bought = false;
      for (const id of order) {
        const u = defUp(id), lv = up(id);
        if (u && lv < u.max && costOf(u, lv) <= coins()) { buy(id); bought = true; break; }
      }
      if (!bought) break;
    }
    startPlay();
  }
  function bot(dt) {
    if (rule.status !== 'playing') return;
    if (state.phase === 'shop') { botShop(); return; }
    if (state.phase !== 'play') return;
    // 稳一手：达标后临近结束、或者场上已经没有宝物时收工
    if (state.score >= level.target) {
      let posLeft = false;
      for (let i = 0; i < items.length; i++) { if (items[i].val > 0) { posLeft = true; break; } }
      if (!posLeft || state.left <= 7.5) { if (hook.state === 'swing') { claim(); return; } }
    }
    if (hook.state !== 'swing' || state.stun > 0) return;
    const over = state.score >= level.target;
    const rope = maxRope() * 0.97;
    let best = null, bestRate = -1;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.grabbed) continue;
      if (it.val <= 0) continue;                          // 从不主动抓危险物
      if (over && it.val < 30) continue;                  // 达标后稳一手，只捞好货
      const dx = it.x - PIVOT.x, dy = PIVOT.y - it.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > rope) continue;
      // 容差取"吸附角"与"物件角半径"的较小值：出手后必被吸附到物件，必定命中
      const tol = Math.min(aimSnap() * 0.85, (it.r + 6) / d);
      if (Math.abs(angDiff(Math.atan2(dx, dy), hook.a)) > tol) continue;
      const t = d / fireSpeed() + d / retractSpeed(it);
      const rate = it.val / Math.max(0.35, t);
      if (rate > bestRate) { bestRate = rate; best = it; }
    }
    if (best) fire();
  }

  /* ----------------------- 绘制：水下场景 ----------------------- */
  function drawFish(ctx, x, y, s, color) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.5, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-s * 0.9, 0); ctx.lineTo(-s * 1.7, -s * 0.5); ctx.lineTo(-s * 1.7, s * 0.5); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function drawWater(ctx, t) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, C.sky[0]); g.addColorStop(0.34, C.sky[1]);
    g.addColorStop(0.72, fade(C.ink, 0.94)); g.addColorStop(1, C.ink);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 3; i++) {              // 水面波光
      ctx.strokeStyle = fade('#ffffff', 0.12 - i * 0.03); ctx.lineWidth = 3 + i * 2;
      ctx.beginPath();
      for (let x = -20; x <= W + 20; x += 24) {
        const y = SURFACE_Y + i * 9 + Math.sin(x * 0.02 + t * 1.4 + i) * 4;
        if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    for (let i = 0; i < 6; i++) {              // 光柱
      const x = W * (0.06 + i * 0.163) + Math.sin(t * 0.35 + i * 1.7) * 26;
      const bw = 34 + (i % 3) * 26;
      ctx.fillStyle = fade('#ffffff', 0.035 + 0.03 * Math.max(0, Math.sin(t * 0.7 + i * 2.1)));
      ctx.beginPath();
      ctx.moveTo(x - bw * 0.42, SURFACE_Y); ctx.lineTo(x + bw * 0.42, SURFACE_Y);
      ctx.lineTo(x + bw * 1.75, SAND_Y); ctx.lineTo(x + bw * 0.35, SAND_Y);
      ctx.closePath(); ctx.fill();
    }
    for (let i = 0; i < 26; i++) {             // 上浮气泡
      const px = 12 + ((i * 149) % (W - 24)) + Math.sin(t * 1.4 + i) * 6;
      const py = H - ((t * (16 + (i % 7) * 8) + i * 181) % (H * 1.02));
      const r = 2 + (i % 4) * 1.6;
      ctx.globalAlpha = 0.1 + (i % 5) * 0.035; ctx.fillStyle = C.hero;
      ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill();
      ctx.globalAlpha = 0.22; ctx.strokeStyle = fade('#ffffff', 0.35); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 4; i++) {              // 远处游鱼剪影
      const x = -90 + ((t * (0.016 + i * 0.007) + i * 0.27) % 1) * (W + 180);
      drawFish(ctx, x, 300 + i * 158 + Math.sin(t * 0.7 + i * 1.9) * 16, 13 + i * 3, fade(C.enemy2, 0.26));
    }
  }
  function drawSeabed(ctx, t) {
    const g = ctx.createLinearGradient(0, SAND_Y - 60, 0, H);
    g.addColorStop(0, fade(C.ground, 0)); g.addColorStop(0.3, C.ground); g.addColorStop(1, C.groundDark);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0, SAND_Y + 12);
    for (let x = 0; x <= W; x += 36) ctx.lineTo(x, SAND_Y + Math.sin(x * 0.016) * 10 + Math.sin(x * 0.045) * 4 - 6);
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 5; i++) {              // 礁石
      const rx = 60 + i * 150 + Math.sin(i * 2.3) * 20, rw = 40 + (i % 3) * 26;
      ctx.fillStyle = fade(C.groundDark, 0.9);
      ctx.beginPath(); ctx.ellipse(rx, SAND_Y + 22 + (i % 2) * 6, rw, rw * 0.42, 0, Math.PI, 0); ctx.fill();
    }
    for (let i = 0; i < 8; i++) {              // 海草
      const gx = 42 + i * 86, hgt = 46 + (i % 4) * 30, sway = Math.sin(t * 1.1 + i * 1.3) * 12;
      ctx.strokeStyle = fade(C.ok, 0.42); ctx.lineWidth = 5 - (i % 3); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(gx, SAND_Y + 18);
      ctx.quadraticCurveTo(gx + sway, SAND_Y + 18 - hgt * 0.55, gx + sway * 1.7, SAND_Y + 18 - hgt);
      ctx.stroke();
    }
  }
  function drawRaft(ctx, t) {
    const dx = W / 2;
    ctx.fillStyle = C.groundDark;                              // 支柱 + 斜撑
    roundRect(ctx, dx - 100, DECK_Y + 12, 18, SAND_Y - DECK_Y + 6, 5); ctx.fill();
    roundRect(ctx, dx + 82, DECK_Y + 12, 18, SAND_Y - DECK_Y + 6, 5); ctx.fill();
    ctx.strokeStyle = fade(C.groundDark, 0.85); ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(dx - 94, DECK_Y + 58); ctx.lineTo(dx + 92, SAND_Y - 26); ctx.stroke();
    ctx.fillStyle = C.ground;                                  // 甲板
    roundRect(ctx, dx - 116, DECK_Y, 232, 20, 9); ctx.fill();
    ctx.fillStyle = fade('#ffffff', 0.14); roundRect(ctx, dx - 112, DECK_Y + 2, 224, 7, 4); ctx.fill();
    ctx.strokeStyle = fade(C.ink, 0.35); ctx.lineWidth = 2;
    for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(dx - 112 + i * 45, DECK_Y + 1); ctx.lineTo(dx - 112 + i * 45, DECK_Y + 19); ctx.stroke(); }
    ctx.fillStyle = fade(C.accent2, 0.75);                     // 浮桶
    roundRect(ctx, dx - 128, DECK_Y + 6, 16, 30, 6); ctx.fill();
    roundRect(ctx, dx + 112, DECK_Y + 6, 16, 30, 6); ctx.fill();
    ctx.fillStyle = fade(C.ground, 0.9);                       // 吊臂立柱
    roundRect(ctx, dx - 11, PIVOT.y, 22, DECK_Y - PIVOT.y + 12, 6); ctx.fill();
    ctx.fillStyle = fade('#ffffff', 0.1); roundRect(ctx, dx - 7, PIVOT.y + 4, 5, DECK_Y - PIVOT.y, 2); ctx.fill();
    const rot = t * (hook.state === 'reel' ? 5.5 : hook.state === 'fire' ? 8 : 1.1);   // 绞盘转鼓
    ctx.save(); ctx.translate(PIVOT.x, PIVOT.y);
    ctx.fillStyle = C.groundDark; ctx.beginPath(); ctx.arc(0, 0, 22, 0, TAU); ctx.fill();
    ctx.strokeStyle = fade(C.accent2, 0.9); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 22, 0, TAU); ctx.stroke();
    ctx.rotate(rot); ctx.strokeStyle = fade(C.accent, 0.85); ctx.lineWidth = 3.4; ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6); ctx.lineTo(Math.cos(a) * 19, Math.sin(a) * 19); ctx.stroke();
    }
    ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.fill();
    ctx.restore();
    if (art) {                                                                          // 玩家
      art.char(ctx, dx - 66, DECK_Y + 2, 1.75, {
        kind: 'hero', role: 'melee', name: 'hooker', tier: 1, facing: 1, t,
        moving: hook.state === 'reel', flash: state.stun > 0,
      });
    } else { ctx.fillStyle = C.hero; ctx.fillRect(dx - 90, DECK_Y - 66, 34, 66); }
  }
  function drawHook(ctx, t) {
    const tip = tipPos();
    const heavy = hook.item ? clamp(hook.item.weight / 2.4, 0, 1) : 0;
    const wig = hook.state === 'reel' ? Math.sin(t * 24) * heavy * 4 : 0;
    const ax = Math.sin(hook.a), ay = -Math.cos(hook.a);
    if (hook.state === 'swing' && state.phase === 'play' && state.stun <= 0) {
      ctx.save();                                              // 瞄准辅助线
      ctx.setLineDash([5, 12]); ctx.lineWidth = 2; ctx.strokeStyle = fade('#ffffff', 0.26);
      ctx.beginPath(); ctx.moveTo(PIVOT.x + ax * 26, PIVOT.y + ay * 26); ctx.lineTo(PIVOT.x + ax * 226, PIVOT.y + ay * 226); ctx.stroke();
      ctx.setLineDash([]); ctx.fillStyle = fade('#ffffff', 0.4);
      ctx.beginPath();
      ctx.moveTo(PIVOT.x + ax * 240, PIVOT.y + ay * 240);
      ctx.lineTo(PIVOT.x + ax * 224 + ay * 8, PIVOT.y + ay * 224 - ax * 8);
      ctx.lineTo(PIVOT.x + ax * 224 - ay * 8, PIVOT.y + ay * 224 + ax * 8);
      ctx.closePath(); ctx.fill();
      ctx.restore();
      let snap = null, bd = aimSnap();                          // 会被吸附的物件高亮
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.grabbed) continue;
        const d = Math.abs(angDiff(Math.atan2(it.x - PIVOT.x, PIVOT.y - it.y), hook.a));
        if (d < bd) { bd = d; snap = it; }
      }
      if (snap) {
        ctx.strokeStyle = fade(C.gold, 0.8); ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.arc(snap.x, snap.y, snap.r + 8, 0, TAU); ctx.stroke();
      }
    }
    const mx = (PIVOT.x + tip.x) / 2 + wig, my = (PIVOT.y + tip.y) / 2;    // 绳子
    ctx.save();
    ctx.strokeStyle = fade(C.ink, 0.55); ctx.lineWidth = 5.5;
    ctx.beginPath(); ctx.moveTo(PIVOT.x, PIVOT.y); ctx.quadraticCurveTo(mx, my, tip.x, tip.y); ctx.stroke();
    ctx.strokeStyle = fade('#e8f6ff', 0.72); ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(PIVOT.x, PIVOT.y); ctx.quadraticCurveTo(mx, my, tip.x, tip.y); ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.translate(tip.x, tip.y); ctx.rotate(hook.a);           // 钩爪
    ctx.strokeStyle = C.hero; ctx.lineWidth = 3.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(0, -4); ctx.stroke();
    ctx.strokeStyle = fade(C.hero2, 0.95);
    ctx.beginPath(); ctx.moveTo(-12, 14); ctx.quadraticCurveTo(-15, -6, 0, -16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, 14); ctx.quadraticCurveTo(15, -6, 0, -16); ctx.stroke();
    ctx.strokeStyle = C.hero; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, -22); ctx.stroke();
    ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(0, -4, 3.4, 0, TAU); ctx.fill();
    ctx.restore();
    if (hook.item) drawItemAt(ctx, hook.item, tip.x, tip.y - 8, 0.82, t);  // 抓着的物件
  }
  function drawWorld(ctx, t) {
    const sh = (fx && fx.shakeAmt) || 0;
    ctx.save();
    if (sh > 0.4) ctx.translate(Math.sin(t * 73) * sh * 0.5, Math.sin(t * 61) * sh * 0.5);
    drawWater(ctx, t);
    drawSeabed(ctx, t);
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.grabbed) continue;
      drawItemAt(ctx, it, it.x, it.y + Math.sin(t * 1.5 + it.bob) * 3, 1, t);
    }
    drawHook(ctx, t);
    drawRaft(ctx, t);
    ctx.restore();
  }

  /* ----------------------- 绘制：物件 ----------------------- */
  function drawItemAt(ctx, it, x, y, s, t) {
    const c = col(it.color), r = it.r * s;
    const glow = it.kind === 'bomb' ? 0.18 : it.kind === 'treasure' ? (it.tier >= 2 ? 0.2 : 0.09) : 0.07;
    ctx.save(); ctx.translate(x, y);
    ctx.globalAlpha = glow * (0.72 + 0.28 * Math.sin(t * 2.6 + it.bob));
    ctx.fillStyle = it.kind === 'bomb' ? col('danger') : c;
    ctx.beginPath(); ctx.arc(0, 0, r * 1.3, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    drawShape(ctx, it, r, c);
    if (it.kind !== 'treasure') {                              // 危险物警示环
      ctx.save();
      ctx.setLineDash([4, 4]); ctx.lineDashOffset = it.kind === 'bomb' ? -t * 14 : 0;
      ctx.strokeStyle = fade(col('danger'), it.kind === 'bomb' ? 0.85 : 0.55); ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(0, 0, r + 6, 0, TAU); ctx.stroke();
      ctx.restore();
      if (it.kind === 'bomb') {
        const pulse = 0.5 + 0.5 * Math.sin(t * 6 + it.bob);
        ctx.strokeStyle = fade(col('danger'), 0.2 + pulse * 0.35); ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.arc(0, 0, r + 9 + pulse * 4, 0, TAU); ctx.stroke();
      }
    }
    if (it.tier === 3) {                                       // 稀有宝闪光
      for (let i = 0; i < 3; i++) {
        const a = t * 1.7 + i * (TAU / 3) + it.bob, rr = r + 7 + Math.sin(t * 3 + i) * 2;
        ctx.fillStyle = fade('#ffffff', 0.6 + 0.4 * Math.sin(t * 4 + i));
        ctx.beginPath(); ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr, 2.2, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
  }
  function drawShape(ctx, it, r, c) {
    const dark = fade(C.ink, 0.45);
    const poly = (n, rad, rot, wob) => {                        // 共用：n 边形
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + (rot || 0);
        const rr = rad * (wob ? 0.7 + 0.28 * Math.sin(i * 2.3 + it.bob) : 1);
        if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath();
    };
    switch (it.shape) {
      case 'gem':
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.82, 0); ctx.lineTo(0, r); ctx.lineTo(-r * 0.82, 0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = fade('#ffffff', 0.32);
        ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.82, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = dark; ctx.lineWidth = 1.6; ctx.stroke();
        break;
      case 'pearl':
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 0, r * 0.92, 0, TAU); ctx.fill();
        ctx.fillStyle = fade('#ffffff', 0.45); ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.32, r * 0.36, 0, TAU); ctx.fill();
        ctx.strokeStyle = dark; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, 0, r * 0.92, 0, TAU); ctx.stroke();
        break;
      case 'urn':
        ctx.fillStyle = c; roundRect(ctx, -r * 0.62, -r * 0.12, r * 1.24, r * 1.1, r * 0.34); ctx.fill();
        ctx.fillStyle = fade(c, 0.9); roundRect(ctx, -r * 0.3, -r * 0.62, r * 0.6, r * 0.5, r * 0.14); ctx.fill();
        ctx.fillStyle = dark; roundRect(ctx, -r * 0.46, -r * 0.66, r * 0.92, r * 0.16, r * 0.08); ctx.fill();
        break;
      case 'chest':
        ctx.fillStyle = c; roundRect(ctx, -r * 0.9, -r * 0.28, r * 1.8, r * 1.1, r * 0.16); ctx.fill();
        ctx.fillStyle = fade(c, 0.82);
        ctx.beginPath(); ctx.moveTo(-r * 0.9, -r * 0.28); ctx.quadraticCurveTo(0, -r * 1.15, r * 0.9, -r * 0.28); ctx.closePath(); ctx.fill();
        ctx.fillStyle = C.gold; roundRect(ctx, -r * 0.14, -r * 0.34, r * 0.28, r * 0.5, 2); ctx.fill();
        break;
      case 'crown':
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(-r, r * 0.55); ctx.lineTo(-r, -r * 0.4); ctx.lineTo(-r * 0.5, r * 0.05);
        ctx.lineTo(0, -r * 0.75); ctx.lineTo(r * 0.5, r * 0.05); ctx.lineTo(r, -r * 0.4);
        ctx.lineTo(r, r * 0.55); ctx.closePath(); ctx.fill();
        ctx.fillStyle = fade('#ffffff', 0.25); ctx.fillRect(-r * 0.92, r * 0.34, r * 1.84, r * 0.16);
        break;
      case 'orb':
        ctx.fillStyle = fade(c, 0.28); ctx.beginPath(); ctx.arc(0, 0, r * 1.05, 0, TAU); ctx.fill();
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 0, r * 0.78, 0, TAU); ctx.fill();
        ctx.fillStyle = fade('#ffffff', 0.6); ctx.beginPath(); ctx.arc(-r * 0.28, -r * 0.3, r * 0.26, 0, TAU); ctx.fill();
        ctx.strokeStyle = fade('#ffffff', 0.55); ctx.lineWidth = 2;
        ctx.save(); ctx.rotate(0.4); ctx.beginPath(); ctx.ellipse(0, 0, r * 1.05, r * 0.36, 0, 0, TAU); ctx.stroke(); ctx.restore();
        break;
      case 'crystal':
        ctx.fillStyle = c; poly(6, r * 0.85, -Math.PI / 2); ctx.fill();
        ctx.fillStyle = fade('#ffffff', 0.28);
        ctx.beginPath(); ctx.moveTo(0, -r * 0.9); ctx.lineTo(r * 0.5, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
        break;
      case 'shell':
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, r * 0.2, r * 0.95, Math.PI, 0); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = dark; ctx.lineWidth = 1.6;
        for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(0, r * 0.2); ctx.lineTo(i * r * 0.42, r * 0.2 - r * 0.86); ctx.stroke(); }
        break;
      case 'rubble':
        ctx.fillStyle = c; poly(7, r, 0, true); ctx.fill();
        ctx.strokeStyle = dark; ctx.lineWidth = 1.6; ctx.stroke();
        break;
      case 'bomb':
        ctx.fillStyle = fade(C.ink, 0.92); ctx.beginPath(); ctx.arc(0, r * 0.1, r * 0.86, 0, TAU); ctx.fill();
        ctx.strokeStyle = col('danger'); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(0, r * 0.1, r * 0.86, 0, TAU); ctx.stroke();
        ctx.strokeStyle = c; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(r * 0.1, -r * 0.7); ctx.quadraticCurveTo(r * 0.7, -r * 1.1, r * 0.55, -r * 1.5); ctx.stroke();
        ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(r * 0.55, -r * 1.5, 3.2, 0, TAU); ctx.fill();
        break;
      case 'spike':
        ctx.fillStyle = c; poly(18, r, 0, false);
        ctx.beginPath();                                        // 18 边改成锯齿
        for (let i = 0; i < 18; i++) {
          const a = (i / 18) * TAU - Math.PI / 2 + it.bob;
          const rr = i % 2 === 0 ? r * 0.92 : r * 1.25;
          if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = fade(C.ink, 0.9);
        ctx.beginPath(); ctx.arc(-r * 0.24, -r * 0.1, 2.2, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(r * 0.24, -r * 0.1, 2.2, 0, TAU); ctx.fill();
        break;
      default:                                                  // coin
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, TAU); ctx.fill();
        ctx.strokeStyle = fade(C.ink, 0.4); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r * 0.58, 0, TAU); ctx.stroke();
        ctx.fillStyle = fade('#ffffff', 0.35); ctx.beginPath(); ctx.arc(-r * 0.26, -r * 0.3, r * 0.28, 0, TAU); ctx.fill();
        break;
    }
  }

  /* ----------------------- 绘制：HUD / 商店 ----------------------- */
  function drawHUD(ctx, t) {
    const ui = rule.ui, low = state.left <= 10, play = state.phase === 'play';
    panel(ctx, 16, 12, 286, 74, { r: 16, fill: C.ui, stroke: fade('#ffffff', 0.12), shadowBlur: 8 });
    text(ctx, '得分', 32, 31, { size: 13, color: fade('#ffffff', 0.55), weight: 700 });
    text(ctx, '目标 ' + fmt(level.target), 288, 31, { size: 13, color: fade('#ffffff', 0.55), weight: 700, align: 'right' });
    text(ctx, fmt(state.score), 32, 55, { size: 28, color: '#fff', weight: 900 });
    bar(ctx, 32, 70, 254, 8, state.score / Math.max(1, level.target), { c1: C.accent2, c2: C.gold });
    panel(ctx, 308, 12, 140, 74, { r: 16, fill: C.ui, stroke: low ? fade(C.danger, 0.7) : fade('#ffffff', 0.12), shadowBlur: 8 });
    text(ctx, '时间', 378, 31, { size: 13, color: fade('#ffffff', 0.55), weight: 700, align: 'center' });
    text(ctx, fmtTime(state.left), 378, 55, { size: 26, weight: 900, align: 'center', color: low ? col('danger') : '#fff' });
    panel(ctx, 454, 12, 174, 74, { r: 16, fill: C.ui, stroke: fade('#ffffff', 0.12), shadowBlur: 8 });
    text(ctx, '金币', 470, 31, { size: 13, color: fade('#ffffff', 0.55), weight: 700 });
    ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(478, 57, 8, 0, TAU); ctx.fill();
    text(ctx, fmt(coins()), 494, 55, { size: 24, color: '#fff', weight: 900 });
    if (state.score >= level.target && play) {                 // 达标提示 + 收工键
      panel(ctx, 16, 96, 250, 38, { r: 19, fill: fade(C.ok, 0.18), stroke: fade(C.ok, 0.55), shadow: false });
      text(ctx, '已达标 · 可继续捞或收工', 32, 115, { size: 15, color: col('ok'), weight: 800 });
      button(ctx, ui.claim, '收工 · 结算', { size: 22, fill1: C.gold, fill2: C.accent2, color: C.ink });
    } else if (play && state.time < 7 && level.id <= 2) {
      text(ctx, '点击屏幕 / 空格 发射钩爪', W / 2, H - 40, { size: 19, color: fade('#ffffff', 0.75), weight: 700, align: 'center' });
    }
    if (state.stun > 0) text(ctx, '钩爪震僵…', W / 2, PIVOT.y - 180, { size: 20, color: col('danger'), weight: 900, align: 'center' });
    if (state.phase === 'shop') drawShop(ctx, t);
  }
  function drawShop(ctx, t) {
    panel(ctx, 36, 270, 648, 536, { r: 24, fill: C.ink, stroke: fade(C.accent, 0.45), shadow: false });
    text(ctx, `第 ${level.id} 关 · 打捞准备`, W / 2, 302, { size: 24, color: '#fff', weight: 900, align: 'center' });
    text(ctx, `目标 ${fmt(level.target)} 分 · 限时 ${level.sec} 秒 · 当前${unit} ${fmt(coins())}`, W / 2, 332, {
      size: 14, color: fade('#ffffff', 0.62), weight: 600, align: 'center',
    });
    D.upgrades.forEach((u, i) => {
      const y = 356 + i * 110, lv = up(u.id), maxed = lv >= u.max, cost = costOf(u, lv);
      const afford = !maxed && coins() >= cost;
      panel(ctx, 64, y, 592, 100, { r: 16, fill: fade('#ffffff', 0.055), stroke: fade('#ffffff', 0.1), shadow: false });
      ctx.fillStyle = fade(col(u.color), 0.2); ctx.beginPath(); ctx.arc(106, y + 50, 26, 0, TAU); ctx.fill();
      drawUpIcon(ctx, u.id, 106, y + 50, col(u.color));
      text(ctx, u.name, 144, y + 30, { size: 21, color: '#fff', weight: 900 });
      text(ctx, u.desc, 144, y + 56, { size: 13, color: fade('#ffffff', 0.58), weight: 600 });
      for (let k = 0; k < u.max; k++) {
        roundRect(ctx, 144 + k * 22, y + 74, 16, 8, 4);
        ctx.fillStyle = k < lv ? col(u.color) : fade('#ffffff', 0.13); ctx.fill();
      }
      const btn = { x: 500, y: y + 18, w: 152, h: 64 };        // 行内购买键（平涂，省帧率）
      roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 14);
      ctx.fillStyle = maxed ? fade('#ffffff', 0.1) : afford ? col(u.color) : fade('#ffffff', 0.08); ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = maxed ? fade('#ffffff', 0.14) : afford ? fade('#ffffff', 0.5) : fade('#ffffff', 0.14);
      roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 14); ctx.stroke();
      text(ctx, maxed ? '已满级' : `升级 ${cost}`, btn.x + btn.w / 2, btn.y + btn.h / 2 + 1, {
        size: 19, weight: 900, align: 'center', color: maxed ? fade('#ffffff', 0.4) : afford ? C.ink : fade('#ffffff', 0.45),
      });
    });
    button(ctx, rule.ui.start, `开始打捞 · ${level.sec} 秒`, { size: 26, shadow: false });
    text(ctx, `${unit}来自通关奖励 · 升级永久保留 · 达标后还能继续捞宝冲星级`, W / 2, H - 42, {
      size: 13, color: fade('#ffffff', 0.45), weight: 600, align: 'center',
    });
  }
  function drawUpIcon(ctx, id, x, y, c) {
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (id === 'power') {
      ctx.beginPath(); ctx.moveTo(-7, 10); ctx.lineTo(-7, 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-13, 12); ctx.quadraticCurveTo(-16, -6, 0, -15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(13, 12); ctx.quadraticCurveTo(16, -6, 0, -15); ctx.stroke();
    } else if (id === 'reel') {
      ctx.beginPath(); ctx.arc(0, 0, 10, -2.4, 2.4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(9, -8); ctx.lineTo(11, 1); ctx.lineTo(2, -2); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, 3, 0, TAU); ctx.fill();
    } else if (id === 'aim') {
      ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 3.4, 0, TAU); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-15, 0); ctx.lineTo(-6, 0); ctx.moveTo(6, 0); ctx.lineTo(15, 0);
      ctx.moveTo(0, -15); ctx.lineTo(0, -6); ctx.moveTo(0, 6); ctx.lineTo(0, 15);
      ctx.stroke();
    } else {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 4.6 : 11;
        if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  /* ----------------------- 输入 ----------------------- */
  function pointer(kind, x, y, key) {
    if (kind === 'key') {
      if (key === ' ' || key === 'Enter' || key === 'Spacebar') {
        if (state.phase === 'shop') startPlay();
        else if (state.phase === 'play') fire();
      }
      return;
    }
    if (kind !== 'down') return;
    const ui = rule.ui;
    if (state.phase === 'shop') {
      for (let i = 0; i < ui.shop.length; i++) {
        if (inRect(x, y, ui.shop[i].row)) { buy(ui.shop[i].id); return; }
      }
      if (inRect(x, y, ui.start)) startPlay();
      return;
    }
    if (state.phase !== 'play') return;
    if (state.score >= level.target && inRect(x, y, ui.claim)) { claim(); return; }
    fire();
  }

  /* ----------------------- 规则对象 ----------------------- */
  const rule = {
    status: 'playing',
    ui: { shop: [], start: { x: 130, y: 832, w: 460, h: 80 }, claim: { x: W / 2 - 150, y: H - 74, w: 300, h: 58 } },
    init() {
      if (S) {
        const u = S.data.upgrades || {};
        for (const k of ['power', 'reel', 'aim', 'luck']) state.up[k] = clamp(u[k] | 0, 0, 5);
      }
      placeItems();
      rule.ui.shop = D.upgrades.map((u, i) => ({
        id: u.id,
        row: { x: 64, y: 356 + i * 110, w: 592, h: 100 },
        btn: { x: 500, y: 356 + i * 110 + 18, w: 152, h: 64 },
      }));
      rule.ui.start = { x: 130, y: 832, w: 460, h: 80 };
      rule.ui.claim = { x: W / 2 - 150, y: H - 74, w: 300, h: 58 };
    },
    update, drawWorld, drawHUD, pointer, bot,
    result() {
      return { stars: 0, score: Math.round(state.score), coins: 0, kills: state.grabs, time: Math.round(state.time) };
    },
    debug() {
      return {
        phase: state.phase, status: rule.status,
        score: state.score, target: level.target,
        left: +state.left.toFixed(1), time: +state.time.toFixed(1),
        shots: state.shots, kills: state.grabs, items: items.length,
        hook: hook.state, stun: state.stun, coins: coins(),
        power: up('power'), reel: up('reel'), aim: up('aim'), luck: up('luck'),
        reached: state.reached,
        pos: items.filter((it) => it.val > 0).length,
        board: items.reduce((a, it) => a + (it.val > 0 ? it.val : 0), 0),
      };
    },
  };
  return rule;
}
