(function () {
  const ns = (window.Keiba = window.Keiba || {});
  // Prototype entry rights, not a reconstruction of historical earnings/balloting rules.
  // 1999 年的马龄：当年的“五岁”（JBIS 作 サラ系５才）对应游戏里的四岁，玩家马此时是四岁。
  // 收录口径：当年对五岁以上开放的重赏与主要前哨赛，且草地质地、距离落在 1800–3200 米内；
  // 一哩、冲刺、泥地与 3600 米以上赛事只留在年鉴里，不进本赛历。
  // 年龄换算：JBIS 的“Ｎ才”在 1999 年对应游戏实龄 N−1，
  // 所以“４才上”对游戏实龄 3 岁以上开放，“５才上”对实龄 4 岁以上开放。
  const year = 1999;
  // JBIS 当年条件为“サラ系５才上”的赛事（实龄 4 岁以上）。
  const openToFive = ["nakayama-kimpai", "kyoto-kinen", "hanshin-daishoten", "nikkei-sho", "osaka-hai", "tenno-sho-haru"];
  // JBIS 当年条件为“サラ系４才上”的赛事（实龄 3 岁以上）。
  const openToFour = ["takarazuka-kinen", "sapporo-kinen", "sankei-sho-all-comers", "mainichi-okan", "kyoto-daishoten", "tenno-sho-aki", "japan-cup", "arima-kinen"];
  const ids = [...openToFive, ...openToFour];
  ns.EraCalendarRegistry.register(year, ids.map((id) => ({
    almanacRaceId: `${year}-${id}`,
    age: openToFive.includes(id) ? { min: 4 } : { min: 3 },
    sex: "any", origin: "japan-domestic", rights: "prototype-open"
  })));
})();
