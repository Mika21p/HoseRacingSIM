(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "enable",
    name: "Enable",
    displayName: "成全宝",
    displayNameZh: "成全宝",
    displayNameEn: "Enable",
    profile: {
      baseAbility: 91,
      peakAbility: 92,
      note: "欧洲中长距离雌马标尺，凯旋门赏、英皇锦标与育马者杯均有顶级胜利。"
    },
    races: [
      { raceId: "epsom-oaks", year: 2017, ability: 91, jockeyId: "frankie-dettori", finish: 1 },
      { raceId: "irish-oaks", year: 2017, ability: 91, jockeyId: "frankie-dettori", finish: 1 },
      { raceId: "king-george-vi-and-queen-elizabeth-stakes", year: 2017, ability: 92, jockeyId: "frankie-dettori", finish: 1 },
      { raceId: "yorkshire-oaks", year: 2017, ability: 91, jockeyId: "frankie-dettori", finish: 1 },
      { raceId: "prix-de-larc", year: 2017, ability: 92, jockeyId: "frankie-dettori", finish: 1 },
      { raceId: "prix-de-larc", year: 2018, ability: 92, jockeyId: "frankie-dettori", finish: 1 },
      { raceId: "breeders-cup-turf", year: 2018, ability: 92, jockeyId: "frankie-dettori", finish: 1 },
      { raceId: "eclipse-stakes", year: 2019, ability: 91, jockeyId: "frankie-dettori", finish: 1 },
      { raceId: "king-george-vi-and-queen-elizabeth-stakes", year: 2019, ability: 92, jockeyId: "frankie-dettori", finish: 1 },
      { raceId: "yorkshire-oaks", year: 2019, ability: 91, jockeyId: "frankie-dettori", finish: 1 },
      { raceId: "king-george-vi-and-queen-elizabeth-stakes", year: 2020, ability: 91, jockeyId: "frankie-dettori", finish: 1 }
    ]
  });
})();
