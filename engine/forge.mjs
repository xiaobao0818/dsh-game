#!/usr/bin/env node
/* =========================================================================
 * 游戏工坊 CLI（插件宿主也走这里；每次调用是独立进程，改引擎无需重启 DSH）
 *
 *   node engine/forge.mjs genres
 *   node engine/forge.mjs plan --brief "做一个僵尸围山门的塔防"
 *   node engine/forge.mjs forge --brief "..." --dir /abs/path [--genre horde] [--theme space]
 *                               [--levels 24] [--title 名字] [--seed 123] [--no-check] [--overwrite]
 *   node engine/forge.mjs build --dir /abs/path
 *   node engine/forge.mjs check --dir /abs/path [--no-browser]
 * ========================================================================= */
import { forge, rebuild, checkProject, planGame, listGenres } from './lib/forge.mjs';

const argv = process.argv.slice(2);
const cmd = argv[0];
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const has = (k) => argv.includes('--' + k);
function print(obj) { console.log(JSON.stringify(obj, null, 2)); }

try {
  if (cmd === 'genres') {
    print({ ok: true, genres: listGenres() });
  } else if (cmd === 'plan') {
    const brief = arg('brief', '');
    const plan = planGame(brief, { genre: arg('genre'), theme: arg('theme'), levels: arg('levels'), title: arg('title'), seed: arg('seed') });
    if (has('full')) print({ ok: true, plan });
    else print({ ok: true, plan: {
      brief: plan.brief, seed: plan.seed, title: plan.title, subtitle: plan.subtitle, tagline: plan.tagline,
      genre: plan.genre, genreName: plan.meta.name, theme: plan.theme.id, themeName: plan.theme.name,
      levels: plan.levelCount, orientation: plan.orientation, reason: plan.reason,
      themes: Object.fromEntries(Object.entries(plan.scores)),
    } });
  } else if (cmd === 'forge') {
    const r = await forge({
      brief: arg('brief', ''), dir: arg('dir', ''),
      genre: arg('genre'), theme: arg('theme'), levels: arg('levels'), title: arg('title'), seed: arg('seed'),
      check: !has('no-check'), overwrite: has('overwrite'), browser: !has('no-browser'),
    });
    print(r);
    process.exit(r.ok ? 0 : 1);
  } else if (cmd === 'build') {
    print(await rebuild(arg('dir', '')));
  } else if (cmd === 'check') {
    const r = await checkProject(arg('dir', ''), { browser: !has('no-browser') });
    print(r);
    process.exit(r.ok ? 0 : 1);
  } else {
    console.error('用法：forge.mjs <genres|plan|forge|build|check> [options]');
    process.exit(2);
  }
} catch (e) {
  print({ ok: false, error: String(e && e.message || e) });
  process.exit(1);
}
