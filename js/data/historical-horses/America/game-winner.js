(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "game-winner",
    "name": "Game Winner",
    "displayName": "Game Winner",
    "displayNameZh": "Game Winner",
    "displayNameEn": "Game Winner",
    "profile": {
      "baseAbility": 84,
      "peakAbility": 86,
      "note": "Game Winner major race wins recorded for currently available project race IDs."
    },
    "races": [
      {
        "raceId": "american-pharoah-stakes",
        "year": 2018,
        "ability": 84,
        "jockeyId": "joel-rosario",
        "finish": 1
      },
      {
        "raceId": "del-mar-futurity",
        "year": 2018,
        "ability": 84,
        "jockeyId": "joel-rosario",
        "finish": 1
      },
      {
        "raceId": "breeders-cup-juvenile",
        "year": 2018,
        "ability": 86,
        "jockeyId": "joel-rosario",
        "finish": 1
      }
    ]
  });
})();
