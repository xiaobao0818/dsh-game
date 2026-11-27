# 三十天开播 · Cocos Creator 3.8 版

> 按天经营，选节目/员工/升级，滚大收益，在期限内达成目标。

**都市夜景 · 保安的生意** · 都市夜景 · 24 关 · 720×1280 · Cocos Creator 3.8.8

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

- 点员工卡「招募」：花行动点 + 铜钱雇人，自动产出
- 点下方员工头像：花行动点 + 铜钱升级（最高 Lv.5）
- 点「升级场地」：加容量、加单价，但每日租金变高
- 点节目按钮：当天收入/粉丝加成（每天限一次）
- 点「开始营业」进入当日结算，结算面板里点「下一天」继续

## 目标

30 天为一轮：每天花行动点招人或升级，点「开始营业」结算当日收益。第 30 天结束时，营业额与粉丝都达到目标即通关；中途发不出工资或租金就算破产失败。

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

- 渲染：Cocos Graphics + Label；玩法逻辑/内容与 HTML 版完全同源，改 `game/content.ts` 或 `game/rules/idle.ts` 即可。
- 已知近似：Cocos 端不渲染径向光晕与阴影，渐变按包围盒/条带近似；文字用 Label 渲染（总在图形之上）。
- 生成信息：基因 `idle`、主题 `city`、种子 `1245917665`。
