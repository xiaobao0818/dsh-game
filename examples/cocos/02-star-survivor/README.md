# 星海幸存者 · Cocos Creator 3.8 版

> 走位躲潮，自动攻击；升级三选一，撑到 Boss 倒下。

**太空科幻 · 无人机的冒险** · 太空科幻 · 24 关 · 1280×720 · Cocos Creator 3.8.8

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

- 触屏：按住屏幕任意处拖动，角色朝拖动方向移动（虚拟摇杆）
- 桌面：WASD / 方向键移动，也可以按住鼠标拖动
- 自动攻击最近的敌人，不需要点攻击；升级时点击卡牌或按 1 / 2 / 3
- Esc / P 暂停（外壳按钮在右上角）

## 目标

拖动走位、武器自动开火，在尸潮里活到倒计时归零。击杀掉经验宝石，升级时暂停三选一强化；每关最后刷出 Boss，活过倒计时即胜利（提前击杀 Boss 也能立刻结束）。

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

- 渲染：Cocos Graphics + Label；玩法逻辑/内容与 HTML 版完全同源，改 `game/content.ts` 或 `game/rules/survivor.ts` 即可。
- 已知近似：Cocos 端不渲染径向光晕与阴影，渐变按包围盒/条带近似；文字用 Label 渲染（总在图形之上）。
- 生成信息：基因 `survivor`、主题 `space`、种子 `2425638784`。
