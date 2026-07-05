(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "fame-and-glory",
    "name": "Fame And Glory",
    "displayName": "名望荣耀",
    "displayNameZh": "名望荣耀",
    "displayNameEn": "Fame And Glory",
    "profile": {
      "baseAbility": 84,
      "peakAbility": 88,
      "note": "由中长距离转向长途仍能夺G1，加冕杯与雅士谷金杯胜出。"
    },
    "races": [
      {
        "raceId": "criterium-de-saint-cloud",
        "year": 2008,
        "ability": 88,
        "jockeyId": "johnny-murtagh",
        "finish": 1
      },
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
