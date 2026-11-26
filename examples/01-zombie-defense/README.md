# 僵尸围山门

> 造屋自动派兵，与来敌在一条战线上对冲；资源滚雪球，法术救场。

**中式僵尸 · 法师的冒险** · 中式僵尸 · 30 关 · 横屏

## 一句话

做一个僵尸围山门的塔防，30关，手机横屏

## 直接玩

- 单文件离线版：`dist/僵尸围山门.html`（双击打开，零外部请求）
- 工程版：`node tools/serve.mjs 8080` → http://127.0.0.1:8080

## 操作

- 点击下方建筑卡：消耗铜钱建造；再点同类型卡片升级
- 点击右下角法术图标，再点战场释放（天雷 / 五雷正法 / 三昧真火）
- 击杀敌人获得铜钱，通关获得星级

## 目标

造屋自动派兵，挡住从右侧涌来的游尸潮，守住山门。漏怪会啃山门，耐久归零就失败。

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
js/rules/horde.js 玩法规则（可手改）
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

生成信息：基因 `horde`、主题 `jiangshi`、种子 `1095070646`、工程 `horde-i3z5x2`。
