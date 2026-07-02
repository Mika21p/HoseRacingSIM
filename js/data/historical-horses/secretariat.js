(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "secretariat",
    name: "Secretariat",
    displayName: "Secretariat",
    profile: {
      baseAbility: 88,
      peakAbility: 90,
      note: "美国三冠代表，贝蒙锦标压倒性表现为泥地历史标尺。"
    },
    races: [
      { raceId: "kentucky-derby", year: 1973, ability: 89, jockeyId: "ron-turcotte", finish: 1 },
      { raceId: "preakness-stakes", year: 1973, ability: 89, jockeyId: "ron-turcotte", finish: 1 },
      { raceId: "belmont-stakes", year: 1973, ability: 90, jockeyId: "ron-turcotte", finish: 1 }
    ]
  });
})();
