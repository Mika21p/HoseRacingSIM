(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "war-admiral",
    "name": "War Admiral",
    "displayName": "战争上将",
    "displayNameZh": "战争上将",
    "displayNameEn": "War Admiral",
    "profile": {
      "baseAbility": 90,
      "peakAbility": 92,
      "note": "Man o' War之子，美国三冠早期代表，泥地经典实力突出。"
    },
    "races": [
      {
        "raceId": "kentucky-derby",
        "year": 1937,
        "ability": 91,
        "jockeyId": "charley-kurtsinger",
        "finish": 1
      },
      {
        "raceId": "preakness-stakes",
        "year": 1937,
        "ability": 91,
        "jockeyId": "charley-kurtsinger",
        "finish": 1
      },
      {
        "raceId": "belmont-stakes",
        "year": 1937,
        "ability": 92,
        "jockeyId": "charley-kurtsinger",
        "finish": 1
      },
      {
        "raceId": "whitney-stakes",
        "year": 1938,
        "ability": 93,
        "jockeyId": "wayne-d-wright",
        "finish": 1
      },
      {
        "raceId": "jockey-club-gold-cup",
        "year": 1938,
        "ability": 94,
        "jockeyId": "wayne-d-wright",
        "finish": 1
      }
    ]
  });
})();
