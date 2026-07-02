(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "frankel",
    name: "Frankel",
    displayName: "Frankel",
    profile: {
      baseAbility: 89,
      peakAbility: 90,
      note: "欧洲无败英里至中距离历史级标尺，速度与压制力极高。"
    },
    races: [
      { raceId: "two-thousand-guineas", year: 2011, ability: 90, jockeyId: "tom-queally", finish: 1 },
      { raceId: "st-jamess-palace-stakes", year: 2011, ability: 89, jockeyId: "tom-queally", finish: 1 },
      { raceId: "sussex-stakes", year: 2011, ability: 90, jockeyId: "tom-queally", finish: 1 },
      { raceId: "lockinge-stakes", year: 2012, ability: 90, jockeyId: "tom-queally", finish: 1 },
      { raceId: "queen-anne-stakes", year: 2012, ability: 90, jockeyId: "tom-queally", finish: 1 },
      { raceId: "sussex-stakes", year: 2012, ability: 90, jockeyId: "tom-queally", finish: 1 },
      { raceId: "international-stakes", year: 2012, ability: 90, jockeyId: "tom-queally", finish: 1 }
    ]
  });
})();
