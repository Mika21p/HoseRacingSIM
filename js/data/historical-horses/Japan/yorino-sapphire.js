(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "yorino-sapphire",
    name: "ヨリノサファイヤ",
    displayName: "ヨリノサファイヤ",
    displayNameZh: "ヨリノサファイヤ",
    displayNameEn: "Yorino Sapphire",
    profile: {
      sex: "female",
      baseAbility: 72,
      peakAbility: 74,
      note: "日本泥地2400米条件赛冠军牝马。"
    },
    races: [],
    legendEligibilityWins: [
      { raceName: "四岁以上二胜级", year: 2024, surfaceRegion: "日本", surface: "泥地", distance: 2400, jockeyId: "nanako-fujita", trackCondition: "良" }
    ]
  });
})();
