(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "dancing-brave",
    name: "Dancing Brave",
    displayName: "勇舞",
    displayNameZh: "勇舞",
    displayNameEn: "Dancing Brave",
    profile: {
      baseAbility: 96,
      peakAbility: 98,
      note: "欧洲80年代草地王者，凯旋门赏末脚极具代表性。"
    },
    races: [
      { raceId: "europe-g3-craven-stakes", year: 1986, ability: 96, jockeyId: "greville-starkey", finish: 1 },
      { raceId: "two-thousand-guineas", year: 1986, ability: 96, jockeyId: "greville-starkey", finish: 1 },
      { raceId: "eclipse-stakes", year: 1986, ability: 98, jockeyId: "greville-starkey", finish: 1 },
      { raceId: "king-george-vi-and-queen-elizabeth-stakes", year: 1986, ability: 98, jockeyId: "pat-eddery", finish: 1 },
      { raceId: "prix-de-larc", year: 1986, ability: 98, jockeyId: "pat-eddery", finish: 1 }
    ]
  });
})();
