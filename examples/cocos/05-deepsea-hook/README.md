# 深海打捞 · Cocos Creator 3.8 版

> 摆钩抓宝，越重越慢；限时达标，升级钩爪。

**海底打捞 · 深海机师的冒险** · 海底打捞 · 24 关 · 720×1280 · Cocos Creator 3.8.8

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

- 点击屏幕 / 空格：沿当前摆动方向发射钩爪
- 抓到宝物加分；越重的宝物回收越慢
- 危险物（废旧/爆裂/危险生物）会扣分，抓到爆弹还会短暂僵直
- 关卡开始前可以用金币升级：力度 / 绞盘 / 瞄准 / 幸运

## 目标

站在海底木筏上摆动钩爪，把水里的宝物抓回来。每关限时，得分达到目标分即过关；提前达标可点底部收工按钮结算，剩下的时间继续捞可以拿更高星级。

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

- 渲染：Cocos Graphics + Label；玩法逻辑/内容与 HTML 版完全同源，改 `game/content.ts` 或 `game/rules/hook.ts` 即可。
- 已知近似：Cocos 端不渲染径向光晕与阴影，渐变按包围盒/条带近似；文字用 Label 渲染（总在图形之上）。
- 生成信息：基因 `hook`、主题 `ocean`、种子 `2630291758`。
