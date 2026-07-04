(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "torquator-tasso",
    "name": "Torquator Tasso",
    "displayName": "惊世诗才",
    "displayNameZh": "惊世诗才",
    "displayNameEn": "Torquator Tasso",
    "profile": {
      "baseAbility": 87,
      "peakAbility": 89,
      "note": "German Horse of the Year and 2021 Arc winner."
    },
    "races": [
      {
        "raceId": "grosser-preis-von-berlin",
        "year": 2020,
        "ability": 87,
        "jockeyId": "lukas-delozier",
        "finish": 1
      },
      {
        "raceId": "grosser-preis-von-baden",
        "year": 2021,
        "ability": 88,
        "jockeyId": "rene-piechulek",
        "finish": 1
      },
      {
        "raceId": "prix-de-larc",
        "year": 2021,
        "ability": 89,
        "jockeyId": "rene-piechulek",
        "finish": 1
      }
    ]
  });
})();
