(function () {
  'use strict';
  const ns = window.Keiba;
  const version = 1, checkedAt = '2026-09-28';
  const suggestions = {new:5,maiden:5,'one-win':12,'two-win':20,'three-win':28,op:40,g3:55,g2:68,g1:80};
  // Scores are game design values, not an official ranking. Stable registry IDs only.
  const sources = {
    epsom:'https://www.thejockeyclub.co.uk/epsom/about/history/',
    kentucky:'https://www.kentuckyderby.com/about/',
    diane:'https://www.france-galop.com/fr/content/prix-de-diane-longines-levenement-hippique-le-plus-elegant-de-la-saison',
    japan:'https://japanracing.jp/_pdf/jpn-racing/hrij_all2026.pdf',
    cup:'https://international.breederscup.com/Championships/RaceSchedule',
    arc:'https://billetterie.france-galop.com/en/event/qatar-prix-de-larc-de-triomphe/',
    ascot:'https://royalascot2024.racenewslive.co.uk/wp-content/uploads/2024/06/RA_2024_Media-Guide_FINAL.pdf',
    ireland:'https://www.curragh.ie/about/',
    germany:'https://www.deutscher-galopp.de/gr-wAssets/videos/RaceBets-Booklet-Baden-Baden_neu.pdf'
  };
  const overrides = {};
  function group(ids, value, source, reason) {
    for (const id of ids.split(' ')) overrides[id] = {value,sourceUrl:sources[source],reason,checkedAt,basis:'curated'};
  }
  group('epsom-derby',98,'epsom','英国德比代表性经典目标');
  group('kentucky-derby',98,'kentucky','美国德比代表性经典目标');
  group('prix-de-diane',93,'diane','法国三岁牝马代表性目标');
  group('japan-cup arima-kinen tokyo-yushun',98,'japan','日本代表性国际大赛／经典目标；分值为游戏设计');
  group('tenno-sho-haru tenno-sho-aki takarazuka-kinen oka-sho satsuki-sho yushun-himba kikka-sho',93,'japan','经典或古马主要目标，覆盖牝马及长距离路线');
  group('takamatsunomiya-kinen sprinters-stakes yasuda-kinen mile-championship champions-cup',92,'japan','短途、一哩与泥地代表目标，不因路线不同降低荣誉定位');
  group('victoria-mile queen-elizabeth-ii-cup shuka-sho',89,'japan','牝马主要目标');
  group('hanshin-juvenile-fillies asahi-hai-fs hopeful-stakes',88,'japan','两岁马年度主要目标');
  group('prix-de-larc',100,'arc','国际中长距离年度代表目标');
  group('ascot-gold-cup queen-anne-stakes king-charles-iii-stakes queen-elizabeth-ii-jubilee-stakes prince-of-wales-stakes',94,'ascot','皇家雅士谷代表目标，覆盖长途、一哩、短途与中距离');
  group('irish-derby irish-oaks irish-two-thousand-guineas irish-one-thousand-guineas irish-st-leger',92,'ireland','爱尔兰五项经典赛事');
  group('deutsches-derby preis-der-diana grosser-preis-von-baden',90,'germany','德国经典与国际代表赛事，含牝马路线');
  group('breeders-cup-classic breeders-cup-turf',98,'cup','育马者杯成年中距离代表目标');
  group('breeders-cup-distaff breeders-cup-sprint breeders-cup-dirt-mile breeders-cup-mile breeders-cup-turf-sprint breeders-cup-filly-mare-turf breeders-cup-filly-mare-sprint',94,'cup','育马者杯分路线冠军目标');
  group('breeders-cup-juvenile breeders-cup-juvenile-fillies breeders-cup-juvenile-turf breeders-cup-juvenile-fillies-turf breeders-cup-juvenile-turf-sprint',90,'cup','育马者杯两岁马分路线目标');
  const records = new Map();
  for (const r of ns.RaceRegistry.all()) {
    const raceClass = /^jpn[123]$/.test(r.raceClass) ? 'g'+r.raceClass.at(-1) : r.raceClass;
    records.set(r.id, {sourceId:r.id,value:suggestions[raceClass]??40,reason:'按项目现有格付给出的游戏建议值；未做逐场声望加权',basis:'grade-suggestion',...overrides[r.id]});
  }
  function reference(r) { return records.get(r.sourceId)?.value ?? suggestions[r.raceClass] ?? 40; }
  function value(r) { return r.prestige == null ? reference(r) : r.prestige; }
  function valid(v) { return v == null || Number.isInteger(v) && v >= 0 && v <= 100; }
  function initialize(r) { if (r.prestige == null) { r.prestige=reference(r);r.prestigeOverride=false; } }
  ns.ChairmanPrestige = {version,checkedAt,suggestions,sources,records,reference,value,valid,initialize};
})();
