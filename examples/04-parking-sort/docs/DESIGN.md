# 老小区归位 · 设计说明

## 主题

- 题材：都市夜景（dusk）
- 主色：#ffd76a / #ff5d8f
- 货币：营业额

## 核心循环

把候车队列里的物件全部清空。点物件送进环道，环道每拍把最前面的物件送给同色车位；车位凑齐 4 个同色就整排清空。把环道塞死就输了。

## 内容规模

- 关卡：25
- 章节：老小区 / 步行街 / 写字楼 / 地铁口 / 天台
- 定义表：beltCap(undefined)、laneCap(undefined)、windowMax(undefined)、pullCharges(undefined)、beat(undefined)、scorePerClear(undefined)、comboBonus(undefined)、starParScale(undefined)、colors(6)

## 关卡表（前 12 关）

| 关 | 名称 | Boss | 波次 |
|---|---|---|---|
| 1 | 老小区快递 |  |  |
| 2 | 老小区奶茶 |  |  |
| 3 | 老小区车钥匙 |  |  |
| 4 | 老小区外卖箱 |  |  |
| 5 | 难关 · 老小区门禁卡 | Boss |  |
| 6 | 步行街优惠券 |  |  |
| 7 | 步行街快递 |  |  |
| 8 | 步行街奶茶 |  |  |
| 9 | 步行街车钥匙 |  |  |
| 10 | 难关 · 步行街外卖箱 | Boss |  |
| 11 | 写字楼门禁卡 |  |  |
| 12 | 写字楼优惠券 |  |  |

## 调参入口

- 数值/关卡：`js/content.js`
- 玩法规则：`js/rules/sort.js`
- 主题配色：`js/content.js` 的 `theme.palette`
