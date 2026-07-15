(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "fenomeno",
    name: "フェノーメノ",
    displayName: "超常骏骥",
    displayNameZh: "超常骏骥",
    displayNameEn: "Fenomeno",
    profile: {
      baseAbility: 81,
      peakAbility: 83,
      note: "2013、2014 年连续胜出春季天皇赏。"
    },
    races: [
      { raceId: "aoba-sho", year: 2012, ability: 81, jockeyId: "masayoshi-ebina", finish: 1 },
      { raceId: "st-lite-kinen", year: 2012, ability: 81, jockeyId: "masayoshi-ebina", finish: 1 },
      { raceId: "nikkei-sho", year: 2013, ability: 82, jockeyId: "masayoshi-ebina", finish: 1 },
      { raceId: "tenno-sho-haru", year: 2013, ability: 83, jockeyId: "masayoshi-ebina", finish: 1 },
      { raceId: "tenno-sho-haru", year: 2014, ability: 83, jockeyId: "masayoshi-ebina", finish: 1 }
    ]
  });
})();
