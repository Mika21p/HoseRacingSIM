(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "kimon-ruby",
    name: "キモンルビー",
    displayName: "キモンルビー",
    displayNameZh: "キモンルビー",
    displayNameEn: "Kimon Ruby",
    profile: {
      sex: "female",
      baseAbility: 77,
      peakAbility: 79,
      note: "日本地方泥地短途牝马，船桥1000米重赏冠军。"
    },
    races: [],
    legendEligibilityWins: [
      { raceName: "習志野きらっとスプリント", year: 2023, surfaceRegion: "日本", surface: "泥地", distance: 1000, jockeyId: "norifumi-mikamoto", trackCondition: "良" },
      { raceName: "オパールスプリント", year: 2021, surfaceRegion: "日本", surface: "泥地", distance: 1200, jockeyId: "taito-mori", trackCondition: "良" }
    ]
  });
})();
