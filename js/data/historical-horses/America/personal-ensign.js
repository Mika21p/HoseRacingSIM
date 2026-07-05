(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "personal-ensign",
    "name": "Personal Ensign",
    "displayName": "Personal Ensign",
    "displayNameZh": "Personal Ensign",
    "displayNameEn": "Personal Ensign",
    "profile": {
      "baseAbility": 92,
      "peakAbility": 94,
      "note": "Personal Ensign major race wins recorded for currently available project race IDs."
    },
    "races": [
      {
        "raceId": "frizette-stakes",
        "year": 1986,
        "ability": 92,
        "jockeyId": "randy-romero",
        "finish": 1
      },
      {
        "raceId": "breeders-cup-distaff",
        "year": 1988,
        "ability": 94,
        "jockeyId": "randy-romero",
        "finish": 1
      }
    ]
  });
})();
