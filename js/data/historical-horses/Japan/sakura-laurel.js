(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "sakura-laurel",
    "name": "サクラローレル",
    "displayName": "樱花桂冠",
    "displayNameZh": "樱花桂冠",
    "displayNameEn": "Sakura Laurel",
    "profile": {
      "baseAbility": 82,
      "peakAbility": 84,
      "note": "日本中长距离强马，1996 年天皇赏春与有马纪念胜马。"
    },
    "races": [
      {
        "raceId": "nakayama-kimpai",
        "year": 1995,
        "ability": 82,
        "jockeyId": "futoshi-kojima",
        "finish": 1
      },
      {
        "raceId": "nakayama-kinen",
        "year": 1996,
        "ability": 82,
        "jockeyId": "norihiro-yokoyama",
        "finish": 1
      },
      {
        "raceId": "tenno-sho-haru",
        "year": 1996,
        "ability": 84,
        "jockeyId": "norihiro-yokoyama",
        "finish": 1
      },
      {
        "raceId": "sankei-sho-all-comers",
        "year": 1996,
        "ability": 82,
        "jockeyId": "norihiro-yokoyama",
        "finish": 1
      },
      {
        "raceId": "arima-kinen",
        "year": 1996,
        "ability": 84,
        "jockeyId": "norihiro-yokoyama",
        "finish": 1
      }
    ]
  });
})();
