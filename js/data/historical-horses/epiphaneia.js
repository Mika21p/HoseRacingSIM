(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "epiphaneia",
    name: "エピファネイア",
    displayName: "Epiphaneia",
    profile: {
      baseAbility: 86,
      peakAbility: 88,
      note: "菊花赏与日本杯冠军，爆发力强的中长距离名马。"
    },
    races: [
      { raceId: "kobe-shimbun-hai", year: 2013, ability: 86, jockeyId: "yuichi-fukunaga", finish: 1 },
      { raceId: "kikka-sho", year: 2013, ability: 87, jockeyId: "yuichi-fukunaga", finish: 1 },
      { raceId: "japan-cup", year: 2014, ability: 88, jockeyId: "christophe-soumillon", finish: 1 }
    ]
  });
})();
