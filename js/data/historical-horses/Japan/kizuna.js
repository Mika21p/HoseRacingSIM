(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "kizuna",
    name: "キズナ",
    displayName: "高情厚意",
    displayNameZh: "高情厚意",
    displayNameEn: "Kizuna",
    profile: {
      baseAbility: 82,
      peakAbility: 84,
      note: "2013 年东京优骏胜马，并在法国胜出尼尔锦标。"
    },
    races: [
      { raceId: "mainichi-hai", year: 2013, ability: 82, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "kyoto-shimbun-hai", year: 2013, ability: 83, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "tokyo-yushun", year: 2013, ability: 84, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "osaka-hai", year: 2014, ability: 83, jockeyId: "take-yutaka", finish: 1 }
    ]
  });
})();
