# 老小区归位 · Cocos Creator 3.8 版

> 把队列里的物件送进有限环道，凑满同色整排清空；顺序就是策略。

**都市夜景 · 保安的冒险** · 都市夜景 · 25 关 · 720×1280 · Cocos Creator 3.8.8

## 打开 / 构建

1. 用 Cocos Creator 3.8.8 打开本目录（首次导入资源约 1~2 分钟）。
2. 编辑器里直接预览：打开 `assets/scenes/Main.scene` 点预览。
3. 命令行构建 Web Mobile：
   ```bash
   bash tools/build-web.sh          # 产物 build/web-mobile/index.html
   node tools/cocos-smoke.mjs --project .   # 无头 Chrome 冒烟 + 截图
   ```
   也可以用 Cocos 构建面板导出 Android / iOS / 鸿蒙（安装 Cocos 对应平台支持后）。

## 操作

- 点「候车队列」里的任意物件，送入环道（只能点最前面几个）
- 环道自动前进：最前面的物件同色车位开着就自动入位
- 车位凑满 4 个同色 → 整排清空得分；连锁清空分数更高
- 点环道最前面的物件可以「退回」队列最前，用来救堵塞（每关 3 次）

## 目标

把候车队列里的物件全部清空。点物件送进环道，环道每拍把最前面的物件送给同色车位；车位凑齐 4 个同色就整排清空。把环道塞死就输了。

## 结构

```
assets/scenes/Main.scene        场景（Canvas + Camera + GameRoot）
assets/scripts/GameRoot.ts      Cocos 宿主：触摸/鼠标/键盘 → 游戏；驱动主循环
assets/scripts/CanvasSurface.ts Canvas2D→Cocos Graphics/Label 桥（同一套绘制代码）
assets/scripts/game/            与 HTML 版同源的游戏模块（core/app/art/content/rules）
tools/build-web.sh              Cocos CLI 构建
tools/cocos-smoke.mjs           无头 Chrome 冒烟（启动/战斗/结算/截图）
settings/                       Cocos 3.8 项目配置（设计分辨率 720×1280）
```

## 说明

- 渲染：Cocos Graphics + Label；玩法逻辑/内容与 HTML 版完全同源，改 `game/content.ts` 或 `game/rules/sort.ts` 即可。
- 已知近似：Cocos 端不渲染径向光晕与阴影，渐变按包围盒/条带近似；文字用 Label 渲染（总在图形之上）。
- 生成信息：基因 `sort`、主题 `city`、种子 `450703099`。
