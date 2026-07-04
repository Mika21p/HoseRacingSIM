(function () {
  const ns = (window.Keiba = window.Keiba || {});

  const RACE_NAMES = {
  "himawari-sho": {
    "nameOriginal": "ひまわり賞",
    "nameZh": "向日葵赏",
    "nameEn": "Himawari Sho",
    "originalLanguage": "日语"
  },
  "ivy-stakes": {
    "nameOriginal": "アイビーS",
    "nameZh": "常春藤锦标",
    "nameEn": "Ivy Stakes",
    "originalLanguage": "日语"
  },
  "hagi-stakes": {
    "nameOriginal": "萩S",
    "nameZh": "萩锦标",
    "nameEn": "Hagi Stakes",
    "originalLanguage": "日语"
  },
  "cattleya-stakes": {
    "nameOriginal": "カトレアS",
    "nameZh": "卡特兰锦标",
    "nameEn": "Cattleya Stakes",
    "originalLanguage": "日语"
  },
  "junior-cup": {
    "nameOriginal": "ジュニアC",
    "nameZh": "少年杯",
    "nameEn": "Junior Cup",
    "originalLanguage": "日语"
  },
  "kobai-stakes": {
    "nameOriginal": "紅梅S",
    "nameZh": "红梅锦标",
    "nameEn": "Kobai Stakes",
    "originalLanguage": "日语"
  },
  "wakagoma-stakes": {
    "nameOriginal": "若駒S",
    "nameZh": "若驹锦标",
    "nameEn": "Wakagoma Stakes",
    "originalLanguage": "日语"
  },
  "crocuss-stakes": {
    "nameOriginal": "クロッカスS",
    "nameZh": "番红花锦标",
    "nameEn": "Crocuss Stakes",
    "originalLanguage": "日语"
  },
  "elfin-stakes": {
    "nameOriginal": "エルフィンS",
    "nameZh": "妖精锦标",
    "nameEn": "Elfin Stakes",
    "originalLanguage": "日语"
  },
  "hyacinth-stakes": {
    "nameOriginal": "ヒヤシンスS",
    "nameZh": "风信子锦标",
    "nameEn": "Hyacinth Stakes",
    "originalLanguage": "日语"
  },
  "sumire-stakes": {
    "nameOriginal": "すみれS",
    "nameZh": "紫罗兰锦标",
    "nameEn": "Sumire Stakes",
    "originalLanguage": "日语"
  },
  "marguerite-stakes": {
    "nameOriginal": "マーガレットS",
    "nameZh": "雏菊锦标",
    "nameEn": "Marguerite Stakes",
    "originalLanguage": "日语"
  },
  "anemone-stakes": {
    "nameOriginal": "アネモネS",
    "nameZh": "银莲花锦标",
    "nameEn": "Anemone Stakes",
    "originalLanguage": "日语"
  },
  "wakaba-stakes": {
    "nameOriginal": "若葉S",
    "nameZh": "若叶锦标",
    "nameEn": "Wakaba Stakes",
    "originalLanguage": "日语"
  },
  "fukuryu-stakes": {
    "nameOriginal": "伏竜S",
    "nameZh": "伏龙锦标",
    "nameEn": "Fukuryu Stakes",
    "originalLanguage": "日语"
  },
  "shoryu-stakes": {
    "nameOriginal": "昇竜S",
    "nameZh": "昇龙锦标",
    "nameEn": "Shoryu Stakes",
    "originalLanguage": "日语"
  },
  "wasurenagusa-sho": {
    "nameOriginal": "忘れな草賞",
    "nameZh": "勿忘草赏",
    "nameEn": "Wasurenagusa Sho",
    "originalLanguage": "日语"
  },
  "violet-stakes": {
    "nameOriginal": "バイオレットS",
    "nameZh": "紫罗兰锦标",
    "nameEn": "Violet Stakes",
    "originalLanguage": "日语"
  },
  "principal-stakes": {
    "nameOriginal": "プリンシパルS",
    "nameZh": "首席锦标",
    "nameEn": "Principal Stakes",
    "originalLanguage": "日语"
  },
  "tachibana-stakes": {
    "nameOriginal": "橘S",
    "nameZh": "橘锦标",
    "nameEn": "Tachibana Stakes",
    "originalLanguage": "日语"
  },
  "hosu-stakes": {
    "nameOriginal": "鳳雛S",
    "nameZh": "鳳雛锦标",
    "nameEn": "Hosu Stakes",
    "originalLanguage": "日语"
  },
  "shirayuri-stakes": {
    "nameOriginal": "白百合S",
    "nameZh": "白百合锦标",
    "nameEn": "Shirayuri Stakes",
    "originalLanguage": "日语"
  },
  "seiryu-stakes": {
    "nameOriginal": "青竜S",
    "nameZh": "青龙锦标",
    "nameEn": "Seiryu Stakes",
    "originalLanguage": "日语"
  },
  "paradise-stakes": {
    "nameOriginal": "パラダイスS",
    "nameZh": "天堂锦标",
    "nameEn": "Paradise Stakes",
    "originalLanguage": "日语"
  },
  "sannomiya-stakes": {
    "nameOriginal": "三宮S",
    "nameZh": "三宮锦标",
    "nameEn": "Sannomiya Stakes",
    "originalLanguage": "日语"
  },
  "sleipnir-stakes": {
    "nameOriginal": "スレイプニルS",
    "nameZh": "斯莱普尼尔锦标",
    "nameEn": "Sleipnir Stakes",
    "originalLanguage": "日语"
  },
  "sapporo-nikkei-open": {
    "nameOriginal": "札幌日経OP",
    "nameZh": "札幌日経公开赛",
    "nameEn": "Sapporo Nikkei Open",
    "originalLanguage": "日语"
  },
  "port-island-stakes": {
    "nameOriginal": "ポートアイランドS",
    "nameZh": "港岛锦标",
    "nameEn": "Port Island Stakes",
    "originalLanguage": "日语"
  },
  "opal-stakes": {
    "nameOriginal": "オパールS",
    "nameZh": "蛋白石锦标",
    "nameEn": "Opal Stakes",
    "originalLanguage": "日语"
  },
  "green-channel-cup": {
    "nameOriginal": "グリーンチャンネルC",
    "nameZh": "绿色频道杯",
    "nameEn": "Green Channel Cup",
    "originalLanguage": "日语"
  },
  "october-stakes": {
    "nameOriginal": "オクトーバーS",
    "nameZh": "十月锦标",
    "nameEn": "October Stakes",
    "originalLanguage": "日语"
  },
  "shinetsu-stakes": {
    "nameOriginal": "信越S",
    "nameZh": "信越锦标",
    "nameEn": "Shinetsu Stakes",
    "originalLanguage": "日语"
  },
  "lumiere-autumn-dash": {
    "nameOriginal": "ルミエールAD",
    "nameZh": "光明秋季短途赛",
    "nameEn": "Lumiere Autumn Dash",
    "originalLanguage": "日语"
  },
  "brazil-cup": {
    "nameOriginal": "ブラジルC",
    "nameZh": "巴西杯",
    "nameEn": "Brazil Cup",
    "originalLanguage": "日语"
  },
  "capital-stakes": {
    "nameOriginal": "キャピタルS",
    "nameZh": "首都锦标",
    "nameEn": "Capital Stakes",
    "originalLanguage": "日语"
  },
  "december-stakes": {
    "nameOriginal": "ディセンバーS",
    "nameZh": "十二月锦标",
    "nameEn": "December Stakes",
    "originalLanguage": "日语"
  },
  "new-year-stakes": {
    "nameOriginal": "ニューイヤーS",
    "nameZh": "新年锦标",
    "nameEn": "New Year Stakes",
    "originalLanguage": "日语"
  },
  "yodo-tankyori-stakes": {
    "nameOriginal": "淀短距離S",
    "nameZh": "淀短距离锦标",
    "nameEn": "Yodo Tankyori Stakes",
    "originalLanguage": "日语"
  },
  "subaru-stakes": {
    "nameOriginal": "すばるS",
    "nameZh": "昴星锦标",
    "nameEn": "Subaru Stakes",
    "originalLanguage": "日语"
  },
  "shirafuji-stakes": {
    "nameOriginal": "白富士S",
    "nameZh": "白富士锦标",
    "nameEn": "Shirafuji Stakes",
    "originalLanguage": "日语"
  },
  "manyo-stakes": {
    "nameOriginal": "万葉S",
    "nameZh": "万叶锦标",
    "nameEn": "Manyo Stakes",
    "originalLanguage": "日语"
  },
  "january-stakes": {
    "nameOriginal": "ジャニュアリーS",
    "nameZh": "一月锦标",
    "nameEn": "January Stakes",
    "originalLanguage": "日语"
  },
  "rakuyo-stakes": {
    "nameOriginal": "洛陽S",
    "nameZh": "洛陽锦标",
    "nameEn": "Rakuyo Stakes",
    "originalLanguage": "日语"
  },
  "nigawa-stakes": {
    "nameOriginal": "仁川S",
    "nameZh": "仁川锦标",
    "nameEn": "Nigawa Stakes",
    "originalLanguage": "日语"
  },
  "aldebaran-stakes": {
    "nameOriginal": "アルデバランS",
    "nameZh": "毕宿五锦标",
    "nameEn": "Aldebaran Stakes",
    "originalLanguage": "日语"
  },
  "osaka-jo-stakes": {
    "nameOriginal": "大阪城S",
    "nameZh": "大阪城锦标",
    "nameEn": "Osaka Jo Stakes",
    "originalLanguage": "日语"
  },
  "coral-stakes": {
    "nameOriginal": "コーラルS",
    "nameZh": "珊瑚锦标",
    "nameEn": "Coral Stakes",
    "originalLanguage": "日语"
  },
  "rokko-stakes": {
    "nameOriginal": "六甲S",
    "nameZh": "六甲锦标",
    "nameEn": "Rokko Stakes",
    "originalLanguage": "日语"
  },
  "shunrai-stakes": {
    "nameOriginal": "春雷S",
    "nameZh": "春雷锦标",
    "nameEn": "Shunrai Stakes",
    "originalLanguage": "日语"
  },
  "fukushima-minpo-cup": {
    "nameOriginal": "福島民報杯",
    "nameZh": "福島民報杯",
    "nameEn": "Fukushima Minpo Cup",
    "originalLanguage": "日语"
  },
  "keiyo-stakes": {
    "nameOriginal": "京葉S",
    "nameZh": "京叶锦标",
    "nameEn": "Keiyo Stakes",
    "originalLanguage": "日语"
  },
  "oasis-stakes": {
    "nameOriginal": "オアシスS",
    "nameZh": "绿洲锦标",
    "nameEn": "Oasis Stakes",
    "originalLanguage": "日语"
  },
  "brilliant-stakes": {
    "nameOriginal": "ブリリアントS",
    "nameZh": "辉煌锦标",
    "nameEn": "Brilliant Stakes",
    "originalLanguage": "日语"
  },
  "metropolitan-stakes": {
    "nameOriginal": "メトロポリタンS",
    "nameZh": "大都会锦标",
    "nameEn": "Metropolitan Stakes",
    "originalLanguage": "日语"
  },
  "ritto-stakes": {
    "nameOriginal": "栗東S",
    "nameZh": "栗東锦标",
    "nameEn": "Ritto Stakes",
    "originalLanguage": "日语"
  },
  "miyakooji-stakes": {
    "nameOriginal": "都大路S",
    "nameZh": "都大路锦标",
    "nameEn": "Miyakooji Stakes",
    "originalLanguage": "日语"
  },
  "nikkei-shinshun-hai": {
    "nameOriginal": "日経新春杯",
    "nameZh": "日经新春杯",
    "nameEn": "Nikkei Shinshun Hai",
    "originalLanguage": "日语"
  },
  "american-jockey-club-cup": {
    "nameOriginal": "アメリカジョッキークラブカップ",
    "nameZh": "美国JCC",
    "nameEn": "American Jockey Club Cup",
    "originalLanguage": "日语"
  },
  "procyon-stakes": {
    "nameOriginal": "プロキオンステークス",
    "nameZh": "南河三锦标",
    "nameEn": "Procyon Stakes",
    "originalLanguage": "日语"
  },
  "kyoto-kinen": {
    "nameOriginal": "京都記念",
    "nameZh": "京都记念",
    "nameEn": "Kyoto Kinen",
    "originalLanguage": "日语"
  },
  "nakayama-kinen": {
    "nameOriginal": "中山記念",
    "nameZh": "中山记念",
    "nameEn": "Nakayama Kinen",
    "originalLanguage": "日语"
  },
  "tulip-sho": {
    "nameOriginal": "チューリップ賞",
    "nameZh": "郁金香赏",
    "nameEn": "Tulip Sho",
    "originalLanguage": "日语"
  },
  "yayoi-sho": {
    "nameOriginal": "弥生賞",
    "nameZh": "弥生赏",
    "nameEn": "Yayoi Sho",
    "originalLanguage": "日语"
  },
  "fillies-revue": {
    "nameOriginal": "フィリーズレビュー",
    "nameZh": "报知杯雌马赛",
    "nameEn": "Fillies Revue",
    "originalLanguage": "日语"
  },
  "kinko-sho": {
    "nameOriginal": "金鯱賞",
    "nameZh": "金鯱赏",
    "nameEn": "Kinko Sho",
    "originalLanguage": "日语"
  },
  "spring-stakes": {
    "nameOriginal": "スプリングステークス",
    "nameZh": "春季锦标",
    "nameEn": "Spring Stakes",
    "originalLanguage": "日语"
  },
  "hanshin-daishoten": {
    "nameOriginal": "阪神大賞典",
    "nameZh": "阪神大赏典",
    "nameEn": "Hanshin Daishoten",
    "originalLanguage": "日语"
  },
  "nikkei-sho": {
    "nameOriginal": "日経賞",
    "nameZh": "日经赏",
    "nameEn": "Nikkei Sho",
    "originalLanguage": "日语"
  },
  "new-zealand-trophy": {
    "nameOriginal": "ニュージーランドトロフィー",
    "nameZh": "新西兰锦标",
    "nameEn": "New Zealand Trophy",
    "originalLanguage": "日语"
  },
  "hanshin-himba-stakes": {
    "nameOriginal": "阪神牝馬ステークス",
    "nameZh": "阪神牝马锦标",
    "nameEn": "Hanshin Himba Stakes",
    "originalLanguage": "日语"
  },
  "flora-stakes": {
    "nameOriginal": "フローラステークス",
    "nameZh": "花仙子锦标",
    "nameEn": "Flora Stakes",
    "originalLanguage": "日语"
  },
  "yomiuri-milers-cup": {
    "nameOriginal": "読売マイラーズカップ",
    "nameZh": "读卖杯",
    "nameEn": "Yomiuri Milers Cup",
    "originalLanguage": "日语"
  },
  "aoba-sho": {
    "nameOriginal": "青葉賞",
    "nameZh": "青叶赏",
    "nameEn": "Aoba Sho",
    "originalLanguage": "日语"
  },
  "kyoto-shimbun-hai": {
    "nameOriginal": "京都新聞杯",
    "nameZh": "京都新闻杯",
    "nameEn": "Kyoto Shimbun Hai",
    "originalLanguage": "日语"
  },
  "keio-hai-spring-cup": {
    "nameOriginal": "京王杯スプリングカップ",
    "nameZh": "京王杯春季杯",
    "nameEn": "Keio Hai Spring Cup",
    "originalLanguage": "日语"
  },
  "meguro-kinen": {
    "nameOriginal": "目黒記念",
    "nameZh": "目黑记念",
    "nameEn": "Meguro Kinen",
    "originalLanguage": "日语"
  },
  "sapporo-kinen": {
    "nameOriginal": "札幌記念",
    "nameZh": "札幌记念",
    "nameEn": "Sapporo Kinen",
    "originalLanguage": "日语"
  },
  "shion-stakes": {
    "nameOriginal": "紫苑ステークス",
    "nameZh": "紫苑锦标",
    "nameEn": "Shion Stakes",
    "originalLanguage": "日语"
  },
  "centaur-stakes": {
    "nameOriginal": "セントウルステークス",
    "nameZh": "人马锦标",
    "nameEn": "Centaur Stakes",
    "originalLanguage": "日语"
  },
  "rose-stakes": {
    "nameOriginal": "ローズステークス",
    "nameZh": "玫瑰锦标",
    "nameEn": "Rose Stakes",
    "originalLanguage": "日语"
  },
  "st-lite-kinen": {
    "nameOriginal": "セントライト記念",
    "nameZh": "圣烈特记念",
    "nameEn": "St Lite Kinen",
    "originalLanguage": "日语"
  },
  "sankei-sho-all-comers": {
    "nameOriginal": "産経賞オールカマー",
    "nameZh": "产经赏全来者锦标",
    "nameEn": "Sankei Sho All Comers",
    "originalLanguage": "日语"
  },
  "kobe-shimbun-hai": {
    "nameOriginal": "神戸新聞杯",
    "nameZh": "神户新闻杯",
    "nameEn": "Kobe Shimbun Hai",
    "originalLanguage": "日语"
  },
  "mainichi-okan": {
    "nameOriginal": "毎日王冠",
    "nameZh": "每日王冠",
    "nameEn": "Mainichi Okan",
    "originalLanguage": "日语"
  },
  "kyoto-daishoten": {
    "nameOriginal": "京都大賞典",
    "nameZh": "京都大赏典",
    "nameEn": "Kyoto Daishoten",
    "originalLanguage": "日语"
  },
  "ireland-trophy": {
    "nameOriginal": "アイルランドトロフィー",
    "nameZh": "爱尔兰锦标",
    "nameEn": "Ireland Trophy",
    "originalLanguage": "日语"
  },
  "fuji-stakes": {
    "nameOriginal": "富士ステークス",
    "nameZh": "富士锦标",
    "nameEn": "Fuji Stakes",
    "originalLanguage": "日语"
  },
  "swan-stakes": {
    "nameOriginal": "スワンステークス",
    "nameZh": "天鹅锦标",
    "nameEn": "Swan Stakes",
    "originalLanguage": "日语"
  },
  "keio-hai-nisai-stakes": {
    "nameOriginal": "京王杯2歳ステークス",
    "nameZh": "京王杯2岁锦标",
    "nameEn": "Keio Hai Nisai Stakes",
    "originalLanguage": "日语"
  },
  "copa-republica-argentina": {
    "nameOriginal": "アルゼンチン共和国杯",
    "nameZh": "阿根廷共和国杯",
    "nameEn": "Copa Republica Argentina",
    "originalLanguage": "日语"
  },
  "daily-hai-nisai-stakes": {
    "nameOriginal": "デイリー杯2歳ステークス",
    "nameZh": "每日杯2岁锦标",
    "nameEn": "Daily Hai Nisai Stakes",
    "originalLanguage": "日语"
  },
  "tokyo-sports-hai": {
    "nameOriginal": "東京スポーツ杯2歳ステークス",
    "nameZh": "东京体育杯两岁锦标",
    "nameEn": "Tokyo Sports Hai",
    "originalLanguage": "日语"
  },
  "stayers-stakes": {
    "nameOriginal": "ステイヤーズステークス",
    "nameZh": "长途马锦标",
    "nameEn": "Stayers Stakes",
    "originalLanguage": "日语"
  },
  "hanshin-cup": {
    "nameOriginal": "阪神カップ",
    "nameZh": "阪神杯",
    "nameEn": "Hanshin Cup",
    "originalLanguage": "日语"
  },
  "nakayama-kimpai": {
    "nameOriginal": "中山金杯",
    "nameZh": "中山金杯",
    "nameEn": "Nakayama Kimpai",
    "originalLanguage": "日语"
  },
  "kyoto-kimpai": {
    "nameOriginal": "京都金杯",
    "nameZh": "京都金杯",
    "nameEn": "Kyoto Kimpai",
    "originalLanguage": "日语"
  },
  "fairy-stakes": {
    "nameOriginal": "フェアリーステークス",
    "nameZh": "妖精锦标",
    "nameEn": "Fairy S",
    "originalLanguage": "日语"
  },
  "shinzan-kinen": {
    "nameOriginal": "シンザン記念",
    "nameZh": "新山记念",
    "nameEn": "Shinzan Kinen",
    "originalLanguage": "日语"
  },
  "keisei-hai": {
    "nameOriginal": "京成杯",
    "nameZh": "京成杯",
    "nameEn": "Keisei Hai",
    "originalLanguage": "日语"
  },
  "kokura-himba-stakes": {
    "nameOriginal": "小倉牝馬ステークス",
    "nameZh": "小仓牝马锦标",
    "nameEn": "Kokura Himba Stakes",
    "originalLanguage": "日语"
  },
  "negishi-stakes": {
    "nameOriginal": "根岸ステークス",
    "nameZh": "根岸锦标",
    "nameEn": "Negishi Stakes",
    "originalLanguage": "日语"
  },
  "silk-road-stakes": {
    "nameOriginal": "シルクロードステークス",
    "nameZh": "丝路锦标",
    "nameEn": "Silk Road Stakes",
    "originalLanguage": "日语"
  },
  "tokyo-shimbun-hai": {
    "nameOriginal": "東京新聞杯",
    "nameZh": "东京新闻杯",
    "nameEn": "Tokyo Shimbun Hai",
    "originalLanguage": "日语"
  },
  "kisaragi-sho": {
    "nameOriginal": "きさらぎ賞",
    "nameZh": "如月赏",
    "nameEn": "Kisaragi Sho",
    "originalLanguage": "日语"
  },
  "queen-cup": {
    "nameOriginal": "クイーンカップ",
    "nameZh": "皇后杯",
    "nameEn": "Queen Cup",
    "originalLanguage": "日语"
  },
  "tokinominoru-kinen": {
    "nameOriginal": "共同通信杯",
    "nameZh": "共同通信杯",
    "nameEn": "Tokinominoru Kinen",
    "originalLanguage": "日语"
  },
  "diamond-stakes": {
    "nameOriginal": "ダイヤモンドステークス",
    "nameZh": "钻石锦标",
    "nameEn": "Diamond Stakes",
    "originalLanguage": "日语"
  },
  "kokura-daishoten": {
    "nameOriginal": "小倉大賞典",
    "nameZh": "小仓大赏典",
    "nameEn": "Kokura Daishoten",
    "originalLanguage": "日语"
  },
  "hankyu-hai": {
    "nameOriginal": "阪急杯",
    "nameZh": "阪急杯",
    "nameEn": "Hankyu Hai",
    "originalLanguage": "日语"
  },
  "aichi-hai": {
    "nameOriginal": "愛知杯",
    "nameZh": "爱知杯",
    "nameEn": "Aichi Hai",
    "originalLanguage": "日语"
  },
  "ocean-stakes": {
    "nameOriginal": "オーシャンステークス",
    "nameZh": "海洋锦标",
    "nameEn": "Ocean Stakes",
    "originalLanguage": "日语"
  },
  "nakayama-himba-stakes": {
    "nameOriginal": "中山牝馬ステークス",
    "nameZh": "中山牝马锦标",
    "nameEn": "Nakayama Himba Stakes",
    "originalLanguage": "日语"
  },
  "flower-cup": {
    "nameOriginal": "フラワーカップ",
    "nameZh": "花杯",
    "nameEn": "Flower Cup",
    "originalLanguage": "日语"
  },
  "falcon-stakes": {
    "nameOriginal": "ファルコンステークス",
    "nameZh": "猎鹰锦标",
    "nameEn": "Falcon S",
    "originalLanguage": "日语"
  },
  "mainichi-hai": {
    "nameOriginal": "毎日杯",
    "nameZh": "每日杯",
    "nameEn": "Mainichi Hai",
    "originalLanguage": "日语"
  },
  "march-stakes": {
    "nameOriginal": "マーチステークス",
    "nameZh": "三月锦标",
    "nameEn": "March S",
    "originalLanguage": "日语"
  },
  "lord-derby-challenge-trophy": {
    "nameOriginal": "ダービー卿チャレンジトロフィー",
    "nameZh": "达比勋爵挑战杯",
    "nameEn": "Lord Derby Challenge Trophy",
    "originalLanguage": "日语"
  },
  "churchill-downs-cup": {
    "nameOriginal": "チャーチルダウンズカップ",
    "nameZh": "丘吉尔园杯",
    "nameEn": "Churchill Downs C",
    "originalLanguage": "日语"
  },
  "antares-stakes": {
    "nameOriginal": "アンタレスステークス",
    "nameZh": "心宿二锦标",
    "nameEn": "Antares S",
    "originalLanguage": "日语"
  },
  "fukushima-himba-stakes": {
    "nameOriginal": "福島牝馬ステークス",
    "nameZh": "福岛牝马锦标",
    "nameEn": "Fukushima Himba Stakes",
    "originalLanguage": "日语"
  },
  "niigata-daishoten": {
    "nameOriginal": "新潟大賞典",
    "nameZh": "新潟大赏典",
    "nameEn": "Niigata Daishoten",
    "originalLanguage": "日语"
  },
  "unicorn-stakes": {
    "nameOriginal": "ユニコーンステークス",
    "nameZh": "独角兽锦标",
    "nameEn": "Unicorn S",
    "originalLanguage": "日语"
  },
  "heian-stakes": {
    "nameOriginal": "平安ステークス",
    "nameZh": "平安锦标",
    "nameEn": "Heian Stakes",
    "originalLanguage": "日语"
  },
  "aoi-stakes": {
    "nameOriginal": "葵ステークス",
    "nameZh": "葵锦标",
    "nameEn": "Aoi Stakes",
    "originalLanguage": "日语"
  },
  "epsom-cup": {
    "nameOriginal": "エプソムカップ",
    "nameZh": "叶森杯",
    "nameEn": "Epsom C",
    "originalLanguage": "日语"
  },
  "fuchu-himba-stakes": {
    "nameOriginal": "府中牝馬ステークス",
    "nameZh": "府中牝马锦标",
    "nameEn": "Fuchu Himba Stakes",
    "originalLanguage": "日语"
  },
  "hakodate-sprint-stakes": {
    "nameOriginal": "函館スプリントステークス",
    "nameZh": "函馆短途锦标",
    "nameEn": "Hakodate Sprint Stakes",
    "originalLanguage": "日语"
  },
  "radio-nikkei-sho": {
    "nameOriginal": "ラジオNIKKEI賞",
    "nameZh": "日经电台赏",
    "nameEn": "Radio NIKKEI Sho",
    "originalLanguage": "日语"
  },
  "kitakyushu-kinen": {
    "nameOriginal": "北九州記念",
    "nameZh": "北九州记念",
    "nameEn": "Kitakyushu Kinen",
    "originalLanguage": "日语"
  },
  "shirasagi-stakes": {
    "nameOriginal": "しらさぎステークス",
    "nameZh": "白鹭锦标",
    "nameEn": "Shirasagi Stakes",
    "originalLanguage": "日语"
  },
  "tanabata-sho": {
    "nameOriginal": "七夕賞",
    "nameZh": "七夕赏",
    "nameEn": "Tanabata Sho",
    "originalLanguage": "日语"
  },
  "tokai-stakes": {
    "nameOriginal": "東海ステークス",
    "nameZh": "东海锦标",
    "nameEn": "Tokai Stakes",
    "originalLanguage": "日语"
  },
  "hakodate-kinen": {
    "nameOriginal": "函館記念",
    "nameZh": "函馆记念",
    "nameEn": "Hakodate Kinen",
    "originalLanguage": "日语"
  },
  "chukyo-kinen": {
    "nameOriginal": "中京記念",
    "nameZh": "中京记念",
    "nameEn": "Chukyo Kinen",
    "originalLanguage": "日语"
  },
  "hakodate-nisai-stakes": {
    "nameOriginal": "函館2歳ステークス",
    "nameZh": "函馆2岁锦标",
    "nameEn": "Hakodate Nisai Stakes",
    "originalLanguage": "日语"
  },
  "ibis-summer-dash": {
    "nameOriginal": "アイビスサマーダッシュ",
    "nameZh": "朱鹮夏季短途赛",
    "nameEn": "Ibis Summer Dash",
    "originalLanguage": "日语"
  },
  "queen-stakes": {
    "nameOriginal": "クイーンステークス",
    "nameZh": "皇后锦标",
    "nameEn": "Queen Stakes",
    "originalLanguage": "日语"
  },
  "leopard-stakes": {
    "nameOriginal": "レパードステークス",
    "nameZh": "豹锦标",
    "nameEn": "Leopard S",
    "originalLanguage": "日语"
  },
  "kokura-kinen": {
    "nameOriginal": "小倉記念",
    "nameZh": "小仓记念",
    "nameEn": "Kokura Kinen",
    "originalLanguage": "日语"
  },
  "sekiya-kinen": {
    "nameOriginal": "関屋記念",
    "nameZh": "关屋记念",
    "nameEn": "Sekiya Kinen",
    "originalLanguage": "日语"
  },
  "cbc-sho": {
    "nameOriginal": "CBC賞",
    "nameZh": "CBC赏",
    "nameEn": "CBC Sho",
    "originalLanguage": "日语"
  },
  "elm-stakes": {
    "nameOriginal": "エルムステークス",
    "nameZh": "榆树锦标",
    "nameEn": "Elm S",
    "originalLanguage": "日语"
  },
  "niigata-nisai-stakes": {
    "nameOriginal": "新潟2歳ステークス",
    "nameZh": "新潟2岁锦标",
    "nameEn": "Niigata Nisai Stakes",
    "originalLanguage": "日语"
  },
  "keeneland-cup": {
    "nameOriginal": "キーンランドカップ",
    "nameZh": "肯尼兰杯",
    "nameEn": "Keeneland C",
    "originalLanguage": "日语"
  },
  "sapporo-nisai-stakes": {
    "nameOriginal": "札幌2歳ステークス",
    "nameZh": "札幌2岁锦标",
    "nameEn": "Sapporo Nisai Stakes",
    "originalLanguage": "日语"
  },
  "chukyo-nisai-stakes": {
    "nameOriginal": "中京2歳ステークス",
    "nameZh": "中京2岁锦标",
    "nameEn": "Chukyo Nisai Stakes",
    "originalLanguage": "日语"
  },
  "niigata-kinen": {
    "nameOriginal": "新潟記念",
    "nameZh": "新潟记念",
    "nameEn": "Niigata Kinen",
    "originalLanguage": "日语"
  },
  "keisei-hai-autumn-handicap": {
    "nameOriginal": "京成杯オータムハンデキャップ",
    "nameZh": "京成杯秋季让赛",
    "nameEn": "Keisei Hai Autumn Handicap",
    "originalLanguage": "日语"
  },
  "challenge-cup": {
    "nameOriginal": "チャレンジカップ",
    "nameZh": "挑战杯",
    "nameEn": "Challenge C",
    "originalLanguage": "日语"
  },
  "sirius-stakes": {
    "nameOriginal": "シリウスステークス",
    "nameZh": "天狼星锦标",
    "nameEn": "Sirius S",
    "originalLanguage": "日语"
  },
  "saudi-arabia-royal-cup": {
    "nameOriginal": "サウジアラビアロイヤルカップ",
    "nameZh": "沙特阿拉伯皇家杯",
    "nameEn": "Saudi Arabia RC",
    "originalLanguage": "日语"
  },
  "artemis-stakes": {
    "nameOriginal": "アルテミスステークス",
    "nameZh": "阿尔忒弥斯锦标",
    "nameEn": "Artemis S",
    "originalLanguage": "日语"
  },
  "fantasy-stakes": {
    "nameOriginal": "ファンタジーステークス",
    "nameZh": "梦幻锦标",
    "nameEn": "Fantasy S",
    "originalLanguage": "日语"
  },
  "miyako-stakes": {
    "nameOriginal": "みやこステークス",
    "nameZh": "都锦标",
    "nameEn": "Miyako S",
    "originalLanguage": "日语"
  },
  "musashino-stakes": {
    "nameOriginal": "武蔵野ステークス",
    "nameZh": "武藏野锦标",
    "nameEn": "Musashino Stakes",
    "originalLanguage": "日语"
  },
  "fukushima-kinen": {
    "nameOriginal": "福島記念",
    "nameZh": "福岛记念",
    "nameEn": "Fukushima Kinen",
    "originalLanguage": "日语"
  },
  "kyoto-nisai-stakes": {
    "nameOriginal": "京都2歳ステークス",
    "nameZh": "京都2岁锦标",
    "nameEn": "Kyoto Nisai Stakes",
    "originalLanguage": "日语"
  },
  "keihan-hai": {
    "nameOriginal": "京阪杯",
    "nameZh": "京阪杯",
    "nameEn": "Keihan Hai",
    "originalLanguage": "日语"
  },
  "naruo-kinen": {
    "nameOriginal": "鳴尾記念",
    "nameZh": "鸣尾记念",
    "nameEn": "Naruo Kinen",
    "originalLanguage": "日语"
  },
  "chunichi-shimbun-hai": {
    "nameOriginal": "中日新聞杯",
    "nameZh": "中日新闻杯",
    "nameEn": "Chunichi Shimbun Hai",
    "originalLanguage": "日语"
  },
  "capella-stakes": {
    "nameOriginal": "カペラステークス",
    "nameZh": "五车二锦标",
    "nameEn": "Capella S",
    "originalLanguage": "日语"
  },
  "turquoise-stakes": {
    "nameOriginal": "ターコイズステークス",
    "nameZh": "绿松石锦标",
    "nameEn": "Turquoise S",
    "originalLanguage": "日语"
  },
  "february-stakes": {
    "nameOriginal": "フェブラリーステークス",
    "nameZh": "二月锦标",
    "nameEn": "February Stakes",
    "originalLanguage": "日语"
  },
  "takamatsunomiya-kinen": {
    "nameOriginal": "高松宮記念",
    "nameZh": "高松宫纪念",
    "nameEn": "Takamatsunomiya Kinen",
    "originalLanguage": "日语"
  },
  "osaka-hai": {
    "nameOriginal": "大阪杯",
    "nameZh": "大阪杯",
    "nameEn": "Osaka Hai",
    "originalLanguage": "日语"
  },
  "oka-sho": {
    "nameOriginal": "桜花賞",
    "nameZh": "樱花赏",
    "nameEn": "Oka Sho",
    "originalLanguage": "日语"
  },
  "satsuki-sho": {
    "nameOriginal": "皐月賞",
    "nameZh": "皋月赏",
    "nameEn": "Satsuki Sho",
    "originalLanguage": "日语"
  },
  "tenno-sho-haru": {
    "nameOriginal": "天皇賞（春）",
    "nameZh": "天皇赏春",
    "nameEn": "Tenno Sho (Spring)",
    "originalLanguage": "日语"
  },
  "nhk-mile-cup": {
    "nameOriginal": "NHKマイルカップ",
    "nameZh": "NHK一哩杯",
    "nameEn": "NHK Mile Cup",
    "originalLanguage": "日语"
  },
  "victoria-mile": {
    "nameOriginal": "ヴィクトリアマイル",
    "nameZh": "维多利亚一哩赛",
    "nameEn": "Victoria Mile",
    "originalLanguage": "日语"
  },
  "yushun-himba": {
    "nameOriginal": "優駿牝馬",
    "nameZh": "优骏牝马",
    "nameEn": "Yushun Himba",
    "originalLanguage": "日语"
  },
  "tokyo-yushun": {
    "nameOriginal": "東京優駿",
    "nameZh": "日本德比",
    "nameEn": "Tokyo Yushun",
    "originalLanguage": "日语"
  },
  "yasuda-kinen": {
    "nameOriginal": "安田記念",
    "nameZh": "安田纪念",
    "nameEn": "Yasuda Kinen",
    "originalLanguage": "日语"
  },
  "takarazuka-kinen": {
    "nameOriginal": "宝塚記念",
    "nameZh": "宝塚纪念",
    "nameEn": "Takarazuka Kinen",
    "originalLanguage": "日语"
  },
  "sprinters-stakes": {
    "nameOriginal": "スプリンターズステークス",
    "nameZh": "短途马锦标",
    "nameEn": "Sprinters Stakes",
    "originalLanguage": "日语"
  },
  "shuka-sho": {
    "nameOriginal": "秋華賞",
    "nameZh": "秋华赏",
    "nameEn": "Shuka Sho",
    "originalLanguage": "日语"
  },
  "kikka-sho": {
    "nameOriginal": "菊花賞",
    "nameZh": "菊花赏",
    "nameEn": "Kikka Sho",
    "originalLanguage": "日语"
  },
  "tenno-sho-aki": {
    "nameOriginal": "天皇賞（秋）",
    "nameZh": "天皇赏秋",
    "nameEn": "Tenno Sho (Autumn)",
    "originalLanguage": "日语"
  },
  "queen-elizabeth-ii-cup": {
    "nameOriginal": "エリザベス女王杯",
    "nameZh": "女王伊丽莎白二世杯",
    "nameEn": "Queen Elizabeth II Cup",
    "originalLanguage": "日语"
  },
  "mile-championship": {
    "nameOriginal": "マイルチャンピオンシップ",
    "nameZh": "一哩冠军赛",
    "nameEn": "Mile Championship",
    "originalLanguage": "日语"
  },
  "japan-cup": {
    "nameOriginal": "ジャパンカップ",
    "nameZh": "日本杯",
    "nameEn": "Japan Cup",
    "originalLanguage": "日语"
  },
  "champions-cup": {
    "nameOriginal": "チャンピオンズカップ",
    "nameZh": "冠军杯",
    "nameEn": "Champions Cup",
    "originalLanguage": "日语"
  },
  "hanshin-juvenile-fillies": {
    "nameOriginal": "阪神ジュベナイルフィリーズ",
    "nameZh": "阪神两岁牝马锦标",
    "nameEn": "Hanshin Juvenile Fillies",
    "originalLanguage": "日语"
  },
  "asahi-hai-fs": {
    "nameOriginal": "朝日杯フューチュリティステークス",
    "nameZh": "朝日杯未来锦标",
    "nameEn": "Asahi Hai Futurity Stakes",
    "originalLanguage": "日语"
  },
  "arima-kinen": {
    "nameOriginal": "有馬記念",
    "nameZh": "有马纪念",
    "nameEn": "Arima Kinen",
    "originalLanguage": "日语"
  },
  "hopeful-stakes": {
    "nameOriginal": "ホープフルステークス",
    "nameZh": "希望锦标",
    "nameEn": "Hopeful Stakes",
    "originalLanguage": "日语"
  },
  "tokyo-daishoten": {
    "nameOriginal": "東京大賞典",
    "nameZh": "东京大赏典",
    "nameEn": "Tokyo Daishoten",
    "originalLanguage": "日语"
  },
  "kawasaki-kinen": {
    "nameOriginal": "川崎記念",
    "nameZh": "川崎记念",
    "nameEn": "Kawasaki Kinen",
    "originalLanguage": "日语"
  },
  "haneda-hai": {
    "nameOriginal": "羽田盃",
    "nameZh": "羽田杯",
    "nameEn": "Haneda Hai",
    "originalLanguage": "日语"
  },
  "kashiwa-kinen": {
    "nameOriginal": "かしわ記念",
    "nameZh": "柏记念",
    "nameEn": "Kashiwa Kinen",
    "originalLanguage": "日语"
  },
  "tokyo-derby": {
    "nameOriginal": "東京ダービー",
    "nameZh": "东京德比",
    "nameEn": "Tokyo Derby",
    "originalLanguage": "日语"
  },
  "sakitama-hai": {
    "nameOriginal": "さきたま杯",
    "nameZh": "埼玉杯",
    "nameEn": "Sakitama Hai",
    "originalLanguage": "日语"
  },
  "teio-sho": {
    "nameOriginal": "帝王賞",
    "nameZh": "帝王赏",
    "nameEn": "Teio Sho",
    "originalLanguage": "日语"
  },
  "japan-dirt-classic": {
    "nameOriginal": "ジャパンダートクラシック",
    "nameZh": "日本泥地经典赛",
    "nameEn": "Japan Dirt Classic",
    "originalLanguage": "日语"
  },
  "mile-championship-nambu-hai": {
    "nameOriginal": "マイルチャンピオンシップ南部杯",
    "nameZh": "一哩冠军南部杯",
    "nameEn": "Mile Championship Nambu Hai",
    "originalLanguage": "日语"
  },
  "jbc-ladies-classic": {
    "nameOriginal": "JBCレディスクラシック",
    "nameZh": "JBC雌马经典赛",
    "nameEn": "JBC Ladies' Classic",
    "originalLanguage": "日语"
  },
  "jbc-sprint": {
    "nameOriginal": "JBCスプリント",
    "nameZh": "JBC短途赛",
    "nameEn": "JBC Sprint",
    "originalLanguage": "日语"
  },
  "jbc-classic": {
    "nameOriginal": "JBCクラシック",
    "nameZh": "JBC经典赛",
    "nameEn": "JBC Classic",
    "originalLanguage": "日语"
  },
  "zen-nippon-nisai-yushun": {
    "nameOriginal": "全日本2歳優駿",
    "nameZh": "全日本两岁优骏",
    "nameEn": "Zen Nippon Nisai Yushun",
    "originalLanguage": "日语"
  },
  "diolite-kinen": {
    "nameOriginal": "ダイオライト記念",
    "nameZh": "迪奥莱特纪念",
    "nameEn": "Diolite Kinen",
    "originalLanguage": "日语"
  },
  "keihin-hai": {
    "nameOriginal": "京浜盃",
    "nameZh": "京滨杯",
    "nameEn": "Keihin Hai",
    "originalLanguage": "日语"
  },
  "hyogo-championship": {
    "nameOriginal": "兵庫チャンピオンシップ",
    "nameZh": "兵库冠军锦标",
    "nameEn": "Hyogo Championship",
    "originalLanguage": "日语"
  },
  "nagoya-grand-prix": {
    "nameOriginal": "名古屋グランプリ",
    "nameZh": "名古屋大奖赛",
    "nameEn": "Nagoya Grand Prix",
    "originalLanguage": "日语"
  },
  "empress-hai": {
    "nameOriginal": "エンプレス杯",
    "nameZh": "雌马杯",
    "nameEn": "Empress Hai",
    "originalLanguage": "日语"
  },
  "kanto-oaks": {
    "nameOriginal": "関東オークス",
    "nameZh": "关东橡树大赛",
    "nameEn": "Kanto Oaks",
    "originalLanguage": "日语"
  },
  "furukata-award": {
    "nameOriginal": "不来方賞",
    "nameZh": "不来方赏",
    "nameEn": "Furukata Award",
    "originalLanguage": "日语"
  },
  "nippon-tv-hai": {
    "nameOriginal": "日本テレビ盃",
    "nameZh": "日本电视杯",
    "nameEn": "Nippon Tv Hai",
    "originalLanguage": "日语"
  },
  "ladies-prelude": {
    "nameOriginal": "レディスプレリュード",
    "nameZh": "雌马预赛",
    "nameEn": "Ladies Prelude",
    "originalLanguage": "日语"
  },
  "tokyo-hai": {
    "nameOriginal": "東京盃",
    "nameZh": "东京杯",
    "nameEn": "Tokyo Hai",
    "originalLanguage": "日语"
  },
  "urawa-kinen": {
    "nameOriginal": "浦和記念",
    "nameZh": "浦和记念",
    "nameEn": "Urawa Kinen",
    "originalLanguage": "日语"
  },
  "hyogo-junior-grand-prix": {
    "nameOriginal": "兵庫ジュニアグランプリ",
    "nameZh": "兵库青年大奖赛",
    "nameEn": "Hyogo Junior Grand Prix",
    "originalLanguage": "日语"
  },
  "bluebird-cup": {
    "nameOriginal": "ブルーバードカップ",
    "nameZh": "蓝鸟杯",
    "nameEn": "Bluebird Cup",
    "originalLanguage": "日语"
  },
  "queen-sho": {
    "nameOriginal": "クイーン賞",
    "nameZh": "皇后赏",
    "nameEn": "Queen Sho",
    "originalLanguage": "日语"
  },
  "saga-kinen": {
    "nameOriginal": "佐賀記念",
    "nameZh": "佐贺记念",
    "nameEn": "Saga Kinen",
    "originalLanguage": "日语"
  },
  "kumotori-sho": {
    "nameOriginal": "雲取賞",
    "nameZh": "云取赏",
    "nameEn": "Kumotori Sho",
    "originalLanguage": "日语"
  },
  "iris-kinen": {
    "nameOriginal": "かきつばた記念",
    "nameZh": "鸢尾花记念",
    "nameEn": "Iris Kinen",
    "originalLanguage": "日语"
  },
  "kurofune-sho": {
    "nameOriginal": "黒船賞",
    "nameZh": "黑船赏",
    "nameEn": "Kurofune Sho",
    "originalLanguage": "日语"
  },
  "hyogo-queen-cup": {
    "nameOriginal": "兵庫女王盃",
    "nameZh": "兵库女王杯",
    "nameEn": "Hyogo Queen Cup",
    "originalLanguage": "日语"
  },
  "tokyo-sprint": {
    "nameOriginal": "東京スプリント",
    "nameZh": "东京短途赛",
    "nameEn": "Tokyo Sprint",
    "originalLanguage": "日语"
  },
  "sparking-lady-cup": {
    "nameOriginal": "スパーキングレディーカップ",
    "nameZh": "闪耀雌马杯",
    "nameEn": "Sparking Lady Cup",
    "originalLanguage": "日语"
  },
  "mercury-cup": {
    "nameOriginal": "マーキュリーカップ",
    "nameZh": "水星杯",
    "nameEn": "Mercury Cup",
    "originalLanguage": "日语"
  },
  "cluster-cup": {
    "nameOriginal": "クラスターカップ",
    "nameZh": "星团杯",
    "nameEn": "Cluster Cup",
    "originalLanguage": "日语"
  },
  "hokkaido-sprint-cup": {
    "nameOriginal": "北海道スプリントカップ",
    "nameZh": "北海道短途杯",
    "nameEn": "Hokkaido Sprint Cup",
    "originalLanguage": "日语"
  },
  "breeders-gold-cup": {
    "nameOriginal": "ブリーダーズゴールドカップ",
    "nameZh": "育马者金杯",
    "nameEn": "Breeders Gold Cup",
    "originalLanguage": "日语"
  },
  "summer-champion": {
    "nameOriginal": "サマーチャンピオン",
    "nameZh": "夏季冠军赛",
    "nameEn": "Summer Champion",
    "originalLanguage": "日语"
  },
  "oval-sprint": {
    "nameOriginal": "オーバルスプリント",
    "nameZh": "椭圆短途赛",
    "nameEn": "Oval Sprint",
    "originalLanguage": "日语"
  },
  "hakusan-daishoten": {
    "nameOriginal": "白山大賞典",
    "nameZh": "白山大赏典",
    "nameEn": "Hakusan Daishoten",
    "originalLanguage": "日语"
  },
  "marine-cup": {
    "nameOriginal": "マリーンカップ",
    "nameZh": "海洋杯",
    "nameEn": "Marine Cup",
    "originalLanguage": "日语"
  },
  "edelweiss-sho": {
    "nameOriginal": "エーデルワイス賞",
    "nameZh": "雪绒花赏",
    "nameEn": "Edelweiss Sho",
    "originalLanguage": "日语"
  },
  "jbc-nisai-yushun": {
    "nameOriginal": "JBC2歳優駿",
    "nameZh": "JBC两岁优骏",
    "nameEn": "JBC Nisai Yushun",
    "originalLanguage": "日语"
  },
  "nagoya-daishoten": {
    "nameOriginal": "名古屋大賞典",
    "nameZh": "名古屋大赏典",
    "nameEn": "Nagoya Daishoten",
    "originalLanguage": "日语"
  },
  "hyogo-gold-trophy": {
    "nameOriginal": "兵庫ゴールドトロフィー",
    "nameZh": "兵库金杯",
    "nameEn": "Hyogo Gold Trophy",
    "originalLanguage": "日语"
  },
  "kentucky-derby": {
    "nameOriginal": "Kentucky Derby",
    "nameZh": "肯塔基德比",
    "nameEn": "Kentucky Derby",
    "originalLanguage": "英语"
  },
  "preakness-stakes": {
    "nameOriginal": "Preakness Stakes",
    "nameZh": "必利时锦标",
    "nameEn": "Preakness Stakes",
    "originalLanguage": "英语"
  },
  "belmont-stakes": {
    "nameOriginal": "Belmont Stakes",
    "nameZh": "贝蒙锦标",
    "nameEn": "Belmont Stakes",
    "originalLanguage": "英语"
  },
  "pegasus-world-cup": {
    "nameOriginal": "Pegasus World Cup",
    "nameZh": "飞马世界杯",
    "nameEn": "Pegasus World Cup",
    "originalLanguage": "英语"
  },
  "santa-anita-handicap": {
    "nameOriginal": "Santa Anita Handicap",
    "nameZh": "圣雅尼塔让赛",
    "nameEn": "Santa Anita Handicap",
    "originalLanguage": "英语"
  },
  "apple-blossom-handicap": {
    "nameOriginal": "Apple Blossom Handicap",
    "nameZh": "苹果花让赛",
    "nameEn": "Apple Blossom Handicap",
    "originalLanguage": "英语"
  },
  "blue-grass-stakes": {
    "nameOriginal": "Blue Grass Stakes",
    "nameZh": "蓝草锦标",
    "nameEn": "Blue Grass Stakes",
    "originalLanguage": "英语"
  },
  "kentucky-oaks": {
    "nameOriginal": "Kentucky Oaks",
    "nameZh": "肯塔基橡树",
    "nameEn": "Kentucky Oaks",
    "originalLanguage": "英语"
  },
  "acorn-stakes": {
    "nameOriginal": "Acorn Stakes",
    "nameZh": "橡果锦标",
    "nameEn": "Acorn Stakes",
    "originalLanguage": "英语"
  },
  "coaching-club-american-oaks": {
    "nameOriginal": "Coaching Club American Oaks",
    "nameZh": "美国教练俱乐部橡树赛",
    "nameEn": "Coaching Club American Oaks",
    "originalLanguage": "英语"
  },
  "metropolitan-handicap": {
    "nameOriginal": "Metropolitan Handicap",
    "nameZh": "大都会让赛",
    "nameEn": "Metropolitan Handicap",
    "originalLanguage": "英语"
  },
  "haskell-stakes": {
    "nameOriginal": "Haskell Stakes",
    "nameZh": "哈斯凯尔锦标",
    "nameEn": "Haskell Stakes",
    "originalLanguage": "英语"
  },
  "travers-stakes": {
    "nameOriginal": "Travers Stakes",
    "nameZh": "卓华斯锦标",
    "nameEn": "Travers Stakes",
    "originalLanguage": "英语"
  },
  "pegasus-world-cup-turf": {
    "nameOriginal": "Pegasus World Cup Turf",
    "nameZh": "飞马世界杯草地赛",
    "nameEn": "Pegasus World Cup Turf",
    "originalLanguage": "英语"
  },
  "american-turf-stakes": {
    "nameOriginal": "American Turf Stakes",
    "nameZh": "美国草地锦标",
    "nameEn": "American Turf Stakes",
    "originalLanguage": "英语"
  },
  "turf-classic-stakes": {
    "nameOriginal": "Turf Classic Stakes",
    "nameZh": "草地经典赛",
    "nameEn": "Turf Classic Stakes",
    "originalLanguage": "英语"
  },
  "manhattan-stakes": {
    "nameOriginal": "Manhattan Stakes",
    "nameZh": "曼哈顿锦标",
    "nameEn": "Manhattan Stakes",
    "originalLanguage": "英语"
  },
  "just-a-game-stakes": {
    "nameOriginal": "Just a Game Stakes",
    "nameZh": "Just a Game锦标",
    "nameEn": "Just a Game Stakes",
    "originalLanguage": "英语"
  },
  "diana-stakes": {
    "nameOriginal": "Diana Stakes",
    "nameZh": "戴安娜锦标",
    "nameEn": "Diana Stakes",
    "originalLanguage": "英语"
  },
  "arlington-million": {
    "nameOriginal": "Arlington Million",
    "nameZh": "阿灵顿百万大赛",
    "nameEn": "Arlington Million",
    "originalLanguage": "英语"
  },
  "keeneland-turf-mile": {
    "nameOriginal": "Keeneland Turf Mile",
    "nameZh": "基兰草地一哩",
    "nameEn": "Keeneland Turf Mile",
    "originalLanguage": "英语"
  },
  "jaipur-stakes": {
    "nameOriginal": "Jaipur Stakes",
    "nameZh": "斋浦尔锦标",
    "nameEn": "Jaipur Stakes",
    "originalLanguage": "英语"
  },
  "forego-stakes": {
    "nameOriginal": "Forego Stakes",
    "nameZh": "领先锦标",
    "nameEn": "Forego Stakes",
    "originalLanguage": "英语"
  },
  "h-allen-jerkens-memorial-stakes": {
    "nameOriginal": "H. Allen Jerkens Memorial Stakes",
    "nameZh": "H. 艾伦·杰肯斯纪念锦标",
    "nameEn": "H. Allen Jerkens Memorial Stakes",
    "originalLanguage": "英语"
  },
  "prix-dispahan": {
    "nameOriginal": "Prix d'Ispahan",
    "nameZh": "伊斯巴翰锦标",
    "nameEn": "Prix Dispahan",
    "originalLanguage": "法语"
  },
  "prix-ganay": {
    "nameOriginal": "Prix Ganay",
    "nameZh": "根利锦标",
    "nameEn": "Prix Ganay",
    "originalLanguage": "法语"
  },
  "poule-dessai-des-poulains": {
    "nameOriginal": "Poule d'Essai des Poulains",
    "nameZh": "法国二千坚尼",
    "nameEn": "Poule d'Essai des Poulains",
    "originalLanguage": "法语"
  },
  "poule-dessai-des-pouliches": {
    "nameOriginal": "Poule d'Essai des Pouliches",
    "nameZh": "法国一千坚尼",
    "nameEn": "Poule d'Essai des Pouliches",
    "originalLanguage": "法语"
  },
  "prix-vicomtesse-vigier": {
    "nameOriginal": "Prix Vicomtesse Vigier",
    "nameZh": "维吉尔子爵夫人锦标",
    "nameEn": "Prix Vicomtesse Vigier",
    "originalLanguage": "法语"
  },
  "grand-prix-de-paris": {
    "nameOriginal": "Grand Prix de Paris",
    "nameZh": "巴黎大赛",
    "nameEn": "Grand Prix de Paris",
    "originalLanguage": "法语"
  },
  "prix-de-royallieu": {
    "nameOriginal": "Prix de Royallieu",
    "nameZh": "鲁瓦耶锦标",
    "nameEn": "Prix de Royallieu",
    "originalLanguage": "法语"
  },
  "prix-du-cadran": {
    "nameOriginal": "Prix du Cadran",
    "nameZh": "卡德兰大奖赛",
    "nameEn": "Prix du Cadran",
    "originalLanguage": "法语"
  },
  "prix-de-lopera": {
    "nameOriginal": "Prix de l'Opéra",
    "nameZh": "歌剧大奖赛",
    "nameEn": "Prix de l'Opera",
    "originalLanguage": "法语"
  },
  "prix-royal-oak": {
    "nameOriginal": "Prix Royal-Oak",
    "nameZh": "皇家橡树大赛",
    "nameEn": "Prix Royal Oak",
    "originalLanguage": "法语"
  },
  "goodwood-cup": {
    "nameOriginal": "Goodwood Cup",
    "nameZh": "古活杯",
    "nameEn": "Goodwood Cup",
    "originalLanguage": "英语"
  },
  "british-champions-long-distance-cup": {
    "nameOriginal": "British Champions Long Distance Cup",
    "nameZh": "英国冠军长途杯",
    "nameEn": "British Champions Long Distance Cup",
    "originalLanguage": "英语"
  },
  "falmouth-stakes": {
    "nameOriginal": "Falmouth Stakes",
    "nameZh": "法尔茅斯锦标",
    "nameEn": "Falmouth Stakes",
    "originalLanguage": "英语"
  },
  "nassau-stakes": {
    "nameOriginal": "Nassau Stakes",
    "nameZh": "拿骚锦标",
    "nameEn": "Nassau Stakes",
    "originalLanguage": "英语"
  },
  "british-champions-fillies-mares-stakes": {
    "nameOriginal": "British Champions Fillies Mares Stakes",
    "nameZh": "英国冠军雌马锦标",
    "nameEn": "British Champions Fillies Mares Stakes",
    "originalLanguage": "英语"
  },
  "champion-stakes": {
    "nameOriginal": "Champion Stakes",
    "nameZh": "冠军锦标",
    "nameEn": "Champion Stakes",
    "originalLanguage": "英语"
  },
  "irish-two-thousand-guineas": {
    "nameOriginal": "Irish Two Thousand Guineas",
    "nameZh": "爱尔兰二千坚尼",
    "nameEn": "Irish Two Thousand Guineas",
    "originalLanguage": "英语"
  },
  "irish-st-leger": {
    "nameOriginal": "Irish St Leger",
    "nameZh": "爱尔兰圣烈治锦标",
    "nameEn": "Irish St Leger",
    "originalLanguage": "英语"
  },
  "deutsches-derby": {
    "nameOriginal": "Deutsches Derby",
    "nameZh": "德国德比",
    "nameEn": "Deutsches Derby",
    "originalLanguage": "德语"
  },
  "grosser-preis-von-baden": {
    "nameOriginal": "Großer Preis von Baden",
    "nameZh": "巴登大赛",
    "nameEn": "Grosser Preis Von Baden",
    "originalLanguage": "德语"
  },
  "prix-rothschild": {
    "nameOriginal": "Prix Rothschild",
    "nameZh": "罗斯柴尔德大奖赛",
    "nameEn": "Prix Rothschild",
    "originalLanguage": "法语"
  },
  "prix-du-moulin": {
    "nameOriginal": "Prix du Moulin",
    "nameZh": "穆兰大赛",
    "nameEn": "Prix du Moulin",
    "originalLanguage": "法语"
  },
  "prix-de-la-foret": {
    "nameOriginal": "Prix de la Forêt",
    "nameZh": "森林大赛",
    "nameEn": "Prix de La Foret",
    "originalLanguage": "法语"
  },
  "prix-marcel-boussac": {
    "nameOriginal": "Prix Marcel Boussac",
    "nameZh": "马塞尔布萨克大赛",
    "nameEn": "Prix Marcel Boussac",
    "originalLanguage": "法语"
  },
  "prix-morny": {
    "nameOriginal": "Prix Morny",
    "nameZh": "莫尼大赛",
    "nameEn": "Prix Morny",
    "originalLanguage": "法语"
  },
  "prix-maurice-de-gheest": {
    "nameOriginal": "Prix Maurice de Gheest",
    "nameZh": "莫里斯德盖斯特大赛",
    "nameEn": "Prix Maurice de Gheest",
    "originalLanguage": "法语"
  },
  "prix-jean-luc-lagardere": {
    "nameOriginal": "Prix Jean-Luc Lagardère",
    "nameZh": "让-吕克拉加代尔大奖赛",
    "nameEn": "Prix Jean Luc Lagardere",
    "originalLanguage": "法语"
  },
  "queen-elizabeth-ii-stakes": {
    "nameOriginal": "Queen Elizabeth II Stakes",
    "nameZh": "伊丽莎白女王二世锦标",
    "nameEn": "Queen Elizabeth II Stakes",
    "originalLanguage": "英语"
  },
  "dewhurst-stakes": {
    "nameOriginal": "Dewhurst Stakes",
    "nameZh": "杜赫斯特锦标",
    "nameEn": "Dewhurst Stakes",
    "originalLanguage": "英语"
  },
  "yorkshire-oaks": {
    "nameOriginal": "Yorkshire Oaks",
    "nameZh": "约克郡橡树大赛",
    "nameEn": "Yorkshire Oaks",
    "originalLanguage": "英语"
  },
  "futurity-trophy": {
    "nameOriginal": "Futurity Trophy",
    "nameZh": "未来锦标",
    "nameEn": "Futurity Trophy",
    "originalLanguage": "英语"
  },
  "middle-park-stakes": {
    "nameOriginal": "Middle Park Stakes",
    "nameZh": "米德尔帕克锦标",
    "nameEn": "Middle Park Stakes",
    "originalLanguage": "英语"
  },
  "irish-oaks": {
    "nameOriginal": "Irish Oaks",
    "nameZh": "爱尔兰橡树大赛",
    "nameEn": "Irish Oaks",
    "originalLanguage": "英语"
  },
  "tattersalls-gold-cup": {
    "nameOriginal": "Tattersalls Gold Cup",
    "nameZh": "塔特索尔斯金杯",
    "nameEn": "Tattersalls Gold Cup",
    "originalLanguage": "英语"
  },
  "pretty-polly-stakes": {
    "nameOriginal": "Pretty Polly Stakes",
    "nameZh": "美丽波莉锦标",
    "nameEn": "Pretty Polly Stakes",
    "originalLanguage": "英语"
  },
  "phoenix-stakes": {
    "nameOriginal": "Phoenix Stakes",
    "nameZh": "凤凰锦标",
    "nameEn": "Phoenix Stakes",
    "originalLanguage": "英语"
  },
  "flying-five-stakes": {
    "nameOriginal": "Flying Five Stakes",
    "nameZh": "飞行五锦标",
    "nameEn": "Flying Five Stakes",
    "originalLanguage": "英语"
  },
  "grosser-preis-von-berlin": {
    "nameOriginal": "Großer Preis von Berlin",
    "nameZh": "柏林大赛",
    "nameEn": "Grosser Preis Von Berlin",
    "originalLanguage": "德语"
  },
  "preis-von-europa": {
    "nameOriginal": "Preis von Europa",
    "nameZh": "欧洲大赛",
    "nameEn": "Preis Von Europa",
    "originalLanguage": "德语"
  },
  "grosser-preis-von-bayern": {
    "nameOriginal": "Großer Preis von Bayern",
    "nameZh": "巴伐利亚大赛",
    "nameEn": "Grosser Preis Von Bayern",
    "originalLanguage": "德语"
  },
  "two-thousand-guineas": {
    "nameOriginal": "2000 Guineas",
    "nameZh": "二千坚尼",
    "nameEn": "2000 Guineas",
    "originalLanguage": "英语"
  },
  "one-thousand-guineas": {
    "nameOriginal": "1000 Guineas",
    "nameZh": "一千坚尼",
    "nameEn": "1000 Guineas",
    "originalLanguage": "英语"
  },
  "epsom-derby": {
    "nameOriginal": "Epsom Derby",
    "nameZh": "叶森德比",
    "nameEn": "Epsom Derby",
    "originalLanguage": "英语"
  },
  "epsom-oaks": {
    "nameOriginal": "Epsom Oaks",
    "nameZh": "叶森橡树",
    "nameEn": "Epsom Oaks",
    "originalLanguage": "英语"
  },
  "coronation-cup": {
    "nameOriginal": "Coronation Cup",
    "nameZh": "加冕杯",
    "nameEn": "Coronation Cup",
    "originalLanguage": "英语"
  },
  "st-leger-stakes": {
    "nameOriginal": "St Leger Stakes",
    "nameZh": "圣烈治锦标",
    "nameEn": "St Leger Stakes",
    "originalLanguage": "英语"
  },
  "lockinge-stakes": {
    "nameOriginal": "Lockinge Stakes",
    "nameZh": "洛金锦标",
    "nameEn": "Lockinge Stakes",
    "originalLanguage": "英语"
  },
  "prince-of-wales-stakes": {
    "nameOriginal": "Prince of Wales Stakes",
    "nameZh": "威尔士亲王锦标",
    "nameEn": "Prince of Wales Stakes",
    "originalLanguage": "英语"
  },
  "queen-anne-stakes": {
    "nameOriginal": "Queen Anne Stakes",
    "nameZh": "女王安妮锦标",
    "nameEn": "Queen Anne Stakes",
    "originalLanguage": "英语"
  },
  "st-jamess-palace-stakes": {
    "nameOriginal": "St James's Palace Stakes",
    "nameZh": "圣詹姆斯皇宫锦标",
    "nameEn": "St James's Palace Stakes",
    "originalLanguage": "英语"
  },
  "ascot-gold-cup": {
    "nameOriginal": "Ascot Gold Cup",
    "nameZh": "雅士谷金杯",
    "nameEn": "Ascot Gold Cup",
    "originalLanguage": "英语"
  },
  "coronation-stakes": {
    "nameOriginal": "Coronation Stakes",
    "nameZh": "加冕锦标",
    "nameEn": "Coronation Stakes",
    "originalLanguage": "英语"
  },
  "eclipse-stakes": {
    "nameOriginal": "Eclipse Stakes",
    "nameZh": "日蚀大赛",
    "nameEn": "Eclipse Stakes",
    "originalLanguage": "英语"
  },
  "sussex-stakes": {
    "nameOriginal": "Sussex Stakes",
    "nameZh": "萨塞克斯锦标",
    "nameEn": "Sussex Stakes",
    "originalLanguage": "英语"
  },
  "irish-derby": {
    "nameOriginal": "Irish Derby",
    "nameZh": "爱尔兰德比",
    "nameEn": "Irish Derby",
    "originalLanguage": "英语"
  },
  "irish-champion-stakes": {
    "nameOriginal": "Irish Champion Stakes",
    "nameZh": "爱尔兰冠军锦标",
    "nameEn": "Irish Champion Stakes",
    "originalLanguage": "英语"
  },
  "prix-du-jockey-club": {
    "nameOriginal": "Prix du Jockey Club",
    "nameZh": "法国德比",
    "nameEn": "Prix du Jockey Club",
    "originalLanguage": "法语"
  },
  "prix-de-diane": {
    "nameOriginal": "Prix de Diane",
    "nameZh": "法国橡树",
    "nameEn": "Prix de Diane",
    "originalLanguage": "法语"
  },
  "prix-vermeille": {
    "nameOriginal": "Prix Vermeille",
    "nameZh": "红宝锦标",
    "nameEn": "Prix Vermeille",
    "originalLanguage": "法语"
  },
  "king-george-vi-and-queen-elizabeth-stakes": {
    "nameOriginal": "King George VI and Queen Elizabeth Stakes",
    "nameZh": "英皇锦标",
    "nameEn": "King George VI and Queen Elizabeth Stakes",
    "originalLanguage": "英语"
  },
  "grand-prix-de-saint-cloud": {
    "nameOriginal": "Grand Prix de Saint-Cloud",
    "nameZh": "圣格卢大赛",
    "nameEn": "Grand Prix de Saint Cloud",
    "originalLanguage": "法语"
  },
  "international-stakes": {
    "nameOriginal": "International Stakes",
    "nameZh": "国际锦标",
    "nameEn": "International Stakes",
    "originalLanguage": "英语"
  },
  "prix-jacques-le-marois": {
    "nameOriginal": "Prix Jacques le Marois",
    "nameZh": "杰克莫华大赛",
    "nameEn": "Prix Jacques Le Marois",
    "originalLanguage": "法语"
  },
  "prix-de-larc": {
    "nameOriginal": "Prix de l'Arc de Triomphe",
    "nameZh": "凯旋门赏",
    "nameEn": "Prix de l'Arc de Triomphe",
    "originalLanguage": "法语"
  },
  "king-charles-iii-stakes": {
    "nameOriginal": "King Charles Iii Stakes",
    "nameZh": "查理三世锦标",
    "nameEn": "King Charles Iii Stakes",
    "originalLanguage": "英语"
  },
  "queen-elizabeth-ii-jubilee-stakes": {
    "nameOriginal": "Queen Elizabeth II Jubilee Stakes",
    "nameZh": "女王伊丽莎白二世禧年锦标",
    "nameEn": "Queen Elizabeth II Jubilee Stakes",
    "originalLanguage": "英语"
  },
  "commonwealth-cup": {
    "nameOriginal": "Commonwealth Cup",
    "nameZh": "英联邦杯",
    "nameEn": "Commonwealth Cup",
    "originalLanguage": "英语"
  },
  "july-cup": {
    "nameOriginal": "July Cup",
    "nameZh": "七月杯",
    "nameEn": "July Cup",
    "originalLanguage": "英语"
  },
  "nunthorpe-stakes": {
    "nameOriginal": "Nunthorpe Stakes",
    "nameZh": "南索普锦标",
    "nameEn": "Nunthorpe Stakes",
    "originalLanguage": "英语"
  },
  "haydock-sprint-cup": {
    "nameOriginal": "Haydock Sprint Cup",
    "nameZh": "海多克短途杯",
    "nameEn": "Haydock Sprint Cup",
    "originalLanguage": "英语"
  },
  "prix-de-labbaye": {
    "nameOriginal": "Prix de l'Abbaye",
    "nameZh": "阿贝耶大奖赛",
    "nameEn": "Prix de l'Abbaye",
    "originalLanguage": "法语"
  },
  "british-champions-sprint-stakes": {
    "nameOriginal": "British Champions Sprint Stakes",
    "nameZh": "英国冠军短途锦标",
    "nameEn": "British Champions Sprint Stakes",
    "originalLanguage": "英语"
  },
  "caulfield-cup": {
    "nameOriginal": "Caulfield Cup",
    "nameZh": "考菲尔德杯",
    "nameEn": "Caulfield Cup",
    "originalLanguage": "英语"
  },
  "cox-plate": {
    "nameOriginal": "Cox Plate",
    "nameZh": "觉士盾",
    "nameEn": "Cox Plate",
    "originalLanguage": "英语"
  },
  "golden-slipper-stakes": {
    "nameOriginal": "Golden Slipper Stakes",
    "nameZh": "金拖鞋大赛",
    "nameEn": "Golden Slipper Stakes",
    "originalLanguage": "英语"
  },
  "doncaster-mile": {
    "nameOriginal": "Doncaster Mile",
    "nameZh": "唐卡士打一哩赛",
    "nameEn": "Doncaster Mile",
    "originalLanguage": "英语"
  },
  "queen-elizabeth-stakes-aus": {
    "nameOriginal": "Queen Elizabeth Stakes (Australia)",
    "nameZh": "女王伊丽莎白锦标",
    "nameEn": "Queen Elizabeth Stakes (Australia)",
    "originalLanguage": "英语"
  },
  "victoria-derby": {
    "nameOriginal": "Victoria Derby",
    "nameZh": "维多利亚德比",
    "nameEn": "Victoria Derby",
    "originalLanguage": "英语"
  },
  "the-everest": {
    "nameOriginal": "the Everest",
    "nameZh": "珠穆朗玛峰锦标",
    "nameEn": "the Everest",
    "originalLanguage": "英语"
  },
  "tj-smith-stakes": {
    "nameOriginal": "T.J. Smith Stakes",
    "nameZh": "T.J. 史密斯锦标",
    "nameEn": "T.J. Smith Stakes",
    "originalLanguage": "英语"
  },
  "black-caviar-lightning": {
    "nameOriginal": "Black Caviar Lightning",
    "nameZh": "黑鱼子闪电锦标",
    "nameEn": "Black Caviar Lightning",
    "originalLanguage": "英语"
  },
  "oakleigh-plate": {
    "nameOriginal": "Oakleigh Plate",
    "nameZh": "奥克利盘",
    "nameEn": "Oakleigh Plate",
    "originalLanguage": "英语"
  },
  "newmarket-handicap": {
    "nameOriginal": "Newmarket Handicap",
    "nameZh": "新市场让赛",
    "nameEn": "Newmarket Handicap",
    "originalLanguage": "英语"
  },
  "william-reid-stakes": {
    "nameOriginal": "William Reid Stakes",
    "nameZh": "威廉里德锦标",
    "nameEn": "William Reid Stakes",
    "originalLanguage": "英语"
  },
  "robert-sangster-stakes": {
    "nameOriginal": "Robert Sangster Stakes",
    "nameZh": "罗伯特桑斯特锦标",
    "nameEn": "Robert Sangster Stakes",
    "originalLanguage": "英语"
  },
  "the-goodwood": {
    "nameOriginal": "The Goodwood",
    "nameZh": "古活锦标",
    "nameEn": "The Goodwood",
    "originalLanguage": "英语"
  },
  "aj-moir-stakes": {
    "nameOriginal": "A.J. Moir Stakes",
    "nameZh": "A.J. 莫伊尔锦标",
    "nameEn": "A.J. Moir Stakes",
    "originalLanguage": "英语"
  },
  "manikato-stakes": {
    "nameOriginal": "Manikato Stakes",
    "nameZh": "马尼卡托锦标",
    "nameEn": "Manikato Stakes",
    "originalLanguage": "英语"
  },
  "breeders-cup-classic": {
    "nameOriginal": "Breeders Cup Classic",
    "nameZh": "育马者杯经典赛",
    "nameEn": "Breeders Cup Classic",
    "originalLanguage": "英语"
  },
  "breeders-cup-distaff": {
    "nameOriginal": "Breeders Cup Distaff",
    "nameZh": "育马者杯雌马大赛",
    "nameEn": "Breeders Cup Distaff",
    "originalLanguage": "英语"
  },
  "breeders-cup-sprint": {
    "nameOriginal": "Breeders Cup Sprint",
    "nameZh": "育马者杯短途大赛",
    "nameEn": "Breeders Cup Sprint",
    "originalLanguage": "英语"
  },
  "breeders-cup-dirt-mile": {
    "nameOriginal": "Breeders Cup Dirt Mile",
    "nameZh": "育马者杯泥地一哩",
    "nameEn": "Breeders Cup Dirt Mile",
    "originalLanguage": "英语"
  },
  "breeders-cup-turf": {
    "nameOriginal": "Breeders Cup Turf",
    "nameZh": "育马者杯草地大赛",
    "nameEn": "Breeders Cup Turf",
    "originalLanguage": "英语"
  },
  "breeders-cup-mile": {
    "nameOriginal": "Breeders Cup Mile",
    "nameZh": "育马者杯一哩大赛",
    "nameEn": "Breeders Cup Mile",
    "originalLanguage": "英语"
  },
  "breeders-cup-turf-sprint": {
    "nameOriginal": "Breeders Cup Turf Sprint",
    "nameZh": "育马者杯草地短途",
    "nameEn": "Breeders Cup Turf Sprint",
    "originalLanguage": "英语"
  },
  "breeders-cup-filly-mare-turf": {
    "nameOriginal": "Breeders Cup Filly Mare Turf",
    "nameZh": "育马者杯雌马草地大赛",
    "nameEn": "Breeders Cup Filly Mare Turf",
    "originalLanguage": "英语"
  },
  "breeders-cup-filly-mare-sprint": {
    "nameOriginal": "Breeders Cup Filly Mare Sprint",
    "nameZh": "育马者杯雌马短途大赛",
    "nameEn": "Breeders Cup Filly Mare Sprint",
    "originalLanguage": "英语"
  },
  "breeders-cup-juvenile": {
    "nameOriginal": "Breeders Cup Juvenile",
    "nameZh": "育马者杯两岁大赛",
    "nameEn": "Breeders Cup Juvenile",
    "originalLanguage": "英语"
  },
  "breeders-cup-juvenile-fillies": {
    "nameOriginal": "Breeders Cup Juvenile Fillies",
    "nameZh": "育马者杯两岁雌马大赛",
    "nameEn": "Breeders Cup Juvenile Fillies",
    "originalLanguage": "英语"
  },
  "breeders-cup-juvenile-turf": {
    "nameOriginal": "Breeders Cup Juvenile Turf",
    "nameZh": "育马者杯两岁草地大赛",
    "nameEn": "Breeders Cup Juvenile Turf",
    "originalLanguage": "英语"
  },
  "breeders-cup-juvenile-fillies-turf": {
    "nameOriginal": "Breeders Cup Juvenile Fillies Turf",
    "nameZh": "育马者杯两岁雌马草地大赛",
    "nameEn": "Breeders Cup Juvenile Fillies Turf",
    "originalLanguage": "英语"
  },
  "breeders-cup-juvenile-turf-sprint": {
    "nameOriginal": "Breeders Cup Juvenile Turf Sprint",
    "nameZh": "育马者杯两岁草地短途",
    "nameEn": "Breeders Cup Juvenile Turf Sprint",
    "originalLanguage": "英语"
  },
  "melbourne-cup": {
    "nameOriginal": "Melbourne Cup",
    "nameZh": "墨尔本杯",
    "nameEn": "Melbourne Cup",
    "originalLanguage": "英语"
  },
  "dubai-world-cup": {
    "nameOriginal": "Dubai World Cup",
    "nameZh": "迪拜世界杯",
    "nameEn": "Dubai World Cup",
    "originalLanguage": "英语"
  },
  "dubai-sheema-classic": {
    "nameOriginal": "Dubai Sheema Classic",
    "nameZh": "迪拜司马经典赛",
    "nameEn": "Dubai Sheema Classic",
    "originalLanguage": "英语"
  },
  "dubai-turf": {
    "nameOriginal": "Dubai Turf",
    "nameZh": "迪拜草地大赛",
    "nameEn": "Dubai Turf",
    "originalLanguage": "英语"
  },
  "dubai-golden-shaheen": {
    "nameOriginal": "Dubai Golden Shaheen",
    "nameZh": "迪拜金莎轩锦标",
    "nameEn": "Dubai Golden Shaheen",
    "originalLanguage": "英语"
  },
  "al-quoz-sprint": {
    "nameOriginal": "Al Quoz Sprint",
    "nameZh": "阿乔斯短途锦标",
    "nameEn": "Al Quoz Sprint",
    "originalLanguage": "英语"
  },
  "centenary-sprint-cup": {
    "nameOriginal": "百周年纪念短途杯",
    "nameZh": "百周年纪念短途杯",
    "nameEn": "Centenary Sprint Cup",
    "originalLanguage": "中文"
  },
  "chairmans-sprint-prize": {
    "nameOriginal": "主席短途奖",
    "nameZh": "主席短途奖",
    "nameEn": "Chairmans Sprint Prize",
    "originalLanguage": "中文"
  },
  "hong-kong-stewards-cup": {
    "nameOriginal": "董事杯",
    "nameZh": "董事杯",
    "nameEn": "Hong Kong Stewards Cup",
    "originalLanguage": "中文"
  },
  "hong-kong-gold-cup": {
    "nameOriginal": "香港金杯",
    "nameZh": "香港金杯",
    "nameEn": "Hong Kong Gold Cup",
    "originalLanguage": "中文"
  },
  "queens-silver-jubilee-cup": {
    "nameOriginal": "女皇银禧纪念杯",
    "nameZh": "女皇银禧纪念杯",
    "nameEn": "Queens Silver Jubilee Cup",
    "originalLanguage": "中文"
  },
  "hong-kong-queen-elizabeth-ii-cup": {
    "nameOriginal": "女皇杯",
    "nameZh": "女皇杯",
    "nameEn": "Hong Kong Queen Elizabeth II Cup",
    "originalLanguage": "中文"
  },
  "champions-mile": {
    "nameOriginal": "冠军一哩赛",
    "nameZh": "冠军一哩赛",
    "nameEn": "Champions Mile",
    "originalLanguage": "中文"
  },
  "champions-chater-cup": {
    "nameOriginal": "冠军暨遮打杯",
    "nameZh": "冠军暨遮打杯",
    "nameEn": "Champions Chater Cup",
    "originalLanguage": "中文"
  },
  "hong-kong-sprint": {
    "nameOriginal": "香港短途锦标",
    "nameZh": "香港短途锦标",
    "nameEn": "Hong Kong Sprint",
    "originalLanguage": "中文"
  },
  "hong-kong-mile": {
    "nameOriginal": "香港一哩锦标",
    "nameZh": "香港一哩锦标",
    "nameEn": "Hong Kong Mile",
    "originalLanguage": "中文"
  },
  "hong-kong-cup": {
    "nameOriginal": "香港杯",
    "nameZh": "香港杯",
    "nameEn": "Hong Kong Cup",
    "originalLanguage": "中文"
  },
  "hong-kong-vase": {
    "nameOriginal": "香港瓶",
    "nameZh": "香港瓶",
    "nameEn": "Hong Kong Vase",
    "originalLanguage": "中文"
  }
};
  const CONDITION_RACE_CLASSES = ["new", "maiden", "one-win", "two-win", "three-win"];

  function normalizeMode(mode) {
    return mode === "original" ? "original" : "zh";
  }

  function isConditionRace(race) {
    return !!race && CONDITION_RACE_CLASSES.includes(race.raceClass);
  }

  function findRaceById(raceId) {
    if (!raceId || !Array.isArray(ns.Races)) return null;
    return ns.Races.find((race) => race && race.id === raceId) || null;
  }

  function applyRaceNameOverrides(races) {
    if (!Array.isArray(races)) return;
    races.forEach((race) => {
      if (!race) return;
      if (isConditionRace(race)) {
        const name = race.name || "";
        race.nameZh = race.nameZh || name;
        race.nameOriginal = race.nameOriginal || name;
        race.nameEn = race.nameEn || name;
        race.nameOriginalLanguage = race.nameOriginalLanguage || "\u4e2d\u6587";
        return;
      }
      const names = RACE_NAMES[race.id] || {};
      const nameZh = names.nameZh || race.nameZh || race.name || "";
      race.nameZh = nameZh;
      race.nameOriginal = names.nameOriginal || race.nameOriginal || nameZh;
      race.nameEn = names.nameEn || race.nameEn || race.nameOriginal || nameZh;
      race.nameOriginalLanguage = names.originalLanguage || race.nameOriginalLanguage || "";
      race.name = nameZh;
    });
  }

  function displayName(race, mode, fallback) {
    const source = race && race.id ? findRaceById(race.id) || race : race;
    const fallbackName = fallback || (source && (source.nameZh || source.name || source.nameOriginal)) || "";
    if (!source) return fallbackName;
    if (isConditionRace(source)) return source.nameZh || source.name || fallbackName;
    if (normalizeMode(mode) === "original") {
      return source.nameOriginal || source.nameZh || source.name || fallbackName;
    }
    return source.nameZh || source.name || source.nameOriginal || fallbackName;
  }

  applyRaceNameOverrides(ns.Races);

  ns.RaceNames = RACE_NAMES;
  ns.RaceNameRules = {
    CONDITION_RACE_CLASSES,
    normalizeMode,
    isConditionRace,
    findRaceById,
    applyRaceNameOverrides,
    displayName
  };
})();
