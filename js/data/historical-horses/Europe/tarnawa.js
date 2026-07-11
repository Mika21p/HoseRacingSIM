(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "tarnawa",
    "name": "Tarnawa",
    "displayName": "塔纳瓦",
    "displayNameZh": "塔纳瓦",
    "displayNameEn": "Tarnawa",
    "profile": {
      "baseAbility": 84,
      "peakAbility": 86,
      "note": "红宝锦标与育马者杯草地冠军，古马雌马中距离代表。"
    },
    "races": [
      { "raceId": "prix-de-lopera", "year": 2020, "ability": 86, "jockeyId": "christophe-soumillon", "finish": 1 },
      {
        "raceId": "prix-vermeille",
        "year": 2020,
        "ability": 85,
        "jockeyId": "christophe-soumillon",
        "finish": 1
      },
      {
        "raceId": "breeders-cup-turf",
        "year": 2020,
        "ability": 86,
        "jockeyId": "colin-keane",
        "finish": 1
      }
    ]
  });
})();
