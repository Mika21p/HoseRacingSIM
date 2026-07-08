(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "hishi-miracle",
    name: "ヒシミラクル",
    displayName: "菱钻奇宝",
    displayNameZh: "菱钻奇宝",
    displayNameEn: "Hishi Miracle",
    profile: {
      baseAbility: 80,
      peakAbility: 82,
      note: "长距离 G1 三胜马，菊花赏、春天皇赏与宝冢纪念胜马。"
    },
    races: [
      { raceId: "kikka-sho", year: 2002, ability: 82, jockeyId: "koichi-tsunoda", finish: 1 },
      { raceId: "tenno-sho-haru", year: 2003, ability: 82, jockeyId: "koichi-tsunoda", finish: 1 },
      { raceId: "takarazuka-kinen", year: 2003, ability: 82, jockeyId: "koichi-tsunoda", finish: 1 }
    ]
  });
})();
