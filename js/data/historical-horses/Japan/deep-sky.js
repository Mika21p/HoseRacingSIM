(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "deep-sky",
    "name": "ディープスカイ",
    "displayName": "天空深处",
    "displayNameZh": "天空深处",
    "displayNameEn": "Deep Sky",
    "profile": {
      "baseAbility": 82,
      "peakAbility": 84,
      "note": "NHK一哩杯与日本德比二冠，2008年三岁战线核心。"
    },
    "races": [
      {
        "raceId": "mainichi-hai",
        "year": 2008,
        "ability": 82,
        "jockeyId": "hirofumi-shii",
        "finish": 1
      },
      {
        "raceId": "nhk-mile-cup",
        "year": 2008,
        "ability": 84,
        "jockeyId": "hirofumi-shii",
        "finish": 1
      },
      {
        "raceId": "tokyo-yushun",
        "year": 2008,
        "ability": 84,
        "jockeyId": "hirofumi-shii",
        "finish": 1
      },
      {
        "raceId": "kobe-shimbun-hai",
        "year": 2008,
        "ability": 83,
        "jockeyId": "hirofumi-shii",
        "finish": 1
      },
      {
        "raceId": "osaka-hai",
        "year": 2009,
        "ability": 83,
        "jockeyId": "hirofumi-shii",
        "finish": 1
      }
    ]
  });
})();
