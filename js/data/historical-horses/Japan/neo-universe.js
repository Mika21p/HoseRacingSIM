(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "neo-universe",
    "name": "ネオユニヴァース",
    "displayName": "新宇宙",
    "displayNameZh": "新宇宙",
    "displayNameEn": "Neo Universe",
    "profile": {
      "baseAbility": 81,
      "peakAbility": 83,
      "note": "日本二冠马，2003 年皋月赏与日本德比胜马。"
    },
    "races": [
      {
        "raceId": "kisaragi-sho",
        "year": 2003,
        "ability": 81,
        "jockeyId": "yuichi-fukunaga",
        "finish": 1
      },
      {
        "raceId": "spring-stakes",
        "year": 2003,
        "ability": 81,
        "jockeyId": "mirco-demuro",
        "finish": 1
      },
      {
        "raceId": "satsuki-sho",
        "year": 2003,
        "ability": 83,
        "jockeyId": "mirco-demuro",
        "finish": 1
      },
      {
        "raceId": "tokyo-yushun",
        "year": 2003,
        "ability": 83,
        "jockeyId": "mirco-demuro",
        "finish": 1
      },
      {
        "raceId": "osaka-hai",
        "year": 2004,
        "ability": 81,
        "jockeyId": "mirco-demuro",
        "finish": 1
      }
    ]
  });
})();
