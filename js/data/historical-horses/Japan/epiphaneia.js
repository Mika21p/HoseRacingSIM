(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "epiphaneia",
    name: "エピファネイア",
    displayName: "神威启示",
    displayNameZh: "神威启示",
    displayNameEn: "Epiphaneia",
    profile: {
      baseAbility: 85,
      peakAbility: 87,
      note: "菊花赏与日本杯冠军，爆发力强的中长距离名马。"
    },
    races: [
      { raceId: "kobe-shimbun-hai", year: 2013, ability: 85, jockeyId: "yuichi-fukunaga", finish: 1 },
      { raceId: "kikka-sho", year: 2013, ability: 86, jockeyId: "yuichi-fukunaga", finish: 1 },
      { raceId: "japan-cup", year: 2014, ability: 87, jockeyId: "christophe-soumillon", finish: 1 }
    ]
  });
})();
