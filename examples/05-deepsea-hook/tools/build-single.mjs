#!/usr/bin/env node
/* =========================================================================
 * 单文件构建：把 js/ 下所有 ESM 模块 + CSS 内联进 dist/<TITLE>.html
 *   node tools/build-single.mjs
 * 产物：dist/<TITLE>.html（双击即玩，零外部请求）
 * ========================================================================= */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ENTRY = 'js/main.js';
const NAME = '深海打捞';

const modules = new Map();
const order = [];
const visiting = new Set();

function resolveSpec(spec, fromRel) {
  if (!spec.startsWith('.')) throw new Error(`不支持裸模块 import：${spec}（来自 ${fromRel}）`);
  let p = path.resolve(path.dirname(path.join(ROOT, fromRel)), spec);
  if (!p.endsWith('.js')) p += '.js';
  return path.relative(ROOT, p);
}

function parseNamed(text) {
  const inner = text.replace(/^\s*\{/, '').replace(/\}\s*$/, '');
  const list = [];
  for (const part of inner.split(',')) {
    const t = part.trim(); if (!t) continue;
    const seg = t.split(/\s+as\s+/);
    list.push({ from: seg[0].trim(), to: (seg[1] || seg[0]).trim() });
  }
  return list;
}

function analyze(rel) {
  if (modules.has(rel)) return;
  if (visiting.has(rel)) throw new Error(`检测到循环依赖：${rel}`);
  visiting.add(rel);
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) throw new Error(`缺少模块：${rel}`);
  let src = fs.readFileSync(abs, 'utf8');
  const imports = [];
  src = src.replace(/^import\s+([\s\S]*?)\s+from\s*['"]([^'"]+)['"]\s*;?/gm, (m, clause, spec) => {
    imports.push({ clause: clause.trim(), spec }); return '__IMP__';
  });
  src = src.replace(/^import\s*['"]([^'"]+)['"]\s*;?/gm, (m, spec) => {
    imports.push({ clause: '', spec }); return '__IMP__';
  });
  if (/^\s*import\s/m.test(src)) throw new Error(`${rel} 仍有未处理的 import`);
  const exportsList = [];
  src = src.replace(/^export\s*\{([^}]*)\}\s*;?/gm, (m, inner) => {
    for (const part of inner.split(',')) {
      const t = part.trim(); if (!t) continue;
      const seg = t.split(/\s+as\s+/);
      exportsList.push({ local: seg[0].trim(), name: (seg[1] || seg[0]).trim() });
    }
    return '';
  });
  src = src.replace(/^export\s+default\s+([A-Za-z_$][\w$]*)\s*;?/gm, (m, name) => {
    exportsList.push({ local: name, name: 'default' }); return '';
  });
  src = src.replace(/^export\s+(async\s+)?(function|class|const|let|var)\s+([A-Za-z_$][\w$]*)/gm, (m, asy, kind, name) => {
    exportsList.push({ local: name, name }); return m.replace(/^export\s+/, '');
  });
  if (/^\s*export\s/m.test(src)) throw new Error(`${rel} 仍有未处理的 export`);
  const resolved = imports.map((im) => ({ ...im, rel: resolveSpec(im.spec, rel) }));
  modules.set(rel, { src, imports: resolved, exports: exportsList });
  for (const im of resolved) analyze(im.rel);
  visiting.delete(rel);
  order.push(rel);
}

function transform(rel) {
  const m = modules.get(rel);
  const chunks = m.src.split('__IMP__');
  const out = [chunks[0]];
  for (let i = 0; i < m.imports.length; i++) {
    const im = m.imports[i];
    let decl = '';
    if (im.clause) {
      const clause = im.clause;
      const comma = clause.indexOf(',');
      if (clause.startsWith('{')) {
        const named = parseNamed(clause);
        decl = `const { ${named.map((n) => (n.from === n.to ? n.from : `${n.from}: ${n.to}`)).join(', ')} } = __m[${JSON.stringify(im.rel)}];\n`;
      } else if (clause.startsWith('*')) {
        const ns = clause.match(/^\*\s+as\s+([A-Za-z_$][\w$]*)$/);
        if (!ns) throw new Error('无法解析 namespace import：' + clause);
        decl = `const ${ns[1]} = __m[${JSON.stringify(im.rel)}];\n`;
      } else {
        const first = (comma >= 0 ? clause.slice(0, comma) : clause).trim();
        decl = `const ${first} = __m[${JSON.stringify(im.rel)}].default;\n`;
        if (comma >= 0) {
          const named = parseNamed(clause.slice(comma + 1));
          decl += `const { ${named.map((n) => (n.from === n.to ? n.from : `${n.from}: ${n.to}`)).join(', ')} } = __m[${JSON.stringify(im.rel)}];\n`;
        }
      }
    }
    out.push(decl + (chunks[i + 1] || ''));
  }
  const body = out.join('');
  const exp = m.exports.map((e) => (e.local === e.name ? e.local : `${e.name}: ${e.local}`)).join(', ');
  return `__m[${JSON.stringify(rel)}] = (function(){\n${body}\nreturn { ${exp} };\n})();\n`;
}

console.log('分析模块…');
analyze(ENTRY);
let bundle = `/* ${NAME} · 单文件构建（离线可玩） */\n(function(){\n"use strict";\nconst __m = Object.create(null);\n`;
for (const rel of order) bundle += transform(rel);
bundle += '})();\n';
try { new Function(bundle); } catch (e) { throw new Error('打包结果语法检查失败：' + e.message); }
if (/^\s*import\s/m.test(bundle) || /^\s*export\s/m.test(bundle)) throw new Error('打包结果仍残留 import/export');

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'css', 'style.css'), 'utf8');
html = html.replace(/<link\s+rel="stylesheet"\s+href="css\/style\.css"\s*\/?>/, () => `<style>\n${css}\n</style>`);
html = html.replace(/<script\s+type="module"\s+src="js\/main\.js"\s*><\/script>/, () => `<script>\n${bundle}\n</script>`);
if (/<script[^>]+src=/.test(html) || /<link[^>]+stylesheet/.test(html)) throw new Error('HTML 注入失败：仍有外部引用');

fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
const outFile = path.join(ROOT, 'dist', NAME + '.html');
fs.writeFileSync(outFile, html, 'utf8');
const kb = (fs.statSync(outFile).size / 1024).toFixed(1);
console.log(`✅ 单文件：dist/${NAME}.html（${kb} KB，模块 ${order.length} 个）`);
