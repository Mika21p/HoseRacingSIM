(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "camelot",
    "name": "Camelot",
    "displayName": "卡美洛",
    "displayNameZh": "卡美洛",
    "displayNameEn": "Camelot",
    "profile": {
      "baseAbility": 84,
      "peakAbility": 86,
      "note": "英爱双德比与二千坚尼冠军，2012年欧洲经典赛代表。"
    },
    "races": [
      {
        "raceId": "futurity-trophy",
        "year": 2011,
        "ability": 84,
        "jockeyId": "joseph-obrien",
        "finish": 1
      },
      {
        "raceId": "two-thousand-guineas",
        "year": 2012,
        "ability": 85,
        "jockeyId": "joseph-obrien",
        "finish": 1
      },
      {
        "raceId": "epsom-derby",
        "year": 2012,
        "ability": 86,
        "jockeyId": "joseph-obrien",
        "finish": 1
      },
      {
        "raceId": "irish-derby",
        "year": 2012,
        "ability": 86,
        "jockeyId": "joseph-obrien",
        "finish": 1
      }
    ]
  });
})();
