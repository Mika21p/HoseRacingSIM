(function () {
  "use strict";
  const ns = (window.Keiba = window.Keiba || {});
  const R = ns.Random;
  const REGIONS = ["日本", "欧洲", "美国"];
  const REGION_IDS = { 日本: "japan", 欧洲: "europe", 美国: "northAmerica" };
  const TRAVEL_IDS = { 日本: "japan", 欧洲: "europe", 美国: "america" };
  const AFFILIATIONS = { 日本: "japan", 欧洲: "europe", 美国: "usa" };
  function regions(w) { return w.regions || REGIONS.map((name) => ({ id: REGION_IDS[name], name, baseRegion: name, autoPopulate: true })); }
  function regionNames(w) { return regions(w).map((r) => r.name); }
  function populationRegions(w) { return regions(w).filter((r) => r.autoPopulate && !r.disabled).map((r) => r.name); }
  function regionBase(w, name) {
    const region = regions(w).find((r) => r.name === name);
    assert(region, `地区“${name}”不存在，请先在管理地区中创建。`);
    return region.baseRegion;
  }
  const G1_IDS = [
    "takamatsunomiya-kinen", "oka-sho", "tokyo-yushun", "japan-cup", "champions-cup", "asahi-hai-fs",
    "epsom-derby", "epsom-oaks", "ascot-gold-cup", "july-cup", "prix-de-larc", "prix-morny",
    "kentucky-derby", "kentucky-oaks", "metropolitan-handicap", "breeders-cup-classic", "breeders-cup-turf", "breeders-cup-juvenile"
  ];
  const AWARDS = [
    { id: "representative", name: "年度代表马" },
    ...[2, 3, 4].flatMap((age) => [
      { id: `male-${age}`, name: `最佳${age === 4 ? "四岁及以上" : `${age}岁`}牡骟马`, age, female: false },
      { id: `female-${age}`, name: `最佳${age === 4 ? "四岁及以上" : `${age}岁`}牝马`, age, female: true }
    ]),
    { id: "sprint", name: "最佳短距离马", categories: ["短途", "英里"] },
    { id: "middle", name: "最佳中距离马", categories: ["中距离", "中长距离"] },
    { id: "long", name: "最佳长距离马", categories: ["中长距离", "长距离", "超长距离"] },
    { id: "turf", name: "最佳草地马", surface: "草地" },
    { id: "dirt", name: "最佳泥地马", surface: "泥地" }
  ];
  const NAMES = "骏天 野田 绿色 森林 钻石 皇家 富士 天赐 沙漠 雷 迪拜 巨人 龙 光 月光 风 影 风暴 先锋 火箭 大梦 旅程 庆典 威龙 名家 光辉 光环 魔术 玄驹 重炮 名将 曼波 美丽 雪 海 皇冠 勇士 旋律 世界 宇宙 新星 金钻 旭日 天使 骄阳 幸运 快车 法老 茶座 飞鹰 特别 铃鹿 沉默 数码 大拓 奇迹 凯旋".split(" ");
  const clone = (value) => JSON.parse(JSON.stringify(value));
  function assert(condition, message) { if (!condition) throw new Error(message); }
  function finite(value) { return typeof value === "number" && Number.isFinite(value); }
  function id(w, prefix) { return `${prefix}-${w.nextId++}`; }
  function date(turn) { return { year: Math.floor(turn / 24) + 1, month: Math.floor((turn % 24) / 2) + 1, half: turn % 2 + 1 }; }
  function ageOf(w, horse, turn) { return date(turn == null ? w.turn : turn).year - horse.birthYear; }
  function timeFor(w, horse, turn) {
    const d = date(turn == null ? w.turn : turn);
    const age = d.year - horse.birthYear;
    return { age, month: d.month, half: d.half, index: ns.TimeRules.toIndex(age, d.month, d.half) };
  }
  function category(distance) {
    return distance <= 1300 ? "短途" : distance <= 1800 ? "英里" : distance <= 2200 ? "中距离"
      : distance <= 2600 ? "中长距离" : distance <= 3200 ? "长距离" : "超长距离";
  }
  function observedKey(race) { return `${race.surfaceRegion}|${race.surface}|${category(race.distance)}`; }
  function emptyStats(year) { return { year, starts: 0, wins: 0, g1: 0, prize: 0, tf: null, suggested: null, manual: null }; }
  function rating(horse) { return horse.annual.manual == null ? horse.annual.suggested : horse.annual.manual; }
  function entryRating(horse) { return rating(horse) ?? (horse.annual.tf == null ? null : horse.annual.tf - 5) ?? horse.previousWtr ?? (horse.previousTf == null ? null : horse.previousTf - 5); }
  function seeded(w, operation) {
    const random = R.seeded(w.rngState);
    const result = R.withSource(random, operation);
    w.rngState = random.state();
    return result;
  }
  function mutate(world, operation) {
    const w = world.breeding?.version>=2 ? ns.ChairmanGenetics.cloneForMutation(world) : clone(world);
    canonicalOrder(w);
    const out = { world: w, occurrences: [], performances: [], ratings: [], awards: [] };
    seeded(w, () => operation(w, out));
    ns.ChairmanWorld?.synchronize(w);
    ns.ChairmanHonors?.synchronize(w, out);
    canonicalOrder(w);
    w.revision = world.revision + 1;
    return out;
  }
  // IndexedDB returns key order, not insertion order. Simulation order must survive reloads.
  function canonicalOrder(w) {
    for (const key of ["horses", "races", "tracks", "pedigrees"]) (w[key] || []).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  }
  function engineRace(w, race, targetYear) {
    const frozen=ns.ChairmanSeries?.frozenRace(w,race.id,targetYear); if(frozen)return clone(frozen);
    if (w.worldSystemVersion === 2) return ns.ChairmanWorld.resolveRace(w, race, targetYear);
    const track = w.tracks.find((item) => item.id === race.trackId);
    assert(track, "赛事关联的马场不存在。");
    return { ...race, surfaceRegion: track.region, engineRegion: regionBase(w, track.region), course: track.courseType, trackName: track.name };
  }
  function simulationRace(w, race) { return { ...race, surfaceRegion: race.engineRegion || regionBase(w, race.surfaceRegion) }; }
  // Reuse the engine's travel timings with three distinct locations: home,
  // current location and destination. Equal rule templates do not merge geography.
  function travelContext(career, horse, race) {
    const names = [...new Set([horse.homeRegion, horse.locationRegion, race.surfaceRegion])];
    const mapped = (name) => REGIONS[names.indexOf(name)];
    return { career: { ...career, stable: { regionId: REGION_IDS[mapped(horse.homeRegion)] },
      travel: { currentRegionId: TRAVEL_IDS[mapped(horse.locationRegion)], history: [] } },
      race: { ...race, surfaceRegion: mapped(race.surfaceRegion) } };
  }
  function careerFor(w, horse) {
    const time = timeFor(w, horse);
    const offset = time.index - w.turn;
    const last = horse.lastRace;
    return {
      horse, currentTime: time,
      lastRaceIndex: horse.lastRaceTurn == null ? null : horse.lastRaceTurn + offset,
      fatigue: horse.fatigue,
      stable: { regionId: REGION_IDS[regionBase(w, horse.homeRegion)] },
      travel: { currentRegionId: TRAVEL_IDS[regionBase(w, horse.locationRegion)], history: [] },
      injury: { active: horse.restUntil > w.turn ? { restUntilIndex: horse.restUntil + offset } : null, history: [] },
      races: last ? [{ public: { rank: last.rank }, hidden: { race: { id: last.raceId, raceClass: last.raceClass, surfaceRegion: last.region } } }] : []
    };
  }
  function validateTrack(track, world) {
    assert(typeof track.name === "string" && track.name.trim(), "请填写马场名。");
    assert(regionNames(world || {}).includes(track.region), "请选择已创建的地区。");
    assert(["东京", "中山", "京都", "阪神", "其他地方"].includes(track.courseType), "请选择有效的赛道适性类型。");
    assert(Array.isArray(track.surfaces) && track.surfaces.length && track.surfaces.every((v) => ["草地", "泥地"].includes(v)), "请选择马场支持的场地。");
  }
  function validateRace(w, race) {
    assert(typeof race.name === "string" && race.name.trim(), "请填写比赛名。");
    const track = w.tracks.find((t) => t.id === race.trackId);
    assert(track && !track.deleted, "请选择现有马场。");
    assert(track.surfaces.includes(race.surface), "马场不支持该场地类型。");
    assert((w.worldSystemVersion === 2 ? ns.ChairmanWorld.classes : ["op", "g3", "g2", "g1"]).includes(race.raceClass), "无效格付。");
    assert(Number.isInteger(race.distance) && race.distance > 0, "距离必须为正整数米。");
    assert(Number.isInteger(race.month) && race.month >= 1 && race.month <= 12 && [1, 2].includes(race.half), "举办时间无效。");
    assert(["2", "3", "4", "2+", "3+", "4+"].includes(race.ageRule), "年龄条件无效。");
    assert(["all", "male", "female", "gelding", "male-female"].includes(race.sexRule), "性别条件无效。");
    assert(Number.isInteger(race.capacity) && race.capacity >= 2, "参赛上限必须是至少2的整数。");
    assert(Array.isArray(race.prizes) && race.prizes.length === 5 && race.prizes.every((n) => finite(n) && n >= 0), "请填写五项非负奖金。");
  }
  function validateHorse(w, horse) {
    assert(typeof horse.name === "string" && horse.name.trim(), "请填写马名。");
    assert(["牡马", "牝马", "骟马"].includes(horse.gender), "性别无效。");
    assert(regionNames(w).includes(horse.homeRegion), "所属地区不存在，请先在管理地区中创建。");
    assert(Number.isInteger(horse.birthYear) && ageOf(w, horse) >= (w.breeding && horse.status === "juvenile" ? 0 : 2), "马匹至少二岁，繁殖幼驹除外。");
    assert(finite(horse.strength) && horse.strength > 0, "基础能力须为正数。");
    assert(finite(horse.weight) && horse.weight > 0, "体重须为正数。");
    if (horse.breedingStrength != null) assert(Number.isInteger(horse.breedingStrength) && horse.breedingStrength >= 1 && horse.breedingStrength <= 100, "配种实力须为1～100的整数。");
    assert([horse.distMin, horse.coreDist, horse.distMax].every((v) => Number.isInteger(v) && v > 0)
      && horse.distMin <= horse.coreDist && horse.coreDist <= horse.distMax, "距离需满足下限≤核心距离≤上限。");
    const peak = ns.MaturityRules.getPeakWindow(horse);
    assert(peak && peak.endIndex >= peak.startIndex, "巅峰期结束不能早于开始。");
    assert(ns.TemperamentRules.getRange(horse.temperamentLabel) && ["极端暴躁", "暴躁", "胆小", "普通", "沉稳", "冷静", "极其聪明"].includes(horse.temperamentLabel), "气性无效。");
    assert(["不佳", "普通", "擅长", "鬼"].includes(horse.heavyType), "重场地适性无效。");
    assert(ns.TrackAptitudeRules, "赛场适性规则尚未加载。");
    ns.TrackAptitudeRules.validateHorse(horse);
    assert(horse.fatherId !== horse.id && horse.motherId !== horse.id, "父母不能为马匹自己。");
  }
  function setHorseAge(w, value) {
    if(value.age == null)return value;
    assert(Number.isSafeInteger(value.age) && value.age>=2, '当前年龄须为至少二岁的整数。');
    const birthYear=date(w.turn).year-value.age;
    assert(value.birthYear==null || value.birthYear===birthYear, '当前年龄与出生年份不一致。');
    const result={...value,birthYear};delete result.age;return result;
  }
  function initializeHorseTime(w,h,existing) {
    if(existing && existing.birthYear===h.birthYear)return;
    assert(!existing || !existing.lifetime.starts && ![...w.horses,...(w.pedigrees||[])].some(c=>c.fatherId===h.id || c.motherId===h.id), '已有出赛或子代记录的马不能修改年龄。');
    h.maturity={decline:0,lastCheckedIndex:0,events:[]};
    const t=timeFor(w,h);if(h.status!=='juvenile')ns.MaturityRules.applyMonthlyDecline(h,h.maturity,ns.TimeRules.toIndex(2,1,1),t.index);
    h.maturity.lastCheckedIndex=t.index;
  }
  function addHorse(w, options) {
    const opts = Object.fromEntries(Object.entries(options || {}).filter(([, value]) => value !== undefined));
    const gender = opts.gender || R.weightedPick(["牡马", "牝马", "骟马"], (v) => v === "骟马" ? 5 : v === "牡马" ? 45 : 50);
    const profile = w.worldSystemVersion === 2 ? ns.ChairmanWorld.profile(w, opts.homeRegionId || opts.homeRegion || (populationRegions(w).length?populationRegions(w):regionNames(w))[(w.totalHorses||0)%(populationRegions(w).length||regionNames(w).length)]) : null;
    const generated = ns.HorseRules.generateHorse({ gender: gender === "骟马" ? "牡马" : gender, gameMode: "normal", ...(profile ? {chairmanProfile:profile} : {}) });
    const horseId = id(w, "horse");
    const homes = populationRegions(w), homeRegion = opts.homeRegion || (homes.length ? homes : regionNames(w))[(w.totalHorses || 0) % (homes.length || regionNames(w).length)];
    const h = Object.assign(generated, {
      id: horseId, gender, name: `${R.pickOne(NAMES)}${R.pickOne(NAMES)}·${horseId.split("-")[1]}`,
      origin: "ai", birthYear: date(w.turn).year - (opts.age ?? 2), homeRegion, locationRegion: homeRegion,
      owner: `${homeRegion}个体马主`, association: "世界马会", fatherId: "", motherId: "",
      status: "active", lastRaceTurn: null, restUntil: 0, lastRace: null, booked: null,
      annual: emptyStats(date(w.turn).year), lifetime: { starts: 0, wins: 0, g1: 0, prize: 0 }, previousWtr: null,
      maturity: { decline: 0, lastCheckedIndex: 0, events: [] }, fatigue: { pressure: 0, lockedEvents: [], cancellations: [] },
      observations: {}, lastTf: null, lastEventRating: null, retiredYear: null
    }, opts);
    delete h.age;
    delete h.career;
    if (w.worldSystemVersion === 2) ns.ChairmanWorld.initializeHorse(w, h, opts);
    // Template bloodlines and actual parent IDs intentionally remain separate.
    const t = timeFor(w, h);
    if (h.status !== "juvenile") ns.MaturityRules.applyMonthlyDecline(h, h.maturity, ns.TimeRules.toIndex(2, 1, 1), t.index);
    h.maturity.lastCheckedIndex = t.index;
    validateHorse(w, h);
    w.horses.push(h);
    ns.ChairmanBreeding?.initialize(w, h);
    if (w.honors) ns.ChairmanHonors.register(w, h);
    w.totalHorses = (w.totalHorses || 0) + 1;
    return h;
  }
  function createTrack(w, region, course) {
    const existing = w.tracks.find((track) => track.region === region && track.sourceCourse === course);
    if (existing) return existing;
    const track = { id: id(w, "track"), name: `${course}赛马场`, region,
      sourceCourse: course, courseType: ["东京", "中山", "京都", "阪神"].includes(course) ? course : "其他地方",
      surfaces: ["草地", "泥地"], deleted: false };
    w.tracks.push(track);
    return track;
  }
  function defaultPrizes(raceClass) {
    const first = { op: 10, g3: 100, g2: 300, g1: 1000 }[raceClass] || 10;
    return [1, .4, .25, .15, .1].map((ratio) => first * ratio);
  }
  function preset(w) {
    const sources = ns.RaceRegistry.all();
    G1_IDS.forEach((sourceId) => {
      const source = sources.find((race) => race.id === sourceId);
      assert(source, `赛事资料缺失：${sourceId}`);
      const track = createTrack(w, source.surfaceRegion, source.course);
      const age = source.ageRestriction;
      w.races.push({ id: id(w, "race"), sourceId, name: source.nameZh || source.name,
        trackId: track.id, raceClass: "g1", grade: "G1", surface: source.surface, distance: source.distance,
        month: source.month, half: source.half,
        ageRule: age.type === "exact" ? String(age.age) : `${age.age}+`,
        sexRule: source.sexRestriction === "牝马" ? "female" : "all", capacity: 16,
        prizes: defaultPrizes("g1"), deleted: false });
    });
    REGIONS.forEach((region) => {
      const track = createTrack(w, region, region === "日本" ? "东京" : region === "欧洲" ? "英国" : "美国");
      for (let turn = 0; turn < 24; turn++) for (let lane = 0; lane < 2; lane++) {
        const surface = region === "欧洲" || lane === 0 ? "草地" : "泥地";
        const distances = surface === "草地" ? [1200, 1600, 2000, 2400, 3000, 3600] : [1200, 1600, 1800, 2000];
        const distance = distances[(turn + lane * 3) % distances.length];
        const d = date(turn);
        w.races.push({ id: id(w, "race"), name: `${region}${d.month}月${d.half === 1 ? "上" : "下"}半月${surface}${distance}米公开赛`,
          trackId: track.id, raceClass: "op", grade: "OP", surface, distance, month: d.month, half: d.half,
          ageRule: "2+", sexRule: "all", capacity: 16, prizes: defaultPrizes("op"), deleted: false });
      }
    });
  }
  function createWorld(options) {
    const opts = options || {};
    if (opts.worldType) return ns.ChairmanWorld.create(opts);
    const seed = Number.isInteger(opts.seed) ? opts.seed >>> 0 : (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
    const w = { id: opts.id || `world-${Date.now()}-${seed}`, schemaVersion: 1, rulesVersion: 1, ratingVersion: 2, ratingPrecisionVersion: 1, aiVersion: 2, ratingSeed: seed, aiRngState: ns.ChairmanRatings.hash(`ai:${seed}`), tfStandards: {}, revision: 0,
      name: opts.name || "我的国际马会", turn: 0, phase: "season", seed, rngState: seed, nextId: 1,
      settings: { annualNewHorses: 75, autoRetire: true }, regions: regions({}), tracks: [], races: [], horses: [],
      totalHorses: 0, awardDraft: {}, awardsStrict: true, lastCompletedTurn: null, ui: {}, lockedRaces: {} };
    seeded(w, () => {
      if (!opts.blank) {
        preset(w);
        for (const race of ns.ChairmanScheduling.preparationRaces(w)) w.races.push({ ...race, id: id(w, "race") });
        const count = opts.horseCount == null ? 300 : opts.horseCount;
        for (let i = 0; i < count; i++) addHorse(w, { homeRegion: REGIONS[Math.floor(i / Math.max(1, Math.ceil(count / 3))) % 3], age: 2 + Math.floor(i / 25) % 4 });
        planEntries(w);
      }
    });
    if (opts.breeding) ns.ChairmanBreeding.enable(w, { foundation: !opts.blank, background: !opts.blank });
    ns.ChairmanHonors?.initialize(w);
    ns.ChairmanSeries?.initialize(w);
    ns.ChairmanEditor?.initialize(w);
    return w;
  }
  function eligible(w, h, race, turn) {
    if (h.status !== "active" || race.deleted || h.restUntil > turn) return false;
    const age = ageOf(w, h, turn);
    const ageAllowed = race.ageRule.endsWith("+") ? age >= Number(race.ageRule.slice(0, -1)) : age === Number(race.ageRule);
    const sexAllowed = race.sexRule === "all" || race.sexRule === "male-female" && h.gender !== "骟马"
      || race.sexRule === "male" && h.gender === "牡马" || race.sexRule === "female" && h.gender === "牝马"
      || race.sexRule === "gelding" && h.gender === "骟马";
    return ageAllowed && sexAllowed && (w.worldSystemVersion !== 2 || ns.ChairmanWorld.eligible(w, h, race));
  }
  function planEntries(w) {
    if (w.worldSystemVersion === 2) return ns.ChairmanWorld.plan(w);
    ns.ChairmanSeries?.prepare(w);
    const result=ns.ChairmanScheduling.plan(w, { engineRace, careerFor, eligible, travelContext, timeFor });
    ns.ChairmanSeries?.prepare(w);
    return result;
  }
  function assignJockeys(horses, region) {
    const pool = ns.JockeyRules.getDefaultJockeys(AFFILIATIONS[region]);
    const available = new Map(pool.map((j) => [j.id, j]));
    const assignments = new Map();
    const order = horses.map((horse) => ({ horse, tie: R.next() })).sort((a, b) =>
      (entryRating(b.horse) ?? -Infinity) - (entryRating(a.horse) ?? -Infinity) || b.horse.lifetime.prize - a.horse.lifetime.prize || a.tie - b.tie);
    for (const { horse } of order) {
      let jockey = horse.lastRace && available.get(horse.lastRace.jockeyId);
      if (!jockey && available.size) jockey = R.weightedPick([...available.values()], (item) => Math.max(1, item.ability));
      if (!jockey) jockey = { id: `substitute-${horse.id}`, name: "临时骑手", ability: 30 };
      available.delete(jockey.id);
      assignments.set(horse.id, jockey);
    }
    return assignments;
  }
  function updateAnnual(h, performance) {
    (h.annual.runs || (h.annual.runs = [])).push({ id: performance.occurrenceId, name: performance.raceName,
      turn: performance.turn, raceClass: performance.raceClass, surface: performance.surface, distance: performance.distance, rank: performance.rank });
    for (const stats of [h.annual, h.lifetime]) {
      stats.starts++;
      if (performance.rank === 1) { stats.wins++; if (performance.raceClass === "g1") stats.g1++; }
      stats.prize += performance.prize;
    }
    if (performance.tf != null) {
      h.annual.tf = h.annual.tf == null ? performance.tf : Math.max(h.annual.tf, performance.tf);

    }
  }
  function advanceHalfMonth(world, options) {
    assert(world.phase === "season", "请先完成年末回合。");
    if (world.worldSystemVersion === 2) ns.ChairmanWorld.assertReady(world);
    const output = mutate(world, (w, out) => {
      ns.ChairmanSeries?.prepare(w,true);
      const d = date(w.turn);
      const tfCalibration = ns.ChairmanRatings.calibration(w);
      w.lockedRaces = w.lockedRaces || {};
      for (const h of w.horses) {
        if (h.status !== "active") continue;
        const t = timeFor(w, h);
        ns.MaturityRules.applyMonthlyDecline(h, h.maturity, h.maturity.lastCheckedIndex, t.index);
        h.maturity.lastCheckedIndex = t.index;
        if (h.booked && h.booked.preparationTurn != null && h.booked.preparationTurn <= w.turn) {
          h.locationRegion = h.booked.targetRegion;
          if (w.worldSystemVersion === 2) { h.locationRegionId = h.booked.targetRegionId; ns.ChairmanWorld.freeze(w, h.booked.raceId, date(h.booked.turn).year); }
          const key = `${date(h.booked.turn).year}:${h.booked.raceId}`;
          if (!w.lockedRaces[key]) w.lockedRaces[key] = clone(engineRace(w, w.races.find((r) => r.id === h.booked.raceId),date(h.booked.turn).year));
        }
      }
      for (const definition of w.races) {
        const locked = w.lockedRaces[`${d.year}:${definition.id}`] || ns.ChairmanSeries?.frozenRace(w,definition.id,d.year);
        if (definition.deleted && !locked) continue;
        const race = locked || engineRace(w, definition);
        if (!locked && definition.deleted || race.month !== d.month || race.half !== d.half || definition.lastHeldYear === d.year || !locked && d.year < (definition.notBeforeYear || 1)) continue;
        definition.lastHeldYear = d.year;
        if (w.worldSystemVersion === 2) ns.ChairmanWorld.freeze(w, definition.id, d.year);
        delete w.lockedRaces[`${d.year}:${definition.id}`];
        const occurrenceId = `${d.year}:${race.id}`;
        const horses = w.horses.filter((h) => h.booked && h.booked.raceId === race.id && h.booked.turn === w.turn && eligible(w, h, race, w.turn));
        if (w.worldSystemVersion === 2 && race.demandDriven && horses.length < 2) { horses.forEach(h=>{h.booked=null;}); continue; }
        const occurrence = { id: occurrenceId, turn: w.turn, year: d.year, raceId: race.id, race: clone(race), rulesVersion: w.rulesVersion || 1, ratingVersion: w.ratingVersion,
          name: race.name, raceClass: race.raceClass, status: horses.length < 2 ? "cancelled" : "completed", count: horses.length };
        out.occurrences.push(occurrence);
        if(w.worldSystemVersion===2)ns.ChairmanWorld.rememberActual(w,race,d.year);
        if (horses.length < 2) { horses.forEach((h) => { h.booked = null; }); continue; }
        const simRace = simulationRace(w, race);
        const jockeys = assignJockeys(horses, race.chairmanEnvironment?.jockeyPool || simRace.surfaceRegion);
        const runners = horses.map((h) => {
          const career = careerFor(w, h);
          const condition = ns.RaceFatigueRules.lockPreRaceCondition(career, { race, schedule: timeFor(w, h) });
          h.fatigue = { pressure: career.fatigue.pressure, lockedEvents: [], cancellations: [] };
          return { horse: h, time: timeFor(w, h), decline: h.maturity.decline, condition, jockey: jockeys.get(h.id) };
        });
        const simulated = ns.RaceRules.simulateWorldRace(runners, simRace);
        occurrence.trackCondition = simulated.trackCondition;
        const evaluation = ns.ChairmanRatings.rateRaceTF(race, simulated.results, horses, w.turn, w.tfStandards, tfCalibration);
        occurrence.tfBenchmarkId = evaluation.benchmarkId;
        occurrence.tfSource = evaluation.source;
        occurrence.scaleOffset = ns.ChairmanRatings.getRatingScaleOffset(w.ratingSeed ?? w.seed, occurrenceId);
        w.tfStandards = w.tfStandards || {};
        if (evaluation.winnerRating != null) for (const key of [race.id, `${race.surface}|${category(race.distance)}`]) w.tfStandards[key] = [...(w.tfStandards[key] || []), evaluation.winnerRating].slice(-5);
        simulated.results.forEach(r => { r.tf = evaluation.ratings[r.horseId] ?? null; });
        for (const result of simulated.results) {
          const h = horses.find((item) => item.id === result.horseId);
          const performance = { ...result, id: `${occurrenceId}:${h.id}`, occurrenceId, raceId: race.id,
            turn: w.turn, year: d.year, rulesVersion: w.rulesVersion || 1, ratingVersion: w.ratingVersion, horseName: h.name, owner: h.owner, association: h.association,
            age: ageOf(w, h), gender: h.gender, homeRegion: h.homeRegion, ...(w.worldSystemVersion === 2 ? {homeRegionId:h.homeRegionId,regionId:race.regionId,trackId:race.trackId} : {}),
            raceName: race.name, raceClass: race.raceClass, surfaceRegion: race.surfaceRegion, surface: race.surface, distance: race.distance,
            ratingDeficit: result.retired ? null : ns.ChairmanRatings.deficit(result,race.distance), manualRating: null, priorPerformanceId: h.lastPerformanceId || null, priorTf: h.lastTf, priorEventRating: h.lastEventRating, count: horses.length,
            prize: result.rank && result.rank <= 5 ? race.prizes[result.rank - 1] : 0 };
          out.performances.push(performance);
          updateAnnual(h, performance);
          if (w.worldSystemVersion === 2) ns.ChairmanWorld.recordPerformance(h, performance);
          ns.ChairmanRatings.record(h, performance, horses.length);
          h.lastPerformanceId = performance.id;
          h.lastRaceTurn = w.turn;
          h.lastRace = { raceId: race.id, raceClass: race.raceClass, region: race.surfaceRegion, rank: result.rank, jockeyId: result.jockeyId };
          h.lastTf = result.tf;
          h.lastEventRating = null;
          h.locationRegion = race.surfaceRegion;
          if (w.worldSystemVersion === 2) h.locationRegionId = race.regionId;
          h.booked = null;
          if (result.injury) {
            h.restUntil = w.turn + result.injury.restMonths * 2;
            h.lastInjury = { ...result.injury, turn: w.turn };
            if (result.injury.forcedRetirement) { h.status = "retired"; h.retiredYear = d.year; }
            if (h.restUntil > w.turn && w.worldSystemVersion !== 2) h.locationRegion = h.homeRegion;
          }
          ns.MaturityRules.applyRaceWear(h, h.maturity, timeFor(w, h).index);
          if (result.tf != null) {
            const key = observedKey(race);
            const previous = h.observations[key] || { total: 0, count: 0 };
            h.observations[key] = { total: previous.total + result.tf, count: previous.count + 1 };
          }
        }
      }
      ns.ChairmanSeries?.settle(w,out);
      w.backgroundSummary = { turn: w.turn, completed: out.occurrences.filter(r => !['g1','g2','g3'].includes(r.raceClass) && r.status === 'completed').length, cancelled: out.occurrences.filter(r => !['g1','g2','g3'].includes(r.raceClass) && r.status === 'cancelled').length };
      w.lastCompletedTurn = w.turn;
      if (w.turn % 24 === 23) w.phase = "yearEnd";
      else { w.turn++; planEntries(w); }
    });
    if (!options?.deferHonors) ns.ChairmanHonors?.runAutomatic(output);
    return output;
  }
  function awardEligible(w, h, award, strict) {
    return h.annual.year === date(w.turn).year && h.annual.starts > 0 && (!strict || h.annual.g1 > 0)
      && (!(award.categories || award.surface) || (h.annual.runs || []).some((r) => (!strict || r.rank === 1 && r.raceClass === "g1")
        && (!award.categories || award.categories.includes(category(r.distance))) && (!award.surface || r.surface === award.surface)))
      && (!award.age || (award.age === 4 ? ageOf(w, h) >= 4 : ageOf(w, h) === award.age))
      && (award.female == null || (h.gender === "牝马") === award.female);
  }
  function finishYear(world) {
    assert(world.phase === "yearEnd", "只有年末回合可以结束年度。");
    return mutate(world, (w, out) => {
      const year = date(w.turn).year;
      ns.ChairmanHonors?.finalizeAnnualHonors(w, out);
      const births = ns.ChairmanBreeding?.closeYear(w, out);
      for (const award of AWARDS) {
        const horseId = w.awardDraft[award.id];
        if (!horseId) continue;
        const h = w.horses.find((horse) => horse.id === horseId);
        assert(h && awardEligible(w, h, award, w.awardsStrict), `${award.name}候选不符合条件。`);
        const detail = (w.awardDetails || {})[award.id] || {};
        assert(!detail.representative || (h.annual.runs || []).some((r) => r.id === detail.representative), "代表赛事须为该马本年实际参加的比赛。");
        out.awards.push({ id: `${year}:${award.id}`, year, turn: w.turn, scope: 'central', associationName: '中央马会', awardId: award.id, name: award.name, horseId, horseName: h.name,
          comment: String(detail.comment || ""), representative: detail.representative || "", awardVersion: 2 });
      }
      for (const h of w.horses) {
        if (h.annual.starts || h.annual.manual != null) out.ratings.push({ id: `${year}:${h.id}`, horseId: h.id, horseName: h.name,
          year, rulesVersion: w.rulesVersion || 1, ratingVersion: w.ratingVersion, age: ageOf(w, h), gender: h.gender, homeRegion: h.homeRegion, ...(w.worldSystemVersion===2?{homeRegionId:h.homeRegionId}:{}), ...clone(h.annual), wtr: rating(h), tf: h.annual.starts ? h.annual.tf : null });
        h.previousWtr = rating(h);
        h.previousTf = h.annual.tf;
        if (h.breeding) ns.ChairmanBreeding.recordRating(h, year, rating(h), h.annual.tf);
        h.annual = emptyStats(year + 1);
      }
      w.turn++;
      w.phase = "season";
      w.awardDraft = {};
      w.awardDetails = {};
      w.awardVersions = { ...(w.awardVersions || {}), [year]: 2 };
      for (const h of w.horses) {
        const peak = ns.MaturityRules.getPeakWindow(h);
        if (h.status === "active" && w.settings.autoRetire && peak && timeFor(w, h).index > peak.endIndex) {
          h.status = "retired"; h.retiredYear = year + 1; h.booked = null;
        }
      }
      const homes = populationRegions(w);
      if (w.breeding) ns.ChairmanBreeding.startYear(w, out, births);
      else if (w.worldSystemVersion === 2) { for(const r of w.regions.filter(r=>r.autoPopulate&&!r.disabled))for(let i=0;i<r.annualTarget;i++)addHorse(w,{age:2,homeRegion:r.name}); }
      else for (let i = 0; homes.length && i < w.settings.annualNewHorses; i++) addHorse(w, { age: 2, homeRegion: homes[i % homes.length] });
      planEntries(w);
    });
  }
  function edit(world, kind, value) {
    if (world.worldSystemVersion === 2 && ns.ChairmanWorld.editKinds.includes(kind)) return ns.ChairmanWorld.edit(world, kind, value);
    if (world.worldSystemVersion === 2 && kind === "horse") value = ns.ChairmanWorld.horseInput(world, value);
    return mutate(world, (w) => {
      if (kind === "region") {
        w.regions = clone(regions(w));
        const existing = w.regions.find((r) => r.id === value.id);
        assert(!value.id || existing, "地区不存在。");
        const name = String(value.name || "").trim();
        assert(name && name.length <= 80 && !/[\u0000-\u001f|]/.test(name) && name !== "未记录", "地区名需为1～80字，不能包含换行或竖线，也不能使用“未记录”。");
        assert(!existing || existing.name === name, "已建立地区的名称不能修改，以保留历史关联。");
        assert(!w.regions.some((r) => r.id !== value.id && r.name === name), "地区名称已存在。");
        assert(REGIONS.includes(value.baseRegion), "请选择有效的参考比赛环境。");
        assert(!existing || !REGIONS.includes(existing.name) || value.baseRegion === existing.baseRegion, "默认地区的参考环境保持原有规则。");
        const region = { id: existing ? existing.id : id(w, "region"), name, baseRegion: value.baseRegion, autoPopulate: !!value.autoPopulate };
        if (existing) Object.assign(existing, region); else w.regions.push(region);
      } else if (kind === "track") {
        const existing = w.tracks.find((t) => t.id === value.id);
        const track = { ...(existing || { id: id(w, "track"), deleted: false }), ...value };
        validateTrack(track, w);
        assert(!w.tracks.some((t) => t.id !== track.id && !t.deleted && t.name === track.name), "马场名称已存在。");
        for (const race of w.races.filter((r) => !r.deleted && r.trackId === track.id)) assert(track.surfaces.includes(race.surface), "该马场仍有使用此场地的赛事。");
        if (existing) Object.assign(existing, track); else w.tracks.push(track);
      } else if (kind === "race") {
        const existing = w.races.find((r) => r.id === value.id);
        const race = { ...(existing || { id: id(w, "race"), deleted: false }), ...value };
        race.grade = race.raceClass === "op" ? "OP" : race.raceClass.toUpperCase();
        validateRace(w, race);
        // A rescheduled race that already ran this year must not acquire another occurrence.
        race.notBeforeYear = existing && existing.lastHeldYear === date(w.turn).year ? date(w.turn).year + 1 : race.notBeforeYear;
        if (existing) Object.assign(existing, race); else w.races.push(race);
      } else if (kind === "horse") {
        value = setHorseAge(w, value);
        if (w.breeding) value = ns.ChairmanBreeding.resolveParents(w, value);
        const existing = w.horses.find((h) => h.id === value.id);
        if (existing) {
          assert(existing.origin === "custom" || w.worldSystemVersion===2 && Object.keys(value).every(k=>["id","homeRegion","homeRegionId","locationRegion","locationRegionId"].includes(k)), "普通AI马的真实属性不可编辑。");
          const h = { ...existing, ...value };
          if (h.homeRegion !== existing.homeRegion) { h.locationRegion = h.homeRegion; h.booked = null; }
          initializeHorseTime(w, h, existing);
          validateHorse(w, h);
          Object.assign(existing, h);
          if (value.breedingStrength != null && w.breeding) { ns.ChairmanGenetics.setValues(w,existing,value.breedingStrength); delete existing.breedingStrength; }
        } else addHorse(w, { ...value, origin: "custom" });
        validateWorld(w);
      } else if (kind === "retire") {
        const h = w.horses.find((item) => item.id === value.id);
        assert(h, "马匹不存在。"); h.status = "retired"; h.retiredYear = date(w.turn).year; h.booked = null;
      } else if (kind === "deleteRace") {
        const race = w.races.find((r) => r.id === value.id);
        assert(race, "赛事不存在。"); race.deleted = true;
        for(const series of w.series||[])if(series.raceIds.includes(race.id))series.deleted=true;
      } else if (kind === "wtr") {
        const h = w.horses.find((item) => item.id === value.id);
        assert(h, "马匹不存在。"); h.annual.manual = ns.ChairmanRatings.score(value.score);
      } else if (kind === "preparationRaces") {
        for (const race of ns.ChairmanScheduling.preparationRaces(w)) w.races.push({ ...race, id: id(w, "race") });
      } else if (kind === "settings") {
        assert(Number.isSafeInteger(value.annualNewHorses) && value.annualNewHorses >= 0, "自动补充数量须为非负整数。");
        w.settings = { annualNewHorses: value.annualNewHorses, autoRetire: !!value.autoRetire };
      } else if (kind === "awards") {
        w.awardDraft = { ...value.draft }; w.awardsStrict = !!value.strict;
        w.awardDetails = clone(value.details || w.awardDetails || {});
      } else if (kind === "ui") w.ui = { ...w.ui, ...value };
      else throw new Error("不支持的操作。");
      if (!["ui", "awards", "wtr"].includes(kind)) planEntries(w);
    });
  }
  function scorePerformance(world, performance, score, yearRows, archived) {
    score = ns.ChairmanRatings.score(score);
    assert(["g1", "g2", "g3"].includes(performance.raceClass), "普通赛不开放人工评分。");
    assert(!performance.retired || score === null, "退赛不生成赛事评级。");
    return mutate(world, (w, out) => {
      const row = { ...performance, manualRating: score };
      out.performances.push(row);
      const h = w.horses.find((horse) => horse.id === row.horseId);
      assert(h, '马匹不存在。');
      ns.ChairmanRatings.applyManualYear(w,h,row.year,yearRows.map(p=>p.id===row.id?row:p),archived,out);
      // Existing bookings remain fixed: retrospective ratings do not change entry qualification.
    });
  }
  function validateWorld(w) {
    ns.ChairmanSeries?.validate(w);
    ns.ChairmanEditor?.validate(w);
    assert(w && w.schemaVersion === 1 && typeof w.id === "string", "存档版本不受支持。");
    assert(typeof w.name === "string" && w.ui && typeof w.ui === "object" && !Array.isArray(w.ui)
      && w.awardDraft && typeof w.awardDraft === "object" && typeof w.awardsStrict === "boolean", "世界界面或颁奖状态缺失。");
    assert((w.rulesVersion || 1) === 1 && [1, 2].includes(w.ratingVersion), "存档使用的规则版本不受支持。");
    if (w.ratingVersion >= 2) {
      assert([w.ratingSeed,w.aiRngState].every(v=>Number.isInteger(v)&&v>=0&&v<=0xffffffff), '评级或AI随机状态无效。');
      for(const h of w.horses || []) if(h.recentForm) assert(Array.isArray(h.recentForm) && h.recentForm.length<=12 && h.recentForm.every(p=>Number.isInteger(p.turn)&&p.turn<=w.turn&&(p.tf==null||finite(p.tf))&&finite(p.distance)&&p.distance>0&&['草地','泥地'].includes(p.surface)&&(w.worldSystemVersion===2?ns.ChairmanWorld.classes:['op','g3','g2','g1']).includes(p.raceClass)), '近期表现摘要无效。');
    }
    assert(Number.isInteger(w.turn) && w.turn >= 0 && ["season", "yearEnd"].includes(w.phase), "世界时间无效。");
    assert(w.phase !== "yearEnd" || w.turn % 24 === 23, "年末回合时间无效。");
    assert(Number.isInteger(w.revision) && w.revision >= 0 && Number.isInteger(w.rngState) && w.rngState >= 0 && w.rngState <= 0xffffffff && Number.isSafeInteger(w.nextId) && w.nextId > 0, "随机状态或编号无效。");
    assert(w.settings && Number.isSafeInteger(w.settings.annualNewHorses) && w.settings.annualNewHorses >= 0 && typeof w.settings.autoRetire === "boolean", "世界设置无效。");
    assert(w.regions === undefined || Array.isArray(w.regions), "地区设置无效。");
    const areas = regions(w);
    assert(areas.every((r) => r && typeof r.id === "string" && r.id && typeof r.name === "string" && r.name.trim() === r.name
      && r.name.length > 0 && r.name.length <= 80 && !/[\u0000-\u001f|]/.test(r.name) && r.name !== "未记录"
      && REGIONS.includes(r.baseRegion) && typeof r.autoPopulate === "boolean")
      && new Set(areas.map((r) => r.id)).size === areas.length && new Set(areas.map((r) => r.name)).size === areas.length, "地区名称、编号或参考环境无效或重复。");
    assert(w.worldSystemVersion === 2 || REGIONS.every((name) => areas.some((r) => r.name === name && r.id === REGION_IDS[name] && r.baseRegion === name)), "存档缺少默认地区。");
    for (const r of areas) { const match = r.id.match(/^region-(\d+)$/); if (match) assert(Number(match[1]) < w.nextId, "地区编号与后续编号冲突。"); }
    for (const key of ["horses", "tracks", "races"]) {
      assert(Array.isArray(w[key]), `存档缺少${key}。`);
      assert(new Set(w[key].map((item) => item.id)).size === w[key].length && w[key].every((item) => typeof item.id === "string" && item.id), `${key}编号重复或缺失。`);
      for (const item of w[key]) { const match = item.id.match(/^(?:horse|race|track)-(\d+)$/); if (match) assert(Number(match[1]) < w.nextId, "下一个编号与现有对象冲突。"); }
    }
    w.tracks.forEach((t) => validateTrack(t, w));
    w.races.filter((r) => !r.deleted).forEach((r) => validateRace(w, r));
    w.horses.forEach((h) => {
      validateHorse(w, h);
      assert(h.annual && h.lifetime && h.maturity && h.fatigue && h.observations, "马匹状态不完整。");
      assert(["active", "retired", ...(w.breeding ? ["juvenile"] : [])].includes(h.status) && ["ai", "custom"].includes(h.origin), "马匹身份无效。");
      assert(regionNames(w).includes(h.locationRegion) && Number.isInteger(h.restUntil) && h.restUntil >= 0, "马匹地点或休养状态无效。");
      assert(h.lastRaceTurn === null || Number.isInteger(h.lastRaceTurn) && h.lastRaceTurn <= w.turn, "出赛时间无效。");
      assert(h.annual.year === date(w.turn).year, "本年评分年份与世界时间不符。");
      for (const stats of [h.annual, h.lifetime]) assert([stats.starts, stats.wins, stats.g1].every((v) => Number.isInteger(v) && v >= 0)
        && stats.wins <= stats.starts && stats.g1 <= stats.wins && finite(stats.prize) && stats.prize >= 0, "马匹战绩无效。");
      for (const key of ["tf", "suggested", "manual"]) assert(h.annual[key] === null || finite(h.annual[key]), "马匹评级无效。");
      assert(finite(h.maturity.decline) && h.maturity.decline >= 0 && Number.isInteger(h.maturity.lastCheckedIndex), "成长状态无效。");
      assert(typeof h.observations === "object" && !Array.isArray(h.observations) && Object.values(h.observations).every((v) => v && Number.isInteger(v.count) && v.count > 0 && finite(v.total)), "已观察表现资料无效。");
      if (h.booked) assert(w.races.some((r) => r.id === h.booked.raceId && (!r.deleted || (w.lockedRaces || {})[`${date(h.booked.turn).year}:${r.id}`])) && Number.isInteger(h.booked.turn) && h.booked.turn >= w.turn && regionNames(w).includes(h.booked.targetRegion), "报名关联无效。");
      for (const parent of [h.fatherId, h.motherId]) if (parent) assert([...w.horses, ...(w.pedigrees || [])].some((other) => other.id === parent), "父母编号不存在。");
    });
    const byId = new Map([...w.horses, ...(w.pedigrees || [])].map((h) => [h.id, h]));
    const complete = new Set();
    function visit(h, path) {
      if (complete.has(h.id)) return;
      assert(!path.has(h.id), "血统不能形成循环。");
      const next = new Set(path); next.add(h.id);
      for (const [key, gender] of [["fatherId", "牡马"], ["motherId", "牝马"]]) if (h[key]) {
        const parent = byId.get(h[key]);
        assert(parent && parent.gender === gender && parent.birthYear <= h.birthYear - 2, "父母性别或出生年代不合理。");
        visit(parent, next);
      }
      complete.add(h.id);
    }
    w.horses.forEach((h) => visit(h, new Set()));
    ns.ChairmanBreeding?.validate(w);
    ns.ChairmanHonors?.validate(w);
    if (w.worldSystemVersion === 2) ns.ChairmanWorld.validate(w);
    return true;
  }
  ns.ChairmanRules = { setHorseAge, initializeHorseTime, REGIONS, regions, regionNames, populationRegions, regionBase, simulationRace, AWARDS, G1_IDS, clone, date, ageOf, timeFor, category, rating, entryRating,
    emptyStats, createWorld, addHorse, planEntries, advanceHalfMonth, finishYear, edit, mutate, seeded,
    validateWorld, validateHorse, validateRace, validateTrack, engineRace, eligible, awardEligible, defaultPrizes, scorePerformance };
})();
