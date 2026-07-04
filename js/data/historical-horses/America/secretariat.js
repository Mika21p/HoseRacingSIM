(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "secretariat",
    name: "Secretariat",
    displayName: "秘书处",
    displayNameZh: "秘书处",
    displayNameEn: "Secretariat",
    profile: {
      baseAbility: 97,
      peakAbility: 99,
      note: "美国三冠代表，贝蒙锦标压倒性表现为泥地历史标尺。"
    },
    races: [
      { raceId: "kentucky-derby", year: 1973, ability: 98, jockeyId: "ron-turcotte", finish: 1 },
      { raceId: "preakness-stakes", year: 1973, ability: 98, jockeyId: "ron-turcotte", finish: 1 },
      { raceId: "belmont-stakes", year: 1973, ability: 99, jockeyId: "ron-turcotte", finish: 1 }
    ]
  });
})();
