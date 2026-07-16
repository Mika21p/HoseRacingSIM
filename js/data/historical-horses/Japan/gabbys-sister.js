(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "gabbys-sister",
    name: "ガビーズシスター",
    displayName: "ガビーズシスター",
    displayNameZh: "ガビーズシスター",
    displayNameEn: "Gabby's Sister",
    profile: {
      sex: "female",
      baseAbility: 79,
      peakAbility: 81,
      note: "2024年五车二锦标冠军，兼有日本泥地1000米胜鞍。"
    },
    races: [
      { raceId: "capella-stakes", year: 2024, ability: 79, jockeyId: "hayato-yoshida", finish: 1, trackCondition: "良" }
    ],
    legendEligibilityWins: [
      { raceName: "桑園特別", year: 2024, surfaceRegion: "日本", surface: "泥地", distance: 1000, jockeyId: "take-yutaka", trackCondition: "良" },
      { raceName: "外房ステークス", year: 2024, surfaceRegion: "日本", surface: "泥地", distance: 1200, jockeyId: "christophe-lemaire", trackCondition: "良" }
    ]
  });
})();
