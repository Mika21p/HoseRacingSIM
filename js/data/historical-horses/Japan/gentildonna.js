(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "gentildonna",
    name: "ジェンティルドンナ",
    displayName: "贵妇人",
    displayNameZh: "贵妇人",
    displayNameEn: "Gentildonna",
    profile: {
      baseAbility: 82,
      peakAbility: 84,
      note: "三冠牝马，古马后仍保持顶级竞争力。"
    },
    races: [
      { raceId: "shinzan-kinen", year: 2012, ability: 81, jockeyId: "christophe-lemaire", finish: 1, trackCondition: "良" },
      { raceId: "oka-sho", year: 2012, ability: 82, jockeyId: "yasunari-iwata", finish: 1 },
      { raceId: "yushun-himba", year: 2012, ability: 83, jockeyId: "yuga-kawada", finish: 1 },
      { raceId: "rose-stakes", year: 2012, ability: 82, jockeyId: "yasunari-iwata", finish: 1, trackCondition: "良" },
      { raceId: "shuka-sho", year: 2012, ability: 83, jockeyId: "yasunari-iwata", finish: 1 },
      { raceId: "japan-cup", year: 2012, ability: 84, jockeyId: "yasunari-iwata", finish: 1 },
      { raceId: "japan-cup", year: 2013, ability: 84, jockeyId: "ryan-moore", finish: 1 },
      { raceId: "dubai-sheema-classic", year: 2014, ability: 84, jockeyId: "ryan-moore", finish: 1 },
      { raceId: "arima-kinen", year: 2014, ability: 84, jockeyId: "keita-tosaki", finish: 1 }
    ]
  });
})();
