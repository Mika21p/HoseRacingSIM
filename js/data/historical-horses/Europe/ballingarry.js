(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "ballingarry",
    "name": "Ballingarry",
    "displayName": "巴林加里",
    "displayNameZh": "巴林加里",
    "displayNameEn": "Ballingarry",
    "profile": {
      "baseAbility": 83,
      "peakAbility": 84,
      "note": "Ballingarry major race wins recorded for currently available project race IDs."
    },
    "races": [
      { "raceId": "europe-g3-prix-noailles", "year": 2002, "ability": 83, "jockeyId": "jamie-spencer", "finish": 1 },
      {
        "raceId": "criterium-de-saint-cloud",
        "year": 2001,
        "ability": 84,
        "jockeyId": "jamie-spencer",
        "finish": 1
      }
    ]
  });
})();
