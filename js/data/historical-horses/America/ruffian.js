(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "ruffian",
    "name": "Ruffian",
    "displayName": "暴徒",
    "displayNameZh": "暴徒",
    "displayNameEn": "Ruffian",
    "profile": {
      "baseAbility": 88,
      "peakAbility": 90,
      "note": "美国雌马传奇，1975年完成当时由Acorn、Mother Goose与CCA Oaks组成的雌马三冠。"
    },
    "races": [
      {
        "raceId": "spinaway-stakes",
        "year": 1974,
        "ability": 92,
        "jockeyId": "jacinto-vasquez",
        "finish": 1
      },
      {
        "raceId": "acorn-stakes",
        "year": 1975,
        "ability": 90,
        "jockeyId": "jacinto-vasquez",
        "finish": 1
      },
      {
        "raceId": "coaching-club-american-oaks",
        "year": 1975,
        "ability": 90,
        "jockeyId": "jacinto-vasquez",
        "finish": 1
      }
    ]
  });
})();
