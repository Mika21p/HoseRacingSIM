(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "rags-to-riches",
    "name": "Rags to Riches",
    "displayName": "白手起家",
    "displayNameZh": "白手起家",
    "displayNameEn": "Rags to Riches",
    "profile": {
      "baseAbility": 79,
      "peakAbility": 81,
      "note": "肯塔基橡树冠军，随后成为近代罕见赢下Belmont Stakes的雌马。"
    },
    "races": [
      {
        "raceId": "kentucky-oaks",
        "year": 2007,
        "ability": 80,
        "jockeyId": "garrett-gomez",
        "finish": 1
      },
      {
        "raceId": "belmont-stakes",
        "year": 2007,
        "ability": 81,
        "jockeyId": "john-velazquez",
        "finish": 1
      }
    ]
  });
})();
