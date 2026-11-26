# 星海幸存者

> 走位躲潮，自动攻击；升级三选一，撑到 Boss 倒下。

**太空科幻 · 无人机的冒险** · 太空科幻 · 24 关 · 横屏

## 一句话

太空科幻题材的割草生存，24关，横屏

## 直接玩

- 单文件离线版：`dist/星海幸存者.html`（双击打开，零外部请求）
- 工程版：`node tools/serve.mjs 8080` → http://127.0.0.1:8080

## 操作

- 触屏：按住屏幕任意处拖动，角色朝拖动方向移动（虚拟摇杆）
- 桌面：WASD / 方向键移动，也可以按住鼠标拖动
- 自动攻击最近的敌人，不需要点攻击；升级时点击卡牌或按 1 / 2 / 3
- Esc / P 暂停（外壳按钮在右上角）

## 目标

拖动走位、武器自动开火，在尸潮里活到倒计时归零。击杀掉经验宝石，升级时暂停三选一强化；每关最后刷出 Boss，活过倒计时即胜利（提前击杀 Boss 也能立刻结束）。

## 工程结构

```
index.html            入口
css/style.css         基础样式
js/core.js            纯逻辑：数学/随机/存档（可在 Node 跑）
js/platform.js        布局/WebAudio/粒子/输入
js/render.js          绘制工具
js/art.js             程序化美术（主题调色板）
js/app.js             外壳：场景/主循环/存档/暂停
js/content.js         全部内容数据（可手改）
js/rules/survivor.js 玩法规则（可手改）
tools/                预览/构建/无头仿真/浏览器冒烟/自检
docs/                 设计说明与测试报告
```

## 自检

```bash
node tools/build-single.mjs   # 单文件构建
node tools/sim.mjs            # 无头仿真（机器人全关通关）
node tools/check.mjs          # 数据+仿真+单文件+浏览器冒烟
```

## 说明

全部美术为 Canvas 程序化绘制，音乐音效为 WebAudio 实时合成，无第三方素材；存档只写本机 localStorage。

生成信息：基因 `survivor`、主题 `space`、种子 `2425638784`、工程 `survivor-dev`。
