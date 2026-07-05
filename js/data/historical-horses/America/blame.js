(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "blame",
    "name": "Blame",
    "displayName": "问责",
    "displayNameZh": "问责",
    "displayNameEn": "Blame",
    "profile": {
      "baseAbility": 89,
      "peakAbility": 91,
      "note": "Blame major race wins recorded for currently available project race IDs."
    },
    "races": [
      {
        "raceId": "stephen-foster-stakes",
        "year": 2010,
        "ability": 89,
        "jockeyId": "garrett-gomez",
        "finish": 1
      },
      {
        "raceId": "whitney-stakes",
        "year": 2010,
        "ability": 90,
        "jockeyId": "garrett-gomez",
        "finish": 1
      },
      {
        "raceId": "breeders-cup-classic",
        "year": 2010,
        "ability": 91,
        "jockeyId": "garrett-gomez",
        "finish": 1
      }
    ]
  });
})();
