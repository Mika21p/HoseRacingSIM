(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "caravaggio",
    "name": "Caravaggio",
    "displayName": "卡拉瓦乔",
    "displayNameZh": "卡拉瓦乔",
    "displayNameEn": "Caravaggio",
    "profile": {
      "baseAbility": 82,
      "peakAbility": 84,
      "note": "2017年英联邦杯冠军，三岁短途天赋突出。"
    },
    "races": [
      { "raceId": "europe-g2-coventry-stakes", "year": 2016, "ability": 82, "jockeyId": "ryan-moore", "finish": 1 },
      {
        "raceId": "phoenix-stakes",
        "year": 2016,
        "ability": 83,
        "jockeyId": "seamie-heffernan",
        "finish": 1
      },
      {
        "raceId": "commonwealth-cup",
        "year": 2017,
        "ability": 84,
        "jockeyId": "ryan-moore",
        "finish": 1
      },
      {
        "raceId": "flying-five-stakes",
        "year": 2017,
        "ability": 84,
        "jockeyId": "ryan-moore",
        "finish": 1
      }
    ]
  });
})();
