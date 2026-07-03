(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "almond-eye",
    name: "アーモンドアイ",
    displayName: "Almond Eye",
    profile: {
      baseAbility: 85,
      peakAbility: 87,
      note: "三冠牝马，世界级中距离与英里能力。"
    },
    races: [
      { raceId: "shinzan-kinen", year: 2018, ability: 84, jockeyId: "keita-tosaki", finish: 1, trackCondition: "稍重" },
      { raceId: "oka-sho", year: 2018, ability: 85, jockeyId: "christophe-lemaire", finish: 1 },
      { raceId: "yushun-himba", year: 2018, ability: 86, jockeyId: "christophe-lemaire", finish: 1 },
      { raceId: "shuka-sho", year: 2018, ability: 86, jockeyId: "christophe-lemaire", finish: 1 },
      { raceId: "japan-cup", year: 2018, ability: 87, jockeyId: "christophe-lemaire", finish: 1 },
      { raceId: "dubai-turf", year: 2019, ability: 87, jockeyId: "christophe-lemaire", finish: 1 },
      { raceId: "tenno-sho-aki", year: 2019, ability: 87, jockeyId: "christophe-lemaire", finish: 1 },
      { raceId: "victoria-mile", year: 2020, ability: 86, jockeyId: "christophe-lemaire", finish: 1 },
      { raceId: "tenno-sho-aki", year: 2020, ability: 87, jockeyId: "christophe-lemaire", finish: 1 },
      { raceId: "japan-cup", year: 2020, ability: 87, jockeyId: "christophe-lemaire", finish: 1 }
    ]
  });
})();
