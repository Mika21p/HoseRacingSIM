(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "admire-mars",
    "name": "アドマイヤマーズ",
    "displayName": "颂赞火星",
    "displayNameZh": "颂赞火星",
    "displayNameEn": "Admire Mars",
    "profile": {
      "baseAbility": 80,
      "peakAbility": 82,
      "note": "两岁G1、NHK一哩杯与香港一哩冠军，一哩上限稳定。"
    },
    "races": [
      {
        "raceId": "daily-hai-nisai-stakes",
        "year": 2018,
        "ability": 80,
        "jockeyId": "mirco-demuro",
        "finish": 1
      },
      {
        "raceId": "asahi-hai-fs",
        "year": 2018,
        "ability": 82,
        "jockeyId": "mirco-demuro",
        "finish": 1
      },
      {
        "raceId": "nhk-mile-cup",
        "year": 2019,
        "ability": 82,
        "jockeyId": "mirco-demuro",
        "finish": 1
      },
      {
        "raceId": "hong-kong-mile",
        "year": 2019,
        "ability": 82,
        "jockeyId": "christophe-soumillon",
        "finish": 1
      }
    ]
  });
})();
