(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "shonan-nadeshiko",
    name: "ショウナンナデシコ",
    displayName: "ショウナンナデシコ",
    displayNameZh: "ショウナンナデシコ",
    displayNameEn: "Shonan Nadeshiko",
    profile: {
      sex: "female",
      baseAbility: 81,
      peakAbility: 83,
      note: "日本泥地中距离牝马，2022年柏市纪念冠军。"
    },
    races: [
      { raceId: "empress-hai", year: 2022, ability: 81, jockeyId: "hayato-yoshida", finish: 1, trackCondition: "良" },
      { raceId: "marine-cup", year: 2022, ability: 81, jockeyId: "hayato-yoshida", finish: 1, trackCondition: "良" },
      { raceId: "kashiwa-kinen", year: 2022, ability: 81, jockeyId: "hayato-yoshida", finish: 1, trackCondition: "稍重" },
      { raceId: "sparking-lady-cup", year: 2022, ability: 81, jockeyId: "hayato-yoshida", finish: 1, trackCondition: "良" }
    ],
    legendEligibilityWins: [
      { raceName: "三岁以上二胜级", year: 2021, surfaceRegion: "日本", surface: "泥地", distance: 1800, jockeyId: "kohei-matsuyama", trackCondition: "良" },
      { raceName: "カノープスステークス", year: 2021, surfaceRegion: "日本", surface: "泥地", distance: 2000, jockeyId: "hayato-yoshida", trackCondition: "良" }
    ]
  });
})();
