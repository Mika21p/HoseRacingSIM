(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "red-falx",
    "name": "レッドファルクス",
    "displayName": "弯刀赤骏",
    "displayNameZh": "弯刀赤骏",
    "displayNameEn": "Red Falx",
    "profile": {
      "baseAbility": 79,
      "peakAbility": 81,
      "note": "日本短途马，连续两年赢得短途马锦标。"
    },
    "races": [
      {
        "raceId": "cbc-sho",
        "year": 2016,
        "ability": 79,
        "jockeyId": "mirco-demuro",
        "finish": 1
      },
      {
        "raceId": "sprinters-stakes",
        "year": 2016,
        "ability": 81,
        "jockeyId": "mirco-demuro",
        "finish": 1
      },
      {
        "raceId": "keio-hai-spring-cup",
        "year": 2017,
        "ability": 79,
        "jockeyId": "mirco-demuro",
        "finish": 1
      },
      {
        "raceId": "sprinters-stakes",
        "year": 2017,
        "ability": 81,
        "jockeyId": "mirco-demuro",
        "finish": 1
      }
    ]
  });
})();
