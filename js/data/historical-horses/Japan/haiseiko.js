(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
      "id": "haiseiko",
      "name": "??????",
      "displayName": "海塞科",
      "displayNameZh": "海塞科",
      "displayNameEn": "Haiseiko",
      "profile": {
          "baseAbility": 78,
          "peakAbility": 80,
          "note": "Idol horse of the 1970s and Satsuki Sho winner."
      },
      "races": [
          {
              "raceId": "yayoi-sho",
              "year": 1973,
              "ability": 78,
              "jockeyId": "sueo-masuzawa",
              "finish": 1
          },
          {
              "raceId": "spring-stakes",
              "year": 1973,
              "ability": 79,
              "jockeyId": "sueo-masuzawa",
              "finish": 1
          },
          {
              "raceId": "satsuki-sho",
              "year": 1973,
              "ability": 80,
              "jockeyId": "sueo-masuzawa",
              "finish": 1
          },
          {
              "raceId": "nakayama-kinen",
              "year": 1974,
              "ability": 79,
              "jockeyId": "sueo-masuzawa",
              "finish": 1
          },
          {
              "raceId": "takarazuka-kinen",
              "year": 1974,
              "ability": 80,
              "jockeyId": "sueo-masuzawa",
              "finish": 1
          }
      ]
  });
})();
