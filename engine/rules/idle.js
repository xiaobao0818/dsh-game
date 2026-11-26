/* =========================================================================
 * rules/idle.js —— 放置经营 / 30 天循环
 *   每天：花行动点招人·升级·上节目 → 点「开始营业」实时结算当日收益
 *   → 日结面板（工资/租金/净利）→ 下一天；第 30 天达标通关，欠费破产失败
 * 纯逻辑 update()/bot()：无 DOM、无 Math.random（只用 svc.rng 与本地 vrng）
 * ========================================================================= */
import { clamp, fmt, RNG } from '../core.js';
import * as R from '../render.js';

const DEF_BIZ = 2.8;          // 每个营业日的实时时长（秒）
const SETTLE_MIN = 0.8;       // 结算面板最早可点「下一天」
const SETTLE_AUTO = 2.3;      // 结算面板自动进入下一日
const MAX_STAFF = 6;          // 场地最大工位
const FAN_CAP = 300;          // 粉丝加成饱和点（+90%）

export function createRule(svc) { const { content, level, W, H, audio, fx, rng } = svc;
  const art = svc.art;
  const D = content.defs;
  const theme = content.theme || {};
  const P = theme.palette || {};
  const CUR = (theme.vocab && theme.vocab.currency) || '金币';
  const days = level.days || 30;
  const econ = level.econMul || 1;
  const BIZ = level.bizSeconds || DEF_BIZ;
  const apMax = level.ap || 2;
  const nf = (v) => (Math.abs(v) >= 1000 ? fmt(v) : (Math.round(v * 10) / 10).toFixed(1));
  const vrng = new RNG((content.slug || 'idle') + ':vis:' + level.id);
  const money = (n) => Math.max(1, Math.round(n * econ));   // 金币量随关卡经济倍率缩放
  const TARGET = level.target || 1000;
  const FAN_TARGET = level.fanTarget || 0;

  const CL = { accent: P.accent || '#ffcf5c', accent2: P.accent2 || '#ff7a59',
    gold: P.gold || '#ffd76a', ok: P.ok || '#62d68f', danger: P.danger || '#ff5d5d',
    hero: P.hero || '#8fd3ff', hero2: P.hero2 || '#3f7ea8',
    ui: 'rgba(12,16,30,.86)', ui2: 'rgba(255,255,255,.10)', ink: P.ink || '#0b0f1c', text: P.text || '#fff',
  };
  const roleDef = (id) => D.roles.find((r) => r.id === id) || D.roles[0];
  const venueDef = () => D.venues[st.venue] || D.venues[0];
  const showDef = (id) => D.shows.find((s) => s.id === id) || null;
  const lvlMul = (lv) => 1 + 0.45 * (lv - 1);
  const fanLvlMul = (lv) => 1 + 0.35 * (lv - 1);

  /* ------------------------------ 状态 ------------------------------ */
  const st = { phase: 'plan',            // plan | biz | settle | event | over
    day: 1, ap: apMax, coins: level.startCoins || 60, fans: 0,
    coinsShown: level.startCoins || 60, fansShown: 0, venue: 0, staff: [], uid: 1,
    bizT: 0, settleT: 0, time: 0, animT: 0, today: { incomeMul: 1, fansMul: 1, wageFree: 0, showId: null, market: 1 },
    dayCoins: 0, dayFans: 0, dayIncome: 0, dayWage: 0, dayRent: 0, dayNet: 0, rev: 0, revShown: 0,
    evt: null, evtDay: 0, stars: 0, spend: 0, hires: 0, upgs: 0, showUses: 0,
    finalRatio: 0, overCoin: 0, floatT: 0, win: false, reason: '', showFx: 0,
  };
  const ui = { hire: [], staff: [], venue: null, shows: [], cta: null, settle: null, event: [], bars: {} };
  let botT = 0;

  /* ------------------------------ 数值模型 ------------------------------ */
  function rate() { const v = venueDef();
    let base = v.base, fansRaw = 0, wage = 0;
    for (const e of st.staff) { const def = roleDef(e.role);
      base += def.rate * lvlMul(e.level);
      fansRaw += def.fans * fanLvlMul(e.level);
      wage += def.wage; }
    const fanBonus = 1 + Math.min(0.9, st.fans / FAN_CAP);
    const inc = base * v.price * st.today.incomeMul * fanBonus * econ * st.today.market;
    const fanRate = fansRaw * st.today.fansMul * econ;
    const wageCost = st.today.wageFree ? 0 : wage * econ;
    const rentCost = v.rent * econ;
    return { inc, fanRate, wage: wageCost, rent: rentCost, base, fanBonus, v }; }
  const hireCost = (def) => money(def.cost);
  const upCost = (e) => money(roleDef(e.role).cost * (0.5 + 0.32 * e.level));
  const venueCost = () => (D.venues[st.venue + 1] ? money(venueDef().upCost) : 0);

  /* ------------------------------ 玩家动作 ------------------------------ */
  let lastToast = { msg: '', t: -9 };
  function say(msg) { if (msg === lastToast.msg && st.time - lastToast.t < 1.2) return;
    lastToast = { msg, t: st.time };
    svc.toast?.(msg); }
  function spend(n) { if (st.coins < n) return false; st.coins -= n; st.spend += n; return true; }

  function hire(roleId) { if (st.phase !== 'plan') return false;
    const def = roleDef(roleId);
    const v = venueDef();
    if (st.staff.length >= v.cap) { say('工位已满，先升级场地'); audio.sfx('warn'); return false; }
    if (st.ap <= 0) { say('行动点用完了'); audio.sfx('warn'); return false; }
    const c = hireCost(def);
    if (!spend(c)) { say(`${CUR}不足（${c}）`); audio.sfx('warn'); return false; }
    st.staff.push({ uid: st.uid++, role: def.id, level: 1, pop: 1 });
    st.ap--; st.hires++;
    audio.sfx('build');
    fx.burst(W / 2 + (st.staff.length - 2) * 46, 512, 14, { color: def.color || CL.gold, up: 90 });
    fx.text(W / 2, 470, `招募 ${def.name}`, '#ffe9b0', 22);
    return true; }
  function upgradeStaff(uid) { if (st.phase !== 'plan') return false;
    const e = st.staff.find((s) => s.uid === uid);
    if (!e) return false;
    if (e.level >= 5) { say('已满级'); return false; }
    if (st.ap <= 0) { say('行动点用完了'); audio.sfx('warn'); return false; }
    const c = upCost(e);
    if (!spend(c)) { say(`${CUR}不足（${c}）`); audio.sfx('warn'); return false; }
    e.level++; e.pop = 1; st.ap--; st.upgs++;
    audio.sfx('upgrade');
    fx.burst(W / 2 + (st.staff.indexOf(e) - 1.5) * 46, 500, 16, { color: CL.gold, up: 120 });
    fx.text(W / 2, 440, `${roleDef(e.role).name} Lv.${e.level}`, '#ffe9b0', 24);
    return true; }
  function upgradeVenue() { if (st.phase !== 'plan') return false;
    const next = D.venues[st.venue + 1];
    if (!next) { say('场地已是最高级'); return false; }
    if (st.ap <= 0) { say('行动点用完了'); audio.sfx('warn'); return false; }
    const c = venueCost();
    if (!spend(c)) { say(`${CUR}不足（${c}）`); audio.sfx('warn'); return false; }
    st.venue++; st.ap--; st.upgs++;
    audio.sfx('upgrade');
    fx.burst(W / 2, 500, 26, { color: CL.accent, up: 150 });
    fx.text(W / 2, 420, `场地升级 · ${next.name}`, '#fff3c4', 26);
    fx.shake(6);
    return true; }
  function useShow(id) { if (st.phase !== 'plan') return false;
    const def = showDef(id);
    if (!def) return false;
    if (st.today.showId) { say('今天已经上过节目'); return false; }
    const c = money(def.cost);
    if (!spend(c)) { say(`${CUR}不足（${c}）`); audio.sfx('warn'); return false; }
    st.today.showId = id;
    st.today.incomeMul *= def.incomeMul || 1;
    st.today.fansMul *= def.fansMul || 1;
    if (def.wageFree) st.today.wageFree = 1;
    st.showUses++; st.showFx = 1;
    audio.sfx('spell');
    fx.ring(W / 2, 430, CL.accent, 14, { grow: 420, max: 0.5 });
    fx.text(W / 2, 400, def.name, '#ffe9b0', 28);
    return true; }

  /* ------------------------------ 一天流程 ------------------------------ */
  function resetToday() { st.today = { incomeMul: 1, fansMul: 1, wageFree: 0, showId: null, market: 0.94 + rng.next() * 0.12 };
    st.dayCoins = 0; st.dayFans = 0; st.dayWage = 0; st.dayRent = 0; st.dayNet = 0; }
  function eventForDay(d) { const list = level.eventDays || [];
    if (!list.includes(d)) return null;
    return D.events[(d + level.id * 3) % D.events.length]; }
  function openDay() { st.ap = apMax;
    resetToday();
    st.evt = eventForDay(st.day);
    st.evtDay = st.day;
    if (st.evt) st.phase = 'event';
    else st.phase = 'plan'; }
  function startBiz() { if (st.phase !== 'plan') return false;
    st.phase = 'biz'; st.bizT = BIZ; st.floatT = 0;
    audio.sfx('click');
    return true; }
  function endBiz() { const r = rate();
    st.dayWage = Math.round(r.wage);
    st.dayRent = Math.round(r.rent);
    const cost = st.dayWage + st.dayRent;
    const gross = st.dayCoins;
    st.coins -= cost;
    st.dayNet = gross - cost;
    if (st.coins < 0) {
      // 欠费破产
      st.overCoin = Math.round(st.coins);
      st.coins = 0;
      st.phase = 'settle'; st.settleT = 0;
      st.reason = '欠费破产';
      lose();
      return; }
    st.phase = 'settle'; st.settleT = 0;
    audio.sfx('coin');
    if (gross > 0) fx.text(W / 2, 460, `日入 +${fmt(gross)}`, '#ffd76a', 28); }
  function nextDay() { if (st.phase !== 'settle') return false;
    if (st.day >= days) { finalize(); return true; }
    st.day++;
    st.phase = 'plan';
    openDay();
    audio.sfx('click');
    return true; }
  function pickEventOption(i) { if (st.phase !== 'event' || !st.evt) return false;
    const op = st.evt.opts[i];
    if (!op) return false;
    if (op.coins) st.coins = Math.max(0, st.coins + (op.coins > 0 ? money(op.coins) : -money(-op.coins)));
    if (op.fans) st.fans = Math.max(0, st.fans + op.fans * econ);
    if (op.ap) st.ap = Math.min(apMax + 2, st.ap + op.ap);
    if (op.incomeMul) st.today.incomeMul *= op.incomeMul;
    if (op.fansMul) st.today.fansMul *= op.fansMul;
    if (op.wageFree) st.today.wageFree = 1;
    audio.sfx(op.coins > 0 || op.ap > 0 ? 'coin' : 'click');
    if (op.coins < 0) fx.text(W / 2, 500, `${op.coins > 0 ? '+' : ''}${fmt(money(op.coins))}`, CL.danger, 24);
    else if (op.coins > 0) fx.text(W / 2, 500, `+${fmt(money(op.coins))}`, CL.gold, 24);
    if (op.fans) fx.text(W / 2, 540, `${op.fans > 0 ? '+' : ''}${Math.round(op.fans * econ)} 粉丝`, CL.hero, 22);
    st.evt = null;
    st.phase = 'plan';
    return true; }
  function finalize() { st.phase = 'over';
    const coinOk = st.rev >= TARGET;
    const fanOk = st.fans >= FAN_TARGET;
    st.finalRatio = st.rev / Math.max(1, TARGET);
    if (coinOk && fanOk) { st.win = true;
      st.stars = st.finalRatio >= 1.22 ? 3 : st.finalRatio >= 1.08 ? 2 : 1;
      rule.status = 'won';
      audio.sfx('win');
      fx.flash(0.4);
      svc.finish({ stars: st.stars, score: Math.round(st.rev), coins: 16 + level.id * 7,
        kills: Math.floor(st.fans), time: st.time, });
    } else { st.reason = coinOk ? '粉丝不足' : fanOk ? '金币不足' : '双项未达标';
      lose(); }
  }
  function lose() { rule.status = 'lost';
    audio.sfx('lose');
    fx.text(W / 2, 420, st.reason || '失败', CL.danger, 30);
    svc.finish({ stars: 0, score: Math.round(st.rev), coins: 0,
      kills: Math.floor(st.fans), time: st.time, });
  }

  /* ------------------------------ 更新 ------------------------------ */
  function update(dt) { if (rule.status !== 'playing') return;
    st.time += dt; st.animT += dt;
    st.coinsShown += (st.coins - st.coinsShown) * Math.min(1, dt * 9);
    st.revShown += (st.rev - st.revShown) * Math.min(1, dt * 9);
    st.fansShown += (st.fans - st.fansShown) * Math.min(1, dt * 9);
    if (Math.abs(st.coins - st.coinsShown) < 0.4) st.coinsShown = st.coins;
    st.showFx = Math.max(0, st.showFx - dt * 1.6);
    for (const e of st.staff) if (e.pop > 0) e.pop = Math.max(0, e.pop - dt * 2);

    if (st.phase === 'biz') { const r = rate();
      const dInc = r.inc * dt, dFan = r.fanRate * dt;
      st.coins += dInc; st.dayCoins += dInc; st.rev += dInc;
      st.fans += dFan; st.dayFans += dFan;
      st.bizT -= dt;
      // 跳字 / 金币飞起
      st.floatT -= dt;
      if (st.floatT <= 0 && dInc > 0) { st.floatT = 0.26;
        fx.text(W / 2 + vrng.range(-90, 90), 360 + vrng.range(-26, 26), `+${fmt(r.inc * 0.26)}`, '#ffd76a', 20);
        fx.burst(W / 2 + vrng.range(-60, 60), 400, 3, { color: CL.gold, up: 120, speed: 70 }); }
      if (st.bizT <= 0) endBiz(); } else if (st.phase === 'settle') {
      st.settleT += dt;
      if (st.settleT >= SETTLE_AUTO && rule.status === 'playing') nextDay(); }
  }

  /* ------------------------------ 绘制：世界 ------------------------------ */
  const GROUND = 520;
  function staffPos(i, n) { const span = Math.min(560, 96 * Math.max(1, n - 1) + 60);
    const step = n <= 1 ? 0 : span / (n - 1);
    return { x: W / 2 - span / 2 + step * i, y: GROUND + 12 }; }
  let bgCanvas = null;
  function buildBg(ctx) { if (bgCanvas || !art) return;
    const doc = ctx.canvas && ctx.canvas.ownerDocument;
    if (!doc || !doc.createElement) return;
    const dpr = Math.min(2, (ctx.getTransform && ctx.getTransform().a) || 1);
    const c = doc.createElement('canvas');
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    const g = c.getContext('2d');
    if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    art.scene(g, W, H, 0, { groundY: GROUND });
    const vg = g.createLinearGradient(0, 60, 0, H * 0.62);
    vg.addColorStop(0, 'rgba(0,0,0,.05)'); vg.addColorStop(1, 'rgba(0,0,0,.34)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H * 0.62);
    bgCanvas = c; }
  function drawWorld(ctx, t) { const shake = fx.shakeAmt;
    ctx.save();
    if (shake > 0.4) ctx.translate((vrng.next() - 0.5) * shake, (vrng.next() - 0.5) * shake);
    buildBg(ctx);
    if (bgCanvas) ctx.drawImage(bgCanvas, 0, 0, W, H);
    else if (art) art.scene(ctx, W, H, t, { groundY: GROUND });
    else { ctx.fillStyle = '#141428'; ctx.fillRect(0, 0, W, H); }
    // 招牌
    const v = venueDef();
    if (art) art.flag(ctx, W / 2 - 152, GROUND - 34, CL.accent2, t);
    if (art) art.building(ctx, W / 2, GROUND, 214, 178, { kind: st.venue % 4, level: st.venue + 1, t, selected: false });
    // 店面招牌（画在建筑体上，避开顶部 toast 区）
    R.panel(ctx, W / 2 - 74, GROUND - 142, 148, 46, { r: 10, fill: 'rgba(20,14,10,.82)', stroke: 'rgba(255,207,92,.5)', shadow: false });
    R.text(ctx, v.name, W / 2, GROUND - 124, { size: 22, color: '#ffe9b0', align: 'center', weight: 900 });
    R.text(ctx, `Lv.${st.venue + 1} · 工位 ${v.cap}`, W / 2, GROUND - 104, { size: 11, color: 'rgba(255,233,176,.72)', align: 'center', weight: 700 });
    // 员工
    const n = st.staff.length;
    for (let i = 0; i < n; i++) { const e = st.staff[i], def = roleDef(e.role), p = staffPos(i, n);
      const bob = e.pop > 0 ? Math.sin(e.pop * 12) * 5 : 0;
      if (art) { art.char(ctx, p.x, p.y - bob, 1.42, {
          kind: 'hero', role: def.role, name: def.name, tier: e.level, t: t + i * 0.7,
          facing: 1, moving: st.phase === 'biz', hp: null, });
      } else { ctx.fillStyle = def.color || CL.hero; ctx.fillRect(p.x - 8, p.y - 24, 16, 24); }
      R.panel(ctx, p.x - 26, p.y + 2, 52, 20, { r: 10, fill: 'rgba(8,12,22,.72)', stroke: 'rgba(255,255,255,.16)', shadow: false });
      R.text(ctx, `Lv.${e.level}`, p.x, p.y + 13, { size: 13, color: e.level >= 5 ? CL.gold : '#fff', align: 'center', weight: 800 });
    }
    if (n === 0) {
      R.text(ctx, '还没有员工，点下方「招募」', W / 2, GROUND + 30, { size: 16, color: 'rgba(255,255,255,.55)', align: 'center', weight: 600 });
    }
    // 营业中：顾客/粉丝人群
    if (st.phase === 'biz') { const cnt = Math.min(22, 5 + Math.floor(st.fans / 12));
      for (let i = 0; i < cnt; i++) { const x = 62 + ((i * 89 + 17) % (W - 124));
        const y = GROUND - 8 + (i % 3) * 5 + Math.sin(t * 2.6 + i * 1.7) * 2.5;
        const a = 0.28 + (i % 4) * 0.06;
        ctx.globalAlpha = a;
        ctx.fillStyle = i % 3 === 0 ? CL.hero : i % 3 === 1 ? CL.accent : CL.accent2;
        ctx.beginPath(); ctx.arc(x, y - 13, 4.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(x - 3.4, y - 9, 6.8, 10); }
      ctx.globalAlpha = 1;
      // 金币喷泉
      for (let i = 0; i < 3; i++) { const x = W / 2 + Math.sin(st.animT * 4 + i * 2.1) * 70;
        const y = 300 - ((st.animT * 90 + i * 60) % 130);
        ctx.globalAlpha = 0.85;
        if (art) art.pickup(ctx, x, y, { color: CL.gold, r: 7, t: st.animT, shape: 'coin' });
        else { ctx.fillStyle = CL.gold; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill(); }
        ctx.globalAlpha = 1; }
    }
    ctx.restore(); }

  /* ------------------------------ 绘制：HUD ------------------------------ */
  const TOP = { y: 14, h: 54 };
  const P1 = { x: 14, y: TOP.y, w: 150, h: TOP.h };
  const P2 = { x: 172, y: TOP.y, w: 150, h: TOP.h };
  const P3 = { x: 330, y: TOP.y, w: 150, h: TOP.h };
  const P4 = { x: 488, y: TOP.y, w: 150, h: TOP.h };
  const INFO = { x: 14, y: 556, w: 692, h: 146 };
  const STAFFP = { x: 14, y: 706, w: 692, h: 166 };
  const HIREP = { x: 14, y: 876, w: 692, h: 134 };
  const VEN = { x: 14, y: 1014, w: 692, h: 62 };
  const SHOWP = { x: 14, y: 1082, w: 692, h: 70 };
  const CTA = { x: 14, y: 1158, w: 692, h: 98 };

  function pill(ctx, r, label, value, color) {
    R.panel(ctx, r.x, r.y, r.w, r.h, { r: 16, fill: 'rgba(8,12,24,.8)', stroke: 'rgba(255,255,255,.13)', shadow: false });
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(r.x + 17, r.y + 17, 6.5, 0, Math.PI * 2); ctx.fill();
    R.text(ctx, label, r.x + 29, r.y + 17, { size: 11, color: 'rgba(255,255,255,.58)', weight: 700 });
    R.text(ctx, value, r.x + 13, r.y + 38, { size: 19, color: '#fff', weight: 900 }); }
  function drawTop(ctx, t) { const f = Math.floor;
    pill(ctx, P1, `现金 ${CUR}`, fmt(f(st.coinsShown)), CL.gold);
    pill(ctx, P2, '累计营业额', fmt(f(st.revShown)), CL.accent2);
    pill(ctx, P3, '粉丝', fmt(f(st.fansShown)), CL.hero);
    // 天数 + 行动点
    R.panel(ctx, P4.x, P4.y, P4.w, P4.h, { r: 16, fill: 'rgba(8,12,24,.8)', stroke: 'rgba(255,255,255,.13)', shadow: false });
    R.text(ctx, `第 ${st.day}/${days} 天`, P4.x + 13, P4.y + 19, { size: 16, color: '#fff', weight: 900 });
    R.text(ctx, '行动点', P4.x + P4.w - 12, P4.y + 19, { size: 10, color: 'rgba(255,255,255,.45)', align: 'right', weight: 600 });
    for (let i = 0; i < apMax; i++) { ctx.beginPath(); ctx.arc(P4.x + 18 + i * 17, P4.y + 39, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = i < st.ap ? CL.accent : 'rgba(255,255,255,.14)'; ctx.fill(); }
  }
  function statCell(ctx, x, y, label, value, color) {
    R.text(ctx, label, x, y, { size: 12, color: 'rgba(255,255,255,.55)', weight: 600 });
    R.text(ctx, value, x, y + 22, { size: 19, color, weight: 900 }); }
  function drawInfo(ctx, t) { const r = rate();
    R.panel(ctx, INFO.x, INFO.y, INFO.w, INFO.h, { r: 18, fill: 'rgba(10,14,28,.86)', stroke: 'rgba(255,255,255,.12)', shadow: false });
    const cw = INFO.w / 4;
    statCell(ctx, INFO.x + 20, INFO.y + 24, '收入 / 秒', `${r.inc.toFixed(1)}`, CL.gold);
    statCell(ctx, INFO.x + 20 + cw, INFO.y + 24, '粉丝 / 秒', `${r.fanRate.toFixed(2)}`, CL.hero);
    statCell(ctx, INFO.x + 20 + cw * 2, INFO.y + 24, '日支出', `-${fmt(r.wage + r.rent)}`, CL.danger);
    const net = r.inc * BIZ - r.wage - r.rent;
    statCell(ctx, INFO.x + 20 + cw * 3, INFO.y + 24, '预计日净利', `${net >= 0 ? '+' : ''}${fmt(net)}`, net >= 0 ? CL.ok : CL.danger);
    const tags = [`行情 ×${st.today.market.toFixed(2)}`, `粉丝加成 +${Math.round(Math.min(0.9, st.fans / FAN_CAP) * 100)}%`];
    if (st.today.showId) tags.push(`${showDef(st.today.showId).name} 生效中`);
    R.text(ctx, tags.join('   ·   '), INFO.x + 20, INFO.y + 64, { size: 12, color: 'rgba(255,255,255,.6)', weight: 600 });
    const bx = INFO.x + 20, bw = INFO.w - 40;
    R.text(ctx, `营业额 ${fmt(Math.floor(st.rev))} / ${fmt(TARGET)}`, bx, INFO.y + 88, { size: 13, color: CL.accent2, weight: 700 });
    R.bar(ctx, bx, INFO.y + 97, bw, 12, st.rev / Math.max(1, TARGET), { c1: '#b1523a', c2: '#ffb27a', stroke: 'rgba(255,255,255,.15)' });
    const fy = FAN_TARGET ? clamp(st.fans / Math.max(1, FAN_TARGET), 0, 1) : 0;
    R.text(ctx, `粉丝 ${fmt(Math.floor(st.fans))} / ${fmt(FAN_TARGET)}`, bx, INFO.y + 122, { size: 13, color: CL.hero, weight: 700 });
    R.bar(ctx, bx, INFO.y + 131, bw, 10, fy, { c1: '#3f7ea8', c2: '#9fe8ff', stroke: 'rgba(255,255,255,.15)' }); }
  function drawStaff(ctx, t) { const v = venueDef();
    R.panel(ctx, STAFFP.x, STAFFP.y, STAFFP.w, STAFFP.h, { r: 18, fill: 'rgba(10,14,28,.82)', stroke: 'rgba(255,255,255,.1)', shadow: false });
    R.text(ctx, `员工 ${st.staff.length} / ${v.cap}`, STAFFP.x + 18, STAFFP.y + 20, { size: 15, color: '#fff', weight: 800 });
    R.text(ctx, '点头像升级（花行动点）', STAFFP.x + STAFFP.w - 18, STAFFP.y + 20, { size: 12, color: 'rgba(255,255,255,.45)', align: 'right', weight: 600 });
    for (let i = 0; i < ui.staff.length; i++) { const rr = ui.staff[i];
      if (!rr) continue;
      const e = st.staff[i];
      if (i >= v.cap) {
        R.panel(ctx, rr.x, rr.y, rr.w, rr.h, { r: 12, fill: 'rgba(18,20,32,.55)', stroke: 'rgba(255,255,255,.07)', shadow: false });
        R.text(ctx, `工位 ${i + 1} · 升级场地解锁`, rr.x + rr.w / 2, rr.y + rr.h / 2, {
          size: 12, color: 'rgba(255,255,255,.28)', align: 'center', weight: 600, });
        continue; }
      if (!e) { ctx.save(); ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.16)';
        R.roundRect(ctx, rr.x, rr.y, rr.w, rr.h, 12); ctx.stroke(); ctx.restore();
        R.text(ctx, '空位', rr.x + rr.w / 2, rr.y + rr.h / 2, { size: 15, color: 'rgba(255,255,255,.28)', align: 'center', weight: 700 });
        continue; }
      const def = roleDef(e.role);
      const maxed = e.level >= 5;
      const c = upCost(e);
      const can = !maxed && st.ap > 0 && st.coins >= c && st.phase === 'plan';
      R.panel(ctx, rr.x, rr.y, rr.w, rr.h, { r: 12, fill: can ? 'rgba(38,50,84,.92)' : 'rgba(24,30,48,.85)',
        stroke: maxed ? 'rgba(255,215,106,.6)' : can ? 'rgba(255,215,106,.35)' : 'rgba(255,255,255,.12)', shadow: false, });
      ctx.fillStyle = def.color || CL.hero;
      ctx.beginPath(); ctx.arc(rr.x + 24, rr.y + rr.h / 2, 13, 0, Math.PI * 2); ctx.fill();
      R.text(ctx, String(e.level), rr.x + 24, rr.y + rr.h / 2 + 1, { size: 14, color: '#101425', align: 'center', weight: 900 });
      R.text(ctx, def.name, rr.x + 44, rr.y + 24, { size: 15, color: '#fff', weight: 800 });
      R.text(ctx, `产出 ${(def.rate * lvlMul(e.level)).toFixed(1)} / 秒`, rr.x + 44, rr.y + 46, { size: 12, color: 'rgba(255,255,255,.6)', weight: 600 });
      R.text(ctx, maxed ? 'MAX' : `${fmt(c)} ${CUR}`, rr.x + rr.w - 12, rr.y + rr.h / 2, {
        size: 14, color: maxed ? CL.gold : can ? CL.gold : 'rgba(255,255,255,.45)', align: 'right', weight: 800, });
    } }
  function drawHire(ctx, t) {
    R.panel(ctx, HIREP.x, HIREP.y, HIREP.w, HIREP.h, { r: 18, fill: 'rgba(10,14,28,.82)', stroke: 'rgba(255,255,255,.1)', shadow: false });
    R.text(ctx, '招募', HIREP.x + 18, HIREP.y + 18, { size: 15, color: '#fff', weight: 800 });
    R.text(ctx, `工位 ${st.staff.length}/${venueDef().cap}`, HIREP.x + HIREP.w - 18, HIREP.y + 18, { size: 12, color: 'rgba(255,255,255,.45)', align: 'right', weight: 600 });
    for (const c of ui.hire) { const def = roleDef(c.role);
      const cost = hireCost(def);
      const full = st.staff.length >= venueDef().cap;
      const can = !full && st.ap > 0 && st.coins >= cost && st.phase === 'plan';
      R.panel(ctx, c.x, c.y, c.w, c.h, { r: 14, fill: can ? 'rgba(52,40,26,.92)' : 'rgba(26,28,42,.75)',
        stroke: can ? 'rgba(255,215,106,.5)' : 'rgba(255,255,255,.1)', shadow: false, });
      ctx.fillStyle = def.color || CL.hero;
      ctx.beginPath(); ctx.arc(c.x + 24, c.y + 26, 12, 0, Math.PI * 2); ctx.fill();
      R.text(ctx, def.name, c.x + 44, c.y + 20, { size: 16, color: can ? '#fff' : 'rgba(255,255,255,.55)', weight: 800 });
      R.text(ctx, `${(def.rate * venueDef().price).toFixed(1)} 收益 / 秒`, c.x + 12, c.y + 48, {
        size: 12, color: can ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.4)', weight: 600, });
      R.text(ctx, `粉丝 +${def.fans.toFixed(2)}/秒`, c.x + 12, c.y + 66, {
        size: 11, color: can ? 'rgba(143,211,255,.85)' : 'rgba(255,255,255,.35)', weight: 600, });
      R.text(ctx, full ? '工位满' : `${fmt(cost)} ${CUR}`, c.x + c.w / 2, c.y + 88, {
        size: 14, color: can ? CL.gold : full ? 'rgba(255,255,255,.35)' : 'rgba(255,93,93,.8)', align: 'center', weight: 800, });
    } }
  function drawVenueBtn(ctx, t) { const next = D.venues[st.venue + 1];
    const c = venueCost();
    const can = !!next && st.ap > 0 && st.coins >= c && st.phase === 'plan';
    R.button(ctx, VEN, next ? `升级场地 · ${next.name}` : '场地已满级', {
      disabled: !can, size: 20, shadow: false, fill1: can ? CL.accent : '#5a6078', fill2: can ? '#e8a33a' : '#4a5066',
      color: can ? '#33230a' : 'rgba(255,255,255,.5)', });
    if (next) {
      R.text(ctx, `容量 ${venueDef().cap}→${next.cap} · 单价 +${Math.round((next.price / venueDef().price - 1) * 100)}% · 租金 ${fmt(next.rent * econ)}`, VEN.x + 16, VEN.y + VEN.h - 13, {
        size: 12, color: can ? 'rgba(50,32,8,.8)' : 'rgba(255,255,255,.4)', weight: 700, });
      R.text(ctx, `${fmt(c)} ${CUR}`, VEN.x + VEN.w - 16, VEN.y + VEN.h / 2, {
        size: 17, color: can ? '#33230a' : 'rgba(255,255,255,.45)', align: 'right', weight: 900, });
    } }
  function drawShows(ctx, t) { for (let i = 0; i < ui.shows.length; i++) {
      const b = ui.shows[i];
      const def = D.shows[i];
      const cost = money(def.cost);
      const used = !!st.today.showId;
      const can = !used && st.coins >= cost && st.phase === 'plan';
      R.panel(ctx, b.x, b.y, b.w, b.h, { r: 14, fill: can ? 'rgba(40,34,58,.92)' : 'rgba(22,24,36,.8)',
        stroke: can ? 'rgba(199,155,255,.45)' : 'rgba(255,255,255,.1)', shadow: false, });
      R.text(ctx, def.name, b.x + b.w / 2, b.y + 17, { size: 17, color: can ? '#fff' : 'rgba(255,255,255,.5)', align: 'center', weight: 900 });
      R.text(ctx, def.desc, b.x + b.w / 2, b.y + 36, { size: 11, color: can ? 'rgba(255,255,255,.65)' : 'rgba(255,255,255,.35)', align: 'center', weight: 600 });
      R.text(ctx, used ? '今日已用' : `${fmt(cost)} ${CUR}`, b.x + b.w / 2, b.y + 53, {
        size: 13, color: used ? 'rgba(255,255,255,.35)' : can ? CL.accent : 'rgba(255,93,93,.8)', align: 'center', weight: 800,
      }); }
  }
  function drawCTA(ctx, t) { if (st.phase === 'biz') {
      R.panel(ctx, CTA.x, CTA.y, CTA.w, CTA.h, { r: 18, fill: 'rgba(20,26,44,.92)', stroke: 'rgba(255,215,106,.4)', shadow: false });
      R.text(ctx, `营业中 · ${CUR} ${fmt(st.dayCoins)}`, CTA.x + 22, CTA.y + 30, { size: 22, color: CL.gold, weight: 900 });
      R.text(ctx, `粉丝 +${fmt(st.dayFans)}`, CTA.x + CTA.w - 22, CTA.y + 30, { size: 16, color: CL.hero, align: 'right', weight: 800 });
      R.bar(ctx, CTA.x + 22, CTA.y + 56, CTA.w - 44, 22, 1 - st.bizT / BIZ, { c1: '#c9971f', c2: '#ffe06a', stroke: 'rgba(255,255,255,.2)' });
      return; }
    const can = st.phase === 'plan';
    R.button(ctx, CTA, can ? '开始营业' : st.phase === 'settle' ? '结算中…' : '准备中…', { disabled: !can, size: 30, shadow: false,
    });
    if (can) { R.text(ctx, `今日收入预计 +${fmt(rate().inc * BIZ)} ${CUR}`, CTA.x + 24, CTA.y + 30, {
        size: 13, color: 'rgba(50,32,8,.75)', weight: 700, });
      R.text(ctx, `行动点 ${st.ap} / ${apMax}`, CTA.x + CTA.w - 24, CTA.y + 30, {
        size: 13, color: 'rgba(50,32,8,.75)', align: 'right', weight: 700, });
      R.text(ctx, '点这里结算当日（未用行动点会浪费）', CTA.x + CTA.w / 2, CTA.y + 82, {
        size: 12, color: 'rgba(50,32,8,.6)', align: 'center', weight: 600, });
    } }
  function countUp(target, delay, dur) { const k = clamp((st.settleT - delay) / Math.max(0.01, dur), 0, 1);
    return target * (1 - Math.pow(1 - k, 2.2)); }
  function drawSettle(ctx) { const k = clamp(st.settleT / 0.22, 0, 1);
    ctx.fillStyle = `rgba(6,8,16,${0.66 * k})`; ctx.fillRect(0, 70, W, H - 70);
    const pw = 640, ph = 588, px = (W - pw) / 2, py = 318;
    ctx.save(); ctx.translate(W / 2, py + ph / 2); ctx.scale(0.94 + 0.06 * k, 0.94 + 0.06 * k); ctx.translate(-W / 2, -(py + ph / 2));
    R.panel(ctx, px, py, pw, ph, { r: 26, fill: 'rgba(20,24,44,.97)', stroke: st.win ? 'rgba(255,215,106,.5)' : 'rgba(255,255,255,.2)', shadowBlur: 30 });
    R.text(ctx, `第 ${st.day} 天 · 收摊结算`, W / 2, py + 46, { size: 30, color: '#fff', align: 'center', stroke: 'rgba(0,0,0,.4)' });
    R.text(ctx, venueDef().name, W / 2, py + 78, { size: 15, color: 'rgba(255,255,255,.5)', align: 'center', weight: 600 });
    const rows = [ ['当日营业收入', `+${nf(countUp(st.dayCoins, 0.1, 0.35))}`, CL.gold],
      ['新增粉丝', `+${nf(countUp(st.dayFans, 0.18, 0.35))}`, CL.hero],
      ['员工工资', st.dayWage ? `-${nf(countUp(st.dayWage, 0.26, 0.3))}` : '0', CL.danger],
      ['场地租金', st.dayRent ? `-${nf(countUp(st.dayRent, 0.32, 0.3))}` : '0', CL.danger], ];
    rows.forEach(([label, val, color], i) => { const y = py + 128 + i * 44;
      R.text(ctx, label, px + 46, y, { size: 18, color: 'rgba(255,255,255,.62)', weight: 600 });
      R.text(ctx, val, px + pw - 46, y, { size: 21, color, align: 'right', weight: 900 });
      ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px + 40, y + 20); ctx.lineTo(px + pw - 40, y + 20); ctx.stroke(); });
    const net = st.dayNet;
    R.text(ctx, net >= 0 ? '当日净利' : '当日亏损', px + 46, py + 320, { size: 18, color: 'rgba(255,255,255,.62)', weight: 600 });
    R.text(ctx, `${net >= 0 ? '+' : ''}${nf(countUp(Math.abs(net), 0.36, 0.35))}`, px + pw - 46, py + 320, {
      size: 34, color: net >= 0 ? CL.ok : CL.danger, align: 'right', weight: 900, });
    R.text(ctx, `累计营业额 ${fmt(st.rev)} / ${fmt(TARGET)}`, W / 2, py + 368, { size: 15, color: CL.accent2, align: 'center', weight: 800 });
    R.bar(ctx, px + 46, py + 380, pw - 92, 12, clamp(st.rev / Math.max(1, TARGET), 0, 1), { c1: '#b1523a', c2: '#ffb27a', stroke: 'rgba(255,255,255,.16)' });
    R.text(ctx, `粉丝 ${fmt(st.fans)} / ${fmt(FAN_TARGET)}`, W / 2, py + 410, { size: 15, color: CL.hero, align: 'center', weight: 800 });
    R.bar(ctx, px + 46, py + 422, pw - 92, 12, clamp(st.fans / Math.max(1, FAN_TARGET), 0, 1), { c1: '#3f7ea8', c2: '#9fe8ff', stroke: 'rgba(255,255,255,.16)' });
    R.text(ctx, `现金结余 ${fmt(st.coins)} ${CUR}`, W / 2, py + 452, { size: 13, color: 'rgba(255,255,255,.7)', align: 'center', weight: 700 });
    if (st.reason) R.text(ctx, st.reason, W / 2, py + 476, { size: 16, color: CL.danger, align: 'center', weight: 800 });
    // 下一天
    const bReady = st.settleT >= SETTLE_MIN && rule.status === 'playing';
    const last = st.day >= days;
    const br = { x: W / 2 - 150, y: py + ph - 92, w: 300, h: 66 };
    R.button(ctx, br, last ? '看结果' : '下一天 →', { disabled: !bReady, size: 24 });
    if (!bReady) R.text(ctx, '…', W / 2, py + ph - 40, { size: 14, color: 'rgba(255,255,255,.5)', align: 'center' });
    ctx.restore(); }
  function drawEvent(ctx) { const k = clamp(st.animT > 0 ? 1 : 0, 0, 1);
    ctx.fillStyle = `rgba(6,8,16,${0.7 * k})`; ctx.fillRect(0, 70, W, H - 70);
    const pw = 620, ph = 316, px = (W - pw) / 2, py = 452;
    R.panel(ctx, px, py, pw, ph, { r: 26, fill: 'rgba(24,20,40,.97)', stroke: 'rgba(199,155,255,.45)', shadow: false });
    R.text(ctx, '突发事件', W / 2, py + 34, { size: 15, color: 'rgba(199,155,255,.9)', align: 'center', weight: 700 });
    R.text(ctx, st.evt.title, W / 2, py + 70, { size: 32, color: '#fff', align: 'center', stroke: 'rgba(0,0,0,.4)' });
    R.text(ctx, st.evt.text, W / 2, py + 108, { size: 16, color: 'rgba(255,255,255,.7)', align: 'center', weight: 600 });
    for (let i = 0; i < st.evt.opts.length; i++) { const op = st.evt.opts[i];
      const b = ui.event[i];
      const desc = [];
      if (op.coins) desc.push(`${op.coins > 0 ? '+' : ''}${fmt(money(op.coins))} ${CUR}`);
      if (op.fans) desc.push(`${op.fans > 0 ? '+' : ''}${Math.round(op.fans * econ)} 粉丝`);
      if (op.ap) desc.push(`+${op.ap} 行动点`);
      if (op.incomeMul) desc.push(`今日收入 ×${op.incomeMul}`);
      if (op.fansMul) desc.push(`今日粉丝 ×${op.fansMul}`);
      if (op.wageFree) desc.push('免当日工资');
      R.panel(ctx, b.x, b.y, b.w, b.h, { r: 16, fill: 'rgba(48,40,70,.94)', stroke: 'rgba(255,255,255,.2)', shadowBlur: 8 });
      R.text(ctx, op.label, b.x + b.w / 2, b.y + 30, { size: 20, color: '#fff', align: 'center', weight: 900 });
      R.text(ctx, desc.join(' · '), b.x + b.w / 2, b.y + 62, { size: 13, color: op.coins < 0 ? '#ff9c9c' : CL.accent, align: 'center', weight: 700 });
    } }
  function drawHUD(ctx, t) { drawTop(ctx, t);
    if (st.phase === 'settle') { drawSettle(ctx); return; }
    if (st.phase === 'event') { drawEvent(ctx); return; }
    drawInfo(ctx, t);
    drawStaff(ctx, t);
    drawHire(ctx, t);
    drawVenueBtn(ctx, t);
    drawShows(ctx, t);
    drawCTA(ctx, t); }

  /* ------------------------------ 输入 ------------------------------ */
  function pointer(kind, x, y, key) { if (kind === 'key') {
      if (key === ' ' || key === 'Enter') { if (st.phase === 'plan') startBiz();
        else if (st.phase === 'settle' && st.settleT >= SETTLE_MIN) nextDay();
        return; }
      if (key === 'u' || key === 'U') { upgradeVenue(); return; }
      if (key >= '1' && key <= '4') { hire(D.roles[Number(key) - 1].id); return; }
      return; }
    if (kind !== 'down') return;
    if (rule.status !== 'playing') return;
    if (st.phase === 'event') {
      for (let i = 0; i < ui.event.length; i++) if (hit(ui.event[i], x, y)) { pickEventOption(i); return; }
      return; }
    if (st.phase === 'settle') { if (hit(ui.settle, x, y) && st.settleT >= SETTLE_MIN) nextDay();
      return; }
    if (st.phase !== 'plan') return;
    for (const c of ui.hire) if (hit(c, x, y)) { hire(c.role); return; }
    for (let i = 0; i < ui.staff.length; i++) if (hit(ui.staff[i], x, y) && st.staff[i]) { upgradeStaff(st.staff[i].uid); return; }
    if (hit(ui.venue, x, y)) { upgradeVenue(); return; }
    for (const b of ui.shows) if (hit(b, x, y)) { useShow(b.id); return; }
    if (hit(ui.cta, x, y)) { startBiz(); return; } }
  const hit = (r, x, y) => !!r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

  /* ------------------------------ 机器人（无头仿真 / 试玩） ------------------------------ */
  /* 机器人：固定建设顺序（填工位 → 全员 Lv2 → 扩场地 → 全员 Lv5），
   * 只受现金/行动点限制，路径不随机，保证无头仿真稳定可复现。 */
  function botNeedFans(r) { if (!FAN_TARGET) return false;
    const left = Math.max(0, days - st.day + 1);
    const projected = st.fans + r.fanRate * BIZ * left;
    return projected < FAN_TARGET * 1.12; }
  function botAct() { if (st.phase !== 'plan') return false;
    const v = venueDef();
    const r = rate();
    const reserve = (r.wage + r.rent) * 1.05 + 6 * econ;   // 只留一天成本 + 小额缓冲
    const safe = st.coins - reserve;
    const needFans = botNeedFans(r);

    // 1) 有工位就招人（粉丝紧张时优先主播，否则优先当前买得起、单产最高的）
    if (st.staff.length < v.cap) { const roster = D.roles.slice().sort((a, b) => b.rate - a.rate);
      let pick = null;
      for (const def of roster) { if (hireCost(def) > safe) continue;
        if (needFans && def.fans < 0.5 && pick) continue;
        pick = def;
        if (needFans && def.fans >= 0.5) break; }
      if (pick) { hire(pick.id); return true; } }
    // 2) 全员先升到 Lv2（性价比最高的阶段），再考虑扩场地
    if (st.staff.length > 0) { const lv1 = st.staff.filter((e) => e.level === 1).sort((a, b) => upCost(a) - upCost(b));
      if (lv1.length) { if (upCost(lv1[0]) <= safe) { upgradeStaff(lv1[0].uid); return true; } return false; } }
    // 3) 扩场地（加容量/单价）——工位满时优先
    const next = D.venues[st.venue + 1];
    if (next && st.staff.length >= v.cap && venueCost() <= safe) { upgradeVenue(); return true; }
    // 4) 全员往上练级
    const low = st.staff.filter((e) => e.level < 5).sort((a, b) => a.level - b.level || upCost(a) - upCost(b));
    if (low.length && upCost(low[0]) <= safe) { upgradeStaff(low[0].uid); return true; }
    // 5) 场地/工位都卡住了，扩场地；否则存钱
    if (next && st.staff.length >= v.cap && venueCost() <= safe) { upgradeVenue(); return true; }
    if (next && venueCost() <= safe && st.coins > venueCost() * 1.6) { upgradeVenue(); return true; }

    // 6) 节目：闲钱换当日收益
    if (!st.today.showId) { const live = D.shows.find((s) => s.id === 'live');
      const boom = D.shows.find((s) => s.id === 'boom');
      const party = D.shows.find((s) => s.id === 'party');
      const gain = r.inc * BIZ;
      const canPay = (c) => st.coins > reserve + c * 1.6;
      if (boom && canPay(money(boom.cost)) && gain * (boom.incomeMul - 1) > money(boom.cost) * 1.25) { useShow('boom'); return true; }
      if (party && canPay(money(party.cost)) && gain * (party.incomeMul - 1) + r.wage > money(party.cost) * 1.15) { useShow('party'); return true; }
      if (needFans && live && canPay(money(live.cost))) { useShow('live'); return true; } }
    return false; }
  function botEvent() { if (st.phase !== 'event' || !st.evt) return;
    let bestI = 0, bestS = -1e9;
    const behind = FAN_TARGET > 0 && st.fans < FAN_TARGET * (st.day / days) * 1.05;
    st.evt.opts.forEach((op, i) => { let sc = 0;
      sc += (op.coins || 0);
      sc += (op.fans || 0) * (behind ? 1.6 : 0.7);
      sc += (op.ap || 0) * 46;
      sc += (op.incomeMul || 1) > 1 ? (op.incomeMul - 1) * 120 : 0;
      sc += (op.fansMul || 1) > 1 ? (op.fansMul - 1) * 60 : 0;
      sc += op.wageFree ? 30 : 0;
      if (sc > bestS) { bestS = sc; bestI = i; } });
    pickEventOption(bestI); }
  function bot(dt) { if (rule.status !== 'playing') return;
    botT += dt;
    if (botT < 0.04) return;
    botT = 0;
    if (st.phase === 'event') { botEvent(); return; }
    if (st.phase === 'settle') { if (st.settleT > SETTLE_MIN + 0.05) nextDay(); return; }
    if (st.phase !== 'plan') return;
    for (let i = 0; i < 8; i++) { if (!botAct()) break; }
    if (st.phase === 'plan') startBiz(); }

  /* ------------------------------ 初始化 ------------------------------ */
  function layout() {
    // 员工工位：3 × 2
    const chipW = Math.floor((STAFFP.w - 16 - 20) / 3);
    const chipH = 60;
    for (let i = 0; i < MAX_STAFF; i++) { const col = i % 3, row = Math.floor(i / 3);
      ui.staff.push({ x: STAFFP.x + 8 + col * (chipW + 10), y: STAFFP.y + 36 + row * (chipH + 8), w: chipW, h: chipH }); }
    // 招募卡：1 × 4
    const cardW = Math.floor((HIREP.w - 16 - 24) / 4);
    for (let i = 0; i < D.roles.length; i++) {
      ui.hire.push({ role: D.roles[i].id, x: HIREP.x + 8 + i * (cardW + 8), y: HIREP.y + 30, w: cardW, h: HIREP.h - 38 }); }
    // 节目：3 个
    const sw = Math.floor((SHOWP.w - 16 - 16) / 3);
    for (let i = 0; i < D.shows.length; i++) {
      ui.shows.push({ id: D.shows[i].id, x: SHOWP.x + 8 + i * (sw + 8), y: SHOWP.y + 4, w: sw, h: SHOWP.h - 8 }); }
    ui.venue = { x: VEN.x, y: VEN.y, w: VEN.w, h: VEN.h };
    ui.cta = { x: CTA.x, y: CTA.y, w: CTA.w, h: CTA.h };
    ui.settle = { x: W / 2 - 150, y: 318 + 588 - 92, w: 300, h: 66 };
    const ew = 260;
    ui.event = [ { x: W / 2 - ew - 14, y: 452 + 140, w: ew, h: 132 },
      { x: W / 2 + 14, y: 452 + 140, w: ew, h: 132 }, ];
  }

  const rule = { status: 'playing',
    ui, init() {
      layout();
      st.phase = 'plan';
      resetToday();
      st.coinsShown = st.coins; st.fansShown = st.fans;
      if (st.evt) st.phase = 'event'; },
    update, drawWorld, drawHUD, pointer, bot, result() {
      return { stars: st.win ? st.stars : 0,
        score: Math.round(st.rev), coins: st.win ? 16 + level.id * 7 : 0,
        kills: Math.floor(st.fans), time: st.time,
      }; },
    debug() { return {
        status: rule.status, phase: st.phase, day: st.day, ap: st.ap,
        coins: Math.round(st.coins * 100) / 100, rev: Math.round(st.rev * 100) / 100, fans: Math.round(st.fans * 100) / 100,
        target: TARGET, fanTarget: FAN_TARGET, staff: st.staff.length, venue: st.venue + 1,
        inc: Math.round(rate().inc * 100) / 100, time: Math.round(st.time * 10) / 10, kills: Math.floor(st.fans),
        win: st.win, stars: st.stars, reason: st.reason, finalRatio: Math.round(st.finalRatio * 1000) / 1000,
        spend: st.spend, hires: st.hires, upgs: st.upgs, showUses: st.showUses, };
    }, };
  return rule; }
