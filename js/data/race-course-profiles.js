/*
 * 赛程适性档案库（第二阶段）
 *
 * 这里保存的是“赛马场 + 表面 + 距离 + 路线”的稳定分类，而不是某一届赛事的实际步速。
 * 具名赛事优先挂到实际赛场；资料只写国家的生成条件赛使用明确标注的巡回赛场模板。
 * 所有补充档案均为低置信度Ⅰ级，可由后续资料直接替换。
 */
(function () {
  const ns = window.Keiba = window.Keiba || {};

  const VERSION = 'race-course-profiles-v1';
  const CLASSIFICATION_RULE_VERSION = 'track-aptitude-classification-v1';
  const CLASSIFICATION_SOURCE = 'user-provided-japanese-g1-baseline-2026-09-22';
  const CLASSIFICATION_ORDER = Object.freeze(['attrition', 'sustained', 'burst']);
  const DEFAULT_UNCERTAIN_INTENSITY = 1;
  const VALID_TYPES = new Set(['burst', 'sustained', 'attrition']);
  const VALID_INTENSITIES = new Set([1, 2]);
  const VALID_SURFACES = new Set(['草地', '泥地']);

  function confirmedProfile(spec) {
    return Object.freeze({
      status: 'confirmed',
      confidence: 'confirmed',
      classificationRuleVersion: CLASSIFICATION_RULE_VERSION,
      classificationSource: CLASSIFICATION_SOURCE,
      ...spec
    });
  }

  // 当前只录入用户已给出的日本中央 G1 参考路线。routeId 是赛道路线的一部分，不能省略。
  const confirmedProfiles = [
    confirmedProfile({ id: 'jp-tokyo-turf-1600-standard', trackId: 'tokyo', trackKey: 'tokyo', trackName: '东京', courseConfigId: 'jp:tokyo:turf:1600:standard', routeId: 'standard', routeName: '标准路线', surface: '草地', distance: 1600, type: 'burst', intensity: 1 }),
    confirmedProfile({ id: 'jp-tokyo-turf-2000-standard', trackId: 'tokyo', trackKey: 'tokyo', trackName: '东京', courseConfigId: 'jp:tokyo:turf:2000:standard', routeId: 'standard', routeName: '标准路线', surface: '草地', distance: 2000, type: 'burst', intensity: 2 }),
    confirmedProfile({ id: 'jp-tokyo-turf-2400-standard', trackId: 'tokyo', trackKey: 'tokyo', trackName: '东京', courseConfigId: 'jp:tokyo:turf:2400:standard', routeId: 'standard', routeName: '标准路线', surface: '草地', distance: 2400, type: 'burst', intensity: 1 }),
    confirmedProfile({ id: 'jp-tokyo-dirt-1600-standard', trackId: 'tokyo', trackKey: 'tokyo', trackName: '东京', courseConfigId: 'jp:tokyo:dirt:1600:standard', routeId: 'standard', routeName: '标准路线', surface: '泥地', distance: 1600, type: 'attrition', intensity: 2 }),
    confirmedProfile({ id: 'jp-nakayama-turf-1200-outer', trackId: 'nakayama', trackKey: 'nakayama', trackName: '中山', courseConfigId: 'jp:nakayama:turf:1200:outer', routeId: 'outer', routeName: '外回', surface: '草地', distance: 1200, type: 'attrition', intensity: 2 }),
    confirmedProfile({ id: 'jp-nakayama-turf-2000-inner', trackId: 'nakayama', trackKey: 'nakayama', trackName: '中山', courseConfigId: 'jp:nakayama:turf:2000:inner', routeId: 'inner', routeName: '内回', surface: '草地', distance: 2000, type: 'sustained', intensity: 2 }),
    confirmedProfile({ id: 'jp-nakayama-turf-2500-inner', trackId: 'nakayama', trackKey: 'nakayama', trackName: '中山', courseConfigId: 'jp:nakayama:turf:2500:inner', routeId: 'inner', routeName: '内回', surface: '草地', distance: 2500, type: 'sustained', intensity: 2 }),
    confirmedProfile({ id: 'jp-hanshin-turf-1600-outer', trackId: 'hanshin', trackKey: 'hanshin', trackName: '阪神', courseConfigId: 'jp:hanshin:turf:1600:outer', routeId: 'outer', routeName: '外回', surface: '草地', distance: 1600, type: 'burst', intensity: 1 }),
    confirmedProfile({ id: 'jp-hanshin-turf-2000-inner', trackId: 'hanshin', trackKey: 'hanshin', trackName: '阪神', courseConfigId: 'jp:hanshin:turf:2000:inner', routeId: 'inner', routeName: '内回', surface: '草地', distance: 2000, type: 'sustained', intensity: 2 }),
    confirmedProfile({ id: 'jp-hanshin-turf-2200-inner', trackId: 'hanshin', trackKey: 'hanshin', trackName: '阪神', courseConfigId: 'jp:hanshin:turf:2200:inner', routeId: 'inner', routeName: '内回', surface: '草地', distance: 2200, type: 'sustained', intensity: 2 }),
    confirmedProfile({ id: 'jp-kyoto-turf-1600-outer', trackId: 'kyoto', trackKey: 'kyoto', trackName: '京都', courseConfigId: 'jp:kyoto:turf:1600:outer', routeId: 'outer', routeName: '外回', surface: '草地', distance: 1600, type: 'sustained', intensity: 2 }),
    confirmedProfile({ id: 'jp-kyoto-turf-2000-inner', trackId: 'kyoto', trackKey: 'kyoto', trackName: '京都', courseConfigId: 'jp:kyoto:turf:2000:inner', routeId: 'inner', routeName: '内回', surface: '草地', distance: 2000, type: 'sustained', intensity: 1 }),
    confirmedProfile({ id: 'jp-kyoto-turf-2200-outer', trackId: 'kyoto', trackKey: 'kyoto', trackName: '京都', courseConfigId: 'jp:kyoto:turf:2200:outer', routeId: 'outer', routeName: '外回', surface: '草地', distance: 2200, type: 'sustained', intensity: 2 }),
    confirmedProfile({ id: 'jp-kyoto-turf-3000-outer', trackId: 'kyoto', trackKey: 'kyoto', trackName: '京都', courseConfigId: 'jp:kyoto:turf:3000:outer', routeId: 'outer', routeName: '外回', surface: '草地', distance: 3000, type: 'sustained', intensity: 2 }),
    confirmedProfile({ id: 'jp-kyoto-turf-3200-outer', trackId: 'kyoto', trackKey: 'kyoto', trackName: '京都', courseConfigId: 'jp:kyoto:turf:3200:outer', routeId: 'outer', routeName: '外回', surface: '草地', distance: 3200, type: 'sustained', intensity: 2 }),
    confirmedProfile({ id: 'jp-chukyo-turf-1200-standard', trackId: 'chukyo', trackKey: 'chukyo', trackName: '中京', courseConfigId: 'jp:chukyo:turf:1200:standard', routeId: 'standard', routeName: '标准路线', surface: '草地', distance: 1200, type: 'attrition', intensity: 2 }),
    confirmedProfile({ id: 'jp-chukyo-dirt-1800-standard', trackId: 'chukyo', trackKey: 'chukyo', trackName: '中京', courseConfigId: 'jp:chukyo:dirt:1800:standard', routeId: 'standard', routeName: '标准路线', surface: '泥地', distance: 1800, type: 'sustained', intensity: 1 })
  ];

  // 赛事只引用赛程档案；同路线赛事共用同一条档案，不在赛事上重复维护类型和等级。
  const profileIdByRaceId = Object.freeze({
    'february-stakes': 'jp-tokyo-dirt-1600-standard',
    'takamatsunomiya-kinen': 'jp-chukyo-turf-1200-standard',
    'osaka-hai': 'jp-hanshin-turf-2000-inner',
    'oka-sho': 'jp-hanshin-turf-1600-outer',
    'satsuki-sho': 'jp-nakayama-turf-2000-inner',
    'tenno-sho-haru': 'jp-kyoto-turf-3200-outer',
    'nhk-mile-cup': 'jp-tokyo-turf-1600-standard',
    'victoria-mile': 'jp-tokyo-turf-1600-standard',
    'yushun-himba': 'jp-tokyo-turf-2400-standard',
    'tokyo-yushun': 'jp-tokyo-turf-2400-standard',
    'yasuda-kinen': 'jp-tokyo-turf-1600-standard',
    'takarazuka-kinen': 'jp-hanshin-turf-2200-inner',
    'sprinters-stakes': 'jp-nakayama-turf-1200-outer',
    'shuka-sho': 'jp-kyoto-turf-2000-inner',
    'kikka-sho': 'jp-kyoto-turf-3000-outer',
    'tenno-sho-aki': 'jp-tokyo-turf-2000-standard',
    'queen-elizabeth-ii-cup': 'jp-kyoto-turf-2200-outer',
    'mile-championship': 'jp-kyoto-turf-1600-outer',
    'japan-cup': 'jp-tokyo-turf-2400-standard',
    'champions-cup': 'jp-chukyo-dirt-1800-standard',
    'hanshin-juvenile-fillies': 'jp-hanshin-turf-1600-outer',
    'asahi-hai-fs': 'jp-hanshin-turf-1600-outer',
    'hopeful-stakes': 'jp-nakayama-turf-2000-inner',
    'arima-kinen': 'jp-nakayama-turf-2500-inner'
  });

  // 原始赛事库较早建立，部分日本赛事只写了“京都芝1600”等笼统路线。
  // 此表只收录能由 JRA 官方比赛页或正式节目表核实内／外回的稳定赛事；
  // 不能核实的赛事仍保持 ambiguous，不以赛事名称或距离猜测。
  const courseRouteByRaceId = Object.freeze({
    'yomiuri-milers-cup': 'outer',
    'swan-stakes': 'outer',
    'daily-hai-nisai-stakes': 'outer',
    'kyoto-kimpai': 'outer',
    'shinzan-kinen': 'outer',
    'hankyu-hai': 'inner',
    'niigata-daishoten': 'outer',
    'niigata-kinen': 'outer',
    'fantasy-stakes': 'outer',
    'kobai-stakes': 'outer',
    'tachibana-stakes': 'outer',
    'elfin-stakes': 'outer',
    'rakuyo-stakes': 'outer'
  });

  const courseRouteSourceByRaceId = Object.freeze({
    'yomiuri-milers-cup': 'https://www.jra.go.jp/datafile/seiseki/replay/2026/045.html',
    'swan-stakes': 'https://www.jra.go.jp/datafile/seiseki/replay/2025/094.html',
    'daily-hai-nisai-stakes': 'https://www.jra.go.jp/datafile/seiseki/replay/2025/104.html',
    'kyoto-kimpai': 'https://www.jra.go.jp/keiba/program/pdf/h24-jusyo_kansai.pdf',
    'shinzan-kinen': 'https://www.jra.go.jp/keiba/thisweek/2026/0112_1/race.html',
    'hankyu-hai': 'https://www.jra.go.jp/keiba/thisweek/2026/0221_2/race.html',
    'niigata-daishoten': 'https://www.jra.go.jp/keiba/thisweek/2025/0517_2/race.html',
    'niigata-kinen': 'https://www.jra.go.jp/datafile/seiseki/replay/2025/pdf/077.pdf',
    'fantasy-stakes': 'https://www.jra.go.jp/keiba/program/2026/pdf/jusyo_kansai.pdf',
    'kobai-stakes': 'https://www.jra.go.jp/datafile/seiseki/report/2026/2026-1kyoto6.pdf',
    'tachibana-stakes': 'https://www.jra.go.jp/keiba/program/2026/pdf/listed.pdf',
    'elfin-stakes': 'https://www.jra.go.jp/keiba/rpdf/pdf/20260207-02kyoto03.pdf',
    'rakuyo-stakes': 'https://www.jra.go.jp/datafile/seiseki/report/2026/2026-2kyoto5.pdf'
  });

  // 海外赛事先由已核实的实际举办地建立路线档案。这里是“马场键”的初判，
  // 不按国家直接分类；所有此表产生的档案均为低置信度Ⅰ级，供后续逐场复核。
  const venueTurfTypeByTrackKey = Object.freeze({
    'santa-anita': 'burst', 'del-mar': 'burst', keeneland: 'burst', 'churchill-downs': 'burst', belmont: 'burst', aqueduct: 'burst', saratoga: 'burst', gulfstream: 'burst', monmouth: 'burst', colonial: 'burst', laurel: 'burst', 'penn-national': 'burst',
    'kentucky-downs': 'sustained',
    musselburgh: 'sustained', 'bordeaux-le-bouscat': 'sustained',
    ascot: 'sustained', epsom: 'sustained', newmarket: 'sustained', goodwood: 'sustained', sandown: 'sustained', haydock: 'sustained',
    york: 'burst', doncaster: 'burst', newbury: 'burst',
    longchamp: 'burst', chantilly: 'burst', deauville: 'burst', 'saint-cloud': 'sustained',
    curragh: 'sustained', leopardstown: 'sustained', cork: 'sustained', naas: 'sustained', navan: 'sustained', tipperary: 'sustained', roscommon: 'sustained', gowran: 'sustained',
    hamburg: 'sustained', baden: 'sustained', hoppegarten: 'sustained', cologne: 'sustained', munich: 'sustained', dusseldorf: 'sustained',
    'san-siro': 'sustained', capannelle: 'sustained'
  });

  const venueDirtTrackKeys = new Set([
    'santa-anita', 'del-mar', 'keeneland', 'churchill-downs', 'belmont', 'aqueduct', 'saratoga', 'gulfstream', 'oaklawn', 'fair-grounds', 'laurel', 'pimlico', 'monmouth', 'parx', 'penn-national', 'remington', 'sunland', 'los-alamitos', 'indianapolis'
  ]);

  // 第二批赛场目录：路线粒度暂统一为 standard，内／外回留待将来有必要时拆分。
  // 这里的实际场地来源于赛事主办方或赛场资料；没有唯一举办地的生成条件赛只会使用
  // 名称中明确写出的“巡回赛场模板”，绝不把国家名称伪装为真实马场。
  const supplementalTracks = Object.freeze({
    musselburgh: { name: 'Musselburgh', aliases: ['穆塞尔堡'], sourceUrl: 'https://www.musselburgh-racecourse.co.uk/news-story/musselburgh-boosts-flat-season-with-new-80000-goliath-cup-listed-staying-race--revamped-easter-saturday-meeting-now-exceeds-300000-prize-money' },
    'bordeaux-le-bouscat': { name: 'Bordeaux-Le Bouscat', aliases: ['波尔多勒布斯卡'], sourceUrl: 'https://www.france-galop.com/sites/default/files/inline-files/24agenda08_new.pdf' },
    kawasaki: { name: '川崎', family: 'local-dirt', sourceUrl: 'https://www.nankankeiba.com/course_info/21.do' },
    funabashi: { name: '船桥', family: 'local-dirt', sourceUrl: 'https://www.nankankeiba.com/course_info/' },
    oi: { name: '大井', family: 'local-dirt', sourceUrl: 'https://www.nankankeiba.com/info/download/2025/pdf/fy2025_nankanjushobook.pdf' },
    kochi: { name: '高知', family: 'local-dirt', sourceUrl: 'https://www.keiba.or.jp/?p=course' },
    kanazawa: { name: '金泽', family: 'local-dirt', sourceUrl: 'https://www.kanazawakeiba.com/racecourse/' },
    monbetsu: { name: '门别', family: 'local-dirt', sourceUrl: 'https://www.hokkaidokeiba.net/racecourse/' },
    nagoya: { name: '名古屋', family: 'local-dirt', sourceUrl: 'https://www.nagoyakeiba.com/racecourse/' },
    urawa: { name: '浦和', family: 'local-dirt', sourceUrl: 'https://www.nankankeiba.com/course_info/' },
    morioka: { name: '盛冈', family: 'local-dirt', sourceUrl: 'https://www.iwatekeiba.or.jp/racecourse' },
    sonoda: { name: '园田', family: 'local-dirt', sourceUrl: 'https://www.sonoda-himeji.jp/racecourse/' },
    saga: { name: '佐贺', family: 'local-dirt', sourceUrl: 'https://www.sagakeiba.net/racecourse/' },
    'jbc-rotating': { name: 'JBC地方交流轮换赛场', family: 'local-dirt', sourceUrl: '', template: true },
    'sha-tin': { name: '沙田', family: 'sha-tin', sourceUrl: 'https://racing.hkjc.com/racing/english/racing-info/racing_course.asp' },
    flemington: { name: 'Flemington', aliases: ['弗莱明顿'], family: 'flemington', sourceUrl: 'https://www.racingvictoria.com.au/racing/feature-race-conditions' },
    'moonee-valley': { name: 'Moonee Valley', aliases: ['满利谷'], family: 'moonee-valley', sourceUrl: 'https://www.racingvictoria.com.au/racing/feature-race-conditions' },
    caulfield: { name: 'Caulfield', aliases: ['考菲尔德'], family: 'caulfield', sourceUrl: 'https://www.racingvictoria.com.au/racing/feature-race-conditions' },
    randwick: { name: 'Randwick', aliases: ['兰德威克'], family: 'randwick', sourceUrl: 'https://www.racingnsw.com.au/' },
    rosehill: { name: 'Rosehill', aliases: ['玫瑰岗'], family: 'rosehill', sourceUrl: 'https://www.racingnsw.com.au/' },
    morphettville: { name: 'Morphettville', aliases: ['莫菲特维尔'], family: 'morphettville', sourceUrl: 'https://www.racing.com/' },
    meydan: { name: 'Meydan', aliases: ['美丹'], family: 'meydan', sourceUrl: 'https://dubairacingclub.com/' },
    'king-abdulaziz': { name: 'King Abdulaziz Racecourse', aliases: ['阿卜杜勒阿齐兹国王赛马场'], family: 'saudi', sourceUrl: 'https://jcsa.sa/en' },
    'san-isidro': { name: 'San Isidro', aliases: ['圣伊西德罗'], family: 'san-isidro', sourceUrl: 'https://hipodromosanisidro.com/' },
    'us-circuit-turf': { name: '北美草地巡回赛场', family: 'us-circuit-turf', sourceUrl: '', template: true },
    'us-circuit-dirt': { name: '北美泥地巡回赛场', family: 'us-circuit-dirt', sourceUrl: '', template: true },
    'europe-circuit-ireland': { name: '爱尔兰草地巡回赛场', family: 'europe-circuit', sourceUrl: '', template: true },
    'europe-circuit-germany': { name: '德国草地巡回赛场', family: 'europe-circuit', sourceUrl: '', template: true },
    'europe-circuit-france': { name: '法国草地巡回赛场', family: 'europe-circuit', sourceUrl: '', template: true },
    'europe-circuit-italy': { name: '意大利草地巡回赛场', family: 'europe-circuit', sourceUrl: '', template: true },
    'europe-circuit-britain': { name: '英国草地巡回赛场', family: 'europe-circuit', sourceUrl: '', template: true }
  });

  const supplementalTrackByCourse = Object.freeze({
    '川崎': 'kawasaki', '船桥': 'funabashi', '大井': 'oi', '高知': 'kochi', '金泽': 'kanazawa',
    '门别': 'monbetsu', '名古屋': 'nagoya', '浦和': 'urawa', '盛冈': 'morioka', '园田': 'sonoda', '佐贺': 'saga'
  });

  const supplementalTrackByRaceId = Object.freeze({
    'tokyo-daishoten': 'oi',
    'jbc-classic': 'jbc-rotating', 'jbc-sprint': 'jbc-rotating', 'jbc-ladies-classic': 'jbc-rotating',
    'gran-premio-san-isidro': 'san-isidro', 'gran-premio-joaquin-s-de-anchorena': 'san-isidro',
    'black-caviar-lightning': 'flemington', 'aj-moir-stakes': 'moonee-valley', 'oakleigh-plate': 'caulfield',
    'golden-slipper-stakes': 'rosehill', 'the-everest': 'randwick', 'tj-smith-stakes': 'randwick',
    'newmarket-handicap': 'flemington', 'william-reid-stakes': 'moonee-valley', 'robert-sangster-stakes': 'morphettville',
    'the-goodwood': 'morphettville', 'manikato-stakes': 'moonee-valley', 'doncaster-mile': 'randwick',
    'queen-elizabeth-stakes-aus': 'randwick', 'cox-plate': 'moonee-valley', 'caulfield-cup': 'caulfield',
    'victoria-derby': 'flemington', 'melbourne-cup': 'flemington',
    'blue-point-sprint': 'king-abdulaziz', 'neom-turf-cup': 'king-abdulaziz', 'red-sea-turf-handicap': 'king-abdulaziz',
    'saudi-derby': 'king-abdulaziz', 'saudi-cup': 'king-abdulaziz',
    'al-quoz-sprint': 'meydan', 'al-fahidi-fort': 'meydan', 'cape-verdi': 'meydan', 'jebel-hatta': 'meydan',
    'dubai-turf': 'meydan', 'singspiel-stakes': 'meydan', 'dubai-sheema-classic': 'meydan', 'dubai-city-of-gold': 'meydan',
    'dubai-golden-shaheen': 'meydan', 'uae-2000-guineas': 'meydan', 'firebreak-stakes': 'meydan',
    'al-maktoum-challenge': 'meydan', 'uae-derby': 'meydan', 'dubai-world-cup': 'meydan',
    'europe-listed-prix-andre-baboin': 'bordeaux-le-bouscat', 'europe-listed-goliath-cup-stakes': 'musselburgh'
  });

  // 届次举办地组与主席模式的 BC 采用同一模型：同组赛事在同一年共用实际赛场，
  // 已公布届次优先使用官方举办地；未来届次按低置信度模拟轮换表选择，且可由年度覆写替换。
  const venueGroups = Object.freeze({
    jbc: Object.freeze({
      id: 'jbc',
      name: 'JBC',
      mode: 'cycle',
      startYear: 2027,
      trackKeys: Object.freeze(['oi', 'funabashi', 'kawasaki', 'morioka', 'nagoya', 'saga', 'kanazawa']),
      yearOverrides: Object.freeze({ 2024: 'saga', 2025: 'funabashi', 2026: 'kanazawa' }),
      // JBC 的各组赛事会随举办地改变发走距离。这里只收录已有官方资料可核对的届次；
      // 未来届次先沿用赛事库基准距离，待主办方公布后再补充年度覆写。
      raceOverridesByYear: Object.freeze({
        2026: Object.freeze({
          'jbc-classic': Object.freeze({ distance: 2100 }),
          'jbc-sprint': Object.freeze({ distance: 1400 }),
          'jbc-ladies-classic': Object.freeze({ distance: 1500 })
        })
      }),
      sourceUrls: Object.freeze({
        2024: 'https://www.sagakeiba.net/news/2024/11/05/510205/',
        2025: 'https://www.keiba.go.jp/jbc2025/lib/img/racingprogram.pdf',
        2026: 'https://www.keiba.go.jp/jbc2026/detail/'
      }),
      fallbackTrackKey: 'jbc-rotating'
    })
  });

  const venueGroupIdByRaceId = Object.freeze({
    'jbc-classic': 'jbc',
    'jbc-sprint': 'jbc',
    'jbc-ladies-classic': 'jbc'
  });

  // 生成器、档案库和审计共用同一份 JRA 官方路线目录，避免各自维护距离表。
  const JRA_COURSE_IDENTITIES = ns.JraCourseCatalogue?.identities;
  if (!JRA_COURSE_IDENTITIES) throw new Error('赛程适性档案需要先加载 JRA 赛程目录。');

  function provisionalClassification(trackKey, surface, routeId, distance) {
    if (trackKey === 'tokyo') {
      if (surface === '草地') return { type: 'burst', intensity: 1, reason: '长直线、宽阔弯道和较晚决胜空间，按瞬发Ⅰ初判。' };
      return distance <= 1600
        ? { type: 'attrition', intensity: 1, reason: '短至一哩的砂地先行压力较高，按消耗Ⅰ初判。' }
        : { type: 'sustained', intensity: 1, reason: '较长砂地路线更接近持续输出，按持久Ⅰ初判。' };
    }
    if (trackKey === 'nakayama') {
      if (surface === '草地' && distance <= 1200) return { type: 'attrition', intensity: 1, reason: '短直线和较早位置争夺，按消耗Ⅰ初判。' };
      if (surface === '泥地' && distance <= 1200) return { type: 'attrition', intensity: 1, reason: '短直线砂地的早段压力，按消耗Ⅰ初判。' };
      return { type: 'sustained', intensity: 1, reason: '短直线、紧弯与较早提速倾向，按持久Ⅰ初判。' };
    }
    if (trackKey === 'hanshin') {
      if (surface === '草地' && routeId === 'outer') return { type: 'burst', intensity: 1, reason: '外回大弯与长直线保留较晚决胜空间，按瞬发Ⅰ初判。' };
      if (surface === '泥地' && distance <= 1400) return { type: 'attrition', intensity: 1, reason: '短砂地路线的早段位置压力，按消耗Ⅰ初判。' };
      return { type: 'sustained', intensity: 1, reason: '内回或较长砂地路线需要较早持续提速，按持久Ⅰ初判。' };
    }
    if (trackKey === 'kyoto') {
      if (surface === '泥地' && distance <= 1400) return { type: 'attrition', intensity: 1, reason: '短砂地路线的早段位置压力，按消耗Ⅰ初判。' };
      return { type: 'sustained', intensity: 1, reason: '三角坂和其后持续提速倾向，按持久Ⅰ初判。' };
    }
    if (trackKey === 'chukyo') {
      if (distance <= 1400) return { type: 'attrition', intensity: 1, reason: '短途路线的早段压力，按消耗Ⅰ初判。' };
      return { type: 'sustained', intensity: 1, reason: '长直线、起伏和持续输出要求，按持久Ⅰ初判。' };
    }
    if (trackKey === 'niigata') {
      if (surface === '草地' && (routeId === 'straight' || routeId === 'outer')) return { type: 'burst', intensity: 1, reason: '直线或外回路线通常保留末段决胜，按瞬发Ⅰ初判。' };
      if (surface === '泥地' && distance <= 1200) return { type: 'attrition', intensity: 1, reason: '短砂地路线的早段位置压力，按消耗Ⅰ初判。' };
      return { type: 'sustained', intensity: 1, reason: '内回或较长砂地路线按持久Ⅰ初判。' };
    }
    if (trackKey === 'sapporo' || trackKey === 'hakodate' || trackKey === 'fukushima' || trackKey === 'kokura') {
      if (distance <= 1200) return { type: 'attrition', intensity: 1, reason: '小回或短直线的短途路线容易较早形成压力，按消耗Ⅰ初判。' };
      return { type: 'sustained', intensity: 1, reason: '小回或短直线路线较难等到最后短冲刺，按持久Ⅰ初判。' };
    }
    throw new Error(`缺少 ${trackKey} 的赛程初判模板。`);
  }

  function profileSignature(trackKey, surface, distance, routeId) {
    return [trackKey, surface, distance, routeId].join('|');
  }

  function buildProvisionalJraProfiles() {
    const confirmed = new Set(confirmedProfiles.map((profile) => profileSignature(profile.trackKey, profile.surface, profile.distance, profile.routeId)));
    const surfaceCode = { '草地': 'turf', '泥地': 'dirt' };
    const rows = [];
    Object.entries(JRA_COURSE_IDENTITIES).forEach(([trackName, identity]) => {
      Object.entries(identity.routes).forEach(([surface, routeMap]) => {
        Object.entries(routeMap).forEach(([routeId, distances]) => {
          distances.forEach((distance) => {
            if (confirmed.has(profileSignature(identity.trackKey, surface, distance, routeId))) return;
            const classification = provisionalClassification(identity.trackKey, surface, routeId, distance);
            rows.push(Object.freeze({
              id: `jp-${identity.trackKey}-${surfaceCode[surface]}-${distance}-${routeId}`,
              trackId: identity.trackKey,
              trackKey: identity.trackKey,
              trackName,
              courseConfigId: `jp:${identity.trackKey}:${surfaceCode[surface]}:${distance}:${routeId}`,
              routeId,
              routeName: { standard: '标准路线', inner: '内回', outer: '外回', straight: '直线' }[routeId],
              surface,
              distance,
              type: classification.type,
              intensity: classification.intensity,
              status: 'provisional',
              confidence: 'low',
              classificationRuleVersion: CLASSIFICATION_RULE_VERSION,
              classificationSource: 'jra-course-layout-initial-review-2026-09-22',
              classificationReason: classification.reason,
              sourceUrl: identity.sourceUrl
            }));
          });
        });
      });
    });
    return rows;
  }

  const profiles = [];
  const profileById = new Map();
  const profileBySignature = new Map();
  let chairmanVenueIndexOwner = null;
  let chairmanVenueIndex = new Map();
  function registerProfile(profile) {
    if (profileById.has(profile.id)) {
      throw new Error(`重复的赛程适性档案 ID：${profile.id}`);
    }
    if (!profile.trackId || !profile.courseConfigId || !profile.routeId || !VALID_SURFACES.has(profile.surface) ||
        !Number.isFinite(profile.distance) || profile.distance <= 0 || !VALID_TYPES.has(profile.type) || !VALID_INTENSITIES.has(profile.intensity)) {
      throw new Error(`无效的赛程适性档案：${profile.id}`);
    }
    profileById.set(profile.id, profile);
    const signature = profileSignature(profile.trackKey, profile.surface, profile.distance, profile.routeId);
    if (profileBySignature.has(signature)) throw new Error(`重复的赛程适性档案身份：${signature}`);
    profileBySignature.set(signature, profile);
    profiles.push(profile);
    return profile;
  }

  [...confirmedProfiles, ...buildProvisionalJraProfiles()].forEach(registerProfile);

  function get(profileId) {
    return profileById.get(profileId) || null;
  }

  function mappedProfileId(race) {
    return profileIdByRaceId[race && (race.sourceId || race.id)] || '';
  }

  function routeOverrideId(race) {
    return courseRouteByRaceId[race && (race.sourceId || race.id)] || '';
  }

  function routeSourceUrl(race) {
    return courseRouteSourceByRaceId[race && (race.sourceId || race.id)] || '';
  }

  // 原始比赛库仍由旧引擎读取，第二阶段不在载入时写回字段。
  // 已人工确认的赛事可从共享档案反查路线，使身份审计与正式物化使用同一真值。
  function declaredRouteId(race) {
    if (race && typeof race.courseRouteId === 'string' && race.courseRouteId) return race.courseRouteId;
    const mapped = get(mappedProfileId(race));
    return mapped ? mapped.routeId : routeOverrideId(race);
  }

  // 自定义主席赛事、虚构赛场，以及尚未核实实体举办地的既有赛事都不需要另走一套
  // 规则。优先使用稳定 trackId／trackKey；若资料只到赛区层级，则明确挂接“待核实
  // 巡回赛场模板”，而不是把国家适性重新塞回赛马资料。之后可以直接替换为实体赛场。
  function fallbackProfileForCustomRace(race) {
    if (!race || !VALID_SURFACES.has(race.surface) || !Number.isFinite(race.distance)) return null;
    const fallbackArea = `${race.surfaceRegion || race.region || 'unknown'}-${race.course || 'circuit'}-${race.surface}`;
    const rawKey = race.trackKey || race.trackId || fallbackArea;
    const trackKey = `custom-${String(rawKey).trim().replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'track'}`;
    const routeId = race.courseRouteId || 'standard';
    const surfaceCode = race.surface === '草地' ? 'turf' : 'dirt';
    const id = `venue-${trackKey}-${surfaceCode}-${race.distance}-${routeId}`;
    const existing = get(id);
    if (existing) return existing;
    const classification = race.surface === '泥地'
      ? (race.distance <= 1400
        ? { type: 'attrition', reason: '虚构或自定义泥地短途路线，按早段压力作消耗Ⅰ暂定。' }
        : { type: 'sustained', reason: '虚构或自定义泥地中长路线，按持续输出作持久Ⅰ暂定。' })
      : { type: 'burst', reason: '虚构或自定义草地路线，在缺少结构资料时按瞬发Ⅰ暂定。' };
    return registerProfile(Object.freeze({
      id,
      trackId: String(rawKey),
      trackKey,
      trackName: race.trackName || race.courseName || `${race.surfaceRegion || '未知地区'}待核实巡回赛场`,
      courseConfigId: `custom:${trackKey}:${surfaceCode}:${race.distance}:${routeId}`,
      routeId,
      routeName: race.courseRouteName || '标准路线',
      surface: race.surface,
      distance: race.distance,
      type: classification.type,
      intensity: 1,
      status: 'provisional',
      confidence: 'low',
      classificationRuleVersion: CLASSIFICATION_RULE_VERSION,
      classificationSource: race.trackKey || race.trackId ? 'custom-track-fallback-v1' : 'unresolved-venue-circuit-template-v1',
      classificationReason: classification.reason,
      sourceUrl: ''
    }));
  }

  function profileIdForRace(race, options = {}) {
    if (!race || typeof race !== 'object') return '';
    const target = effectiveRaceForOptions(race, options);
    if (typeof target.courseProfileId === 'string' && target.courseProfileId) return target.courseProfileId;
    const mapped = mappedProfileId(target);
    if (mapped) return mapped;
    const identity = resolveCourseIdentity(target, options);
    if (identity.status === 'resolved') {
      const existing = profileBySignature.get(profileSignature(identity.trackKey, target.surface, target.distance, identity.routeId));
      if (existing) return existing.id;
      return identity.collapsedRoutes ? collapsedJraProfileForRace(target, identity)?.id || '' : '';
    }
    if (identity.status === 'venue-resolved') return venueProfileForRace(target, options)?.id || '';
    return fallbackProfileForCustomRace(target)?.id || '';
  }

  function resolveForRace(race, options = {}) {
    const id = profileIdForRace(race, options);
    return id ? get(id) : null;
  }

  function resolveForEdition(race, year) {
    return resolveForRace(race, { year });
  }

  function collapsedJraProfileForRace(race, identity) {
    const surfaceCode = race.surface === '草地' ? 'turf' : 'dirt';
    const id = `jp-${identity.trackKey}-${surfaceCode}-${race.distance}-standard`;
    const existing = get(id);
    if (existing) return existing;
    const trackName = Object.entries(JRA_COURSE_IDENTITIES).find(([, value]) => value.trackKey === identity.trackKey)?.[0] || identity.trackKey;
    const classification = provisionalClassification(identity.trackKey, race.surface, 'standard', race.distance);
    return registerProfile(Object.freeze({
      id,
      trackId: identity.trackKey,
      trackKey: identity.trackKey,
      trackName,
      courseConfigId: `jp:${identity.trackKey}:${surfaceCode}:${race.distance}:standard`,
      routeId: 'standard',
      routeName: '标准路线',
      surface: race.surface,
      distance: race.distance,
      type: classification.type,
      intensity: 1,
      status: 'provisional',
      confidence: 'low',
      classificationRuleVersion: CLASSIFICATION_RULE_VERSION,
      classificationSource: 'jra-route-granularity-collapsed-2026-09-22',
      classificationReason: '当前阶段忽略内／外回，按赛场、表面与距离建立标准路线低置信度Ⅰ级档案。',
      sourceUrl: identity.sourceUrl
    }));
  }

  function routeLabel(profile) {
    return profile ? `${profile.trackName}${profile.surface}${profile.distance}m${profile.routeName}` : '';
  }

  function routeOptions(identity, surface, distance) {
    if (!identity || !identity.routes || !identity.routes[surface]) return [];
    return Object.entries(identity.routes[surface])
      .filter(([, distances]) => distances.includes(distance))
      .map(([routeId]) => routeId);
  }

  function knownChairmanVenue(race) {
    const venues = ns.ChairmanVenues;
    if (!venues || typeof venues.catalogue !== 'function') return null;
    if (chairmanVenueIndexOwner !== venues) {
      chairmanVenueIndexOwner = venues;
      chairmanVenueIndex = new Map();
      venues.catalogue().forEach((entry) => {
        if (entry.status === 'confirmed' && entry.venueKey) chairmanVenueIndex.set(entry.sourceId, entry);
      });
    }
    return chairmanVenueIndex.get(race && (race.sourceId || race.id)) || null;
  }

  function venueGroupForRace(race) {
    return venueGroups[venueGroupIdByRaceId[race && (race.sourceId || race.id)]] || null;
  }

  function resolveVenueForRace(race, year) {
    const group = venueGroupForRace(race);
    if (!group || !Number.isInteger(year)) return null;
    const sourceId = race && (race.sourceId || race.id);
    const selectedKey = group.yearOverrides[year] || (year >= group.startYear
      ? group.trackKeys[(year - group.startYear) % group.trackKeys.length]
      : group.fallbackTrackKey);
    const track = supplementalTracks[selectedKey];
    if (!track) return null;
    const raceOverride = group.raceOverridesByYear?.[year]?.[sourceId] || null;
    return Object.freeze({
      groupId: group.id,
      groupName: group.name,
      venueKey: selectedKey,
      courseName: track.name,
      sourceUrl: group.sourceUrls[year] || track.sourceUrl || '',
      family: track.family,
      template: !!track.template,
      year,
      mode: group.mode,
      source: group.yearOverrides[year] ? 'official-year-override' : 'simulation-cycle',
      raceOverride: raceOverride ? Object.freeze({ ...raceOverride }) : null
    });
  }

  // 返回用于某一届比赛的独立快照。赛事原型仍保留基准距离，避免未来届次在
  // 主办方尚未发布条件时被旧届次资料污染；需要落库时应对这个快照调用 applyToRace。
  function resolveEditionRace(race, year) {
    if (!race || !Number.isInteger(year)) return race;
    const venue = resolveVenueForRace(race, year);
    if (!venue || !venue.raceOverride) return race;
    return {
      ...race,
      ...venue.raceOverride,
      venueGroupId: venue.groupId,
      venueYear: venue.year,
      venueTrackKey: venue.venueKey
    };
  }

  function effectiveRaceForOptions(race, options = {}) {
    return Number.isInteger(options.year) ? resolveEditionRace(race, options.year) : race;
  }

  function supplementalVenueForRace(race) {
    if (!race) return null;
    const sourceId = race.sourceId || race.id;
    let venueKey = supplementalTrackByRaceId[sourceId] || '';
    if (!venueKey && race.surfaceRegion === '日本') venueKey = supplementalTrackByCourse[race.course] || '';
    if (!venueKey && race.surfaceRegion === '香港') venueKey = 'sha-tin';
    if (!venueKey && /^america-(maiden|low)-/.test(sourceId)) venueKey = race.surface === '泥地' ? 'us-circuit-dirt' : 'us-circuit-turf';
    if (!venueKey && /^europe-(maiden|low)-/.test(sourceId)) {
      const country = { '爱尔兰': 'ireland', '德国': 'germany', '法国': 'france', '意大利': 'italy', '英国': 'britain' }[race.course];
      if (country) venueKey = `europe-circuit-${country}`;
    }
    const track = supplementalTracks[venueKey];
    if (!track) return null;
    return { venueKey, courseName: track.name, sourceUrl: track.sourceUrl, family: track.family, template: !!track.template, status: track.template ? 'template' : 'confirmed' };
  }

  function knownVenue(race, options = {}) {
    return resolveVenueForRace(race, options.year) || knownChairmanVenue(race) || supplementalVenueForRace(race);
  }

  function venueRouteId(venue) {
    if (venue.courseName === 'July Course') return 'july';
    if (venue.courseName === 'Rowley Mile') return 'rowley';
    return 'standard';
  }

  function venueClassification(venue, race) {
    if (venue.family) {
      const fixedType = {
        'us-circuit-turf': 'burst', flemington: 'burst', randwick: 'burst', 'san-isidro': 'burst',
        'moonee-valley': 'sustained', caulfield: 'sustained', rosehill: 'sustained', morphettville: 'sustained', saudi: 'sustained'
      }[venue.family];
      if (fixedType) return { type: fixedType, reason: venue.template
        ? '该巡回赛场模板的赛道结构设定为末段决胜或持续高速竞争，按低置信度Ⅰ级初判。'
        : '该实体赛场的初步路线结构判断，按低置信度Ⅰ级初判。' };
      if (venue.family === 'local-dirt' || venue.family === 'us-circuit-dirt') return race.distance <= 1400
        ? { type: 'attrition', reason: venue.template ? '北美泥地短途巡回赛场模板设定为早段持续压力，按消耗Ⅰ初判。' : '地方砂地短途路线更容易较早形成位置压力，按消耗Ⅰ初判。' }
        : { type: 'sustained', reason: venue.template ? '北美泥地两弯巡回赛场模板设定为连续高速输出，按持久Ⅰ初判。' : '地方砂地中长路线按持续输出要求，按持久Ⅰ初判。' };
      if (venue.family === 'europe-circuit') return race.distance <= 1200
        ? { type: 'attrition', reason: '欧洲草地短途巡回赛场模板设定为早段持续压力，按消耗Ⅰ初判。' }
        : { type: 'sustained', reason: '欧洲草地标准巡回赛场模板设定为持续高速竞争，按持久Ⅰ初判。' };
      if (venue.family === 'sha-tin') return race.distance <= 1200
        ? { type: 'attrition', reason: '沙田短途路线按早段位置压力，作消耗Ⅰ初判。' }
        : { type: 'burst', reason: '沙田草地长直线与较晚决胜空间，按瞬发Ⅰ初判。' };
      if (venue.family === 'meydan') {
        if (race.surface === '草地') return { type: 'burst', reason: '美丹草地路线按末段能力兑现，作瞬发Ⅰ初判。' };
        return race.distance <= 1200
          ? { type: 'attrition', reason: '美丹泥地短途按早段压力，作消耗Ⅰ初判。' }
          : { type: 'sustained', reason: '美丹泥地中长路线按持续输出，作持久Ⅰ初判。' };
      }
    }
    if (race.surface === '泥地') {
      if (!venueDirtTrackKeys.has(venue.venueKey)) return null;
      return race.distance <= 1400
        ? { type: 'attrition', reason: '该实体砂地马场的短途路线以早段位置与持续压力为主，按消耗Ⅰ低置信度初判。' }
        : { type: 'sustained', reason: '该实体砂地马场的中长路线以连续高速输出为主，按持久Ⅰ低置信度初判。' };
    }
    let type = venueTurfTypeByTrackKey[venue.venueKey];
    if (!type) return null;
    if (venue.venueKey === 'newmarket' && venue.courseName === 'July Course') type = 'burst';
    if (race.distance <= 1200 && ['ascot', 'curragh', 'goodwood', 'sandown', 'haydock'].includes(venue.venueKey)) type = 'attrition';
    const reason = type === 'burst'
      ? '该实体草地路线的主要胜负更接近末段能力兑现，按瞬发Ⅰ低置信度初判。'
      : type === 'attrition'
        ? '该实体草地短途路线通常较早形成位置压力，按消耗Ⅰ低置信度初判。'
        : '该实体草地路线更接近提前发动后的持续高速竞争，按持久Ⅰ低置信度初判。';
    return { type, reason };
  }

  function venueProfileForRace(race, options = {}) {
    const venue = race.surfaceRegion === '日本'
      ? resolveVenueForRace(race, options.year) || supplementalVenueForRace(race)
      : knownVenue(race, options);
    if (!venue) return null;
    return venueProfileForVenue(race, venue);
  }

  // 主席模式的轮换赛事在解析后会带有实际 trackKey。这里按实际举办地建档，
  // 不沿用来源赛事的档案；同一届同一赛场因此必定使用同一条赛程属性。
  function venueForTrackKey(trackKey) {
    if (!trackKey) return null;
    const supplemental = supplementalTracks[trackKey];
    if (supplemental) return {
      venueKey: trackKey,
      courseName: supplemental.name,
      sourceUrl: supplemental.sourceUrl,
      family: supplemental.family,
      template: !!supplemental.template,
      status: supplemental.template ? 'template' : 'confirmed'
    };
    const track = ns.ChairmanVenues?.tracks?.find((item) => item.key === trackKey);
    if (!track) return null;
    return {
      venueKey: trackKey,
      courseName: track.originalName || track.sourceVenueName || track.name,
      sourceUrl: track.sourceUrl || '',
      status: 'confirmed'
    };
  }

  function venueProfileForVenue(race, venue) {
    const classification = venueClassification(venue, race);
    if (!classification) return null;
    const routeId = venueRouteId(venue);
    const surfaceCode = race.surface === '草地' ? 'turf' : 'dirt';
    const profileId = `venue-${venue.venueKey}-${surfaceCode}-${race.distance}-${routeId}`;
    const existing = get(profileId);
    if (existing) return existing;
    const track = ns.ChairmanVenues?.tracks?.find((item) => item.key === venue.venueKey);
    return registerProfile(Object.freeze({
      id: profileId,
      trackId: venue.venueKey,
      trackKey: venue.venueKey,
      trackName: track?.originalName || venue.courseName || venue.venueKey,
      courseConfigId: `venue:${venue.venueKey}:${surfaceCode}:${race.distance}:${routeId}`,
      routeId,
      routeName: venue.courseName || '标准路线',
      surface: race.surface,
      distance: race.distance,
      type: classification.type,
      intensity: 1,
      status: 'provisional',
      confidence: 'low',
      classificationRuleVersion: CLASSIFICATION_RULE_VERSION,
      classificationSource: venue.source === 'simulation-cycle'
        ? 'venue-group-simulation-cycle-v1'
        : venue.template ? 'schedule-template-initial-review-2026-09-22' : 'verified-venue-initial-review-2026-09-22',
      classificationReason: classification.reason,
      sourceUrl: venue.sourceUrl || ''
    }));
  }

  function resolveForVenue(race, trackKey) {
    if (!race || !trackKey) return null;
    const venue = venueForTrackKey(trackKey);
    return venue ? venueProfileForVenue(race, venue) : null;
  }

  // Chairman worlds deliberately share one classification across inner/outer routes.
  // Resolve by physical venue, never by the source race's name or old profile id.
  function resolveForTrackCourse(trackKey, surface, distance) {
    if (!trackKey) return null;
    const matches = profiles.filter(p => p.trackKey === trackKey && p.surface === surface && p.distance === distance);
    const existing = matches.find(p => p.routeId === 'standard') || matches.sort((a,b) => a.id.localeCompare(b.id))[0];
    return existing || resolveForVenue({ surface, distance }, trackKey);
  }

  function resolveCourseIdentity(race, options = {}) {
    if (!race) return { status: 'unavailable', reason: '赛事资料不存在。' };
    const venue = race.surfaceRegion === '日本'
      ? resolveVenueForRace(race, options.year) || supplementalVenueForRace(race)
      : knownVenue(race, options);
    if (venue) {
      return {
        status: 'venue-resolved',
        trackKey: venue.venueKey,
        trackName: venue.courseName || venue.venueKey,
        sourceUrl: venue.sourceUrl || '',
        reason: venue.groupId
          ? venue.source === 'official-year-override'
            ? `届次举办地组已使用 ${venue.year} 年官方举办地。`
            : `届次举办地组已按模拟轮换表解析 ${venue.year} 年举办地。`
          : venue.template
          ? '原始赛事未提供唯一实际马场，已挂接明确标识的低置信度Ⅰ级巡回赛场模板。'
          : '已确认实际马场；赛程类型按该实体马场生成低置信度Ⅰ级初判，待人工复核。'
      };
    }
    if (race.surfaceRegion !== '日本') {
      return { status: 'unavailable', reason: '现有赛事资料未提供可校验的实际马场与路线。' };
    }
    const identity = JRA_COURSE_IDENTITIES[race.course];
    if (!identity) return { status: 'unavailable', reason: '该赛事不是当前 JRA 中央马场目录中的赛程。' };
    const routes = routeOptions(identity, race.surface, race.distance);
    if (!routes.length) {
      return { status: 'invalid', trackKey: identity.trackKey, sourceUrl: identity.sourceUrl, reason: '赛事表面或距离不在该马场的官方平地发走距离中。' };
    }
    const routeId = declaredRouteId(race);
    if (routeId) {
      if (!routes.includes(routeId)) {
        return { status: 'invalid', trackKey: identity.trackKey, sourceUrl: identity.sourceUrl, routeIds: routes, reason: '赛事路线与该马场官方路线不一致。' };
      }
      return { status: 'resolved', trackKey: identity.trackKey, sourceUrl: identity.sourceUrl, routeId };
    }
    if (routes.length === 1) return { status: 'resolved', trackKey: identity.trackKey, sourceUrl: identity.sourceUrl, routeId: routes[0] };
    return { status: 'resolved', trackKey: identity.trackKey, sourceUrl: identity.sourceUrl, routeId: 'standard', routeName: '标准路线', collapsedRoutes: routes, reason: '当前阶段忽略内／外回，使用标准路线低置信度Ⅰ级档案。' };
  }

  function checkRaceAgainstProfile(race, profile) {
    if (!profile) return { valid: false, reason: '找不到引用的赛程适性档案。' };
    if (race.surface && race.surface !== profile.surface) {
      return { valid: false, reason: `表面不一致（赛事 ${race.surface}，档案 ${profile.surface}）。` };
    }
    if (Number.isFinite(race.distance) && race.distance !== profile.distance) {
      return { valid: false, reason: `距离不一致（赛事 ${race.distance}m，档案 ${profile.distance}m）。` };
    }
    if (race.courseRouteId && race.courseRouteId !== profile.routeId) {
      return { valid: false, reason: `路线不一致（赛事 ${race.courseRouteId}，档案 ${profile.routeId}）。` };
    }
    return { valid: true, reason: '' };
  }

  function applyToRace(race, options = {}) {
    if (!race || typeof race !== 'object') return { status: 'invalid', reason: '赛事记录不存在。' };
    const target = effectiveRaceForOptions(race, options);
    const profileId = profileIdForRace(target, options);
    if (!profileId) return { status: 'pending', profile: null, reason: '尚未人工确认该赛程的适性类型。' };
    const profile = get(profileId);
    const checked = checkRaceAgainstProfile(target, profile);
    if (!checked.valid) return { status: 'invalid', profile, reason: checked.reason };
    if (target !== race) {
      race.distance = target.distance;
      race.venueGroupId = target.venueGroupId;
      race.venueYear = target.venueYear;
      race.venueTrackKey = target.venueTrackKey;
    }
    race.courseProfileId = profile.id;
    race.courseRouteId = profile.routeId;
    race.courseRouteName = profile.routeName;
    return { status: 'configured', profile, reason: '' };
  }

  function applyToRaces(races, options = {}) {
    const result = { configured: 0, pending: 0, invalid: [] };
    (races || []).forEach((race) => {
      const applied = applyToRace(race, options);
      if (applied.status === 'configured') result.configured += 1;
      else if (applied.status === 'pending') result.pending += 1;
      else result.invalid.push({ raceId: race && race.id || '', reason: applied.reason });
    });
    return result;
  }

  function pendingKey(race, identity) {
    return [
      race && (race.surfaceRegion || race.region) || '未标注地区',
      identity && (identity.trackName || identity.trackKey) || race && race.course || '未标注赛马场',
      race && race.surface || '未标注表面',
      Number.isFinite(race && race.distance) ? `${race.distance}m` : '未标注距离',
      declaredRouteId(race) || '路线待确认'
    ].join(' / ');
  }

  function countBy(items, valueOf) {
    const counts = {};
    items.forEach((item) => {
      const key = valueOf(item) || '未标注';
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }

  function collectIdentityAudit(list) {
    const summary = { resolved: 0, 'venue-resolved': 0, ambiguous: 0, invalid: 0, unavailable: 0 };
    const groups = new Map();
    list.forEach((race) => {
      const identity = resolveCourseIdentity(race);
      summary[identity.status] += 1;
      if (identity.status === 'resolved') return;
      const key = [identity.status, identity.trackKey || '', race && race.surfaceRegion || '', race && race.course || '', race && race.surface || '', race && race.distance || '', (identity.routeIds || []).join(',')].join('|');
      if (!groups.has(key)) groups.set(key, { status: identity.status, reason: identity.reason, sourceUrl: identity.sourceUrl || '', trackKey: identity.trackKey || '', trackName: identity.trackName || '', surfaceRegion: race && race.surfaceRegion || '', course: race && race.course || '', surface: race && race.surface || '', distance: race && race.distance || null, routeIds: identity.routeIds || [], count: 0, raceIds: [] });
      const group = groups.get(key);
      group.count += 1;
      group.raceIds.push(race && race.id || '');
    });
    return { summary, issues: Array.from(groups.values()).sort((a, b) => `${a.status}:${a.course}`.localeCompare(`${b.status}:${b.course}`, 'zh-CN')) };
  }

  function audit(races) {
    const list = Array.isArray(races) ? races : [];
    const configured = [];
    const invalid = [];
    const pendingByKey = new Map();
    const configuredProfileIds = new Set();
    const identity = collectIdentityAudit(list);

    list.forEach((race) => {
      const raceIdentity = resolveCourseIdentity(race);
      const profileId = profileIdForRace(race);
      if (!profileId) {
        const key = pendingKey(race, raceIdentity);
        if (!pendingByKey.has(key)) {
          pendingByKey.set(key, {
            course: raceIdentity.trackName || race && race.course || '',
            trackKey: raceIdentity.trackKey || '',
            courseIdentityStatus: raceIdentity.status,
            surface: race && race.surface || '',
            distance: race && race.distance || null,
            surfaceRegion: race && (race.surfaceRegion || race.region) || '',
            courseRouteId: declaredRouteId(race),
            key,
            count: 0,
            raceIds: []
          });
        }
        const pending = pendingByKey.get(key);
        pending.count += 1;
        pending.raceIds.push(race && race.id || '');
        return;
      }

      const profile = get(profileId);
      const checked = checkRaceAgainstProfile(race, profile);
      if (!checked.valid) {
        invalid.push({ raceId: race && race.id || '', profileId, reason: checked.reason });
        return;
      }
      configuredProfileIds.add(profile.id);
      configured.push({
        raceId: race.id,
        raceName: race.name || '',
        profileId: profile.id,
        route: routeLabel(profile),
        type: profile.type,
        intensity: profile.intensity,
        status: profile.status,
        confidence: profile.confidence,
        routeSourceUrl: routeSourceUrl(race)
      });
    });

    const pending = Array.from(pendingByKey.values()).sort((a, b) => a.key.localeCompare(b.key, 'zh-CN'));
    return {
      version: VERSION,
      classificationRuleVersion: CLASSIFICATION_RULE_VERSION,
      classificationSource: CLASSIFICATION_SOURCE,
      summary: {
        races: list.length,
        configured: configured.length,
        pending: list.length - configured.length - invalid.length,
        invalid: invalid.length,
        profiles: profiles.length,
        profilesInUse: configuredProfileIds.size,
        pendingCourseSignatures: pending.length
      },
      inventory: {
        bySurfaceRegion: countBy(list, (race) => race && (race.surfaceRegion || race.region)),
        byRaceClass: countBy(list, (race) => race && race.raceClass)
      },
      courseIdentity: identity,
      configured: configured.sort((a, b) => a.raceId.localeCompare(b.raceId)),
      pending,
      invalid
    };
  }

  ns.RaceCourseProfiles = Object.freeze({
    VERSION,
    CLASSIFICATION_RULE_VERSION,
    CLASSIFICATION_SOURCE,
    CLASSIFICATION_ORDER,
    DEFAULT_UNCERTAIN_INTENSITY,
    all: () => profiles.slice(),
    get,
    profileIdForRace,
    resolveForRace,
    resolveForEdition,
    resolveForVenue,
    resolveForTrackCourse,
    resolveEditionRace,
    resolveCourseIdentity,
    venueGroupForRace,
    resolveVenueForRace,
    venueGroups,
    routeLabel,
    checkRaceAgainstProfile,
    applyToRace,
    applyToRaces,
    audit,
    profileIdByRaceId,
    courseRouteByRaceId,
    courseRouteSourceByRaceId,
    knownChairmanVenue
  });

  // 第二阶段只提供解析与审计，不在比赛库载入时写回引用字段。
  // 第三阶段正式切换新引擎时，再由迁移流程显式调用 applyToRaces；这样旧引擎的
  // 随机序列和结果序列化都不会因新增元数据而发生变化。
})();
