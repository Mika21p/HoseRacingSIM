(function () {
  const ns = (window.Keiba = window.Keiba || {});
  // Game-only performance anchors. Not official ratings and not calculated from time.
  // 1999 年的马主是现代实龄四岁（旧制五岁），赛历只收草地质地 1800–3200 米、
  // 当年对五岁以上开放的重赏与主要前哨赛；数值尺度与 1998 年同一套游戏标定。
  // 标定口径：G1 落在 4%–12%，G2/G3 前哨赛落在 20%–35%，
  // 十二月的有马纪念因为玩家马已过巅峰（衰退期），取最严格的 4% 左右。
  const scores = {
    "nakayama-kimpai": [103, 100, 97, 94, 91],
    "kyoto-kinen": [105, 101, 98, 95, 92],
    "hanshin-daishoten": [105, 102, 98, 95, 93],
    "nikkei-sho": [105, 102, 100, 97, 94],
    "osaka-hai": [104, 101, 98, 96, 94],
    "tenno-sho-haru": [107, 104, 101, 98, 95],
    "takarazuka-kinen": [108, 105, 102, 98, 95],
    "sapporo-kinen": [105, 102, 99, 96, 94],
    "sankei-sho-all-comers": [105, 102, 99, 96, 93],
    "mainichi-okan": [106, 102, 100, 97, 94],
    "kyoto-daishoten": [106, 105, 102, 99, 96],
    "tenno-sho-aki": [107, 104, 101, 98, 95],
    "japan-cup": [109, 107, 104, 101, 98],
    "arima-kinen": [107, 104, 101, 98, 95]
  };
  ns.EraPerformances = Object.assign(ns.EraPerformances || {}, Object.fromEntries(Object.entries(scores).map(([id, values]) => [`1999-${id}`, { source: "era-calibrated", values, revision: 1 }])));
})();
