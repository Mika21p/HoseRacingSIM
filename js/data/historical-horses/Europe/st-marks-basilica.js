(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "st-marks-basilica",
    "name": "St Mark's Basilica",
    "displayName": "金教堂",
    "displayNameZh": "金教堂",
    "displayNameEn": "St Mark's Basilica",
    "profile": {
      "baseAbility": 88,
      "peakAbility": 90,
      "note": "2021年欧洲三岁中距离核心，法国德比、日蚀与爱尔兰冠军连胜。"
    },
    "races": [
      { "raceId": "poule-dessai-des-poulains", "year": 2021, "ability": 89, "jockeyId": "ioritz-mendizabal", "finish": 1 },
      {
        "raceId": "dewhurst-stakes",
        "year": 2020,
        "ability": 88,
        "jockeyId": "frankie-dettori",
        "finish": 1
      },
      {
        "raceId": "prix-du-jockey-club",
        "year": 2021,
        "ability": 89,
        "jockeyId": "ioritz-mendizabal",
        "finish": 1
      },
      {
        "raceId": "eclipse-stakes",
        "year": 2021,
        "ability": 90,
        "jockeyId": "ryan-moore",
        "finish": 1
      },
      {
        "raceId": "irish-champion-stakes",
        "year": 2021,
        "ability": 90,
        "jockeyId": "ryan-moore",
        "finish": 1
      }
    ]
  });
})();
