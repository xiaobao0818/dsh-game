# 交付说明（v1.1.0 · HTML5 / Cocos Creator 双运行时）

> 一句话生成完整可玩的游戏：HTML5 单文件离线版，或 Cocos Creator 3.8 工程（可构建 Web / Android / iOS / 鸿蒙）。
> 两种目标共用同一套玩法逻辑与内容数据，并自带自动验收。

## 1. 插件能力

| 工具 | 作用 |
|---|---|
| `game_genres` | 列出 6 种玩法基因、10 套题材与支持的引擎（html / cocos） |
| `game_plan` | 只解析：题材、基因、标题、关卡数、横竖屏、引擎 |
| `game_forge` | **核心**：一句话 → 完整工程 → 构建 → 自检；`engine: "html" \| "cocos"` |
| `game_build` | HTML → 单文件 `dist/<名>.html`；Cocos → `build/web-mobile/index.html` |
| `game_check` | HTML 档跑数据/机器人仿真/单文件/浏览器；Cocos 档跑结构/CLI 构建/无头 WebGL 冒烟 |

描述里出现「Cocos」会自动选 Cocos 工程；否则默认 HTML5。

## 2. 内置演示（全部由本插件生成并通过验收）

### HTML5（`examples/`，双击 `dist/*.html` 即玩）

| 游戏 | 玩法 | 机器人仿真 | 摆烂 | 单文件 | 浏览器 |
|---|---|---|---|---|---|
| 僵尸围山门 | 自走塔防 | 30/30 | 0/30 | 166.3 KB | 60fps |
| 星海幸存者 | 割草生存 | 24/24 | 0/24 | 130.1 KB | 60fps |
| 火锅店合成记 | 合成塔防 | 24/24 | 0/24 | 151.2 KB | 60fps |
| 老小区归位 | 排序解谜 | 25/25 | 0/25 | 138.9 KB | 60fps |
| 深海打捞 | 钩爪打捞 | 24/24 | 0/24 | 129.4 KB | 60fps |
| 三十天开播 | 放置经营 | 24/24 | 0/24 | 129.8 KB | 60fps |

### Cocos Creator 3.8（`examples/cocos/`，可直接用编辑器打开）

| 工程 | 分辨率 | CLI 构建 | 无头冒烟（软件渲染） | 有头 GPU |
|---|---|---|---|---|
| `01-zombie-defense` | 1280×720 | 通过 | 启动/战斗/结算通过，26fps | — |
| `02-star-survivor` | 1280×720 | 通过 | 43fps | — |
| `03-hotpot-merge` | 720×1280 | 通过 | 27fps | — |
| `04-parking-sort` | 720×1280 | 通过 | 24fps | — |
| `05-deepsea-hook` | 720×1280 | 通过 | 14fps | **60fps**（390×844） |
| `06-streamer-idle` | 720×1280 | 通过 | 19fps | **58fps**（390×844） |

> 无头 Chrome 用 swiftshader 软件渲染，FPS 只用于回归；真机/有头 GPU 实测 58~60fps。

![Cocos 版僵尸围山门](examples/cocos/01-zombie-defense/shots/cocos-play.png)
![HTML 版僵尸围山门](examples/01-zombie-defense/shots/play.png)

## 3. 架构

```
一句话 → brief 解析（题材 × 基因 × 标题/关卡/横竖屏/引擎）
      → 内容生成（关卡曲线、单位/敌人/法术、章节、文案）
      → 固定壳层（标题/选关/战斗/暂停/结算/设置/说明/存档/合成音频）
      → HTML5：Canvas2D 渲染 → 自写打包器 → 单文件零外链
      → Cocos：GameRoot 宿主 + CanvasSurface（Canvas2D→Graphics/Label 桥）→ Cocos 工程 → CLI 构建
      → 交付闸：数据/仿真/单文件/浏览器（HTML）｜结构/构建/无头 WebGL 冒烟（Cocos）
```

- Cocos 端与 HTML 端共用 `content`（关卡/数值/主题）与 `rules`（update/pointer/bot），只替换渲染/输入/循环宿主。
- Cocos 绘制桥覆盖 Canvas2D 子集：路径/填充/文字/渐变/变换/裁剪；离屏背景一次性转为静态 Graphics 节点。
- 已知近似：径向光晕与暗角省略、阴影忽略、虚线近似、clip 仅轴对齐矩形；文字用 Label，总在图形之上。

## 4. 复现

```bash
# 插件已安装后，对话里直接说：
#   "做一个僵尸围山门的塔防，30关横屏"            → HTML5
#   "用 Cocos 做一个海底钩爪打捞，24关竖屏"        → Cocos 工程

# 或走 CLI
node engine/forge.mjs genres
node engine/forge.mjs plan  --brief "用 Cocos 做一个僵尸塔防，30关横屏"
node engine/forge.mjs forge --brief "做一个僵尸塔防，30关横屏" --dir /tmp/demo-html
node engine/forge.mjs forge --brief "做一个僵尸塔防，30关横屏" --dir /tmp/demo-cocos --engine cocos
node engine/forge.mjs check --dir /tmp/demo-cocos
```

Cocos 工程内：`bash tools/build-web.sh` 构建，`node tools/cocos-smoke.mjs --project .` 冒烟并截图。

## 5. 已知边界

- 美术为程序化占位风格，不是正式素材；替换入口：HTML `js/art.js`、Cocos `CanvasSurface.ts` / 项目资源。
- 音频为 WebAudio 合成；Cocos 原生平台建议替换为 AudioSource。
- 不生成联机玩法；Cocos 档只产出工程与 Web Mobile 构建，原生安装包需在 Cocos Creator 中构建（需对应平台 SDK）。
- 无头浏览器为软件渲染，FPS 数字不代表真机性能。
- 插件 UI 的 locale/icon/preview 已按 DSH 规范提供，页面实际渲染效果需在 GUI 中确认。

## 6. 相关文档

- [游戏开发方法论](PLAYBOOK.md)（14 个项目 + Cocos 双运行时经验）
- [作业手册（随包 skill）](../skills/game-studio/SKILL.md)
- [演示索引](../examples/README.md)
