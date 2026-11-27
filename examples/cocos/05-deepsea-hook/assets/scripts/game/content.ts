// @ts-nocheck
/* 全部玩法内容（由游戏工坊生成，可直接手改；改完重新构建） */
export const CONTENT = {
  "slug": "hook",
  "genre": "hook",
  "title": "深海打捞",
  "subtitle": "海底打捞 · 深海机师的冒险",
  "tagline": "摆钩抓宝，越重越慢；限时达标，升级钩爪。",
  "orientation": "portrait",
  "config": {
    "seed": 2630291758,
    "maxLevel": 24
  },
  "theme": {
    "id": "ocean",
    "name": "海底打捞",
    "mood": "underwater",
    "keywords": [
      "海底",
      "海洋",
      "打捞",
      "深海",
      "鱼",
      "潜水",
      "海盗",
      "宝藏",
      "渔",
      "ocean",
      "sea",
      "fish",
      "dive",
      "treasure"
    ],
    "palette": {
      "sky": [
        "#062a3a",
        "#0c5a6e"
      ],
      "ground": "#0a3a4a",
      "groundDark": "#04202b",
      "accent": "#5ce1e6",
      "accent2": "#ffd166",
      "hero": "#bff3ff",
      "hero2": "#3f8fa8",
      "enemy": "#ff8a6a",
      "enemy2": "#7a3040",
      "gold": "#ffe066",
      "danger": "#ff5d5d",
      "ok": "#6ff0c0",
      "ui": "rgba(6,30,42,.86)",
      "ui2": "rgba(140,240,255,.14)",
      "ink": "#041a22",
      "text": "#ffffff"
    },
    "music": {
      "root": -10,
      "scale": [
        0,
        3,
        5,
        7,
        10
      ],
      "tempo": 72
    },
    "vocab": {
      "hero": [
        "潜水员",
        "渔夫",
        "船长",
        "水手",
        "深海机师",
        "打捞员"
      ],
      "enemy": [
        "电鳗",
        "鲨鱼",
        "章鱼",
        "水母群",
        "螃蟹怪",
        "海盗"
      ],
      "boss": [
        "巨型章鱼",
        "幽灵船主",
        "深海巨鲨",
        "海妖"
      ],
      "building": [
        "木筏",
        "渔网",
        "氧气站",
        "打捞机",
        "灯塔",
        "船坞"
      ],
      "item": [
        "珍珠",
        "珊瑚",
        "金锭",
        "旧瓶",
        "海星",
        "破罐",
        "宝石",
        "鱼干"
      ],
      "place": [
        "浅滩",
        "珊瑚海",
        "沉船区",
        "深海沟",
        "漩涡",
        "幽灵湾"
      ],
      "power": [
        "声呐",
        "渔网",
        "氧气补给",
        "探照灯",
        "鱼群",
        "深海炸弹"
      ],
      "currency": "金币"
    }
  },
  "chapters": [
    {
      "name": "浅滩",
      "levels": [
        1,
        2,
        3,
        4
      ]
    },
    {
      "name": "珊瑚海",
      "levels": [
        5,
        6,
        7,
        8
      ]
    },
    {
      "name": "沉船区",
      "levels": [
        9,
        10,
        11,
        12
      ]
    },
    {
      "name": "深海沟",
      "levels": [
        13,
        14,
        15,
        16
      ]
    },
    {
      "name": "漩涡",
      "levels": [
        17,
        18,
        19,
        20
      ]
    },
    {
      "name": "幽灵湾",
      "levels": [
        21,
        22,
        23,
        24
      ]
    }
  ],
  "help": {
    "goal": "站在海底木筏上摆动钩爪，把水里的宝物抓回来。每关限时，得分达到目标分即过关；提前达标可点底部收工按钮结算，剩下的时间继续捞可以拿更高星级。",
    "controls": [
      "点击屏幕 / 空格：沿当前摆动方向发射钩爪",
      "抓到宝物加分；越重的宝物回收越慢",
      "危险物（废旧/爆裂/危险生物）会扣分，抓到爆弹还会短暂僵直",
      "关卡开始前可以用金币升级：力度 / 绞盘 / 瞄准 / 幸运"
    ],
    "tips": [
      "摆到目标正上方再出手，斜着打绳子更长、回得更慢",
      "先把目标分稳住，再用富余时间捞重宝冲三星",
      "重宝在深水（画面更上方），要留足回收时间"
    ]
  },
  "defs": {
    "items": [
      {
        "id": "i0",
        "name": "珍珠",
        "tier": 0,
        "tag": "轻",
        "value": 26,
        "weight": 0.5,
        "r": 20,
        "shape": "coin",
        "color": "gold"
      },
      {
        "id": "i1",
        "name": "珊瑚",
        "tier": 0,
        "tag": "轻",
        "value": 26,
        "weight": 0.5,
        "r": 20,
        "shape": "crystal",
        "color": "gold"
      },
      {
        "id": "i2",
        "name": "金锭",
        "tier": 1,
        "tag": "中",
        "value": 68,
        "weight": 1.1,
        "r": 23,
        "shape": "gem",
        "color": "accent"
      },
      {
        "id": "i3",
        "name": "旧瓶",
        "tier": 1,
        "tag": "中",
        "value": 68,
        "weight": 1.1,
        "r": 23,
        "shape": "pearl",
        "color": "accent"
      },
      {
        "id": "i4",
        "name": "海星",
        "tier": 2,
        "tag": "重",
        "value": 165,
        "weight": 2,
        "r": 27,
        "shape": "urn",
        "color": "hero"
      },
      {
        "id": "i5",
        "name": "破罐",
        "tier": 2,
        "tag": "重",
        "value": 165,
        "weight": 2,
        "r": 27,
        "shape": "chest",
        "color": "hero"
      },
      {
        "id": "i6",
        "name": "宝石",
        "tier": 2,
        "tag": "重",
        "value": 165,
        "weight": 2,
        "r": 27,
        "shape": "urn",
        "color": "hero"
      },
      {
        "id": "i7",
        "name": "鱼干",
        "tier": 3,
        "tag": "珍",
        "value": 380,
        "weight": 2.4,
        "r": 31,
        "shape": "orb",
        "color": "ok"
      }
    ],
    "hazards": [
      {
        "id": "j0",
        "name": "废旧珍珠",
        "kind": "junk",
        "value": -12,
        "weight": 1.5,
        "r": 21,
        "shape": "rubble",
        "color": "ground"
      },
      {
        "id": "j1",
        "name": "废旧旧瓶",
        "kind": "junk",
        "value": -16,
        "weight": 1.6,
        "r": 21,
        "shape": "rubble",
        "color": "ground"
      },
      {
        "id": "b0",
        "name": "爆裂金锭",
        "kind": "bomb",
        "value": -78,
        "weight": 2,
        "r": 25,
        "shape": "bomb",
        "color": "danger"
      },
      {
        "id": "b1",
        "name": "爆裂破罐",
        "kind": "bomb",
        "value": -92,
        "weight": 2.2,
        "r": 25,
        "shape": "bomb",
        "color": "danger"
      },
      {
        "id": "c0",
        "name": "电鳗",
        "kind": "beast",
        "value": -58,
        "weight": 1.7,
        "r": 24,
        "shape": "spike",
        "color": "enemy"
      },
      {
        "id": "c1",
        "name": "鲨鱼",
        "kind": "beast",
        "value": -66,
        "weight": 1.8,
        "r": 24,
        "shape": "spike",
        "color": "enemy"
      }
    ],
    "upgrades": [
      {
        "id": "power",
        "name": "钩爪力度",
        "desc": "发射更快，重物拉得更省力",
        "base": 90,
        "growth": 1.6,
        "max": 5,
        "color": "accent2",
        "costUnit": "金币"
      },
      {
        "id": "reel",
        "name": "回收绞盘",
        "desc": "收绳更快，每趟更省时间",
        "base": 80,
        "growth": 1.6,
        "max": 5,
        "color": "hero",
        "costUnit": "金币"
      },
      {
        "id": "aim",
        "name": "瞄准精度",
        "desc": "摆钩更稳，发射带轻微吸附",
        "base": 100,
        "growth": 1.6,
        "max": 5,
        "color": "ok",
        "costUnit": "金币"
      },
      {
        "id": "luck",
        "name": "潮汐幸运",
        "desc": "稀有宝物出现概率提升",
        "base": 120,
        "growth": 1.6,
        "max": 5,
        "color": "gold",
        "costUnit": "金币"
      }
    ],
    "economy": {
      "startCoins": 160,
      "winBase": 34,
      "winPerLevel": 5,
      "starBonus": 16,
      "scoreCoins": 0.02
    },
    "tiers": [
      {
        "tier": 0,
        "tag": "轻",
        "value": 26,
        "weight": 0.5,
        "r": 20
      },
      {
        "tier": 1,
        "tag": "中",
        "value": 68,
        "weight": 1.1,
        "r": 23
      },
      {
        "tier": 2,
        "tag": "重",
        "value": 165,
        "weight": 2,
        "r": 27
      },
      {
        "tier": 3,
        "tag": "珍",
        "value": 380,
        "weight": 2.4,
        "r": 31
      }
    ]
  },
  "levels": [
    {
      "id": 1,
      "chapter": 1,
      "name": "浅滩·宝石",
      "sec": 62,
      "target": 1090,
      "star2": 1450,
      "star3": 1730,
      "items": 32,
      "tiers": [
        0.52,
        0.3,
        0.14,
        0.04
      ],
      "hazard": 0.13,
      "bomb": 0.34,
      "valueScale": 1,
      "hard": false,
      "boss": false
    },
    {
      "id": 2,
      "chapter": 1,
      "name": "浅滩·鱼干",
      "sec": 64,
      "target": 1170,
      "star2": 1560,
      "star3": 1860,
      "items": 33,
      "tiers": [
        0.512,
        0.3,
        0.145,
        0.043
      ],
      "hazard": 0.136,
      "bomb": 0.347,
      "valueScale": 1.024,
      "hard": false,
      "boss": false
    },
    {
      "id": 3,
      "chapter": 1,
      "name": "浅滩·珍珠",
      "sec": 66,
      "target": 1230,
      "star2": 1630,
      "star3": 1940,
      "items": 33,
      "tiers": [
        0.503,
        0.3,
        0.15,
        0.047
      ],
      "hazard": 0.141,
      "bomb": 0.354,
      "valueScale": 1.048,
      "hard": false,
      "boss": false
    },
    {
      "id": 4,
      "chapter": 1,
      "name": "浅滩·珊瑚",
      "sec": 67,
      "target": 1350,
      "star2": 1660,
      "star3": 1980,
      "items": 34,
      "tiers": [
        0.495,
        0.3,
        0.154,
        0.05
      ],
      "hazard": 0.187,
      "bomb": 0.361,
      "valueScale": 1.072,
      "hard": true,
      "boss": true
    },
    {
      "id": 5,
      "chapter": 2,
      "name": "珊瑚海·金锭",
      "sec": 69,
      "target": 1390,
      "star2": 1810,
      "star3": 2170,
      "items": 34,
      "tiers": [
        0.487,
        0.3,
        0.159,
        0.054
      ],
      "hazard": 0.153,
      "bomb": 0.368,
      "valueScale": 1.096,
      "hard": false,
      "boss": false
    },
    {
      "id": 6,
      "chapter": 2,
      "name": "珊瑚海·旧瓶",
      "sec": 71,
      "target": 1490,
      "star2": 1940,
      "star3": 2320,
      "items": 35,
      "tiers": [
        0.479,
        0.3,
        0.164,
        0.057
      ],
      "hazard": 0.158,
      "bomb": 0.375,
      "valueScale": 1.12,
      "hard": false,
      "boss": false
    },
    {
      "id": 7,
      "chapter": 2,
      "name": "珊瑚海·海星",
      "sec": 73,
      "target": 1600,
      "star2": 2070,
      "star3": 2480,
      "items": 36,
      "tiers": [
        0.47,
        0.3,
        0.169,
        0.061
      ],
      "hazard": 0.164,
      "bomb": 0.382,
      "valueScale": 1.143,
      "hard": false,
      "boss": false
    },
    {
      "id": 8,
      "chapter": 2,
      "name": "珊瑚海·破罐",
      "sec": 75,
      "target": 1690,
      "star2": 2040,
      "star3": 2430,
      "items": 36,
      "tiers": [
        0.462,
        0.3,
        0.173,
        0.064
      ],
      "hazard": 0.21,
      "bomb": 0.389,
      "valueScale": 1.167,
      "hard": true,
      "boss": true
    },
    {
      "id": 9,
      "chapter": 3,
      "name": "沉船区·宝石",
      "sec": 76,
      "target": 1780,
      "star2": 2290,
      "star3": 2730,
      "items": 37,
      "tiers": [
        0.454,
        0.3,
        0.178,
        0.068
      ],
      "hazard": 0.175,
      "bomb": 0.396,
      "valueScale": 1.191,
      "hard": false,
      "boss": false
    },
    {
      "id": 10,
      "chapter": 3,
      "name": "沉船区·鱼干",
      "sec": 78,
      "target": 1850,
      "star2": 2360,
      "star3": 2820,
      "items": 37,
      "tiers": [
        0.446,
        0.3,
        0.183,
        0.071
      ],
      "hazard": 0.181,
      "bomb": 0.403,
      "valueScale": 1.215,
      "hard": false,
      "boss": false
    },
    {
      "id": 11,
      "chapter": 3,
      "name": "沉船区·珍珠",
      "sec": 80,
      "target": 1980,
      "star2": 2520,
      "star3": 3000,
      "items": 38,
      "tiers": [
        0.437,
        0.3,
        0.188,
        0.075
      ],
      "hazard": 0.187,
      "bomb": 0.41,
      "valueScale": 1.239,
      "hard": false,
      "boss": false
    },
    {
      "id": 12,
      "chapter": 3,
      "name": "沉船区·珊瑚",
      "sec": 82,
      "target": 2140,
      "star2": 2530,
      "star3": 3030,
      "items": 39,
      "tiers": [
        0.429,
        0.3,
        0.193,
        0.078
      ],
      "hazard": 0.232,
      "bomb": 0.417,
      "valueScale": 1.263,
      "hard": true,
      "boss": true
    },
    {
      "id": 13,
      "chapter": 4,
      "name": "深海沟·金锭",
      "sec": 84,
      "target": 2190,
      "star2": 2750,
      "star3": 3290,
      "items": 39,
      "tiers": [
        0.421,
        0.3,
        0.197,
        0.082
      ],
      "hazard": 0.198,
      "bomb": 0.423,
      "valueScale": 1.287,
      "hard": false,
      "boss": false
    },
    {
      "id": 14,
      "chapter": 4,
      "name": "深海沟·旧瓶",
      "sec": 85,
      "target": 2320,
      "star2": 2910,
      "star3": 3480,
      "items": 40,
      "tiers": [
        0.413,
        0.3,
        0.202,
        0.085
      ],
      "hazard": 0.203,
      "bomb": 0.43,
      "valueScale": 1.311,
      "hard": false,
      "boss": false
    },
    {
      "id": 15,
      "chapter": 4,
      "name": "深海沟·海星",
      "sec": 87,
      "target": 2470,
      "star2": 3080,
      "star3": 3680,
      "items": 41,
      "tiers": [
        0.404,
        0.3,
        0.207,
        0.089
      ],
      "hazard": 0.209,
      "bomb": 0.437,
      "valueScale": 1.335,
      "hard": false,
      "boss": false
    },
    {
      "id": 16,
      "chapter": 4,
      "name": "深海沟·破罐",
      "sec": 89,
      "target": 2590,
      "star2": 3010,
      "star3": 3590,
      "items": 41,
      "tiers": [
        0.396,
        0.3,
        0.212,
        0.092
      ],
      "hazard": 0.255,
      "bomb": 0.444,
      "valueScale": 1.359,
      "hard": true,
      "boss": true
    },
    {
      "id": 17,
      "chapter": 5,
      "name": "漩涡·宝石",
      "sec": 91,
      "target": 2710,
      "star2": 3350,
      "star3": 4000,
      "items": 42,
      "tiers": [
        0.388,
        0.3,
        0.217,
        0.096
      ],
      "hazard": 0.22,
      "bomb": 0.451,
      "valueScale": 1.383,
      "hard": false,
      "boss": false
    },
    {
      "id": 18,
      "chapter": 5,
      "name": "漩涡·鱼干",
      "sec": 93,
      "target": 2790,
      "star2": 3440,
      "star3": 4110,
      "items": 42,
      "tiers": [
        0.38,
        0.3,
        0.221,
        0.099
      ],
      "hazard": 0.226,
      "bomb": 0.458,
      "valueScale": 1.407,
      "hard": false,
      "boss": false
    },
    {
      "id": 19,
      "chapter": 5,
      "name": "漩涡·珍珠",
      "sec": 94,
      "target": 2950,
      "star2": 3620,
      "star3": 4320,
      "items": 43,
      "tiers": [
        0.371,
        0.3,
        0.226,
        0.103
      ],
      "hazard": 0.232,
      "bomb": 0.465,
      "valueScale": 1.43,
      "hard": false,
      "boss": false
    },
    {
      "id": 20,
      "chapter": 5,
      "name": "漩涡·珊瑚",
      "sec": 96,
      "target": 3150,
      "star2": 3600,
      "star3": 4310,
      "items": 44,
      "tiers": [
        0.363,
        0.3,
        0.231,
        0.106
      ],
      "hazard": 0.277,
      "bomb": 0.472,
      "valueScale": 1.454,
      "hard": true,
      "boss": true
    },
    {
      "id": 21,
      "chapter": 6,
      "name": "幽灵湾·金锭",
      "sec": 98,
      "target": 3220,
      "star2": 3910,
      "star3": 4670,
      "items": 44,
      "tiers": [
        0.355,
        0.3,
        0.236,
        0.11
      ],
      "hazard": 0.243,
      "bomb": 0.479,
      "valueScale": 1.478,
      "hard": false,
      "boss": false
    },
    {
      "id": 22,
      "chapter": 6,
      "name": "幽灵湾·旧瓶",
      "sec": 100,
      "target": 3380,
      "star2": 4090,
      "star3": 4890,
      "items": 45,
      "tiers": [
        0.347,
        0.3,
        0.24,
        0.113
      ],
      "hazard": 0.249,
      "bomb": 0.486,
      "valueScale": 1.502,
      "hard": false,
      "boss": false
    },
    {
      "id": 23,
      "chapter": 6,
      "name": "幽灵湾·海星",
      "sec": 102,
      "target": 3490,
      "star2": 4210,
      "star3": 5030,
      "items": 45,
      "tiers": [
        0.338,
        0.3,
        0.245,
        0.117
      ],
      "hazard": 0.254,
      "bomb": 0.493,
      "valueScale": 1.526,
      "hard": false,
      "boss": false
    },
    {
      "id": 24,
      "chapter": 6,
      "name": "幽灵湾·破罐",
      "sec": 103,
      "target": 3700,
      "star2": 4160,
      "star3": 4970,
      "items": 46,
      "tiers": [
        0.33,
        0.3,
        0.25,
        0.12
      ],
      "hazard": 0.3,
      "bomb": 0.5,
      "valueScale": 1.55,
      "hard": true,
      "boss": true
    }
  ],
  "resultKillLabel": "捞取",
  "saveDefaults": {
    "coins": 160,
    "upgrades": {
      "power": 0,
      "reel": 0,
      "aim": 0,
      "luck": 0
    }
  }
};
