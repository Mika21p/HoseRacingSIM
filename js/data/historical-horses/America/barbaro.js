(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "barbaro",
    "name": "Barbaro",
    "displayName": "巴巴罗",
    "displayNameZh": "巴巴罗",
    "displayNameEn": "Barbaro",
    "profile": {
      "baseAbility": 88,
      "peakAbility": 90,
      "note": "Barbaro major race wins recorded for currently available project race IDs."
    },
    "races": [
      {
        "raceId": "florida-derby",
        "year": 2006,
        "ability": 88,
        "jockeyId": "edgar-prado",
        "finish": 1
      },
      {
        "raceId": "kentucky-derby",
        "year": 2006,
        "ability": 90,
        "jockeyId": "edgar-prado",
        "finish": 1
      }
    ]
  });
})();
