(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "native-dancer",
    "name": "Native Dancer",
    "displayName": "天才舞者",
    "displayNameZh": "天才舞者",
    "displayNameEn": "Native Dancer",
    "profile": {
      "baseAbility": 93,
      "peakAbility": 95,
      "note": "灰色幽灵，美国经典赛与古马一哩线均有历史级影响力。"
    },
    "races": [
      {
        "raceId": "preakness-stakes",
        "year": 1953,
        "ability": 94,
        "jockeyId": "eric-guerin",
        "finish": 1
      },
      {
        "raceId": "belmont-stakes",
        "year": 1953,
        "ability": 95,
        "jockeyId": "eric-guerin",
        "finish": 1
      },
      {
        "raceId": "travers-stakes",
        "year": 1953,
        "ability": 94,
        "jockeyId": "eric-guerin",
        "finish": 1
      },
      {
        "raceId": "metropolitan-handicap",
        "year": 1954,
        "ability": 95,
        "jockeyId": "eric-guerin",
        "finish": 1
      }
    ]
  });
})();
