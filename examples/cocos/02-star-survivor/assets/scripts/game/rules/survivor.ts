// @ts-nocheck
/* =========================================================================
 * rules/survivor.js —— 尸潮幸存者（landscape 1280x720）
 * 拖动走位 / 自动开火 / 击杀爆宝石 / 升级三选一 / 限时生存 + Boss
 * 纯逻辑 update() + 纯绘制 drawWorld()/drawHUD()，可在 Node 里无头跑（tools/sim.mjs）
 * 约束：update/bot 内不碰 DOM、不用 Math.random；随机数一律走 svc.rng。
 * ========================================================================= */
import { clamp, lerp, RNG, TAU, fmtTime } from '../core';
import * as R from '../render';

const MOVE_KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
const PRIO = { atk: 100, rate: 96, multi: 86, hp: 70, range: 64, speed: 58, pierce: 50, magnet: 24 };

/* #rrggbb → rgba(...)（调色板里也可能是 rgba 字符串，那样原样返回） */
function tint(hex, a) {
  if (typeof hex !== 'string' || hex[0] !== '#') return hex;
  let h = hex.slice(1); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function createRule(svc) {
  const { content, level, W, H, audio, fx } = svc; const art = svc.art, D = content.defs, P = D.player;
  const ED = D.enemies || []; const EL = D.elite || { hpMul: 3, atkMul: 1.5, speedMul: 1.1, xp: 5, scaleMul: 1.3, suffix: '·精英' };
  const C = (art && art.C) || (content.theme && content.theme.palette) || {}; const rng = svc.rng;
  const vrng = new RNG('survivor:vis:' + level.id);   // 仅给绘制用，不污染玩法随机序列
  const COL = {
    gold: C.gold || '#ffd76a', accent: C.accent || '#ffcf5c', accent2: C.accent2 || '#ff7a59',
    hero: C.hero || '#8fd3ff', enemy: C.enemy || '#c85a6a', enemy2: C.enemy2 || '#6f2436',
    danger: C.danger || '#ff5d5d', ok: C.ok || '#62d68f', ink: C.ink || '#0d1024',
    ground: C.ground || '#3b2b3f', groundDark: C.groundDark || '#211827',
  };
  const AR = { x0: 30, x1: W - 30, y0: 108, y1: H - 26 }; const enemies = [], shots = [], gems = [];
  const player = { x: W / 2, y: H * 0.6, face: 1, moving: false, flash: 0, radius: P.radius };
  const keys = { up: false, down: false, left: false, right: false }; const ui = { cards: [], cardW: 296, cardH: 344 };
  const state = {
    time: 0, phase: 'play', hp: P.hp, maxHp: P.hp, speed: P.speed, atk: P.atk, rate: P.rate,
    range: P.range, projSpeed: P.projSpeed, magnet: P.magnet, shots: 1, pierce: 0,
    lvl: 1, xp: 0, xpNeed: 5, kills: 0, count: 0, inv: 0, atkCd: 0.2, volley: 0, dmgText: 0,
    cards: [], hover: -1, counts: {}, drag: null, ai: null, botNear: [],
    spawnAcc: 0, bossSpawned: false, boss: null, bossKilled: false, bossAddT: 0,
    speckles: [], rocks: [], drawList: [],
  };
  let keyBound = false, botCardT = 0, bgCache = null; const needFor = (l) => Math.round(P.xpBase + (l - 1) * P.xpGrow);
  const sfx = (n) => { try { audio.sfx(n); } catch (e) { /* 无音频环境 */ } };

  /* ------------------------------ 刷怪 ------------------------------ */
  function spawnPoint() {
    const side = rng.int(0, 3); if (side === 0) return { x: rng.range(AR.x0, AR.x1), y: -34 };
    if (side === 1) return { x: rng.range(AR.x0, AR.x1), y: H + 34 };
    if (side === 2) return { x: -40, y: rng.range(AR.y0, AR.y1) };
    return { x: W + 40, y: rng.range(AR.y0, AR.y1) };
  }
  function defOf(id) { for (const d of ED) if (d.id === id) return d; return ED[0]; }
  function spawnOne(forceType) {
    const types = (level.types && level.types.length) ? level.types : [ED[0].id];
    const def = defOf(forceType || types[rng.int(0, types.length - 1)]); const elite = rng.chance(clamp(level.elite || 0, 0, 0.6));
    const p = spawnPoint(); const prog = clamp(state.time / level.duration, 0, 1);
    const hpMul = lerp(level.hpMul || 1, level.hpEnd == null ? (level.hpMul || 1) : level.hpEnd, prog);
    const hp = def.hp * hpMul * (elite ? EL.hpMul : 1);
    enemies.push({
      id: def.id, name: def.name + (elite ? EL.suffix : ''), role: def.role || 'melee',
      x: p.x, y: p.y, hp, maxHp: hp,
      atk: def.atk * (level.atkMul || 1) * (elite ? EL.atkMul : 1),
      speed: def.speed * (level.speedMul || 1) * (elite ? EL.speedMul : 1),
      radius: def.radius * (elite ? EL.scaleMul : 1), scale: (def.scale || 1.2) * (elite ? 1.18 : 1),
      xpDrop: elite ? EL.xp : (def.xpDrop || def.xp || 1),
      orb: rng.range(-0.6, 0.6), face: -1, flash: 0, alive: true, elite: !!elite, boss: false,
      seed: vrng.int(0, 9999),
    });
    state.count++;
  }
  function spawnBoss() {
    const ang = rng.range(0, TAU);
    const p = {
      x: clamp(player.x + Math.cos(ang) * 400, AR.x0 + 70, AR.x1 - 70),
      y: clamp(player.y + Math.sin(ang) * 400, AR.y0 + 60, AR.y1 - 50),
    };
    const b = {
      id: 'boss', name: level.bossName || 'Boss', role: 'melee',
      x: p.x, y: p.y, hp: level.bossHp, maxHp: level.bossHp,
      atk: level.bossAtk, speed: level.bossSpeed, radius: 34, scale: 3.1,
      xpDrop: 30, orb: 0, face: -1, flash: 0, alive: true, elite: false, boss: true, seed: 1,
    };
    enemies.push(b); state.boss = b; state.bossSpawned = true; state.bossAddT = 4.5;
    fx.flash(0.35); fx.shake(11); sfx('explode'); fx.ring(b.x, b.y - 30, COL.danger, 30, { grow: 420, max: 0.7 });
  }

  /* ------------------------------ 战斗 ------------------------------ */
  function hurtEnemy(e, dmg, crit) {
    if (!e.alive) return;
    e.hp -= dmg; e.flash = 0.1;
    if (e.boss) { e.dmgAcc = (e.dmgAcc || 0) + dmg; if (e.dmgT == null) e.dmgT = 0.4; }   // Boss 伤害合批，避免飘字叠成一片
    else if (crit) fx.text(e.x, e.y - 46, Math.round(dmg) + '!', COL.gold, 21, { max: 0.7 });
    else if (e.elite) fx.text(e.x, e.y - 42, String(Math.round(dmg)), '#fff', 14, { max: 0.5 });
    if (e.hp <= 0) killEnemy(e);
  }
  function dropGem(x, y, val, kind) {
    const gx = clamp(x, AR.x0 + 20, AR.x1 - 20), gy = clamp(y - 12, AR.y0 + 20, AR.y1 - 16);
    gems.push({ x: gx, y: gy, vx: rng.range(-80, 80), vy: rng.range(-110, -40), val, kind: kind || 'xp', life: 0, t: vrng.range(0, 6), big: val >= 5 });
  }
  function killEnemy(e) {
    if (!e.alive) return;
    e.alive = false; state.kills++;
    dropGem(e.x, e.y, e.boss ? 30 : (e.xpDrop || 1));
    fx.burst(e.x, e.y - 20, e.boss ? 46 : (e.elite ? 20 : 9), {
      color: e.boss ? COL.accent2 : (e.elite ? COL.gold : COL.enemy), up: e.boss ? 160 : 50,
      speed: e.boss ? 330 : 170, life: e.boss ? 0.9 : 0.5,
    });
    if (e.elite && rng.chance(0.32)) dropGem(e.x, e.y, 18, 'heal');
    if (e.boss) {
      state.boss = null; state.bossKilled = true; fx.flash(0.6); fx.shake(16); sfx('explode');
      winLevel('boss');
    } else if (state.kills % 6 === 0) sfx('coin');
  }
  function hitPlayer(dmg) {
    if (state.inv > 0 || rule.status !== 'playing') return;
    state.hp -= dmg; state.inv = 0.55; player.flash = 0.22; fx.shake(7); fx.flash(0.16); sfx('punch');
    fx.text(player.x, player.y - 66, '-' + Math.round(dmg), COL.danger, 24, { max: 0.8 });
    fx.burst(player.x, player.y - 22, 10, { color: COL.danger, speed: 170, up: 50 });
    for (const e of enemies) {   // 把贴身的怪推开一点，避免瞬间连续挨打
      if (!e.alive || e.boss) continue; const dx = e.x - player.x, dy = e.y - player.y, d = Math.hypot(dx, dy) || 1;
      if (d < e.radius + P.radius + 20) { e.x += (dx / d) * 30; e.y += (dy / d) * 30; }
    }
  }
  function shoot() {
    const n = Math.min(state.shots, 8), cand = [], r2 = state.range * state.range;
    for (const e of enemies) {
      if (!e.alive) continue;
      if (e.x < AR.x0 || e.x > AR.x1 || e.y < AR.y0 - 4 || e.y > AR.y1) continue;   // 只打场内的
      const d2 = (e.x - player.x) * (e.x - player.x) + (e.y - player.y) * (e.y - player.y); if (d2 <= r2) cand.push({ e, d2 });
    }
    if (!cand.length) return false;
    cand.sort((a, b) => a.d2 - b.d2);
    for (let i = 0; i < n && i < cand.length; i++) {
      const crit = rng.chance(0.09);
      shots.push({
        x: player.x + player.face * 7, y: player.y - 22, px: player.x, py: player.y - 22,
        target: cand[i].e, dmg: state.atk * (crit ? 2 : 1), crit, pierce: state.pierce,
        speed: state.projSpeed, a: 0,
      });
    }
    state.volley++; if (state.volley % 3 === 1) sfx('arrow');
    fx.ring(player.x + player.face * 8, player.y - 22, tint(COL.accent, 0.55), 6, { grow: 90, max: 0.22 });
    return true;
  }

  /* ------------------------------ 升级三选一 ------------------------------ */
  function rollCards() {
    const pool = D.upgrades.filter((u) => (state.counts[u.id] || 0) < u.max); if (!pool.length) return [];
    const picked = rng.shuffle(pool.slice()).slice(0, Math.min(3, pool.length));
    const isDps = (u) => u.id === 'atk' || u.id === 'rate' || u.id === 'multi';
    if (!picked.some(isDps)) {   // 保底：至少一张输出卡，避免三张辅助卡卡死节奏
      const dps = pool.filter(isDps); if (dps.length) picked[picked.length - 1] = dps[rng.int(0, dps.length - 1)];
    }
    return picked.map((u) => ({
      id: u.id, name: u.name, short: u.short, desc: u.desc, icon: u.icon, max: u.max,
      stack: state.counts[u.id] || 0,
    }));
  }
  function levelUp() {
    state.xp = Math.max(0, state.xp - state.xpNeed); state.lvl++;
    state.xpNeed = needFor(state.lvl); const cards = rollCards();
    if (!cards.length) { state.hp = Math.min(state.maxHp, state.hp + 20); return; }
    state.cards = cards; state.hover = -1; state.phase = 'upgrade'; sfx('pickup'); fx.flash(0.14);
  }
  function applyCard(i) {
    if (rule.status !== 'playing' || state.phase !== 'upgrade') return false;
    const c = state.cards[i]; if (!c) return false;
    switch (c.id) {
      case 'atk': state.atk *= 1.22; break;
      case 'rate': state.rate = Math.max(0.1, state.rate * 0.84); break;
      case 'range': state.range *= 1.14; break;
      case 'hp': state.maxHp += 25; state.hp = Math.min(state.maxHp, state.hp + 25); break;
      case 'speed': state.speed *= 1.1; break;
      case 'multi': state.shots += 1; break;
      case 'pierce': state.pierce += 1; break;
      case 'magnet': state.magnet += 45; break;
      default: break;
    }
    state.counts[c.id] = (state.counts[c.id] || 0) + 1; state.phase = 'play'; state.cards = []; state.hover = -1;
    state.atkCd = Math.min(state.atkCd, 0.1); sfx('upgrade'); fx.flash(0.2);
    fx.ring(player.x, player.y - 20, COL.gold, 18, { grow: 340, max: 0.55 });
    fx.burst(player.x, player.y - 24, 18, { color: COL.gold, up: 130, speed: 230 });
    fx.text(player.x, player.y - 90, c.short + ' ↑', COL.gold, 22, { max: 1 });
    return true;
  }

  /* ------------------------------ 更新 ------------------------------ */
  function inputDir() {
    if (state.ai) return state.ai;
    if (state.drag) {
      const dx = state.drag.x - state.drag.ax, dy = state.drag.y - state.drag.ay, d = Math.hypot(dx, dy);
      if (d < 7) return { x: 0, y: 0 };
      const mag = Math.min(1, d / 74);
      return { x: (dx / d) * mag, y: (dy / d) * mag };
    }
    return { x: (keys.right ? 1 : 0) - (keys.left ? 1 : 0), y: (keys.down ? 1 : 0) - (keys.up ? 1 : 0) };
  }
  function update(dt) {
    if (rule.status !== 'playing' || state.phase === 'upgrade') return;
    state.time += dt;
    /* 移动 */
    const dir = inputDir(); let ax = dir.x, ay = dir.y;
    const l = Math.hypot(ax, ay);
    if (l > 1) { ax /= l; ay /= l; }
    player.moving = l > 0.07; if (Math.abs(ax) > 0.06) player.face = ax > 0 ? 1 : -1;
    if (l > 0.04) {
      player.x = clamp(player.x + ax * state.speed * dt, AR.x0 + 24, AR.x1 - 24);
      player.y = clamp(player.y + ay * state.speed * dt, AR.y0 + 22, AR.y1 - 18);
    }
    player.flash = Math.max(0, player.flash - dt); if (state.inv > 0) state.inv = Math.max(0, state.inv - dt);
    state.dmgText = 0;
    /* 刷怪：随关卡进度加速，血量同步成长 */
    const prog = clamp(state.time / level.duration, 0, 1); const rateNow = lerp(level.rate, level.rateEnd, prog);
    if (enemies.length < level.cap) {
      state.spawnAcc += rateNow * dt; let guard = 0;
      while (state.spawnAcc >= 1 && enemies.length < level.cap && guard++ < 5) { state.spawnAcc -= 1; spawnOne(); }
    } else state.spawnAcc = 0;
    if (!state.bossSpawned && state.time >= level.bossAt) spawnBoss();
    if (state.bossSpawned && state.boss && state.boss.alive) {
      state.bossAddT -= dt;
      if (state.bossAddT <= 0) { state.bossAddT = 5.4; spawnOne('grunt'); spawnOne('runner'); }
    }
    /* 自动攻击最近的 N 个敌人 */
    state.atkCd -= dt; if (state.atkCd <= 0) state.atkCd = shoot() ? state.rate : 0.14;
    /* 弹道 */
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i]; s.px = s.x; s.py = s.y;
      const live = s.target && s.target.alive; const tx = live ? s.target.x : s.x + Math.cos(s.a) * 240;
      const ty = live ? s.target.y - 14 : s.y + Math.sin(s.a) * 240; const dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy) || 1;
      s.a = Math.atan2(dy, dx); const step = s.speed * dt;
      s.x += (dx / d) * step; s.y += (dy / d) * step;
      if (s.x < AR.x0 - 90 || s.x > AR.x1 + 90 || s.y < AR.y0 - 90 || s.y > AR.y1 + 90) { shots.splice(i, 1); continue; }
      let hit = null;
      for (const e of enemies) {
        if (!e.alive) continue; const rr = e.radius + 8, ddx = e.x - s.x, ddy = e.y - 14 - s.y;
        if (ddx * ddx + ddy * ddy <= rr * rr) { hit = e; break; }
      }
      if (hit) {
        hurtEnemy(hit, s.dmg, s.crit); fx.burst(s.x, s.y, 3, { color: COL.accent, speed: 130, life: 0.22, size: 2.4 });
        if (s.pierce > 0) s.pierce--; else shots.splice(i, 1);
      }
    }
    if (rule.status !== 'playing') return;
    /* 敌人追击（带绕行，避免完全重叠）+ 分离 + 接触伤害 */
    enemies.sort((a, b) => a.x - b.x);
    for (const e of enemies) {
      if (!e.alive) continue;
      e.flash = Math.max(0, e.flash - dt);
      if (e.boss && e.dmgAcc) {
        e.dmgT -= dt;
        if (e.dmgT <= 0) { fx.text(e.x, e.y - 72, String(Math.round(e.dmgAcc)), COL.gold, 26, { max: 0.6 }); e.dmgAcc = 0; e.dmgT = 0.4; }
      }
      const dx = player.x - e.x, dy = player.y - e.y, d = Math.hypot(dx, dy) || 1;
      const ang = Math.atan2(dy, dx) + e.orb * clamp(1 - d / 280, 0, 1); e.x += Math.cos(ang) * e.speed * dt;
      e.y += Math.sin(ang) * e.speed * dt; e.face = dx > 0 ? 1 : -1;
    }
    for (let i = 0; i < enemies.length; i++) {
      const a = enemies[i];
      for (let j = i + 1; j < enemies.length; j++) {
        const b = enemies[j], dxb = b.x - a.x; if (dxb > 48) break;
        const dyb = b.y - a.y; if (dyb > 48 || dyb < -48) continue;
        const rr = a.radius + b.radius, d2 = dxb * dxb + dyb * dyb; if (d2 >= rr * rr || d2 < 1e-4) continue;
        const d = Math.sqrt(d2), push = (rr - d) * 0.5, nx = dxb / d, ny = dyb / d;
        if (!a.boss) { a.x -= nx * push; a.y -= ny * push; }
        if (!b.boss) { b.x += nx * push; b.y += ny * push; }
      }
    }
    let contact = 0;
    for (const e of enemies) {
      if (!e.alive) continue; const rr = e.radius + P.radius, dx = player.x - e.x, dy = player.y - e.y;
      if (dx * dx + dy * dy <= rr * rr) contact = Math.max(contact, e.atk);
    }
    if (contact > 0) hitPlayer(contact);
    /* 宝石拾取 */
    if (gems.length > 260) gems.splice(0, gems.length - 260);
    for (let i = gems.length - 1; i >= 0; i--) {
      const g = gems[i]; g.life += dt;
      if (g.x < AR.x0 + 8) g.x = AR.x0 + 8; else if (g.x > AR.x1 - 8) g.x = AR.x1 - 8;
      if (g.y < AR.y0 + 8) g.y = AR.y0 + 8; else if (g.y > AR.y1 - 8) g.y = AR.y1 - 8;
      const dx = player.x - g.x, dy = player.y - 14 - g.y, d2 = dx * dx + dy * dy;
      if (d2 < state.magnet * state.magnet) {
        const d = Math.sqrt(d2) || 1, sp = Math.min(880, 300 + (state.magnet - d) * 3.4);
        g.x += (dx / d) * sp * dt; g.y += (dy / d) * sp * dt;
      } else { g.x += g.vx * dt; g.y += g.vy * dt; g.vx *= 0.9; g.vy *= 0.9; }
      if (d2 < 900 || g.life > 34) {
        if (g.kind === 'heal') { state.hp = Math.min(state.maxHp, state.hp + 18); fx.text(player.x, player.y - 70, '+18', COL.ok, 20, { max: 0.8 }); sfx('pickup'); }
        else state.xp += g.val; gems.splice(i, 1);
      }
    }
    /* 清尸 / 升级 / 胜负 */
    for (let i = enemies.length - 1; i >= 0; i--) if (!enemies[i].alive) enemies.splice(i, 1); if (rule.status !== 'playing') return;
    let lvGuard = 0;
    while (state.xp >= state.xpNeed && lvGuard++ < 6) {
      levelUp(); if (state.phase === 'upgrade') break;
    }
    if (state.hp <= 0) {
      state.hp = 0; rule.status = 'lost'; sfx('lose');
      svc.finish({ stars: 0, score: state.kills * 8 + Math.round(state.time * 2), coins: 0, kills: state.kills, time: state.time });
      return;
    }
    if (state.phase !== 'upgrade' && state.time >= level.duration) winLevel('time');
  }
  function winLevel(reason) {
    if (rule.status !== 'playing') return;
    rule.status = 'won'; const hpK = clamp(state.hp / state.maxHp, 0, 1);
    let stars = 1; if (hpK >= 0.45) stars = 2;
    if (hpK >= 0.78) stars = 3;
    if (reason === 'boss' && state.time < level.duration * 0.92 && stars < 2) stars = 2;  // 提前击杀 Boss=用时更短
    const score = state.kills * 9 + (state.bossKilled ? 600 : 0) + Math.round(hpK * 320) + Math.round(Math.max(0, level.duration - state.time) * 5);
    sfx('win'); svc.finish({ stars, score, coins: 22 + level.id * 6, kills: state.kills, time: state.time });
  }

  /* ------------------------------ 绘制 ------------------------------ */
  function paintStatic(c) {
    if (art && art.sky) art.sky(c, W, H, 0);
    else { c.fillStyle = COL.ink; c.fillRect(0, 0, W, H); }
    c.fillStyle = tint(COL.groundDark, 0.9); c.fillRect(0, 0, W, H);
    const g = c.createRadialGradient(W / 2, H * 0.5, 80, W / 2, H * 0.5, 820);
    g.addColorStop(0, tint(COL.ground, 0.95)); g.addColorStop(0.5, tint(COL.ground, 0.5)); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, W, H); c.save(); c.strokeStyle = 'rgba(255,255,255,.045)'; c.lineWidth = 1;
    for (let x = AR.x0 + 40; x < AR.x1; x += 112) { c.beginPath(); c.moveTo(x, AR.y0); c.lineTo(x, AR.y1); c.stroke(); }
    for (let y = AR.y0 + 40; y < AR.y1; y += 112) { c.beginPath(); c.moveTo(AR.x0, y); c.lineTo(AR.x1, y); c.stroke(); }
    c.restore();
    for (const sp of state.speckles) { c.fillStyle = sp.c; c.globalAlpha = sp.a; c.fillRect(sp.x, sp.y, sp.w, sp.w * 0.8); }
    c.globalAlpha = 1;
    for (const r of state.rocks) {
      c.save(); c.globalAlpha = 0.3; c.fillStyle = tint(COL.groundDark, 0.95);
      c.beginPath(); c.ellipse(r.x, r.y, r.w, r.w * 0.6, r.rot, 0, TAU); c.fill(); c.globalAlpha = 0.07; c.fillStyle = '#fff';
      c.beginPath(); c.ellipse(r.x - r.w * 0.22, r.y - r.w * 0.18, r.w * 0.42, r.w * 0.2, r.rot, 0, TAU); c.fill(); c.restore();
    }
    c.save(); c.strokeStyle = tint(COL.accent, 0.36); c.lineWidth = 3;
    R.roundRect(c, AR.x0, AR.y0, AR.x1 - AR.x0, AR.y1 - AR.y0, 26); c.stroke();
    c.strokeStyle = tint(COL.accent, 0.12); c.lineWidth = 8;
    R.roundRect(c, AR.x0 - 3, AR.y0 - 3, AR.x1 - AR.x0 + 6, AR.y1 - AR.y0 + 6, 28); c.stroke(); c.restore();
    R.vignette(c, W, H, 0.5);
  }
  function ensureBg(ctx) {
    if (bgCache || typeof document === 'undefined') return bgCache;
    if (typeof ctx.drawImage !== 'function') return null; // Cocos 宿主：直接重绘，避免依赖 drawImage
    const dpr = Math.min(2, (ctx.getTransform && ctx.getTransform().a) || 1); const c = document.createElement('canvas');
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0); paintStatic(g);
    bgCache = c;
    return c;
  }
  function drawArena(ctx) {
    const bg = ensureBg(ctx); if (bg) ctx.drawImage(bg, 0, 0, W, H); else paintStatic(ctx);
    const g = ctx.createRadialGradient(player.x, player.y - 24, 12, player.x, player.y - 24, 260);
    g.addColorStop(0, 'rgba(255,240,200,.10)'); g.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = g; ctx.fillRect(player.x - 260, player.y - 284, 520, 520);
  }
  function drawGem(ctx, g, t) {
    const heal = g.kind === 'heal', r = heal ? 9 : (g.big ? 8 : 5.5);
    if (art) art.pickup(ctx, g.x, g.y, { shape: heal ? 'star' : 'gem', color: heal ? COL.ok : COL.gold, r, t: t + g.t });
    else { ctx.fillStyle = heal ? COL.ok : COL.gold; ctx.beginPath(); ctx.arc(g.x, g.y, r, 0, TAU); ctx.fill(); }
  }
  /* art.char 在 facing=-1 时会把影子横向拉 5 倍（1/max(.2,facing)），
   * 所以统一传 facing:1，自己用水平翻转表达朝向。 */
  function drawChar(ctx, x, y, s, face, opts) {
    if (!art) return false;
    opts.facing = 1;
    if (face < 0) { ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1); art.char(ctx, 0, 0, s, opts); ctx.restore(); }
    else art.char(ctx, x, y, s, opts);
    return true;
  }
  function drawEnemy(ctx, e, t) {
    const s = e.scale, many = enemies.length > 56; const far = Math.abs(e.x - player.x) + Math.abs(e.y - player.y) > 470;
    const fade = e.y < AR.y0 + 90 ? clamp((e.y - (AR.y0 - 60)) / 110, 0.15, 1) : 1;
    if (e.elite) {
      ctx.save(); ctx.strokeStyle = tint(COL.gold, 0.55 + Math.sin(t * 5 + e.seed) * 0.2); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(e.x, e.y + 2, e.radius + 6, (e.radius + 6) * 0.42, 0, 0, TAU); ctx.stroke(); ctx.restore();
    }
    if (e.boss) {
      ctx.save(); ctx.strokeStyle = tint(COL.danger, 0.5 + Math.sin(t * 4) * 0.2); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(e.x, e.y + 3, e.radius + 10, (e.radius + 10) * 0.4, 0, 0, TAU); ctx.stroke(); ctx.restore();
    }
    ctx.save(); if (fade < 1) ctx.globalAlpha = fade;
    if (many && far && !e.boss && !e.elite) {   // 远处小兵的廉价画法
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(e.x, e.y + 2, 12 * s, 4 * s, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = COL.enemy; R.roundRect(ctx, e.x - 8 * s, e.y - 30 * s, 16 * s, 28 * s, 6 * s); ctx.fill();
      ctx.fillStyle = COL.enemy2; ctx.beginPath(); ctx.arc(e.x, e.y - 36 * s, 8 * s, 0, TAU); ctx.fill();
      ctx.restore();
      return;
    }
    if (e.id === 'runner') {   // 疾行者：速度残影
      ctx.strokeStyle = tint(COL.enemy, 0.35); ctx.lineWidth = 2;
      for (let k = 0; k < 2; k++) {
        const off = (k + 1) * 16;
        ctx.beginPath(); ctx.moveTo(e.x - e.face * off, e.y - 36 - k * 8); ctx.lineTo(e.x - e.face * (off + 14), e.y - 36 - k * 8); ctx.stroke();
      }
    } else if (e.id === 'brute' && !e.boss) {   // 铁尸：重甲脚环
      ctx.strokeStyle = tint(COL.enemy2, 0.85); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(e.x, e.y + 2, e.radius + 5, (e.radius + 5) * 0.36, 0, 0, TAU); ctx.stroke();
    }
    const drew = drawChar(ctx, e.x, e.y, s, e.face, {
      kind: e.boss ? 'boss' : 'enemy', role: e.role, name: e.name,
      tier: e.boss ? 3 : (e.elite ? 2 : 1), t: t + e.seed * 0.01,
      flash: e.flash > 0 && !e.boss, moving: true,
      hp: (e.boss || e.elite) ? clamp(e.hp / e.maxHp, 0, 1) : null,
    });
    if (!drew) { ctx.fillStyle = e.boss ? COL.accent2 : COL.enemy; ctx.beginPath(); ctx.arc(e.x, e.y - 16, e.radius, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  function drawPlayer(ctx, t) {
    ctx.save(); ctx.strokeStyle = tint(COL.accent, 0.07); ctx.lineWidth = 2; ctx.setLineDash([6, 10]);
    ctx.beginPath(); ctx.arc(player.x, player.y - 10, state.magnet, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    if (state.inv > 0 && Math.floor(state.inv * 24) % 2 === 0) ctx.globalAlpha = 0.42;
    const drew = drawChar(ctx, player.x, player.y, 1.72, player.face, {
      kind: 'hero', role: 'mage', name: 'hero', tier: 2, t,
      flash: player.flash > 0, moving: player.moving, hp: clamp(state.hp / state.maxHp, 0, 1),
    });
    if (!drew) { ctx.fillStyle = COL.hero; ctx.beginPath(); ctx.arc(player.x, player.y - 20, 18, 0, TAU); ctx.fill(); }
    ctx.restore();
    if (state.inv > 0) {
      ctx.save(); ctx.strokeStyle = tint(COL.hero, 0.45 * (state.inv / 0.55)); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(player.x, player.y - 22, 30 + (0.55 - state.inv) * 40, 0, TAU); ctx.stroke(); ctx.restore();
    }
  }
  function drawShots(ctx) {
    ctx.save();
    for (const s of shots) {
      const a = Math.atan2(s.y - s.py, s.x - s.px); ctx.strokeStyle = tint(COL.accent, 0.5); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(s.x - Math.cos(a) * 26, s.y - Math.sin(a) * 26); ctx.lineTo(s.x, s.y); ctx.stroke();
      if (art) art.projectile(ctx, s.x, s.y, { kind: 'orb', color: s.crit ? COL.gold : COL.accent, r: s.crit ? 5 : 4 });
      else { ctx.fillStyle = COL.accent; ctx.beginPath(); ctx.arc(s.x, s.y, 4, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
  }
  function drawWorld(ctx, t) {
    const shake = fx.shakeAmt || 0; ctx.save();
    if (shake > 0.4) ctx.translate((vrng.next() - 0.5) * shake, (vrng.next() - 0.5) * shake); drawArena(ctx);
    for (const g of gems) drawGem(ctx, g, t); const list = state.drawList; list.length = 0;
    for (const e of enemies) list.push(e); list.push(player);
    list.sort((a, b) => a.y - b.y);
    for (const o of list) { if (o === player) drawPlayer(ctx, t); else drawEnemy(ctx, o, t); }
    drawShots(ctx); ctx.restore();
  }

  /* ---------------- HUD ---------------- */
  function iconCard(ctx, kind, x, y, s, color) {
    ctx.save(); ctx.translate(x, y); ctx.strokeStyle = color; ctx.fillStyle = color;
    ctx.lineWidth = Math.max(2, s * 0.11); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; const h = s / 2;
    if (kind === 'sword') {
      ctx.beginPath(); ctx.moveTo(-h * 0.6, h * 0.6); ctx.lineTo(h * 0.6, -h * 0.6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-h * 0.75, h * 0.15); ctx.lineTo(-h * 0.15, h * 0.75); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(h * 0.35, -h * 0.85); ctx.lineTo(h * 0.9, -h * 0.35); ctx.stroke();
    } else if (kind === 'bolt') {
      ctx.beginPath(); ctx.moveTo(h * 0.15, -h * 0.85); ctx.lineTo(-h * 0.5, h * 0.08); ctx.lineTo(0, h * 0.08);
      ctx.lineTo(-h * 0.15, h * 0.85); ctx.lineTo(h * 0.55, -h * 0.08); ctx.lineTo(0, -h * 0.08); ctx.closePath(); ctx.fill();
    } else if (kind === 'ring') {
      ctx.beginPath(); ctx.arc(0, 0, h * 0.7, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, h * 0.26, 0, TAU); ctx.fill();
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * h * 0.7, Math.sin(a) * h * 0.7); ctx.lineTo(Math.cos(a) * h * 0.95, Math.sin(a) * h * 0.95); ctx.stroke(); }
    } else if (kind === 'heart') {
      ctx.beginPath(); ctx.moveTo(0, h * 0.75); ctx.bezierCurveTo(-h * 1.2, -h * 0.1, -h * 0.45, -h * 0.95, 0, -h * 0.32);
      ctx.bezierCurveTo(h * 0.45, -h * 0.95, h * 1.2, -h * 0.1, 0, h * 0.75); ctx.fill();
    } else if (kind === 'wing') {   // 移速：双箭头 + 风线
      for (const off of [-h * 0.5, h * 0.2]) {
        ctx.beginPath();
        ctx.moveTo(off - h * 0.15, -h * 0.62); ctx.lineTo(off + h * 0.5, 0); ctx.lineTo(off - h * 0.15, h * 0.62); ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(-h * 0.95, -h * 0.45); ctx.lineTo(-h * 0.95, h * 0.45); ctx.stroke();
    } else if (kind === 'split') {
      for (const a of [-0.6, 0, 0.6]) {
        ctx.beginPath(); ctx.moveTo(-h * 0.8, h * 0.5); ctx.lineTo(Math.cos(a) * h * 0.95, -h * 0.75 + Math.sin(a) * h * 0.4); ctx.stroke();
        ctx.beginPath(); ctx.arc(Math.cos(a) * h * 0.95, -h * 0.75 + Math.sin(a) * h * 0.4, h * 0.14, 0, TAU); ctx.fill();
      }
      ctx.beginPath(); ctx.arc(-h * 0.8, h * 0.5, h * 0.17, 0, TAU); ctx.fill();
    } else if (kind === 'pierce') {
      ctx.beginPath(); ctx.moveTo(-h * 0.9, 0); ctx.lineTo(h * 0.85, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(h * 0.55, -h * 0.25); ctx.lineTo(h * 0.9, 0); ctx.lineTo(h * 0.55, h * 0.25); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, h * 0.42, 0, TAU); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(0, h * 0.1, h * 0.62, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-h * 0.6, h * 0.1); ctx.lineTo(-h * 0.6, h * 0.72); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(h * 0.6, h * 0.1); ctx.lineTo(h * 0.6, h * 0.72); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-h * 0.6, h * 0.72); ctx.lineTo(-h * 0.35, h * 0.72); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(h * 0.6, h * 0.72); ctx.lineTo(h * 0.35, h * 0.72); ctx.stroke();
    }
    ctx.restore();
  }
  function drawHUD(ctx, t) {
    // 顶部渐隐：怪从上方走进来时不和 HUD 面板打架
    const fg = ctx.createLinearGradient(0, 0, 0, AR.y0 + 16);
    fg.addColorStop(0, 'rgba(5,7,14,.86)'); fg.addColorStop(0.72, 'rgba(5,7,14,.5)'); fg.addColorStop(1, 'rgba(5,7,14,0)');
    ctx.fillStyle = fg; ctx.fillRect(0, 0, W, AR.y0 + 16);
    /* 左上：生命 + 经验 */
    R.panel(ctx, 16, 12, 352, 92, { r: 18, fill: 'rgba(8,10,20,.74)', stroke: 'rgba(255,255,255,.14)', shadow: false });
    iconCard(ctx, 'heart', 44, 40, 20, COL.danger);
    R.bar(ctx, 64, 30, 262, 18, clamp(state.hp / state.maxHp, 0, 1), { c1: '#ff5d5d', c2: '#ffb36a', stroke: 'rgba(0,0,0,.35)' });
    R.text(ctx, Math.ceil(state.hp) + ' / ' + Math.round(state.maxHp), 352, 39, { size: 14, align: 'right', color: '#fff', weight: 800 });
    R.text(ctx, 'Lv.' + state.lvl, 32, 76, { size: 20, color: COL.gold, weight: 900 });
    R.bar(ctx, 96, 66, 230, 12, clamp(state.xp / state.xpNeed, 0, 1), { c1: COL.hero, c2: COL.accent });
    R.text(ctx, Math.floor(state.xp) + ' / ' + state.xpNeed, 352, 76, { size: 13, align: 'right', color: 'rgba(255,255,255,.6)', weight: 700 });
    /* 顶部计时 */
    const left = Math.max(0, level.duration - state.time);
    R.panel(ctx, W / 2 - 90, 10, 180, 54, { r: 16, fill: 'rgba(8,10,20,.78)', stroke: left < 10 ? tint(COL.danger, 0.7) : 'rgba(255,255,255,.14)', shadow: false });
    R.text(ctx, fmtTime(left), W / 2, 38, { size: 30, align: 'center', color: left < 10 ? '#ff9b9b' : '#fff', weight: 900 });
    R.text(ctx, '活到最后', W / 2, 88, { size: 13, align: 'center', color: 'rgba(255,255,255,.5)', weight: 700 });
    /* 右上：击杀 */
    R.panel(ctx, W - 196, 82, 180, 42, { r: 14, fill: 'rgba(8,10,20,.66)', stroke: 'rgba(255,255,255,.12)', shadow: false });
    R.text(ctx, '击杀 ' + state.kills, W - 28, 103, { size: 17, align: 'right', color: '#fff', weight: 800 });
    /* Boss 血条 / 预警（升级面板打开时不画，避免和标题文字打架） */
    if (state.phase === 'upgrade') { /* 暂停中，交给升级面板 */ }
    else if (state.boss && state.boss.alive) {
      const b = state.boss, bw = 520, bx = W / 2 - bw / 2;
      R.panel(ctx, bx - 18, 132, bw + 36, 58, { r: 14, fill: 'rgba(20,8,14,.86)', stroke: tint(COL.danger, 0.55), shadow: false });
      R.text(ctx, b.name, bx, 150, { size: 16, color: '#ffd9d9', weight: 800 });
      R.text(ctx, Math.ceil(b.hp) + ' / ' + Math.round(b.maxHp), bx + bw, 150, { size: 14, align: 'right', color: 'rgba(255,255,255,.7)', weight: 700 });
      R.bar(ctx, bx, 163, bw, 12, clamp(b.hp / b.maxHp, 0, 1), { c1: '#ff3b52', c2: '#ffb36a' });
    } else if (!state.bossSpawned && state.time > level.bossAt - 3) {
      ctx.save(); ctx.globalAlpha = 0.55 + (0.5 + 0.5 * Math.sin(t * 8)) * 0.45;
      R.text(ctx, '⚠ Boss 来袭 ⚠', W / 2, 168, { size: 30, align: 'center', color: '#ff8a8a', stroke: 'rgba(0,0,0,.7)', weight: 900 });
      ctx.restore();
    }
    /* 虚拟摇杆 / 开局提示 */
    if (state.drag) {
      const dx = state.drag.x - state.drag.ax, dy = state.drag.y - state.drag.ay, d = Math.hypot(dx, dy);
      const kx = d > 1 ? state.drag.ax + (dx / d) * Math.min(d, 54) : state.drag.ax;
      const ky = d > 1 ? state.drag.ay + (dy / d) * Math.min(d, 54) : state.drag.ay; ctx.save();
      ctx.globalAlpha = 0.35; ctx.fillStyle = 'rgba(10,14,26,.6)';
      ctx.beginPath(); ctx.arc(state.drag.ax, state.drag.ay, 54, 0, TAU); ctx.fill();
      ctx.strokeStyle = tint(COL.accent, 0.8); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(state.drag.ax, state.drag.ay, 54, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 0.75; ctx.fillStyle = tint(COL.accent, 0.9); ctx.beginPath(); ctx.arc(kx, ky, 20, 0, TAU); ctx.fill();
      ctx.restore();
    } else if (state.time < 7 && state.phase === 'play') {
      ctx.save(); ctx.globalAlpha = clamp(1 - state.time / 7, 0, 1) * 0.85;
      R.text(ctx, '按住屏幕拖动走位 · 武器自动攻击', W / 2, H - 46, { size: 20, align: 'center', color: '#fff', stroke: 'rgba(0,0,0,.55)', weight: 700 });
      ctx.restore();
    }
    if (state.phase === 'upgrade') drawUpgrade(ctx, t);
  }
  function drawUpgrade(ctx, t) {
    ctx.fillStyle = 'rgba(4,6,14,.8)'; ctx.fillRect(0, 0, W, H);
    R.text(ctx, '升级！', W / 2, 92, { size: 52, align: 'center', color: COL.gold, stroke: 'rgba(0,0,0,.6)', weight: 900 });
    R.text(ctx, 'Lv.' + state.lvl + ' · 选择一项强化（点击卡牌 / 按 1 2 3）', W / 2, 148, { size: 20, align: 'center', color: 'rgba(255,255,255,.82)', weight: 700 });
    const cw = ui.cardW, ch = ui.cardH;
    state.cards.forEach((c, i) => {
      const r = ui.cards[i]; if (!r) return;
      const hov = state.hover === i; ctx.save();
      if (hov) { ctx.translate(r.x + cw / 2, r.y + ch / 2); ctx.scale(1.045, 1.045); ctx.translate(-(r.x + cw / 2), -(r.y + ch / 2)); }
      R.panel(ctx, r.x, r.y, cw, ch, {
        r: 22, fill: hov ? 'rgba(34,42,70,.98)' : 'rgba(20,25,44,.96)',
        stroke: hov ? COL.gold : tint(COL.gold, 0.35), lineWidth: hov ? 3 : 2, shadowBlur: hov ? 22 : 12,
      });
      ctx.fillStyle = hov ? tint(COL.gold, 0.22) : tint(COL.gold, 0.12);
      ctx.beginPath(); ctx.arc(r.x + cw / 2, r.y + 66, 38, 0, TAU); ctx.fill();
      ctx.strokeStyle = tint(COL.gold, hov ? 0.95 : 0.5); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(r.x + cw / 2, r.y + 66, 38, 0, TAU); ctx.stroke();
      iconCard(ctx, c.icon, r.x + cw / 2, r.y + 66, 40, COL.gold);
      R.text(ctx, c.name, r.x + cw / 2, r.y + 140, { size: 24, align: 'center', color: '#fff', weight: 900 });
      R.text(ctx, c.short + '  Lv.' + c.stack + ' → ' + (c.stack + 1) + ' / ' + c.max, r.x + cw / 2, r.y + 176, { size: 15, align: 'center', color: 'rgba(255,255,255,.62)', weight: 700 });
      R.text(ctx, c.desc, r.x + cw / 2, r.y + 226, { size: 21, align: 'center', color: COL.gold, weight: 800 });
      ctx.fillStyle = 'rgba(0,0,0,.35)'; R.roundRect(ctx, r.x + cw / 2 - 60, r.y + 268, 120, 34, 17); ctx.fill();
      R.text(ctx, '按 ' + (i + 1), r.x + cw / 2, r.y + 285, { size: 16, align: 'center', color: 'rgba(255,255,255,.8)', weight: 800 });
      if (hov) R.text(ctx, '选择', r.x + cw / 2, r.y + 320, { size: 15, align: 'center', color: COL.gold, weight: 800 }); ctx.restore();
    });
    const k = ['伤害 ' + Math.round(state.atk), '间隔 ' + state.rate.toFixed(2) + 's', '射程 ' + Math.round(state.range),
      '弹道 ' + state.shots, '穿透 ' + state.pierce, '移速 ' + Math.round(state.speed), '吸附 ' + Math.round(state.magnet)];
    R.text(ctx, k.join('  ·  '), W / 2, 592, { size: 17, align: 'center', color: 'rgba(255,255,255,.72)', weight: 700 });
    R.text(ctx, '世界已暂停，选完继续', W / 2, 624, { size: 15, align: 'center', color: 'rgba(255,255,255,.4)', weight: 600 });
  }

  /* ------------------------------ 输入 ------------------------------ */
  function cardAt(x, y) {
    for (let i = 0; i < ui.cards.length; i++) {
      const r = ui.cards[i]; if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
    }
    return -1;
  }
  function bindKeys() {
    if (keyBound || typeof window === 'undefined') return;
    keyBound = true;
    try {
      window.addEventListener('keyup', (e) => { const k = MOVE_KEYS[e.key]; if (k) keys[k] = false; });
      window.addEventListener('blur', () => { keys.up = keys.down = keys.left = keys.right = false; });
    } catch (e) { /* 非浏览器环境忽略 */ }
  }
  function pointer(kind, x, y, key) {
    if (kind === 'key') {
      if (rule.status !== 'playing') return;
      if (state.phase === 'upgrade') {
        if (key === '1') return void applyCard(0);
        if (key === '2') return void applyCard(1);
        if (key === '3') return void applyCard(2);
        return;
      }
      const k = MOVE_KEYS[key]; if (k) keys[k] = true;
      return;
    }
    if (kind === 'down') {
      if (state.phase === 'upgrade') { const i = cardAt(x, y); if (i >= 0) applyCard(i); return; }
      state.drag = { ax: x, ay: y, x, y };
      return;
    }
    if (kind === 'move') {
      if (state.phase === 'upgrade') { state.hover = cardAt(x, y); return; }
      if (!state.drag) return;
      state.drag.x = x; state.drag.y = y; const dx = x - state.drag.ax, dy = y - state.drag.ay, d = Math.hypot(dx, dy);
      if (d > 92) { state.drag.ax = x - (dx / d) * 92; state.drag.ay = y - (dy / d) * 92; }
      return;
    }
    if (kind === 'up') state.drag = null;
  }

  /* ------------------------------ 机器人（无头仿真） ------------------------------ */
  function pickCardIdx() {
    let best = 0, bestScore = -1e9;
    state.cards.forEach((c, i) => {
      let s = PRIO[c.id] || 0; if (c.id === 'hp') s += (1 - state.hp / state.maxHp) * 55;
      if (c.id === 'multi' && state.shots >= 6) s -= 40; if (c.id === 'range' && state.range > 520) s -= 30;
      if (s > bestScore) { bestScore = s; best = i; }
    });
    return best;
  }
  function bot(dt) {
    if (rule.status !== 'playing') return;
    if (state.phase === 'upgrade') {
      botCardT += dt;
      if (botCardT >= 0.1) { botCardT = 0; applyCard(pickCardIdx()); }
      return;
    }
    botCardT = 0;
    /* 候选方向打分：预测 0.45s 后的位置，离怪越远 / 越靠中心 / 越近宝石越好 */
    const near = state.botNear; near.length = 0; let nearD = 1e9;
    for (const e of enemies) {
      if (!e.alive) continue; const dx = e.x - player.x, dy = e.y - player.y, d2 = dx * dx + dy * dy;
      if (d2 < nearD) nearD = Math.sqrt(d2); if (d2 < 400 * 400) near.push(e);
    }
    let gx = 0, gy = 0, gd = 1e9;
    for (const g of gems) {
      const d2 = (g.x - player.x) * (g.x - player.x) + (g.y - player.y) * (g.y - player.y);
      if (d2 < gd) { gd = d2; gx = g.x; gy = g.y; }
    }
    const hasGem = gd < 1e9, cx = (AR.x0 + AR.x1) / 2, cy = (AR.y0 + AR.y1) / 2, look = state.speed * 0.45;
    let bestA = 0, bestScore = -1e9;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU, dx = Math.cos(a), dy = Math.sin(a); const px = player.x + dx * look, py = player.y + dy * look;
      let score = 0;
      for (const e of near) {
        const ddx = px - e.x, ddy = py - e.y, d2 = ddx * ddx + ddy * ddy; const rr = e.radius + 86 + (e.boss ? 34 : 0);
        if (d2 < rr * rr) { const k = 1 - Math.sqrt(d2) / rr; score -= k * k * (e.boss ? 190 : 75); }
        const cdx = player.x - e.x, cdy = player.y - e.y; if (cdx * cdx + cdy * cdy < 150 * 150 && (ddx * dx + ddy * dy) > 0) score -= 26;
      }
      score -= (Math.abs(px - cx) / (AR.x1 - AR.x0)) * 12 + (Math.abs(py - cy) / (AR.y1 - AR.y0)) * 22;
      if (px < AR.x0 + 90) score -= 55; if (px > AR.x1 - 90) score -= 55;
      if (py < AR.y0 + 90) score -= 60; if (py > AR.y1 - 90) score -= 60;
      if (hasGem) {
        const gdist = Math.hypot(px - gx, py - gy); score += Math.max(0, 1 - gdist / 360) * (nearD > 210 ? 150 : 34);
        if (gdist < 70) score += 40;
      }
      if (score > bestScore) { bestScore = score; bestA = a; }
    }
    state.ai = { x: Math.cos(bestA), y: Math.sin(bestA) };
  }

  /* ------------------------------ 对外接口 ------------------------------ */
  const rule = {
    status: 'playing',
    ui,
    init() {
      player.x = W / 2; player.y = H * 0.62; player.face = 1; player.moving = false; player.flash = 0;
      state.hp = state.maxHp = P.hp;
      state.speed = P.speed; state.atk = P.atk; state.rate = P.rate; state.range = P.range;
      state.magnet = P.magnet; state.shots = 1; state.pierce = 0; state.lvl = 1; state.xp = 0; state.xpNeed = needFor(1);
      state.time = 0; state.phase = 'play'; state.cards = []; state.hover = -1;
      state.counts = {}; state.drag = null; state.ai = null; state.speckles = []; state.rocks = [];
      for (let i = 0; i < 78; i++) {
        state.speckles.push({
          x: rng.range(AR.x0 + 8, AR.x1 - 8), y: rng.range(AR.y0 + 8, AR.y1 - 8),
          w: rng.range(2, 6), a: rng.range(0.05, 0.16),
          c: rng.chance(0.5) ? tint(COL.accent, 0.5) : 'rgba(255,255,255,.5)',
        });
      }
      for (let i = 0; i < 18; i++) {
        state.rocks.push({
          x: vrng.range(AR.x0 + 40, AR.x1 - 40), y: vrng.range(AR.y0 + 40, AR.y1 - 30),
          w: vrng.range(7, 19), rot: vrng.range(-0.5, 0.5),
        });
      }
      const cw = ui.cardW, ch = ui.cardH, gap = 28; const x0 = Math.round((W - (cw * 3 + gap * 2)) / 2), y0 = 186;
      ui.cards = [0, 1, 2].map((i) => ({ x: x0 + i * (cw + gap), y: y0, w: cw, h: ch })); bindKeys();
    },
    update, drawWorld, drawHUD, pointer, bot,
    result() {
      const hpK = clamp(state.hp / state.maxHp, 0, 1);
      return {
        stars: rule.status === 'won' ? (hpK >= 0.78 ? 3 : hpK >= 0.45 ? 2 : 1) : 0,
        score: state.kills * 9 + (state.bossKilled ? 600 : 0) + Math.round(hpK * 320),
        coins: rule.status === 'won' ? 22 + level.id * 6 : 0,
        kills: state.kills, time: state.time,
      };
    },
    debug() {
      return {
        time: +state.time.toFixed(2), hp: +state.hp.toFixed(1), maxHp: Math.round(state.maxHp),
        lvl: state.lvl, xp: Math.floor(state.xp), xpNeed: state.xpNeed,
        kills: state.kills, enemies: enemies.length, gems: gems.length,
        atk: +state.atk.toFixed(1), rate: +state.rate.toFixed(3), range: Math.round(state.range),
        shots: state.shots, pierce: state.pierce, speed: Math.round(state.speed),
        phase: state.phase, bossHp: state.boss ? +state.boss.hp.toFixed(1) : 0,
        bossKilled: state.bossKilled, spawned: state.count, status: rule.status,
      };
    },
  };
  return rule;
}
