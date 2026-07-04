(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "harry-angel",
    "name": "Harry Angel",
    "displayName": "Harry Angel",
    "profile": {
      "baseAbility": 85,
      "peakAbility": 87,
      "note": "2017年七月杯与海多克短途杯冠军，短途速度上限高。"
    },
    "races": [
      {
        "raceId": "july-cup",
        "year": 2017,
        "ability": 87,
        "jockeyId": "adam-kirby",
        "finish": 1
      },
      {
        "raceId": "haydock-sprint-cup",
        "year": 2017,
        "ability": 87,
        "jockeyId": "adam-kirby",
        "finish": 1
      }
    ]
  });
})();
