// @ts-nocheck
/* =========================================================================
 * rules/merge.js —— 合成塔防（Merge TD，portrait 720x1280）
 *   底部 2x5 合成棋盘：花金币「召唤」1 级单位，两个同级合体升级（1→6 级）；
 *   棋盘单位自动向中路来敌射击；敌人沿路走向城门，抵达扣基地血量。
 *   胜利 = 清完所有波次；失败 = 基地血量归零；星级按基地剩余血量。
 *   纯逻辑 update()/bot()（无 DOM / 无 Math.random），纯绘制 drawWorld()/drawHUD()
 * ========================================================================= */
import { clamp, dist, RNG } from '../core';
import { roundRect, text, bar } from '../render';

/* ------------------------------ 布局常量（720x1280） ------------------------------ */
const GROUND_Y = 172;
const BASE = { x: 360, y: 704 };
const ROAD_W = 130;
/* 敌人路线：从上方路口一路折返走向城门 */
const ROAD = [{ x: 360, y: 186 }, { x: 360, y: 300 }, { x: 180, y: 375 }, { x: 180, y: 500 },
  { x: 540, y: 570 }, { x: 540, y: 648 }, { x: 360, y: 704 }];
const BOARD = { x: 20, y: 750, w: 680, h: 314 };
const CELL = { w: 120, h: 118, gx: 10, gy: 12, x0: 40, y0: 800 };
const BTN = { summon: { x: 24, y: 1082, w: 424, h: 92 }, sell: { x: 464, y: 1082, w: 232, h: 92 } };
const HUD = { gold: { x: 16, y: 10, w: 184, h: 48 }, wave: { x: 260, y: 10, w: 200, h: 48 },
  kill: { x: 470, y: 10, w: 176, h: 48 }, hp: { x: 76, y: 70, w: 470, h: 22 } };

/* 路线预计算（分段 + 累计长度） */
const SEG = [];
let ROAD_LEN = 0;
for (let i = 0; i < ROAD.length - 1; i++) {
  const a = ROAD[i], b = ROAD[i + 1];
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  SEG.push({ a, b, len, s0: ROAD_LEN, nx: -(b.y - a.y) / len, ny: (b.x - a.x) / len });
  ROAD_LEN += len;
}
function pathAt(s) {
  s = clamp(s, 0, ROAD_LEN);
  let i = 0;
  while (i < SEG.length - 1 && s > SEG[i].s0 + SEG[i].len) i++;
  const g = SEG[i], k = clamp((s - g.s0) / g.len, 0, 1);
  return { x: g.a.x + (g.b.x - g.a.x) * k, y: g.a.y + (g.b.y - g.a.y) * k, nx: g.nx, ny: g.ny };
}

const inRect = (x, y, r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

export function createRule(svc) {
  const { content, level, W, H, audio, fx } = svc;
  const art = svc.art;
  const D = content.defs;
  const rng = svc.rng;
  const view = new RNG('merge-view:' + level.id); // 仅用于屏幕震动/星尘，不污染玩法随机
  const pal = (content.theme && content.theme.palette) || {};
  const C = {
    accent: '#ffcf5c', accent2: '#ff7a59', gold: '#ffd76a', danger: '#ff5d5d', ok: '#62d68f',
    hero: '#8fd3ff', hero2: '#3f7ea8', enemy: '#c85a6a', enemy2: '#6f2436',
    ground: '#3b2b3f', groundDark: '#211827', ui: 'rgba(14,18,32,.86)', ink: '#0d1024', text: '#ffffff',
    ...pal,
  };
  const TIERS = D.tiers;
  const MAXT = TIERS.length;
  const COST = level.summonCost || D.board.summonCost || 10;
  const CUR = (D.board && D.board.currency) || '金币';
  const TIER_COLORS = [C.hero, C.ok, C.accent, C.accent2, C.gold, C.danger];

  /* ------------------------------ 状态 ------------------------------ */
  const enemies = [], shots = [];
  const cells = [];
  const state = {
    gold: level.startGold || 40, baseHp: level.baseHp || 100, baseHpMax: level.baseHp || 100,
    time: 0, kills: 0, leaked: 0, summons: 0, merges: 0, bestTier: 1,
    spawned: 0, spawnIdx: 0, winT: 0, gateFlash: 0, summonCd: 0,
    sel: -1, drag: null, hover: -1,
  };
  const schedule = [];
  (level.waves || []).forEach((w) => {
    (w.groups || []).forEach((g) => {
      for (let i = 0; i < (g.count || 0); i++) {
        schedule.push({ t: (w.at || 0) + (g.delay || 0) + i * (g.gap || 0.8), type: g.type, boss: !!w.boss, mul: w.hpMul || 1 });
      }
    });
  });
  schedule.sort((a, b) => a.t - b.t);

  const tierOf = (t) => TIERS[clamp(t, 1, MAXT) - 1];
  const enemyDef = (id) => D.enemies.find((e) => e.id === id) || D.enemies[0];
  const sellValue = (tier) => Math.max(2, Math.round(COST * Math.pow(2, tier - 1) * 0.4));
  const mergeBonus = (tier) => 1 + tier * 2;
  const cxp = (c) => c.x + CELL.w / 2;
  const cyp = (c) => c.y + CELL.h * 0.60;

  /* ------------------------------ 棋盘动作 ------------------------------ */
  function summon() {
    if (rule.status !== 'playing' || state.summonCd > 0) return false;
    const empties = cells.filter((c) => !c.unit);
    if (!empties.length) { svc.toast('棋盘已满：先合成或出售'); audio.sfx('warn'); state.summonCd = 0.3; return false; }
    if (state.gold < COST) { svc.toast(CUR + '不足（需要 ' + COST + '）'); audio.sfx('warn'); state.summonCd = 0.3; return false; }
    state.gold -= COST;
    const c = empties[(rng.next() * empties.length) | 0];
    c.unit = { tier: 1, cdT: rng.range(0.1, 0.45), pop: 1 };
    state.summons++;
    state.summonCd = 0.05;
    audio.sfx('build');
    fx.ring(cxp(c), cyp(c) - 18, TIER_COLORS[0], 10, { grow: 150, max: 0.35 });
    fx.burst(cxp(c), cyp(c) - 18, 10, { color: TIER_COLORS[0], up: 130, speed: 150 });
    return true;
  }

  function mergeCells(a, b, tier) {
    const nt = tier + 1;
    cells[b].unit = { tier: nt, cdT: 0.28, pop: 1.5 };
    cells[a].unit = null;
    state.merges++;
    if (nt > state.bestTier) state.bestTier = nt;
    const bonus = mergeBonus(nt);
    state.gold += bonus;
    audio.sfx('merge'); audio.sfx('coin');
    fx.ring(cxp(cells[b]), cyp(cells[b]) - 16, TIER_COLORS[nt - 1], 16, { grow: 300, max: 0.5 });
    fx.burst(cxp(cells[b]), cyp(cells[b]) - 16, 20 + nt * 3, { color: TIER_COLORS[nt - 1], up: 100, speed: 230 });
    fx.text(cxp(cells[b]), cyp(cells[b]) - 62, 'Lv.' + nt + ' +' + bonus, C.gold, nt >= 5 ? 26 : 20);
    fx.shake(nt >= 5 ? 5 : 2);
    if (nt >= 5) fx.flash(0.16);
    return true;
  }

  function swapCells(a, b) {
    const t = cells[a].unit;
    cells[a].unit = cells[b].unit;
    cells[b].unit = t;
    audio.sfx('click');
    fx.ring(cxp(cells[b]), cyp(cells[b]) - 16, 'rgba(255,255,255,.5)', 14, { grow: 120, max: 0.28 });
  }

  /* 把 a 的单位合并/换位到 b */
  function resolve(a, b) {
    if (a === b || a < 0 || b < 0) { state.sel = -1; return false; }
    const ua = cells[a].unit;
    if (!ua) { state.sel = -1; return false; }
    const ub = cells[b].unit;
    state.sel = -1;
    if (ub && ub.tier === ua.tier) {
      if (ua.tier >= MAXT) { svc.toast('已经是最高级 Lv.' + MAXT); audio.sfx('warn'); return false; }
      return mergeCells(a, b, ua.tier);
    }
    swapCells(a, b);
    return true;
  }

  function sellSelected() {
    if (state.sel < 0 || !cells[state.sel] || !cells[state.sel].unit) { svc.toast('先点选一个单位'); audio.sfx('warn'); return false; }
    const c = cells[state.sel];
    const v = sellValue(c.unit.tier);
    state.gold += v;
    state.sel = -1;
    audio.sfx('coin');
    fx.burst(cxp(c), cyp(c) - 16, 12, { color: C.gold, up: 90, speed: 150 });
    fx.text(cxp(c), cyp(c) - 50, '+' + v, C.gold, 20);
    c.unit = null;
    return true;
  }

  /* ------------------------------ 敌人 ------------------------------ */
  function spawnEnemy(def, bossWave, mul) {
    const sc = level.scale || { hp: 1, speed: 1, gold: 1, bossHp: 1 };
    const hp = Math.round(def.hp * sc.hp * (mul || 1) * (def.boss ? (sc.bossHp || 1) : 1));
    const e = {
      id: def.id, name: def.name, boss: !!(def.boss || bossWave), def,
      s: 0, x: ROAD[0].x, y: ROAD[0].y, off: rng.range(-42, 42), r: def.r || 13,
      hp, maxHp: hp, speed: def.speed * sc.speed, gold: Math.max(1, Math.round(def.gold * sc.gold)),
      dmg: def.dmg || 8, flash: 0, seed: rng.range(0, 9), dead: false,
    };
    enemies.push(e);
    state.spawned++;
  }

  function hurtEnemy(e, dmg) {
    e.hp -= dmg; e.flash = 0.1;
    if (e.hp <= 0 && !e.dead) {
      e.dead = true;
      state.kills++;
      state.gold += e.gold;
      audio.sfx(e.boss ? 'explode' : 'coin');
      fx.burst(e.x, e.y - 14, e.boss ? 34 : 9, { color: e.boss ? C.accent2 : C.enemy, up: 60, speed: e.boss ? 300 : 170 });
      fx.text(e.x, e.y - 34, '+' + e.gold, C.gold, e.boss ? 28 : 15);
      if (e.boss) { fx.shake(13); fx.flash(0.45); }
    }
  }

  function leak(e) {
    state.baseHp -= e.dmg;
    state.leaked++;
    state.gateFlash = 1;
    if (state.baseHp < 0) state.baseHp = 0;
    audio.sfx('punch');
    fx.shake(7);
    fx.burst(BASE.x, BASE.y - 30, 16, { color: C.danger, up: 90, speed: 230 });
    fx.text(BASE.x, BASE.y - 96, '-' + e.dmg, C.danger, 24);
    e.dead = true;
  }

  /* ------------------------------ 更新 ------------------------------ */
  function update(dt) {
    if (rule.status !== 'playing') return;
    state.time += dt;
    if (state.summonCd > 0) state.summonCd -= dt;
    if (state.gateFlash > 0) state.gateFlash = Math.max(0, state.gateFlash - dt * 2.4);

    while (state.spawnIdx < schedule.length && schedule[state.spawnIdx].t <= state.time) {
      const s = schedule[state.spawnIdx++];
      spawnEnemy(enemyDef(s.type), s.boss, s.mul);
    }

    /* 敌人沿路前进 */
    for (const e of enemies) {
      if (e.dead) continue;
      e.flash = Math.max(0, e.flash - dt);
      e.s += e.speed * dt;
      if (e.s >= ROAD_LEN) { e.s = ROAD_LEN; leak(e); continue; }
      const p = pathAt(e.s);
      e.x = p.x + p.nx * e.off; e.y = p.y + p.ny * e.off; e.nx = p.nx; e.ny = p.ny;
    }

    /* 棋盘单位射击 */
    for (const c of cells) {
      const u = c.unit;
      if (!u) continue;
      if (u.pop > 0) u.pop = Math.max(0, u.pop - dt * 3.2);
      u.cdT -= dt;
      if (u.cdT > 0) continue;
      const def = tierOf(u.tier);
      const ux = cxp(c), uy = cyp(c) - 20;
      let best = null, bd = def.range;
      for (const e of enemies) {
        if (e.dead) continue;
        const d = dist(ux, uy, e.x, e.y - 14);
        if (d < bd) { bd = d; best = e; }
      }
      if (!best) continue;
      u.cdT = def.cd;
      const orb = u.tier >= 4;
      shots.push({
        x: ux, y: uy, target: best, dmg: def.atk, speed: orb ? 760 : 900,
        kind: orb ? 'orb' : 'arrow', color: TIER_COLORS[u.tier - 1], r: 4 + u.tier,
        x0: ux, y0: uy, lethal: u.tier >= 5,
      });
      if (u.tier >= 4) audio.sfx('arrow');
    }

    /* 投射物 */
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i];
      if (!s.target || s.target.dead) { shots.splice(i, 1); continue; }
      const tx = s.target.x, ty = s.target.y - 16;
      const dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy) || 1;
      const step = s.speed * dt;
      s.angle = Math.atan2(dy, dx);
      if (d <= step + 6) {
        hurtEnemy(s.target, s.dmg);
        if (s.lethal) fx.burst(tx, ty, 5, { color: s.color, speed: 120 });
        shots.splice(i, 1);
        continue;
      }
      s.x += (dx / d) * step; s.y += (dy / d) * step;
    }

    /* 清理 */
    for (let i = enemies.length - 1; i >= 0; i--) if (enemies[i].dead) enemies.splice(i, 1);

    /* 胜负 */
    if (state.baseHp <= 0) {
      rule.status = 'lost';
      audio.sfx('lose');
      svc.finish({ stars: 0, score: state.kills * 12 + state.merges * 10, coins: 0, kills: state.kills, time: state.time });
      return;
    }
    const allSpawned = state.spawnIdx >= schedule.length;
    if (allSpawned && enemies.length === 0) {
      state.winT += dt;
      if (state.winT > 0.75) {
        rule.status = 'won';
        const ratio = state.baseHp / state.baseHpMax;
        const stars = ratio >= 0.85 ? 3 : ratio >= 0.5 ? 2 : 1;
        audio.sfx('win');
        svc.finish({
          stars, score: state.kills * 12 + state.merges * 18 + state.bestTier * 60 + Math.round(ratio * 300),
          coins: 18 + level.id * 6, kills: state.kills, time: state.time,
        });
      }
    }
  }

  /* ------------------------------ 绘制：世界 ------------------------------ */
  function traceRoad(ctx) {
    ctx.beginPath(); ctx.moveTo(ROAD[0].x, ROAD[0].y);
    for (let i = 1; i < ROAD.length; i++) ctx.lineTo(ROAD[i].x, ROAD[i].y);
  }

  function drawRoad(ctx, t) {
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    traceRoad(ctx); ctx.lineWidth = ROAD_W + 12; ctx.strokeStyle = 'rgba(0,0,0,.34)'; ctx.stroke();
    traceRoad(ctx); ctx.lineWidth = ROAD_W; ctx.strokeStyle = 'rgba(0,0,0,.30)'; ctx.stroke();
    traceRoad(ctx); ctx.lineWidth = ROAD_W - 30; ctx.strokeStyle = 'rgba(255,255,255,.045)'; ctx.stroke();
    traceRoad(ctx); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,207,92,.16)'; ctx.stroke();
    // 流动中线
    ctx.setLineDash([14, 20]); ctx.lineDashOffset = -(t * 46) % 34;
    traceRoad(ctx); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,207,92,.26)'; ctx.stroke();
    ctx.setLineDash([]);
    // 路肩石
    for (let s = 20; s < ROAD_LEN; s += 64) {
      const p = pathAt(s);
      for (const k of [-1, 1]) {
        ctx.beginPath(); ctx.arc(p.x + p.nx * (ROAD_W / 2 - 7) * k, p.y + p.ny * (ROAD_W / 2 - 7) * k, 2.6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,.10)'; ctx.fill();
      }
    }
    // 出生口
    const p0 = pathAt(0);
    const pulse = 0.5 + 0.5 * Math.sin(t * 3);
    ctx.beginPath(); ctx.arc(p0.x, p0.y, 34 + pulse * 5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,93,93,' + (0.18 + pulse * 0.16) + ')'; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }

  function drawGate(ctx, t) {
    const x = BASE.x, y = BASE.y;
    const f = clamp(state.gateFlash, 0, 1);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,.42)';
    ctx.beginPath(); ctx.ellipse(0, 6, 98, 15, 0, 0, Math.PI * 2); ctx.fill();
    // 城墙
    const g = ctx.createLinearGradient(0, -108, 0, 2);
    g.addColorStop(0, C.groundDark); g.addColorStop(0.55, C.ground); g.addColorStop(1, C.groundDark);
    roundRect(ctx, -84, -104, 168, 106, 8); ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = f > 0.05 ? C.danger : 'rgba(255,255,255,.22)'; ctx.stroke();
    // 城垛
    ctx.fillStyle = C.accent;
    for (let i = 0; i < 5; i++) roundRect(ctx, -80 + i * 34, -120, 24, 20, 4), ctx.fill();
    // 门洞
    ctx.beginPath();
    ctx.moveTo(-32, 2); ctx.lineTo(-32, -44); ctx.arc(0, -44, 32, Math.PI, 0); ctx.lineTo(32, 2);
    ctx.closePath(); ctx.fillStyle = 'rgba(0,0,0,.62)'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,207,92,.35)'; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-84, -78 + i * 22); ctx.lineTo(84, -78 + i * 22); ctx.stroke(); }
    if (f > 0.05) { ctx.fillStyle = 'rgba(255,93,93,' + f * 0.28 + ')'; roundRect(ctx, -84, -120, 168, 124, 8); ctx.fill(); }
    ctx.restore();
    // 城门血条
    const ratio = clamp(state.baseHp / state.baseHpMax, 0, 1);
    ctx.save();
    roundRect(ctx, x - 76, y + 10, 152, 10, 5); ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fill();
    if (ratio > 0) {
      roundRect(ctx, x - 76, y + 10, Math.max(10, 152 * ratio), 10, 5);
      ctx.fillStyle = ratio > 0.5 ? C.ok : ratio > 0.25 ? C.accent : C.danger; ctx.fill();
    }
    ctx.restore();
    if (art) art.flag(ctx, x + 66, y - 104, C.accent2, t);
  }

  function drawEnemy(ctx, e, t) {
    const s = e.boss ? 2.25 : 1.28 + (e.r - 11) * 0.05;
    if (art) {
      art.char(ctx, e.x, e.y, s, {
        kind: e.boss ? 'boss' : 'enemy', role: 'melee', tier: e.boss ? 3 : 1,
        name: e.name, facing: -1, t: t + e.seed, moving: true, flash: e.flash > 0,
        hp: e.hp / e.maxHp,
      });
    } else {
      ctx.fillStyle = C.enemy; ctx.beginPath(); ctx.arc(e.x, e.y - 12, 9 * s, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawUnit(ctx, c, u, t, px, py, alpha) {
    const def = tierOf(u.tier);
    const scale = (1.18 + u.tier * 0.125) * (1 + (u.pop || 0) * 0.24);
    const role = ['melee', 'ranged', 'ranged', 'mage', 'mage', 'tank'][u.tier - 1] || 'melee';
    ctx.save();
    if (alpha != null) ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath(); ctx.ellipse(px, py + 34, 32, 8, 0, 0, Math.PI * 2); ctx.fill();
    if (u.tier >= 4) {
      const aura = ctx.createRadialGradient(px, py + 6, 4, px, py + 6, 54);
      aura.addColorStop(0, TIER_COLORS[u.tier - 1] + '55');
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(px, py + 6, 54, 0, Math.PI * 2); ctx.fill();
    }
    if (art) {
      art.char(ctx, px, py + 34, scale, {
        kind: 'hero', role, name: def.name, tier: u.tier, facing: 1,
        t: t + c.i * 0.7, moving: false,
      });
    } else {
      ctx.fillStyle = C.hero; ctx.beginPath(); ctx.arc(px, py, 14, 0, Math.PI * 2); ctx.fill();
    }
    // 等级角标
    const bx = px - 40, by = py - 40;
    ctx.beginPath(); ctx.arc(bx, by, 13, 0, Math.PI * 2); ctx.fillStyle = TIER_COLORS[u.tier - 1]; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.stroke();
    text(ctx, String(u.tier), bx, by + 1, { size: 15, weight: 900, color: C.ink, align: 'center' });
    ctx.restore();
  }

  function drawBoard(ctx, t) {
    roundRect(ctx, BOARD.x, BOARD.y, BOARD.w, BOARD.h, 22);
    ctx.fillStyle = C.ui; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.stroke();
    text(ctx, '合成台 · ' + (D.board.name || '棋盘'), BOARD.x + 24, BOARD.y + 20, { size: 16, weight: 700, color: 'rgba(255,255,255,.60)' });
    text(ctx, '最高 Lv.' + state.bestTier + '/' + MAXT, BOARD.x + BOARD.w - 24, BOARD.y + 20, { size: 16, weight: 800, color: C.gold, align: 'right' });

    for (const c of cells) {
      const u = c.unit;
      const isSel = state.sel === c.i;
      const isHover = state.drag && state.hover === c.i && state.hover !== state.drag.from;
      roundRect(ctx, c.x, c.y, CELL.w, CELL.h, 16);
      ctx.fillStyle = isSel ? 'rgba(255,207,92,.13)' : 'rgba(255,255,255,.045)';
      ctx.fill();
      ctx.lineWidth = isSel ? 3 : 2;
      ctx.strokeStyle = isSel ? C.accent : isHover ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.10)';
      ctx.stroke();

      if (!u) {
        ctx.save(); ctx.setLineDash([6, 6]); ctx.lineWidth = 1.5;
        roundRect(ctx, c.x + 10, c.y + 10, CELL.w - 20, CELL.h - 20, 12);
        ctx.strokeStyle = isHover ? 'rgba(255,207,92,.5)' : 'rgba(255,255,255,.10)'; ctx.stroke();
        ctx.setLineDash([]); ctx.strokeStyle = 'rgba(255,255,255,.13)'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cxp(c) - 10, cyp(c) + 2); ctx.lineTo(cxp(c) + 10, cyp(c) + 2);
        ctx.moveTo(cxp(c), cyp(c) - 8); ctx.lineTo(cxp(c), cyp(c) + 12);
        ctx.stroke(); ctx.restore();
      } else if (!(state.drag && state.drag.moved && state.drag.from === c.i)) drawUnit(ctx, c, u, t, cxp(c), cyp(c));
    }

    // 拖拽中的单位跟随手指（可合成目标高亮绿框）
    const d = state.drag;
    if (d && d.moved && cells[d.from] && cells[d.from].unit) {
      const ti = state.hover, src = cells[d.from];
      if (ti >= 0 && cells[ti].unit && cells[ti].unit.tier === src.unit.tier && ti !== d.from) {
        ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = C.ok;
        roundRect(ctx, cells[ti].x - 3, cells[ti].y - 3, CELL.w + 6, CELL.h + 6, 18); ctx.stroke(); ctx.restore();
      }
      drawUnit(ctx, src, src.unit, t, d.x, d.y - 8, 0.92);
    }
    // 选中单位：到可合成目标的虚线提示
    if (state.sel >= 0 && cells[state.sel] && cells[state.sel].unit) {
      const c = cells[state.sel], k = 0.5 + 0.5 * Math.sin(t * 6);
      ctx.save(); ctx.setLineDash([5, 6]); ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,207,92,' + (0.25 + k * 0.3) + ')';
      for (const o of cells) {
        if (o.i === c.i || !o.unit || o.unit.tier !== c.unit.tier || c.unit.tier >= MAXT) continue;
        ctx.beginPath(); ctx.moveTo(cxp(c), cyp(c) - 16); ctx.lineTo(cxp(o), cyp(o) - 16); ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawWorld(ctx, t) {
    ctx.save();
    const sh = fx.shakeAmt || 0;
    if (sh > 0.4) ctx.translate((view.next() - 0.5) * sh, (view.next() - 0.5) * sh);
    if (art) art.scene(ctx, W, H, t, { groundY: GROUND_Y });
    else { ctx.fillStyle = '#141428'; ctx.fillRect(0, 0, W, H); }
    drawRoad(ctx, t);
    drawGate(ctx, t);
    for (const e of enemies) drawEnemy(ctx, e, t);
    for (const s of shots) {
      if (art) art.projectile(ctx, s.x, s.y, { kind: s.kind, angle: s.angle, color: s.color, r: s.r });
      else { ctx.fillStyle = s.color; ctx.fillRect(s.x - 2, s.y - 2, 4, 4); }
    }
    drawBoard(ctx, t);
    ctx.restore();
  }

  /* ------------------------------ 绘制：HUD ------------------------------ */
  function pill(ctx, r, label, value, color) {
    roundRect(ctx, r.x, r.y, r.w, r.h, r.h / 2);
    ctx.fillStyle = 'rgba(8,12,22,.62)'; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.stroke(); text(ctx, label, r.x + 16, r.y + r.h / 2, { size: 15, weight: 700, color: 'rgba(255,255,255,.55)' });
    text(ctx, value, r.x + r.w - 16, r.y + r.h / 2 + 1, { size: 22, weight: 900, color, align: 'right' });
  }

  function drawHUD(ctx, t) {
    const waveNow = Math.min(level.waves.length, 1 + level.waves.filter((w) => state.time >= w.at).length);
    pill(ctx, HUD.gold, CUR, String(Math.floor(state.gold)), C.gold);
    pill(ctx, HUD.wave, '波次', waveNow + '/' + level.waves.length, '#ffffff');
    pill(ctx, HUD.kill, '击杀', String(state.kills), C.accent);

    // 基地耐久
    text(ctx, '基地', 16, HUD.hp.y + HUD.hp.h / 2, { size: 16, weight: 800, color: 'rgba(255,255,255,.62)' });
    const ratio = clamp(state.baseHp / state.baseHpMax, 0, 1);
    bar(ctx, HUD.hp.x, HUD.hp.y, HUD.hp.w, HUD.hp.h, ratio, {
      color: ratio > 0.5 ? C.ok : ratio > 0.25 ? C.accent : C.danger, stroke: 'rgba(0,0,0,.5)',
    });
    text(ctx, Math.ceil(state.baseHp) + '/' + state.baseHpMax, HUD.hp.x + HUD.hp.w + 8, HUD.hp.y + HUD.hp.h / 2, {
      size: 16, weight: 800, color: 'rgba(255,255,255,.75)',
    });

    // 召唤按钮
    const empties = cells.filter((c) => !c.unit).length;
    const canSummon = state.gold >= COST && empties > 0;
    const sg = ctx.createLinearGradient(0, BTN.summon.y, 0, BTN.summon.y + BTN.summon.h);
    if (canSummon) { sg.addColorStop(0, C.gold); sg.addColorStop(1, C.accent2); }
    else { sg.addColorStop(0, 'rgba(96,102,126,.55)'); sg.addColorStop(1, 'rgba(62,68,92,.55)'); }
    const B = BTN.summon;
    ctx.save();
    ctx.shadowColor = canSummon ? 'rgba(255,180,60,.45)' : 'transparent';
    ctx.shadowBlur = canSummon ? 18 : 0; ctx.shadowOffsetY = 4;
    roundRect(ctx, B.x, B.y, B.w, B.h, 20); ctx.fillStyle = sg; ctx.fill(); ctx.restore();
    roundRect(ctx, B.x, B.y, B.w, B.h, 20);
    ctx.lineWidth = 2; ctx.strokeStyle = canSummon ? 'rgba(255,255,255,.6)' : 'rgba(255,255,255,.16)'; ctx.stroke();
    ctx.save(); ctx.globalAlpha = canSummon ? 0.28 : 0.12; ctx.fillStyle = '#fff';
    roundRect(ctx, B.x + 10, B.y + 8, B.w - 20, B.h * 0.32, 12); ctx.fill(); ctx.restore();
    text(ctx, '召唤', B.x + 30, B.y + B.h / 2 + 2, { size: 34, weight: 900, color: canSummon ? '#3a2408' : 'rgba(255,255,255,.5)' });
    text(ctx, 'Lv.1 · ' + COST + ' ' + CUR + ' · 空格 ' + empties, B.x + B.w - 26, B.y + B.h / 2 + 2,
      { size: 16, weight: 800, color: canSummon ? 'rgba(58,36,8,.75)' : 'rgba(255,255,255,.35)', align: 'right' });

    // 出售按钮
    const selU = state.sel >= 0 ? cells[state.sel].unit : null;
    const sellOn = !!selU;
    roundRect(ctx, BTN.sell.x, BTN.sell.y, BTN.sell.w, BTN.sell.h, 20);
    ctx.fillStyle = sellOn ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.06)'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = sellOn ? C.accent : 'rgba(255,255,255,.14)'; ctx.stroke();
    text(ctx, '出售', BTN.sell.x + BTN.sell.w / 2, BTN.sell.y + 34, { size: 26, weight: 900, color: sellOn ? '#fff' : 'rgba(255,255,255,.4)', align: 'center' });
    text(ctx, sellOn ? 'Lv.' + selU.tier + ' · +' + sellValue(selU.tier) : '先选中单位', BTN.sell.x + BTN.sell.w / 2, BTN.sell.y + 66,
      { size: 16, weight: 700, color: sellOn ? C.gold : 'rgba(255,255,255,.3)', align: 'center' });

    // 底部提示
    text(ctx, '点两个同级合成 · 拖动换位 · 空格点召唤', W / 2, 1204, { size: 17, weight: 600, color: 'rgba(255,255,255,.40)', align: 'center' });
    if (state.sel >= 0 && cells[state.sel].unit) {
      const t2 = cells[state.sel].unit.tier;
      const nxt = t2 >= MAXT ? '已满级' : '再点一个 Lv.' + t2 + ' 合体 → Lv.' + (t2 + 1);
      text(ctx, nxt, W / 2, 1236, { size: 17, weight: 800, color: C.accent, align: 'center' });
    }
  }

  /* ------------------------------ 输入 ------------------------------ */
  function cellAt(x, y) {
    for (const c of cells) if (inRect(x, y, c)) return c.i;
    return -1;
  }

  function pointer(kind, x, y, key) {
    if (rule.status !== 'playing') return;
    if (kind === 'key') {
      if (key === ' ' || key === 'Enter') summon();
      if (key === 's' || key === 'S') sellSelected();
      return;
    }
    if (kind === 'down') {
      if (inRect(x, y, BTN.summon)) { summon(); return; }
      if (inRect(x, y, BTN.sell)) { sellSelected(); return; }
      const ci = cellAt(x, y);
      if (ci < 0) {
        if (state.sel >= 0) { state.sel = -1; audio.sfx('click'); }
        state.drag = null;
        return;
      }
      if (cells[ci].unit) {
        state.drag = { from: ci, sx: x, sy: y, x, y, moved: false };
      } else if (state.sel >= 0) {
        resolve(state.sel, ci); // 点空位 = 移过去
      }
      return;
    }
    if (kind === 'move') {
      const d = state.drag;
      if (!d) return;
      d.x = x; d.y = y;
      if (!d.moved && dist(x, y, d.sx, d.sy) > 12) d.moved = true;
      state.hover = cellAt(x, y);
      return;
    }
    if (kind !== 'up') return;
    const d = state.drag;
    if (!d) return;
    state.drag = null; state.hover = -1;
    const ti = cellAt(x, y);
    if (d.moved && ti >= 0 && ti !== d.from) { resolve(d.from, ti); return; }
    // 轻触
    if (state.sel === d.from) { state.sel = -1; audio.sfx('click'); return; }
    if (state.sel < 0) {
      state.sel = d.from;
      audio.sfx('pickup');
      fx.ring(cxp(cells[d.from]), cyp(cells[d.from]) - 16, C.accent, 18, { grow: 90, max: 0.26 });
      return;
    }
    resolve(state.sel, d.from);
  }

  /* ------------------------------ 机器人（无头仿真） ------------------------------ */
  let botT = 0;
  function bot(dt) {
    if (rule.status !== 'playing') return;
    botT += dt;
    if (botT < 0.15) return;
    botT = 0;
    // 1) 能合就合（合并总是正收益，且腾出格子）
    const byTier = {};
    for (const c of cells) if (c.unit) (byTier[c.unit.tier] = byTier[c.unit.tier] || []).push(c.i);
    for (let t = 1; t < MAXT; t++) {
      const g = byTier[t];
      if (g && g.length >= 2) { resolve(g[0], g[1]); return; }
    }
    // 2) 有空格就召唤
    const empties = cells.filter((c) => !c.unit).length;
    if (empties > 0) {
      if (state.gold >= COST) summon();
      return;
    }
    // 3) 满盘兜底：卖最低级
    const low = cells.filter((c) => c.unit).sort((a, b) => a.unit.tier - b.unit.tier)[0];
    if (low) { state.sel = low.i; sellSelected(); }
  }

  /* ------------------------------ 规则对象 ------------------------------ */
  const rule = {
    status: 'playing',
    ui: { summon: BTN.summon, sell: BTN.sell, cells: [] },
    init() {
      cells.length = 0;
      for (let r = 0; r < D.board.rows; r++) {
        for (let col = 0; col < D.board.cols; col++) {
          cells.push({
            i: r * D.board.cols + col, row: r, col,
            x: CELL.x0 + col * (CELL.w + CELL.gx), y: CELL.y0 + r * (CELL.h + CELL.gy),
            w: CELL.w, h: CELL.h, unit: null,
          });
        }
      }
      rule.ui = { summon: BTN.summon, sell: BTN.sell, cells: cells.map((c) => ({ i: c.i, x: c.x, y: c.y, w: c.w, h: c.h })) };
      state.sel = -1; state.drag = null; state.hover = -1;
    },
    update, drawWorld, drawHUD, pointer, bot,
    result() {
      return { stars: 0, score: state.kills * 12 + state.merges * 18, coins: 0, kills: state.kills, time: state.time };
    },
    debug() {
      let dps = 0;
      for (const c of cells) if (c.unit) dps += tierOf(c.unit.tier).atk / tierOf(c.unit.tier).cd;
      return {
        gold: Math.round(state.gold), baseHp: Math.ceil(state.baseHp), enemies: enemies.length,
        units: cells.filter((c) => c.unit).length, kills: state.kills, leaked: state.leaked,
        time: +state.time.toFixed(1), spawned: state.spawnIdx, schedule: schedule.length,
        merges: state.merges, summons: state.summons, bestTier: state.bestTier,
        dps: Math.round(dps), sel: state.sel, cells: cells.map((c) => (c.unit ? c.unit.tier : 0)),
        status: rule.status,
      };
    },
  };
  return rule;
}
