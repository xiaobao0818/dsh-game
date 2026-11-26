/* =========================================================================
 * content.js —— 全部玩法内容数据（由「游戏工坊」生成，可直接手改）
 * 主题：都市夜景 · 基因：idle · 关卡：24
 * 改完运行：node tools/build-single.mjs && node tools/check.mjs
 * ========================================================================= */

export const CONTENT = {
  "slug": "idle-dev",
  "genre": "idle",
  "title": "三十天开播",
  "subtitle": "都市夜景 · 保安的生意",
  "tagline": "按天经营，选节目/员工/升级，滚大收益，在期限内达成目标。",
  "orientation": "portrait",
  "config": {
    "seed": 1245917665,
    "maxLevel": 24
  },
  "theme": {
    "id": "city",
    "name": "都市夜景",
    "mood": "dusk",
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
      "name": "老小区篇",
      "levels": [
        1,
        2,
        3,
        4
      ]
    },
    {
      "name": "步行街篇",
      "levels": [
        5,
        6,
        7,
        8
      ]
    },
    {
      "name": "写字楼篇",
      "levels": [
        9,
        10,
        11,
        12
      ]
    },
    {
      "name": "地铁口篇",
      "levels": [
        13,
        14,
        15,
        16
      ]
    },
    {
      "name": "天台篇",
      "levels": [
        17,
        18,
        19,
        20
      ]
    },
    {
      "name": "夜市篇",
      "levels": [
        21,
        22,
        23,
        24
      ]
    }
  ],
  "help": {
    "goal": "30 天为一轮：每天花行动点招人或升级，点「开始营业」结算当日收益。第 30 天结束时，营业额与粉丝都达到目标即通关；中途发不出工资或租金就算破产失败。",
    "controls": [
      "点员工卡「招募」：花行动点 + 铜钱雇人，自动产出",
      "点下方员工头像：花行动点 + 铜钱升级（最高 Lv.5）",
      "点「升级场地」：加容量、加单价，但每日租金变高",
      "点节目按钮：当天收入/粉丝加成（每天限一次）",
      "点「开始营业」进入当日结算，结算面板里点「下一天」继续"
    ],
    "tips": [
      "前 3 天先招满场地容量，收入才会滚起来",
      "留足第二天的工资与租金，欠费会直接破产",
      "粉丝越多收入越高（上限 +90%），主播值得早招",
      "节目只在当天生效，安排在能回本的日子",
      "第 30 天结算后才判定胜负，最后几天别再乱花钱",
      "星级看营业额超出目标的幅度：超 8% 两星、超 22% 三星",
      "键盘：空格=营业/下一天，1~4=招募，U=升级场地"
    ]
  },
  "defs": {
    "roles": [
      {
        "id": "staff",
        "name": "外卖员",
        "cost": 38,
        "rate": 3,
        "fans": 0.24,
        "wage": 3,
        "role": "melee",
        "color": "#7fe0ff",
        "desc": "基础店员，便宜稳产"
      },
      {
        "id": "host",
        "name": "保安",
        "cost": 88,
        "rate": 3.4,
        "fans": 1.05,
        "wage": 6,
        "role": "ranged",
        "color": "#ffd76a",
        "desc": "前台主播，粉丝增长快"
      },
      {
        "id": "tech",
        "name": "店主",
        "cost": 152,
        "rate": 5.8,
        "fans": 0.46,
        "wage": 9,
        "role": "mage",
        "color": "#ff5d8f",
        "desc": "技术骨干，单人产出最高"
      },
      {
        "id": "star",
        "name": "司机",
        "cost": 268,
        "rate": 8.8,
        "fans": 0.8,
        "wage": 15,
        "role": "tank",
        "color": "#ffd76a",
        "desc": "明星大咖，产出粉丝全能"
      }
    ],
    "venues": [
      {
        "name": "便利店",
        "cap": 2,
        "price": 1,
        "rent": 8,
        "upCost": 120,
        "base": 2
      },
      {
        "name": "奶茶店",
        "cap": 3,
        "price": 1.14,
        "rent": 15,
        "upCost": 210,
        "base": 3
      },
      {
        "name": "停车场",
        "cap": 4,
        "price": 1.3,
        "rent": 24,
        "upCost": 360,
        "base": 4
      },
      {
        "name": "物业楼",
        "cap": 5,
        "price": 1.48,
        "rent": 36,
        "upCost": 600,
        "base": 5
      },
      {
        "name": "充电桩",
        "cap": 6,
        "price": 1.68,
        "rent": 52,
        "upCost": 0,
        "base": 6
      }
    ],
    "shows": [
      {
        "id": "boom",
        "name": "喇叭",
        "cost": 40,
        "incomeMul": 1.75,
        "fansMul": 1,
        "desc": "今日收入 ×1.75"
      },
      {
        "id": "live",
        "name": "快速通道",
        "cost": 34,
        "incomeMul": 1,
        "fansMul": 2.2,
        "desc": "今日粉丝 ×2.2"
      },
      {
        "id": "party",
        "name": "电梯",
        "cost": 58,
        "incomeMul": 1.25,
        "fansMul": 1.4,
        "wageFree": 1,
        "desc": "收入 ×1.25、粉丝 ×1.4、免当日工资"
      }
    ],
    "events": [
      {
        "id": "rush",
        "title": "旺季客流",
        "text": "街上人潮涌来，怎么接？",
        "opts": [
          {
            "label": "加价收割",
            "coins": 42,
            "fans": -10,
            "ap": 0
          },
          {
            "label": "薄利涨粉",
            "coins": 10,
            "fans": 30,
            "ap": 0
          }
        ]
      },
      {
        "id": "viral",
        "title": "网红探店",
        "text": "一位博主上门，要合作吗？",
        "opts": [
          {
            "label": "请他直播",
            "coins": -36,
            "fans": 20,
            "incomeMul": 1.5,
            "ap": 0
          },
          {
            "label": "婉拒送礼",
            "coins": -12,
            "fans": 8,
            "ap": 1
          }
        ]
      },
      {
        "id": "rain",
        "title": "暴雨停电",
        "text": "设备跳闸，只能二选一。",
        "opts": [
          {
            "label": "花钱抢修",
            "coins": -40,
            "incomeMul": 1.2,
            "ap": 0
          },
          {
            "label": "提前歇业",
            "coins": 0,
            "fans": -8,
            "ap": 1
          }
        ]
      },
      {
        "id": "supplier",
        "title": "供货商来访",
        "text": "一批快递低价出，吃下吗？",
        "opts": [
          {
            "label": "整批吃下",
            "coins": -50,
            "fans": 6,
            "incomeMul": 1.45,
            "ap": 0
          },
          {
            "label": "只要样品",
            "coins": 6,
            "fans": 14,
            "ap": 0
          }
        ]
      },
      {
        "id": "rival",
        "title": "同行挖人",
        "text": "隔壁店想挖你的员工，怎么谈？",
        "opts": [
          {
            "label": "加薪留人",
            "coins": -30,
            "fans": 12,
            "incomeMul": 1.15,
            "ap": 0
          },
          {
            "label": "放人拿补偿",
            "coins": 55,
            "fans": -14,
            "ap": 0
          }
        ]
      },
      {
        "id": "festival",
        "title": "节日庆典",
        "text": "要不要报名参加市集？",
        "opts": [
          {
            "label": "摊费换客流",
            "coins": -28,
            "fans": 26,
            "incomeMul": 1.3,
            "ap": 0
          },
          {
            "label": "留店稳经营",
            "coins": 16,
            "fans": 0,
            "ap": 1
          }
        ]
      }
    ]
  },
  "levels": [
    {
      "id": 1,
      "chapter": 1,
      "name": "老小区开张",
      "days": 30,
      "ap": 2,
      "bizSeconds": 3.2,
      "econMul": 1,
      "startCoins": 80,
      "target": 2320,
      "fanTarget": 100,
      "eventDays": [
        6,
        8,
        12,
        18,
        24,
        30
      ],
      "boss": false,
      "scale": {
        "target": 1,
        "fan": 100
      }
    },
    {
      "id": 2,
      "chapter": 1,
      "name": "夜市夜市",
      "days": 30,
      "ap": 2,
      "bizSeconds": 3.2,
      "econMul": 1.05,
      "startCoins": 95,
      "target": 2538,
      "fanTarget": 109,
      "eventDays": [
        6,
        12,
        18,
        20,
        22,
        24,
        30
      ],
      "boss": false,
      "scale": {
        "target": 1.012,
        "fan": 109
      }
    },
    {
      "id": 3,
      "chapter": 1,
      "name": "天台旺季",
      "days": 30,
      "ap": 2,
      "bizSeconds": 3.2,
      "econMul": 1.1,
      "startCoins": 110,
      "target": 2777,
      "fanTarget": 118,
      "eventDays": [
        6,
        12,
        18,
        24,
        30
      ],
      "boss": false,
      "scale": {
        "target": 1.024,
        "fan": 118
      }
    },
    {
      "id": 4,
      "chapter": 1,
      "name": "地铁口淡季",
      "days": 30,
      "ap": 2,
      "bizSeconds": 3.2,
      "econMul": 1.15,
      "startCoins": 126,
      "target": 3037,
      "fanTarget": 128,
      "eventDays": [
        6,
        12,
        18,
        24,
        27,
        30
      ],
      "boss": false,
      "scale": {
        "target": 1.036,
        "fan": 128
      }
    },
    {
      "id": 5,
      "chapter": 2,
      "name": "写字楼庆典",
      "days": 30,
      "ap": 2,
      "bizSeconds": 3.2,
      "econMul": 1.2,
      "startCoins": 144,
      "target": 3455,
      "fanTarget": 144,
      "eventDays": [
        6,
        12,
        16,
        18,
        20,
        24,
        30
      ],
      "boss": true,
      "scale": {
        "target": 1.047,
        "fan": 144
      }
    },
    {
      "id": 6,
      "chapter": 2,
      "name": "步行街分号",
      "days": 30,
      "ap": 2,
      "bizSeconds": 3.2,
      "econMul": 1.25,
      "startCoins": 163,
      "target": 3632,
      "fanTarget": 152,
      "eventDays": [
        6,
        12,
        18,
        22,
        24,
        25,
        30
      ],
      "boss": false,
      "scale": {
        "target": 1.059,
        "fan": 152
      }
    },
    {
      "id": 7,
      "chapter": 2,
      "name": "步行街开张",
      "days": 30,
      "ap": 2,
      "bizSeconds": 3.2,
      "econMul": 1.3,
      "startCoins": 182,
      "target": 3972,
      "fanTarget": 165,
      "eventDays": [
        6,
        9,
        12,
        18,
        24,
        30
      ],
      "boss": false,
      "scale": {
        "target": 1.071,
        "fan": 165
      }
    },
    {
      "id": 8,
      "chapter": 2,
      "name": "老小区夜市",
      "days": 30,
      "ap": 2,
      "bizSeconds": 3.2,
      "econMul": 1.35,
      "startCoins": 203,
      "target": 4342,
      "fanTarget": 179,
      "eventDays": [
        6,
        12,
        18,
        24,
        30
      ],
      "boss": false,
      "scale": {
        "target": 1.083,
        "fan": 179
      }
    },
    {
      "id": 9,
      "chapter": 3,
      "name": "夜市旺季",
      "days": 30,
      "ap": 2,
      "bizSeconds": 3.2,
      "econMul": 1.4,
      "startCoins": 224,
      "target": 4746,
      "fanTarget": 194,
      "eventDays": [
        6,
        12,
        18,
        24,
        25,
        30
      ],
      "boss": false,
      "scale": {
        "target": 1.095,
        "fan": 194
      }
    },
    {
      "id": 10,
      "chapter": 3,
      "name": "天台淡季",
      "days": 30,
      "ap": 2,
      "bizSeconds": 3.2,
      "econMul": 1.45,
      "startCoins": 247,
      "target": 5395,
      "fanTarget": 218,
      "eventDays": [
        6,
        12,
        18,
        21,
        24,
        28,
        30
      ],
      "boss": true,
      "scale": {
        "target": 1.107,
        "fan": 218
      }
    },
    {
      "id": 11,
      "chapter": 3,
      "name": "地铁口庆典",
      "days": 30,
      "ap": 2,
      "bizSeconds": 3.2,
      "econMul": 1.5,
      "startCoins": 270,
      "target": 5669,
      "fanTarget": 229,
      "eventDays": [
        6,
        10,
        12,
        14,
        18,
        24,
        30
      ],
      "boss": false,
      "scale": {
        "target": 1.119,
        "fan": 229
      }
    },
    {
      "id": 12,
      "chapter": 3,
      "name": "写字楼分号",
      "days": 30,
      "ap": 2,
      "bizSeconds": 3.2,
      "econMul": 1.55,
      "startCoins": 295,
      "target": 6195,
      "fanTarget": 249,
      "eventDays": [
        6,
        12,
        15,
        18,
        24,
        30
      ],
      "boss": false,
      "scale": {
        "target": 1.13,
        "fan": 249
      }
    },
    {
      "id": 13,
      "chapter": 4,
      "name": "写字楼开张",
      "days": 30,
      "ap": 2,
      "bizSeconds": 3.2,
      "econMul": 1.6,
      "startCoins": 320,
      "target": 6769,
      "fanTarget": 271,
      "eventDays": [
        3,
        6,
        7,
        12,
        18,
        24,
        30
      ],
      "boss": false,
      "scale": {
        "target": 1.142,
        "fan": 271
      }
    },
    {
      "id": 14,
      "chapter": 4,
      "name": "步行街夜市",
      "days": 30,
      "ap": 2,
      "bizSeconds": 3.2,
      "econMul": 1.65,
      "startCoins": 347,
      "target": 7395,
      "fanTarget": 294,
      "eventDays": [
        5,
        6,
        12,
        13,
        18,
        24,
        30
      ],
      "boss": false,
      "scale": {
        "target": 1.154,
        "fan": 294
      }
    },
    {
      "id": 15,
      "chapter": 4,
      "name": "老小区旺季",
      "days": 30,
      "ap": 2,
      "bizSeconds": 3.2,
      "econMul": 1.7,
      "startCoins": 374,
      "target": 8401,
      "fanTarget": 329,
      "eventDays": [
        6,
        12,
        16,
        18,
        24,
        30
      ],
      "boss": true,
      "scale": {
        "target": 1.166,
        "fan": 329
      }
    },
    {
      "id": 16,
      "chapter": 4,
      "name": "夜市淡季",
      "days": 30,
      "ap": 2,
      "bizSeconds": 3.2,
      "econMul": 1.75,
      "startCoins": 403,
      "target": 8824,
      "fanTarget": 346,
      "eventDays": [
        6,
        7,
        12,
        18,
        24,
        28,
        30
      ],
      "boss": false,
      "scale": {
        "target": 1.178,
        "fan": 346
      }
    },
    {
      "id": 17,
      "chapter": 5,
      "name": "天台庆典",
      "days": 30,
      "ap": 2,
      "bizSeconds": 3.2,
      "econMul": 1.8,
      "startCoins": 432,
      "target": 9637,
      "fanTarget": 376,
      "eventDays": [
        6,
        12,
        14,
        18,
        24,
        30
      ],
      "boss": false,
      "scale": {
        "target": 1.19,
        "fan": 376
      }
    },
    {
      "id": 18,
      "chapter": 5,
      "name": "地铁口分号",
      "days": 30,
      "ap": 2,
      "bizSeconds": 3.2,
      "econMul": 1.85,
      "startCoins": 463,
      "target": 10524,
      "fanTarget": 408,
      "eventDays": [
        5,
        6,
        8,
        12,
        18,
        24,
        30
      ],
      "boss": false,
      "scale": {
        "target": 1.202,
        "fan": 408
      }
    },
    {
      "id": 19,
      "chapter": 5,
      "name": "地铁口开张",
      "days": 30,
      "ap": 2,
      "bizSeconds": 3.2,
      "econMul": 1.9,
      "startCoins": 494,
      "target": 11492,
      "fanTarget": 443,
      "eventDays": [
        6,
        12,
        18,
        23,
        24,
        30
      ],
      "boss": false,
      "scale": {
        "target": 1.213,
        "fan": 443
      }
    },
    {
      "id": 20,
      "chapter": 5,
      "name": "写字楼夜市",
      "days": 30,
      "ap": 2,
      "bizSeconds": 3.2,
      "econMul": 1.95,
      "startCoins": 527,
      "target": 13049,
      "fanTarget": 495,
      "eventDays": [
        6,
        12,
        18,
        24,
        25,
        30
      ],
      "boss": true,
      "scale": {
        "target": 1.225,
        "fan": 495
      }
    },
    {
      "id": 21,
      "chapter": 6,
      "name": "步行街旺季",
      "days": 30,
      "ap": 2,
      "bizSeconds": 3.2,
      "econMul": 2,
      "startCoins": 560,
      "target": 13698,
      "fanTarget": 522,
      "eventDays": [
        6,
        9,
        12,
        18,
        24,
        30
      ],
      "boss": false,
      "scale": {
        "target": 1.237,
        "fan": 522
      }
    },
    {
      "id": 22,
      "chapter": 6,
      "name": "老小区淡季",
      "days": 30,
      "ap": 2,
      "bizSeconds": 3.2,
      "econMul": 2.05,
      "startCoins": 595,
      "target": 14954,
      "fanTarget": 566,
      "eventDays": [
        6,
        12,
        16,
        17,
        18,
        24,
        30
      ],
      "boss": false,
      "scale": {
        "target": 1.249,
        "fan": 566
      }
    },
    {
      "id": 23,
      "chapter": 6,
      "name": "夜市庆典",
      "days": 30,
      "ap": 2,
      "bizSeconds": 3.2,
      "econMul": 2.1,
      "startCoins": 630,
      "target": 16323,
      "fanTarget": 614,
      "eventDays": [
        6,
        8,
        9,
        12,
        18,
        24,
        30
      ],
      "boss": false,
      "scale": {
        "target": 1.261,
        "fan": 614
      }
    },
    {
      "id": 24,
      "chapter": 6,
      "name": "天台分号",
      "days": 30,
      "ap": 2,
      "bizSeconds": 3.2,
      "econMul": 2.15,
      "startCoins": 667,
      "target": 18528,
      "fanTarget": 687,
      "eventDays": [
        6,
        12,
        15,
        18,
        24,
        30
      ],
      "boss": true,
      "scale": {
        "target": 1.273,
        "fan": 687
      }
    }
  ],
  "saveDefaults": {
    "seenIntro": false
  }
};
