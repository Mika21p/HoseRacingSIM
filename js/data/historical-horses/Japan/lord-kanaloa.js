(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "lord-kanaloa",
    name: "ロードカナロア",
    displayName: "龙王",
    displayNameZh: "龙王",
    displayNameEn: "Lord Kanaloa",
    profile: {
      baseAbility: 84,
      peakAbility: 86,
      note: "世界级短途王者，短途与一哩上限很高。"
    },
    races: [
      { raceId: "keihan-hai", year: 2011, ability: 82, jockeyId: "yuichi-fukunaga", finish: 1 },
      { raceId: "silk-road-stakes", year: 2012, ability: 83, jockeyId: "yuichi-fukunaga", finish: 1 },
      { raceId: "sprinters-stakes", year: 2012, ability: 85, jockeyId: "yasunari-iwata", finish: 1 },
      { raceId: "hong-kong-sprint", year: 2012, ability: 86, jockeyId: "yasunari-iwata", finish: 1 },
      { raceId: "hankyu-hai", year: 2013, ability: 84, jockeyId: "yasunari-iwata", finish: 1 },
      { raceId: "takamatsunomiya-kinen", year: 2013, ability: 85, jockeyId: "yasunari-iwata", finish: 1 },
      { raceId: "yasuda-kinen", year: 2013, ability: 86, jockeyId: "yasunari-iwata", finish: 1 },
      { raceId: "sprinters-stakes", year: 2013, ability: 86, jockeyId: "yasunari-iwata", finish: 1 },
      { raceId: "hong-kong-sprint", year: 2013, ability: 86, jockeyId: "yasunari-iwata", finish: 1 }
    ]
  });
})();
