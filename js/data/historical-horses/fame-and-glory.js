(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "fame-and-glory",
    "name": "Fame And Glory",
    "displayName": "Fame And Glory",
    "profile": {
      "baseAbility": 84,
      "peakAbility": 86,
      "note": "由中长距离转向长途仍能夺G1，加冕杯与雅士谷金杯胜出。"
    },
    "races": [
      {
        "raceId": "coronation-cup",
        "year": 2010,
        "ability": 85,
        "jockeyId": "johnny-murtagh",
        "finish": 1
      },
      {
        "raceId": "ascot-gold-cup",
        "year": 2011,
        "ability": 86,
        "jockeyId": "jamie-spencer",
        "finish": 1
      }
    ]
  });
})();
