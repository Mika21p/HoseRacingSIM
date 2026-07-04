(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "dubai-millennium",
    "name": "Dubai Millennium",
    "displayName": "Dubai Millennium",
    "profile": {
      "baseAbility": 96,
      "peakAbility": 98,
      "note": "迪拜世界杯与威尔士亲王锦标冠军，短暂生涯展示历史级统治力。"
    },
    "races": [
      {
        "raceId": "queen-elizabeth-ii-stakes",
        "year": 1999,
        "ability": 96,
        "jockeyId": "frankie-dettori",
        "finish": 1
      },
      {
        "raceId": "dubai-world-cup",
        "year": 2000,
        "ability": 98,
        "jockeyId": "frankie-dettori",
        "finish": 1
      },
      {
        "raceId": "prince-of-wales-stakes",
        "year": 2000,
        "ability": 98,
        "jockeyId": "frankie-dettori",
        "finish": 1
      }
    ]
  });
})();
