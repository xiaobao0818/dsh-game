/* =========================================================================
 * cocos-build.mjs —— 生成 Cocos Creator 3.8 工程（与 HTML 目标共用同一套内容/规则）
 *
 * 结构：
 *   assets/scenes/Main.scene          仅 Canvas + Camera + GameRoot 组件
 *   assets/scripts/GameRoot.ts        Cocos 宿主（输入/循环/启动）
 *   assets/scripts/CanvasSurface.ts   Canvas2D → Graphics/Label 桥
 *   assets/scripts/game/*.ts          同一套游戏模块（core/app/art/content/rules）
 *   settings/ toolchain               Cocos 3.8 项目配置
 * ========================================================================= */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ENGINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COCOS = path.join(ENGINE, 'cocos');
const read = (p) => fs.readFileSync(path.join(ENGINE, p), 'utf8');
const readCocos = (p) => fs.readFileSync(path.join(COCOS, p), 'utf8');
const readJson = (p) => JSON.parse(readCocos(p));

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function compressUuid(uuid) {
  const hex = String(uuid).replace(/-/g, '');
  let out = hex.slice(0, 5);
  for (let i = 5; i < 32; i += 3) {
    const v = parseInt(hex.slice(i, i + 3), 16);
    out += B64[(v >> 6) & 63] + B64[v & 63];
  }
  return out;
}
export function stableUuid(seed) {
  // FNV-1a → 128bit 伪随机 uuid（确定性：同 slug 永远同 uuid，便于重建工程）
  let h1 = 2166136261 >>> 0, h2 = 0x9e3779b9 >>> 0, h3 = 0x85ebca6b >>> 0, h4 = 0xc2b2ae35 >>> 0;
  for (const ch of String(seed)) {
    const c = ch.charCodeAt(0);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = Math.imul(h2 ^ c, 2246822519) >>> 0;
    h3 = Math.imul(h3 ^ c, 3266489917) >>> 0;
    h4 = Math.imul(h4 ^ c, 668265263) >>> 0;
  }
  const hx = (n) => n.toString(16).padStart(8, '0');
  const raw = (hx(h1) + hx(h2) + hx(h3) + hx(h4)).slice(0, 32);
  const variant = ((parseInt(raw[16], 16) & 0x3) | 0x8).toString(16);
  return raw.slice(0, 8) + '-' + raw.slice(8, 12) + '-4' + raw.slice(13, 16) + '-' + variant + raw.slice(17, 20) + '-' + raw.slice(20, 32);
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

/** 把 ESM 游戏模块转成 Cocos 可编译的 TS（去 .js 后缀、加 @ts-nocheck） */
function gameModule(src, genre) {
  let s = src
    .replace(/from '([^']+)\.js'/g, "from '$1'")
    .replace(/__GENRE__/g, genre);
  return '// @ts-nocheck\n' + s;
}

export function writeCocosProject({ dir, content, plan, ruleId }) {
  const slug = content.slug || (plan.genre + '-' + plan.seed.toString(36));
  const W = content.orientation === 'portrait' ? 720 : 1280;
  const H = content.orientation === 'portrait' ? 1280 : 720;
  const projUuid = stableUuid(slug + ':project');
  const sceneUuid = stableUuid(slug + ':scene');
  const scriptUuid = stableUuid(slug + ':gameroot');

  // ---------- 工程清单 ----------
  write(path.join(dir, 'package.json'), JSON.stringify({
    name: slug,
    creator: { version: '3.8.8' },
    uuid: projUuid,
    version: '1.0.0',
    description: content.title + ' · Cocos Creator 3.8 版（游戏工坊生成）',
    scripts: { 'build:web': 'bash tools/build-web.sh', smoke: 'node tools/cocos-smoke.mjs --project .' },
  }, null, 2) + '\n');
  write(path.join(dir, 'tsconfig.json'), readCocos('tsconfig.json'));
  write(path.join(dir, '.gitignore'), 'library/\ntemp/\nbuild/\nlocal/\nprofiles/\nnode_modules/\n.DS_Store\n');

  // ---------- settings（Cocos 3.8 项目配置） ----------
  const settings = ['builder.json', 'device.json', 'engine.json', 'information.json', 'program.json'];
  for (const f of settings) write(path.join(dir, 'settings/v2/packages', f), JSON.stringify(readJson('settings/v2/packages/' + f), null, 2) + '\n');
  const proj = readJson('settings/v2/packages/project.json');
  proj.general.designResolution = { width: W, height: H, fitWidth: true, fitHeight: true };
  write(path.join(dir, 'settings/v2/packages/project.json'), JSON.stringify(proj, null, 2) + '\n');

  // ---------- 场景（Canvas + Camera + GameRoot） ----------
  const scene = JSON.parse(readCocos('scene.template.json'));
  scene[1]._id = sceneUuid;
  scene[2]._lpos.x = W / 2;
  scene[2]._lpos.y = H / 2;
  scene[5]._contentSize.width = W;
  scene[5]._contentSize.height = H;
  scene[15].__type__ = compressUuid(scriptUuid);
  write(path.join(dir, 'assets/scenes/Main.scene'), JSON.stringify(scene, null, 2));
  write(path.join(dir, 'assets/scenes/Main.scene.meta'), JSON.stringify({ ver: '1.1.50', importer: 'scene', imported: true, uuid: sceneUuid, files: ['.json'], subMetas: {}, userData: {} }, null, 2));

  // ---------- 宿主脚本 ----------
  write(path.join(dir, 'assets/scripts/GameRoot.ts'), readCocos('host/GameRoot.ts'));
  write(path.join(dir, 'assets/scripts/GameRoot.ts.meta'), JSON.stringify({ ver: '4.0.24', importer: 'typescript', imported: true, uuid: scriptUuid, files: [], subMetas: {}, userData: {} }, null, 2));
  write(path.join(dir, 'assets/scripts/CanvasSurface.ts'), readCocos('host/CanvasSurface.ts'));

  // ---------- 游戏模块（与 HTML 目标同源） ----------
  const gdir = path.join(dir, 'assets/scripts/game');
  for (const f of ['core', 'platform', 'render', 'art', 'app', 'main']) {
    write(path.join(gdir, f + '.ts'), gameModule(read('base/js/' + f + '.js'), ruleId));
  }
  write(path.join(gdir, 'rules/' + ruleId + '.ts'), gameModule(read('rules/' + ruleId + '.js'), ruleId));
  write(path.join(gdir, 'content.ts'), '// @ts-nocheck\n' + contentToTs(content));

  // ---------- 工具链 ----------
  write(path.join(dir, 'tools/build-web.sh'), readCocos('tools/build-web.sh'));
  fs.chmodSync(path.join(dir, 'tools/build-web.sh'), 0o755);
  write(path.join(dir, 'tools/cocos-smoke.mjs'), readCocos('tools/cocos-smoke.mjs'));

  // ---------- 文档 / 清单 ----------
  write(path.join(dir, 'README.md'), renderReadme({ content, plan, W, H }));
  write(path.join(dir, 'docs/DESIGN.md'), renderDesign({ content }));
  write(path.join(dir, 'game.json'), JSON.stringify({
    generator: 'dsh-game-studio', engine: 'cocos', creator: '3.8.8', version: 1,
    slug, title: content.title, subtitle: content.subtitle, tagline: content.tagline,
    genre: content.genre, theme: content.theme.id, orientation: content.orientation,
    levels: content.levels.length, seed: plan.seed, brief: plan.brief, plan: plan.reason || null,
    designResolution: { width: W, height: H }, createdAt: new Date().toISOString(),
  }, null, 2) + '\n');
  fs.mkdirSync(path.join(dir, 'shots'), { recursive: true });
  return { dir, slug, W, H, sceneUuid, scriptUuid, projUuid };
}

/** 内容对象 → 静态 TS 模块（可手改） */
function contentToTs(content) {
  return `/* 全部玩法内容（由游戏工坊生成，可直接手改；改完重新构建） */\nexport const CONTENT = ${JSON.stringify(content, null, 2)};\n`;
}

function renderReadme({ content, plan, W, H }) {
  const c = content;
  const controls = (c.help.controls || []).map((x) => '- ' + x).join('\n');
  return `# ${c.title} · Cocos Creator 3.8 版

> ${c.tagline}

**${c.subtitle}** · ${c.theme.name} · ${c.levels.length} 关 · ${W}×${H} · Cocos Creator 3.8.8

## 打开 / 构建

1. 用 Cocos Creator 3.8.8 打开本目录（首次导入资源约 1~2 分钟）。
2. 编辑器里直接预览：打开 \`assets/scenes/Main.scene\` 点预览。
3. 命令行构建 Web Mobile：
   \`\`\`bash
   bash tools/build-web.sh          # 产物 build/web-mobile/index.html
   node tools/cocos-smoke.mjs --project .   # 无头 Chrome 冒烟 + 截图
   \`\`\`
   也可以用 Cocos 构建面板导出 Android / iOS / 鸿蒙（安装 Cocos 对应平台支持后）。

## 操作

${controls}

## 目标

${c.help.goal}

## 结构

\`\`\`
assets/scenes/Main.scene        场景（Canvas + Camera + GameRoot）
assets/scripts/GameRoot.ts      Cocos 宿主：触摸/鼠标/键盘 → 游戏；驱动主循环
assets/scripts/CanvasSurface.ts Canvas2D→Cocos Graphics/Label 桥（同一套绘制代码）
assets/scripts/game/            与 HTML 版同源的游戏模块（core/app/art/content/rules）
tools/build-web.sh              Cocos CLI 构建
tools/cocos-smoke.mjs           无头 Chrome 冒烟（启动/战斗/结算/截图）
settings/                       Cocos 3.8 项目配置（设计分辨率 ${W}×${H}）
\`\`\`

## 说明

- 渲染：Cocos Graphics + Label；玩法逻辑/内容与 HTML 版完全同源，改 \`game/content.ts\` 或 \`game/rules/${c.genre}.ts\` 即可。
- 已知近似：Cocos 端不渲染径向光晕与阴影，渐变按包围盒/条带近似；文字用 Label 渲染（总在图形之上）。
- 生成信息：基因 \`${c.genre}\`、主题 \`${c.theme.id}\`、种子 \`${plan.seed}\`。
`;
}
function renderDesign({ content }) {
  const c = content;
  const rows = c.levels.slice(0, 12).map((l) => `| ${l.id} | ${l.name || ''} | ${l.boss ? 'Boss' : ''} | ${l.waves ? l.waves.length + ' 波' : ''} |`).join('\n');
  return `# ${c.title} · 设计说明（Cocos 版）

## 主题

- 题材：${c.theme.name}（${c.theme.mood}）
- 主色：${c.theme.palette.accent} / ${c.theme.palette.accent2}
- 货币：${(c.theme.vocab && c.theme.vocab.currency) || '金币'}

## 核心循环

${c.help.goal}

## 内容规模

- 关卡：${c.levels.length}
- 章节：${c.chapters.map((ch) => ch.name).join(' / ')}
- 定义表：${Object.keys(c.defs).map((k) => `${k}(${c.defs[k].length})`).join('、')}

## 关卡表（前 12 关）

| 关 | 名称 | Boss | 波次 |
|---|---|---|---|
${rows}

## 调参入口

- 数值/关卡：\`assets/scripts/game/content.ts\`
- 玩法规则：\`assets/scripts/game/rules/${c.genre}.ts\`
- 渲染桥：\`assets/scripts/CanvasSurface.ts\`（如需正式美术/更原生渲染，可在这里替换）
`;
}
