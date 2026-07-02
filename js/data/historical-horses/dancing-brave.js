(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "dancing-brave",
    name: "Dancing Brave",
    displayName: "Dancing Brave",
    profile: {
      baseAbility: 87,
      peakAbility: 88,
      note: "欧洲80年代草地王者，凯旋门赏末脚极具代表性。"
    },
    races: [
      { raceId: "two-thousand-guineas", year: 1986, ability: 87, jockeyId: "greville-starkey", finish: 1 },
      { raceId: "eclipse-stakes", year: 1986, ability: 88, jockeyId: "greville-starkey", finish: 1 },
      { raceId: "king-george-vi-and-queen-elizabeth-stakes", year: 1986, ability: 88, jockeyId: "pat-eddery", finish: 1 },
      { raceId: "prix-de-larc", year: 1986, ability: 88, jockeyId: "pat-eddery", finish: 1 }
    ]
  });
})();
