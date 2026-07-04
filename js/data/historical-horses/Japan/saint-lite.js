(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
      "id": "saint-lite",
      "name": "??????",
      "displayName": "圣烈特",
      "displayNameZh": "圣烈特",
      "displayNameEn": "Saint Lite",
      "profile": {
          "baseAbility": 78,
          "peakAbility": 80,
          "note": "First Japanese Triple Crown winner."
      },
      "races": [
          {
              "raceId": "satsuki-sho",
              "year": 1941,
              "ability": 79,
              "jockeyId": "kizo-konishi",
              "finish": 1
          },
          {
              "raceId": "tokyo-yushun",
              "year": 1941,
              "ability": 80,
              "jockeyId": "kizo-konishi",
              "finish": 1
          },
          {
              "raceId": "kikka-sho",
              "year": 1941,
              "ability": 80,
              "jockeyId": "kizo-konishi",
              "finish": 1
          }
      ]
  });
})();
