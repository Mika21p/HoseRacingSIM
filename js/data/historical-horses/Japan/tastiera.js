(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "tastiera",
    name: "タスティエーラ",
    displayName: "塔斯蒂埃拉",
    displayNameZh: "塔斯蒂埃拉",
    displayNameEn: "Tastiera",
    profile: {
      baseAbility: 80,
      peakAbility: 82,
      note: "2023年日本德比冠军，三岁春季路线稳定上位。"
    },
    races: [
      { raceId: "yayoi-sho", year: 2023, ability: 80, jockeyId: "kohei-matsuyama", finish: 1 },
      { raceId: "tokyo-yushun", year: 2023, ability: 82, jockeyId: "damian-lane", finish: 1, trackCondition: "稍重" }
    ]
  });
})();
