(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "harbinger",
    "name": "Harbinger",
    "displayName": "无敌先锋",
    "displayNameZh": "无敌先锋",
    "displayNameEn": "Harbinger",
    "profile": {
      "baseAbility": 93,
      "peakAbility": 95,
      "note": "2010年英皇锦标大胜，单场峰值极高。"
    },
    "races": [
      { "raceId": "europe-g3-john-porter-stakes", "year": 2010, "ability": 93, "jockeyId": "ryan-moore", "finish": 1 },
      {
        "raceId": "king-george-vi-and-queen-elizabeth-stakes",
        "year": 2010,
        "ability": 95,
        "jockeyId": "olivier-peslier",
        "finish": 1
      }
    ]
  });
})();
