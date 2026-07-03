(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "mejiro-mcqueen",
    name: "メジロマックイーン",
    displayName: "Mejiro McQueen",
    profile: {
      baseAbility: 79,
      peakAbility: 81,
      note: "长距离与春天皇赏代表。"
    },
    races: [
      { raceId: "kikka-sho", year: 1990, ability: 79, jockeyId: "koichi-uchida", finish: 1 },
      { raceId: "hanshin-daishoten", year: 1991, ability: 80, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "tenno-sho-haru", year: 1991, ability: 81, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "kyoto-daishoten", year: 1991, ability: 80, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "hanshin-daishoten", year: 1992, ability: 81, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "tenno-sho-haru", year: 1992, ability: 81, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "osaka-hai", year: 1993, ability: 80, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "takarazuka-kinen", year: 1993, ability: 81, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "kyoto-daishoten", year: 1993, ability: 80, jockeyId: "take-yutaka", finish: 1 }
    ]
  });
})();
