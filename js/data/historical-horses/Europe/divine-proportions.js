(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "divine-proportions",
    "name": "Divine Proportions",
    "displayName": "神圣比例",
    "displayNameZh": "神圣比例",
    "displayNameEn": "Divine Proportions",
    "profile": {
      "baseAbility": 83,
      "peakAbility": 85,
      "note": "法国经典赛雌马名将，法国橡树冠军。"
    },
    "races": [
      {
        "raceId": "prix-morny",
        "year": 2004,
        "ability": 83,
        "jockeyId": "christophe-lemaire",
        "finish": 1
      },
      {
        "raceId": "prix-marcel-boussac",
        "year": 2004,
        "ability": 83,
        "jockeyId": "christophe-lemaire",
        "finish": 1
      },
      {
        "raceId": "prix-rothschild",
        "year": 2005,
        "ability": 85,
        "jockeyId": "christophe-lemaire",
        "finish": 1
      },
      {
        "raceId": "prix-de-diane",
        "year": 2005,
        "ability": 85,
        "jockeyId": "christophe-soumillon",
        "finish": 1
      }
    ]
  });
})();
