(function () {
  const ns = (window.Keiba = window.Keiba || {});
  // Prototype entry rights, not a reconstruction of historical earnings/balloting rules.
  const year = 1998;
  const ids = ["kisaragi-sho", "yayoi-sho", "spring-stakes", "mainichi-hai", "satsuki-sho", "aoba-sho", "tokyo-yushun", "takarazuka-kinen", "kobe-shimbun-hai", "st-lite-kinen", "kyoto-shimbun-hai", "tenno-sho-aki", "kikka-sho", "japan-cup", "arima-kinen"];
  ns.EraCalendarRegistry.register(year, ids.map((id) => ({
    almanacRaceId: `${year}-${id}`,
    age: ["takarazuka-kinen", "tenno-sho-aki", "japan-cup", "arima-kinen"].includes(id) ? { min: 3 } : { exact: 3 },
    sex: "any", origin: "japan-domestic", rights: "prototype-open"
  })));
})();
