(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "dakara-festive",
    name: "ダカラフェスティヴ",
    displayName: "ダカラフェスティヴ",
    displayNameZh: "ダカラフェスティヴ",
    displayNameEn: "Dakara Festive",
    profile: {
      sex: "female",
      baseAbility: 72,
      peakAbility: 74,
      note: "2026年成田特别冠军，日本泥地2400米牝马。"
    },
    races: [],
    legendEligibilityWins: [
      { raceName: "成田特別", year: 2026, surfaceRegion: "日本", surface: "泥地", distance: 2400, jockeyId: "yoshitomi-shibata", trackCondition: "良" }
    ]
  });
})();
