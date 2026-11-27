---
name: game-studio
description: 游戏工坊：把一句玩法描述变成完整可玩的 HTML5 游戏或 Cocos Creator 3.8 工程，或按已沉淀的流水线手工开发/迭代游戏。用于"做一个小游戏/复刻某玩法/把原型做成完整游戏/要 Cocos 工程做多端发行/加关卡加美术加音效/游戏上线前自检"，也用于审查游戏工程质量与移动端体验。
---

# 游戏工坊 · 作业手册

一句话 → 完整游戏。本技能配套 5 个工具：`game_genres` / `game_plan` / `game_forge` / `game_build` / `game_check`。
支持两种运行时：

- **HTML5（默认）**：零依赖、零外部请求、双击即玩的单文件 HTML5 游戏（Canvas 程序化美术 + WebAudio 合成 + localStorage 存档）；
- **Cocos Creator 3.8**：生成可打开的 Cocos 工程（场景/TS 脚本/项目配置齐全），与 HTML 版共用同一套内容与规则，
  可用 Cocos CLI 构建 Web/Android/iOS/鸿蒙（`bash tools/build-web.sh`）。

两种目标都保留可编辑的多文件工程（内容表与规则分离）。

## 1. 什么时候用哪个工具

| 用户说 | 动作 |
|---|---|
| "做一个小游戏：……" / "复刻这个玩法" | 直接 `game_forge({brief, dir})`，一句话即可；不要先写代码 |
| "要 Cocos 工程 / 要能打包安卓鸿蒙 / 用 Cocos 做" | `game_forge({brief, dir, engine: "cocos"})`；描述里出现 Cocos 也会自动选 Cocos |
| "先看看你会做成什么" / 描述很模糊 | `game_plan({brief})` 确认题材/基因/标题/关卡数，再 forge |
| "换个题材/换风格/改关卡数" | 重新 `game_forge`（新 dir），或改 `js/content.js` 的 theme/levels 后 `game_build` |
| "改玩法/加机制/修 bug" | 编辑工程 `js/rules/<genre>.js` 或 `js/content.js` → `game_build` → `game_check` |
| "上线前检查/手机能不能玩" | `game_check({dir})`，看 `shots/` 截图与 `check-report.json` |
| "生成的新游戏打不开/不好玩" | 先 `game_check` 拿到失败项，再按 §10 的坑排查 |

`dir` 用工作区内新目录（英文/拼音），例如 `<workspace>/games/moon-defense`。默认不覆盖非空目录。

## 1.5 两种运行时怎么选

| | HTML5 | Cocos Creator 3.8 |
|---|---|---|
| 交付物 | `dist/<名>.html` 单文件，双击即玩 | Cocos 工程 + `build/web-mobile/index.html`（可再接 Android/iOS/鸿蒙导出） |
| 适合 | 网页/小游戏平台/IAA 试玩/邮件附件 | 需要接 Cocos 生态、原生包、团队美术动效、渠道发行 |
| 构建 | 自写零依赖打包器，秒级 | Cocos CLI，首次约 40~60s（引擎缓存后 5~20s） |
| 自检 | 数据 + 机器人逐关仿真 + 单文件 + 无头 Chrome | 工程结构 + Cocos CLI 构建 + 无头 Chrome(WebGL) 启动/战斗/结算 + 截图 |
| 渲染 | Canvas2D 立即模式，视觉最接近设计 | Cocos Graphics + Label 桥（同一套绘制代码）；径向光晕/阴影/虚线为近似或省略 |
| 性能 | 60fps（本机） | 真机/有 GPU 60fps；无头软件渲染约 20~26fps，勿据此判死 |

选型原则：**先用 HTML 验证玩法与数值**（快、可视化验收成本最低），玩法成立后再 `engine: "cocos"` 出工程做多端与美术升级。

## 2. 交付闸（六道，缺一不可）

1. **数据校验**：关卡 id 从 1 连续、章节全覆盖、无 NaN/Infinity。
2. **无头仿真**：机器人策略以固定 1/60 步长逐关试玩，**全部通关**；且"摆烂不操作"应基本不通关（证明有挑战）。
3. **单文件构建**：`dist/<名>.html` 内联全部 JS/CSS，**零 src/href 外部引用**，体积受控（< 350KB 为佳）。
4. **浏览器冒烟**：无头 Chrome 打开工程版，无异常/console.error，FPS ≥ 45，截图落盘。
5. **截图人工验收**：标题/选关/战斗/结算/暂停 + 手机竖屏或横屏各看一遍，无遮挡、可读、按钮可点。
6. **可玩性**：3 秒看懂目标、30 秒完成一次完整循环（开始→操作→反馈→结算→下一关）。

任何一道不过就不算"完整游戏"。`game_forge` 默认全跑；大改后必须再跑 `game_check`。

## 3. 工程骨架（生成物，可直接改）

```
index.html / css/style.css      入口与基础样式（自适应、禁用选择/缩放、启动遮罩）
js/core.js                      纯逻辑：数学、可复现 RNG、版本化存档（可在 Node 跑）
js/platform.js                  布局/WebAudio/粒子/输入（浏览器专用）
js/render.js                    绘制工具：面板/按钮/文字/进度/星星/图标
js/art.js                       程序化美术：按主题调色板绘制场景/角色/建筑/投射物
js/app.js                       外壳：固定步长主循环、场景栈、存档、暂停、结算、设置
js/content.js                   全部内容数据：theme / chapters / levels / defs（数值都在这）
js/rules/<genre>.js             玩法规则：init/update/drawWorld/drawHUD/pointer/bot
tools/{serve,build-single,headless,sim,check}.mjs
docs/{DESIGN,TESTING}.md        README.md、game.json（生成记录）
```

铁律：**规则层不碰 DOM、不碰 canvas 于 update 中**；`update()` 只吃 `dt` 与注入的 `rng`，这样才能在 Node 里无头仿真。
场景外壳（标题/选关/暂停/结算/设置/说明）已实现，新玩法只写规则与内容。

## 4. 玩法设计公式（从 12 个上线项目提炼）

- **一个动词**：先定玩家每 5 秒重复的动词（造/合成/投/躲/抓/选），所有系统围绕它。
- **核心循环**：`操作 → 即时反馈（飘字/粒子/音效/屏震）→ 资源 → 更大操作`。资源必须有出口（升级/建造/消耗）。
- **局内 90~180 秒**：3~6 个波次/阶段，首段教学、中段加压、末段 Boss；击杀/得分/连击给多巴胺。
- **难度锯齿**：Boss 关比前一关高 1.1~1.65 倍，Boss 后回落 0.6~0.8 倍，而不是一条直线。
- **局外长线**：星级/金币/解锁/图鉴/无尽，给重玩理由；首通奖励 > 重复刷。
- **失败要快**：死因看得懂、1 秒内可重开、不扣资源。
- **表演 > 系统**：同屏数字、慢镜、特写、环境粒子，比再加一套系统更划算。

## 5. 内容与数值

- **数据驱动**：所有关卡/单位/敌人/升级进 `content.js`，规则只读表；禁止把数值散落在绘制代码。
- **预算曲线**：敌人血量/数量 = `base × growth^(关)`，玩家侧靠金币滚雪球与升级抵消；每关跑仿真校准。
- **关卡生成三阶段**（解谜类）：构造 → 门禁（可解性/步数上限/难度区间）→ 候选池按目标胜率挑选；生成器必须确定性（seed）。
- **Boss**：独立形态+一个必须应对的机制（高护甲→法术、召唤→AOE、冲锋→控制）；血量按"击杀时间 25~45 秒"定。
- **经济**：产出/消耗比控制在 1.15~1.35；首关给 2~3 次建造的选择空间，后期靠升级而不是无限加建筑。

## 6. 表现层（程序化美术）

- **palette 单一色源**：所有颜色来自 `theme.palette`；`fill/stroke/logo/背景` 不写死色值，换题材=换一个对象。
- **分层**：天空渐变 → 远景剪影 → 中景 → 地面 → 实体（按 y 排序）→ 粒子 → HUD。
- **角色配方**：身体/头/眼睛/武器由 `art.char` 统一定义，靠 role/kind/tier 变化；比逐张画省 10 倍代码。
- **动效**：呼吸缩放、走路摆腿、受击白闪、死亡爆散、飘字、屏震、冲击环；每 0.3 秒内必须有反馈。
- **UI**：圆角面板 + 金色描边 + 高光条；按钮有按下位移；禁用态降饱和并给出原因（"铜钱不足"）。
- **安全区**：所有 HUD 距边 ≥ 16px（设计分辨率），竖屏注意顶部刘海与底部手势条。

## 7. 音频（WebAudio，零素材）

- 必须**用户手势后** `ensure()` 创建 AudioContext；页面切后台时暂停音乐、回来重对齐。
- 音效配方：`tone({type,freq,dur,gain,slide})` + `noise({dur,gain,freq,filter})` 组合出 点击/金币/命中/爆炸/升级/胜利/失败。
- BGM：五声/小调音阶 + 4 小节和弦循环 + 琶音；`setInterval` 预排（不要用 rAF，后台会冻结），同曲不重启。
- 设置里音乐/音效独立开关，写进存档；默认开启但绝不自动播放人声/大音量。

## 8. 移动端与单文件

- 设计分辨率固定（横 1280×720 / 竖 720×1280），按 `min(vw/W, vh/H)` 等比缩放并居中；canvas 按 DPR 渲染（上限 2）。
- 触摸：`pointerdown/move/up` + `touch-action:none`；按钮命中区 ≥ 44×44 设计像素；别用 hover 作为唯一反馈。
- 单文件：自写 ESM→IIFE 打包器，内联 CSS/JS；构建后**断言**无 `import/export` 残留、无外部 `src/href`、`new Function` 语法通过。
- 体积：程序化美术的游戏一般 60~300KB；超过 1MB 要先查是不是把大 JSON/base64 塞进去了。
- `file://` 下 `fetch`/`<img src>` 会失败：单文件必须构建期内联，不能运行时加载。

## 9. 存档 / 商业化

- 存档 schema 带版本号 + `deepMerge(DEFAULT, saved)` 迁移；坏档回退默认而不是崩。
- 记录：`unlocked/stars/best/coins/settings/stats`；页面隐藏时 flush；导入/重置时抑制自动保存，防旧内存覆盖。
- IAA：激励视频只在"主动选择"处（复活/翻倍/抽奖），`onReward` 才发奖、`onClose` 必回调一次；插屏间隔 ≥ 90 秒；离线降级为无广告但功能完整。
- 广告/支付不得阻断首局 30 秒体验。

## 10. 测试与常见坑

**测试组合**（生成物里已带）：
- `tools/sim.mjs`：Node 直接 import 规则 + 固定步长 + 机器人；断言全通关、时长区间、debug 数值有限。
- `tools/headless.mjs`：静态服务 + 无头 Chrome/CDP；收集 `exceptionThrown`/`console.error`/`Log`，点击、截图、读 `window.__game` 诊断。
- `tools/check.mjs`：把上面串起来 + 单文件离线断言，输出 `check-report.json`。
- 回归方式：每修一个 bug，把它写成 check 里的断言，而不是只改代码。

**真实踩过的坑（按症状）**：
1. 规则里用了 DOM/window → Node 仿真直接崩；改成注入服务（audio/fx 空实现）。
2. 用了 `Math.random` → 关卡不可复现、测试飘；统一 `svc.rng`（mulberry32）。
3. 生成物某个字段 `undefined` 参与数值 → `NaN` 扩散（敌人打不死、进度卡住）；仿真里断言 debug 数值 `Number.isFinite`。
4. 指针坐标没换算设计分辨率 → 按钮点不中；统一 `layout.toDesign()`。
5. HUD 绘制后才更新命中区 → 第一帧点不到；在 `init()` 里算好 `rule.ui` 命中矩形。
6. 移动端安全区/横屏 CTA 掉出视口 → 竖屏与横屏各截一张图检查。
7. 启动遮罩没移除、音频未解锁 → 用户"点了没反应"；启动层点击即 `begin()`。
8. 单文件残留外链/字体 → 断网白屏；构建后断言零外部引用。
9. 文档与代码漂移（数值公式只在文档里改）→ 公式必须有单点断言，或只写在一处。
10. 帧率塌方：每帧 new 对象/重建路径太多 → 复用数组/路径缓存；目标中端机 60fps。
11. Cocos 端 `window.__game` 没就绪 → GameRoot 的 `start()` 里异常被吞；先看浏览器控制台 `[GS] ready` 日志。
12. Cocos CLI 构建偶发非 0 退出但产物已生成 → 以 `build/web-mobile/index.html` 是否存在为准，按脚本重试 3 次。
13. Cocos 无头冒烟必须带 WebGL 软件渲染参数（`--enable-unsafe-swiftshader --use-angle=swiftshader`），否则黑屏。
14. 改 Cocos 工程后不重新构建就发版 → `game_build` 会强制跑一次 Cocos CLI 构建，产物与源码版本一致。

## 11. 生成之后怎么继续做

1. **换皮**：改 `content.js` 的 `theme`（调色板/mood/词库）→ `game_build`；不需要动代码。
2. **加关卡**：在 `levels` 里按同一 schema 追加；必须保持难度单调并重跑 `game_check`（仿真会逐关验）。
3. **加机制**：在 `rules` 里加状态与 `pointer` 分支；先加机器人策略（bot），保证可仿真再打磨表现。
4. **接正式美术**：`art.js` 里每个绘制函数改成"有图用图、无图程序化"的双轨制（`if (img) drawImage...; return;`）；
   资源清单（manifest）晚于代码，缺图不能 404/白屏。
5. **接正式音频/配音**：音频 manifest 记录源文件/裁切/字节，构建期内联为 base64；循环 BGM 用 WAV 防接缝。
6. **上线前**：`game_check` 全绿 → `shots/` 人工过一遍 → 真机（iOS Safari / Android Chrome / 鸿蒙 ArkWeb）各跑一次
   → 检查首屏时间、包体、断网、后台切回、存档迁移。

## 12. 汇报口径

给用户的回执包含：一句话结论、工程目录、单文件路径（可直接双击）、自检数字（模拟通关率/体积/FPS）、
3 条"接下来可以怎么改"、以及明确未验证项（如真机、正式素材授权）。不要把内部日志整段贴给用户。
