(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "los-angeles",
    "name": "Los Angeles",
    "displayName": "南加名城",
    "displayNameZh": "南加名城",
    "displayNameEn": "Los Angeles",
    "profile": {
      "baseAbility": 86,
      "peakAbility": 88,
      "note": "Los Angeles major race wins recorded for currently available project race IDs."
    },
    "races": [
      {
        "raceId": "criterium-de-saint-cloud",
        "year": 2023,
        "ability": 86,
        "jockeyId": "christophe-soumillon",
        "finish": 1
      },
      {
        "raceId": "irish-derby",
        "year": 2024,
        "ability": 87,
        "jockeyId": "ryan-moore",
        "finish": 1
      },
      {
        "raceId": "tattersalls-gold-cup",
        "year": 2025,
        "ability": 88,
        "jockeyId": "ryan-moore",
        "finish": 1
      }
    ]
  });
})();
