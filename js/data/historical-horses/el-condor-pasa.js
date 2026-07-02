(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "el-condor-pasa",
    name: "エルコンドルパサー",
    displayName: "El Condor Pasa",
    profile: {
      baseAbility: 86,
      peakAbility: 88,
      note: "海外G1高水平认证，日本调教马海外评价标尺。"
    },
    races: [
      { raceId: "tokinominoru-kinen", year: 1998, ability: 85, jockeyId: "generic-local", finish: 1 },
      { raceId: "new-zealand-trophy", year: 1998, ability: 85, jockeyId: "generic-local", finish: 1 },
      { raceId: "nhk-mile-cup", year: 1998, ability: 86, jockeyId: "generic-local", finish: 1 },
      { raceId: "japan-cup", year: 1998, ability: 87, jockeyId: "generic-local", finish: 1 },
      { raceId: "grand-prix-de-saint-cloud", year: 1999, ability: 88, jockeyId: "generic-local", finish: 1 },
      { raceId: "prix-de-larc", year: 1999, ability: 88, jockeyId: "generic-local", finish: 2 }
    ]
  });
})();
