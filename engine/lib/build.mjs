/* =========================================================================
 * build.mjs —— 把「一句话 + 主题 + 基因内容」写成一个完整可玩工程
 * 产物：index.html / css / js / tools / docs / README / game.json
 * ========================================================================= */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ENGINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(ENGINE, p), 'utf8');

function hexToRgba(hex, a) {
  const h = String(hex).replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function renderHtml(theme, title, subtitle) {
  let html = read('base/index.html');
  const pal = theme.palette;
  html = html.split('__TITLE__').join(escapeHtml(title));
  html = html.split('__SUBTITLE__').join(escapeHtml(subtitle || ''));
  html = html.split('__THEME_COLOR__').join(pal.ink || '#0d1024');
  return html;
}
export function renderCss(theme) {
  let css = read('base/css/style.css');
  const p = theme.palette;
  css = css.split('__BG_COLOR__').join(p.groundDark || '#0d1024');
  css = css.split('__BOOT_A__').join(p.sky[1] || '#2a1633');
  css = css.split('__BOOT_B__').join(p.sky[0] || '#0d1024');
  css = css.split('__GLOW__').join(hexToRgba(p.accent || '#ffd76a', 0.55));
  return css;
}
function escapeHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function writeIfChanged(file, content) {
  try {
    if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content) return false;
  } catch (e) { /* ignore */ }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
  return true;
}

/** 序列化为可读的静态 JS 数据（不是 JSON，便于手改） */
export function contentToJs(content) {
  const body = JSON.stringify(content, null, 2);
  return `/* =========================================================================\n * content.js —— 全部玩法内容数据（由「游戏工坊」生成，可直接手改）\n * 主题：${content.theme.name} · 基因：${content.genre} · 关卡：${content.levels.length}\n * 改完运行：node tools/build-single.mjs && node tools/check.mjs\n * ========================================================================= */\n\nexport const CONTENT = ${body};\n`;
}

export function writeProject({ dir, content, plan, ruleId }) {
  const title = content.title;
  const slug = content.slug || plan.genre + '-' + plan.seed.toString(36);
  // 1) 引擎基座
  const baseFiles = ['js/core.js', 'js/platform.js', 'js/render.js', 'js/art.js', 'js/app.js'];
  for (const f of baseFiles) writeIfChanged(path.join(dir, f), read('base/' + f));
  let main = read('base/js/main.js');
  main = main.replace("from './rules/horde.js'", `from './rules/${ruleId}.js'`);
  writeIfChanged(path.join(dir, 'js/main.js'), main);
  writeIfChanged(path.join(dir, 'index.html'), renderHtml(content.theme, title, content.subtitle));
  writeIfChanged(path.join(dir, 'css/style.css'), renderCss(content.theme));
  // 2) 内容 + 规则
  writeIfChanged(path.join(dir, 'js/content.js'), contentToJs(content));
  const ruleSrc = read(`rules/${ruleId}.js`);
  writeIfChanged(path.join(dir, 'js/rules', ruleId + '.js'), ruleSrc);
  // 3) 工具链
  const tools = ['serve.mjs', 'headless.mjs', 'build-single.mjs', 'sim.mjs', 'check.mjs'];
  for (const f of tools) {
    let src = read('tools/' + f);
    src = src.split('__RULE__').join(ruleId);
    src = src.split('__TITLE__').join(title);
    writeIfChanged(path.join(dir, 'tools', f), src);
  }
  // 4) package.json / manifest
  const pkg = {
    name: slug, private: true, type: 'module', version: '1.0.0',
    scripts: {
      start: 'node tools/serve.mjs 8080',
      build: 'node tools/build-single.mjs',
      sim: 'node tools/sim.mjs',
      check: 'node tools/check.mjs',
      headless: 'node tools/headless.mjs',
    },
  };
  writeIfChanged(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
  const manifest = {
    generator: 'dsh-game-studio',
    version: 1,
    slug, title, subtitle: content.subtitle, tagline: content.tagline,
    genre: content.genre, theme: content.theme.id, themeName: content.theme.name,
    orientation: content.orientation, levels: content.levels.length,
    seed: plan.seed, brief: plan.brief, plan: plan.reason || null,
    createdAt: new Date().toISOString(),
  };
  writeIfChanged(path.join(dir, 'game.json'), JSON.stringify(manifest, null, 2) + '\n');
  // 5) 文档
  writeIfChanged(path.join(dir, 'README.md'), renderReadme({ content, plan, slug }));
  writeIfChanged(path.join(dir, 'docs/DESIGN.md'), renderDesign({ content }));
  writeIfChanged(path.join(dir, 'docs/TESTING.md'), renderTesting({ content }));
  fs.mkdirSync(path.join(dir, 'dist'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'shots'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'docs'), { recursive: true });
  return { dir, slug, title, ruleId };
}

function renderReadme({ content, plan, slug }) {
  const c = content;
  const controls = (c.help.controls || []).map((x) => '- ' + x).join('\n');
  return `# ${c.title}\n\n> ${c.tagline}\n\n**${c.subtitle}** · ${c.theme.name} · ${c.levels.length} 关 · ${c.orientation === 'portrait' ? '竖屏' : '横屏'}\n\n## 一句话\n\n${plan.brief}\n\n## 直接玩\n\n- 单文件离线版：\`dist/${c.title}.html\`（双击打开，零外部请求）\n- 工程版：\`node tools/serve.mjs 8080\` → http://127.0.0.1:8080\n\n## 操作\n\n${controls}\n\n## 目标\n\n${c.help.goal}\n\n## 工程结构\n\n\`\`\`\nindex.html            入口\ncss/style.css         基础样式\njs/core.js            纯逻辑：数学/随机/存档（可在 Node 跑）\njs/platform.js        布局/WebAudio/粒子/输入\njs/render.js          绘制工具\njs/art.js             程序化美术（主题调色板）\njs/app.js             外壳：场景/主循环/存档/暂停\njs/content.js         全部内容数据（可手改）\njs/rules/${c.genre}.js 玩法规则（可手改）\ntools/                预览/构建/无头仿真/浏览器冒烟/自检\ndocs/                 设计说明与测试报告\n\`\`\`\n\n## 自检\n\n\`\`\`bash\nnode tools/build-single.mjs   # 单文件构建\nnode tools/sim.mjs            # 无头仿真（机器人全关通关）\nnode tools/check.mjs          # 数据+仿真+单文件+浏览器冒烟\n\`\`\`\n\n## 说明\n\n全部美术为 Canvas 程序化绘制，音乐音效为 WebAudio 实时合成，无第三方素材；存档只写本机 localStorage。\n\n生成信息：基因 \`${c.genre}\`、主题 \`${c.theme.id}\`、种子 \`${plan.seed}\`、工程 \`${slug}\`。\n`;
}

function renderDesign({ content }) {
  const c = content;
  const rows = c.levels.slice(0, 12).map((l) => `| ${l.id} | ${l.name || ''} | ${l.boss ? 'Boss' : ''} | ${l.waves ? l.waves.length + ' 波' : ''} |`).join('\n');
  return `# ${c.title} · 设计说明\n\n## 主题\n\n- 题材：${c.theme.name}（${c.theme.mood}）\n- 主色：${c.theme.palette.accent} / ${c.theme.palette.accent2}\n- 货币：${(c.theme.vocab && c.theme.vocab.currency) || '金币'}\n\n## 核心循环\n\n${c.help.goal}\n\n## 内容规模\n\n- 关卡：${c.levels.length}\n- 章节：${c.chapters.map((ch) => ch.name).join(' / ')}\n- 定义表：${Object.keys(c.defs).map((k) => `${k}(${c.defs[k].length})`).join('、')}\n\n## 关卡表（前 12 关）\n\n| 关 | 名称 | Boss | 波次 |\n|---|---|---|---|\n${rows}\n\n## 调参入口\n\n- 数值/关卡：\`js/content.js\`\n- 玩法规则：\`js/rules/${c.genre}.js\`\n- 主题配色：\`js/content.js\` 的 \`theme.palette\`\n`;
}

function renderTesting({ content }) {
  const c = content;
  return `# ${c.title} · 测试与验收\n\n## 自动检查\n\n\`\`\`bash\nnode tools/check.mjs\n\`\`\`\n\n覆盖：\n\n1. **数据校验**：关卡 id 连续、章节覆盖、数值有限。\n2. **无头仿真**：机器人脚本在固定步长下逐关试玩，要求 ${c.levels.length}/${c.levels.length} 通关；不操作（摆烂）应大量失败。\n3. **单文件构建**：内联全部 JS/CSS，校验零外部引用与体积。\n4. **浏览器冒烟**：无头 Chrome 打开工程版，收集异常/console.error，检查 FPS≥45；截图写入 \`shots/\`。\n\n## 手动验收清单\n\n- [ ] 标题页 → 开始 → 战斗 → 结算 → 下一关 全流程可走\n- [ ] 手机尺寸下无遮挡、按钮可点、文字可读\n- [ ] 暂停/继续/重开/返回选关 正常\n- [ ] 音乐/音效开关生效，刷新后设置保留\n- [ ] 断网/双击单文件 仍可玩\n`;
}
