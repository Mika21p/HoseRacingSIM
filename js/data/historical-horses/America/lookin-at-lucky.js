(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "lookin-at-lucky",
    "name": "Lookin At Lucky",
    "displayName": "看运气",
    "displayNameZh": "看运气",
    "displayNameEn": "Lookin At Lucky",
    "profile": {
      "baseAbility": 85,
      "peakAbility": 87,
      "note": "Lookin At Lucky major race wins recorded for currently available project race IDs."
    },
    "races": [
      {
        "raceId": "american-pharoah-stakes",
        "year": 2009,
        "ability": 85,
        "jockeyId": "garrett-gomez",
        "finish": 1
      },
      {
        "raceId": "preakness-stakes",
        "year": 2010,
        "ability": 87,
        "jockeyId": "martin-garcia",
        "finish": 1
      },
      {
        "raceId": "haskell-stakes",
        "year": 2010,
        "ability": 86,
        "jockeyId": "martin-garcia",
        "finish": 1
      }
    ]
  });
})();
