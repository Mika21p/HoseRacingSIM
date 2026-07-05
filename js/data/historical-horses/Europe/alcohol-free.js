(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "alcohol-free",
    "name": "Alcohol Free",
    "displayName": "滴酒不沾",
    "displayNameZh": "滴酒不沾",
    "displayNameEn": "Alcohol Free",
    "profile": {
      "baseAbility": 84,
      "peakAbility": 86,
      "note": "Alcohol Free major race wins recorded for currently available project race IDs."
    },
    "races": [
      {
        "raceId": "cheveley-park-stakes",
        "year": 2020,
        "ability": 84,
        "jockeyId": "oisin-murphy",
        "finish": 1
      },
      {
        "raceId": "coronation-stakes",
        "year": 2021,
        "ability": 85,
        "jockeyId": "oisin-murphy",
        "finish": 1
      },
      {
        "raceId": "sussex-stakes",
        "year": 2021,
        "ability": 86,
        "jockeyId": "oisin-murphy",
        "finish": 1
      },
      {
        "raceId": "july-cup",
        "year": 2022,
        "ability": 86,
        "jockeyId": "rob-hornby",
        "finish": 1
      }
    ]
  });
})();
