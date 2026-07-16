(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "acork-claw",
    name: "アコークロー",
    displayName: "アコークロー",
    displayNameZh: "アコークロー",
    displayNameEn: "Acork Claw",
    profile: {
      sex: "female",
      baseAbility: 72,
      peakAbility: 74,
      note: "2025年成田特别冠军，日本泥地2400米牝马。"
    },
    races: [],
    legendEligibilityWins: [
      { raceName: "成田特別", year: 2025, surfaceRegion: "日本", surface: "泥地", distance: 2400, jockeyId: "kosuke-maruta", trackCondition: "良" }
    ]
  });
})();
