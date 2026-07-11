(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "street-cry",
    "name": "Street Cry",
    "displayName": "街头号角",
    "displayNameZh": "街头号角",
    "displayNameEn": "Street Cry",
    "profile": {
      "baseAbility": 88,
      "peakAbility": 90,
      "note": "Street Cry major race wins recorded for currently available project race IDs."
    },
    "races": [
      {
        "raceId": "uae-2000-guineas",
        "year": 2001,
        "ability": 88,
        "jockeyId": "frankie-dettori",
        "finish": 1
      },
      {
        "raceId": "al-maktoum-challenge",
        "year": 2002,
        "ability": 88,
        "jockeyId": "frankie-dettori",
        "finish": 1
      },
      {
        "raceId": "dubai-world-cup",
        "year": 2002,
        "ability": 90,
        "jockeyId": "jerry-bailey",
        "finish": 1
      }
    ]
  });
})();
