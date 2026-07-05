(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "night-magic",
    "name": "Night Magic",
    "displayName": "夜之魔力",
    "displayNameZh": "夜之魔力",
    "displayNameEn": "Night Magic",
    "profile": {
      "baseAbility": 82,
      "peakAbility": 84,
      "note": "Night Magic major race wins recorded for currently available project race IDs."
    },
    "races": [
      {
        "raceId": "preis-der-diana",
        "year": 2009,
        "ability": 82,
        "jockeyId": "generic-local",
        "finish": 1
      },
      {
        "raceId": "grosser-preis-von-baden",
        "year": 2010,
        "ability": 84,
        "jockeyId": "filip-minarik",
        "finish": 1
      }
    ]
  });
})();
