(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
      "id": "stay-gold",
      "name": "???????",
      "displayName": "黄金旅程",
      "displayNameZh": "黄金旅程",
      "displayNameEn": "Stay Gold",
      "profile": {
          "baseAbility": 79,
          "peakAbility": 81,
          "note": "International breakthrough horse with Dubai Sheema Classic and Hong Kong Vase wins."
      },
      "races": [
          {
              "raceId": "meguro-kinen",
              "year": 2000,
              "ability": 79,
              "jockeyId": "take-yutaka",
              "finish": 1
          },
          {
              "raceId": "nikkei-shinshun-hai",
              "year": 2001,
              "ability": 80,
              "jockeyId": "shinji-fujita",
              "finish": 1
          },
          {
              "raceId": "dubai-sheema-classic",
              "year": 2001,
              "ability": 81,
              "jockeyId": "take-yutaka",
              "finish": 1
          },
          {
              "raceId": "hong-kong-vase",
              "year": 2001,
              "ability": 81,
              "jockeyId": "take-yutaka",
              "finish": 1
          }
      ]
  });
})();
