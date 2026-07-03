(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "montjeu",
    name: "Montjeu",
    displayName: "Montjeu",
    profile: {
      baseAbility: 92,
      peakAbility: 93,
      note: "欧洲中长距离顶级马，法国德比、爱尔兰德比与凯旋门赏路线代表。"
    },
    races: [
      { raceId: "prix-du-jockey-club", year: 1999, ability: 93, jockeyId: "cash-asmussen", finish: 1 },
      { raceId: "irish-derby", year: 1999, ability: 93, jockeyId: "cash-asmussen", finish: 1 },
      { raceId: "prix-de-larc", year: 1999, ability: 93, jockeyId: "mick-kinane", finish: 1 },
      { raceId: "grand-prix-de-saint-cloud", year: 2000, ability: 93, jockeyId: "cash-asmussen", finish: 1 },
      { raceId: "king-george-vi-and-queen-elizabeth-stakes", year: 2000, ability: 93, jockeyId: "mick-kinane", finish: 1 }
    ]
  });
})();
