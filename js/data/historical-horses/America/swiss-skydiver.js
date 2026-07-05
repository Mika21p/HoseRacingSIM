(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "swiss-skydiver",
    "name": "Swiss Skydiver",
    "displayName": "瑞士跳伞者",
    "displayNameZh": "瑞士跳伞者",
    "displayNameEn": "Swiss Skydiver",
    "profile": {
      "baseAbility": 85,
      "peakAbility": 87,
      "note": "Swiss Skydiver major race wins recorded for currently available project race IDs."
    },
    "races": [
      {
        "raceId": "preakness-stakes",
        "year": 2020,
        "ability": 87,
        "jockeyId": "robby-albarado",
        "finish": 1
      },
      {
        "raceId": "alabama-stakes",
        "year": 2020,
        "ability": 85,
        "jockeyId": "tyler-gaffalione",
        "finish": 1
      }
    ]
  });
})();
