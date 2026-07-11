(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "kew-gardens",
    "name": "Kew Gardens",
    "displayName": "邱园",
    "displayNameZh": "邱园",
    "displayNameEn": "Kew Gardens",
    "profile": {
      "baseAbility": 82,
      "peakAbility": 84,
      "note": "2018年圣烈治冠军，长途能力扎实。"
    },
    "races": [
      { "raceId": "grand-prix-de-paris", "year": 2018, "ability": 84, "jockeyId": "ryan-moore", "finish": 1 },
      { "raceId": "british-champions-long-distance-cup", "year": 2019, "ability": 84, "jockeyId": "donnacha-obrien", "finish": 1 },
      {
        "raceId": "st-leger-stakes",
        "year": 2018,
        "ability": 84,
        "jockeyId": "ryan-moore",
        "finish": 1
      }
    ]
  });
})();
