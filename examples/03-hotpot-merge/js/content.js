/* =========================================================================
 * content.js —— 全部玩法内容数据（由「游戏工坊」生成，可直接手改）
 * 主题：厨房餐厅 · 基因：merge · 关卡：24
 * 改完运行：node tools/build-single.mjs && node tools/check.mjs
 * ========================================================================= */

export const CONTENT = {
  "slug": "merge-dev",
  "genre": "merge",
  "title": "火锅店合成记",
  "subtitle": "厨房餐厅 · 采购员的冒险",
  "tagline": "同级单位两两合成，越合越强；自动攻击来敌，守住底线。",
  "orientation": "portrait",
  "config": {
    "seed": 202101286,
    "maxLevel": 24
  },
  "theme": {
    "id": "kitchen",
    "name": "厨房餐厅",
    "mood": "day",
    "keywords": [
      "厨房",
      "餐厅",
      "美食",
      "厨师",
      "做饭",
      "料理",
      "小吃",
      "火锅",
      "甜品",
      "奶茶",
      "早餐",
      "面包",
      "kitchen",
      "cook",
      "food",
      "restaurant"
    ],
    "palette": {
      "sky": [
        "#fff1d6",
        "#ffd9b0"
      ],
      "ground": "#b5651d",
      "groundDark": "#7a3f12",
      "accent": "#ff6b35",
      "accent2": "#ffd166",
      "hero": "#ffe9c7",
      "hero2": "#c98a4b",
      "enemy": "#8f5a3c",
      "enemy2": "#52301c",
      "gold": "#ffc93c",
      "danger": "#e63946",
      "ok": "#7bd389",
      "ui": "rgba(60,32,16,.85)",
      "ui2": "rgba(255,255,255,.16)",
      "ink": "#3a1f10",
      "text": "#ffffff"
    },
    "music": {
      "root": -4,
      "scale": [
        0,
        2,
        4,
        7,
        9
      ],
      "tempo": 112
    },
    "vocab": {
      "hero": [
        "帮厨",
        "厨师长",
        "面点师",
        "服务员",
        "采购员",
        "甜点师"
      ],
      "enemy": [
        "老鼠",
        "蟑螂",
        "挑剔客",
        "差评师",
        "食安员",
        "隔壁老板"
      ],
      "boss": [
        "美食评论家",
        "米其林密探",
        "大胃王",
        "黑心供应商"
      ],
      "building": [
        "灶台",
        "蒸笼",
        "冰柜",
        "收银台",
        "外卖窗口",
        "后厨"
      ],
      "item": [
        "面团",
        "辣椒",
        "鸡蛋",
        "青菜",
        "汤底",
        "糖霜",
        "烤串",
        "饭盒"
      ],
      "place": [
        "大排档",
        "面馆",
        "火锅店",
        "甜品铺",
        "美食街",
        "后巷"
      ],
      "power": [
        "大火爆炒",
        "秘制酱料",
        "摆盘",
        "免费加料",
        "外卖加速",
        "招牌菜"
      ],
      "currency": "营业额"
    }
  },
  "chapters": [
    {
      "name": "后巷",
      "levels": [
        1,
        2,
        3,
        4,
        5
      ]
    },
    {
      "name": "火锅店",
      "levels": [
        6,
        7,
        8,
        9,
        10
      ]
    },
    {
      "name": "甜品铺",
      "levels": [
        11,
        12,
        13,
        14,
        15
      ]
    },
    {
      "name": "美食街",
      "levels": [
        16,
        17,
        18,
        19,
        20
      ]
    },
    {
      "name": "大排档",
      "levels": [
        21,
        22,
        23,
        24
      ]
    }
  ],
  "help": {
    "goal": "用「营业额」召唤单位，两个同级合体升一级（最高 6 级）；单位自动向中路来敌射击。敌人走到城门会扣基地耐久，耐久归零即失败，坚持到最后一波全灭就算通关。",
    "controls": [
      "点「召唤」：花 10 营业额，在随机空格生成 1 级单位",
      "点一个单位选中（高亮），再点另一个同级单位 → 合体升级",
      "点选后点空位 / 不同级单位 → 交换位置；也能直接拖动单位",
      "点「出售」把选中的单位换回部分金币，用来腾格子"
    ],
    "tips": [
      "合并永远是赚的：两个同级合成后攻击与射程都会变强",
      "上排格子离路更近，射程覆盖更远，优先把主力放上排",
      "金币只来自击杀：输出越高滚雪球越快，别把 营业额 一直攒着",
      "棋盘满且暂时合不动时，先把低级单位卖掉腾格子",
      "星级看基地剩余耐久：掉血越少，结算星级越高",
      "每 5 关是 Boss 关（红色格子），留好高等级单位再开波"
    ]
  },
  "defs": {
    "board": {
      "name": "灶台",
      "cols": 5,
      "rows": 2,
      "summonCost": 10,
      "maxTier": 6,
      "currency": "营业额"
    },
    "tiers": [
      {
        "tier": 1,
        "name": "帮厨",
        "atk": 7,
        "cd": 0.62,
        "range": 382,
        "sell": 4
      },
      {
        "tier": 2,
        "name": "厨师长",
        "atk": 16,
        "cd": 0.6,
        "range": 404,
        "sell": 8
      },
      {
        "tier": 3,
        "name": "面点师",
        "atk": 35,
        "cd": 0.58,
        "range": 426,
        "sell": 16
      },
      {
        "tier": 4,
        "name": "服务员",
        "atk": 74,
        "cd": 0.56,
        "range": 449,
        "sell": 32
      },
      {
        "tier": 5,
        "name": "采购员",
        "atk": 155,
        "cd": 0.54,
        "range": 472,
        "sell": 64
      },
      {
        "tier": 6,
        "name": "甜点师",
        "atk": 330,
        "cd": 0.52,
        "range": 496,
        "sell": 128
      }
    ],
    "enemies": [
      {
        "id": "grunt",
        "name": "老鼠",
        "hp": 30,
        "speed": 46,
        "gold": 6,
        "dmg": 9,
        "r": 13,
        "gap": 0.7,
        "boss": false
      },
      {
        "id": "runner",
        "name": "蟑螂",
        "hp": 24,
        "speed": 78,
        "gold": 6,
        "dmg": 8,
        "r": 11,
        "gap": 0.45,
        "boss": false
      },
      {
        "id": "brute",
        "name": "挑剔客",
        "hp": 100,
        "speed": 34,
        "gold": 14,
        "dmg": 15,
        "r": 17,
        "gap": 0.95,
        "boss": false
      },
      {
        "id": "boss1",
        "name": "美食评论家",
        "hp": 460,
        "speed": 30,
        "gold": 66,
        "dmg": 40,
        "r": 26,
        "gap": 1,
        "boss": true
      },
      {
        "id": "boss2",
        "name": "米其林密探",
        "hp": 460,
        "speed": 30,
        "gold": 66,
        "dmg": 40,
        "r": 26,
        "gap": 1,
        "boss": true
      },
      {
        "id": "boss3",
        "name": "大胃王",
        "hp": 460,
        "speed": 30,
        "gold": 66,
        "dmg": 40,
        "r": 26,
        "gap": 1,
        "boss": true
      },
      {
        "id": "boss4",
        "name": "黑心供应商",
        "hp": 460,
        "speed": 30,
        "gold": 66,
        "dmg": 40,
        "r": 26,
        "gap": 1,
        "boss": true
      }
    ]
  },
  "levels": [
    {
      "id": 1,
      "chapter": 1,
      "name": "老鼠来袭",
      "boss": false,
      "baseHp": 90,
      "startGold": 40,
      "summonCost": 10,
      "scale": {
        "hp": 0.9,
        "bossHp": 1,
        "speed": 0.92,
        "gold": 1
      },
      "waves": [
        {
          "at": 5,
          "hpMul": 0.55,
          "groups": [
            {
              "type": "grunt",
              "count": 2,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 17,
          "hpMul": 1,
          "groups": [
            {
              "type": "grunt",
              "count": 4,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 29,
          "hpMul": 1.45,
          "groups": [
            {
              "type": "grunt",
              "count": 5,
              "gap": 0.7,
              "delay": 0
            }
          ]
        }
      ]
    },
    {
      "id": 2,
      "chapter": 1,
      "name": "老鼠成群",
      "boss": false,
      "baseHp": 94,
      "startGold": 45,
      "summonCost": 10,
      "scale": {
        "hp": 1.161,
        "bossHp": 1,
        "speed": 0.934,
        "gold": 1.033
      },
      "waves": [
        {
          "at": 5,
          "hpMul": 0.55,
          "groups": [
            {
              "type": "grunt",
              "count": 3,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 17,
          "hpMul": 1,
          "groups": [
            {
              "type": "grunt",
              "count": 4,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 29,
          "hpMul": 1.45,
          "groups": [
            {
              "type": "grunt",
              "count": 6,
              "gap": 0.7,
              "delay": 0
            }
          ]
        }
      ]
    },
    {
      "id": 3,
      "chapter": 1,
      "name": "老鼠出没",
      "boss": false,
      "baseHp": 98,
      "startGold": 50,
      "summonCost": 10,
      "scale": {
        "hp": 1.479,
        "bossHp": 1,
        "speed": 0.948,
        "gold": 1.065
      },
      "waves": [
        {
          "at": 5,
          "hpMul": 0.55,
          "groups": [
            {
              "type": "grunt",
              "count": 3,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 17,
          "hpMul": 1,
          "groups": [
            {
              "type": "grunt",
              "count": 5,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 29,
          "hpMul": 1.45,
          "groups": [
            {
              "type": "grunt",
              "count": 6,
              "gap": 0.7,
              "delay": 0
            }
          ]
        }
      ]
    },
    {
      "id": 4,
      "chapter": 1,
      "name": "老鼠压境",
      "boss": false,
      "baseHp": 102,
      "startGold": 55,
      "summonCost": 10,
      "scale": {
        "hp": 1.823,
        "bossHp": 1,
        "speed": 0.962,
        "gold": 1.098
      },
      "waves": [
        {
          "at": 5,
          "hpMul": 0.55,
          "groups": [
            {
              "type": "grunt",
              "count": 4,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 16,
          "hpMul": 1,
          "groups": [
            {
              "type": "grunt",
              "count": 5,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 27,
          "hpMul": 1.45,
          "groups": [
            {
              "type": "grunt",
              "count": 7,
              "gap": 0.7,
              "delay": 0
            }
          ]
        }
      ]
    },
    {
      "id": 5,
      "chapter": 1,
      "name": "美食评论家",
      "boss": true,
      "baseHp": 106,
      "startGold": 60,
      "summonCost": 10,
      "scale": {
        "hp": 2.284,
        "bossHp": 3.652,
        "speed": 0.976,
        "gold": 1.13
      },
      "waves": [
        {
          "at": 5,
          "hpMul": 0.55,
          "groups": [
            {
              "type": "grunt",
              "count": 4,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 16,
          "hpMul": 1,
          "groups": [
            {
              "type": "grunt",
              "count": 6,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 27,
          "hpMul": 1.45,
          "groups": [
            {
              "type": "grunt",
              "count": 7,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 38,
          "hpMul": 1.9,
          "groups": [
            {
              "type": "grunt",
              "count": 9,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 49,
          "hpMul": 1,
          "groups": [
            {
              "type": "boss1",
              "count": 1,
              "gap": 1,
              "delay": 0
            }
          ],
          "boss": true
        }
      ]
    },
    {
      "id": 6,
      "chapter": 2,
      "name": "蟑螂来袭",
      "boss": false,
      "baseHp": 110,
      "startGold": 65,
      "summonCost": 10,
      "scale": {
        "hp": 2.56,
        "bossHp": 1,
        "speed": 0.99,
        "gold": 1.163
      },
      "waves": [
        {
          "at": 5,
          "hpMul": 0.55,
          "groups": [
            {
              "type": "grunt",
              "count": 5,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 16,
          "hpMul": 1,
          "groups": [
            {
              "type": "runner",
              "count": 6,
              "gap": 0.45,
              "delay": 0
            }
          ]
        },
        {
          "at": 27,
          "hpMul": 1.45,
          "groups": [
            {
              "type": "grunt",
              "count": 4,
              "gap": 0.7,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.45,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 38,
          "hpMul": 1.9,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.45,
              "delay": 0
            },
            {
              "type": "grunt",
              "count": 4,
              "gap": 0.7,
              "delay": 2.4
            }
          ]
        }
      ]
    },
    {
      "id": 7,
      "chapter": 2,
      "name": "蟑螂成群",
      "boss": false,
      "baseHp": 113,
      "startGold": 70,
      "summonCost": 10,
      "scale": {
        "hp": 2.947,
        "bossHp": 1,
        "speed": 1.003,
        "gold": 1.196
      },
      "waves": [
        {
          "at": 5,
          "hpMul": 0.55,
          "groups": [
            {
              "type": "grunt",
              "count": 5,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 16,
          "hpMul": 1,
          "groups": [
            {
              "type": "runner",
              "count": 6,
              "gap": 0.45,
              "delay": 0
            }
          ]
        },
        {
          "at": 27,
          "hpMul": 1.45,
          "groups": [
            {
              "type": "grunt",
              "count": 4,
              "gap": 0.7,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.45,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 38,
          "hpMul": 1.9,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.45,
              "delay": 0
            },
            {
              "type": "grunt",
              "count": 4,
              "gap": 0.7,
              "delay": 2.4
            }
          ]
        }
      ]
    },
    {
      "id": 8,
      "chapter": 2,
      "name": "蟑螂出没",
      "boss": false,
      "baseHp": 117,
      "startGold": 75,
      "summonCost": 10,
      "scale": {
        "hp": 3.344,
        "bossHp": 1,
        "speed": 1.017,
        "gold": 1.228
      },
      "waves": [
        {
          "at": 5,
          "hpMul": 0.55,
          "groups": [
            {
              "type": "grunt",
              "count": 5,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 16,
          "hpMul": 1,
          "groups": [
            {
              "type": "runner",
              "count": 7,
              "gap": 0.45,
              "delay": 0
            }
          ]
        },
        {
          "at": 27,
          "hpMul": 1.45,
          "groups": [
            {
              "type": "grunt",
              "count": 4,
              "gap": 0.7,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.45,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 38,
          "hpMul": 1.9,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.45,
              "delay": 0
            },
            {
              "type": "grunt",
              "count": 5,
              "gap": 0.7,
              "delay": 2.4
            }
          ]
        }
      ]
    },
    {
      "id": 9,
      "chapter": 2,
      "name": "蟑螂压境",
      "boss": false,
      "baseHp": 121,
      "startGold": 80,
      "summonCost": 10,
      "scale": {
        "hp": 3.75,
        "bossHp": 1,
        "speed": 1.031,
        "gold": 1.261
      },
      "waves": [
        {
          "at": 5,
          "hpMul": 0.55,
          "groups": [
            {
              "type": "grunt",
              "count": 6,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 16,
          "hpMul": 1,
          "groups": [
            {
              "type": "runner",
              "count": 7,
              "gap": 0.45,
              "delay": 0
            }
          ]
        },
        {
          "at": 27,
          "hpMul": 1.45,
          "groups": [
            {
              "type": "grunt",
              "count": 5,
              "gap": 0.7,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.45,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 38,
          "hpMul": 1.9,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.45,
              "delay": 0
            },
            {
              "type": "grunt",
              "count": 5,
              "gap": 0.7,
              "delay": 2.4
            }
          ]
        }
      ]
    },
    {
      "id": 10,
      "chapter": 2,
      "name": "米其林密探",
      "boss": true,
      "baseHp": 125,
      "startGold": 85,
      "summonCost": 10,
      "scale": {
        "hp": 4.263,
        "bossHp": 4.217,
        "speed": 1.045,
        "gold": 1.293
      },
      "waves": [
        {
          "at": 5,
          "hpMul": 0.55,
          "groups": [
            {
              "type": "grunt",
              "count": 6,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 16,
          "hpMul": 1,
          "groups": [
            {
              "type": "runner",
              "count": 8,
              "gap": 0.45,
              "delay": 0
            }
          ]
        },
        {
          "at": 27,
          "hpMul": 1.45,
          "groups": [
            {
              "type": "grunt",
              "count": 5,
              "gap": 0.7,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.45,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 38,
          "hpMul": 1.9,
          "groups": [
            {
              "type": "runner",
              "count": 6,
              "gap": 0.45,
              "delay": 0
            },
            {
              "type": "grunt",
              "count": 5,
              "gap": 0.7,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 49,
          "hpMul": 1,
          "groups": [
            {
              "type": "boss2",
              "count": 1,
              "gap": 1,
              "delay": 0
            }
          ],
          "boss": true
        }
      ]
    },
    {
      "id": 11,
      "chapter": 3,
      "name": "挑剔客来袭",
      "boss": false,
      "baseHp": 129,
      "startGold": 90,
      "summonCost": 10,
      "scale": {
        "hp": 4.584,
        "bossHp": 1,
        "speed": 1.059,
        "gold": 1.326
      },
      "waves": [
        {
          "at": 5,
          "hpMul": 0.55,
          "groups": [
            {
              "type": "grunt",
              "count": 7,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 16,
          "hpMul": 1,
          "groups": [
            {
              "type": "runner",
              "count": 8,
              "gap": 0.45,
              "delay": 0
            }
          ]
        },
        {
          "at": 27,
          "hpMul": 1.45,
          "groups": [
            {
              "type": "brute",
              "count": 5,
              "gap": 0.95,
              "delay": 0
            },
            {
              "type": "grunt",
              "count": 5,
              "gap": 0.7,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 38,
          "hpMul": 1.9,
          "groups": [
            {
              "type": "grunt",
              "count": 6,
              "gap": 0.7,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 5,
              "gap": 0.45,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 49,
          "hpMul": 2.35,
          "groups": [
            {
              "type": "runner",
              "count": 4,
              "gap": 0.45,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.95,
              "delay": 2.4
            },
            {
              "type": "grunt",
              "count": 5,
              "gap": 0.7,
              "delay": 4.8
            }
          ]
        }
      ]
    },
    {
      "id": 12,
      "chapter": 3,
      "name": "挑剔客成群",
      "boss": false,
      "baseHp": 133,
      "startGold": 95,
      "summonCost": 10,
      "scale": {
        "hp": 5.01,
        "bossHp": 1,
        "speed": 1.073,
        "gold": 1.359
      },
      "waves": [
        {
          "at": 5,
          "hpMul": 0.55,
          "groups": [
            {
              "type": "grunt",
              "count": 7,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 16,
          "hpMul": 1,
          "groups": [
            {
              "type": "runner",
              "count": 9,
              "gap": 0.45,
              "delay": 0
            }
          ]
        },
        {
          "at": 27,
          "hpMul": 1.45,
          "groups": [
            {
              "type": "brute",
              "count": 5,
              "gap": 0.95,
              "delay": 0
            },
            {
              "type": "grunt",
              "count": 5,
              "gap": 0.7,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 38,
          "hpMul": 1.9,
          "groups": [
            {
              "type": "grunt",
              "count": 6,
              "gap": 0.7,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 6,
              "gap": 0.45,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 49,
          "hpMul": 2.35,
          "groups": [
            {
              "type": "runner",
              "count": 4,
              "gap": 0.45,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.95,
              "delay": 2.4
            },
            {
              "type": "grunt",
              "count": 5,
              "gap": 0.7,
              "delay": 4.8
            }
          ]
        }
      ]
    },
    {
      "id": 13,
      "chapter": 3,
      "name": "挑剔客出没",
      "boss": false,
      "baseHp": 137,
      "startGold": 100,
      "summonCost": 10,
      "scale": {
        "hp": 5.443,
        "bossHp": 1,
        "speed": 1.087,
        "gold": 1.391
      },
      "waves": [
        {
          "at": 5,
          "hpMul": 0.55,
          "groups": [
            {
              "type": "grunt",
              "count": 7,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 15,
          "hpMul": 1,
          "groups": [
            {
              "type": "runner",
              "count": 9,
              "gap": 0.45,
              "delay": 0
            }
          ]
        },
        {
          "at": 25,
          "hpMul": 1.45,
          "groups": [
            {
              "type": "brute",
              "count": 5,
              "gap": 0.95,
              "delay": 0
            },
            {
              "type": "grunt",
              "count": 5,
              "gap": 0.7,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 35,
          "hpMul": 1.9,
          "groups": [
            {
              "type": "grunt",
              "count": 6,
              "gap": 0.7,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 6,
              "gap": 0.45,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 45,
          "hpMul": 2.35,
          "groups": [
            {
              "type": "runner",
              "count": 4,
              "gap": 0.45,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.95,
              "delay": 2.4
            },
            {
              "type": "grunt",
              "count": 5,
              "gap": 0.7,
              "delay": 4.8
            }
          ]
        }
      ]
    },
    {
      "id": 14,
      "chapter": 3,
      "name": "挑剔客压境",
      "boss": false,
      "baseHp": 141,
      "startGold": 105,
      "summonCost": 10,
      "scale": {
        "hp": 5.881,
        "bossHp": 1,
        "speed": 1.101,
        "gold": 1.424
      },
      "waves": [
        {
          "at": 5,
          "hpMul": 0.55,
          "groups": [
            {
              "type": "grunt",
              "count": 8,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 15,
          "hpMul": 1,
          "groups": [
            {
              "type": "runner",
              "count": 9,
              "gap": 0.45,
              "delay": 0
            }
          ]
        },
        {
          "at": 25,
          "hpMul": 1.45,
          "groups": [
            {
              "type": "brute",
              "count": 6,
              "gap": 0.95,
              "delay": 0
            },
            {
              "type": "grunt",
              "count": 5,
              "gap": 0.7,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 35,
          "hpMul": 1.9,
          "groups": [
            {
              "type": "grunt",
              "count": 6,
              "gap": 0.7,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 6,
              "gap": 0.45,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 45,
          "hpMul": 2.35,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.45,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 5,
              "gap": 0.95,
              "delay": 2.4
            },
            {
              "type": "grunt",
              "count": 4,
              "gap": 0.7,
              "delay": 4.8
            }
          ]
        }
      ]
    },
    {
      "id": 15,
      "chapter": 3,
      "name": "大胃王",
      "boss": true,
      "baseHp": 145,
      "startGold": 110,
      "summonCost": 10,
      "scale": {
        "hp": 6.424,
        "bossHp": 4.783,
        "speed": 1.115,
        "gold": 1.457
      },
      "waves": [
        {
          "at": 5,
          "hpMul": 0.55,
          "groups": [
            {
              "type": "grunt",
              "count": 8,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 15,
          "hpMul": 1,
          "groups": [
            {
              "type": "runner",
              "count": 10,
              "gap": 0.45,
              "delay": 0
            }
          ]
        },
        {
          "at": 25,
          "hpMul": 1.45,
          "groups": [
            {
              "type": "brute",
              "count": 6,
              "gap": 0.95,
              "delay": 0
            },
            {
              "type": "grunt",
              "count": 5,
              "gap": 0.7,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 35,
          "hpMul": 1.9,
          "groups": [
            {
              "type": "grunt",
              "count": 7,
              "gap": 0.7,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 6,
              "gap": 0.45,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 45,
          "hpMul": 2.35,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.45,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 5,
              "gap": 0.95,
              "delay": 2.4
            },
            {
              "type": "grunt",
              "count": 4,
              "gap": 0.7,
              "delay": 4.8
            }
          ]
        },
        {
          "at": 55,
          "hpMul": 1,
          "groups": [
            {
              "type": "boss3",
              "count": 1,
              "gap": 1,
              "delay": 0
            }
          ],
          "boss": true
        }
      ]
    },
    {
      "id": 16,
      "chapter": 4,
      "name": "挑剔客来袭",
      "boss": false,
      "baseHp": 149,
      "startGold": 115,
      "summonCost": 10,
      "scale": {
        "hp": 6.772,
        "bossHp": 1,
        "speed": 1.129,
        "gold": 1.489
      },
      "waves": [
        {
          "at": 5,
          "hpMul": 0.55,
          "groups": [
            {
              "type": "grunt",
              "count": 9,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 15,
          "hpMul": 1,
          "groups": [
            {
              "type": "runner",
              "count": 10,
              "gap": 0.45,
              "delay": 0
            }
          ]
        },
        {
          "at": 25,
          "hpMul": 1.45,
          "groups": [
            {
              "type": "brute",
              "count": 6,
              "gap": 0.95,
              "delay": 0
            },
            {
              "type": "grunt",
              "count": 6,
              "gap": 0.7,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 35,
          "hpMul": 1.9,
          "groups": [
            {
              "type": "grunt",
              "count": 7,
              "gap": 0.7,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 6,
              "gap": 0.45,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 45,
          "hpMul": 2.35,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.45,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 5,
              "gap": 0.95,
              "delay": 2.4
            },
            {
              "type": "grunt",
              "count": 5,
              "gap": 0.7,
              "delay": 4.8
            }
          ]
        }
      ]
    },
    {
      "id": 17,
      "chapter": 4,
      "name": "挑剔客成群",
      "boss": false,
      "baseHp": 153,
      "startGold": 120,
      "summonCost": 10,
      "scale": {
        "hp": 7.224,
        "bossHp": 1,
        "speed": 1.143,
        "gold": 1.522
      },
      "waves": [
        {
          "at": 5,
          "hpMul": 0.55,
          "groups": [
            {
              "type": "grunt",
              "count": 9,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 15,
          "hpMul": 1,
          "groups": [
            {
              "type": "runner",
              "count": 11,
              "gap": 0.45,
              "delay": 0
            }
          ]
        },
        {
          "at": 25,
          "hpMul": 1.45,
          "groups": [
            {
              "type": "brute",
              "count": 6,
              "gap": 0.95,
              "delay": 0
            },
            {
              "type": "grunt",
              "count": 6,
              "gap": 0.7,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 35,
          "hpMul": 1.9,
          "groups": [
            {
              "type": "grunt",
              "count": 7,
              "gap": 0.7,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 7,
              "gap": 0.45,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 45,
          "hpMul": 2.35,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.45,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 5,
              "gap": 0.95,
              "delay": 2.4
            },
            {
              "type": "grunt",
              "count": 5,
              "gap": 0.7,
              "delay": 4.8
            }
          ]
        }
      ]
    },
    {
      "id": 18,
      "chapter": 4,
      "name": "挑剔客出没",
      "boss": false,
      "baseHp": 157,
      "startGold": 125,
      "summonCost": 10,
      "scale": {
        "hp": 7.681,
        "bossHp": 1,
        "speed": 1.157,
        "gold": 1.554
      },
      "waves": [
        {
          "at": 5,
          "hpMul": 0.55,
          "groups": [
            {
              "type": "grunt",
              "count": 10,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 15,
          "hpMul": 1,
          "groups": [
            {
              "type": "runner",
              "count": 11,
              "gap": 0.45,
              "delay": 0
            }
          ]
        },
        {
          "at": 25,
          "hpMul": 1.45,
          "groups": [
            {
              "type": "brute",
              "count": 7,
              "gap": 0.95,
              "delay": 0
            },
            {
              "type": "grunt",
              "count": 6,
              "gap": 0.7,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 35,
          "hpMul": 1.9,
          "groups": [
            {
              "type": "grunt",
              "count": 7,
              "gap": 0.7,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 7,
              "gap": 0.45,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 45,
          "hpMul": 2.35,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.45,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 5,
              "gap": 0.95,
              "delay": 2.4
            },
            {
              "type": "grunt",
              "count": 6,
              "gap": 0.7,
              "delay": 4.8
            }
          ]
        }
      ]
    },
    {
      "id": 19,
      "chapter": 4,
      "name": "挑剔客压境",
      "boss": false,
      "baseHp": 160,
      "startGold": 130,
      "summonCost": 10,
      "scale": {
        "hp": 8.142,
        "bossHp": 1,
        "speed": 1.17,
        "gold": 1.587
      },
      "waves": [
        {
          "at": 5,
          "hpMul": 0.55,
          "groups": [
            {
              "type": "grunt",
              "count": 10,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 15,
          "hpMul": 1,
          "groups": [
            {
              "type": "runner",
              "count": 11,
              "gap": 0.45,
              "delay": 0
            }
          ]
        },
        {
          "at": 25,
          "hpMul": 1.45,
          "groups": [
            {
              "type": "brute",
              "count": 7,
              "gap": 0.95,
              "delay": 0
            },
            {
              "type": "grunt",
              "count": 6,
              "gap": 0.7,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 35,
          "hpMul": 1.9,
          "groups": [
            {
              "type": "grunt",
              "count": 7,
              "gap": 0.7,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 7,
              "gap": 0.45,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 45,
          "hpMul": 2.35,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.45,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 5,
              "gap": 0.95,
              "delay": 2.4
            },
            {
              "type": "grunt",
              "count": 6,
              "gap": 0.7,
              "delay": 4.8
            }
          ]
        },
        {
          "at": 55,
          "hpMul": 2.8,
          "groups": [
            {
              "type": "brute",
              "count": 6,
              "gap": 0.95,
              "delay": 0
            },
            {
              "type": "grunt",
              "count": 6,
              "gap": 0.7,
              "delay": 2.4
            },
            {
              "type": "runner",
              "count": 5,
              "gap": 0.45,
              "delay": 4.8
            }
          ]
        }
      ]
    },
    {
      "id": 20,
      "chapter": 4,
      "name": "黑心供应商",
      "boss": true,
      "baseHp": 164,
      "startGold": 135,
      "summonCost": 10,
      "scale": {
        "hp": 8.706,
        "bossHp": 5.348,
        "speed": 1.184,
        "gold": 1.62
      },
      "waves": [
        {
          "at": 5,
          "hpMul": 0.55,
          "groups": [
            {
              "type": "grunt",
              "count": 10,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 15,
          "hpMul": 1,
          "groups": [
            {
              "type": "runner",
              "count": 12,
              "gap": 0.45,
              "delay": 0
            }
          ]
        },
        {
          "at": 25,
          "hpMul": 1.45,
          "groups": [
            {
              "type": "brute",
              "count": 7,
              "gap": 0.95,
              "delay": 0
            },
            {
              "type": "grunt",
              "count": 6,
              "gap": 0.7,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 35,
          "hpMul": 1.9,
          "groups": [
            {
              "type": "grunt",
              "count": 8,
              "gap": 0.7,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 7,
              "gap": 0.45,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 45,
          "hpMul": 2.35,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.45,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 5,
              "gap": 0.95,
              "delay": 2.4
            },
            {
              "type": "grunt",
              "count": 6,
              "gap": 0.7,
              "delay": 4.8
            }
          ]
        },
        {
          "at": 55,
          "hpMul": 2.8,
          "groups": [
            {
              "type": "brute",
              "count": 6,
              "gap": 0.95,
              "delay": 0
            },
            {
              "type": "grunt",
              "count": 6,
              "gap": 0.7,
              "delay": 2.4
            },
            {
              "type": "runner",
              "count": 6,
              "gap": 0.45,
              "delay": 4.8
            }
          ]
        },
        {
          "at": 65,
          "hpMul": 1,
          "groups": [
            {
              "type": "boss4",
              "count": 1,
              "gap": 1,
              "delay": 0
            }
          ],
          "boss": true
        }
      ]
    },
    {
      "id": 21,
      "chapter": 5,
      "name": "挑剔客来袭",
      "boss": false,
      "baseHp": 168,
      "startGold": 140,
      "summonCost": 10,
      "scale": {
        "hp": 9.075,
        "bossHp": 1,
        "speed": 1.198,
        "gold": 1.652
      },
      "waves": [
        {
          "at": 5,
          "hpMul": 0.55,
          "groups": [
            {
              "type": "grunt",
              "count": 11,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 15,
          "hpMul": 1,
          "groups": [
            {
              "type": "runner",
              "count": 12,
              "gap": 0.45,
              "delay": 0
            }
          ]
        },
        {
          "at": 25,
          "hpMul": 1.45,
          "groups": [
            {
              "type": "brute",
              "count": 7,
              "gap": 0.95,
              "delay": 0
            },
            {
              "type": "grunt",
              "count": 7,
              "gap": 0.7,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 35,
          "hpMul": 1.9,
          "groups": [
            {
              "type": "grunt",
              "count": 8,
              "gap": 0.7,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 7,
              "gap": 0.45,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 45,
          "hpMul": 2.35,
          "groups": [
            {
              "type": "runner",
              "count": 6,
              "gap": 0.45,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 6,
              "gap": 0.95,
              "delay": 2.4
            },
            {
              "type": "grunt",
              "count": 5,
              "gap": 0.7,
              "delay": 4.8
            }
          ]
        },
        {
          "at": 55,
          "hpMul": 2.8,
          "groups": [
            {
              "type": "brute",
              "count": 6,
              "gap": 0.95,
              "delay": 0
            },
            {
              "type": "grunt",
              "count": 6,
              "gap": 0.7,
              "delay": 2.4
            },
            {
              "type": "runner",
              "count": 6,
              "gap": 0.45,
              "delay": 4.8
            }
          ]
        }
      ]
    },
    {
      "id": 22,
      "chapter": 5,
      "name": "挑剔客成群",
      "boss": false,
      "baseHp": 172,
      "startGold": 145,
      "summonCost": 10,
      "scale": {
        "hp": 9.546,
        "bossHp": 1,
        "speed": 1.212,
        "gold": 1.685
      },
      "waves": [
        {
          "at": 5,
          "hpMul": 0.55,
          "groups": [
            {
              "type": "grunt",
              "count": 11,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 15,
          "hpMul": 1,
          "groups": [
            {
              "type": "runner",
              "count": 13,
              "gap": 0.45,
              "delay": 0
            }
          ]
        },
        {
          "at": 25,
          "hpMul": 1.45,
          "groups": [
            {
              "type": "brute",
              "count": 7,
              "gap": 0.95,
              "delay": 0
            },
            {
              "type": "grunt",
              "count": 7,
              "gap": 0.7,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 35,
          "hpMul": 1.9,
          "groups": [
            {
              "type": "grunt",
              "count": 8,
              "gap": 0.7,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 8,
              "gap": 0.45,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 45,
          "hpMul": 2.35,
          "groups": [
            {
              "type": "runner",
              "count": 6,
              "gap": 0.45,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 6,
              "gap": 0.95,
              "delay": 2.4
            },
            {
              "type": "grunt",
              "count": 5,
              "gap": 0.7,
              "delay": 4.8
            }
          ]
        },
        {
          "at": 55,
          "hpMul": 2.8,
          "groups": [
            {
              "type": "brute",
              "count": 6,
              "gap": 0.95,
              "delay": 0
            },
            {
              "type": "grunt",
              "count": 6,
              "gap": 0.7,
              "delay": 2.4
            },
            {
              "type": "runner",
              "count": 7,
              "gap": 0.45,
              "delay": 4.8
            }
          ]
        }
      ]
    },
    {
      "id": 23,
      "chapter": 5,
      "name": "挑剔客出没",
      "boss": false,
      "baseHp": 176,
      "startGold": 150,
      "summonCost": 10,
      "scale": {
        "hp": 10.022,
        "bossHp": 1,
        "speed": 1.226,
        "gold": 1.717
      },
      "waves": [
        {
          "at": 5,
          "hpMul": 0.55,
          "groups": [
            {
              "type": "grunt",
              "count": 12,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 15,
          "hpMul": 1,
          "groups": [
            {
              "type": "runner",
              "count": 13,
              "gap": 0.45,
              "delay": 0
            }
          ]
        },
        {
          "at": 25,
          "hpMul": 1.45,
          "groups": [
            {
              "type": "brute",
              "count": 8,
              "gap": 0.95,
              "delay": 0
            },
            {
              "type": "grunt",
              "count": 7,
              "gap": 0.7,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 35,
          "hpMul": 1.9,
          "groups": [
            {
              "type": "grunt",
              "count": 8,
              "gap": 0.7,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 8,
              "gap": 0.45,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 45,
          "hpMul": 2.35,
          "groups": [
            {
              "type": "runner",
              "count": 6,
              "gap": 0.45,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 6,
              "gap": 0.95,
              "delay": 2.4
            },
            {
              "type": "grunt",
              "count": 6,
              "gap": 0.7,
              "delay": 4.8
            }
          ]
        },
        {
          "at": 55,
          "hpMul": 2.8,
          "groups": [
            {
              "type": "brute",
              "count": 6,
              "gap": 0.95,
              "delay": 0
            },
            {
              "type": "grunt",
              "count": 6,
              "gap": 0.7,
              "delay": 2.4
            },
            {
              "type": "runner",
              "count": 7,
              "gap": 0.45,
              "delay": 4.8
            }
          ]
        }
      ]
    },
    {
      "id": 24,
      "chapter": 5,
      "name": "美食评论家",
      "boss": true,
      "baseHp": 180,
      "startGold": 155,
      "summonCost": 10,
      "scale": {
        "hp": 10.6,
        "bossHp": 5.8,
        "speed": 1.24,
        "gold": 1.75
      },
      "waves": [
        {
          "at": 5,
          "hpMul": 0.55,
          "groups": [
            {
              "type": "grunt",
              "count": 12,
              "gap": 0.7,
              "delay": 0
            }
          ]
        },
        {
          "at": 15,
          "hpMul": 1,
          "groups": [
            {
              "type": "runner",
              "count": 14,
              "gap": 0.45,
              "delay": 0
            }
          ]
        },
        {
          "at": 25,
          "hpMul": 1.45,
          "groups": [
            {
              "type": "brute",
              "count": 8,
              "gap": 0.95,
              "delay": 0
            },
            {
              "type": "grunt",
              "count": 7,
              "gap": 0.7,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 35,
          "hpMul": 1.9,
          "groups": [
            {
              "type": "grunt",
              "count": 9,
              "gap": 0.7,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 8,
              "gap": 0.45,
              "delay": 2.4
            }
          ]
        },
        {
          "at": 45,
          "hpMul": 2.35,
          "groups": [
            {
              "type": "runner",
              "count": 6,
              "gap": 0.45,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 6,
              "gap": 0.95,
              "delay": 2.4
            },
            {
              "type": "grunt",
              "count": 6,
              "gap": 0.7,
              "delay": 4.8
            }
          ]
        },
        {
          "at": 55,
          "hpMul": 2.8,
          "groups": [
            {
              "type": "brute",
              "count": 7,
              "gap": 0.95,
              "delay": 0
            },
            {
              "type": "grunt",
              "count": 7,
              "gap": 0.7,
              "delay": 2.4
            },
            {
              "type": "runner",
              "count": 6,
              "gap": 0.45,
              "delay": 4.8
            }
          ]
        },
        {
          "at": 65,
          "hpMul": 1,
          "groups": [
            {
              "type": "boss1",
              "count": 1,
              "gap": 1,
              "delay": 0
            }
          ],
          "boss": true
        }
      ]
    }
  ],
  "saveDefaults": {}
};
