(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "nijinsky",
    name: "Nijinsky",
    displayName: "Nijinsky",
    profile: {
      baseAbility: 95,
      peakAbility: 96,
      note: "英国三冠马，速度、距离延展与夏季王道表现兼具。"
    },
    races: [
      { raceId: "dewhurst-stakes", year: 1969, ability: 95, jockeyId: "lester-piggott", finish: 1 },
      { raceId: "two-thousand-guineas", year: 1970, ability: 95, jockeyId: "lester-piggott", finish: 1 },
      { raceId: "epsom-derby", year: 1970, ability: 96, jockeyId: "lester-piggott", finish: 1 },
      { raceId: "irish-derby", year: 1970, ability: 96, jockeyId: "lester-piggott", finish: 1 },
      { raceId: "king-george-vi-and-queen-elizabeth-stakes", year: 1970, ability: 96, jockeyId: "lester-piggott", finish: 1 },
      { raceId: "st-leger-stakes", year: 1970, ability: 96, jockeyId: "lester-piggott", finish: 1 }
    ]
  });
})();
