(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "heavenly-prize",
    "name": "Heavenly Prize",
    "displayName": "天赐之奖",
    "displayNameZh": "天赐之奖",
    "displayNameEn": "Heavenly Prize",
    "profile": {
      "baseAbility": 87,
      "peakAbility": 89,
      "note": "Heavenly Prize major race wins recorded for currently available project race IDs."
    },
    "races": [
      {
        "raceId": "frizette-stakes",
        "year": 1993,
        "ability": 87,
        "jockeyId": "mike-smith",
        "finish": 1
      },
      {
        "raceId": "alabama-stakes",
        "year": 1994,
        "ability": 89,
        "jockeyId": "mike-smith",
        "finish": 1
      },
      {
        "raceId": "apple-blossom-handicap",
        "year": 1995,
        "ability": 89,
        "jockeyId": "mike-smith",
        "finish": 1
      }
    ]
  });
})();
