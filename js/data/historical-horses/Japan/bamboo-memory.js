(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "bamboo-memory",
    name: "バンブーメモリー",
    displayName: "青竹回忆",
    displayNameZh: "青竹回忆",
    displayNameEn: "Bamboo Memory",
    profile: {
      baseAbility: 80,
      peakAbility: 82,
      note: "1989、1990 年度日本最佳短途及一哩马，安田纪念与短途马锦标胜马。"
    },
    races: [
      { raceId: "yasuda-kinen", year: 1989, ability: 82, jockeyId: "okabe-yukio", finish: 1 },
      { raceId: "swan-stakes", year: 1989, ability: 81, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "takamatsunomiya-kinen", year: 1990, ability: 80, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "sprinters-stakes", year: 1990, ability: 82, jockeyId: "take-yutaka", finish: 1 }
    ]
  });
})();
