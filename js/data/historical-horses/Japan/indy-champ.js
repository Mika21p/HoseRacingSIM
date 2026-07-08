(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "indy-champ",
    "name": "インディチャンプ",
    "displayName": "冠军车手",
    "displayNameZh": "冠军车手",
    "displayNameEn": "Indy Champ",
    "profile": {
      "baseAbility": 81,
      "peakAbility": 83,
      "note": "日本一哩强豪，2019 年包揽安田纪念与一哩冠军赛。"
    },
    "races": [
      {
        "raceId": "tokyo-shimbun-hai",
        "year": 2019,
        "ability": 81,
        "jockeyId": "yuichi-fukunaga",
        "finish": 1
      },
      {
        "raceId": "yasuda-kinen",
        "year": 2019,
        "ability": 83,
        "jockeyId": "yuichi-fukunaga",
        "finish": 1
      },
      {
        "raceId": "mile-championship",
        "year": 2019,
        "ability": 83,
        "jockeyId": "kenichi-ikezoe",
        "finish": 1
      },
      {
        "raceId": "yomiuri-milers-cup",
        "year": 2020,
        "ability": 81,
        "jockeyId": "yuichi-fukunaga",
        "finish": 1
      }
    ]
  });
})();
