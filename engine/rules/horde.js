/* =========================================================================
 * rules/horde.js —— 增量自走塔防：造屋派兵 / 尸潮对冲 / 法术支援
 * 纯逻辑 update() + 纯绘制 drawWorld()/drawHUD()，可在 Node 里无头跑（tools/sim.mjs）
 * ========================================================================= */
import { clamp, RNG, dist } from '../core.js';

export function createRule(svc) {
  const { content, level, W, H, audio, fx } = svc;
  const art = svc.art;
  const D = content.defs;
  const rng = svc.rng;
  const playerScale = 1 + (level.id - 1) * 0.045;
  const groundY = Math.round(H * 0.735);
  const baseX = 92;

  const enemies = [], units = [], shots = [];
  const slots = [0, 1, 2, 3].map((i) => ({ i, x: 208 + i * 94, y: groundY, building: null }));
  const state = {
    gold: level.startGold, baseHp: level.baseHp, baseHpMax: level.baseHp,
    time: 0, kills: 0, spawned: 0, done: 0, winT: 0,
    spells: D.spells.map((s) => ({ ...s, cd: 0, cdMax: s.cd })),
    selSpell: null, lastWave: 0, shakeT: 0,
  };
  const schedule = [];
  (level.waves || []).forEach((w, wi) => {
    (w.groups || []).forEach((g) => {
      for (let i = 0; i < (g.count || 0); i++) {
        schedule.push({ t: (w.at || 0) + (g.delay || 0) + i * (g.gap || 0.8), type: g.type, wave: wi + 1, boss: !!w.boss });
      }
    });
    state.lastWave = Math.max(state.lastWave, w.at || 0);
  });
  schedule.sort((a, b) => a.t - b.t);
  state.spawnIdx = 0;

  const enemyDef = (id) => D.enemies.find((e) => e.id === id) || D.enemies[0];
  const unitDef = (role) => D.units.find((u) => u.role === role) || D.units[0];
  const bldDef = (id) => D.buildings.find((b) => b.id === id) || D.buildings[0];

  /* ------------------------------ 动作 ------------------------------ */
  function toast(msg) { svc.toast?.(msg); }
  function addGold(n) { state.gold += n; }
  function spend(n) { if (state.gold < n) return false; state.gold -= n; return true; }

  function build(typeId) {
    const def = bldDef(typeId);
    const slot = slots.find((s) => !s.building);
    if (!slot) { toast('位置已满，点卡片升级'); return false; }
    if (!spend(def.cost)) { toast('铜钱不足'); audio.sfx('warn'); return false; }
    slot.building = { type: def.id, role: def.role, level: 1, timer: rng.range(0.45, 1.1), hp: 1 };
    audio.sfx('build');
    fx.burst(slot.x, groundY - 30, 10, { color: '#ffd76a', up: 80 });
    fx.text(slot.x, groundY - 138, '建造 ' + def.name, '#ffe9b0', 18);
    return true;
  }
  function upgrade(slot) {
    const b = slot.building; if (!b) return false;
    if (b.level >= 5) { toast('已满级'); return false; }
    const def = bldDef(b.type);
    const cost = Math.round(def.cost * (0.65 + 0.5 * b.level));
    if (!spend(cost)) { toast('铜钱不足（升级 ' + cost + '）'); audio.sfx('warn'); return false; }
    b.level++; audio.sfx('upgrade');
    fx.burst(slot.x, groundY - 40, 14, { color: '#ffd76a', up: 120 });
    fx.text(slot.x, groundY - 146, 'Lv.' + b.level, '#ffe9b0', 20);
    return true;
  }
  function cardAction(typeId) {
    const def = bldDef(typeId);
    const empty = slots.find((s) => !s.building);
    if (empty) return build(typeId);
    const same = slots.filter((s) => s.building && s.building.type === typeId).sort((a, b) => a.building.level - b.building.level)[0];
    if (same) return upgrade(same);
    // 没有同类型：升级任意最低级建筑
    const low = slots.filter((s) => s.building).sort((a, b) => a.building.level - b.building.level)[0];
    if (low) return upgrade(low);
    return false;
  }
  function cast(spellId, x, y) {
    const sp = state.spells.find((s) => s.id === spellId);
    if (!sp || sp.cd > 0) { toast('法术冷却中'); return false; }
    if (sp.id === 'heal') {
      for (const u of units) u.hp = Math.min(u.maxHp, u.hp + sp.heal * playerScale);
      state.baseHp = Math.min(state.baseHpMax, state.baseHp + sp.heal * playerScale);
      sp.cd = sp.cdMax;
      audio.sfx('spell'); fx.flash(0.25); fx.text(W / 2, groundY - 180, '回春', '#8fffc0', 26);
      return true;
    }
    sp.cd = sp.cdMax;
    audio.sfx(sp.id === 'frost' ? 'freeze' : 'spell');
    fx.ring(x, y, sp.id === 'frost' ? '#9fe8ff' : '#ffd76a', 12, { grow: 460, max: 0.5 });
    fx.burst(x, y, 26, { color: sp.id === 'frost' ? '#bfeaff' : '#ffcf5c', up: 40, speed: 280 });
    fx.shake(sp.id === 'frost' ? 4 : 9);
    for (const e of enemies) {
      if (dist(x, y, e.x, groundY - 20) <= sp.radius) {
        if (sp.dmg) hurtEnemy(e, sp.dmg * playerScale, 'spell');
        if (sp.slow) { e.slowT = sp.slowT; e.slowF = sp.slow; }
      }
    }
    fx.text(x, y - 20, sp.name, sp.id === 'frost' ? '#bfeaff' : '#ffe9b0', 24);
    return true;
  }

  /* ------------------------------ 单位 ------------------------------ */
  function spawnUnit(slot) {
    const b = slot.building;
    const def = unitDef(b.role);
    const lvMul = 1 + 0.25 * (b.level - 1);
    const j = rng.range(-6, 6);
    units.push({
      role: b.role, name: def.name, x: slot.x + 26, y: groundY - 10 + j,
      hp: def.hp * playerScale * lvMul, maxHp: def.hp * playerScale * lvMul,
      atk: (def.atk || 0) * playerScale * lvMul, range: def.range, cd: def.cd, atkCd: rng.range(0, 0.3),
      speed: def.speed, radius: def.radius, aoe: def.aoe || 0, heal: (def.heal || 0) * playerScale * lvMul,
      tier: b.level, flash: 0, facing: 1, dead: false, moving: true,
    });
  }
  function spawnEnemy(type, boss) {
    const def = enemyDef(type);
    const hp = def.hp * level.scale.hp * (boss ? 1.25 : 1);
    enemies.push({
      type: def.id, name: def.name, boss: !!def.boss || !!boss,
      x: W - 20 - rng.range(0, 90), y: groundY - 10 + rng.range(-7, 7),
      hp, maxHp: hp, atk: def.atk * level.scale.atk, speed: def.speed * level.scale.speed,
      range: def.range, cd: def.cd, atkCd: rng.range(0, 0.5), gold: def.gold, radius: def.radius,
      slowT: 0, slowF: 1, flash: 0, facing: -1, dead: false, moving: true,
    });
    state.spawned++;
  }
  function hurtEnemy(e, dmg, kind) {
    e.hp -= dmg; e.flash = 0.12;
    if (kind !== 'dot') {
      fx.text(e.x, e.y - 44, String(Math.round(dmg)), kind === 'spell' ? '#ffe08a' : '#fff', kind === 'spell' ? 22 : 16);
      if (kind !== 'aoe') audio.sfx('hit');
    }
    if (e.hp <= 0 && !e.dead) {
      e.dead = true;
      state.kills++;
      const g = Math.round(e.gold * (1 + 0.02 * (level.id - 1)));
      addGold(g);
      audio.sfx(e.boss ? 'explode' : 'coin');
      fx.burst(e.x, e.y - 20, e.boss ? 40 : 12, { color: e.boss ? '#ff9f43' : '#c85a6a', up: 60, speed: e.boss ? 320 : 180 });
      fx.text(e.x, e.y - 40, '+' + g, '#ffd76a', e.boss ? 26 : 17);
      if (e.boss) fx.shake(12);
    }
  }
  function hurtBase(e) {
    state.baseHp -= e.atk * 1.2;
    fx.shake(2.5); audio.sfx('punch');
    if (state.baseHp <= 0) { state.baseHp = 0; /* 失败在 update 末尾统一判定 */ }
  }

  /* ------------------------------ 更新 ------------------------------ */
  function update(dt) {
    if (rule.status !== 'playing') return;
    state.time += dt;
    // 出生队列
    while (state.spawnIdx < schedule.length && schedule[state.spawnIdx].t <= state.time) {
      const s = schedule[state.spawnIdx++];
      spawnEnemy(s.type, s.boss);
    }
    // 建筑产兵
    for (const slot of slots) {
      const b = slot.building; if (!b) continue;
      b.timer -= dt;
      if (b.timer <= 0) {
        const def = bldDef(b.type);
        b.timer = def.interval * Math.pow(0.92, b.level - 1);
        spawnUnit(slot);
      }
    }
    // 单位
    for (const u of units) {
      if (u.dead) continue;
      u.flash = Math.max(0, u.flash - dt);
      u.atkCd -= dt;
      u.moving = false;
      if (u.role === 'heal') {
        const hurt = units.filter((a) => a.hp < a.maxHp).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        if (hurt && Math.abs(hurt.x - u.x) < u.range) {
          if (u.atkCd <= 0) { u.atkCd = u.cd; hurt.hp = Math.min(hurt.maxHp, hurt.hp + u.heal); fx.burst(hurt.x, hurt.y - 30, 5, { color: '#8fffc0', up: 50 }); }
        } else {
          u.x += u.speed * 0.5 * dt; u.moving = true;
          if (u.x > W - 80) u.x = W - 80;
        }
        continue;
      }
      let target = null, best = 1e9;
      for (const e of enemies) {
        if (e.dead) continue;
        const d = Math.abs(e.x - u.x) - e.radius - u.radius;
        if (d < best) { best = d; target = e; }
      }
      if (target) {
        const inRange = best <= u.range;
        if (inRange) {
          if (u.atkCd <= 0) {
            u.atkCd = u.cd;
            if (u.range > 100) {
              shots.push({ x: u.x + 14, y: u.y - 26, target, dmg: u.atk, aoe: u.aoe, color: u.role === 'mage' ? '#c79bff' : '#ffe9b0', kind: u.role === 'mage' ? 'orb' : 'arrow', speed: 460 });
              audio.sfx(u.role === 'mage' ? 'spell' : 'arrow');
            } else {
              hurtEnemy(target, u.atk, 'melee');
              fx.burst(target.x - 8, target.y - 26, 4, { color: '#fff', speed: 90 });
            }
          }
        } else {
          const dir = Math.sign(target.x - u.x) || 1;
          u.x += dir * u.speed * dt; u.moving = true; u.facing = dir;
          if (u.x < 40) u.x = 40; if (u.x > W - 30) u.x = W - 30;
        }
      } else {
        u.x += u.speed * dt; u.moving = true; u.facing = 1;
        if (u.x > W - 60) u.x = W - 60;
      }
    }
    // 敌人
    for (const e of enemies) {
      if (e.dead) continue;
      e.flash = Math.max(0, e.flash - dt);
      e.atkCd -= dt;
      if (e.slowT > 0) { e.slowT -= dt; } else { e.slowF = 1; }
      e.moving = true;
      let target = null, best = 1e9;
      for (const u of units) {
        if (u.dead) continue;
        const d = Math.abs(u.x - e.x) - u.radius - e.radius;
        if (d < best) { best = d; target = u; }
      }
      if (target && best <= Math.max(e.range, 260)) {
        if (best <= e.range) {
          if (e.atkCd <= 0) {
            e.atkCd = e.cd;
            target.hp -= e.atk; target.flash = 0.15;
            fx.burst(target.x, target.y - 26, 4, { color: '#ff8a8a', speed: 80 });
            audio.sfx('hit');
            if (target.hp <= 0) { target.dead = true; fx.burst(target.x, target.y - 24, 12, { color: '#8fd3ff', up: 60 }); }
          }
        } else {
          e.x -= e.speed * e.slowF * dt; e.facing = -1;
        }
      } else {
        e.x -= e.speed * e.slowF * dt; e.facing = -1;
        if (e.x <= baseX + 26) {
          e.x = baseX + 26;
          if (e.atkCd <= 0) { e.atkCd = e.cd; hurtBase(e); }
        }
      }
    }
    // 投射物
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i];
      const tx = s.target && !s.target.dead ? s.target.x : s.x + 20;
      const ty = s.target && !s.target.dead ? s.target.y - 26 : s.y;
      const dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy);
      const step = s.speed * dt;
      if (d <= step || !s.target || s.target.dead) {
        if (s.target && !s.target.dead) {
          if (s.aoe) {
            for (const e of enemies) if (!e.dead && dist(tx, ty, e.x, e.y - 16) <= s.aoe) hurtEnemy(e, s.dmg, 'aoe');
            fx.ring(tx, ty, '#c79bff', 8, { grow: 160, max: 0.35 });
          } else hurtEnemy(s.target, s.dmg, 'ranged');
        }
        shots.splice(i, 1); continue;
      }
      s.x += (dx / d) * step; s.y += (dy / d) * step; s.angle = Math.atan2(dy, dx);
    }
    // 清理
    for (let i = units.length - 1; i >= 0; i--) if (units[i].dead) units.splice(i, 1);
    for (let i = enemies.length - 1; i >= 0; i--) if (enemies[i].dead) {
      const e = enemies[i]; enemies.splice(i, 1);
      if (e.boss) { fx.flash(0.5); fx.shake(14); }
    }
    // 法术冷却
    for (const sp of state.spells) if (sp.cd > 0) sp.cd = Math.max(0, sp.cd - dt);
    // 胜负
    if (state.baseHp <= 0) {
      rule.status = 'lost';
      svc.finish({ stars: 0, score: state.kills * 10, coins: 0, kills: state.kills, time: state.time });
      audio.sfx('lose');
      return;
    }
    const allSpawned = state.spawnIdx >= schedule.length;
    if (allSpawned && enemies.length === 0) {
      state.winT += dt;
      if (state.winT > 0.7) {
        rule.status = 'won';
        const hpRatio = state.baseHp / state.baseHpMax;
        const stars = hpRatio >= 0.98 ? 3 : hpRatio >= 0.55 ? 2 : 1;
        svc.finish({ stars, score: state.kills * 10 + Math.round(state.gold) + Math.round(hpRatio * 400), coins: 24 + level.id * 5, kills: state.kills, time: state.time });
        audio.sfx('win');
      }
    }
  }

  /* ------------------------------ 绘制 ------------------------------ */
  function drawWorld(ctx, t) {
    const shake = fx.shakeAmt;
    ctx.save();
    if (shake > 0.4) ctx.translate((rng.next() - 0.5) * shake, (rng.next() - 0.5) * shake);
    if (art) art.scene(ctx, W, H, t, { groundY });
    else { ctx.fillStyle = '#141428'; ctx.fillRect(0, 0, W, H); }
    // 山门
    drawBase(ctx, t);
    // 建筑位/建筑
    for (const s of slots) {
      if (!s.building) {
        ctx.save();
        ctx.setLineDash([7, 7]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.2)';
        rounded(ctx, s.x - 42, groundY - 96, 84, 96, 10); ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(255,215,106,.45)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(s.x - 12, groundY - 52); ctx.lineTo(s.x + 12, groundY - 52);
        ctx.moveTo(s.x, groundY - 64); ctx.lineTo(s.x, groundY - 40); ctx.stroke();
        ctx.restore();
      } else {
        const def = bldDef(s.building.type);
        const kind = D.buildings.findIndex((b) => b.id === def.id);
        if (art) art.building(ctx, s.x, groundY, 84, 92, { kind, level: s.building.level, t, cd: clamp(s.building.timer / def.interval, 0, 1) });
      }
    }
    // 实体按 y 排序
    const ents = [];
    for (const u of units) ents.push({ y: u.y, kind: 'u', o: u });
    for (const e of enemies) ents.push({ y: e.y, kind: 'e', o: e });
    ents.sort((a, b) => a.y - b.y);
    for (const it of ents) {
      const o = it.o;
      if (art) art.char(ctx, o.x, o.y, o.boss ? 2.5 : it.kind === 'u' ? 1.5 : 1.35, {
        kind: it.kind === 'u' ? 'hero' : (o.boss ? 'boss' : 'enemy'),
        role: it.kind === 'u' ? o.role : 'melee',
        name: o.name, tier: it.kind === 'u' ? o.tier : 1, facing: o.facing, t, flash: o.flash > 0,
        hp: o.hp / o.maxHp, moving: o.moving,
      });
      else { ctx.fillStyle = it.kind === 'u' ? '#8fd3ff' : '#c85a6a'; ctx.fillRect(o.x - 6, o.y - 20, 12, 20); }
    }
    // 投射物
    if (art) for (const s of shots) art.projectile(ctx, s.x, s.y, { kind: s.kind, angle: s.angle, color: s.color });
    ctx.restore();
  }
  function drawBase(ctx, t) {
    const x = baseX, y = groundY;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath(); ctx.ellipse(x, y, 54, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a3352'; ctx.fillRect(x - 44, y - 96, 16, 96);
    ctx.fillStyle = '#5c3f66'; ctx.fillRect(x + 30, y - 96, 16, 96);
    ctx.fillStyle = '#6d4a77'; ctx.fillRect(x - 52, y - 108, 104, 16);
    ctx.fillStyle = '#ffcf5c'; ctx.beginPath(); ctx.moveTo(x - 60, y - 108); ctx.lineTo(x, y - 136); ctx.lineTo(x + 60, y - 108); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(x - 18, y - 78, 36, 78);
    ctx.font = '900 22px "PingFang SC", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffe9b0';
    ctx.fillText('山门', x, y - 62);
    // 山门血量
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x - 48, y + 12, 96, 8);
    const ratio = state.baseHp / state.baseHpMax;
    ctx.fillStyle = ratio > 0.5 ? '#62d68f' : ratio > 0.25 ? '#ffd76a' : '#ff5d5d';
    ctx.fillRect(x - 48, y + 12, 96 * clamp(ratio, 0, 1), 8);
    ctx.restore();
    if (art) art.flag(ctx, x + 40, y - 96, '#ff7a59', t);
  }
  function drawHUD(ctx, t) {
    const pad = 18;
    // 顶部资源
    ctx.save();
    ctx.fillStyle = 'rgba(8,10,20,.55)';
    rounded(ctx, pad, 14, 190, 46, 23); ctx.fill();
    ctx.fillStyle = '#ffd76a'; ctx.beginPath(); ctx.arc(pad + 26, 37, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1206'; ctx.font = '900 15px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('金', pad + 26, 42);
    ctx.fillStyle = '#fff'; ctx.font = '900 24px "PingFang SC", sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(String(Math.floor(state.gold)), pad + 48, 45);
    // 波次
    const waveNow = Math.min(level.waves.length, 1 + level.waves.filter((w) => state.time >= w.at).length - 1);
    const waveTxt = `第 ${Math.max(1, waveNow + (state.spawnIdx >= schedule.length && enemies.length === 0 ? 1 : 0))} / ${level.waves.length} 波`;
    ctx.font = '800 20px "PingFang SC", sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(8,10,20,.55)'; rounded(ctx, W / 2 - 78, 14, 156, 42, 21); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText(waveTxt, W / 2, 41);
    // 剩余敌人
    ctx.font = '700 15px "PingFang SC", sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.fillText(`场上 ${enemies.length} · 击杀 ${state.kills}`, W / 2, 72);
    ctx.restore();
    // 建筑卡
    this.ui.cards.forEach((c, i) => {
      const def = bldDef(c.type);
      const afford = state.gold >= def.cost;
      const hasEmpty = slots.some((s) => !s.building);
      const any = slots.find((s) => s.building && s.building.type === c.type);
      const maxed = any && any.building.level >= 5 && !hasEmpty;
      ctx.save();
      ctx.fillStyle = 'rgba(10,14,26,.82)';
      rounded(ctx, c.x, c.y, c.w, c.h, 14); ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = afford && !maxed ? 'rgba(255,215,106,.55)' : 'rgba(255,255,255,.14)';
      rounded(ctx, c.x, c.y, c.w, c.h, 14); ctx.stroke();
      if (art) art.building(ctx, c.x + 26, c.y + c.h - 12, 42, 50, { kind: i, level: 1, t });
      ctx.fillStyle = maxed ? 'rgba(255,255,255,.4)' : '#fff';
      ctx.font = '800 17px "PingFang SC", sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(def.name, c.x + 52, c.y + 26);
      if (any) {
        ctx.fillStyle = '#ffd76a'; ctx.font = '800 14px "PingFang SC", sans-serif';
        ctx.fillText('Lv.' + any.building.level + ' / 5', c.x + 52, c.y + 48);
      }
      const upCost = any ? Math.round(def.cost * (0.65 + 0.5 * any.building.level)) : def.cost;
      ctx.fillStyle = !maxed && afford ? '#ffd76a' : '#ff7a7a';
      ctx.font = '800 15px "PingFang SC", sans-serif';
      ctx.fillText(maxed ? '已满级' : (hasEmpty && !any ? def.cost : upCost) + ' 铜钱', c.x + 52, c.y + 70);
      ctx.restore();
    });
    // 法术按钮
    state.spells.forEach((sp, i) => {
      const b = this.ui.spells[i];
      const ready = sp.cd <= 0;
      ctx.save();
      ctx.fillStyle = ready ? 'rgba(20,26,46,.9)' : 'rgba(12,14,24,.85)';
      ctx.beginPath(); ctx.arc(b.x + b.r, b.y + b.r, b.r, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = state.selSpell === sp.id ? 4 : 2;
      ctx.strokeStyle = state.selSpell === sp.id ? '#ffd76a' : ready ? 'rgba(255,215,106,.55)' : 'rgba(255,255,255,.16)';
      ctx.beginPath(); ctx.arc(b.x + b.r, b.y + b.r, b.r, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = ready ? '#fff' : 'rgba(255,255,255,.35)';
      ctx.font = '900 26px "PingFang SC", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(sp.name, b.x + b.r, b.y + b.r + 1);
      if (!ready) {
        ctx.fillStyle = 'rgba(0,0,0,.55)';
        ctx.beginPath(); ctx.moveTo(b.x + b.r, b.y + b.r);
        ctx.arc(b.x + b.r, b.y + b.r, b.r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (sp.cd / sp.cdMax));
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '800 18px sans-serif';
        ctx.fillText(String(Math.ceil(sp.cd)), b.x + b.r, b.y + b.r);
      }
      ctx.restore();
    });
    // 选中法术提示
    if (state.selSpell) {
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = '700 17px "PingFang SC", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('点击战场释放「' + (state.spells.find((s) => s.id === state.selSpell)?.name || '') + '」', W / 2, H - 28);
    }
  }
  function rounded(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath(); ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr); ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr); ctx.arcTo(x, y, x + w, y, rr); ctx.closePath();
  }

  /* ------------------------------ 输入 ------------------------------ */
  function pointer(kind, x, y) {
    if (kind === 'key') return;
    if (kind !== 'down') return;
    const ui = rule.ui;
    for (const b of ui.spells) {
      if (dist(x, matchY(y, b.y), b.x + b.r, b.y + b.r) <= b.r + 6) {
        const sp = state.spells.find((s) => s.id === b.id);
        if (sp.cd > 0) { toast('冷却中'); return; }
        state.selSpell = state.selSpell === b.id ? null : b.id;
        if (state.selSpell === 'heal') { cast('heal', 0, 0); state.selSpell = null; }
        return;
      }
    }
    for (const c of ui.cards) {
      if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) { cardAction(c.type); return; }
    }
    if (state.selSpell) { cast(state.selSpell, x, y); state.selSpell = null; return; }
  }
  function matchY(y) { return y; }

  /* ------------------------------ 机器人（无头仿真） ------------------------------ */
  let botT = 0;
  function bot(dt) {
    if (rule.status !== 'playing') return;
    botT += dt;
    if (botT < 0.35) return;
    botT = 0;
    const empty = slots.find((s) => !s.building);
    const counts = {};
    for (const s of slots) if (s.building) counts[s.building.type] = (counts[s.building.type] || 0) + 1;
    const order = ['barracks', 'archery', 'mage', 'heal'];
    if (empty) {
      let pickType = order.find((id) => !(counts[id] >= 1)) || order.sort((a, b) => bldDef(a).cost - bldDef(b).cost)[0];
      if (state.gold >= bldDef(pickType).cost) build(pickType);
    } else if (state.gold > 180) {
      const low = slots.filter((s) => s.building && s.building.level < 5).sort((a, b) => a.building.level - b.building.level)[0];
      if (low) upgrade(low);
    }
    // 法术：找敌人最密处
    if (state.spells.some((s) => s.cd <= 0)) {
      let cx = 0, cy = 0, n = 0, nearBase = 0;
      for (const e of enemies) { if (e.x < W * 0.55) { cx += e.x; cy += e.y; n++; } if (e.x < 260) nearBase++; }
      if (n > 0 && nearBase >= 2) {
        cx /= n; cy /= n;
        const thunder = state.spells.find((s) => s.id === 'thunder');
        if (thunder && thunder.cd <= 0) cast('thunder', cx, cy);
        else {
          const frost = state.spells.find((s) => s.id === 'frost');
          if (frost && frost.cd <= 0) cast('frost', cx, cy);
        }
      }
      if (state.baseHp < state.baseHpMax * 0.6) {
        const heal = state.spells.find((s) => s.id === 'heal');
        if (heal && heal.cd <= 0) cast('heal', 0, 0);
      }
    }
  }

  /* ------------------------------ 初始化 ------------------------------ */
  const rule = {
    status: 'playing',
    ui: { cards: [], spells: [] },
    init() {
      for (const sp of state.spells) sp.cd = 0;
      const cardY = H - 110;
      rule.ui.cards = D.buildings.map((b, i) => ({ type: b.id, x: 18 + i * 142, y: cardY, w: 130, h: 92 }));
      rule.ui.spells = state.spells.map((sp, i) => ({ id: sp.id, x: W - 30 - (3 - i) * 84, y: H - 104, r: 32 }));
    },
    update, drawWorld, drawHUD, pointer, bot,
    result() {
      return { stars: 0, score: state.kills * 10, coins: 0, kills: state.kills, time: state.time };
    },
    debug() { return { gold: state.gold, baseHp: state.baseHp, enemies: enemies.length, units: units.length, kills: state.kills, time: state.time, spawned: state.spawnIdx, schedule: schedule.length, status: rule.status }; },
  };
  return rule;
}
