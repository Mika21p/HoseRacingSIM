(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "mejiro-palmer",
    name: "メジロパーマー",
    displayName: "目白善信",
    displayNameZh: "目白善信",
    displayNameEn: "Mejiro Palmer",
    profile: {
      baseAbility: 79,
      peakAbility: 81,
      note: "目白系逃马代表，1992 年包揽宝冢纪念与有马纪念。"
    },
    races: [
      { raceId: "sapporo-kinen", year: 1991, ability: 79, jockeyId: "mikio-matsunaga", finish: 1 },
      { raceId: "niigata-daishoten", year: 1992, ability: 79, jockeyId: "taisei-yamada", finish: 1 },
      { raceId: "takarazuka-kinen", year: 1992, ability: 81, jockeyId: "taisei-yamada", finish: 1 },
      { raceId: "arima-kinen", year: 1992, ability: 81, jockeyId: "taisei-yamada", finish: 1 },
      { raceId: "hanshin-daishoten", year: 1993, ability: 79, jockeyId: "taisei-yamada", finish: 1 }
    ]
  });
})();
