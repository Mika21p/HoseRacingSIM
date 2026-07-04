(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "el-condor-pasa",
    name: "エルコンドルパサー",
    displayName: "神鹰",
    displayNameZh: "神鹰",
    displayNameEn: "El Condor Pasa",
    profile: {
      baseAbility: 90,
      peakAbility: 92,
      note: "海外G1高水平认证，日本调教马海外评价标尺。"
    },
    races: [
      { raceId: "tokinominoru-kinen", year: 1998, ability: 89, jockeyId: "hitoshi-matoba", finish: 1 },
      { raceId: "new-zealand-trophy", year: 1998, ability: 89, jockeyId: "hitoshi-matoba", finish: 1 },
      { raceId: "nhk-mile-cup", year: 1998, ability: 90, jockeyId: "hitoshi-matoba", finish: 1 },
      { raceId: "japan-cup", year: 1998, ability: 91, jockeyId: "masayoshi-ebina", finish: 1 },
      { raceId: "grand-prix-de-saint-cloud", year: 1999, ability: 92, jockeyId: "masayoshi-ebina", finish: 1 }
    ]
  });
})();
