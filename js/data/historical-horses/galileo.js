(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "galileo",
    name: "Galileo",
    displayName: "Galileo",
    profile: {
      baseAbility: 86,
      peakAbility: 87,
      note: "欧洲三岁中长距离冠军，退役后成为现代草地血统核心。"
    },
    races: [
      { raceId: "epsom-derby", year: 2001, ability: 87, jockeyId: "mick-kinane", finish: 1 },
      { raceId: "irish-derby", year: 2001, ability: 87, jockeyId: "mick-kinane", finish: 1 },
      { raceId: "king-george-vi-and-queen-elizabeth-stakes", year: 2001, ability: 87, jockeyId: "mick-kinane", finish: 1 }
    ]
  });
})();
