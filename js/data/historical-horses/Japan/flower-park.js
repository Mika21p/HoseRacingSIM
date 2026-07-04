(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "flower-park",
    "name": "フラワーパーク",
    "displayName": "花公园",
    "displayNameZh": "花公园",
    "displayNameEn": "Flower Park",
    "profile": {
      "baseAbility": 77,
      "peakAbility": 79,
      "note": "1996年春秋短途G1连胜，早期日本短途雌马名将。"
    },
    "races": [
      {
        "raceId": "silk-road-stakes",
        "year": 1996,
        "ability": 77,
        "jockeyId": "tabara-seiki",
        "finish": 1
      },
      {
        "raceId": "takamatsunomiya-kinen",
        "year": 1996,
        "ability": 79,
        "jockeyId": "tabara-seiki",
        "finish": 1
      },
      {
        "raceId": "sprinters-stakes",
        "year": 1996,
        "ability": 79,
        "jockeyId": "tabara-seiki",
        "finish": 1
      }
    ]
  });
})();
