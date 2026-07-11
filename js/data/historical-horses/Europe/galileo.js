(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "galileo",
    name: "Galileo",
    displayName: "伽利略",
    displayNameZh: "伽利略",
    displayNameEn: "Galileo",
    profile: {
      baseAbility: 91,
      peakAbility: 92,
      note: "欧洲三岁中长距离冠军，退役后成为现代草地血统核心。"
    },
    races: [
      { raceId: "europe-g3-ballysax-stakes", year: 2001, ability: 91, jockeyId: "mick-kinane", finish: 1 },
      { raceId: "epsom-derby", year: 2001, ability: 92, jockeyId: "mick-kinane", finish: 1 },
      { raceId: "irish-derby", year: 2001, ability: 92, jockeyId: "mick-kinane", finish: 1 },
      { raceId: "king-george-vi-and-queen-elizabeth-stakes", year: 2001, ability: 92, jockeyId: "mick-kinane", finish: 1 }
    ]
  });
})();
