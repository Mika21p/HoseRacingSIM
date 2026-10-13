(function () {
  const ns = (window.Keiba = window.Keiba || {});
  ns.HistoricalHorseRegistry.register({
    id: "miss-andretti", name: "Miss Andretti", displayName: "安小姐", displayNameZh: "安小姐", displayNameEn: "Miss Andretti",
    profile: { sex: "female", baseAbility: 85, peakAbility: 87, note: "澳洲及皇家雅士谷短途名雌，2007年新市场让赛与皇家赛马会金禧锦标冠军。" },
    races: [
      { raceId: "newmarket-handicap", year: 2007, ability: 87, jockeyId: "craig-newitt", finish: 1 },
      { raceId: "king-charles-iii-stakes", year: 2007, ability: 87, jockeyId: "kerrin-mcevoy", finish: 1 },
      { raceId: "black-caviar-lightning", year: 2007, ability: 86, jockeyId: "craig-newitt", finish: 1 }
    ]
  });
})();
