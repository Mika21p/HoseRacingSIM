(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "vengeance-of-rain",
    name: "Vengeance of Rain",
    displayName: "Vengeance of Rain",
    profile: {
      baseAbility: 80,
      peakAbility: 82,
      note: "香港中长距离代表，女皇杯、香港杯与迪拜司马经典赛冠军。"
    },
    races: [
      { raceId: "hong-kong-queen-elizabeth-ii-cup", year: 2005, ability: 81, jockeyId: "anthony-delpech", finish: 1 },
      { raceId: "champions-chater-cup", year: 2005, ability: 81, jockeyId: "anthony-delpech", finish: 1 },
      { raceId: "hong-kong-cup", year: 2005, ability: 82, jockeyId: "anthony-delpech", finish: 1 },
      { raceId: "hong-kong-gold-cup", year: 2007, ability: 81, jockeyId: "anthony-delpech", finish: 1 },
      { raceId: "dubai-sheema-classic", year: 2007, ability: 82, jockeyId: "anthony-delpech", finish: 1 }
    ]
  });
})();
