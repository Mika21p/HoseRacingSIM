(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "big-brown",
    "name": "Big Brown",
    "displayName": "大布朗",
    "displayNameZh": "大布朗",
    "displayNameEn": "Big Brown",
    "profile": {
      "baseAbility": 88,
      "peakAbility": 90,
      "note": "Big Brown major race wins recorded for currently available project race IDs."
    },
    "races": [
      {
        "raceId": "florida-derby",
        "year": 2008,
        "ability": 88,
        "jockeyId": "kent-desormeaux",
        "finish": 1
      },
      {
        "raceId": "kentucky-derby",
        "year": 2008,
        "ability": 90,
        "jockeyId": "kent-desormeaux",
        "finish": 1
      },
      {
        "raceId": "preakness-stakes",
        "year": 2008,
        "ability": 90,
        "jockeyId": "kent-desormeaux",
        "finish": 1
      },
      {
        "raceId": "haskell-stakes",
        "year": 2008,
        "ability": 89,
        "jockeyId": "kent-desormeaux",
        "finish": 1
      }
    ]
  });
})();
