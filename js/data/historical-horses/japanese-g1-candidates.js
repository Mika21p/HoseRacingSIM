(function () {
  const ns = (window.Keiba = window.Keiba || {});

  const horses = [
    {
      id: "vermilion",
      name: "ヴァーミリアン",
      displayName: "Vermilion",
      profile: {
        baseAbility: 80,
        peakAbility: 82,
        note: "日本泥地G1/JpnI多胜，2007年前后中央与地方大赛连胜。"
      },
      races: [
        { raceId: "kawasaki-kinen", year: 2007, ability: 80, jockeyId: "take-yutaka", finish: 1 },
        { raceId: "jbc-classic", year: 2007, ability: 81, jockeyId: "take-yutaka", finish: 1 },
        { raceId: "champions-cup", year: 2007, ability: 82, jockeyId: "take-yutaka", finish: 1 },
        { raceId: "tokyo-daishoten", year: 2007, ability: 82, jockeyId: "take-yutaka", finish: 1 },
        { raceId: "february-stakes", year: 2008, ability: 82, jockeyId: "take-yutaka", finish: 1 },
        { raceId: "kawasaki-kinen", year: 2010, ability: 80, jockeyId: "take-yutaka", finish: 1 }
      ]
    },
    {
      id: "kane-hekili",
      name: "カネヒキリ",
      displayName: "Kane Hekili",
      profile: {
        baseAbility: 80,
        peakAbility: 82,
        note: "屈腱炎复归后仍能重夺泥地大赛，日本泥地韧性代表。"
      },
      races: [
        { raceId: "jbc-classic", year: 2005, ability: 81, jockeyId: "take-yutaka", finish: 1 },
        { raceId: "champions-cup", year: 2005, ability: 82, jockeyId: "take-yutaka", finish: 1 },
        { raceId: "february-stakes", year: 2006, ability: 82, jockeyId: "take-yutaka", finish: 1 },
        { raceId: "champions-cup", year: 2008, ability: 82, jockeyId: "christophe-lemaire", finish: 1 },
        { raceId: "tokyo-daishoten", year: 2008, ability: 82, jockeyId: "christophe-lemaire", finish: 1 },
        { raceId: "kawasaki-kinen", year: 2009, ability: 81, jockeyId: "christophe-lemaire", finish: 1 }
      ]
    },
    {
      id: "curren-chan",
      name: "カレンチャン",
      displayName: "Curren Chan",
      profile: {
        baseAbility: 77,
        peakAbility: 79,
        note: "短途双G1冠军，速度与稳定性兼备的日本雌马短途代表。"
      },
      races: [
        { raceId: "hakodate-sprint-stakes", year: 2011, ability: 77, jockeyId: "kenichi-ikezoe", finish: 1 },
        { raceId: "keeneland-cup", year: 2011, ability: 78, jockeyId: "kenichi-ikezoe", finish: 1 },
        { raceId: "sprinters-stakes", year: 2011, ability: 79, jockeyId: "kenichi-ikezoe", finish: 1 },
        { raceId: "takamatsunomiya-kinen", year: 2012, ability: 79, jockeyId: "kenichi-ikezoe", finish: 1 }
      ]
    },
    {
      id: "kinshasa-no-kiseki",
      name: "キンシャサノキセキ",
      displayName: "Kinshasa no Kiseki",
      profile: {
        baseAbility: 78,
        peakAbility: 80,
        note: "高松宫纪念连霸，短途至一四路线长年保持一线水准。"
      },
      races: [
        { raceId: "swan-stakes", year: 2009, ability: 78, jockeyId: "christophe-soumillon", finish: 1 },
        { raceId: "hanshin-cup", year: 2009, ability: 78, jockeyId: "mirco-demuro", finish: 1 },
        { raceId: "ocean-stakes", year: 2010, ability: 78, jockeyId: "hirofumi-shii", finish: 1 },
        { raceId: "takamatsunomiya-kinen", year: 2010, ability: 80, jockeyId: "hirofumi-shii", finish: 1 },
        { raceId: "hanshin-cup", year: 2010, ability: 79, jockeyId: "christophe-soumillon", finish: 1 },
        { raceId: "takamatsunomiya-kinen", year: 2011, ability: 80, jockeyId: "umberto-rispoli", finish: 1 }
      ]
    },
    {
      id: "flower-park",
      name: "フラワーパーク",
      displayName: "Flower Park",
      profile: {
        baseAbility: 77,
        peakAbility: 79,
        note: "1996年春秋短途G1连胜，早期日本短途雌马名将。"
      },
      races: [
        { raceId: "silk-road-stakes", year: 1996, ability: 77, jockeyId: "tabara-seiki", finish: 1 },
        { raceId: "takamatsunomiya-kinen", year: 1996, ability: 79, jockeyId: "tabara-seiki", finish: 1 },
        { raceId: "sprinters-stakes", year: 1996, ability: 79, jockeyId: "tabara-seiki", finish: 1 }
      ]
    },
    {
      id: "king-halo",
      name: "キングヘイロー",
      displayName: "King Halo",
      profile: {
        baseAbility: 76,
        peakAbility: 78,
        note: "良血万能型，最终在高松宫纪念完成G1制霸。"
      },
      races: [
        { raceId: "tokyo-sports-hai", year: 1997, ability: 76, jockeyId: "yuichi-fukunaga", finish: 1 },
        { raceId: "takamatsunomiya-kinen", year: 2000, ability: 78, jockeyId: "yoshitomi-shibata", finish: 1 }
      ]
    },
    {
      id: "suave-richard",
      name: "スワーヴリチャード",
      displayName: "Suave Richard",
      profile: {
        baseAbility: 81,
        peakAbility: 83,
        note: "大阪杯与日本杯冠军，中距离至二四王道路线上限高。"
      },
      races: [
        { raceId: "copa-republica-argentina", year: 2017, ability: 81, jockeyId: "mirco-demuro", finish: 1 },
        { raceId: "kinko-sho", year: 2018, ability: 82, jockeyId: "mirco-demuro", finish: 1 },
        { raceId: "osaka-hai", year: 2018, ability: 83, jockeyId: "mirco-demuro", finish: 1 },
        { raceId: "japan-cup", year: 2019, ability: 83, jockeyId: "oisin-murphy", finish: 1 }
      ]
    },
    {
      id: "lucky-lilac",
      name: "ラッキーライラック",
      displayName: "Lucky Lilac",
      profile: {
        baseAbility: 78,
        peakAbility: 80,
        note: "阪神JF与女王杯双胜，古马期大阪杯夺冠完成复権。"
      },
      races: [
        { raceId: "artemis-stakes", year: 2017, ability: 78, jockeyId: "shu-ishibashi", finish: 1 },
        { raceId: "hanshin-juvenile-fillies", year: 2017, ability: 80, jockeyId: "shu-ishibashi", finish: 1 },
        { raceId: "queen-elizabeth-ii-cup", year: 2019, ability: 80, jockeyId: "christophe-soumillon", finish: 1 },
        { raceId: "osaka-hai", year: 2020, ability: 80, jockeyId: "mirco-demuro", finish: 1 },
        { raceId: "queen-elizabeth-ii-cup", year: 2020, ability: 80, jockeyId: "christophe-lemaire", finish: 1 }
      ]
    },
    {
      id: "lei-papale",
      name: "レイパパレ",
      displayName: "Lei Papale",
      profile: {
        baseAbility: 77,
        peakAbility: 79,
        note: "无败状态赢下重马场大阪杯，瞬间爆发力突出。"
      },
      races: [
        { raceId: "challenge-cup", year: 2020, ability: 77, jockeyId: "yuga-kawada", finish: 1 },
        { raceId: "osaka-hai", year: 2021, ability: 79, jockeyId: "yuga-kawada", finish: 1 }
      ]
    },
    {
      id: "jack-dor",
      name: "ジャックドール",
      displayName: "Jack d'Or",
      profile: {
        baseAbility: 79,
        peakAbility: 81,
        note: "高速逃先型中距离马，金鯱赏与大阪杯代表作鲜明。"
      },
      races: [
        { raceId: "kinko-sho", year: 2022, ability: 80, jockeyId: "yusuke-fujioka", finish: 1 },
        { raceId: "sapporo-kinen", year: 2022, ability: 80, jockeyId: "yusuke-fujioka", finish: 1 },
        { raceId: "osaka-hai", year: 2023, ability: 81, jockeyId: "take-yutaka", finish: 1 }
      ]
    },
    {
      id: "daring-tact",
      name: "デアリングタクト",
      displayName: "Daring Tact",
      profile: {
        baseAbility: 80,
        peakAbility: 82,
        note: "无败牝马三冠，经典年上限明确。"
      },
      races: [
        { raceId: "oka-sho", year: 2020, ability: 81, jockeyId: "kohei-matsuyama", finish: 1 },
        { raceId: "yushun-himba", year: 2020, ability: 82, jockeyId: "kohei-matsuyama", finish: 1 },
        { raceId: "shuka-sho", year: 2020, ability: 82, jockeyId: "kohei-matsuyama", finish: 1 }
      ]
    },
    {
      id: "king-kamehameha",
      name: "キングカメハメハ",
      displayName: "King Kamehameha",
      profile: {
        baseAbility: 83,
        peakAbility: 85,
        note: "NHK一哩杯与日本德比变则二冠，短生涯峰值极高。"
      },
      races: [
        { raceId: "mainichi-hai", year: 2004, ability: 82, jockeyId: "katsumi-ando", finish: 1 },
        { raceId: "nhk-mile-cup", year: 2004, ability: 84, jockeyId: "katsumi-ando", finish: 1 },
        { raceId: "tokyo-yushun", year: 2004, ability: 85, jockeyId: "katsumi-ando", finish: 1 },
        { raceId: "kobe-shimbun-hai", year: 2004, ability: 84, jockeyId: "katsumi-ando", finish: 1 }
      ]
    },
    {
      id: "deep-sky",
      name: "ディープスカイ",
      displayName: "Deep Sky",
      profile: {
        baseAbility: 82,
        peakAbility: 84,
        note: "NHK一哩杯与日本德比二冠，2008年三岁战线核心。"
      },
      races: [
        { raceId: "mainichi-hai", year: 2008, ability: 82, jockeyId: "hirofumi-shii", finish: 1 },
        { raceId: "nhk-mile-cup", year: 2008, ability: 84, jockeyId: "hirofumi-shii", finish: 1 },
        { raceId: "tokyo-yushun", year: 2008, ability: 84, jockeyId: "hirofumi-shii", finish: 1 },
        { raceId: "kobe-shimbun-hai", year: 2008, ability: 83, jockeyId: "hirofumi-shii", finish: 1 },
        { raceId: "osaka-hai", year: 2009, ability: 83, jockeyId: "hirofumi-shii", finish: 1 }
      ]
    },
    {
      id: "admire-mars",
      name: "アドマイヤマーズ",
      displayName: "Admire Mars",
      profile: {
        baseAbility: 80,
        peakAbility: 82,
        note: "两岁G1、NHK一哩杯与香港一哩冠军，一哩上限稳定。"
      },
      races: [
        { raceId: "daily-hai-nisai-stakes", year: 2018, ability: 80, jockeyId: "mirco-demuro", finish: 1 },
        { raceId: "asahi-hai-fs", year: 2018, ability: 82, jockeyId: "mirco-demuro", finish: 1 },
        { raceId: "nhk-mile-cup", year: 2019, ability: 82, jockeyId: "mirco-demuro", finish: 1 },
        { raceId: "hong-kong-mile", year: 2019, ability: 82, jockeyId: "christophe-soumillon", finish: 1 }
      ]
    },
    {
      id: "straight-girl",
      name: "ストレイトガール",
      displayName: "Straight Girl",
      profile: {
        baseAbility: 79,
        peakAbility: 81,
        note: "维多利亚一哩赛连霸并胜短途马锦标，雌马短哩双线名将。"
      },
      races: [
        { raceId: "victoria-mile", year: 2015, ability: 80, jockeyId: "keita-tosaki", finish: 1 },
        { raceId: "sprinters-stakes", year: 2015, ability: 81, jockeyId: "keita-tosaki", finish: 1 },
        { raceId: "victoria-mile", year: 2016, ability: 81, jockeyId: "keita-tosaki", finish: 1 }
      ]
    },
    {
      id: "cesario",
      name: "シーザリオ",
      displayName: "Cesario",
      profile: {
        baseAbility: 80,
        peakAbility: 82,
        note: "优骏牝马冠军，并在海外延续顶级表现的名繁殖牝马。"
      },
      races: [
        { raceId: "flower-cup", year: 2005, ability: 80, jockeyId: "yuichi-fukunaga", finish: 1 },
        { raceId: "yushun-himba", year: 2005, ability: 82, jockeyId: "yuichi-fukunaga", finish: 1 }
      ]
    },
    {
      id: "liberty-island",
      name: "リバティアイランド",
      displayName: "Liberty Island",
      profile: {
        baseAbility: 80,
        peakAbility: 82,
        note: "阪神JF后完成牝马三冠，三岁春秋统治力强。"
      },
      races: [
        { raceId: "artemis-stakes", year: 2022, ability: 80, jockeyId: "yuga-kawada", finish: 1 },
        { raceId: "hanshin-juvenile-fillies", year: 2022, ability: 81, jockeyId: "yuga-kawada", finish: 1 },
        { raceId: "oka-sho", year: 2023, ability: 82, jockeyId: "yuga-kawada", finish: 1 },
        { raceId: "yushun-himba", year: 2023, ability: 82, jockeyId: "yuga-kawada", finish: 1 },
        { raceId: "shuka-sho", year: 2023, ability: 82, jockeyId: "yuga-kawada", finish: 1 }
      ]
    },
    {
      id: "maurice",
      name: "モーリス",
      displayName: "Maurice",
      profile: {
        baseAbility: 87,
        peakAbility: 89,
        note: "日本与香港G1六胜，英里至二千米均有历史级表现。"
      },
      races: [
        { raceId: "yasuda-kinen", year: 2015, ability: 88, jockeyId: "yuga-kawada", finish: 1 },
        { raceId: "mile-championship", year: 2015, ability: 89, jockeyId: "ryan-moore", finish: 1 },
        { raceId: "hong-kong-mile", year: 2015, ability: 89, jockeyId: "ryan-moore", finish: 1 },
        { raceId: "champions-mile", year: 2016, ability: 88, jockeyId: "joao-moreira", finish: 1 },
        { raceId: "tenno-sho-aki", year: 2016, ability: 89, jockeyId: "ryan-moore", finish: 1 },
        { raceId: "hong-kong-cup", year: 2016, ability: 89, jockeyId: "ryan-moore", finish: 1 }
      ]
    },
    {
      id: "chrono-genesis",
      name: "クロノジェネシス",
      displayName: "Chrono Genesis",
      profile: {
        baseAbility: 83,
        peakAbility: 85,
        note: "宝塚纪念连霸与有马纪念冠军，重马场和王道距离适性突出。"
      },
      races: [
        { raceId: "shuka-sho", year: 2019, ability: 84, jockeyId: "yuichi-kitamura", finish: 1 },
        { raceId: "kyoto-kinen", year: 2020, ability: 83, jockeyId: "yuichi-kitamura", finish: 1 },
        { raceId: "takarazuka-kinen", year: 2020, ability: 85, jockeyId: "yuichi-kitamura", finish: 1 },
        { raceId: "arima-kinen", year: 2020, ability: 85, jockeyId: "yuichi-kitamura", finish: 1 },
        { raceId: "takarazuka-kinen", year: 2021, ability: 85, jockeyId: "christophe-lemaire", finish: 1 }
      ]
    },
    {
      id: "sakura-bakushin-o",
      name: "サクラバクシンオー",
      displayName: "Sakura Bakushin O",
      profile: {
        baseAbility: 82,
        peakAbility: 84,
        note: "日本短途路线早期历史级标尺，短途马锦标连霸。"
      },
      races: [
        { raceId: "sprinters-stakes", year: 1993, ability: 83, jockeyId: "futoshi-kojima", finish: 1 },
        { raceId: "swan-stakes", year: 1994, ability: 82, jockeyId: "futoshi-kojima", finish: 1 },
        { raceId: "sprinters-stakes", year: 1994, ability: 84, jockeyId: "futoshi-kojima", finish: 1 }
      ]
    },
    {
      id: "snow-fairy",
      name: "Snow Fairy",
      displayName: "Snow Fairy",
      profile: {
        baseAbility: 84,
        peakAbility: 86,
        note: "英日G1多胜雌马，女王伊丽莎白二世杯连霸极具代表性。"
      },
      races: [
        { raceId: "epsom-oaks", year: 2010, ability: 85, jockeyId: "ryan-moore", finish: 1 },
        { raceId: "irish-oaks", year: 2010, ability: 85, jockeyId: "ryan-moore", finish: 1 },
        { raceId: "queen-elizabeth-ii-cup", year: 2010, ability: 86, jockeyId: "ryan-moore", finish: 1 },
        { raceId: "queen-elizabeth-ii-cup", year: 2011, ability: 86, jockeyId: "ryan-moore", finish: 1 }
      ]
    },
    {
      id: "meisho-mambo",
      name: "メイショウマンボ",
      displayName: "Meisho Mambo",
      profile: {
        baseAbility: 77,
        peakAbility: 79,
        note: "三岁牝马二冠并胜女王杯，2013年牝马战线代表。"
      },
      races: [
        { raceId: "yushun-himba", year: 2013, ability: 79, jockeyId: "koshiro-take", finish: 1 },
        { raceId: "shuka-sho", year: 2013, ability: 79, jockeyId: "koshiro-take", finish: 1 },
        { raceId: "queen-elizabeth-ii-cup", year: 2013, ability: 79, jockeyId: "koshiro-take", finish: 1 }
      ]
    },
    {
      id: "admire-groove",
      name: "アドマイヤグルーヴ",
      displayName: "Admire Groove",
      profile: {
        baseAbility: 77,
        peakAbility: 79,
        note: "女王伊丽莎白二世杯连霸，母系名门的古马牝马代表。"
      },
      races: [
        { raceId: "rose-stakes", year: 2003, ability: 77, jockeyId: "take-yutaka", finish: 1 },
        { raceId: "queen-elizabeth-ii-cup", year: 2003, ability: 79, jockeyId: "take-yutaka", finish: 1 },
        { raceId: "queen-elizabeth-ii-cup", year: 2004, ability: 79, jockeyId: "take-yutaka", finish: 1 }
      ]
    },
    {
      id: "durandal",
      name: "デュランダル",
      displayName: "Durandal",
      profile: {
        baseAbility: 80,
        peakAbility: 82,
        note: "短途马锦标与一哩冠军赛连胜，末脚型短哩冠军。"
      },
      races: [
        { raceId: "sprinters-stakes", year: 2003, ability: 82, jockeyId: "kenichi-ikezoe", finish: 1 },
        { raceId: "mile-championship", year: 2003, ability: 82, jockeyId: "kenichi-ikezoe", finish: 1 },
        { raceId: "mile-championship", year: 2004, ability: 82, jockeyId: "kenichi-ikezoe", finish: 1 }
      ]
    },
    {
      id: "transcend",
      name: "トランセンド",
      displayName: "Transcend",
      profile: {
        baseAbility: 78,
        peakAbility: 80,
        note: "日本杯泥地连霸与二月锦标冠军，前行压制型泥地强者。"
      },
      races: [
        { raceId: "miyako-stakes", year: 2010, ability: 78, jockeyId: "shinji-fujita", finish: 1 },
        { raceId: "champions-cup", year: 2010, ability: 80, jockeyId: "shinji-fujita", finish: 1 },
        { raceId: "february-stakes", year: 2011, ability: 80, jockeyId: "shinji-fujita", finish: 1 },
        { raceId: "mile-championship-nambu-hai", year: 2011, ability: 80, jockeyId: "shinji-fujita", finish: 1 },
        { raceId: "champions-cup", year: 2011, ability: 80, jockeyId: "shinji-fujita", finish: 1 }
      ]
    },
    {
      id: "apapane",
      name: "アパパネ",
      displayName: "Apapane",
      profile: {
        baseAbility: 79,
        peakAbility: 81,
        note: "阪神JF后完成牝马三冠，古马期再胜维多利亚一哩。"
      },
      races: [
        { raceId: "hanshin-juvenile-fillies", year: 2009, ability: 80, jockeyId: "masayoshi-ebina", finish: 1 },
        { raceId: "oka-sho", year: 2010, ability: 81, jockeyId: "masayoshi-ebina", finish: 1 },
        { raceId: "yushun-himba", year: 2010, ability: 81, jockeyId: "masayoshi-ebina", finish: 1 },
        { raceId: "shuka-sho", year: 2010, ability: 81, jockeyId: "masayoshi-ebina", finish: 1 },
        { raceId: "victoria-mile", year: 2011, ability: 81, jockeyId: "masayoshi-ebina", finish: 1 }
      ]
    },
    {
      id: "fuji-kiseki",
      name: "フジキセキ",
      displayName: "Fuji Kiseki",
      profile: {
        baseAbility: 78,
        peakAbility: 80,
        note: "无败两岁王者，短生涯但素质评价很高。"
      },
      races: [
        { raceId: "asahi-hai-fs", year: 1994, ability: 80, jockeyId: "koichi-tsunoda", finish: 1 },
        { raceId: "yayoi-sho", year: 1995, ability: 79, jockeyId: "koichi-tsunoda", finish: 1 }
      ]
    },
    {
      id: "dream-journey",
      name: "ドリームジャーニー",
      displayName: "Dream Journey",
      profile: {
        baseAbility: 80,
        peakAbility: 82,
        note: "两岁G1后古马期赢下宝塚纪念与有马纪念，小体型末脚型名马。"
      },
      races: [
        { raceId: "asahi-hai-fs", year: 2006, ability: 80, jockeyId: "kenichi-ikezoe", finish: 1 },
        { raceId: "takarazuka-kinen", year: 2009, ability: 82, jockeyId: "kenichi-ikezoe", finish: 1 },
        { raceId: "arima-kinen", year: 2009, ability: 82, jockeyId: "kenichi-ikezoe", finish: 1 }
      ]
    },
    {
      id: "hearts-cry",
      name: "ハーツクライ",
      displayName: "Heart's Cry",
      profile: {
        baseAbility: 86,
        peakAbility: 88,
        note: "击败大震撼赢有马纪念，并远征迪拜司马经典赛夺冠。"
      },
      races: [
        { raceId: "arima-kinen", year: 2005, ability: 88, jockeyId: "christophe-lemaire", finish: 1 },
        { raceId: "dubai-sheema-classic", year: 2006, ability: 88, jockeyId: "christophe-lemaire", finish: 1 }
      ]
    },
    {
      id: "saturnalia",
      name: "サートゥルナーリア",
      displayName: "Saturnalia",
      profile: {
        baseAbility: 79,
        peakAbility: 81,
        note: "希望锦标与皋月赏冠军，三岁春峰值明确。"
      },
      races: [
        { raceId: "hopeful-stakes", year: 2018, ability: 80, jockeyId: "mirco-demuro", finish: 1 },
        { raceId: "satsuki-sho", year: 2019, ability: 81, jockeyId: "christophe-lemaire", finish: 1 },
        { raceId: "kobe-shimbun-hai", year: 2019, ability: 80, jockeyId: "christophe-lemaire", finish: 1 }
      ]
    },
    {
      id: "danon-the-kid",
      name: "ダノンザキッド",
      displayName: "Danon the Kid",
      profile: {
        baseAbility: 77,
        peakAbility: 79,
        note: "两岁中距离冠军，东京体育杯与希望锦标连续夺冠。"
      },
      races: [
        { raceId: "tokyo-sports-hai", year: 2020, ability: 78, jockeyId: "yuga-kawada", finish: 1 },
        { raceId: "hopeful-stakes", year: 2020, ability: 79, jockeyId: "yuga-kawada", finish: 1 }
      ]
    },
    {
      id: "dura-erede",
      name: "ドゥラエレーデ",
      displayName: "Dura Erede",
      profile: {
        baseAbility: 78,
        peakAbility: 80,
        note: "2022年希望锦标爆冷冠军，泥草两用但峰值集中在两岁G1。"
      },
      races: [
        { raceId: "hopeful-stakes", year: 2022, ability: 80, jockeyId: "bauyrzhan-murzabayev", finish: 1 }
      ]
    },
    {
      id: "regaleira",
      name: "レガレイラ",
      displayName: "Regaleira",
      profile: {
        baseAbility: 78,
        peakAbility: 80,
        note: "希望锦标冠军，随后赢有马纪念与女王杯，牝马中长距离代表。"
      },
      races: [
        { raceId: "hopeful-stakes", year: 2023, ability: 80, jockeyId: "christophe-lemaire", finish: 1 },
        { raceId: "arima-kinen", year: 2024, ability: 80, jockeyId: "christophe-lemaire", finish: 1 },
        { raceId: "sankei-sho-all-comers", year: 2025, ability: 79, jockeyId: "christophe-lemaire", finish: 1 },
        { raceId: "queen-elizabeth-ii-cup", year: 2025, ability: 80, jockeyId: "christophe-lemaire", finish: 1 }
      ]
    },
    {
      id: "omega-perfume",
      name: "オメガパフューム",
      displayName: "Omega Perfume",
      profile: {
        baseAbility: 80,
        peakAbility: 82,
        note: "东京大赏典四连霸，地方二千米泥地专门性极强。"
      },
      races: [
        { raceId: "sirius-stakes", year: 2018, ability: 80, jockeyId: "mirco-demuro", finish: 1 },
        { raceId: "tokyo-daishoten", year: 2018, ability: 82, jockeyId: "mirco-demuro", finish: 1 },
        { raceId: "heian-stakes", year: 2019, ability: 80, jockeyId: "mirco-demuro", finish: 1 },
        { raceId: "tokyo-daishoten", year: 2019, ability: 82, jockeyId: "mirco-demuro", finish: 1 },
        { raceId: "tokyo-daishoten", year: 2020, ability: 82, jockeyId: "mirco-demuro", finish: 1 },
        { raceId: "tokyo-daishoten", year: 2021, ability: 82, jockeyId: "mirco-demuro", finish: 1 }
      ]
    },
    {
      id: "ushba-tesoro",
      name: "ウシュバテソーロ",
      displayName: "Ushba Tesoro",
      profile: {
        baseAbility: 82,
        peakAbility: 84,
        note: "东京大赏典连胜并赢迪拜世界杯，日本泥地国际级代表。"
      },
      races: [
        { raceId: "tokyo-daishoten", year: 2022, ability: 83, jockeyId: "kazuo-yokoyama", finish: 1 },
        { raceId: "kawasaki-kinen", year: 2023, ability: 83, jockeyId: "kazuo-yokoyama", finish: 1 },
        { raceId: "dubai-world-cup", year: 2023, ability: 84, jockeyId: "yuga-kawada", finish: 1 },
        { raceId: "nippon-tv-hai", year: 2023, ability: 83, jockeyId: "yuga-kawada", finish: 1 },
        { raceId: "tokyo-daishoten", year: 2023, ability: 84, jockeyId: "yuga-kawada", finish: 1 }
      ]
    }
  ];

  horses.forEach((horse) => {
    ns.HistoricalHorseRegistry.register(horse);
  });
})();
