(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "king-kamehameha",
    "name": "キングカメハメハ",
    "displayName": "夏威夷王",
    "displayNameZh": "夏威夷王",
    "displayNameEn": "King Kamehameha",
    "profile": {
      "baseAbility": 83,
      "peakAbility": 85,
      "note": "NHK一哩杯与日本德比变则二冠，短生涯峰值极高。"
    },
    "races": [
      {
        "raceId": "mainichi-hai",
        "year": 2004,
        "ability": 82,
        "jockeyId": "katsumi-ando",
        "finish": 1
      },
      {
        "raceId": "nhk-mile-cup",
        "year": 2004,
        "ability": 84,
        "jockeyId": "katsumi-ando",
        "finish": 1
      },
      {
        "raceId": "tokyo-yushun",
        "year": 2004,
        "ability": 85,
        "jockeyId": "katsumi-ando",
        "finish": 1
      },
      {
        "raceId": "kobe-shimbun-hai",
        "year": 2004,
        "ability": 84,
        "jockeyId": "katsumi-ando",
        "finish": 1
      }
    ]
  });
})();
