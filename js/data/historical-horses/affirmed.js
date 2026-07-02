(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "affirmed",
    name: "Affirmed",
    displayName: "Affirmed",
    profile: {
      baseAbility: 86,
      peakAbility: 88,
      note: "美国三冠马，与Alydar的三冠对决构成经典世代标尺。"
    },
    races: [
      { raceId: "kentucky-derby", year: 1978, ability: 87, jockeyId: "steve-cauthen", finish: 1 },
      { raceId: "preakness-stakes", year: 1978, ability: 88, jockeyId: "steve-cauthen", finish: 1 },
      { raceId: "belmont-stakes", year: 1978, ability: 88, jockeyId: "steve-cauthen", finish: 1 }
    ]
  });
})();
