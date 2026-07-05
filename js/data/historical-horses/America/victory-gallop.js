(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "victory-gallop",
    "name": "Victory Gallop",
    "displayName": "胜利跃步",
    "displayNameZh": "胜利跃步",
    "displayNameEn": "Victory Gallop",
    "profile": {
      "baseAbility": 86,
      "peakAbility": 88,
      "note": "Victory Gallop major race wins recorded for currently available project race IDs."
    },
    "races": [
      {
        "raceId": "arkansas-derby",
        "year": 1998,
        "ability": 86,
        "jockeyId": "alex-solis",
        "finish": 1
      },
      {
        "raceId": "belmont-stakes",
        "year": 1998,
        "ability": 88,
        "jockeyId": "gary-stevens",
        "finish": 1
      },
      {
        "raceId": "stephen-foster-stakes",
        "year": 1999,
        "ability": 87,
        "jockeyId": "gary-stevens",
        "finish": 1
      },
      {
        "raceId": "whitney-stakes",
        "year": 1999,
        "ability": 88,
        "jockeyId": "gary-stevens",
        "finish": 1
      }
    ]
  });
})();
