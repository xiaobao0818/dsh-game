# 僵尸围山门 · Cocos Creator 3.8 版

> 造屋自动派兵，与来敌在一条战线上对冲；资源滚雪球，法术救场。

**中式僵尸 · 法师的冒险** · 中式僵尸 · 30 关 · 1280×720 · Cocos Creator 3.8.8

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

- 点击下方建筑卡：消耗铜钱建造；再点同类型卡片升级
- 点击右下角法术图标，再点战场释放（天雷 / 五雷正法 / 三昧真火）
- 击杀敌人获得铜钱，通关获得星级

## 目标

造屋自动派兵，挡住从右侧涌来的游尸潮，守住山门。漏怪会啃山门，耐久归零就失败。

## 结构

```
assets/scenes/Main.scene        场景（Canvas + Camera + GameRoot）
assets/scripts/GameRoot.ts      Cocos 宿主：触摸/鼠标/键盘 → 游戏；驱动主循环
assets/scripts/CanvasSurface.ts Canvas2D→Cocos Graphics/Label 桥（同一套绘制代码）
assets/scripts/game/            与 HTML 版同源的游戏模块（core/app/art/content/rules）
tools/build-web.sh              Cocos CLI 构建
tools/cocos-smoke.mjs           无头 Chrome 冒烟（启动/战斗/结算/截图）
settings/                       Cocos 3.8 项目配置（设计分辨率 1280×720）
```

## 说明

- 渲染：Cocos Graphics + Label；玩法逻辑/内容与 HTML 版完全同源，改 `game/content.ts` 或 `game/rules/horde.ts` 即可。
- 已知近似：Cocos 端不渲染径向光晕与阴影，渐变按包围盒/条带近似；文字用 Label 渲染（总在图形之上）。
- 生成信息：基因 `horde`、主题 `jiangshi`、种子 `1095070646`。
