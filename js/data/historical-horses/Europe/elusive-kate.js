(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "elusive-kate",
    "name": "Elusive Kate",
    "displayName": "难捉凯特",
    "displayNameZh": "难捉凯特",
    "displayNameEn": "Elusive Kate",
    "profile": {
      "baseAbility": 83,
      "peakAbility": 85,
      "note": "John Gosden-trained miler with Boussac, Rothschild and Falmouth wins."
    },
    "races": [
      {
        "raceId": "prix-marcel-boussac",
        "year": 2011,
        "ability": 83,
        "jockeyId": "william-buick",
        "finish": 1
      },
      {
        "raceId": "prix-rothschild",
        "year": 2012,
        "ability": 84,
        "jockeyId": "william-buick",
        "finish": 1
      },
      {
        "raceId": "falmouth-stakes",
        "year": 2013,
        "ability": 85,
        "jockeyId": "william-buick",
        "finish": 1
      },
      {
        "raceId": "prix-rothschild",
        "year": 2013,
        "ability": 85,
        "jockeyId": "william-buick",
        "finish": 1
      }
    ]
  });
})();
