(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "love-michan",
    name: "ラブミーチャン",
    displayName: "ラブミーチャン",
    displayNameZh: "ラブミーチャン",
    displayNameEn: "Love Michan",
    profile: {
      sex: "female",
      baseAbility: 80,
      peakAbility: 82,
      note: "日本地方泥地短途牝马，拥有1000米及1200米胜鞍。"
    },
    races: [
      { raceId: "tokyo-sprint", year: 2013, ability: 80, jockeyId: "keita-tosaki", finish: 1, trackCondition: "良" },
      { raceId: "cluster-cup", year: 2013, ability: 80, jockeyId: "keita-tosaki", finish: 1, trackCondition: "良" }
    ],
    legendEligibilityWins: [
      { raceName: "習志野きらっとスプリント", year: 2013, surfaceRegion: "日本", surface: "泥地", distance: 1000, jockeyId: "taito-mori", trackCondition: "良" }
    ]
  });
})();
