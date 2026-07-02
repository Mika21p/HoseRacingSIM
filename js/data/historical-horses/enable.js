(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "enable",
    name: "Enable",
    displayName: "Enable",
    profile: {
      baseAbility: 87,
      peakAbility: 88,
      note: "欧洲中长距离雌马标尺，凯旋门赏、英皇锦标与育马者杯均有顶级胜利。"
    },
    races: [
      { raceId: "epsom-oaks", year: 2017, ability: 87, jockeyId: "frankie-dettori", finish: 1 },
      { raceId: "king-george-vi-and-queen-elizabeth-stakes", year: 2017, ability: 88, jockeyId: "frankie-dettori", finish: 1 },
      { raceId: "prix-de-larc", year: 2017, ability: 88, jockeyId: "frankie-dettori", finish: 1 },
      { raceId: "prix-de-larc", year: 2018, ability: 88, jockeyId: "frankie-dettori", finish: 1 },
      { raceId: "breeders-cup-turf", year: 2018, ability: 88, jockeyId: "frankie-dettori", finish: 1 },
      { raceId: "eclipse-stakes", year: 2019, ability: 87, jockeyId: "frankie-dettori", finish: 1 },
      { raceId: "king-george-vi-and-queen-elizabeth-stakes", year: 2019, ability: 88, jockeyId: "frankie-dettori", finish: 1 },
      { raceId: "king-george-vi-and-queen-elizabeth-stakes", year: 2020, ability: 87, jockeyId: "frankie-dettori", finish: 1 }
    ]
  });
})();
