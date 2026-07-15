(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "shahryar",
    name: "シャフリヤール",
    displayName: "大帝",
    displayNameZh: "大帝",
    displayNameEn: "Shahryar",
    profile: {
      baseAbility: 83,
      peakAbility: 86,
      note: "2021 年东京优骏与 2022 年迪拜司马经典赛胜马。"
    },
    races: [
      { raceId: "mainichi-hai", year: 2021, ability: 83, jockeyId: "yuga-kawada", finish: 1 },
      { raceId: "tokyo-yushun", year: 2021, ability: 85, jockeyId: "yuichi-fukunaga", finish: 1 },
      { raceId: "dubai-sheema-classic", year: 2022, ability: 86, jockeyId: "cristian-demuro", finish: 1 }
    ]
  });
})();
