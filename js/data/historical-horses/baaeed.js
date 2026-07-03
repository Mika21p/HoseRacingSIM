(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "baaeed",
    name: "Baaeed",
    displayName: "Baaeed",
    profile: {
      baseAbility: 92,
      peakAbility: 94,
      note: "现代欧洲英里到中距离顶级马，2022年上半季表现极强。"
    },
    races: [
      { raceId: "lockinge-stakes", year: 2022, ability: 93, jockeyId: "jim-crowley", finish: 1 },
      { raceId: "queen-anne-stakes", year: 2022, ability: 93, jockeyId: "jim-crowley", finish: 1 },
      { raceId: "sussex-stakes", year: 2022, ability: 94, jockeyId: "jim-crowley", finish: 1 },
      { raceId: "international-stakes", year: 2022, ability: 94, jockeyId: "jim-crowley", finish: 1 }
    ]
  });
})();
