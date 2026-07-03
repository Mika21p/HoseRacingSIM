(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "grass-wonder",
    name: "グラスワンダー",
    displayName: "Grass Wonder",
    profile: {
      baseAbility: 81,
      peakAbility: 83,
      note: "98世代名马，Grand Prix路线代表。"
    },
    races: [
      { raceId: "asahi-hai-fs", year: 1997, ability: 81, jockeyId: "hitoshi-matoba", finish: 1 },
      { raceId: "arima-kinen", year: 1998, ability: 83, jockeyId: "hitoshi-matoba", finish: 1 },
      { raceId: "keio-hai-spring-cup", year: 1999, ability: 81, jockeyId: "hitoshi-matoba", finish: 1 },
      { raceId: "takarazuka-kinen", year: 1999, ability: 83, jockeyId: "hitoshi-matoba", finish: 1 },
      { raceId: "mainichi-okan", year: 1999, ability: 81, jockeyId: "hitoshi-matoba", finish: 1 },
      { raceId: "arima-kinen", year: 1999, ability: 83, jockeyId: "hitoshi-matoba", finish: 1 }
    ]
  });
})();
