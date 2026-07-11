(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "blue-rose-cen",
    "name": "Blue Rose Cen",
    "displayName": "蓝玫瑰仙",
    "displayNameZh": "蓝玫瑰仙",
    "displayNameEn": "Blue Rose Cen",
    "profile": {
      "baseAbility": 82,
      "peakAbility": 84,
      "note": "2023年法国橡树冠军，三岁雌马路线代表。"
    },
    "races": [
      { "raceId": "poule-dessai-des-pouliches", "year": 2023, "ability": 84, "jockeyId": "aurelien-lemaitre", "finish": 1 },
      { "raceId": "prix-de-lopera", "year": 2023, "ability": 84, "jockeyId": "aurelien-lemaitre", "finish": 1 },
      {
        "raceId": "prix-marcel-boussac",
        "year": 2022,
        "ability": 82,
        "jockeyId": "aurelien-lemaitre",
        "finish": 1
      },
      {
        "raceId": "prix-de-diane",
        "year": 2023,
        "ability": 84,
        "jockeyId": "aurelien-lemaitre",
        "finish": 1
      }
    ]
  });
})();
