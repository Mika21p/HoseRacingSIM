(function () {
  "use strict";

  const ns = (window.Keiba = window.Keiba || {});

  const VERSION = "track-aptitude-v1";
  const SURFACE_GRADES = ["A", "B", "C", "G"];
  const TRACK_APTITUDE_GRADES = ["◎", "○", "△"];
  const TRACK_TYPES = ["burst", "sustained", "attrition"];
  const INTENSITIES = [1, 2];
  const SURFACE_MODIFIERS = { A: 0, B: -5, C: -10, G: -20 };
  const TRACK_MODIFIERS = {
    1: { "◎": 2, "○": 0, "△": -2 },
    2: { "◎": 4, "○": -1, "△": -4 }
  };
  const SURFACE_KEYS = { "草地": "grass", "泥地": "dirt", grass: "grass", dirt: "dirt" };
  const SURFACE_LABELS = { grass: "草地", dirt: "泥地" };
  const TRACK_TYPE_LABELS = { burst: "瞬发", sustained: "持久", attrition: "消耗" };

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function surfaceKeyFor(value) {
    return SURFACE_KEYS[value] || "";
  }

  function surfaceLabelFor(value) {
    return SURFACE_LABELS[surfaceKeyFor(value)] || "";
  }

  function trackTypeLabelFor(value) {
    return TRACK_TYPE_LABELS[value] || "";
  }

  function intensityLabelFor(value) {
    return Number(value) === 1 ? "Ⅰ" : (Number(value) === 2 ? "Ⅱ" : "");
  }

  function validateCourseProfile(profile) {
    assert(profile && typeof profile === "object", "赛程属性缺失。");
    assert(typeof profile.id === "string" && profile.id.trim(), "赛程属性需要稳定编号。");
    assert(typeof profile.trackId === "string" && profile.trackId.trim(), "赛程属性需要马场编号。");
    assert(typeof profile.courseConfigId === "string" && profile.courseConfigId.trim(), "赛程属性需要路线编号。");
    assert(!!surfaceKeyFor(profile.surface), "赛程属性场地只能是草地或泥地。");
    assert(Number.isInteger(profile.distance) && profile.distance > 0, "赛程属性距离必须是正整数。");
    assert(TRACK_TYPES.includes(profile.type), "赛程属性类型无效。");
    assert(INTENSITIES.includes(Number(profile.intensity)), "赛程属性强度只能是Ⅰ或Ⅱ。");
    return profile;
  }

  function validateHorse(horse) {
    assert(horse && typeof horse === "object", "马匹资料缺失。");
    assert(horse.surfaceGrades && typeof horse.surfaceGrades === "object", "马匹缺少草泥适性。");
    ["grass", "dirt"].forEach((surfaceKey) => {
      assert(SURFACE_GRADES.includes(horse.surfaceGrades[surfaceKey]), `马匹${SURFACE_LABELS[surfaceKey]}适性无效。`);
    });
    assert(horse.trackAptitudes && typeof horse.trackAptitudes === "object", "马匹缺少赛场类型适性。");
    TRACK_TYPES.forEach((type) => {
      assert(TRACK_APTITUDE_GRADES.includes(horse.trackAptitudes[type]), `马匹${TRACK_TYPE_LABELS[type]}适性无效。`);
    });
    return horse;
  }

  function profileFromCollection(profileId, profiles) {
    if (!profileId || !profiles) return null;
    if (Array.isArray(profiles)) return profiles.find((profile) => profile && profile.id === profileId) || null;
    if (typeof profiles.get === "function") return profiles.get(profileId) || null;
    return profiles[profileId] || null;
  }

  function resolveCourseProfile(race, profiles) {
    if (!race || typeof race !== "object") return null;
    const profile = race.courseProfile || profileFromCollection(race.courseProfileId, profiles);
    if (!profile) return null;
    validateCourseProfile(profile);
    return profile;
  }

  // 正式运行时，比赛库只保存比赛资料；共享档案库负责按赛场、表面、距离和路线
  // 解析它对应的赛程属性。显式挂载的档案仍优先，以支持主席模式的已冻结举办地。
  function resolveRuntimeCourseProfile(race, options) {
    const opts = options || {};
    const profiles = opts.profiles || ns.RaceCourseProfiles;
    const direct = resolveCourseProfile(race, profiles);
    if (direct) return direct;
    if (!profiles || typeof profiles.resolveForRace !== "function") return null;
    const profile = profiles.resolveForRace(race, opts.year == null ? {} : { year: opts.year });
    if (!profile) return null;
    validateCourseProfile(profile);
    return profile;
  }

  function requireCourseProfile(race, profiles) {
    const profile = profiles
      ? resolveCourseProfile(race, profiles)
      : resolveRuntimeCourseProfile(race);
    assert(profile, `比赛${race && (race.name || race.id) ? `“${race.name || race.id}”` : ""}尚未配置赛程属性。`);
    if (race.surface) {
      assert(surfaceKeyFor(race.surface) === surfaceKeyFor(profile.surface), "比赛场地与赛程属性不一致。");
    }
    if (Number.isFinite(race.distance)) {
      assert(Number(race.distance) === profile.distance, "比赛距离与赛程属性不一致。");
    }
    return profile;
  }

  function calculateModifiers(horse, profile) {
    validateHorse(horse);
    validateCourseProfile(profile);
    const surfaceKey = surfaceKeyFor(profile.surface);
    const surfaceGrade = horse.surfaceGrades[surfaceKey];
    const trackGrade = horse.trackAptitudes[profile.type];
    const surfaceMod = SURFACE_MODIFIERS[surfaceGrade];
    const trackAptitudeMod = TRACK_MODIFIERS[profile.intensity][trackGrade];
    return {
      ruleVersion: VERSION,
      courseProfileId: profile.id,
      surface: surfaceKey,
      surfaceLabel: SURFACE_LABELS[surfaceKey],
      surfaceGrade,
      surfaceMod,
      trackType: profile.type,
      trackTypeLabel: TRACK_TYPE_LABELS[profile.type],
      intensity: profile.intensity,
      intensityLabel: intensityLabelFor(profile.intensity),
      trackAptitudeGrade: trackGrade,
      trackAptitudeMod,
      modifier: surfaceMod + trackAptitudeMod
    };
  }

  function isExperimentalRace(race) {
    return !!resolveRuntimeCourseProfile(race);
  }

  ns.TrackAptitudeRules = {
    VERSION,
    SURFACE_GRADES,
    TRACK_APTITUDE_GRADES,
    TRACK_TYPES,
    INTENSITIES,
    SURFACE_MODIFIERS,
    TRACK_MODIFIERS,
    SURFACE_LABELS,
    TRACK_TYPE_LABELS,
    surfaceKeyFor,
    surfaceLabelFor,
    trackTypeLabelFor,
    intensityLabelFor,
    validateCourseProfile,
    validateHorse,
    resolveCourseProfile,
    resolveRuntimeCourseProfile,
    requireCourseProfile,
    calculateModifiers,
    isExperimentalRace
  };
})();
