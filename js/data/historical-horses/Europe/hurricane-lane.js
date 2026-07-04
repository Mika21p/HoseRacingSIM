(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "hurricane-lane",
    "name": "Hurricane Lane",
    "displayName": "飓风巷",
    "displayNameZh": "飓风巷",
    "displayNameEn": "Hurricane Lane",
    "profile": {
      "baseAbility": 84,
      "peakAbility": 86,
      "note": "2021年爱尔兰德比与圣烈治冠军，三岁长距离能力强。"
    },
    "races": [
      {
        "raceId": "irish-derby",
        "year": 2021,
        "ability": 85,
        "jockeyId": "william-buick",
        "finish": 1
      },
      {
        "raceId": "st-leger-stakes",
        "year": 2021,
        "ability": 86,
        "jockeyId": "william-buick",
        "finish": 1
      }
    ]
  });
})();
