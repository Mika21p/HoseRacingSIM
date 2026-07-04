(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "kitasan-black",
    name: "キタサンブラック",
    displayName: "北部玄驹",
    displayNameZh: "北部玄驹",
    displayNameEn: "Kitasan Black",
    profile: {
      baseAbility: 85,
      peakAbility: 87,
      note: "日本草地G1多次胜利，王道路线上限稳定。"
    },
    races: [
      { raceId: "spring-stakes", year: 2015, ability: 84, jockeyId: "hiroshi-kitamura", finish: 1 },
      { raceId: "st-lite-kinen", year: 2015, ability: 85, jockeyId: "hiroshi-kitamura", finish: 1 },
      { raceId: "kikka-sho", year: 2015, ability: 86, jockeyId: "hiroshi-kitamura", finish: 1 },
      { raceId: "tenno-sho-haru", year: 2016, ability: 87, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "kyoto-daishoten", year: 2016, ability: 85, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "japan-cup", year: 2016, ability: 87, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "osaka-hai", year: 2017, ability: 87, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "tenno-sho-haru", year: 2017, ability: 87, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "tenno-sho-aki", year: 2017, ability: 87, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "arima-kinen", year: 2017, ability: 87, jockeyId: "take-yutaka", finish: 1 }
    ]
  });
})();
