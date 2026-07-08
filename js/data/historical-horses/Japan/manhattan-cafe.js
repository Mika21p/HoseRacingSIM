(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "manhattan-cafe",
    "name": "マンハッタンカフェ",
    "displayName": "曼城茶座",
    "displayNameZh": "曼城茶座",
    "displayNameEn": "Manhattan Cafe",
    "profile": {
      "baseAbility": 81,
      "peakAbility": 83,
      "note": "日本长距离名马，菊花赏、有马纪念与春季天皇赏胜马。"
    },
    "races": [
      {
        "raceId": "kikka-sho",
        "year": 2001,
        "ability": 82,
        "jockeyId": "masayoshi-ebina",
        "finish": 1
      },
      {
        "raceId": "arima-kinen",
        "year": 2001,
        "ability": 83,
        "jockeyId": "masayoshi-ebina",
        "finish": 1
      },
      {
        "raceId": "tenno-sho-haru",
        "year": 2002,
        "ability": 83,
        "jockeyId": "masayoshi-ebina",
        "finish": 1
      }
    ]
  });
})();
