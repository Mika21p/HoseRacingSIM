(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "kyprios",
    "name": "Kyprios",
    "displayName": "Kyprios",
    "profile": {
      "baseAbility": 86,
      "peakAbility": 88,
      "note": "近年欧洲长途顶级马，雅士谷金杯多胜。"
    },
    "races": [
      {
        "raceId": "ascot-gold-cup",
        "year": 2022,
        "ability": 88,
        "jockeyId": "ryan-moore",
        "finish": 1
      },
      {
        "raceId": "ascot-gold-cup",
        "year": 2024,
        "ability": 88,
        "jockeyId": "ryan-moore",
        "finish": 1
      }
    ]
  });
})();
