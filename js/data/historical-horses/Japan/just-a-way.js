(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
      "id": "just-a-way",
      "name": "???????",
      "displayName": "一路通",
      "displayNameZh": "一路通",
      "displayNameEn": "Just A Way",
      "profile": {
          "baseAbility": 88,
          "peakAbility": 90,
          "note": "World champion of 2014 with Tenno Sho, Dubai Turf and Yasuda Kinen wins."
      },
      "races": [
          {
              "raceId": "tenno-sho-aki",
              "year": 2013,
              "ability": 89,
              "jockeyId": "yuichi-fukunaga",
              "finish": 1
          },
          {
              "raceId": "nakayama-kinen",
              "year": 2014,
              "ability": 89,
              "jockeyId": "norihiro-yokoyama",
              "finish": 1
          },
          {
              "raceId": "dubai-turf",
              "year": 2014,
              "ability": 90,
              "jockeyId": "yuichi-fukunaga",
              "finish": 1
          },
          {
              "raceId": "yasuda-kinen",
              "year": 2014,
              "ability": 90,
              "jockeyId": "yoshitomi-shibata",
              "finish": 1
          }
      ]
  });
})();
