# 火锅店合成记 · Cocos Creator 3.8 版

> 同级单位两两合成，越合越强；自动攻击来敌，守住底线。

**厨房餐厅 · 采购员的冒险** · 厨房餐厅 · 24 关 · 720×1280 · Cocos Creator 3.8.8

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

- 点「召唤」：花 10 营业额，在随机空格生成 1 级单位
- 点一个单位选中（高亮），再点另一个同级单位 → 合体升级
- 点选后点空位 / 不同级单位 → 交换位置；也能直接拖动单位
- 点「出售」把选中的单位换回部分金币，用来腾格子

## 目标

用「营业额」召唤单位，两个同级合体升一级（最高 6 级）；单位自动向中路来敌射击。敌人走到城门会扣基地耐久，耐久归零即失败，坚持到最后一波全灭就算通关。

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

- 渲染：Cocos Graphics + Label；玩法逻辑/内容与 HTML 版完全同源，改 `game/content.ts` 或 `game/rules/merge.ts` 即可。
- 已知近似：Cocos 端不渲染径向光晕与阴影，渐变按包围盒/条带近似；文字用 Label 渲染（总在图形之上）。
- 生成信息：基因 `merge`、主题 `kitchen`、种子 `202101286`。
