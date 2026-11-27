// @ts-nocheck
/* 全部玩法内容（由游戏工坊生成，可直接手改；改完重新构建） */
export const CONTENT = {
  "slug": "horde-i3z5x2",
  "genre": "horde",
  "title": "僵尸围山门",
  "subtitle": "中式僵尸 · 法师的冒险",
  "tagline": "造屋自动派兵，与来敌在一条战线上对冲；资源滚雪球，法术救场。",
  "orientation": "landscape",
  "config": {
    "seed": 1095070646,
    "maxLevel": 30
  },
  "theme": {
    "id": "jiangshi",
    "name": "中式僵尸",
    "mood": "night",
    "keywords": [
      "僵尸",
      "道士",
      "符",
      "道观",
      "山门",
      "中式",
      "民俗",
      "鬼",
      "冥",
      "尸",
      "江南",
      "古风",
      "武侠",
      "僵尸围城",
      "jiangshi",
      "zombie",
      "taoist"
    ],
    "palette": {
      "sky": [
        "#0d1024",
        "#2a1633"
      ],
      "ground": "#3b2b3f",
      "groundDark": "#211827",
      "accent": "#ffcf5c",
      "accent2": "#ff7a59",
      "hero": "#8fd3ff",
      "hero2": "#3f7ea8",
      "enemy": "#c85a6a",
      "enemy2": "#6f2436",
      "gold": "#ffd76a",
      "danger": "#ff5d5d",
      "ok": "#62d68f",
      "ui": "rgba(14,18,32,.86)",
      "ui2": "rgba(255,255,255,.12)",
      "ink": "#0d1024",
      "text": "#ffffff"
    },
    "music": {
      "root": -9,
      "scale": [
        0,
        2,
        4,
        7,
        9
      ],
      "tempo": 78
    },
    "vocab": {
      "hero": [
        "道童",
        "弩手",
        "法师",
        "医师",
        "剑客",
        "符师"
      ],
      "enemy": [
        "游尸",
        "跳尸",
        "铁尸",
        "巫尸",
        "尸傀",
        "飞僵"
      ],
      "boss": [
        "跳尸王",
        "血尸",
        "铜甲尸将",
        "飞僵将军",
        "尸母",
        "旱魃"
      ],
      "building": [
        "草庐",
        "箭楼",
        "法阵",
        "医庐",
        "符箓堂",
        "天师殿"
      ],
      "item": [
        "铜钱",
        "符纸",
        "纸人",
        "糯米",
        "桃木剑",
        "铃铛",
        "灯笼",
        "罗盘"
      ],
      "place": [
        "荒村",
        "山门",
        "乱葬岗",
        "鬼市",
        "尸王殿",
        "后山"
      ],
      "power": [
        "天雷",
        "五雷正法",
        "三昧真火",
        "冰封",
        "回春",
        "符阵"
      ],
      "currency": "铜钱"
    }
  },
  "chapters": [
    {
      "name": "荒村",
      "levels": [
        1,
        2,
        3,
        4,
        5,
        6
      ]
    },
    {
      "name": "山门",
      "levels": [
        7,
        8,
        9,
        10,
        11,
        12
      ]
    },
    {
      "name": "乱葬岗",
      "levels": [
        13,
        14,
        15,
        16,
        17,
        18
      ]
    },
    {
      "name": "鬼市",
      "levels": [
        19,
        20,
        21,
        22,
        23,
        24
      ]
    },
    {
      "name": "尸王殿",
      "levels": [
        25,
        26,
        27,
        28,
        29,
        30
      ]
    }
  ],
  "help": {
    "goal": "造屋自动派兵，挡住从右侧涌来的游尸潮，守住山门。漏怪会啃山门，耐久归零就失败。",
    "controls": [
      "点击下方建筑卡：消耗铜钱建造；再点同类型卡片升级",
      "点击右下角法术图标，再点战场释放（天雷 / 五雷正法 / 三昧真火）",
      "击杀敌人获得铜钱，通关获得星级"
    ],
    "tips": [
      "前排先造草庐扛线，后排箭楼与法阵输出",
      "铜钱优先升 1~2 个主力建筑，别摊太薄",
      "Boss 波留好大招与急救"
    ]
  },
  "defs": {
    "buildings": [
      {
        "id": "barracks",
        "name": "草庐",
        "role": "melee",
        "cost": 60,
        "interval": 4.2,
        "desc": "派出近战单位"
      },
      {
        "id": "archery",
        "name": "箭楼",
        "role": "ranged",
        "cost": 80,
        "interval": 4.6,
        "desc": "远程持续输出"
      },
      {
        "id": "mage",
        "name": "法阵",
        "role": "mage",
        "cost": 110,
        "interval": 5.6,
        "desc": "范围伤害"
      },
      {
        "id": "heal",
        "name": "医庐",
        "role": "heal",
        "cost": 90,
        "interval": 6,
        "desc": "治疗前排单位"
      }
    ],
    "units": [
      {
        "role": "melee",
        "name": "道童",
        "hp": 62,
        "atk": 13,
        "range": 26,
        "cd": 0.75,
        "speed": 62,
        "radius": 11
      },
      {
        "role": "ranged",
        "name": "弩手",
        "hp": 42,
        "atk": 11,
        "range": 190,
        "cd": 0.95,
        "speed": 52,
        "radius": 10
      },
      {
        "role": "mage",
        "name": "法师",
        "hp": 38,
        "atk": 19,
        "range": 165,
        "cd": 1.5,
        "speed": 46,
        "radius": 10,
        "aoe": 46
      },
      {
        "role": "heal",
        "name": "医师",
        "hp": 46,
        "atk": 0,
        "range": 150,
        "cd": 1.4,
        "speed": 48,
        "radius": 10,
        "heal": 16
      }
    ],
    "enemies": [
      {
        "id": "walker",
        "name": "游尸",
        "hp": 52,
        "atk": 9,
        "speed": 34,
        "range": 24,
        "cd": 0.9,
        "gold": 7,
        "radius": 11
      },
      {
        "id": "runner",
        "name": "跳尸",
        "hp": 34,
        "atk": 8,
        "speed": 66,
        "range": 22,
        "cd": 0.8,
        "gold": 8,
        "radius": 10
      },
      {
        "id": "brute",
        "name": "铁尸",
        "hp": 150,
        "atk": 18,
        "speed": 24,
        "range": 26,
        "cd": 1.1,
        "gold": 18,
        "radius": 15
      },
      {
        "id": "boss",
        "name": "跳尸王",
        "hp": 900,
        "atk": 34,
        "speed": 22,
        "range": 34,
        "cd": 1.2,
        "gold": 120,
        "radius": 22,
        "boss": true
      }
    ],
    "spells": [
      {
        "id": "thunder",
        "name": "天雷",
        "cd": 15,
        "radius": 132,
        "dmg": 95,
        "unlock": 1
      },
      {
        "id": "frost",
        "name": "五雷",
        "cd": 20,
        "radius": 150,
        "dmg": 26,
        "slow": 0.45,
        "slowT": 3.2,
        "unlock": 4
      },
      {
        "id": "heal",
        "name": "三昧",
        "cd": 24,
        "radius": 9999,
        "heal": 45,
        "unlock": 7
      }
    ]
  },
  "levels": [
    {
      "id": 1,
      "chapter": 1,
      "name": "荒村前线",
      "startGold": 150,
      "baseHp": 120,
      "scale": {
        "hp": 0.82,
        "atk": 0.85,
        "speed": 0.95
      },
      "waves": [
        {
          "at": 5,
          "groups": [
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            }
          ]
        },
        {
          "at": 18,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            }
          ]
        },
        {
          "at": 31,
          "groups": [
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 3,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        }
      ],
      "boss": false
    },
    {
      "id": 2,
      "chapter": 1,
      "name": "山门夜",
      "startGold": 150,
      "baseHp": 120,
      "scale": {
        "hp": 0.86,
        "atk": 0.879,
        "speed": 0.958
      },
      "waves": [
        {
          "at": 5,
          "groups": [
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            }
          ]
        },
        {
          "at": 18,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            }
          ]
        },
        {
          "at": 31,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        }
      ],
      "boss": false
    },
    {
      "id": 3,
      "chapter": 1,
      "name": "乱葬岗哨站",
      "startGold": 150,
      "baseHp": 120,
      "scale": {
        "hp": 0.899,
        "atk": 0.909,
        "speed": 0.965
      },
      "waves": [
        {
          "at": 5,
          "groups": [
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            }
          ]
        },
        {
          "at": 18,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            }
          ]
        },
        {
          "at": 31,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        }
      ],
      "boss": false
    },
    {
      "id": 4,
      "chapter": 1,
      "name": "鬼市山谷",
      "startGold": 175,
      "baseHp": 120,
      "scale": {
        "hp": 0.939,
        "atk": 0.938,
        "speed": 0.973
      },
      "waves": [
        {
          "at": 5,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            }
          ]
        },
        {
          "at": 18,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            }
          ]
        },
        {
          "at": 31,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        }
      ],
      "boss": false
    },
    {
      "id": 5,
      "chapter": 1,
      "name": "跳尸王",
      "startGold": 175,
      "baseHp": 120,
      "scale": {
        "hp": 1.099,
        "atk": 0.967,
        "speed": 0.98
      },
      "waves": [
        {
          "at": 5,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            }
          ]
        },
        {
          "at": 18,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            }
          ]
        },
        {
          "at": 31,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 44,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 5,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 57,
          "groups": [
            {
              "type": "boss",
              "count": 1,
              "gap": 1,
              "delay": 0
            }
          ],
          "boss": true
        }
      ],
      "boss": true
    },
    {
      "id": 6,
      "chapter": 2,
      "name": "后山关隘",
      "startGold": 175,
      "baseHp": 120,
      "scale": {
        "hp": 1.018,
        "atk": 0.997,
        "speed": 0.988
      },
      "waves": [
        {
          "at": 5,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            }
          ]
        },
        {
          "at": 18,
          "groups": [
            {
              "type": "runner",
              "count": 6,
              "gap": 0.85,
              "delay": 0
            }
          ]
        },
        {
          "at": 31,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 44,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 5,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        }
      ],
      "boss": false
    },
    {
      "id": 7,
      "chapter": 2,
      "name": "荒村废墟",
      "startGold": 175,
      "baseHp": 120,
      "scale": {
        "hp": 1.058,
        "atk": 1.026,
        "speed": 0.996
      },
      "waves": [
        {
          "at": 5,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            }
          ]
        },
        {
          "at": 20,
          "groups": [
            {
              "type": "runner",
              "count": 6,
              "gap": 0.85,
              "delay": 0
            }
          ]
        },
        {
          "at": 35,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 50,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 5,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        }
      ],
      "boss": false
    },
    {
      "id": 8,
      "chapter": 2,
      "name": "山门阵地",
      "startGold": 175,
      "baseHp": 120,
      "scale": {
        "hp": 1.098,
        "atk": 1.055,
        "speed": 1.003
      },
      "waves": [
        {
          "at": 5,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            }
          ]
        },
        {
          "at": 20,
          "groups": [
            {
              "type": "runner",
              "count": 6,
              "gap": 0.85,
              "delay": 0
            }
          ]
        },
        {
          "at": 35,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 50,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 5,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        }
      ],
      "boss": false
    },
    {
      "id": 9,
      "chapter": 2,
      "name": "乱葬岗入口",
      "startGold": 175,
      "baseHp": 120,
      "scale": {
        "hp": 1.137,
        "atk": 1.084,
        "speed": 1.011
      },
      "waves": [
        {
          "at": 5,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            }
          ]
        },
        {
          "at": 20,
          "groups": [
            {
              "type": "runner",
              "count": 6,
              "gap": 0.85,
              "delay": 0
            }
          ]
        },
        {
          "at": 35,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 50,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 5,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        }
      ],
      "boss": false
    },
    {
      "id": 10,
      "chapter": 2,
      "name": "血尸",
      "startGold": 175,
      "baseHp": 120,
      "scale": {
        "hp": 1.297,
        "atk": 1.114,
        "speed": 1.018
      },
      "waves": [
        {
          "at": 5,
          "groups": [
            {
              "type": "walker",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            }
          ]
        },
        {
          "at": 20,
          "groups": [
            {
              "type": "runner",
              "count": 6,
              "gap": 0.85,
              "delay": 0
            }
          ]
        },
        {
          "at": 35,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 50,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 5,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 65,
          "groups": [
            {
              "type": "boss",
              "count": 1,
              "gap": 1,
              "delay": 0
            }
          ],
          "boss": true
        }
      ],
      "boss": true
    },
    {
      "id": 11,
      "chapter": 3,
      "name": "尸王殿最后防线",
      "startGold": 200,
      "baseHp": 120,
      "scale": {
        "hp": 1.217,
        "atk": 1.143,
        "speed": 1.026
      },
      "waves": [
        {
          "at": 5,
          "groups": [
            {
              "type": "walker",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            }
          ]
        },
        {
          "at": 20,
          "groups": [
            {
              "type": "runner",
              "count": 6,
              "gap": 0.85,
              "delay": 0
            }
          ]
        },
        {
          "at": 35,
          "groups": [
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 50,
          "groups": [
            {
              "type": "walker",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        }
      ],
      "boss": false
    },
    {
      "id": 12,
      "chapter": 3,
      "name": "后山决战",
      "startGold": 200,
      "baseHp": 120,
      "scale": {
        "hp": 1.256,
        "atk": 1.172,
        "speed": 1.033
      },
      "waves": [
        {
          "at": 5,
          "groups": [
            {
              "type": "walker",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            }
          ]
        },
        {
          "at": 20,
          "groups": [
            {
              "type": "runner",
              "count": 7,
              "gap": 0.85,
              "delay": 0
            }
          ]
        },
        {
          "at": 35,
          "groups": [
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 50,
          "groups": [
            {
              "type": "walker",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        }
      ],
      "boss": false
    },
    {
      "id": 13,
      "chapter": 3,
      "name": "荒村前线",
      "startGold": 200,
      "baseHp": 120,
      "scale": {
        "hp": 1.296,
        "atk": 1.202,
        "speed": 1.041
      },
      "waves": [
        {
          "at": 5,
          "groups": [
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 3,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 20,
          "groups": [
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 35,
          "groups": [
            {
              "type": "brute",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "runner",
              "count": 3,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 50,
          "groups": [
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 3,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "brute",
              "count": 3,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 65,
          "groups": [
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        }
      ],
      "boss": false
    },
    {
      "id": 14,
      "chapter": 3,
      "name": "山门夜",
      "startGold": 200,
      "baseHp": 120,
      "scale": {
        "hp": 1.336,
        "atk": 1.231,
        "speed": 1.049
      },
      "waves": [
        {
          "at": 5,
          "groups": [
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 3,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 20,
          "groups": [
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 35,
          "groups": [
            {
              "type": "brute",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "runner",
              "count": 3,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 50,
          "groups": [
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 3,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "brute",
              "count": 3,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 65,
          "groups": [
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        }
      ],
      "boss": false
    },
    {
      "id": 15,
      "chapter": 3,
      "name": "铜甲尸将",
      "startGold": 200,
      "baseHp": 120,
      "scale": {
        "hp": 1.495,
        "atk": 1.26,
        "speed": 1.056
      },
      "waves": [
        {
          "at": 5,
          "groups": [
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 3,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 20,
          "groups": [
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 35,
          "groups": [
            {
              "type": "brute",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "runner",
              "count": 3,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 50,
          "groups": [
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 3,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "brute",
              "count": 3,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 65,
          "groups": [
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 80,
          "groups": [
            {
              "type": "boss",
              "count": 1,
              "gap": 1,
              "delay": 0
            }
          ],
          "boss": true
        }
      ],
      "boss": true
    },
    {
      "id": 16,
      "chapter": 4,
      "name": "鬼市山谷",
      "startGold": 200,
      "baseHp": 120,
      "scale": {
        "hp": 1.415,
        "atk": 1.29,
        "speed": 1.064
      },
      "waves": [
        {
          "at": 5,
          "groups": [
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 3,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 20,
          "groups": [
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 35,
          "groups": [
            {
              "type": "brute",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "runner",
              "count": 3,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 50,
          "groups": [
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 3,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "brute",
              "count": 3,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 65,
          "groups": [
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        }
      ],
      "boss": false
    },
    {
      "id": 17,
      "chapter": 4,
      "name": "尸王殿桥头",
      "startGold": 200,
      "baseHp": 120,
      "scale": {
        "hp": 1.454,
        "atk": 1.319,
        "speed": 1.071
      },
      "waves": [
        {
          "at": 5,
          "groups": [
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 3,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 20,
          "groups": [
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 35,
          "groups": [
            {
              "type": "brute",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "runner",
              "count": 3,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 50,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 65,
          "groups": [
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        }
      ],
      "boss": false
    },
    {
      "id": 18,
      "chapter": 4,
      "name": "后山关隘",
      "startGold": 200,
      "baseHp": 120,
      "scale": {
        "hp": 1.494,
        "atk": 1.348,
        "speed": 1.079
      },
      "waves": [
        {
          "at": 5,
          "groups": [
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 3,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 20,
          "groups": [
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 35,
          "groups": [
            {
              "type": "brute",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "runner",
              "count": 3,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 50,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 65,
          "groups": [
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        }
      ],
      "boss": false
    },
    {
      "id": 19,
      "chapter": 4,
      "name": "荒村废墟",
      "startGold": 200,
      "baseHp": 120,
      "scale": {
        "hp": 1.534,
        "atk": 1.378,
        "speed": 1.087
      },
      "waves": [
        {
          "at": 5,
          "groups": [
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 3,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 20,
          "groups": [
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 35,
          "groups": [
            {
              "type": "brute",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "runner",
              "count": 3,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 50,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 65,
          "groups": [
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        }
      ],
      "boss": false
    },
    {
      "id": 20,
      "chapter": 4,
      "name": "飞僵将军",
      "startGold": 200,
      "baseHp": 120,
      "scale": {
        "hp": 1.693,
        "atk": 1.407,
        "speed": 1.094
      },
      "waves": [
        {
          "at": 5,
          "groups": [
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 3,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 20,
          "groups": [
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 35,
          "groups": [
            {
              "type": "brute",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "runner",
              "count": 3,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 50,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 65,
          "groups": [
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 80,
          "groups": [
            {
              "type": "boss",
              "count": 1,
              "gap": 1,
              "delay": 0
            }
          ],
          "boss": true
        }
      ],
      "boss": true
    },
    {
      "id": 21,
      "chapter": 5,
      "name": "乱葬岗入口",
      "startGold": 200,
      "baseHp": 120,
      "scale": {
        "hp": 1.613,
        "atk": 1.436,
        "speed": 1.102
      },
      "waves": [
        {
          "at": 5,
          "groups": [
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 3,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 20,
          "groups": [
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 35,
          "groups": [
            {
              "type": "brute",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "runner",
              "count": 3,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 50,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 65,
          "groups": [
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        }
      ],
      "boss": false
    },
    {
      "id": 22,
      "chapter": 5,
      "name": "鬼市深处",
      "startGold": 200,
      "baseHp": 120,
      "scale": {
        "hp": 1.653,
        "atk": 1.466,
        "speed": 1.109
      },
      "waves": [
        {
          "at": 5,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 20,
          "groups": [
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 35,
          "groups": [
            {
              "type": "brute",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "runner",
              "count": 3,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 50,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 65,
          "groups": [
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        }
      ],
      "boss": false
    },
    {
      "id": 23,
      "chapter": 5,
      "name": "尸王殿最后防线",
      "startGold": 200,
      "baseHp": 120,
      "scale": {
        "hp": 1.692,
        "atk": 1.495,
        "speed": 1.117
      },
      "waves": [
        {
          "at": 5,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 20,
          "groups": [
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 35,
          "groups": [
            {
              "type": "brute",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "runner",
              "count": 3,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 50,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 65,
          "groups": [
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 80,
          "groups": [
            {
              "type": "brute",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 5,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        }
      ],
      "boss": false
    },
    {
      "id": 24,
      "chapter": 5,
      "name": "后山决战",
      "startGold": 200,
      "baseHp": 120,
      "scale": {
        "hp": 1.732,
        "atk": 1.524,
        "speed": 1.124
      },
      "waves": [
        {
          "at": 5,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 20,
          "groups": [
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 35,
          "groups": [
            {
              "type": "brute",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "runner",
              "count": 3,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 50,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 65,
          "groups": [
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 80,
          "groups": [
            {
              "type": "brute",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 5,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        }
      ],
      "boss": false
    },
    {
      "id": 25,
      "chapter": 5,
      "name": "尸母",
      "startGold": 200,
      "baseHp": 120,
      "scale": {
        "hp": 1.892,
        "atk": 1.553,
        "speed": 1.132
      },
      "waves": [
        {
          "at": 5,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 20,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 5,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 35,
          "groups": [
            {
              "type": "brute",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "runner",
              "count": 3,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 50,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 65,
          "groups": [
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 80,
          "groups": [
            {
              "type": "brute",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 5,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 95,
          "groups": [
            {
              "type": "boss",
              "count": 1,
              "gap": 1,
              "delay": 0
            }
          ],
          "boss": true
        }
      ],
      "boss": true
    },
    {
      "id": 26,
      "chapter": 6,
      "name": "山门夜",
      "startGold": 200,
      "baseHp": 120,
      "scale": {
        "hp": 1.811,
        "atk": 1.583,
        "speed": 1.14
      },
      "waves": [
        {
          "at": 5,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 20,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 5,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 35,
          "groups": [
            {
              "type": "brute",
              "count": 3,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 3,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "runner",
              "count": 3,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 50,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 65,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 5,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "walker",
              "count": 5,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 80,
          "groups": [
            {
              "type": "brute",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 5,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        }
      ],
      "boss": false
    },
    {
      "id": 27,
      "chapter": 6,
      "name": "乱葬岗哨站",
      "startGold": 200,
      "baseHp": 120,
      "scale": {
        "hp": 1.851,
        "atk": 1.612,
        "speed": 1.147
      },
      "waves": [
        {
          "at": 5,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 20,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 5,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 35,
          "groups": [
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 50,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 65,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 5,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "walker",
              "count": 5,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 80,
          "groups": [
            {
              "type": "brute",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 5,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        }
      ],
      "boss": false
    },
    {
      "id": 28,
      "chapter": 6,
      "name": "鬼市山谷",
      "startGold": 200,
      "baseHp": 120,
      "scale": {
        "hp": 1.891,
        "atk": 1.641,
        "speed": 1.155
      },
      "waves": [
        {
          "at": 5,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 20,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 5,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 35,
          "groups": [
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 50,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 65,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 5,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "walker",
              "count": 5,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 80,
          "groups": [
            {
              "type": "brute",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 5,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        }
      ],
      "boss": false
    },
    {
      "id": 29,
      "chapter": 6,
      "name": "尸王殿桥头",
      "startGold": 200,
      "baseHp": 120,
      "scale": {
        "hp": 1.93,
        "atk": 1.671,
        "speed": 1.162
      },
      "waves": [
        {
          "at": 5,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 20,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 5,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 35,
          "groups": [
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 50,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 65,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 5,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "walker",
              "count": 5,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 80,
          "groups": [
            {
              "type": "brute",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 5,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        }
      ],
      "boss": false
    },
    {
      "id": 30,
      "chapter": 6,
      "name": "旱魃",
      "startGold": 200,
      "baseHp": 120,
      "scale": {
        "hp": 2.09,
        "atk": 1.7,
        "speed": 1.17
      },
      "waves": [
        {
          "at": 5,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 20,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 5,
              "gap": 0.85,
              "delay": 2.2
            }
          ]
        },
        {
          "at": 35,
          "groups": [
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 50,
          "groups": [
            {
              "type": "walker",
              "count": 4,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "runner",
              "count": 4,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "brute",
              "count": 4,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 65,
          "groups": [
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "brute",
              "count": 5,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "walker",
              "count": 5,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 80,
          "groups": [
            {
              "type": "brute",
              "count": 5,
              "gap": 0.85,
              "delay": 0
            },
            {
              "type": "walker",
              "count": 5,
              "gap": 0.85,
              "delay": 2.2
            },
            {
              "type": "runner",
              "count": 5,
              "gap": 0.85,
              "delay": 4.4
            }
          ]
        },
        {
          "at": 95,
          "groups": [
            {
              "type": "boss",
              "count": 1,
              "gap": 1,
              "delay": 0
            }
          ],
          "boss": true
        }
      ],
      "boss": true
    }
  ],
  "saveDefaults": {}
};
