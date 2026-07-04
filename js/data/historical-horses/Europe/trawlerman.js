(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "trawlerman",
    "name": "Trawlerman",
    "displayName": "拖网渔夫",
    "displayNameZh": "拖网渔夫",
    "displayNameEn": "Trawlerman",
    "profile": {
      "baseAbility": 81,
      "peakAbility": 83,
      "note": "Godolphin stayer with Ascot Gold Cup and Long Distance Cup wins."
    },
    "races": [
      {
        "raceId": "british-champions-long-distance-cup",
        "year": 2023,
        "ability": 82,
        "jockeyId": "frankie-dettori",
        "finish": 1
      },
      {
        "raceId": "ascot-gold-cup",
        "year": 2025,
        "ability": 83,
        "jockeyId": "william-buick",
        "finish": 1
      },
      {
        "raceId": "british-champions-long-distance-cup",
        "year": 2025,
        "ability": 83,
        "jockeyId": "william-buick",
        "finish": 1
      }
    ]
  });
})();
