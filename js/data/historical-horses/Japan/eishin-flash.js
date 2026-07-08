(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "eishin-flash",
    "name": "エイシンフラッシュ",
    "displayName": "荣进闪耀",
    "displayNameZh": "荣进闪耀",
    "displayNameEn": "Eishin Flash",
    "profile": {
      "baseAbility": 81,
      "peakAbility": 83,
      "note": "日本德比马，后于天皇赏秋再夺一级赛。"
    },
    "races": [
      {
        "raceId": "keisei-hai",
        "year": 2010,
        "ability": 81,
        "jockeyId": "norihiro-yokoyama",
        "finish": 1
      },
      {
        "raceId": "tokyo-yushun",
        "year": 2010,
        "ability": 83,
        "jockeyId": "hiroyuki-uchida",
        "finish": 1
      },
      {
        "raceId": "tenno-sho-aki",
        "year": 2012,
        "ability": 83,
        "jockeyId": "mirco-demuro",
        "finish": 1
      },
      {
        "raceId": "mainichi-okan",
        "year": 2013,
        "ability": 82,
        "jockeyId": "yuichi-fukunaga",
        "finish": 1
      }
    ]
  });
})();
