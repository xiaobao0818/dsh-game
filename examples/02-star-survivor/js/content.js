/* =========================================================================
 * content.js —— 全部玩法内容数据（由「游戏工坊」生成，可直接手改）
 * 主题：太空科幻 · 基因：survivor · 关卡：24
 * 改完运行：node tools/build-single.mjs && node tools/check.mjs
 * ========================================================================= */

export const CONTENT = {
  "slug": "survivor-dev",
  "genre": "survivor",
  "title": "星海幸存者",
  "subtitle": "太空科幻 · 无人机的冒险",
  "tagline": "走位躲潮，自动攻击；升级三选一，撑到 Boss 倒下。",
  "orientation": "landscape",
  "config": {
    "seed": 2425638784,
    "maxLevel": 24
  },
  "theme": {
    "id": "space",
    "name": "太空科幻",
    "mood": "space",
    "palette": {
      "sky": [
        "#050a1a",
        "#0f2340"
      ],
      "ground": "#12283a",
      "groundDark": "#081420",
      "accent": "#5ce1ff",
      "accent2": "#ff7ad9",
      "hero": "#9fe8ff",
      "hero2": "#3f8fb8",
      "enemy": "#ff6b8a",
      "enemy2": "#7a2140",
      "gold": "#ffe066",
      "danger": "#ff5d5d",
      "ok": "#5cffb0",
      "ui": "rgba(8,18,32,.86)",
      "ui2": "rgba(120,220,255,.14)",
      "ink": "#050a1a",
      "text": "#ffffff"
    },
    "music": {
      "root": -12,
      "scale": [
        0,
        3,
        5,
        7,
        10
      ],
      "tempo": 92
    }
  },
  "chapters": [
    {
      "name": "废星带·一",
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
      "name": "空间站·二",
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
      "name": "虫洞·三",
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
      "name": "殖民地·四",
      "levels": [
        19,
        20,
        21,
        22,
        23,
        24
      ]
    }
  ],
  "help": {
    "goal": "拖动走位、武器自动开火，在尸潮里活到倒计时归零。击杀掉经验宝石，升级时暂停三选一强化；每关最后刷出 Boss，活过倒计时即胜利（提前击杀 Boss 也能立刻结束）。",
    "controls": [
      "触屏：按住屏幕任意处拖动，角色朝拖动方向移动（虚拟摇杆）",
      "桌面：WASD / 方向键移动，也可以按住鼠标拖动",
      "自动攻击最近的敌人，不需要点攻击；升级时点击卡牌或按 1 / 2 / 3",
      "Esc / P 暂停（外壳按钮在右上角）"
    ],
    "tips": [
      "先堆攻速与伤害，清怪速度就是生命；宝石要主动去捡",
      "被围住时朝敌人最稀的一侧跑，不要停在原地",
      "Boss 出现后绕圈风筝，贴脸会被连续打掉血"
    ]
  },
  "defs": {
    "player": {
      "hp": 112,
      "speed": 214,
      "atk": 13,
      "rate": 0.42,
      "range": 430,
      "projSpeed": 780,
      "radius": 15,
      "magnet": 112,
      "xpBase": 4,
      "xpGrow": 2.2
    },
    "upgrades": [
      {
        "id": "atk",
        "name": "合金·破煞",
        "short": "攻击",
        "desc": "伤害 +22%",
        "icon": "sword",
        "max": 9
      },
      {
        "id": "rate",
        "name": "电池·连珠",
        "short": "攻速",
        "desc": "攻击间隔 -16%",
        "icon": "bolt",
        "max": 9
      },
      {
        "id": "range",
        "name": "芯片·远照",
        "short": "范围",
        "desc": "射程 +14%",
        "icon": "ring",
        "max": 6
      },
      {
        "id": "hp",
        "name": "矿石·续命",
        "short": "生命",
        "desc": "生命上限 +25 并回复 25",
        "icon": "heart",
        "max": 6
      },
      {
        "id": "speed",
        "name": "燃料罐·踏风",
        "short": "移速",
        "desc": "移动速度 +10%",
        "icon": "wing",
        "max": 6
      },
      {
        "id": "multi",
        "name": "数据核·分光",
        "short": "多弹",
        "desc": "同时攻击目标 +1",
        "icon": "split",
        "max": 5
      },
      {
        "id": "pierce",
        "name": "残骸·穿云",
        "short": "穿透",
        "desc": "弹道穿透 +1",
        "icon": "pierce",
        "max": 4
      },
      {
        "id": "magnet",
        "name": "晶体·聚宝",
        "short": "吸附",
        "desc": "拾取范围 +45",
        "icon": "magnet",
        "max": 4
      }
    ],
    "enemies": [
      {
        "id": "grunt",
        "name": "寄生体",
        "role": "melee",
        "hp": 15,
        "speed": 58,
        "atk": 8,
        "radius": 14,
        "xp": 1,
        "scale": 1.16,
        "xpDrop": 1
      },
      {
        "id": "runner",
        "name": "掠夺者",
        "role": "melee",
        "hp": 10,
        "speed": 104,
        "atk": 6,
        "radius": 11,
        "xp": 1,
        "scale": 1.04,
        "xpDrop": 1
      },
      {
        "id": "brute",
        "name": "机械蛛",
        "role": "melee",
        "hp": 52,
        "speed": 40,
        "atk": 17,
        "radius": 20,
        "xp": 3,
        "scale": 1.5,
        "xpDrop": 3
      }
    ],
    "elite": {
      "hpMul": 2.6,
      "atkMul": 1.45,
      "speedMul": 1.12,
      "xp": 5,
      "scaleMul": 1.3,
      "suffix": "·精英"
    },
    "gem": {
      "value": 1,
      "ttl": 30,
      "magnetSpeed": 760
    }
  },
  "levels": [
    {
      "id": 1,
      "chapter": 1,
      "name": "空间站·夜行",
      "hard": false,
      "boss": false,
      "duration": 92,
      "bossAt": 64,
      "rate": 0.8,
      "rateEnd": 2.3,
      "hpMul": 0.68,
      "hpEnd": 1,
      "atkMul": 0.85,
      "speedMul": 0.96,
      "elite": 0.015,
      "cap": 88,
      "types": [
        "grunt"
      ],
      "bossName": "母舰核心",
      "bossHp": 1080,
      "bossAtk": 19,
      "bossSpeed": 62
    },
    {
      "id": 2,
      "chapter": 1,
      "name": "虫洞·绝境",
      "hard": false,
      "boss": false,
      "duration": 95,
      "bossAt": 67,
      "rate": 0.83,
      "rateEnd": 2.42,
      "hpMul": 0.684,
      "hpEnd": 1.048,
      "atkMul": 0.887,
      "speedMul": 0.97,
      "elite": 0.019,
      "cap": 91,
      "types": [
        "grunt"
      ],
      "bossName": "虚空领主",
      "bossHp": 1235,
      "bossAtk": 19.7,
      "bossSpeed": 62.7
    },
    {
      "id": 3,
      "chapter": 1,
      "name": "殖民地·初潮",
      "hard": false,
      "boss": false,
      "duration": 98,
      "bossAt": 71,
      "rate": 0.87,
      "rateEnd": 2.53,
      "hpMul": 0.689,
      "hpEnd": 1.096,
      "atkMul": 0.924,
      "speedMul": 0.981,
      "elite": 0.023,
      "cap": 93,
      "types": [
        "grunt",
        "runner"
      ],
      "bossName": "机械暴君",
      "bossHp": 1390,
      "bossAtk": 20.3,
      "bossSpeed": 63.4
    },
    {
      "id": 4,
      "chapter": 1,
      "name": "母舰·血月",
      "hard": false,
      "boss": false,
      "duration": 100,
      "bossAt": 73,
      "rate": 0.9,
      "rateEnd": 2.65,
      "hpMul": 0.693,
      "hpEnd": 1.143,
      "atkMul": 0.961,
      "speedMul": 0.991,
      "elite": 0.027,
      "cap": 96,
      "types": [
        "grunt",
        "runner"
      ],
      "bossName": "星蚀者",
      "bossHp": 1545,
      "bossAtk": 21,
      "bossSpeed": 64.1
    },
    {
      "id": 5,
      "chapter": 1,
      "name": "边境·余烬",
      "hard": true,
      "boss": true,
      "duration": 111,
      "bossAt": 84,
      "rate": 1.06,
      "rateEnd": 3.02,
      "hpMul": 0.697,
      "hpEnd": 1.191,
      "atkMul": 0.998,
      "speedMul": 1.002,
      "elite": 0.056,
      "cap": 99,
      "types": [
        "grunt",
        "runner",
        "brute"
      ],
      "bossName": "母舰核心",
      "bossHp": 1904,
      "bossAtk": 21.6,
      "bossSpeed": 64.8
    },
    {
      "id": 6,
      "chapter": 1,
      "name": "废星带·围困",
      "hard": false,
      "boss": false,
      "duration": 106,
      "bossAt": 80,
      "rate": 0.97,
      "rateEnd": 2.89,
      "hpMul": 0.702,
      "hpEnd": 1.239,
      "atkMul": 1.035,
      "speedMul": 1.012,
      "elite": 0.035,
      "cap": 101,
      "types": [
        "grunt",
        "runner",
        "brute"
      ],
      "bossName": "虚空领主",
      "bossHp": 1855,
      "bossAtk": 22.3,
      "bossSpeed": 65.5
    },
    {
      "id": 7,
      "chapter": 2,
      "name": "空间站·余烬",
      "hard": false,
      "boss": false,
      "duration": 109,
      "bossAt": 83,
      "rate": 1.01,
      "rateEnd": 3,
      "hpMul": 0.706,
      "hpEnd": 1.287,
      "atkMul": 1.072,
      "speedMul": 1.023,
      "elite": 0.038,
      "cap": 104,
      "types": [
        "grunt",
        "runner",
        "brute"
      ],
      "bossName": "机械暴君",
      "bossHp": 2010,
      "bossAtk": 22.9,
      "bossSpeed": 66.2
    },
    {
      "id": 8,
      "chapter": 2,
      "name": "虫洞·围困",
      "hard": false,
      "boss": false,
      "duration": 111,
      "bossAt": 85,
      "rate": 1.04,
      "rateEnd": 3.12,
      "hpMul": 0.71,
      "hpEnd": 1.335,
      "atkMul": 1.109,
      "speedMul": 1.033,
      "elite": 0.042,
      "cap": 107,
      "types": [
        "grunt",
        "runner",
        "brute"
      ],
      "bossName": "星蚀者",
      "bossHp": 2165,
      "bossAtk": 23.6,
      "bossSpeed": 66.9
    },
    {
      "id": 9,
      "chapter": 2,
      "name": "殖民地·终焉",
      "hard": false,
      "boss": false,
      "duration": 114,
      "bossAt": 89,
      "rate": 1.08,
      "rateEnd": 3.24,
      "hpMul": 0.715,
      "hpEnd": 1.383,
      "atkMul": 1.146,
      "speedMul": 1.043,
      "elite": 0.046,
      "cap": 110,
      "types": [
        "grunt",
        "grunt",
        "runner",
        "brute"
      ],
      "bossName": "母舰核心",
      "bossHp": 2320,
      "bossAtk": 24.2,
      "bossSpeed": 67.6
    },
    {
      "id": 10,
      "chapter": 2,
      "name": "母舰·夜行",
      "hard": true,
      "boss": true,
      "duration": 125,
      "bossAt": 100,
      "rate": 1.23,
      "rateEnd": 3.61,
      "hpMul": 0.719,
      "hpEnd": 1.43,
      "atkMul": 1.183,
      "speedMul": 1.054,
      "elite": 0.075,
      "cap": 112,
      "types": [
        "grunt",
        "grunt",
        "runner",
        "brute"
      ],
      "bossName": "虚空领主",
      "bossHp": 2772,
      "bossAtk": 24.9,
      "bossSpeed": 68.3
    },
    {
      "id": 11,
      "chapter": 2,
      "name": "边境·绝境",
      "hard": false,
      "boss": false,
      "duration": 120,
      "bossAt": 95,
      "rate": 1.15,
      "rateEnd": 3.47,
      "hpMul": 0.723,
      "hpEnd": 1.478,
      "atkMul": 1.22,
      "speedMul": 1.064,
      "elite": 0.054,
      "cap": 115,
      "types": [
        "grunt",
        "grunt",
        "runner",
        "brute"
      ],
      "bossName": "机械暴君",
      "bossHp": 2630,
      "bossAtk": 25.5,
      "bossSpeed": 69
    },
    {
      "id": 12,
      "chapter": 2,
      "name": "废星带·初潮",
      "hard": false,
      "boss": false,
      "duration": 123,
      "bossAt": 99,
      "rate": 1.18,
      "rateEnd": 3.59,
      "hpMul": 0.728,
      "hpEnd": 1.526,
      "atkMul": 1.257,
      "speedMul": 1.075,
      "elite": 0.058,
      "cap": 118,
      "types": [
        "grunt",
        "grunt",
        "runner",
        "brute"
      ],
      "bossName": "星蚀者",
      "bossHp": 2785,
      "bossAtk": 26.2,
      "bossSpeed": 69.7
    },
    {
      "id": 13,
      "chapter": 3,
      "name": "空间站·绝境",
      "hard": false,
      "boss": false,
      "duration": 125,
      "bossAt": 101,
      "rate": 1.22,
      "rateEnd": 3.71,
      "hpMul": 0.732,
      "hpEnd": 1.574,
      "atkMul": 1.293,
      "speedMul": 1.085,
      "elite": 0.062,
      "cap": 120,
      "types": [
        "grunt",
        "grunt",
        "runner",
        "brute"
      ],
      "bossName": "母舰核心",
      "bossHp": 2939,
      "bossAtk": 26.8,
      "bossSpeed": 70.3
    },
    {
      "id": 14,
      "chapter": 3,
      "name": "虫洞·初潮",
      "hard": false,
      "boss": false,
      "duration": 128,
      "bossAt": 105,
      "rate": 1.25,
      "rateEnd": 3.83,
      "hpMul": 0.737,
      "hpEnd": 1.622,
      "atkMul": 1.33,
      "speedMul": 1.096,
      "elite": 0.066,
      "cap": 123,
      "types": [
        "grunt",
        "grunt",
        "runner",
        "brute"
      ],
      "bossName": "虚空领主",
      "bossHp": 3094,
      "bossAtk": 27.5,
      "bossSpeed": 71
    },
    {
      "id": 15,
      "chapter": 3,
      "name": "殖民地·血月",
      "hard": true,
      "boss": true,
      "duration": 139,
      "bossAt": 116,
      "rate": 1.41,
      "rateEnd": 4.19,
      "hpMul": 0.741,
      "hpEnd": 1.67,
      "atkMul": 1.367,
      "speedMul": 1.106,
      "elite": 0.095,
      "cap": 126,
      "types": [
        "grunt",
        "grunt",
        "runner",
        "brute"
      ],
      "bossName": "机械暴君",
      "bossHp": 3639,
      "bossAtk": 28.1,
      "bossSpeed": 71.7
    },
    {
      "id": 16,
      "chapter": 3,
      "name": "母舰·余烬",
      "hard": false,
      "boss": false,
      "duration": 134,
      "bossAt": 111,
      "rate": 1.32,
      "rateEnd": 4.06,
      "hpMul": 0.745,
      "hpEnd": 1.717,
      "atkMul": 1.404,
      "speedMul": 1.117,
      "elite": 0.074,
      "cap": 128,
      "types": [
        "grunt",
        "grunt",
        "runner",
        "brute"
      ],
      "bossName": "星蚀者",
      "bossHp": 3404,
      "bossAtk": 28.8,
      "bossSpeed": 72.4
    },
    {
      "id": 17,
      "chapter": 3,
      "name": "边境·围困",
      "hard": false,
      "boss": false,
      "duration": 137,
      "bossAt": 115,
      "rate": 1.36,
      "rateEnd": 4.18,
      "hpMul": 0.75,
      "hpEnd": 1.765,
      "atkMul": 1.441,
      "speedMul": 1.127,
      "elite": 0.078,
      "cap": 131,
      "types": [
        "grunt",
        "grunt",
        "runner",
        "brute"
      ],
      "bossName": "母舰核心",
      "bossHp": 3559,
      "bossAtk": 29.4,
      "bossSpeed": 73.1
    },
    {
      "id": 18,
      "chapter": 3,
      "name": "废星带·终焉",
      "hard": false,
      "boss": false,
      "duration": 139,
      "bossAt": 117,
      "rate": 1.39,
      "rateEnd": 4.3,
      "hpMul": 0.754,
      "hpEnd": 1.813,
      "atkMul": 1.478,
      "speedMul": 1.137,
      "elite": 0.082,
      "cap": 134,
      "types": [
        "grunt",
        "grunt",
        "runner",
        "brute"
      ],
      "bossName": "虚空领主",
      "bossHp": 3714,
      "bossAtk": 30.1,
      "bossSpeed": 73.8
    },
    {
      "id": 19,
      "chapter": 4,
      "name": "空间站·围困",
      "hard": false,
      "boss": false,
      "duration": 142,
      "bossAt": 120,
      "rate": 1.43,
      "rateEnd": 4.41,
      "hpMul": 0.758,
      "hpEnd": 1.861,
      "atkMul": 1.515,
      "speedMul": 1.148,
      "elite": 0.085,
      "cap": 137,
      "types": [
        "grunt",
        "grunt",
        "runner",
        "brute"
      ],
      "bossName": "机械暴君",
      "bossHp": 3869,
      "bossAtk": 30.7,
      "bossSpeed": 74.5
    },
    {
      "id": 20,
      "chapter": 4,
      "name": "虫洞·终焉",
      "hard": true,
      "boss": true,
      "duration": 153,
      "bossAt": 132,
      "rate": 1.58,
      "rateEnd": 4.78,
      "hpMul": 0.763,
      "hpEnd": 1.909,
      "atkMul": 1.552,
      "speedMul": 1.158,
      "elite": 0.114,
      "cap": 139,
      "types": [
        "grunt",
        "grunt",
        "runner",
        "brute"
      ],
      "bossName": "星蚀者",
      "bossHp": 4507,
      "bossAtk": 31.4,
      "bossSpeed": 75.2
    },
    {
      "id": 21,
      "chapter": 4,
      "name": "殖民地·夜行",
      "hard": false,
      "boss": false,
      "duration": 148,
      "bossAt": 127,
      "rate": 1.5,
      "rateEnd": 4.65,
      "hpMul": 0.767,
      "hpEnd": 1.957,
      "atkMul": 1.589,
      "speedMul": 1.169,
      "elite": 0.093,
      "cap": 142,
      "types": [
        "grunt",
        "grunt",
        "runner",
        "brute"
      ],
      "bossName": "母舰核心",
      "bossHp": 4179,
      "bossAtk": 32,
      "bossSpeed": 75.9
    },
    {
      "id": 22,
      "chapter": 4,
      "name": "母舰·绝境",
      "hard": false,
      "boss": false,
      "duration": 150,
      "bossAt": 129,
      "rate": 1.53,
      "rateEnd": 4.77,
      "hpMul": 0.771,
      "hpEnd": 2.004,
      "atkMul": 1.626,
      "speedMul": 1.179,
      "elite": 0.097,
      "cap": 145,
      "types": [
        "grunt",
        "grunt",
        "runner",
        "brute"
      ],
      "bossName": "虚空领主",
      "bossHp": 4334,
      "bossAtk": 32.7,
      "bossSpeed": 76.6
    },
    {
      "id": 23,
      "chapter": 4,
      "name": "边境·初潮",
      "hard": false,
      "boss": false,
      "duration": 153,
      "bossAt": 133,
      "rate": 1.57,
      "rateEnd": 4.88,
      "hpMul": 0.776,
      "hpEnd": 2.052,
      "atkMul": 1.663,
      "speedMul": 1.19,
      "elite": 0.101,
      "cap": 147,
      "types": [
        "grunt",
        "grunt",
        "runner",
        "brute"
      ],
      "bossName": "机械暴君",
      "bossHp": 4489,
      "bossAtk": 33.3,
      "bossSpeed": 77.3
    },
    {
      "id": 24,
      "chapter": 4,
      "name": "废星带·血月",
      "hard": true,
      "boss": true,
      "duration": 164,
      "bossAt": 144,
      "rate": 1.72,
      "rateEnd": 5.25,
      "hpMul": 0.78,
      "hpEnd": 2.1,
      "atkMul": 1.7,
      "speedMul": 1.2,
      "elite": 0.13,
      "cap": 150,
      "types": [
        "grunt",
        "grunt",
        "runner",
        "brute"
      ],
      "bossName": "星蚀者",
      "bossHp": 5201,
      "bossAtk": 34,
      "bossSpeed": 78
    }
  ],
  "saveDefaults": {},
  "brief": "太空科幻题材的割草生存，24关，横屏"
};
