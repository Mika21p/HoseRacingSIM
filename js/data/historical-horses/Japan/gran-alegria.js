(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "gran-alegria",
    name: "グランアレグリア",
    displayName: "放声欢呼",
    displayNameZh: "放声欢呼",
    displayNameEn: "Gran Alegria",
    profile: {
      baseAbility: 83,
      peakAbility: 85,
      note: "日本短途至一哩顶级雌马，末脚质量极高。"
    },
    races: [
      { raceId: "saudi-arabia-royal-cup", year: 2018, ability: 83, jockeyId: "christophe-lemaire", finish: 1 },
      { raceId: "hanshin-juvenile-fillies", year: 2018, ability: 83, jockeyId: "christophe-lemaire", finish: 1 },
      { raceId: "oka-sho", year: 2019, ability: 84, jockeyId: "christophe-lemaire", finish: 1 },
      { raceId: "hanshin-cup", year: 2019, ability: 83, jockeyId: "christophe-lemaire", finish: 1 },
      { raceId: "yasuda-kinen", year: 2020, ability: 85, jockeyId: "kenichi-ikezoe", finish: 1 },
      { raceId: "sprinters-stakes", year: 2020, ability: 85, jockeyId: "christophe-lemaire", finish: 1 },
      { raceId: "victoria-mile", year: 2021, ability: 85, jockeyId: "christophe-lemaire", finish: 1 },
      { raceId: "mile-championship", year: 2021, ability: 85, jockeyId: "christophe-lemaire", finish: 1 }
    ]
  });
})();
