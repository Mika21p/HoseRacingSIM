(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "la-verita",
    name: "ラヴェリータ",
    displayName: "ラヴェリータ",
    displayNameZh: "ラヴェリータ",
    displayNameEn: "La Verita",
    profile: {
      sex: "female",
      baseAbility: 81,
      peakAbility: 83,
      note: "日本训练的美国生产泥地牝马，胜鞍覆盖1600米至2100米。"
    },
    races: [
      { raceId: "kanto-oaks", year: 2009, ability: 81, jockeyId: "yasunari-iwata", finish: 1, trackCondition: "重" },
      { raceId: "nagoya-daishoten", year: 2010, ability: 81, jockeyId: "yasunari-iwata", finish: 1, trackCondition: "稍重" },
      { raceId: "empress-hai", year: 2011, ability: 81, jockeyId: "take-yutaka", finish: 1, trackCondition: "不良" },
      { raceId: "sparking-lady-cup", year: 2011, ability: 81, jockeyId: "take-yutaka", finish: 1, trackCondition: "良" }
    ],
    legendEligibilityWins: [
      { raceName: "TCK女王盃", year: 2011, surfaceRegion: "日本", surface: "泥地", distance: 1800, jockeyId: "mirco-demuro", trackCondition: "良" }
    ]
  });
})();
