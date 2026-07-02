(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "kitasan-black",
    name: "キタサンブラック",
    displayName: "Kitasan Black",
    profile: {
      baseAbility: 80,
      peakAbility: 82,
      note: "日本草地G1多次胜利，王道路线上限稳定。"
    },
    races: [
      { raceId: "spring-stakes", year: 2015, ability: 79, jockeyId: "generic-local", finish: 1 },
      { raceId: "st-lite-kinen", year: 2015, ability: 80, jockeyId: "generic-local", finish: 1 },
      { raceId: "kikka-sho", year: 2015, ability: 81, jockeyId: "generic-local", finish: 1 },
      { raceId: "tenno-sho-haru", year: 2016, ability: 82, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "kyoto-daishoten", year: 2016, ability: 80, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "japan-cup", year: 2016, ability: 82, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "osaka-hai", year: 2017, ability: 82, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "tenno-sho-haru", year: 2017, ability: 82, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "tenno-sho-aki", year: 2017, ability: 82, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "arima-kinen", year: 2017, ability: 82, jockeyId: "take-yutaka", finish: 1 }
    ]
  });
})();
