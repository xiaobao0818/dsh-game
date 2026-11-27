# Changelog

## 1.1.0

- 新增 Cocos Creator 3.8 运行时：生成可打开的 Cocos 工程（场景 / TS 脚本 / 项目配置 / 构建与冒烟脚本）。
- 新增 `CanvasSurface`：把同一套 Canvas2D 游戏代码桥接到 Cocos `Graphics` + `Label`，HTML 与 Cocos 共用 `content` / `rules`。
- `game_forge` 支持 `engine: "html" | "cocos"`（描述含 Cocos 时自动选择）；`game_build` / `game_check` 自动识别工程类型。
- 新增 Cocos 交付自检：Cocos CLI 构建 + 无头 Chrome(WebGL, swiftshader) 启动/战斗/结算冒烟 + 截图。
- 性能优化：离屏背景缓存一次性转为静态 Graphics 节点；补齐 bezier / clip / drawImage / 渐变 / 字体适配与回退。
- 新增 6 款 Cocos 演示工程（`examples/cocos/`），HTML 演示全部用新引擎重新生成并验收。
- 文档：PLAYBOOK 新增双运行时章节；skill / README / locale 更新；新增交付说明 `docs/DELIVERY.md`。

## 1.0.0

- 首个版本：DSH 插件 + 生成引擎，支持一句话生成 HTML5 完整游戏（6 种玩法基因 × 10 套题材）。
- 交付物：多文件工程 + 单文件离线版（Canvas 程序化美术 / WebAudio 合成 / localStorage 存档）。
- 自检：数据校验、机器人逐关仿真、单文件零外链、无头 Chrome 截图与 FPS。
- 6 款演示游戏与《游戏开发方法论》。
