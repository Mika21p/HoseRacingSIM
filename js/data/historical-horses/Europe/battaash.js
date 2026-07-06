(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "battaash",
    "name": "Battaash",
    "displayName": "巴塔什",
    "displayNameZh": "巴塔什",
    "displayNameEn": "Battaash",
    "profile": {
      "baseAbility": 88,
      "peakAbility": 90,
      "note": "欧洲1000米短途王，南索普、阿贝耶与皇家雅士谷短途多胜。"
    },
    "races": [
      {
        "raceId": "prix-de-labbaye",
        "year": 2017,
        "ability": 88,
        "jockeyId": "jim-crowley",
        "finish": 1
      },
      {
        "raceId": "nunthorpe-stakes",
        "year": 2019,
        "ability": 88,
        "jockeyId": "jim-crowley",
        "finish": 1
      },
      {
        "raceId": "king-charles-iii-stakes",
        "year": 2020,
        "ability": 90,
        "jockeyId": "jim-crowley",
        "finish": 1
      },
      {
        "raceId": "nunthorpe-stakes",
        "year": 2020,
        "ability": 90,
        "jockeyId": "jim-crowley",
        "finish": 1
      }
    ]
  });
})();
