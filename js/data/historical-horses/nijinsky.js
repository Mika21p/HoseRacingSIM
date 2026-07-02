(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "nijinsky",
    name: "Nijinsky",
    displayName: "Nijinsky",
    profile: {
      baseAbility: 87,
      peakAbility: 88,
      note: "英国三冠马，速度、距离延展与夏季王道表现兼具。"
    },
    races: [
      { raceId: "two-thousand-guineas", year: 1970, ability: 87, jockeyId: "lester-piggott", finish: 1 },
      { raceId: "epsom-derby", year: 1970, ability: 88, jockeyId: "lester-piggott", finish: 1 },
      { raceId: "irish-derby", year: 1970, ability: 88, jockeyId: "lester-piggott", finish: 1 },
      { raceId: "king-george-vi-and-queen-elizabeth-stakes", year: 1970, ability: 88, jockeyId: "lester-piggott", finish: 1 },
      { raceId: "st-leger-stakes", year: 1970, ability: 88, jockeyId: "lester-piggott", finish: 1 }
    ]
  });
})();
