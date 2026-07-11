(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "canford-cliffs",
    "name": "Canford Cliffs",
    "displayName": "坎福德悬崖",
    "displayNameZh": "坎福德悬崖",
    "displayNameEn": "Canford Cliffs",
    "profile": {
      "baseAbility": 85,
      "peakAbility": 87,
      "note": "欧洲一哩G1多胜马，三四岁持续高水平。"
    },
    "races": [
      { "raceId": "europe-g2-coventry-stakes", "year": 2009, "ability": 85, "jockeyId": "richard-hughes", "finish": 1 },
      { "raceId": "irish-two-thousand-guineas", "year": 2010, "ability": 87, "jockeyId": "richard-hughes", "finish": 1 },
      {
        "raceId": "st-jamess-palace-stakes",
        "year": 2010,
        "ability": 85,
        "jockeyId": "richard-hughes",
        "finish": 1
      },
      {
        "raceId": "sussex-stakes",
        "year": 2010,
        "ability": 86,
        "jockeyId": "richard-hughes",
        "finish": 1
      },
      {
        "raceId": "lockinge-stakes",
        "year": 2011,
        "ability": 87,
        "jockeyId": "richard-hughes",
        "finish": 1
      },
      {
        "raceId": "queen-anne-stakes",
        "year": 2011,
        "ability": 87,
        "jockeyId": "richard-hughes",
        "finish": 1
      }
    ]
  });
})();
