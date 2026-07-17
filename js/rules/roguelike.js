(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const R = ns.Random;

  const PROFILE_VERSION = 2;
  const STAGES = ["bronze", "silver", "gold"];
  const STAGE_LABELS = { none: "未完成", bronze: "铜级", silver: "银级", gold: "金级" };
  const STAGE_REWARDS = { none: 10, bronze: 30, silver: 50, gold: 70 };
  const SERVICE_PRICES = {
    reroll: 10,
    selected: 70,
    champion: 150,
    reappraise: 30,
    authoritative: 60,
    adaptation: 30
  };
  const CONSUMABLE_PRODUCTS = Object.freeze({
    reroll: Object.freeze({ id: "reroll", category: "refresh", label: "重新寻马券", price: SERVICE_PRICES.reroll, description: "按普通范围重新生成指定位置的候选。" }),
    selected: Object.freeze({ id: "selected", category: "refresh", label: "精选马驹券", price: SERVICE_PRICES.selected, description: "重新生成实力 74～94 的精选候选。" }),
    champion: Object.freeze({ id: "champion", category: "refresh", label: "拍买马王券", price: SERVICE_PRICES.champion, description: "重新生成实力 81～100、主要场地至少 A 的候选。" }),
    reappraise: Object.freeze({ id: "reappraise", category: "review", label: "再次鉴定券", price: SERVICE_PRICES.reappraise, description: "由原练马师重新给出一组独立评语。" }),
    authoritative: Object.freeze({ id: "authoritative", category: "review", label: "权威复核券", price: SERVICE_PRICES.authoritative, description: "生成一组可靠程度提升一级的复核评语。" }),
    adaptation: Object.freeze({ id: "adaptation", category: "adaptation", label: "赛区调教券", price: SERVICE_PRICES.adaptation, description: "选马后将指定赛区的一项可提升适性随机提高一级。" })
  });
  const CONSUMABLE_IDS = Object.keys(CONSUMABLE_PRODUCTS);
  const PERMANENT_PRICES = { obrien: 80, pletcher: 80, veterinarian: 180 };
  const ACCURACY_ORDER = ["wrong", "unknown", "fuzzy", "close", "precise"];
  const GRADED_CLASSES = new Set(["g3", "g2", "g1", "jpn3", "jpn2", "jpn1"]);
  const TOP_CLASSES = new Set(["g1", "jpn1"]);

  const CHALLENGES = [
    {
      id: "consistency",
      group: "performance",
      groupLabel: "通用表现",
      name: "稳定主义",
      conditions: {
        bronze: "连续5场进入前二，其中至少2场为重赏",
        silver: "连续5场进入前二，其中至少3场为顶级赛事",
        gold: "连续8场进入前二，其中至少5场为顶级赛事，并取得至少3胜"
      }
    },
    {
      id: "winning-streak",
      group: "performance",
      groupLabel: "通用表现",
      name: "连胜气势",
      conditions: {
        bronze: "取得4连胜，其中至少1场为顶级赛事",
        silver: "取得6连胜，其中至少3场为顶级赛事",
        gold: "取得8连胜，其中至少5场为顶级赛事"
      }
    },
    {
      id: "selective-campaign",
      group: "performance",
      groupLabel: "通用表现",
      name: "少而精",
      conditions: {
        bronze: "生涯前6战取得3胜，其中至少1场为顶级赛事",
        silver: "生涯前8战取得5胜，其中至少3场为顶级赛事",
        gold: "生涯前10战取得7胜，其中至少5场为顶级赛事"
      }
    },
    {
      id: "distance-versatility",
      group: "route",
      groupLabel: "路线构筑",
      name: "距离全能",
      conditions: {
        bronze: "在三个距离类别获胜，其中两个类别赢得重赏",
        silver: "在两个距离类别赢得顶级赛事，并在第三类赢得重赏",
        gold: "在三个距离类别分别赢得顶级赛事"
      }
    },
    {
      id: "turf-dirt",
      group: "route",
      groupLabel: "路线构筑",
      name: "草泥并进",
      conditions: {
        bronze: "在草地和泥地分别赢得至少1场重赏",
        silver: "在草地和泥地分别赢得至少1场顶级赛事",
        gold: "在草地和泥地分别赢得至少2场顶级赛事"
      }
    },
    {
      id: "distance-specialist",
      group: "route",
      groupLabel: "路线构筑",
      name: "专项深耕",
      conditions: {
        bronze: "在同一距离类别赢得3场重赏",
        silver: "同类赢得3场顶级赛事，覆盖至少两个年龄",
        gold: "同类赢得5场顶级赛事，覆盖至少三个年龄"
      }
    },
    {
      id: "world-tour",
      group: "career",
      groupLabel: "生涯规划",
      name: "世界巡演",
      conditions: {
        bronze: "在初始所属地以外的地区赢得G1",
        silver: "在欧洲、美国、日本分别赢得至少1场G1",
        gold: "在欧洲、美国、日本、香港、中东分别赢得至少1场G1"
      }
    },
    {
      id: "evergreen",
      group: "career",
      groupLabel: "生涯规划",
      name: "常青之星",
      conditions: {
        bronze: "在三个不同年龄阶段分别赢得重赏",
        silver: "在三个不同年龄阶段分别赢得顶级赛事",
        gold: "在四个不同年龄阶段分别赢得顶级赛事"
      }
    },
    {
      id: "late-bloomer",
      group: "career",
      groupLabel: "生涯规划",
      name: "大器晚成",
      conditions: {
        bronze: "5岁及以后赢得顶级赛事",
        silver: "5岁及以后赢得3场顶级赛事，覆盖至少两个年龄",
        gold: "5岁及以后赢得5场顶级赛事，覆盖至少三个年龄"
      }
    }
  ];

  const PREFERRED_SIRES = {
    "sato-yuta": new Set(["deep-impact", "kizuna", "kitasan-black", "lord-kanaloa", "epiphaneia", "contrail", "duramente", "maurice", "sunday-silence", "king-kamehameha", "northern-taste", "tony-bin"]),
    obrien: new Set(["frankel", "dubawi", "galileo", "sea-the-stars", "wootton-bassett", "sadlers-wells", "danehill", "nijinsky", "mill-reef"]),
    pletcher: new Set(["into-mischief", "gun-runner", "curlin", "tapit", "justify", "mr-prospector", "ap-indy", "storm-cat", "unbridled"])
  };
  const PREFERRED_DAMS = {
    "sato-yuta": new Set(["wind-in-her-hair", "air-groove", "cesario", "fusaichi-pandora"]),
    obrien: new Set(["urban-sea", "miesque", "hasili", "special"]),
    pletcher: new Set(["la-troienne", "almahmoud", "best-in-show", "weekend-surprise"])
  };

  const ACHIEVEMENT_POINTS = {
    "g1-winner": 10,
    "jpni-champion": 10,
    "foreign-g1-winner": 10,
    "g1-multiple-winner": 20,
    "local-king": 20,
    "foreign-g1-tour": 20,
    "juvenile-champion": 20,
    "japan-alternate-triple-crown": 20,
    "spring-autumn-mile-king": 20,
    "spring-autumn-sprint-king": 20,
    "spring-autumn-grand-prix": 20,
    "spring-autumn-tenno-sho": 20,
    "king-george-arc": 20,
    "g1-legend": 40,
    "world-class-horse": 40,
    "japan-classic-triple-crown": 40,
    "japan-filly-triple-crown": 40,
    "japan-dirt-triple-crown": 40,
    "american-classic-triple-crown": 40,
    "american-filly-triple-crown": 40,
    "british-classic-triple-crown": 40,
    "british-filly-triple-crown": 40,
    "hong-kong-triple-crown": 40,
    "hong-kong-sprint-triple-crown": 40,
    "spring-older-triple-crown": 40,
    "autumn-older-triple-crown": 40,
    "older-horse-road-sweep": 40,
    "dirt-king": 40,
    "annual-sprint-king": 40,
    "annual-mile-king": 40,
    "annual-stayer-king": 40
  };

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function createId(prefix) {
    if (window.crypto && window.crypto.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${R.rollRange(100000, 999999)}`;
  }

  function createProfile() {
    return {
      honorCoins: 0,
      consumables: createConsumableCounts(),
      unlockedTrainerIds: ["sato-yuta"],
      residentVeterinarian: false,
      discoveredAchievementIds: {},
      discoveredRepeatRaceIds: {}
    };
  }

  function createConsumableCounts() {
    return CONSUMABLE_IDS.reduce((counts, id) => {
      counts[id] = 0;
      return counts;
    }, {});
  }

  function createConsumableUsage() {
    return CONSUMABLE_IDS.reduce((usage, id) => {
      usage[id] = false;
      return usage;
    }, {});
  }

  function normalizeServiceHistory(value) {
    if (Array.isArray(value)) return value.filter((item) => item && typeof item === "object");
    return value && typeof value === "object" ? [value] : [];
  }

  function normalizeRun(run) {
    if (!run || typeof run !== "object") return run || null;
    const services = run.services && typeof run.services === "object" ? run.services : {};
    const refreshHistory = normalizeServiceHistory(services.refresh);
    const reviewHistory = normalizeServiceHistory(services.review);
    const used = createConsumableUsage();
    const savedUsage = run.consumablesUsed && typeof run.consumablesUsed === "object"
      ? run.consumablesUsed
      : {};
    CONSUMABLE_IDS.forEach((id) => {
      used[id] = !!savedUsage[id];
    });
    refreshHistory.concat(reviewHistory).forEach((entry) => {
      if (entry && CONSUMABLE_PRODUCTS[entry.serviceId]) used[entry.serviceId] = true;
    });
    if (services.adaptation) used.adaptation = true;
    run.services = {
      refresh: refreshHistory,
      review: reviewHistory,
      adaptation: services.adaptation || null
    };
    run.consumablesUsed = used;
    run.spentCoins = Math.max(0, Number(run.spentCoins) || 0);
    return run;
  }

  function createSave() {
    return { version: PROFILE_VERSION, profile: createProfile(), run: null };
  }

  function normalizeSave(source) {
    const save = source && typeof source === "object" ? source : createSave();
    const base = createProfile();
    save.version = PROFILE_VERSION;
    save.profile = { ...base, ...(save.profile || {}) };
    save.profile.honorCoins = Math.max(0, Number(save.profile.honorCoins) || 0);
    const storedConsumables = save.profile.consumables && typeof save.profile.consumables === "object"
      ? save.profile.consumables
      : {};
    save.profile.consumables = createConsumableCounts();
    CONSUMABLE_IDS.forEach((id) => {
      const count = Number(storedConsumables[id]);
      save.profile.consumables[id] = Number.isFinite(count)
        ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(count)))
        : 0;
    });
    save.profile.unlockedTrainerIds = Array.isArray(save.profile.unlockedTrainerIds)
      ? [...new Set(["sato-yuta"].concat(save.profile.unlockedTrainerIds.filter((id) => ["sato-yuta", "obrien", "pletcher"].includes(id))))]
      : ["sato-yuta"];
    save.profile.discoveredAchievementIds = save.profile.discoveredAchievementIds || {};
    save.profile.discoveredRepeatRaceIds = save.profile.discoveredRepeatRaceIds || {};
    save.profile.residentVeterinarian = !!save.profile.residentVeterinarian;
    save.run = normalizeRun(save.run);
    return save;
  }

  function bloodlineWeight(item, trainerId, kind) {
    if (!item || item.id === "random") return 0;
    const preferred = kind === "dam" ? PREFERRED_DAMS[trainerId] : PREFERRED_SIRES[trainerId];
    return preferred && preferred.has(item.id) ? (kind === "dam" ? 115 : 135) : 100;
  }

  function pickBloodline(list, trainerId, kind) {
    const actual = (list || []).filter((item) => item && item.id !== "random");
    return R.weightedPick(actual, (item) => bloodlineWeight(item, trainerId, kind));
  }

  function trainerAllocation(profile) {
    const unlocked = (profile && profile.unlockedTrainerIds) || ["sato-yuta"];
    if (unlocked.length === 1) return [unlocked[0], unlocked[0], unlocked[0]];
    if (unlocked.length === 2) return [unlocked[0], unlocked[1], R.pickOne(unlocked)];
    return ["sato-yuta", "obrien", "pletcher"];
  }

  function hasGradeA(value) {
    return value === "A" || value === "S";
  }

  function hasReasonableRoute(horse) {
    const regions = [];
    Object.entries(horse.grass || {}).forEach(([region, grade]) => {
      if (hasGradeA(grade)) regions.push({ surface: "草地", region });
    });
    Object.entries(horse.dirt || {}).forEach(([region, grade]) => {
      if (hasGradeA(grade)) regions.push({ surface: "泥地", region });
    });
    if (regions.length === 0) return false;
    return regions.some((route) => (ns.Races || []).some((race) => {
      const region = race.surfaceRegion || "日本";
      const sexOkay = !race.sexRestriction || race.sexRestriction === horse.gender;
      return sexOkay
        && race.surface === route.surface
        && region === route.region
        && race.distance >= horse.distMin
        && race.distance <= horse.distMax;
    }));
  }

  function generateCandidate(trainerId, profileId) {
    const strengthProfile = profileId || "normal";
    const sire = pickBloodline(ns.SireBloodlines, trainerId, "sire");
    const dam = pickBloodline(ns.DamBloodlines, trainerId, "dam");
    const trainer = ns.CommentRules.getTrainer(trainerId);
    let horse = null;
    for (let attempt = 0; attempt < 200; attempt += 1) {
      horse = ns.HorseRules.generateHorse({
        name: "未命名小马",
        sireId: sire.id,
        damId: dam.id,
        gameMode: "roguelike",
        strengthProfile
      });
      if (hasReasonableRoute(horse)) break;
    }
    const regionId = ns.RegionRules.regionIdForTrainer(trainer);
    horse.trainerId = trainer.id;
    horse.trainerName = trainer.name;
    horse.homeRegionId = regionId;
    horse.currentRegionId = regionId;
    const initialComments = ns.CommentRules.generateDebutCommentDetails(horse, trainer.id);
    return {
      id: createId("candidate"),
      trainerId: trainer.id,
      trainerName: trainer.name,
      regionId,
      regionLabel: ns.RegionRules.getRegion(regionId).label,
      horse,
      initialComments,
      reviewComments: null,
      reviewLabel: ""
    };
  }

  function createRun(profile) {
    return {
      id: createId("rogue-run"),
      phase: "candidates",
      candidates: trainerAllocation(profile).map((trainerId) => generateCandidate(trainerId, "normal")),
      selectedCandidate: null,
      services: { refresh: [], review: [], adaptation: null },
      consumablesUsed: createConsumableUsage(),
      adaptationResolved: false,
      challengeOptions: null,
      selectedChallengeId: "",
      activeCareer: null,
      retiredSummary: null,
      settlement: null,
      settled: false,
      spentCoins: 0
    };
  }

  function spend(save, amount) {
    if (!save || !save.profile || save.profile.honorCoins < amount) return false;
    save.profile.honorCoins -= amount;
    if (save.run) save.run.spentCoins = (save.run.spentCoins || 0) + amount;
    return true;
  }

  function purchasePermanent(save, itemId) {
    if (!save || !save.profile) return { ok: false, reason: "肉鸽存档不可用。" };
    if (save.run) return { ok: false, reason: "进入选马后商店已经锁定。" };
    const price = PERMANENT_PRICES[itemId];
    if (!price) return { ok: false, reason: "未知永久商品。" };
    if (itemId === "veterinarian" && save.profile.residentVeterinarian) return { ok: false, reason: "驻场兽医已经解锁。" };
    if (["obrien", "pletcher"].includes(itemId) && save.profile.unlockedTrainerIds.includes(itemId)) return { ok: false, reason: "该练马师已经解锁。" };
    if (!spend(save, price)) return { ok: false, reason: "荣誉币不足。" };
    if (itemId === "veterinarian") save.profile.residentVeterinarian = true;
    else save.profile.unlockedTrainerIds.push(itemId);
    return { ok: true, price };
  }

  function purchaseConsumable(save, itemId) {
    if (!save || !save.profile) return { ok: false, reason: "肉鸽存档不可用。" };
    if (save.run) return { ok: false, reason: "进入选马后商店已经锁定。" };
    const product = CONSUMABLE_PRODUCTS[itemId];
    if (!product) return { ok: false, reason: "未知消耗品。" };
    save.profile.consumables = save.profile.consumables || createConsumableCounts();
    const current = Math.max(0, Math.floor(Number(save.profile.consumables[itemId]) || 0));
    if (current >= Number.MAX_SAFE_INTEGER) return { ok: false, reason: "该消耗品库存已满。" };
    if (!spend(save, product.price)) return { ok: false, reason: "荣誉币不足。" };
    save.profile.consumables[itemId] = current + 1;
    return { ok: true, itemId, price: product.price, count: current + 1 };
  }

  function prepareConsumableUse(save, itemId, category) {
    const run = save && save.run;
    const product = CONSUMABLE_PRODUCTS[itemId];
    if (!save || !save.profile || !run) return { ok: false, reason: "当前没有进行中的肉鸽挑战。" };
    if (!product || product.category !== category) return { ok: false, reason: "未知或不适用的消耗品。" };
    run.consumablesUsed = { ...createConsumableUsage(), ...(run.consumablesUsed || {}) };
    if (run.consumablesUsed[itemId]) return { ok: false, reason: "本局已经使用过该消耗品。" };
    save.profile.consumables = { ...createConsumableCounts(), ...(save.profile.consumables || {}) };
    if ((Number(save.profile.consumables[itemId]) || 0) < 1) return { ok: false, reason: "该消耗品库存不足。" };
    return { ok: true, run, product };
  }

  function finishConsumableUse(save, run, itemId) {
    save.profile.consumables[itemId] = Math.max(0, Math.floor(Number(save.profile.consumables[itemId]) || 0) - 1);
    run.consumablesUsed[itemId] = true;
  }

  function candidateById(run, candidateId) {
    return run && Array.isArray(run.candidates)
      ? run.candidates.find((candidate) => candidate.id === candidateId)
      : null;
  }

  function useRefreshConsumable(save, candidateId, serviceId) {
    const prepared = prepareConsumableUse(save, serviceId, "refresh");
    if (!prepared.ok) return prepared;
    const run = prepared.run;
    if (!run || run.phase !== "candidates") return { ok: false, reason: "当前不能刷新候选。" };
    const target = candidateById(run, candidateId);
    if (!target) return { ok: false, reason: "候选不存在。" };
    const replacement = generateCandidate(target.trainerId, serviceId === "reroll" ? "normal" : serviceId);
    const index = run.candidates.indexOf(target);
    run.candidates[index] = replacement;
    run.services.refresh = normalizeServiceHistory(run.services.refresh);
    run.services.refresh.push({ serviceId, previousCandidateId: candidateId, candidateId: replacement.id, consumed: 1 });
    finishConsumableUse(save, run, serviceId);
    return { ok: true, candidate: replacement, consumed: 1 };
  }

  function upgradedAccuracy(comments) {
    return (comments || []).reduce((items, comment) => {
      const index = Math.max(0, ACCURACY_ORDER.indexOf(comment.accuracy));
      items[comment.id] = ACCURACY_ORDER[Math.min(ACCURACY_ORDER.length - 1, index + 1)];
      return items;
    }, {});
  }

  function useReviewConsumable(save, candidateId, serviceId) {
    const prepared = prepareConsumableUse(save, serviceId, "review");
    if (!prepared.ok) return prepared;
    const run = prepared.run;
    if (!run || run.phase !== "candidates") return { ok: false, reason: "当前不能购买评语服务。" };
    const target = candidateById(run, candidateId);
    if (!target) return { ok: false, reason: "候选不存在。" };
    if (target.reviewComments) return { ok: false, reason: "同一匹候选不能叠加两种评语券。" };
    const options = serviceId === "authoritative"
      ? { accuracyById: upgradedAccuracy(target.initialComments) }
      : null;
    target.reviewComments = ns.CommentRules.generateDebutCommentDetails(target.horse, target.trainerId, options);
    target.reviewLabel = serviceId === "authoritative" ? "权威复核" : "再次鉴定";
    run.services.review = normalizeServiceHistory(run.services.review);
    run.services.review.push({ serviceId, candidateId, consumed: 1 });
    finishConsumableUse(save, run, serviceId);
    return { ok: true, candidate: target, consumed: 1 };
  }

  function selectCandidate(save, candidateId) {
    const run = save.run;
    const selected = candidateById(run, candidateId);
    if (!selected || run.phase !== "candidates") return { ok: false, reason: "当前不能选择该赛马。" };
    run.selectedCandidate = selected;
    run.candidates = null;
    run.phase = "horse-setup";
    return { ok: true, candidate: selected };
  }

  function eligibleAdaptationFields(horse, direction) {
    const fields = direction === "japan"
      ? [{ group: "grass", region: "日本" }, { group: "dirt", region: "日本" }]
      : (direction === "europe"
        ? [{ group: "grass", region: "欧洲" }]
        : [{ group: "grass", region: "美国" }, { group: "dirt", region: "美国" }]);
    return fields.filter((field) => ["G", "C", "B"].includes((horse[field.group] || {})[field.region]));
  }

  function skipAdaptation(save) {
    const run = save.run;
    if (!run || run.phase !== "horse-setup" || run.adaptationResolved) return { ok: false, reason: "赛区调教已经处理。" };
    run.adaptationResolved = true;
    ensureChallengeOptions(run);
    return { ok: true, skipped: true };
  }

  function useAdaptationConsumable(save, direction) {
    const prepared = prepareConsumableUse(save, "adaptation", "adaptation");
    if (!prepared.ok) return prepared;
    const run = prepared.run;
    if (!run || run.phase !== "horse-setup" || run.adaptationResolved) return { ok: false, reason: "赛区调教已经处理。" };
    const horse = run.selectedCandidate.horse;
    const eligible = eligibleAdaptationFields(horse, direction);
    if (eligible.length === 0) return { ok: false, reason: "该方向的对应适性已经全部达到A或S。" };
    const picked = R.pickOne(eligible);
    const grades = { G: "C", C: "B", B: "A" };
    const before = horse[picked.group][picked.region];
    horse[picked.group][picked.region] = grades[before];
    run.services.adaptation = { direction, field: picked, before, after: grades[before], consumed: 1 };
    run.adaptationResolved = true;
    finishConsumableUse(save, run, "adaptation");
    ensureChallengeOptions(run);
    return { ok: true, consumed: 1 };
  }

  function resolveAdaptation(save, direction, purchase) {
    return purchase ? useAdaptationConsumable(save, direction) : skipAdaptation(save);
  }

  function ensureChallengeOptions(run) {
    if (!run.challengeOptions) {
      run.challengeOptions = ["performance", "route", "career"].map((group) => {
        const picked = R.pickOne(CHALLENGES.filter((challenge) => challenge.group === group));
        return picked.id;
      });
    }
    return run.challengeOptions;
  }

  function chooseChallenge(save, challengeId) {
    const run = save.run;
    if (!run || run.phase !== "horse-setup" || !run.adaptationResolved) return { ok: false, reason: "请先完成或跳过赛区调教。" };
    ensureChallengeOptions(run);
    if (!run.challengeOptions.includes(challengeId)) return { ok: false, reason: "挑战目标不在本局选项中。" };
    run.selectedChallengeId = challengeId;
    run.phase = "jockey";
    return { ok: true };
  }

  function challengeById(challengeId) {
    return CHALLENGES.find((challenge) => challenge.id === challengeId) || null;
  }

  function raceForRecord(record) {
    if (record && record.hidden && record.hidden.race) return record.hidden.race;
    const raceId = record && record.public && record.public.raceId;
    return (ns.Races || []).find((race) => race.id === raceId) || {};
  }

  function distanceCategory(distance) {
    if (distance <= 1300) return "短途";
    if (distance <= 1800) return "英里";
    if (distance <= 2200) return "中距离";
    if (distance <= 2600) return "中长距离";
    return "长距离";
  }

  function recordAge(record) {
    const schedule = record && record.hidden && record.hidden.schedule;
    if (schedule && Number.isFinite(schedule.age)) return schedule.age;
    const label = record && record.public && record.public.timeLabel;
    const match = String(label || "").match(/(\d+)岁/);
    return match ? Number(match[1]) : null;
  }

  function normalizeRecords(career) {
    return ((career && career.races) || []).map((record) => {
      const publicResult = record.public || {};
      const race = raceForRecord(record);
      const retired = !!publicResult.retired;
      const win = !retired && (publicResult.rank === 1 || publicResult.rankLabel === "一着" || publicResult.deadHeat);
      const topTwo = !retired && (win || publicResult.rank === 2 || publicResult.rankLabel === "二着");
      const raceClass = race.raceClass || "";
      return {
        record,
        race,
        retired,
        win,
        topTwo,
        graded: GRADED_CLASSES.has(raceClass),
        top: TOP_CLASSES.has(raceClass),
        g1: raceClass === "g1",
        age: recordAge(record),
        region: race.surfaceRegion || "日本",
        surface: race.surface || "",
        distanceCategory: distanceCategory(race.distance || 0)
      };
    });
  }

  function windowMatches(records, size, test) {
    for (let start = 0; start <= records.length - size; start += 1) {
      const windowRecords = records.slice(start, start + size);
      if (test(windowRecords)) return true;
    }
    return false;
  }

  function currentStreak(records, predicate) {
    let count = 0;
    for (let index = records.length - 1; index >= 0; index -= 1) {
      if (!predicate(records[index])) break;
      count += 1;
    }
    return count;
  }

  function bestStreak(records, predicate) {
    let best = 0;
    let current = 0;
    records.forEach((record) => {
      current = predicate(record) ? current + 1 : 0;
      best = Math.max(best, current);
    });
    return best;
  }

  function stageResult(flags) {
    if (flags.gold) return "gold";
    if (flags.silver) return "silver";
    if (flags.bronze) return "bronze";
    return "none";
  }

  function mapWinStats(records, key) {
    return records.filter((record) => record.win).reduce((items, record) => {
      const id = record[key];
      if (!items[id]) items[id] = { wins: 0, graded: 0, top: 0, ages: new Set() };
      items[id].wins += 1;
      if (record.graded) items[id].graded += 1;
      if (record.top) items[id].top += 1;
      if (Number.isFinite(record.age)) items[id].ages.add(record.age);
      return items;
    }, {});
  }

  function evaluateChallenge(career, challengeId) {
    const challenge = challengeById(challengeId);
    const records = normalizeRecords(career);
    const metrics = {
      starts: records.length,
      wins: records.filter((record) => record.win).length,
      topWins: records.filter((record) => record.win && record.top).length,
      currentTopTwoStreak: currentStreak(records, (record) => record.topTwo),
      bestTopTwoStreak: bestStreak(records, (record) => record.topTwo),
      currentWinStreak: currentStreak(records, (record) => record.win),
      bestWinStreak: bestStreak(records, (record) => record.win),
      distanceCategories: [...new Set(records.filter((record) => record.win).map((record) => record.distanceCategory))],
      surfaces: {},
      regions: [...new Set(records.filter((record) => record.win && record.g1).map((record) => record.region))],
      ages: [...new Set(records.filter((record) => record.win && record.graded).map((record) => record.age).filter(Number.isFinite))].sort()
    };
    const genericSurfaceStats = mapWinStats(records, "surface");
    metrics.surfaces = Object.keys(genericSurfaceStats).reduce((items, key) => {
      items[key] = {
        wins: genericSurfaceStats[key].wins,
        graded: genericSurfaceStats[key].graded,
        top: genericSurfaceStats[key].top
      };
      return items;
    }, {});
    const flags = { bronze: false, silver: false, gold: false };
    const failedStages = [];
    if (!challenge) return { challenge: null, stage: "none", flags, failedStages, metrics };

    if (challengeId === "consistency") {
      flags.bronze = windowMatches(records, 5, (items) => items.every((item) => item.topTwo) && items.filter((item) => item.graded).length >= 2);
      flags.silver = windowMatches(records, 5, (items) => items.every((item) => item.topTwo) && items.filter((item) => item.top).length >= 3);
      flags.gold = windowMatches(records, 8, (items) => items.every((item) => item.topTwo) && items.filter((item) => item.top).length >= 5 && items.filter((item) => item.win).length >= 3);
    } else if (challengeId === "winning-streak") {
      flags.bronze = windowMatches(records, 4, (items) => items.every((item) => item.win) && items.filter((item) => item.top).length >= 1);
      flags.silver = windowMatches(records, 6, (items) => items.every((item) => item.win) && items.filter((item) => item.top).length >= 3);
      flags.gold = windowMatches(records, 8, (items) => items.every((item) => item.win) && items.filter((item) => item.top).length >= 5);
    } else if (challengeId === "selective-campaign") {
      const checks = { bronze: [6, 3, 1], silver: [8, 5, 3], gold: [10, 7, 5] };
      Object.entries(checks).forEach(([stage, values]) => {
        const [limit, wins, topWins] = values;
        const first = records.slice(0, limit);
        flags[stage] = first.filter((item) => item.win).length >= wins && first.filter((item) => item.win && item.top).length >= topWins;
        if (!flags[stage] && records.length >= limit) failedStages.push(stage);
      });
    } else if (challengeId === "distance-versatility") {
      const stats = mapWinStats(records, "distanceCategory");
      metrics.distanceCategories = Object.keys(stats);
      const won = Object.values(stats).filter((item) => item.wins >= 1).length;
      const graded = Object.values(stats).filter((item) => item.graded >= 1).length;
      const top = Object.values(stats).filter((item) => item.top >= 1).length;
      flags.bronze = won >= 3 && graded >= 2;
      flags.silver = top >= 2 && graded >= 3;
      flags.gold = top >= 3;
    } else if (challengeId === "turf-dirt") {
      const stats = mapWinStats(records, "surface");
      metrics.surfaces = Object.keys(stats).reduce((items, key) => {
        items[key] = { wins: stats[key].wins, graded: stats[key].graded, top: stats[key].top };
        return items;
      }, {});
      const grass = stats["草地"] || { graded: 0, top: 0 };
      const dirt = stats["泥地"] || { graded: 0, top: 0 };
      flags.bronze = grass.graded >= 1 && dirt.graded >= 1;
      flags.silver = grass.top >= 1 && dirt.top >= 1;
      flags.gold = grass.top >= 2 && dirt.top >= 2;
    } else if (challengeId === "distance-specialist") {
      const stats = mapWinStats(records, "distanceCategory");
      metrics.distanceCategories = Object.keys(stats);
      flags.bronze = Object.values(stats).some((item) => item.graded >= 3);
      flags.silver = Object.values(stats).some((item) => item.top >= 3 && item.ages.size >= 2);
      flags.gold = Object.values(stats).some((item) => item.top >= 5 && item.ages.size >= 3);
    } else if (challengeId === "world-tour") {
      const regions = [...new Set(records.filter((record) => record.win && record.g1).map((record) => record.region))];
      metrics.regions = regions;
      const originalRegionId = career && career.stable && career.stable.originalRegionId
        ? career.stable.originalRegionId
        : (career && career.horse && career.horse.homeRegionId) || "japan";
      const homeRegions = ns.RegionRules.getRegion(originalRegionId).raceRegions || [];
      flags.bronze = regions.some((region) => !homeRegions.includes(region));
      flags.silver = ["欧洲", "美国", "日本"].every((region) => regions.includes(region));
      flags.gold = ["欧洲", "美国", "日本", "香港", "中东"].every((region) => regions.includes(region));
    } else if (challengeId === "evergreen") {
      const gradedAges = new Set(records.filter((record) => record.win && record.graded).map((record) => record.age).filter(Number.isFinite));
      const topAges = new Set(records.filter((record) => record.win && record.top).map((record) => record.age).filter(Number.isFinite));
      metrics.ages = [...new Set([...gradedAges, ...topAges])].sort();
      flags.bronze = gradedAges.size >= 3;
      flags.silver = topAges.size >= 3;
      flags.gold = topAges.size >= 4;
    } else if (challengeId === "late-bloomer") {
      const late = records.filter((record) => record.win && record.top && record.age >= 5);
      const ages = new Set(late.map((record) => record.age));
      metrics.ages = [...ages].sort();
      flags.bronze = late.length >= 1;
      flags.silver = late.length >= 3 && ages.size >= 2;
      flags.gold = late.length >= 5 && ages.size >= 3;
    }

    return { challenge, stage: stageResult(flags), flags, failedStages, metrics };
  }

  function isValidCareer(career, forced) {
    if (forced) return true;
    if (!career || (career.races || []).length < 3 || !career.currentTime) return false;
    return career.currentTime.index >= ns.TimeRules.toIndex(3, 6, 1);
  }

  function resolveAchievementOverlaps(achievements) {
    const awarded = (achievements || []).slice();
    const suppressed = [];
    function suppress(id, reason) {
      const index = awarded.findIndex((item) => item.id === id);
      if (index < 0) return;
      const item = awarded.splice(index, 1)[0];
      suppressed.push({ id: item.id, name: item.name, reason });
    }
    if (awarded.some((item) => item.id === "japan-classic-triple-crown")) {
      suppress("japan-alternate-triple-crown", "与日本经典三冠重叠");
    } else if (awarded.some((item) => item.id === "japan-filly-triple-crown")) {
      suppress("japan-alternate-triple-crown", "与日本牝马三冠重叠");
    }
    if (awarded.some((item) => item.id === "older-horse-road-sweep")) {
      suppress("spring-autumn-grand-prix", "古马王道完全制霸已覆盖");
      suppress("spring-autumn-tenno-sho", "古马王道完全制霸已覆盖");
    }
    return { awarded, suppressed };
  }

  function achievementPointValue(achievement) {
    if (achievement && achievement.id && achievement.id.indexOf("repeat-") === 0) return 20;
    return ACHIEVEMENT_POINTS[achievement && achievement.id] || 0;
  }

  function achievementDiscovery(achievement, profile) {
    if (achievement.id.indexOf("repeat-") === 0) {
      const raceId = achievement.id.slice("repeat-".length);
      return { key: raceId, first: !profile.discoveredRepeatRaceIds[raceId], repeat: true };
    }
    return { key: achievement.id, first: !profile.discoveredAchievementIds[achievement.id], repeat: false };
  }

  function markDiscovery(profile, achievement, discovery) {
    if (discovery.repeat) profile.discoveredRepeatRaceIds[discovery.key] = true;
    else profile.discoveredAchievementIds[discovery.key] = true;
    const lower = {
      "g1-multiple-winner": ["g1-winner"],
      "g1-legend": ["g1-winner", "g1-multiple-winner"],
      "local-king": ["jpni-champion"],
      "foreign-g1-tour": ["foreign-g1-winner"],
      "world-class-horse": ["foreign-g1-winner", "foreign-g1-tour"]
    };
    (lower[achievement.id] || []).forEach((id) => {
      profile.discoveredAchievementIds[id] = true;
    });
  }

  function buildSettlement(profileSource, career, forced) {
    const profile = clone(profileSource);
    const valid = isValidCareer(career, forced);
    const challengeProgress = evaluateChallenge(career, career && career.roguelike && career.roguelike.challengeId);
    if (!valid) {
      return {
        profile,
        settlement: {
          valid: false,
          forced: !!forced,
          challengeProgress,
          challengeCoins: 0,
          challengeScore: 0,
          achievements: [],
          suppressedAchievements: [],
          achievementCoins: 0,
          achievementScore: 0,
          totalCoins: 0,
          totalScore: 0,
          balanceAfter: profile.honorCoins
        }
      };
    }
    const challengeCoins = STAGE_REWARDS[challengeProgress.stage];
    const resolved = resolveAchievementOverlaps(ns.AchievementRules.evaluate(career));
    const debugMode = !!(career.horse && career.horse.debugMode);
    const achievements = resolved.awarded.map((achievement) => {
      const points = achievementPointValue(achievement);
      const discovery = achievementDiscovery(achievement, profile);
      const coins = discovery.first ? points : Math.floor(points / 2);
      if (!debugMode) markDiscovery(profile, achievement, discovery);
      return { ...achievement, points, coins, first: discovery.first };
    }).filter((achievement) => achievement.points > 0);
    const achievementCoins = achievements.reduce((sum, achievement) => sum + achievement.coins, 0);
    const achievementScore = achievements.reduce((sum, achievement) => sum + achievement.points, 0);
    const totalCoins = challengeCoins + achievementCoins;
    profile.honorCoins += totalCoins;
    return {
      profile,
      settlement: {
        valid: true,
        forced: !!forced,
        challengeProgress,
        challengeCoins,
        challengeScore: challengeCoins,
        achievements,
        suppressedAchievements: resolved.suppressed,
        achievementCoins,
        achievementScore,
        totalCoins,
        totalScore: challengeCoins + achievementScore,
        balanceAfter: profile.honorCoins
      }
    };
  }

  function useVeterinarian(career, profile) {
    if (!profile || !profile.residentVeterinarian) return { ok: false, reason: "尚未解锁驻场兽医。" };
    if (!career || career.retired || career.forcedRetirement) return { ok: false, reason: "当前不能使用驻场兽医。" };
    career.roguelike = career.roguelike || {};
    if (career.roguelike.veterinarianUsed) return { ok: false, reason: "本局已经使用过驻场兽医。" };
    const active = career.injury && career.injury.active;
    if (!active || active.restUntilIndex <= career.currentTime.index) return { ok: false, reason: "当前没有需要治疗的伤病。" };
    active.restUntilIndex = Math.max(career.currentTime.index, active.restUntilIndex - 6);
    active.restUntilLabel = ns.TimeRules.formatAgeMonth(ns.TimeRules.fromIndex(active.restUntilIndex));
    career.roguelike.veterinarianUsed = true;
    if (active.restUntilIndex <= career.currentTime.index) career.injury.active = null;
    return { ok: true, healed: !career.injury.active };
  }

  ns.RoguelikeRules = {
    PROFILE_VERSION,
    STAGES,
    STAGE_LABELS,
    STAGE_REWARDS,
    SERVICE_PRICES,
    CONSUMABLE_PRODUCTS,
    PERMANENT_PRICES,
    ACCURACY_ORDER,
    CHALLENGES,
    createProfile,
    createSave,
    normalizeSave,
    bloodlineWeight,
    trainerAllocation,
    hasReasonableRoute,
    generateCandidate,
    createRun,
    purchasePermanent,
    purchaseConsumable,
    useRefreshConsumable,
    useReviewConsumable,
    selectCandidate,
    eligibleAdaptationFields,
    useAdaptationConsumable,
    skipAdaptation,
    resolveAdaptation,
    ensureChallengeOptions,
    chooseChallenge,
    challengeById,
    distanceCategory,
    evaluateChallenge,
    isValidCareer,
    resolveAchievementOverlaps,
    achievementPointValue,
    buildSettlement,
    useVeterinarian
  };
})();
