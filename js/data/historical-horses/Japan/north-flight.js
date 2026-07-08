(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "north-flight",
    "name": "ノースフライト",
    "displayName": "北方飞翔",
    "displayNameZh": "北方飞翔",
    "displayNameEn": "North Flight",
    "profile": {
      "baseAbility": 81,
      "peakAbility": 83,
      "note": "日本一哩女杰，1994 年安田纪念与一哩冠军赛双胜。"
    },
    "races": [
      {
        "raceId": "fuchu-himba-stakes",
        "year": 1993,
        "ability": 81,
        "jockeyId": "koichi-tsunoda",
        "finish": 1
      },
      {
        "raceId": "hanshin-himba-stakes",
        "year": 1993,
        "ability": 81,
        "jockeyId": "take-yutaka",
        "finish": 1
      },
      {
        "raceId": "yomiuri-milers-cup",
        "year": 1994,
        "ability": 82,
        "jockeyId": "take-yutaka",
        "finish": 1
      },
      {
        "raceId": "yasuda-kinen",
        "year": 1994,
        "ability": 83,
        "jockeyId": "koichi-tsunoda",
        "finish": 1
      },
      {
        "raceId": "mile-championship",
        "year": 1994,
        "ability": 83,
        "jockeyId": "koichi-tsunoda",
        "finish": 1
      }
    ]
  });
})();
