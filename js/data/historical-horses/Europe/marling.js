(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "marling",
    "name": "Marling",
    "displayName": "Marling",
    "displayNameZh": "Marling",
    "displayNameEn": "Marling",
    "profile": {
      "baseAbility": 86,
      "peakAbility": 88,
      "note": "Irish 1000 Guineas win is intentionally omitted because no matching project raceId exists."
    },
    "races": [
      {
        "raceId": "cheveley-park-stakes",
        "year": 1991,
        "ability": 86,
        "jockeyId": "walter-swinburn",
        "finish": 1
      },
      {
        "raceId": "coronation-stakes",
        "year": 1992,
        "ability": 87,
        "jockeyId": "walter-swinburn",
        "finish": 1
      },
      {
        "raceId": "sussex-stakes",
        "year": 1992,
        "ability": 88,
        "jockeyId": "pat-eddery",
        "finish": 1
      }
    ]
  });
})();
