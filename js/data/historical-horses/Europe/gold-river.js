(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "gold-river",
    "name": "Gold River",
    "displayName": "金河",
    "displayNameZh": "金河",
    "displayNameEn": "Gold River",
    "profile": {
      "baseAbility": 85,
      "peakAbility": 87,
      "note": "French staying mare who won the 1981 Prix de l'Arc de Triomphe."
    },
    "races": [
      {
        "raceId": "prix-royal-oak",
        "year": 1980,
        "ability": 85,
        "jockeyId": "freddy-head",
        "finish": 1
      },
      {
        "raceId": "prix-vicomtesse-vigier",
        "year": 1981,
        "ability": 85,
        "jockeyId": "freddy-head",
        "finish": 1
      },
      {
        "raceId": "prix-du-cadran",
        "year": 1981,
        "ability": 86,
        "jockeyId": "freddy-head",
        "finish": 1
      },
      {
        "raceId": "prix-de-larc",
        "year": 1981,
        "ability": 87,
        "jockeyId": "gary-w-moore",
        "finish": 1
      }
    ]
  });
})();
