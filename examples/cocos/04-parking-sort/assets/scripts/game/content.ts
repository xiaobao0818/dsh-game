// @ts-nocheck
/* 全部玩法内容（由游戏工坊生成，可直接手改；改完重新构建） */
export const CONTENT = {
  "slug": "sort-dev",
  "genre": "sort",
  "title": "老小区归位",
  "subtitle": "都市夜景 · 保安的冒险",
  "tagline": "把队列里的物件送进有限环道，凑满同色整排清空；顺序就是策略。",
  "orientation": "portrait",
  "config": {
    "seed": 450703099,
    "maxLevel": 25
  },
  "theme": {
    "id": "city",
    "name": "都市夜景",
    "mood": "dusk",
    "keywords": [
      "都市",
      "城市",
      "街道",
      "小区",
      "停车",
      "外卖",
      "餐厅",
      "夜",
      "霓虹",
      "现代",
      "主播",
      "直播",
      "带货",
      "店铺",
      "经营",
      "公司",
      "上班",
      "物业",
      "city",
      "urban",
      "parking",
      "street",
      "streamer"
    ],
    "palette": {
      "sky": [
        "#141a33",
        "#3a2440"
      ],
      "ground": "#2b2f44",
      "groundDark": "#171a28",
      "accent": "#ffd76a",
      "accent2": "#ff5d8f",
      "hero": "#7fe0ff",
      "hero2": "#3a7fa0",
      "enemy": "#ff7a90",
      "enemy2": "#8a2a44",
      "gold": "#ffd76a",
      "danger": "#ff4d4d",
      "ok": "#5ce0a0",
      "ui": "rgba(16,20,36,.88)",
      "ui2": "rgba(255,255,255,.12)",
      "ink": "#12162a",
      "text": "#ffffff"
    },
    "music": {
      "root": -7,
      "scale": [
        0,
        2,
        4,
        7,
        11
      ],
      "tempo": 96
    },
    "vocab": {
      "hero": [
        "外卖员",
        "保安",
        "店主",
        "司机",
        "工程师",
        "护士"
      ],
      "enemy": [
        "醉汉",
        "流氓",
        "催单客",
        "假顾客",
        "物业",
        "城管"
      ],
      "boss": [
        "城管队长",
        "黑心房东",
        "拆迁队长",
        "酒局天王"
      ],
      "building": [
        "便利店",
        "奶茶店",
        "停车场",
        "物业楼",
        "充电桩",
        "天台"
      ],
      "item": [
        "快递",
        "奶茶",
        "车钥匙",
        "外卖箱",
        "门禁卡",
        "优惠券",
        "啤酒",
        "账单"
      ],
      "place": [
        "老小区",
        "步行街",
        "写字楼",
        "地铁口",
        "天台",
        "夜市"
      ],
      "power": [
        "喇叭",
        "快速通道",
        "电梯",
        "报警",
        "优惠券雨",
        "路灯"
      ],
      "currency": "营业额"
    }
  },
  "chapters": [
    {
      "name": "老小区",
      "levels": [
        1,
        2,
        3,
        4,
        5
      ]
    },
    {
      "name": "步行街",
      "levels": [
        6,
        7,
        8,
        9,
        10
      ]
    },
    {
      "name": "写字楼",
      "levels": [
        11,
        12,
        13,
        14,
        15
      ]
    },
    {
      "name": "地铁口",
      "levels": [
        16,
        17,
        18,
        19,
        20
      ]
    },
    {
      "name": "天台",
      "levels": [
        21,
        22,
        23,
        24,
        25
      ]
    }
  ],
  "help": {
    "goal": "把候车队列里的物件全部清空。点物件送进环道，环道每拍把最前面的物件送给同色车位；车位凑齐 4 个同色就整排清空。把环道塞死就输了。",
    "controls": [
      "点「候车队列」里的任意物件，送入环道（只能点最前面几个）",
      "环道自动前进：最前面的物件同色车位开着就自动入位",
      "车位凑满 4 个同色 → 整排清空得分；连锁清空分数更高",
      "点环道最前面的物件可以「退回」队列最前，用来救堵塞（每关 3 次）"
    ],
    "tips": [
      "带锁的车位暂时不收货：先清开放颜色，闸门开了再送",
      "堵死时别乱点：环道满了又送不出去就失败，退回是唯一解法",
      "想拿三星就少犹豫——星级看用时"
    ]
  },
  "defs": {
    "beltCap": 5,
    "laneCap": 4,
    "windowMax": 5,
    "pullCharges": 3,
    "beat": 0.45,
    "scorePerClear": 120,
    "comboBonus": 60,
    "starParScale": 1,
    "colors": [
      {
        "id": "c0",
        "color": "#fbd56e",
        "color2": "#ad7e01",
        "shape": "circle",
        "name": "快递"
      },
      {
        "id": "c1",
        "color": "#74dbfb",
        "color2": "#0186af",
        "shape": "square",
        "name": "奶茶"
      },
      {
        "id": "c2",
        "color": "#fb6191",
        "color2": "#a70034",
        "shape": "triangle",
        "name": "车钥匙"
      },
      {
        "id": "c3",
        "color": "#5ce0a0",
        "color2": "#16824d",
        "shape": "diamond",
        "name": "外卖箱"
      },
      {
        "id": "c4",
        "color": "#bdfb51",
        "color2": "#659f00",
        "shape": "hex",
        "name": "门禁卡"
      },
      {
        "id": "c5",
        "color": "#836efb",
        "color2": "#1a01ad",
        "shape": "star",
        "name": "优惠券"
      }
    ]
  },
  "levels": [
    {
      "id": 1,
      "chapter": 1,
      "name": "老小区快递",
      "boss": false,
      "colors": 3,
      "window": 4,
      "lanes": [
        {
          "color": 0,
          "preset": 1,
          "lock": 0
        },
        {
          "color": 1,
          "preset": 3,
          "lock": 0
        },
        {
          "color": 2,
          "preset": 0,
          "lock": 0
        }
      ],
      "queue": [
        0,
        2,
        1,
        0,
        2,
        0,
        2,
        1,
        0,
        2,
        2,
        0,
        2,
        0,
        1,
        1,
        1,
        0,
        2,
        2
      ],
      "par": 31,
      "hint": "点物件送进环道，同色满四清一排",
      "solutionLength": 20
    },
    {
      "id": 2,
      "chapter": 1,
      "name": "老小区奶茶",
      "boss": false,
      "colors": 3,
      "window": 4,
      "lanes": [
        {
          "color": 0,
          "preset": 1,
          "lock": 0
        },
        {
          "color": 1,
          "preset": 0,
          "lock": 0
        },
        {
          "color": 2,
          "preset": 0,
          "lock": 0
        }
      ],
      "queue": [
        1,
        0,
        0,
        0,
        0,
        1,
        2,
        1,
        2,
        2,
        0,
        1,
        1,
        2,
        2,
        2,
        0,
        0,
        1,
        2,
        2,
        1,
        1
      ],
      "par": 34,
      "hint": "点物件送进环道，同色满四清一排",
      "solutionLength": 23
    },
    {
      "id": 3,
      "chapter": 1,
      "name": "老小区车钥匙",
      "boss": false,
      "colors": 3,
      "window": 4,
      "lanes": [
        {
          "color": 0,
          "preset": 0,
          "lock": 0
        },
        {
          "color": 1,
          "preset": 2,
          "lock": 0
        },
        {
          "color": 2,
          "preset": 3,
          "lock": 1
        }
      ],
      "queue": [
        1,
        0,
        1,
        1,
        2,
        0,
        0,
        0,
        0,
        0,
        0,
        2,
        2,
        0,
        2,
        1,
        1,
        1,
        2
      ],
      "par": 30,
      "hint": "只有亮起的车位能收货，闸门要清空别的排才开",
      "solutionLength": 19
    },
    {
      "id": 4,
      "chapter": 1,
      "name": "老小区外卖箱",
      "boss": false,
      "colors": 4,
      "window": 4,
      "lanes": [
        {
          "color": 0,
          "preset": 0,
          "lock": 0
        },
        {
          "color": 1,
          "preset": 0,
          "lock": 0
        },
        {
          "color": 2,
          "preset": 3,
          "lock": 0
        },
        {
          "color": 3,
          "preset": 3,
          "lock": 1
        }
      ],
      "queue": [
        0,
        0,
        0,
        1,
        3,
        3,
        0,
        2,
        0,
        1,
        2,
        0,
        1,
        3,
        2,
        1,
        1,
        2,
        1,
        1,
        1,
        3,
        0,
        2,
        3,
        0
      ],
      "par": 38,
      "hint": "只有亮起的车位能收货，闸门要清空别的排才开",
      "solutionLength": 26
    },
    {
      "id": 5,
      "chapter": 1,
      "name": "难关 · 老小区门禁卡",
      "boss": true,
      "colors": 4,
      "window": 4,
      "lanes": [
        {
          "color": 0,
          "preset": 1,
          "lock": 0
        },
        {
          "color": 1,
          "preset": 2,
          "lock": 0
        },
        {
          "color": 2,
          "preset": 1,
          "lock": 1
        },
        {
          "color": 3,
          "preset": 0,
          "lock": 1
        }
      ],
      "queue": [
        2,
        0,
        0,
        0,
        2,
        1,
        2,
        2,
        1,
        3,
        2,
        0,
        1,
        3,
        0,
        3,
        3,
        0,
        1,
        1,
        2,
        2,
        3,
        3,
        3,
        0,
        3,
        1
      ],
      "par": 40,
      "hint": "难关：先清掉开放的颜色，闸门一开立刻补位",
      "solutionLength": 28
    },
    {
      "id": 6,
      "chapter": 2,
      "name": "步行街优惠券",
      "boss": false,
      "colors": 4,
      "window": 4,
      "lanes": [
        {
          "color": 0,
          "preset": 2,
          "lock": 0
        },
        {
          "color": 1,
          "preset": 1,
          "lock": 0
        },
        {
          "color": 2,
          "preset": 0,
          "lock": 0
        },
        {
          "color": 3,
          "preset": 2,
          "lock": 1
        }
      ],
      "queue": [
        3,
        2,
        3,
        2,
        0,
        0,
        1,
        1,
        2,
        2,
        0,
        0,
        1,
        0,
        2,
        3,
        1,
        3,
        3,
        2,
        1,
        1,
        1,
        0,
        2,
        2,
        3
      ],
      "par": 39,
      "hint": "只有亮起的车位能收货，闸门要清空别的排才开",
      "solutionLength": 27
    },
    {
      "id": 7,
      "chapter": 2,
      "name": "步行街快递",
      "boss": false,
      "colors": 4,
      "window": 4,
      "lanes": [
        {
          "color": 0,
          "preset": 3,
          "lock": 0
        },
        {
          "color": 1,
          "preset": 0,
          "lock": 0
        },
        {
          "color": 2,
          "preset": 3,
          "lock": 1
        },
        {
          "color": 3,
          "preset": 0,
          "lock": 1
        }
      ],
      "queue": [
        3,
        2,
        1,
        2,
        0,
        1,
        0,
        2,
        3,
        1,
        1,
        3,
        1,
        1,
        1,
        3,
        2,
        3,
        2,
        3,
        0,
        0,
        3,
        3,
        1,
        0
      ],
      "par": 38,
      "hint": "只有亮起的车位能收货，闸门要清空别的排才开",
      "solutionLength": 26
    },
    {
      "id": 8,
      "chapter": 2,
      "name": "步行街奶茶",
      "boss": false,
      "colors": 4,
      "window": 4,
      "lanes": [
        {
          "color": 0,
          "preset": 2,
          "lock": 0
        },
        {
          "color": 1,
          "preset": 1,
          "lock": 0
        },
        {
          "color": 2,
          "preset": 2,
          "lock": 1
        },
        {
          "color": 3,
          "preset": 1,
          "lock": 2
        }
      ],
      "queue": [
        0,
        1,
        3,
        3,
        0,
        1,
        1,
        1,
        3,
        3,
        2,
        3,
        2,
        2,
        0,
        3,
        2,
        1,
        3,
        3,
        3,
        2,
        0,
        3,
        2,
        0,
        1,
        0,
        3,
        1
      ],
      "par": 43,
      "hint": "只有亮起的车位能收货，闸门要清空别的排才开",
      "solutionLength": 30
    },
    {
      "id": 9,
      "chapter": 2,
      "name": "步行街车钥匙",
      "boss": false,
      "colors": 4,
      "window": 4,
      "lanes": [
        {
          "color": 0,
          "preset": 1,
          "lock": 0
        },
        {
          "color": 1,
          "preset": 3,
          "lock": 0
        },
        {
          "color": 2,
          "preset": 3,
          "lock": 1
        },
        {
          "color": 3,
          "preset": 3,
          "lock": 2
        }
      ],
      "queue": [
        3,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        2,
        3,
        1,
        0,
        2,
        0,
        1,
        0,
        0,
        2,
        1,
        3,
        3,
        1,
        3,
        3,
        3,
        3,
        2,
        3,
        0,
        2
      ],
      "par": 43,
      "hint": "只有亮起的车位能收货，闸门要清空别的排才开",
      "solutionLength": 30
    },
    {
      "id": 10,
      "chapter": 2,
      "name": "难关 · 步行街外卖箱",
      "boss": true,
      "colors": 5,
      "window": 4,
      "lanes": [
        {
          "color": 0,
          "preset": 3,
          "lock": 0
        },
        {
          "color": 1,
          "preset": 3,
          "lock": 0
        },
        {
          "color": 2,
          "preset": 1,
          "lock": 0
        },
        {
          "color": 3,
          "preset": 1,
          "lock": 1
        },
        {
          "color": 4,
          "preset": 0,
          "lock": 2
        }
      ],
      "queue": [
        3,
        4,
        4,
        2,
        0,
        0,
        4,
        3,
        3,
        4,
        2,
        2,
        3,
        1,
        3,
        0,
        4,
        4,
        0,
        2,
        2,
        1,
        3,
        4,
        2,
        4,
        1,
        2,
        1,
        0,
        3,
        1
      ],
      "par": 45,
      "hint": "难关：先清掉开放的颜色，闸门一开立刻补位",
      "solutionLength": 32
    },
    {
      "id": 11,
      "chapter": 3,
      "name": "写字楼门禁卡",
      "boss": false,
      "colors": 5,
      "window": 4,
      "lanes": [
        {
          "color": 0,
          "preset": 0,
          "lock": 0
        },
        {
          "color": 1,
          "preset": 0,
          "lock": 0
        },
        {
          "color": 2,
          "preset": 1,
          "lock": 1
        },
        {
          "color": 3,
          "preset": 2,
          "lock": 1
        },
        {
          "color": 4,
          "preset": 3,
          "lock": 2
        }
      ],
      "queue": [
        2,
        1,
        0,
        4,
        0,
        1,
        1,
        0,
        1,
        0,
        2,
        4,
        1,
        3,
        0,
        1,
        4,
        3,
        0,
        4,
        3,
        1,
        0,
        3,
        3,
        2,
        4,
        2,
        1,
        2,
        3,
        2,
        2,
        0
      ],
      "par": 47,
      "hint": "只有亮起的车位能收货，闸门要清空别的排才开",
      "solutionLength": 34
    },
    {
      "id": 12,
      "chapter": 3,
      "name": "写字楼优惠券",
      "boss": false,
      "colors": 5,
      "window": 4,
      "lanes": [
        {
          "color": 0,
          "preset": 1,
          "lock": 0
        },
        {
          "color": 1,
          "preset": 0,
          "lock": 0
        },
        {
          "color": 2,
          "preset": 1,
          "lock": 1
        },
        {
          "color": 3,
          "preset": 3,
          "lock": 2
        },
        {
          "color": 4,
          "preset": 0,
          "lock": 2
        }
      ],
      "queue": [
        1,
        1,
        2,
        0,
        1,
        4,
        0,
        0,
        0,
        1,
        4,
        0,
        2,
        3,
        4,
        4,
        4,
        3,
        3,
        1,
        1,
        4,
        4,
        3,
        0,
        2,
        0,
        2,
        2,
        3,
        2,
        1,
        4,
        1,
        2
      ],
      "par": 48,
      "hint": "只有亮起的车位能收货，闸门要清空别的排才开",
      "solutionLength": 35
    },
    {
      "id": 13,
      "chapter": 3,
      "name": "写字楼快递",
      "boss": false,
      "colors": 5,
      "window": 4,
      "lanes": [
        {
          "color": 0,
          "preset": 3,
          "lock": 0
        },
        {
          "color": 1,
          "preset": 0,
          "lock": 0
        },
        {
          "color": 2,
          "preset": 3,
          "lock": 1
        },
        {
          "color": 3,
          "preset": 3,
          "lock": 2
        },
        {
          "color": 4,
          "preset": 1,
          "lock": 3
        }
      ],
      "queue": [
        2,
        1,
        1,
        1,
        3,
        1,
        2,
        2,
        4,
        4,
        1,
        3,
        4,
        1,
        1,
        0,
        4,
        0,
        1,
        2,
        4,
        2,
        1,
        3,
        1,
        3,
        3,
        0,
        4,
        1,
        0,
        1,
        4,
        0
      ],
      "par": 47,
      "hint": "只有亮起的车位能收货，闸门要清空别的排才开",
      "solutionLength": 34
    },
    {
      "id": 14,
      "chapter": 3,
      "name": "写字楼奶茶",
      "boss": false,
      "colors": 5,
      "window": 4,
      "lanes": [
        {
          "color": 0,
          "preset": 1,
          "lock": 0
        },
        {
          "color": 1,
          "preset": 0,
          "lock": 0
        },
        {
          "color": 2,
          "preset": 1,
          "lock": 1
        },
        {
          "color": 3,
          "preset": 1,
          "lock": 2
        },
        {
          "color": 4,
          "preset": 1,
          "lock": 3
        }
      ],
      "queue": [
        2,
        1,
        3,
        0,
        1,
        1,
        3,
        1,
        0,
        0,
        0,
        3,
        1,
        1,
        4,
        3,
        2,
        2,
        0,
        2,
        2,
        3,
        0,
        4,
        4,
        1,
        1,
        1,
        3,
        2,
        2,
        0,
        1,
        4,
        1,
        4,
        4,
        4,
        1,
        3
      ],
      "par": 54,
      "hint": "只有亮起的车位能收货，闸门要清空别的排才开",
      "solutionLength": 40
    },
    {
      "id": 15,
      "chapter": 3,
      "name": "难关 · 写字楼车钥匙",
      "boss": true,
      "colors": 6,
      "window": 4,
      "lanes": [
        {
          "color": 0,
          "preset": 3,
          "lock": 0
        },
        {
          "color": 1,
          "preset": 2,
          "lock": 0
        },
        {
          "color": 2,
          "preset": 1,
          "lock": 0
        },
        {
          "color": 3,
          "preset": 3,
          "lock": 1
        },
        {
          "color": 4,
          "preset": 0,
          "lock": 2
        },
        {
          "color": 5,
          "preset": 1,
          "lock": 3
        }
      ],
      "queue": [
        1,
        2,
        5,
        0,
        3,
        4,
        5,
        3,
        0,
        4,
        4,
        4,
        3,
        4,
        4,
        3,
        5,
        4,
        2,
        3,
        2,
        1,
        0,
        5,
        2,
        2,
        1,
        1,
        5,
        5,
        0,
        1,
        2,
        0,
        5,
        2,
        4,
        1
      ],
      "par": 52,
      "hint": "难关：先清掉开放的颜色，闸门一开立刻补位",
      "solutionLength": 38
    },
    {
      "id": 16,
      "chapter": 4,
      "name": "地铁口外卖箱",
      "boss": false,
      "colors": 6,
      "window": 4,
      "lanes": [
        {
          "color": 0,
          "preset": 3,
          "lock": 0
        },
        {
          "color": 1,
          "preset": 3,
          "lock": 0
        },
        {
          "color": 2,
          "preset": 3,
          "lock": 1
        },
        {
          "color": 3,
          "preset": 1,
          "lock": 1
        },
        {
          "color": 4,
          "preset": 2,
          "lock": 2
        },
        {
          "color": 5,
          "preset": 3,
          "lock": 3
        }
      ],
      "queue": [
        3,
        1,
        0,
        1,
        3,
        5,
        2,
        5,
        5,
        3,
        4,
        0,
        4,
        0,
        3,
        2,
        1,
        0,
        3,
        5,
        4,
        4,
        4,
        0,
        2,
        1,
        2,
        4,
        3,
        3,
        2,
        5,
        1
      ],
      "par": 46,
      "hint": "只有亮起的车位能收货，闸门要清空别的排才开",
      "solutionLength": 33
    },
    {
      "id": 17,
      "chapter": 4,
      "name": "地铁口门禁卡",
      "boss": false,
      "colors": 6,
      "window": 3,
      "lanes": [
        {
          "color": 0,
          "preset": 3,
          "lock": 0
        },
        {
          "color": 1,
          "preset": 1,
          "lock": 0
        },
        {
          "color": 2,
          "preset": 1,
          "lock": 1
        },
        {
          "color": 3,
          "preset": 3,
          "lock": 1
        },
        {
          "color": 4,
          "preset": 1,
          "lock": 2
        },
        {
          "color": 5,
          "preset": 0,
          "lock": 3
        }
      ],
      "queue": [
        5,
        0,
        3,
        0,
        2,
        2,
        3,
        0,
        1,
        5,
        1,
        2,
        4,
        2,
        2,
        1,
        5,
        5,
        4,
        1,
        5,
        3,
        1,
        4,
        0,
        5,
        2,
        5,
        5,
        4,
        1,
        4,
        2,
        0,
        3,
        1,
        3,
        4,
        4
      ],
      "par": 53,
      "hint": "只有亮起的车位能收货，闸门要清空别的排才开",
      "solutionLength": 39
    },
    {
      "id": 18,
      "chapter": 4,
      "name": "地铁口优惠券",
      "boss": false,
      "colors": 6,
      "window": 3,
      "lanes": [
        {
          "color": 0,
          "preset": 3,
          "lock": 0
        },
        {
          "color": 1,
          "preset": 3,
          "lock": 0
        },
        {
          "color": 2,
          "preset": 3,
          "lock": 1
        },
        {
          "color": 3,
          "preset": 1,
          "lock": 2
        },
        {
          "color": 4,
          "preset": 1,
          "lock": 2
        },
        {
          "color": 5,
          "preset": 2,
          "lock": 3
        }
      ],
      "queue": [
        5,
        4,
        1,
        2,
        0,
        5,
        2,
        0,
        5,
        3,
        0,
        3,
        4,
        2,
        1,
        0,
        4,
        3,
        4,
        1,
        3,
        1,
        3,
        3,
        5,
        4,
        3,
        5,
        4,
        3,
        5,
        2,
        3,
        2,
        3,
        3,
        0,
        4,
        1
      ],
      "par": 53,
      "hint": "只有亮起的车位能收货，闸门要清空别的排才开",
      "solutionLength": 39
    },
    {
      "id": 19,
      "chapter": 4,
      "name": "地铁口快递",
      "boss": false,
      "colors": 6,
      "window": 3,
      "lanes": [
        {
          "color": 0,
          "preset": 3,
          "lock": 0
        },
        {
          "color": 1,
          "preset": 3,
          "lock": 0
        },
        {
          "color": 2,
          "preset": 2,
          "lock": 1
        },
        {
          "color": 3,
          "preset": 2,
          "lock": 2
        },
        {
          "color": 4,
          "preset": 2,
          "lock": 3
        },
        {
          "color": 5,
          "preset": 1,
          "lock": 3
        }
      ],
      "queue": [
        4,
        2,
        0,
        1,
        2,
        2,
        2,
        3,
        5,
        0,
        4,
        3,
        3,
        2,
        1,
        1,
        5,
        3,
        2,
        2,
        5,
        2,
        4,
        4,
        5,
        1,
        0,
        1,
        2,
        5,
        3,
        3,
        4,
        2,
        4,
        0,
        5,
        5,
        0
      ],
      "par": 53,
      "hint": "只有亮起的车位能收货，闸门要清空别的排才开",
      "solutionLength": 39
    },
    {
      "id": 20,
      "chapter": 4,
      "name": "难关 · 地铁口奶茶",
      "boss": true,
      "colors": 6,
      "window": 3,
      "lanes": [
        {
          "color": 0,
          "preset": 0,
          "lock": 0
        },
        {
          "color": 1,
          "preset": 3,
          "lock": 0
        },
        {
          "color": 2,
          "preset": 2,
          "lock": 1
        },
        {
          "color": 3,
          "preset": 0,
          "lock": 2
        },
        {
          "color": 4,
          "preset": 2,
          "lock": 3
        },
        {
          "color": 5,
          "preset": 3,
          "lock": 4
        }
      ],
      "queue": [
        0,
        2,
        0,
        2,
        1,
        4,
        3,
        1,
        2,
        0,
        2,
        5,
        0,
        5,
        3,
        3,
        3,
        4,
        5,
        4,
        0,
        5,
        4,
        3,
        2,
        0,
        4,
        3,
        5,
        3,
        1,
        0,
        1,
        0,
        3,
        1,
        2,
        4
      ],
      "par": 52,
      "hint": "难关：先清掉开放的颜色，闸门一开立刻补位",
      "solutionLength": 38
    },
    {
      "id": 21,
      "chapter": 5,
      "name": "天台车钥匙",
      "boss": false,
      "colors": 6,
      "window": 3,
      "lanes": [
        {
          "color": 0,
          "preset": 1,
          "lock": 0
        },
        {
          "color": 1,
          "preset": 0,
          "lock": 0
        },
        {
          "color": 2,
          "preset": 1,
          "lock": 1
        },
        {
          "color": 3,
          "preset": 3,
          "lock": 2
        },
        {
          "color": 4,
          "preset": 0,
          "lock": 3
        },
        {
          "color": 5,
          "preset": 3,
          "lock": 4
        }
      ],
      "queue": [
        0,
        1,
        3,
        0,
        1,
        2,
        1,
        0,
        2,
        1,
        4,
        2,
        1,
        3,
        0,
        2,
        4,
        5,
        3,
        1,
        3,
        0,
        2,
        2,
        5,
        4,
        1,
        3,
        4,
        4,
        5,
        0,
        4,
        4,
        1,
        0,
        4,
        2,
        5,
        5
      ],
      "par": 54,
      "hint": "只有亮起的车位能收货，闸门要清空别的排才开",
      "solutionLength": 40
    },
    {
      "id": 22,
      "chapter": 5,
      "name": "天台外卖箱",
      "boss": false,
      "colors": 6,
      "window": 3,
      "lanes": [
        {
          "color": 0,
          "preset": 3,
          "lock": 0
        },
        {
          "color": 1,
          "preset": 3,
          "lock": 1
        },
        {
          "color": 2,
          "preset": 3,
          "lock": 1
        },
        {
          "color": 3,
          "preset": 3,
          "lock": 2
        },
        {
          "color": 4,
          "preset": 0,
          "lock": 3
        },
        {
          "color": 5,
          "preset": 1,
          "lock": 4
        }
      ],
      "queue": [
        0,
        2,
        1,
        1,
        4,
        2,
        0,
        5,
        4,
        4,
        3,
        2,
        0,
        4,
        1,
        2,
        5,
        0,
        4,
        4,
        2,
        5,
        4,
        3,
        5,
        2,
        2,
        3,
        4,
        4,
        5,
        4,
        3,
        1,
        5,
        1,
        2,
        0,
        4,
        3,
        2,
        5,
        4
      ],
      "par": 57,
      "hint": "只有亮起的车位能收货，闸门要清空别的排才开",
      "solutionLength": 43
    },
    {
      "id": 23,
      "chapter": 5,
      "name": "天台门禁卡",
      "boss": false,
      "colors": 6,
      "window": 3,
      "lanes": [
        {
          "color": 0,
          "preset": 3,
          "lock": 0
        },
        {
          "color": 1,
          "preset": 1,
          "lock": 1
        },
        {
          "color": 2,
          "preset": 1,
          "lock": 1
        },
        {
          "color": 3,
          "preset": 3,
          "lock": 2
        },
        {
          "color": 4,
          "preset": 0,
          "lock": 3
        },
        {
          "color": 5,
          "preset": 2,
          "lock": 4
        }
      ],
      "queue": [
        0,
        4,
        2,
        4,
        1,
        0,
        1,
        1,
        1,
        3,
        5,
        1,
        2,
        4,
        1,
        0,
        4,
        3,
        2,
        1,
        4,
        0,
        4,
        4,
        1,
        4,
        5,
        5,
        1,
        5,
        2,
        3,
        3,
        5,
        3,
        2,
        5,
        1,
        2,
        0,
        2,
        1
      ],
      "par": 56,
      "hint": "只有亮起的车位能收货，闸门要清空别的排才开",
      "solutionLength": 42
    },
    {
      "id": 24,
      "chapter": 5,
      "name": "天台优惠券",
      "boss": false,
      "colors": 6,
      "window": 3,
      "lanes": [
        {
          "color": 0,
          "preset": 3,
          "lock": 0
        },
        {
          "color": 1,
          "preset": 3,
          "lock": 1
        },
        {
          "color": 2,
          "preset": 1,
          "lock": 1
        },
        {
          "color": 3,
          "preset": 0,
          "lock": 2
        },
        {
          "color": 4,
          "preset": 0,
          "lock": 3
        },
        {
          "color": 5,
          "preset": 3,
          "lock": 4
        }
      ],
      "queue": [
        0,
        3,
        1,
        2,
        3,
        5,
        1,
        4,
        3,
        1,
        0,
        2,
        3,
        1,
        0,
        0,
        2,
        3,
        1,
        3,
        5,
        4,
        5,
        1,
        0,
        5,
        4,
        5,
        4,
        4,
        3,
        2,
        4,
        1,
        2,
        3,
        1,
        4,
        4,
        1,
        2,
        2
      ],
      "par": 56,
      "hint": "只有亮起的车位能收货，闸门要清空别的排才开",
      "solutionLength": 42
    },
    {
      "id": 25,
      "chapter": 5,
      "name": "难关 · 天台快递",
      "boss": true,
      "colors": 6,
      "window": 3,
      "lanes": [
        {
          "color": 0,
          "preset": 3,
          "lock": 0
        },
        {
          "color": 1,
          "preset": 3,
          "lock": 1
        },
        {
          "color": 2,
          "preset": 0,
          "lock": 2
        },
        {
          "color": 3,
          "preset": 3,
          "lock": 2
        },
        {
          "color": 4,
          "preset": 1,
          "lock": 3
        },
        {
          "color": 5,
          "preset": 3,
          "lock": 4
        }
      ],
      "queue": [
        0,
        1,
        1,
        2,
        5,
        3,
        0,
        1,
        2,
        2,
        3,
        5,
        4,
        3,
        2,
        2,
        0,
        1,
        4,
        4,
        5,
        2,
        1,
        0,
        5,
        2,
        0,
        5,
        0,
        4,
        0,
        2,
        2,
        0,
        4,
        0,
        4,
        3,
        4,
        3,
        2,
        2,
        2
      ],
      "par": 57,
      "hint": "难关：先清掉开放的颜色，闸门一开立刻补位",
      "solutionLength": 43
    }
  ],
  "saveDefaults": {},
  "stats": {
    "levels": 25,
    "totalItems": 840,
    "chapters": 5
  }
};
