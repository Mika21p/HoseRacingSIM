(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "bosra-sham",
    "name": "Bosra Sham",
    "displayName": "博斯拉沙姆",
    "displayNameZh": "博斯拉沙姆",
    "displayNameEn": "Bosra Sham",
    "profile": {
      "baseAbility": 83,
      "peakAbility": 92,
      "note": "九十年代英国顶级雌马，三岁时夺取一千坚尼。"
    },
    "races": [
      {
        "raceId": "fillies-mile",
        "year": 1995,
        "ability": 90,
        "jockeyId": "pat-eddery",
        "finish": 1
      },
      {
        "raceId": "one-thousand-guineas",
        "year": 1996,
        "ability": 84,
        "jockeyId": "pat-eddery",
        "finish": 1
      },
      {
        "raceId": "champion-stakes",
        "year": 1996,
        "ability": 92,
        "jockeyId": "pat-eddery",
        "finish": 1
      },
      {
        "raceId": "prince-of-wales-stakes",
        "year": 1997,
        "ability": 91,
        "jockeyId": "kieren-fallon",
        "finish": 1
      }
    ]
  });
})();
