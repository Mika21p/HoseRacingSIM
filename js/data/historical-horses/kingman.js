(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "kingman",
    "name": "Kingman",
    "displayName": "Kingman",
    "profile": {
      "baseAbility": 90,
      "peakAbility": 92,
      "note": "2014年欧洲一哩明星，圣詹姆斯皇宫、萨塞克斯与杰克莫华连胜。"
    },
    "races": [
      {
        "raceId": "st-jamess-palace-stakes",
        "year": 2014,
        "ability": 91,
        "jockeyId": "james-doyle",
        "finish": 1
      },
      {
        "raceId": "sussex-stakes",
        "year": 2014,
        "ability": 92,
        "jockeyId": "james-doyle",
        "finish": 1
      },
      {
        "raceId": "prix-jacques-le-marois",
        "year": 2014,
        "ability": 92,
        "jockeyId": "james-doyle",
        "finish": 1
      }
    ]
  });
})();
