(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "shergar",
    name: "Shergar",
    displayName: "Shergar",
    profile: {
      baseAbility: 86,
      peakAbility: 87,
      note: "欧洲德比大胜代表，中长距离压制力强。"
    },
    races: [
      { raceId: "epsom-derby", year: 1981, ability: 87, jockeyId: "walter-swinburn", finish: 1 },
      { raceId: "irish-derby", year: 1981, ability: 87, jockeyId: "walter-swinburn", finish: 1 },
      { raceId: "king-george-vi-and-queen-elizabeth-stakes", year: 1981, ability: 87, jockeyId: "walter-swinburn", finish: 1 }
    ]
  });
})();
