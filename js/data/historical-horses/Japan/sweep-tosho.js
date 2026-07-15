(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "sweep-tosho",
    name: "スイープトウショウ",
    displayName: "东商变革",
    displayNameZh: "东商变革",
    displayNameEn: "Sweep Tosho",
    profile: {
      baseAbility: 80,
      peakAbility: 82,
      note: "秋华赏、宝冢纪念与女皇伊丽莎白二世杯胜马。"
    },
    races: [
      { raceId: "fantasy-stakes", year: 2003, ability: 80, jockeyId: "koichi-tsunoda", finish: 1 },
      { raceId: "kobai-stakes", year: 2004, ability: 80, jockeyId: "koichi-tsunoda", finish: 1 },
      { raceId: "tulip-sho", year: 2004, ability: 80, jockeyId: "kenichi-ikezoe", finish: 1 },
      { raceId: "shuka-sho", year: 2004, ability: 81, jockeyId: "kenichi-ikezoe", finish: 1 },
      { raceId: "takarazuka-kinen", year: 2005, ability: 82, jockeyId: "kenichi-ikezoe", finish: 1 },
      { raceId: "queen-elizabeth-ii-cup", year: 2005, ability: 82, jockeyId: "kenichi-ikezoe", finish: 1 },
      { raceId: "kyoto-daishoten", year: 2006, ability: 81, jockeyId: "kenichi-ikezoe", finish: 1 }
    ]
  });
})();
