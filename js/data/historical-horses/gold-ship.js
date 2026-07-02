(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "gold-ship",
    name: "ゴールドシップ",
    displayName: "Gold Ship",
    profile: {
      baseAbility: 80,
      peakAbility: 82,
      note: "长距离与Grand Prix路线名马，发挥波动大但上限很高。"
    },
    races: [
      { raceId: "tokinominoru-kinen", year: 2012, ability: 81, jockeyId: "generic-local", finish: 1 },
      { raceId: "satsuki-sho", year: 2012, ability: 81, jockeyId: "generic-local", finish: 1 },
      { raceId: "kobe-shimbun-hai", year: 2012, ability: 81, jockeyId: "generic-local", finish: 1, trackCondition: "良" },
      { raceId: "kikka-sho", year: 2012, ability: 82, jockeyId: "generic-local", finish: 1 },
      { raceId: "arima-kinen", year: 2012, ability: 82, jockeyId: "generic-local", finish: 1 },
      { raceId: "hanshin-daishoten", year: 2013, ability: 81, jockeyId: "generic-local", finish: 1, trackCondition: "良" },
      { raceId: "takarazuka-kinen", year: 2013, ability: 82, jockeyId: "generic-local", finish: 1 },
      { raceId: "hanshin-daishoten", year: 2014, ability: 81, jockeyId: "generic-local", finish: 1, trackCondition: "良" },
      { raceId: "takarazuka-kinen", year: 2014, ability: 82, jockeyId: "generic-local", finish: 1 },
      { raceId: "hanshin-daishoten", year: 2015, ability: 80, jockeyId: "generic-local", finish: 1, trackCondition: "稍重" },
      { raceId: "tenno-sho-haru", year: 2015, ability: 82, jockeyId: "generic-local", finish: 1 }
    ]
  });
})();
