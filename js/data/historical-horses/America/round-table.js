(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "round-table",
    "name": "Round Table",
    "displayName": "圆桌骑士",
    "displayNameZh": "圆桌骑士",
    "displayNameEn": "Round Table",
    "profile": {
      "baseAbility": 87,
      "peakAbility": 89,
      "note": "美国草地王者兼泥地强者，跨表面能力和持久战绩突出。"
    },
    "races": [
      {
        "raceId": "blue-grass-stakes",
        "year": 1957,
        "ability": 88,
        "jockeyId": "bill-shoemaker",
        "finish": 1
      },
      {
        "raceId": "santa-anita-handicap",
        "year": 1958,
        "ability": 89,
        "jockeyId": "bill-shoemaker",
        "finish": 1
      }
    ]
  });
})();
