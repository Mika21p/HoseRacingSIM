(function () {
  const ns = (window.Keiba = window.Keiba || {});

  const horses = [
    {
      id: "man-o-war",
      name: "Man o' War",
      displayName: "战争之人",
      profile: {
        baseAbility: 95,
        peakAbility: 97,
        note: "美国赛马史级传奇，1920年经典赛与Travers Stakes保持压倒性表现。"
      },
      races: [
        { raceId: "preakness-stakes", year: 1920, ability: 96, jockeyId: "clarence-kummer", finish: 1 },
        { raceId: "belmont-stakes", year: 1920, ability: 97, jockeyId: "clarence-kummer", finish: 1 },
        { raceId: "travers-stakes", year: 1920, ability: 97, jockeyId: "clarence-kummer", finish: 1 }
      ]
    },
    {
      id: "flightline",
      name: "Flightline",
      displayName: "航线",
      profile: {
        baseAbility: 94,
        peakAbility: 96,
        note: "现代美国泥地短生涯极限代表，六战全胜并以压倒性表现赢下育马者杯经典赛。"
      },
      races: [
        { raceId: "metropolitan-handicap", year: 2022, ability: 95, jockeyId: "flavien-prat", finish: 1 },
        { raceId: "breeders-cup-classic", year: 2022, ability: 96, jockeyId: "flavien-prat", finish: 1 }
      ]
    },
    {
      id: "native-dancer",
      name: "Native Dancer",
      displayName: "天才舞者",
      profile: {
        baseAbility: 93,
        peakAbility: 95,
        note: "灰色幽灵，美国经典赛与古马一哩线均有历史级影响力。"
      },
      races: [
        { raceId: "preakness-stakes", year: 1953, ability: 94, jockeyId: "eric-guerin", finish: 1 },
        { raceId: "belmont-stakes", year: 1953, ability: 95, jockeyId: "eric-guerin", finish: 1 },
        { raceId: "travers-stakes", year: 1953, ability: 94, jockeyId: "eric-guerin", finish: 1 },
        { raceId: "metropolitan-handicap", year: 1954, ability: 95, jockeyId: "eric-guerin", finish: 1 }
      ]
    },
    {
      id: "kelso",
      name: "Kelso",
      displayName: "凯尔索",
      profile: {
        baseAbility: 92,
        peakAbility: 94,
        note: "五届美国马王，长年让赛高负磅仍保持顶级竞争力。"
      },
      races: [
        { raceId: "metropolitan-handicap", year: 1961, ability: 94, jockeyId: "eddie-arcaro", finish: 1 }
      ]
    },
    {
      id: "buckpasser",
      name: "Buckpasser",
      displayName: "斜肩者",
      profile: {
        baseAbility: 91,
        peakAbility: 93,
        note: "六十年代美国全能名马，三岁与古马让赛路线均有代表作。"
      },
      races: [
        { raceId: "travers-stakes", year: 1966, ability: 92, jockeyId: "braulio-baeza", finish: 1 },
        { raceId: "metropolitan-handicap", year: 1967, ability: 93, jockeyId: "braulio-baeza", finish: 1 }
      ]
    },
    {
      id: "arrogate",
      name: "Arrogate",
      displayName: "霸道驹",
      profile: {
        baseAbility: 91,
        peakAbility: 93,
        note: "现代泥地爆发力代表，Travers、育马者杯经典赛、飞马世界杯与迪拜世界杯连线。"
      },
      races: [
        { raceId: "travers-stakes", year: 2016, ability: 93, jockeyId: "mike-smith", finish: 1 },
        { raceId: "breeders-cup-classic", year: 2016, ability: 93, jockeyId: "mike-smith", finish: 1 },
        { raceId: "pegasus-world-cup", year: 2017, ability: 93, jockeyId: "mike-smith", finish: 1 },
        { raceId: "dubai-world-cup", year: 2017, ability: 93, jockeyId: "mike-smith", finish: 1 }
      ]
    },
    {
      id: "forego",
      name: "Forego",
      displayName: "领先",
      profile: {
        baseAbility: 90,
        peakAbility: 92,
        note: "三届美国马王，重负磅让赛传奇，Met Mile连胜体现其速度与韧性。"
      },
      races: [
        { raceId: "metropolitan-handicap", year: 1976, ability: 91, jockeyId: "heliodoro-gustines", finish: 1 },
        { raceId: "metropolitan-handicap", year: 1977, ability: 92, jockeyId: "heliodoro-gustines", finish: 1 }
      ]
    },
    {
      id: "ruffian",
      name: "Ruffian",
      displayName: "暴徒",
      profile: {
        baseAbility: 88,
        peakAbility: 90,
        note: "美国雌马传奇，1975年完成当时由Acorn、Mother Goose与CCA Oaks组成的雌马三冠。"
      },
      races: [
        { raceId: "acorn-stakes", year: 1975, ability: 90, jockeyId: "jacinto-vasquez", finish: 1 },
        { raceId: "coaching-club-american-oaks", year: 1975, ability: 90, jockeyId: "jacinto-vasquez", finish: 1 }
      ]
    },
    {
      id: "gun-runner",
      name: "Gun Runner",
      displayName: "铤而走险",
      profile: {
        baseAbility: 87,
        peakAbility: 89,
        note: "2017年美国马王，古马泥地G1连胜后以飞马世界杯收官。"
      },
      races: [
        { raceId: "breeders-cup-classic", year: 2017, ability: 89, jockeyId: "florent-geroux", finish: 1 },
        { raceId: "pegasus-world-cup", year: 2018, ability: 89, jockeyId: "florent-geroux", finish: 1 }
      ]
    },
    {
      id: "wise-dan",
      name: "Wise Dan",
      displayName: "聪明丹",
      profile: {
        baseAbility: 87,
        peakAbility: 89,
        note: "美国草地一哩历史级代表，育马者杯一哩双胜。"
      },
      races: [
        { raceId: "keeneland-turf-mile", year: 2012, ability: 88, jockeyId: "john-velazquez", finish: 1 },
        { raceId: "breeders-cup-mile", year: 2012, ability: 89, jockeyId: "john-velazquez", finish: 1 },
        { raceId: "breeders-cup-mile", year: 2013, ability: 89, jockeyId: "jose-lezcano", finish: 1 },
        { raceId: "keeneland-turf-mile", year: 2014, ability: 88, jockeyId: "john-velazquez", finish: 1 }
      ]
    },
    {
      id: "round-table",
      name: "Round Table",
      displayName: "圆桌骑士",
      profile: {
        baseAbility: 87,
        peakAbility: 89,
        note: "美国草地王者兼泥地强者，跨表面能力和持久战绩突出。"
      },
      races: [
        { raceId: "blue-grass-stakes", year: 1957, ability: 88, jockeyId: "bill-shoemaker", finish: 1 },
        { raceId: "santa-anita-handicap", year: 1958, ability: 89, jockeyId: "bill-shoemaker", finish: 1 }
      ]
    },
    {
      id: "alydar",
      name: "Alydar",
      displayName: "阿利达",
      profile: {
        baseAbility: 87,
        peakAbility: 89,
        note: "Affirmed最大宿敌，经典赛惜败后仍在蓝草锦标与Travers Stakes展现一线实力。"
      },
      races: [
        { raceId: "blue-grass-stakes", year: 1978, ability: 88, jockeyId: "jorge-velasquez", finish: 1 },
        { raceId: "travers-stakes", year: 1978, ability: 89, jockeyId: "jorge-velasquez", finish: 1 }
      ]
    },
    {
      id: "high-chaparral",
      name: "High Chaparral",
      displayName: "灌木丛",
      profile: {
        baseAbility: 86,
        peakAbility: 88,
        note: "欧洲德比马兼育马者杯草地双冠，国际中长距离代表。"
      },
      races: [
        { raceId: "futurity-trophy", year: 2001, ability: 86, jockeyId: "kevin-darley", finish: 1 },
        { raceId: "epsom-derby", year: 2002, ability: 88, jockeyId: "johnny-murtagh", finish: 1 },
        { raceId: "irish-derby", year: 2002, ability: 88, jockeyId: "mick-kinane", finish: 1 },
        { raceId: "breeders-cup-turf", year: 2002, ability: 88, jockeyId: "mick-kinane", finish: 1 },
        { raceId: "irish-champion-stakes", year: 2003, ability: 88, jockeyId: "mick-kinane", finish: 1 },
        { raceId: "breeders-cup-turf", year: 2003, ability: 88, jockeyId: "mick-kinane", finish: 1 }
      ]
    },
    {
      id: "seabiscuit",
      name: "Seabiscuit",
      displayName: "海饼干",
      profile: {
        baseAbility: 85,
        peakAbility: 87,
        note: "美国大众文化知名度极高的励志名马，圣雅尼塔让赛终成代表作。"
      },
      races: [
        { raceId: "santa-anita-handicap", year: 1940, ability: 87, jockeyId: "red-pollard", finish: 1 }
      ]
    },
    {
      id: "beholder",
      name: "Beholder",
      displayName: "旁观者",
      profile: {
        baseAbility: 83,
        peakAbility: 85,
        note: "多届美国冠军雌马，三次育马者杯胜利覆盖两岁至古马期。"
      },
      races: [
        { raceId: "breeders-cup-juvenile-fillies", year: 2012, ability: 84, jockeyId: "garrett-gomez", finish: 1 },
        { raceId: "breeders-cup-distaff", year: 2013, ability: 85, jockeyId: "gary-stevens", finish: 1 },
        { raceId: "breeders-cup-distaff", year: 2016, ability: 85, jockeyId: "gary-stevens", finish: 1 }
      ]
    },
    {
      id: "bricks-and-mortar",
      name: "Bricks and Mortar",
      displayName: "坚如磐石",
      profile: {
        baseAbility: 83,
        peakAbility: 85,
        note: "2019年美国马王，草地G1不败年度收官于育马者杯草地大赛。"
      },
      races: [
        { raceId: "pegasus-world-cup-turf", year: 2019, ability: 84, jockeyId: "irad-ortiz-jr", finish: 1 },
        { raceId: "turf-classic-stakes", year: 2019, ability: 85, jockeyId: "irad-ortiz-jr", finish: 1 },
        { raceId: "manhattan-stakes", year: 2019, ability: 85, jockeyId: "irad-ortiz-jr", finish: 1 },
        { raceId: "arlington-million", year: 2019, ability: 85, jockeyId: "irad-ortiz-jr", finish: 1 },
        { raceId: "breeders-cup-turf", year: 2019, ability: 85, jockeyId: "irad-ortiz-jr", finish: 1 }
      ]
    },
    {
      id: "knicks-go",
      name: "Knicks Go",
      displayName: "力胜高",
      profile: {
        baseAbility: 82,
        peakAbility: 84,
        note: "前速压制型现代泥地强马，育马者杯泥地一哩后再胜经典赛。"
      },
      races: [
        { raceId: "breeders-cup-dirt-mile", year: 2020, ability: 83, jockeyId: "joel-rosario", finish: 1 },
        { raceId: "pegasus-world-cup", year: 2021, ability: 84, jockeyId: "joel-rosario", finish: 1 },
        { raceId: "breeders-cup-classic", year: 2021, ability: 84, jockeyId: "joel-rosario", finish: 1 }
      ]
    },
    {
      id: "azeri",
      name: "Azeri",
      displayName: "阿塞拜疆",
      profile: {
        baseAbility: 82,
        peakAbility: 84,
        note: "2002年美国马王雌马，苹果花让赛三连霸与育马者杯雌马大赛冠军。"
      },
      races: [
        { raceId: "apple-blossom-handicap", year: 2002, ability: 84, jockeyId: "mike-smith", finish: 1 },
        { raceId: "breeders-cup-distaff", year: 2002, ability: 84, jockeyId: "mike-smith", finish: 1 },
        { raceId: "apple-blossom-handicap", year: 2003, ability: 84, jockeyId: "mike-smith", finish: 1 },
        { raceId: "apple-blossom-handicap", year: 2004, ability: 84, jockeyId: "mike-smith", finish: 1 }
      ]
    },
    {
      id: "tepin",
      name: "Tepin",
      displayName: "提平",
      profile: {
        baseAbility: 81,
        peakAbility: 83,
        note: "北美草地一哩名雌，育马者杯一哩与皇家雅士谷远征胜利兼备。"
      },
      races: [
        { raceId: "just-a-game-stakes", year: 2015, ability: 82, jockeyId: "julien-leparoux", finish: 1 },
        { raceId: "breeders-cup-mile", year: 2015, ability: 83, jockeyId: "julien-leparoux", finish: 1 },
        { raceId: "queen-anne-stakes", year: 2016, ability: 83, jockeyId: "julien-leparoux", finish: 1 }
      ]
    },
    {
      id: "lady-eli",
      name: "Lady Eli",
      displayName: "埃利女士",
      profile: {
        baseAbility: 80,
        peakAbility: 82,
        note: "美国草地雌马代表，从两岁育马者杯到古马Diana Stakes均有G1胜鞍。"
      },
      races: [
        { raceId: "breeders-cup-juvenile-fillies-turf", year: 2014, ability: 82, jockeyId: "irad-ortiz-jr", finish: 1 },
        { raceId: "diana-stakes", year: 2017, ability: 82, jockeyId: "irad-ortiz-jr", finish: 1 }
      ]
    },
    {
      id: "sistercharlie",
      name: "Sistercharlie",
      displayName: "查理姐姐",
      profile: {
        baseAbility: 80,
        peakAbility: 82,
        note: "美国草地雌马冠军，Diana Stakes连霸并赢下育马者杯雌马草地大赛。"
      },
      races: [
        { raceId: "diana-stakes", year: 2018, ability: 82, jockeyId: "john-velazquez", finish: 1 },
        { raceId: "breeders-cup-filly-mare-turf", year: 2018, ability: 82, jockeyId: "john-velazquez", finish: 1 },
        { raceId: "diana-stakes", year: 2019, ability: 82, jockeyId: "john-velazquez", finish: 1 }
      ]
    },
    {
      id: "rebels-romance",
      name: "Rebel's Romance",
      displayName: "桀骜之恋",
      profile: {
        baseAbility: 80,
        peakAbility: 82,
        note: "Godolphin全球远征型草地马，育马者杯草地双胜并取下迪拜与香港G1。"
      },
      races: [
        { raceId: "grosser-preis-von-berlin", year: 2022, ability: 82, jockeyId: "james-doyle", finish: 1 },
        { raceId: "preis-von-europa", year: 2022, ability: 82, jockeyId: "william-buick", finish: 1 },
        { raceId: "breeders-cup-turf", year: 2022, ability: 82, jockeyId: "james-doyle", finish: 1 },
        { raceId: "dubai-sheema-classic", year: 2024, ability: 82, jockeyId: "william-buick", finish: 1 },
        { raceId: "champions-chater-cup", year: 2024, ability: 82, jockeyId: "william-buick", finish: 1 },
        { raceId: "preis-von-europa", year: 2024, ability: 82, jockeyId: "william-buick", finish: 1 },
        { raceId: "breeders-cup-turf", year: 2024, ability: 82, jockeyId: "william-buick", finish: 1 }
      ]
    },
    {
      id: "codys-wish",
      name: "Cody's Wish",
      displayName: "科迪之愿",
      profile: {
        baseAbility: 80,
        peakAbility: 82,
        note: "近年高人气泥地一哩代表，育马者杯泥地一哩双胜。"
      },
      races: [
        { raceId: "forego-stakes", year: 2022, ability: 81, jockeyId: "junior-alvarado", finish: 1 },
        { raceId: "breeders-cup-dirt-mile", year: 2022, ability: 82, jockeyId: "junior-alvarado", finish: 1 },
        { raceId: "metropolitan-handicap", year: 2023, ability: 82, jockeyId: "junior-alvarado", finish: 1 },
        { raceId: "breeders-cup-dirt-mile", year: 2023, ability: 82, jockeyId: "junior-alvarado", finish: 1 }
      ]
    },
    {
      id: "royal-delta",
      name: "Royal Delta",
      displayName: "皇家三角洲",
      profile: {
        baseAbility: 79,
        peakAbility: 81,
        note: "美国泥地雌马中距离代表，育马者杯雌马大赛双胜。"
      },
      races: [
        { raceId: "breeders-cup-distaff", year: 2011, ability: 81, jockeyId: "jose-lezcano", finish: 1 },
        { raceId: "breeders-cup-distaff", year: 2012, ability: 81, jockeyId: "mike-smith", finish: 1 }
      ]
    },
    {
      id: "rags-to-riches",
      name: "Rags to Riches",
      displayName: "白手起家",
      profile: {
        baseAbility: 79,
        peakAbility: 81,
        note: "肯塔基橡树冠军，随后成为近代罕见赢下Belmont Stakes的雌马。"
      },
      races: [
        { raceId: "kentucky-oaks", year: 2007, ability: 80, jockeyId: "garrett-gomez", finish: 1 },
        { raceId: "belmont-stakes", year: 2007, ability: 81, jockeyId: "john-velazquez", finish: 1 }
      ]
    },
    {
      id: "monomoy-girl",
      name: "Monomoy Girl",
      displayName: "莫诺莫伊女孩",
      profile: {
        baseAbility: 79,
        peakAbility: 81,
        note: "现代美国泥地雌马代表，三岁与复出后均能赢下育马者杯雌马大赛。"
      },
      races: [
        { raceId: "kentucky-oaks", year: 2018, ability: 80, jockeyId: "florent-geroux", finish: 1 },
        { raceId: "breeders-cup-distaff", year: 2018, ability: 81, jockeyId: "florent-geroux", finish: 1 },
        { raceId: "breeders-cup-distaff", year: 2020, ability: 81, jockeyId: "florent-geroux", finish: 1 }
      ]
    },
    {
      id: "essential-quality",
      name: "Essential Quality",
      displayName: "核心素质",
      profile: {
        baseAbility: 78,
        peakAbility: 80,
        note: "两岁冠军与三岁经典战线核心，Belmont Stakes和Travers Stakes代表作明确。"
      },
      races: [
        { raceId: "breeders-cup-juvenile", year: 2020, ability: 80, jockeyId: "luis-saez", finish: 1 },
        { raceId: "blue-grass-stakes", year: 2021, ability: 79, jockeyId: "luis-saez", finish: 1 },
        { raceId: "belmont-stakes", year: 2021, ability: 80, jockeyId: "luis-saez", finish: 1 },
        { raceId: "travers-stakes", year: 2021, ability: 80, jockeyId: "luis-saez", finish: 1 }
      ]
    },
    {
      id: "elite-power",
      name: "Elite Power",
      displayName: "精英力量",
      profile: {
        baseAbility: 78,
        peakAbility: 80,
        note: "近年美国短途冠军，育马者杯短途双胜并赢下Forego Stakes。"
      },
      races: [
        { raceId: "breeders-cup-sprint", year: 2022, ability: 80, jockeyId: "irad-ortiz-jr", finish: 1 },
        { raceId: "forego-stakes", year: 2023, ability: 80, jockeyId: "irad-ortiz-jr", finish: 1 },
        { raceId: "breeders-cup-sprint", year: 2023, ability: 80, jockeyId: "irad-ortiz-jr", finish: 1 }
      ]
    },
    {
      id: "winning-colors",
      name: "Winning Colors",
      displayName: "胜利色彩",
      profile: {
        baseAbility: 78,
        peakAbility: 80,
        note: "少数赢下肯塔基德比的雌马之一，三岁春峰值鲜明。"
      },
      races: [
        { raceId: "kentucky-derby", year: 1988, ability: 80, jockeyId: "gary-stevens", finish: 1 }
      ]
    },
    {
      id: "golden-pal",
      name: "Golden Pal",
      displayName: "黄金伙伴",
      profile: {
        baseAbility: 76,
        peakAbility: 78,
        note: "美国草地短途专门马，育马者杯两岁草地短途与草地短途连续夺冠。"
      },
      races: [
        { raceId: "breeders-cup-juvenile-turf-sprint", year: 2020, ability: 78, jockeyId: "irad-ortiz-jr", finish: 1 },
        { raceId: "breeders-cup-turf-sprint", year: 2021, ability: 78, jockeyId: "irad-ortiz-jr", finish: 1 }
      ]
    }
  ];

  horses.forEach((horse) => {
    ns.HistoricalHorseRegistry.register(horse);
  });
})();
