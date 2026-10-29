(function () {
  const ns = (window.Keiba = window.Keiba || {});
  // Game-only performance anchors. Not official ratings and not calculated from time.
  const scores = {
    "kisaragi-sho": [99, 95, 92, 90, 88],
    "yayoi-sho": [103, 101, 97, 91, 89],
    "spring-stakes": [99, 97, 94, 92, 89],
    "mainichi-hai": [100, 99, 94, 94, 91],
    "satsuki-sho": [105, 103, 101, 96, 94],
    "aoba-sho": [101, 97, 94, 92, 90],
    "tokyo-yushun": [106, 99, 97, 96, 94],
    "takarazuka-kinen": [108, 105, 102, 97, 95],
    "kobe-shimbun-hai": [102, 99, 97, 94, 92],
    "st-lite-kinen": [101, 98, 95, 93, 91],
    "kyoto-shimbun-hai": [104, 101, 97, 95, 93],
    "tenno-sho-aki": [105, 103, 100, 98, 94],
    "kikka-sho": [107, 103, 100, 98, 97],
    "japan-cup": [109, 106, 104, 101, 98],
    "arima-kinen": [108, 105, 102, 99, 96]
  };
  ns.EraPerformances = Object.assign(ns.EraPerformances || {}, Object.fromEntries(Object.entries(scores).map(([id, values]) => [`1998-${id}`, { source: "era-calibrated", values, revision: 1 }])));
})();
