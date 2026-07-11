(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "golden-horn",
    "name": "Golden Horn",
    "displayName": "金号角",
    "displayNameZh": "金号角",
    "displayNameEn": "Golden Horn",
    "profile": {
      "baseAbility": 88,
      "peakAbility": 90,
      "note": "2015年欧洲马王，德比、日蚀、爱尔兰冠军与凯旋门连线。"
    },
    "races": [
      { "raceId": "europe-g2-dante-stakes", "year": 2015, "ability": 89, "jockeyId": "william-buick", "finish": 1 },
      {
        "raceId": "epsom-derby",
        "year": 2015,
        "ability": 88,
        "jockeyId": "frankie-dettori",
        "finish": 1
      },
      {
        "raceId": "eclipse-stakes",
        "year": 2015,
        "ability": 89,
        "jockeyId": "frankie-dettori",
        "finish": 1
      },
      {
        "raceId": "irish-champion-stakes",
        "year": 2015,
        "ability": 89,
        "jockeyId": "frankie-dettori",
        "finish": 1
      },
      {
        "raceId": "prix-de-larc",
        "year": 2015,
        "ability": 90,
        "jockeyId": "frankie-dettori",
        "finish": 1
      }
    ]
  });
})();
