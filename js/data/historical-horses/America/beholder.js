(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "beholder",
    "name": "Beholder",
    "displayName": "旁观者",
    "displayNameZh": "旁观者",
    "displayNameEn": "Beholder",
    "profile": {
      "baseAbility": 83,
      "peakAbility": 85,
      "note": "多届美国冠军雌马，三次育马者杯胜利覆盖两岁至古马期。"
    },
    "races": [
      {
        "raceId": "breeders-cup-juvenile-fillies",
        "year": 2012,
        "ability": 84,
        "jockeyId": "garrett-gomez",
        "finish": 1
      },
      {
        "raceId": "breeders-cup-distaff",
        "year": 2013,
        "ability": 85,
        "jockeyId": "gary-stevens",
        "finish": 1
      },
      {
        "raceId": "pacific-classic",
        "year": 2015,
        "ability": 85,
        "jockeyId": "gary-stevens",
        "finish": 1
      },
      {
        "raceId": "breeders-cup-distaff",
        "year": 2016,
        "ability": 85,
        "jockeyId": "gary-stevens",
        "finish": 1
      }
    ]
  });
})();
