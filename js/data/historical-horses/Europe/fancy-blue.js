(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "fancy-blue",
    "name": "Fancy Blue",
    "displayName": "梦幻蓝",
    "displayNameZh": "梦幻蓝",
    "displayNameEn": "Fancy Blue",
    "profile": {
      "baseAbility": 81,
      "peakAbility": 83,
      "note": "2020年法国橡树冠军，当前赛事表收录其核心G1胜鞍。"
    },
    "races": [
      {
        "raceId": "prix-de-diane",
        "year": 2020,
        "ability": 83,
        "jockeyId": "pierre-charles-boudot",
        "finish": 1
      },
      {
        "raceId": "nassau-stakes",
        "year": 2020,
        "ability": 83,
        "jockeyId": "ryan-moore",
        "finish": 1
      }
    ]
  });
})();
