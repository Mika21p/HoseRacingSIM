(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "grand-bridge",
    name: "グランブリッジ",
    displayName: "グランブリッジ",
    displayNameZh: "グランブリッジ",
    displayNameEn: "Grand Bridge",
    profile: {
      sex: "female",
      baseAbility: 81,
      peakAbility: 83,
      note: "日本泥地中距离牝马，胜鞍覆盖1800米至2100米。"
    },
    races: [
      { raceId: "kanto-oaks", year: 2022, ability: 81, jockeyId: "yuichi-fukunaga", finish: 1, trackCondition: "稍重" },
      { raceId: "breeders-gold-cup", year: 2022, ability: 81, jockeyId: "yuichi-fukunaga", finish: 1, trackCondition: "不良" },
      { raceId: "empress-hai", year: 2023, ability: 81, jockeyId: "yuga-kawada", finish: 1, trackCondition: "良" },
      { raceId: "ladies-prelude", year: 2024, ability: 81, jockeyId: "yuga-kawada", finish: 1, trackCondition: "良" }
    ],
    legendEligibilityWins: [
      { raceName: "TCK女王盃", year: 2023, surfaceRegion: "日本", surface: "泥地", distance: 1800, jockeyId: "yuga-kawada", trackCondition: "良" }
    ]
  });
})();
