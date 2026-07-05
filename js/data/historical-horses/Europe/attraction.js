(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "attraction",
    "name": "Attraction",
    "displayName": "吸引力",
    "displayNameZh": "吸引力",
    "displayNameEn": "Attraction",
    "profile": {
      "baseAbility": 85,
      "peakAbility": 87,
      "note": "Attraction major race wins recorded for currently available project race IDs."
    },
    "races": [
      {
        "raceId": "irish-one-thousand-guineas",
        "year": 2004,
        "ability": 85,
        "jockeyId": "kevin-darley",
        "finish": 1
      },
      {
        "raceId": "one-thousand-guineas",
        "year": 2004,
        "ability": 85,
        "jockeyId": "kevin-darley",
        "finish": 1
      },
      {
        "raceId": "coronation-stakes",
        "year": 2004,
        "ability": 86,
        "jockeyId": "kevin-darley",
        "finish": 1
      },
      {
        "raceId": "sun-chariot-stakes",
        "year": 2004,
        "ability": 87,
        "jockeyId": "kevin-darley",
        "finish": 1
      },
      {
        "raceId": "matron-stakes",
        "year": 2005,
        "ability": 86,
        "jockeyId": "kevin-darley",
        "finish": 1
      }
    ]
  });
})();
