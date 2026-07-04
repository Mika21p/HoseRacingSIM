(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "too-darn-hot",
    "name": "Too Darn Hot",
    "displayName": "Too Darn Hot",
    "profile": {
      "baseAbility": 85,
      "peakAbility": 87,
      "note": "2019年萨塞克斯锦标冠军，三岁一哩能力突出。"
    },
    "races": [
      {
        "raceId": "dewhurst-stakes",
        "year": 2018,
        "ability": 86,
        "jockeyId": "frankie-dettori",
        "finish": 1
      },
      {
        "raceId": "sussex-stakes",
        "year": 2019,
        "ability": 87,
        "jockeyId": "frankie-dettori",
        "finish": 1
      }
    ]
  });
})();
