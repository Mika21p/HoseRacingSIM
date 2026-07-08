(function () {
  const ns = (window.Keiba = window.Keiba || {});

  const state = {
    career: null,
    retiredSummary: null,
    historyExpanded: false,
    trainerCommentsCollapsed: false,
    adaptationHintsCollapsed: false,
    expandedRaceRecords: {},
    expandedRaceComments: {},
    horseNameLanguage: "zh",
    raceNameMode: "zh",
    activeFilterGroup: "",
    filters: {
      grade: [],
      surface: [],
      distance: [],
      region: [],
      japanCourse: []
    }
  };

  const SAVE_KEY = "keiba-career-save-v1";
  const HORSE_NAME_LANGUAGE_KEY = "keiba-horse-name-language-v1";
  const RACE_NAME_MODE_KEY = "keiba-race-name-mode-v1";
  const SAVE_VERSION = 1;
  const saveStatus = {
    storageAvailable: true,
    savedAt: null,
    message: ""
  };
  let savePaused = false;

  const SEASON_ORDER = [
    "二岁夏", "二岁秋", "二岁冬",
    "三岁春", "三岁夏", "三岁秋", "三岁冬",
    "四岁春", "四岁夏", "四岁秋", "四岁冬",
    "五岁春", "五岁夏", "五岁秋", "五岁冬",
    "六岁春", "六岁夏", "六岁秋", "六岁冬",
    "七岁春", "七岁夏", "七岁秋", "七岁冬"
  ];

  function refresh() {
    if (state.career && ns.RegionRules) ns.RegionRules.ensureCareerState(state.career);
    const didClearExpiredRegistration = clearExpiredRegistration();
    const app = document.getElementById("app");
    if (app) app.classList.toggle("app-has-career", !!state.career);
    ns.UI.renderHorse(document.getElementById("horsePanel"), state.career, {
      trainerCommentsCollapsed: state.trainerCommentsCollapsed
    });
    ns.UI.renderRaceSelector(document.getElementById("racePanel"), state.career, state.filters, {
      activeFilterGroup: state.activeFilterGroup,
      horseNameLanguage: state.horseNameLanguage,
      raceNameMode: state.raceNameMode
    });
    ns.UI.renderAdaptationHints(document.getElementById("feedbackPanel"), state.career, {
      collapsed: state.adaptationHintsCollapsed
    });
    ns.UI.renderHistory(document.getElementById("historyPanel"), state.career, state.retiredSummary, {
      expanded: state.historyExpanded,
      expandedRecords: state.expandedRaceRecords,
      expandedComments: state.expandedRaceComments,
      horseNameLanguage: state.horseNameLanguage,
      raceNameMode: state.raceNameMode
    });
    bindDynamicEvents();
    updateSaveStatus();
    if (didClearExpiredRegistration) saveGame({ silent: true });
  }

  function clearExpiredRegistration() {
    if (!state.career || !state.career.scheduledRace || !state.career.currentTime) return false;
    const schedule = state.career.scheduledRace.schedule;
    if (!schedule || schedule.index >= state.career.currentTime.index) return false;
    state.career.scheduledRace = null;
    return true;
  }

  function defaultFilters() {
    return { grade: [], surface: [], distance: [], region: [], japanCourse: [] };
  }

  const REGION_FILTER_VALUES = ["japan", "america", "europe", "other"];
  const JAPAN_COURSE_FILTER_VALUES = ["kyoto", "hanshin", "tokyo", "nakayama", "other"];
  const LEGACY_COURSE_TO_JAPAN_COURSE = {
    kyoto: "kyoto",
    hanshin: "hanshin",
    tokyo: "tokyo",
    nakayama: "nakayama",
    "other-japan": "other"
  };

  function validFilterValues(values, allowedValues) {
    return values.filter((item) => allowedValues.includes(item));
  }

  function normalizeFilterGroup(value) {
    if (Array.isArray(value)) {
      return [...new Set(value.filter((item) => item && item !== "all"))];
    }
    if (!value || value === "all") return [];
    return [value];
  }

  function normalizeFilters(filters) {
    const source = filters || {};
    let region = validFilterValues(normalizeFilterGroup(source.region), REGION_FILTER_VALUES);
    let japanCourse = validFilterValues(normalizeFilterGroup(source.japanCourse), JAPAN_COURSE_FILTER_VALUES);
    const legacyCourses = normalizeFilterGroup(source.course)
      .map((item) => LEGACY_COURSE_TO_JAPAN_COURSE[item])
      .filter(Boolean);

    if (region.length === 0 && japanCourse.length === 0 && legacyCourses.length > 0) {
      region = ["japan"];
      japanCourse = [...new Set(legacyCourses)];
    }
    if (!region.includes("japan")) japanCourse = [];

    return {
      grade: normalizeFilterGroup(source.grade),
      surface: normalizeFilterGroup(source.surface),
      distance: normalizeFilterGroup(source.distance),
      region,
      japanCourse
    };
  }

  function normalizeExpandedRaceRecords(records) {
    if (!records || typeof records !== "object" || Array.isArray(records)) return {};
    return Object.keys(records).reduce((items, key) => {
      if (/^race-\d+$/.test(key) && records[key]) items[key] = true;
      return items;
    }, {});
  }

  function getStorage() {
    try {
      return window.localStorage || null;
    } catch (error) {
      saveStatus.storageAvailable = false;
      console.warn("Local save storage is unavailable.", error);
      return null;
    }
  }

  function normalizeHorseNameLanguage(language) {
    return language === "en" ? "en" : "zh";
  }

  function normalizeRaceNameMode(mode) {
    return ns.RaceNameRules && ns.RaceNameRules.normalizeMode
      ? ns.RaceNameRules.normalizeMode(mode)
      : (mode === "original" ? "original" : "zh");
  }

  function raceDisplayName(race) {
    if (ns.RaceNameRules && ns.RaceNameRules.displayName) {
      return ns.RaceNameRules.displayName(race, state.raceNameMode);
    }
    return race && race.name ? race.name : "";
  }

  function loadHorseNameLanguage() {
    const storage = getStorage();
    if (!storage) return;
    state.horseNameLanguage = normalizeHorseNameLanguage(storage.getItem(HORSE_NAME_LANGUAGE_KEY));
  }

  function saveHorseNameLanguage() {
    const storage = getStorage();
    if (!storage) return;
    try {
      storage.setItem(HORSE_NAME_LANGUAGE_KEY, state.horseNameLanguage);
    } catch (error) {
      console.warn("Failed to save horse name language.", error);
    }
  }

  function loadRaceNameMode() {
    const storage = getStorage();
    if (!storage) return;
    state.raceNameMode = normalizeRaceNameMode(storage.getItem(RACE_NAME_MODE_KEY));
  }

  function saveRaceNameMode() {
    const storage = getStorage();
    if (!storage) return;
    try {
      storage.setItem(RACE_NAME_MODE_KEY, state.raceNameMode);
    } catch (error) {
      console.warn("Failed to save race name mode.", error);
    }
  }

  function normalizeRestoredCareer(career) {
    if (!career || typeof career !== "object") return null;
    if (!career.currentTime && ns.TimeRules) career.currentTime = ns.TimeRules.startTime();
    if (!Array.isArray(career.races)) career.races = [];
    if (ns.RegionRules && ns.RegionRules.ensureCareerState) ns.RegionRules.ensureCareerState(career);
    if (!career.injury) career.injury = { active: null, history: [] };
    if (!Array.isArray(career.injury.history)) career.injury.history = [];
    if (ns.RaceProgression && ns.RaceProgression.ensureChallengeState) {
      ns.RaceProgression.ensureChallengeState(career);
    }
    if (ns.AdaptationHintRules && ns.AdaptationHintRules.ensure) {
      ns.AdaptationHintRules.ensure(career);
    }
    if (!career.maturity) {
      career.maturity = {
        decline: 0,
        lastCheckedIndex: career.currentTime ? career.currentTime.index : 0,
        events: []
      };
    }
    if (!Array.isArray(career.maturity.events)) career.maturity.events = [];
    return career;
  }

  function buildSavePayload() {
    return {
      version: SAVE_VERSION,
      savedAt: new Date().toISOString(),
      state: {
        career: state.career,
        retiredSummary: state.retiredSummary,
        historyExpanded: !!state.historyExpanded,
        trainerCommentsCollapsed: !!state.trainerCommentsCollapsed,
        adaptationHintsCollapsed: !!state.adaptationHintsCollapsed,
        expandedRaceRecords: normalizeExpandedRaceRecords(state.expandedRaceRecords),
        expandedRaceComments: normalizeExpandedRaceRecords(state.expandedRaceComments),
        filters: normalizeFilters(state.filters)
      }
    };
  }

  function saveGame(options) {
    const opts = options || {};
    if (!state.career) return false;
    if (savePaused && opts.silent) return false;
    if (savePaused) savePaused = false;
    const storage = getStorage();
    if (!storage) {
      saveStatus.storageAvailable = false;
      saveStatus.message = "当前浏览器无法使用本机存档。";
      if (!opts.silent) updateSaveStatus();
      return false;
    }
    const payload = buildSavePayload();
    try {
      storage.setItem(SAVE_KEY, JSON.stringify(payload));
      saveStatus.storageAvailable = true;
      saveStatus.savedAt = payload.savedAt;
      saveStatus.message = "已自动保存";
      if (!opts.silent) updateSaveStatus();
      return true;
    } catch (error) {
      saveStatus.storageAvailable = false;
      saveStatus.message = "本机存档写入失败。";
      console.warn("Failed to save game.", error);
      if (!opts.silent) updateSaveStatus();
      return false;
    }
  }

  function loadSavedGame() {
    const storage = getStorage();
    if (!storage) {
      saveStatus.message = "当前浏览器无法使用本机存档。";
      return false;
    }
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) {
      saveStatus.message = "暂无存档";
      return false;
    }
    try {
      const payload = JSON.parse(raw);
      if (!payload || payload.version !== SAVE_VERSION || !payload.state) {
        throw new Error("Unsupported save payload.");
      }
      const restoredCareer = normalizeRestoredCareer(payload.state.career);
      if (!restoredCareer) throw new Error("Save payload has no career.");
      state.career = restoredCareer;
      state.retiredSummary = payload.state.retiredSummary || null;
      state.historyExpanded = !!payload.state.historyExpanded;
      state.trainerCommentsCollapsed = !!payload.state.trainerCommentsCollapsed;
      state.adaptationHintsCollapsed = !!payload.state.adaptationHintsCollapsed;
      state.expandedRaceRecords = normalizeExpandedRaceRecords(payload.state.expandedRaceRecords);
      state.expandedRaceComments = normalizeExpandedRaceRecords(payload.state.expandedRaceComments);
      state.filters = normalizeFilters(payload.state.filters);
      saveStatus.storageAvailable = true;
      saveStatus.savedAt = payload.savedAt || null;
      saveStatus.message = "已恢复存档";
      savePaused = false;
      return true;
    } catch (error) {
      console.warn("Failed to load saved game.", error);
      storage.removeItem(SAVE_KEY);
      saveStatus.message = "本机存档无法读取，已清除";
      return false;
    }
  }

  function hasSavedGame() {
    const storage = getStorage();
    return !!(storage && storage.getItem(SAVE_KEY));
  }

  function formatSavedAt(savedAt) {
    if (!savedAt) return "";
    const date = new Date(savedAt);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function updateSaveStatus() {
    const panel = document.getElementById("savePanel");
    const text = document.getElementById("saveStatusText");
    const clearButton = document.getElementById("clearSaveBtn");
    if (!panel || !text) return;
    const savedAtText = formatSavedAt(saveStatus.savedAt);
    panel.hidden = false;
    if (!saveStatus.storageAvailable) {
      text.textContent = saveStatus.message || "当前浏览器无法使用本机存档。";
    } else if (saveStatus.message === "暂无存档") {
      text.textContent = "暂无存档";
    } else if (saveStatus.message && savedAtText) {
      text.textContent = `${saveStatus.message} · ${savedAtText}`;
    } else if (saveStatus.message) {
      text.textContent = saveStatus.message;
    } else if (savedAtText) {
      text.textContent = `已自动保存 · ${savedAtText}`;
    } else {
      text.textContent = "暂无存档";
    }
    if (clearButton) clearButton.hidden = !hasSavedGame();
  }

  function clearSavedGame() {
    const storage = getStorage();
    if (!storage) {
      saveStatus.storageAvailable = false;
      saveStatus.message = "当前浏览器无法使用本机存档。";
      updateSaveStatus();
      return;
    }
    if (!storage.getItem(SAVE_KEY)) {
      saveStatus.savedAt = null;
      saveStatus.message = "暂无存档";
      updateSaveStatus();
      return;
    }
    if (!window.confirm("确定清除本机存档吗？当前页面进度会保留，但下次打开不会自动恢复。")) return;
    storage.removeItem(SAVE_KEY);
    savePaused = true;
    saveStatus.savedAt = null;
    saveStatus.message = state.career ? "本机存档已清除，当前页面进度仍保留" : "本机存档已清除";
    updateSaveStatus();
  }

  function getMainJockeyFilters() {
    const excellentJockeyToggle = document.getElementById("excellentJockeyToggle");
    if (!excellentJockeyToggle || !excellentJockeyToggle.checked) return {};
    const fallbackMinAbility = ns.JockeyRules ? ns.JockeyRules.PLAYER_EXCELLENT_MIN_ABILITY : 70;
    const minAbility = Number(excellentJockeyToggle.dataset.minAbility || fallbackMinAbility);
    return { minAbility: Number.isFinite(minAbility) ? minAbility : fallbackMinAbility };
  }

  function getFallbackJockeyAbility(jockey) {
    if (!jockey) return null;
    if (jockey.defaultAbility != null) return jockey.defaultAbility;
    if (!jockey.periods || jockey.periods.length === 0) return null;
    return Math.max(...jockey.periods.map((period) => period.ability));
  }

  function currentSetupRegionId() {
    const select = document.getElementById("trainerSelect");
    const trainerId = select ? select.value : "sato-yuta";
    const trainer = ns.CommentRules && ns.CommentRules.getTrainer
      ? ns.CommentRules.getTrainer(trainerId)
      : null;
    return ns.RegionRules && ns.RegionRules.regionIdForTrainer
      ? ns.RegionRules.regionIdForTrainer(trainer)
      : "japan";
  }

  function updateTrainerRegionText() {
    const text = document.getElementById("trainerRegionText");
    if (!text || !ns.RegionRules) return;
    text.textContent = `所属地：${ns.RegionRules.getRegion(currentSetupRegionId()).label}`;
  }

  function fallbackPlayerSelectableJockeys(filters, affiliation) {
    const currentFilters = filters || {};
    const targetAffiliation = affiliation || "japan";
    return (ns.Jockeys || [])
      .filter((jockey) => jockey.mainSelectable !== false)
      .filter((jockey) => !Array.isArray(jockey.affiliations) || jockey.affiliations.includes(targetAffiliation))
      .map((jockey) => ({
        id: jockey.id,
        name: jockey.name,
        ability: getFallbackJockeyAbility(jockey)
      }))
      .filter((jockey) => jockey.ability !== null)
      .filter((jockey) => currentFilters.minAbility == null || jockey.ability >= currentFilters.minAbility);
  }

  function getMainJockeyOptions() {
    const filters = getMainJockeyFilters();
    const regionId = currentSetupRegionId();
    const affiliation = ns.RegionRules && ns.RegionRules.getJockeyAffiliation
      ? ns.RegionRules.getJockeyAffiliation(regionId)
      : "japan";
    return ns.JockeyRules
      ? ns.JockeyRules.getPlayerSelectableJockeys(affiliation, filters)
      : fallbackPlayerSelectableJockeys(filters, affiliation);
  }

  function mainJockeyOptionList(jockeys, selectedId) {
    return jockeys
      .map((jockey) => `<option value="${jockey.id}" ${jockey.id === selectedId ? "selected" : ""}>${jockey.name}</option>`)
      .join("");
  }

  function refreshMainJockeyOptions() {
    const select = document.getElementById("mainJockeySelect");
    if (!select) return;
    const currentId = select.value || "take-yutaka";
    const jockeys = getMainJockeyOptions();
    const selectedId = jockeys.some((jockey) => jockey.id === currentId)
      ? currentId
      : (jockeys[0] ? jockeys[0].id : "");
    select.disabled = jockeys.length === 0;
    select.innerHTML = jockeys.length
      ? mainJockeyOptionList(jockeys, selectedId)
      : `<option value="">没有可选骑手</option>`;
    select.value = selectedId;
    updateTrainerRegionText();
  }

  function sireBloodlineGroup(item) {
    return item && item.group === "classic" ? "classic" : "current";
  }

  function getSireBloodlineOptions(useClassic) {
    const targetGroup = useClassic ? "classic" : "current";
    return (ns.SireBloodlines || ns.Bloodlines || [])
      .filter((item) => item.id === "random" || sireBloodlineGroup(item) === targetGroup);
  }

  function sireOptionList(items, selectedId) {
    return items
      .map((item) => `<option value="${item.id}" ${item.id === selectedId ? "selected" : ""}>${item.name}</option>`)
      .join("");
  }

  function refreshSireOptions() {
    const select = document.getElementById("sireSelect");
    const toggle = document.getElementById("classicSireToggle");
    if (!select || !toggle) return;
    const currentId = select.value || "random";
    const sires = getSireBloodlineOptions(toggle.checked);
    const selectedId = sires.some((item) => item.id === currentId) ? currentId : "random";
    select.innerHTML = sireOptionList(sires, selectedId);
    select.value = selectedId;
  }

  function generate() {
    if (state.career && !window.confirm("当前生涯会被新小马覆盖，确定继续吗？")) return;
    const name = document.getElementById("horseNameInput").value || "未命名小马";
    const sireId = document.getElementById("sireSelect").value;
    const damId = document.getElementById("damSelect").value;
    const trainerId = document.getElementById("trainerSelect").value;
    const mainJockeyId = document.getElementById("mainJockeySelect").value;
    const debugOptions = collectDebugOptions();
    if (debugOptions && !validateDebugOptions(debugOptions)) return;
    const horse = ns.HorseRules.generateHorse({ name, sireId, damId });
    if (debugOptions) ns.HorseRules.applyDebugOverrides(horse, debugOptions);
    const trainer = ns.CommentRules.getTrainer(trainerId);
    const regionId = ns.RegionRules && ns.RegionRules.regionIdForTrainer
      ? ns.RegionRules.regionIdForTrainer(trainer)
      : "japan";
    horse.trainerId = trainer.id;
    horse.trainerName = trainer.name;
    horse.mainJockeyId = mainJockeyId;
    horse.homeRegionId = regionId;
    horse.currentRegionId = regionId;
    const commentDetails = ns.CommentRules.generateDebutCommentDetails(horse, trainer.id);
    const comments = commentDetails.map((comment) => comment.text);
    const debutLock = ns.CommentRules.buildDebutLock(commentDetails);
    state.career = ns.CareerRules.createCareer(horse, comments, commentDetails, debutLock, trainer);
    state.retiredSummary = null;
    state.historyExpanded = false;
    state.trainerCommentsCollapsed = true;
    state.adaptationHintsCollapsed = true;
    state.expandedRaceRecords = {};
    state.expandedRaceComments = {};
    state.activeFilterGroup = "";
    state.filters = defaultFilters();
    refresh();
    saveGame();
    if (window.matchMedia && window.matchMedia("(max-width: 760px)").matches) {
      const racePanel = document.getElementById("racePanel");
      if (racePanel) racePanel.scrollIntoView({ block: "start" });
    }
  }

  function value(id) {
    const element = document.getElementById(id);
    return element ? element.value : "";
  }

  function numberValue(id) {
    return Number(value(id));
  }

  function collectDebugOptions() {
    const toggle = document.getElementById("debugModeToggle");
    if (!toggle || !toggle.checked) return null;
    return {
      gender: value("debugGender"),
      coat: value("debugCoat"),
      strength: numberValue("debugStrength"),
      weight: numberValue("debugWeight"),
      temperamentLabel: value("debugTemperament"),
      surfacePref: value("debugSurfacePref"),
      coreDist: numberValue("debugCoreDist"),
      distMin: numberValue("debugDistMin"),
      distMax: numberValue("debugDistMax"),
      growthType: value("debugGrowthType"),
      peakStart: value("debugPeakStart"),
      peakEnd: value("debugPeakEnd"),
      heavyType: value("debugHeavyType"),
      grassJapan: value("debugGrassJapan"),
      grassHongKong: value("debugGrassHongKong"),
      grassUsa: value("debugGrassUsa"),
      grassEurope: value("debugGrassEurope"),
      grassOther: value("debugGrassOther"),
      dirtJapan: value("debugDirtJapan"),
      dirtMiddleEast: value("debugDirtMiddleEast"),
      dirtUsa: value("debugDirtUsa"),
      courseTokyo: value("debugCourseTokyo"),
      courseNakayama: value("debugCourseNakayama"),
      courseKyoto: value("debugCourseKyoto"),
      courseHanshin: value("debugCourseHanshin"),
      courseOther: value("debugCourseOther")
    };
  }

  function validateDebugOptions(options) {
    if (options.distMin > options.coreDist || options.coreDist > options.distMax) {
      window.alert("调试模式：距离范围需要满足 下限 <= 核心距离 <= 上限。");
      return false;
    }
    if (SEASON_ORDER.indexOf(options.peakStart) > SEASON_ORDER.indexOf(options.peakEnd)) {
      window.alert("调试模式：成熟期开始不能晚于成熟期结束。");
      return false;
    }
    return true;
  }

  function buildRacePayload(selectedRace, schedule, challenge, expedition) {
    const opponent = ns.RaceRules.chooseOpponent(selectedRace);
    const payload = { race: selectedRace, schedule, opponent, year: opponent.year || null };
    if (expedition) payload.expedition = expedition;
    if (challenge) {
      payload.challenge = {
        key: challenge.key,
        window: challenge.window,
        acceptedAtIndex: state.career && state.career.currentTime ? state.career.currentTime.index : null
      };
    }
    return payload;
  }

  function shouldConfirmLongGap(schedule) {
    const currentIndex = state.career.currentTime ? state.career.currentTime.index : ns.TimeRules.startTime().index;
    const turnGap = schedule.index - currentIndex;
    if (turnGap <= 12) return true;
    return window.confirm(
      `这场比赛将在${schedule.label}举行，距离当前时间超过6个月。确定报名并逐回合推进到该赛事吗？`
    );
  }

  function confirmChallengeRegistration(plan) {
    const challenge = plan && plan.challenge;
    if (!challenge) return true;
    const consumeText = challenge.consumesOnExclusion
      ? "报名通过或被除外都会消耗 1 次格上机会。"
      : "报名通过会消耗 1 次格上机会；如果被除外，本次不消耗机会。";
    return window.confirm(
      `「${raceDisplayName(plan.race)}」属于格上挑战。\n当前阶段剩余 ${challenge.remaining} 次格上机会。\n${consumeText}\n若被除外，本届比赛不能再次报名。\n确定报名吗？`
    );
  }

  function rollChallengeExclusion(challenge) {
    return !!challenge && Math.random() < challenge.probability;
  }

  function alertChallengeExclusion(plan) {
    const challenge = plan && plan.challenge;
    const consumeText = challenge && challenge.consumesOnExclusion
      ? "本次格上机会已消耗 1 次。"
      : "本次没有消耗格上机会。";
    window.alert(
      `「${raceDisplayName(plan.race)}」的格上报名被除外，报名失败。\n本届比赛不能再次报名。\n${consumeText}`
    );
  }

  function completeRace(payload, jockeyId) {
    const playerJockey = ns.JockeyRules.describePlayerJockey(jockeyId);
    ns.CareerRules.advanceToSchedule(state.career, payload.schedule);
    const maturity = ns.MaturityRules.evaluate(
      state.career.horse,
      state.career.currentTime,
      state.career.maturity.decline
    );
    const result = ns.RaceRules.simulateRace(state.career.horse, payload.race, {
      opponent: payload.opponent,
      playerJockey,
      currentTime: state.career.currentTime,
      maturityDecline: state.career.maturity.decline,
      maturity
    });
    result.hidden.expedition = payload.expedition || null;
    ns.CareerRules.addRace(state.career, result, payload.schedule);
    state.career.scheduledRace = null;
    if (state.career.forcedRetirement) {
      state.retiredSummary = ns.CareerRules.retire(
        state.career,
        state.career.forcedRetirementReason || "因重伤被迫退役"
      );
    }
    refresh();
    saveGame();
  }

  function selectedRacePlan() {
    if (!state.career || state.career.retired) return;
    const select = document.getElementById("raceSelect");
    if (!select) return;
    const raceId = select.value;
    return ns.TimeRules.getAvailableRacePlans(state.career, ns.Races || [])
      .find((item) => item.race.id === raceId);
  }

  function registerRace() {
    if (!state.career || state.career.retired || state.career.scheduledRace) return;
    if (ns.CareerRules.isResting(state.career)) return;
    const plan = selectedRacePlan();
    if (!plan) return;
    if (!ns.TimeRules.isReachableSchedule(state.career, plan.schedule)) return;
    const selectedRace = plan.race;
    const schedule = plan.schedule;
    const challenge = plan.challenge || null;
    if (challenge && !confirmChallengeRegistration(plan)) return;
    if (!shouldConfirmLongGap(schedule)) return;
    if (challenge) {
      const excluded = rollChallengeExclusion(challenge);
      ns.RaceProgression.applyChallengeOutcome(state.career, plan, excluded);
      if (excluded) {
        refresh();
        saveGame();
        alertChallengeExclusion(plan);
        return;
      }
    }
    const payload = buildRacePayload(selectedRace, schedule, challenge, plan.expedition || null);
    state.career.scheduledRace = payload;
    refresh();
    saveGame();
  }

  function triggerScheduledRace() {
    if (!state.career || state.career.retired || !state.career.scheduledRace) return false;
    const payload = state.career.scheduledRace;
    if (state.career.currentTime.index < payload.schedule.index) return false;
    if (state.career.currentTime.index > payload.schedule.index) {
      state.career.scheduledRace = null;
      return false;
    }
    completeRace(payload, state.career.mainJockeyId);
    return true;
  }

  function advanceTurn() {
    if (!state.career || state.career.retired) return;
    if (ns.CareerRules.isResting(state.career)) {
      const nextRestTurn = ns.TimeRules.nextTurn(state.career.currentTime);
      ns.CareerRules.advanceToTime(state.career, nextRestTurn);
      refresh();
      saveGame();
      return;
    }
    if (triggerScheduledRace()) return;
    const next = ns.TimeRules.nextTurn(state.career.currentTime);
    ns.CareerRules.advanceToTime(state.career, next);
    if (triggerScheduledRace()) return;
    refresh();
    saveGame();
  }

  function cancelRegistration() {
    if (!state.career || state.career.retired) return;
    state.career.scheduledRace = null;
    refresh();
    saveGame();
  }

  function transferStable(targetRegionId) {
    if (!state.career || !ns.RegionRules) return;
    const transfer = ns.RegionRules.canTransfer(state.career);
    if (!transfer.allowed) {
      window.alert(transfer.reason || "当前不能转厩。");
      return;
    }
    const targetLabel = ns.RegionRules.getRegion(targetRegionId || transfer.targetRegionId).label;
    if (!window.confirm(`确定转厩至${targetLabel}吗？每匹马只有一次欧洲/北美转厩机会。`)) return;
    const result = ns.RegionRules.transferStable(state.career, targetRegionId);
    if (!result.ok) {
      window.alert(result.reason || "转厩失败。");
      return;
    }
    state.activeFilterGroup = "";
    state.filters = defaultFilters();
    refresh();
    saveGame();
  }

  function retire() {
    if (!state.career || state.career.retired) return;
    const horseName = state.career.horse && state.career.horse.name
      ? state.career.horse.name
      : "当前小马";
    if (!window.confirm(`确定让${horseName}退役吗？退役后会结束当前生涯并揭示隐藏能力。`)) return;
    state.retiredSummary = ns.CareerRules.retire(state.career);
    refresh();
    saveGame();
  }

  function toggleHistory() {
    if (!state.career) return;
    state.historyExpanded = !state.historyExpanded;
    refresh();
    saveGame();
  }

  function expandFullHistory() {
    if (!state.career) return;
    state.historyExpanded = true;
    state.expandedRaceRecords = (state.career.races || []).reduce((records, _record, index) => {
      records[`race-${index + 1}`] = true;
      return records;
    }, {});
    refresh();
    saveGame();
  }

  function collapseFullHistory() {
    if (!state.career) return;
    state.historyExpanded = false;
    state.expandedRaceRecords = {};
    state.expandedRaceComments = {};
    refresh();
    saveGame();
  }

  function toggleTrainerComments() {
    if (!state.career) return;
    state.trainerCommentsCollapsed = !state.trainerCommentsCollapsed;
    refresh();
    saveGame();
  }

  function toggleAdaptationHints() {
    if (!state.career) return;
    state.adaptationHintsCollapsed = !state.adaptationHintsCollapsed;
    refresh();
    saveGame();
  }

  function toggleHistoryRecord(recordKey) {
    if (!state.career || !recordKey) return;
    state.expandedRaceRecords = normalizeExpandedRaceRecords(state.expandedRaceRecords);
    if (state.expandedRaceRecords[recordKey]) {
      delete state.expandedRaceRecords[recordKey];
    } else {
      state.expandedRaceRecords[recordKey] = true;
    }
    refresh();
    saveGame();
  }

  function toggleHistoryComment(recordKey) {
    if (!state.career || !recordKey) return;
    state.expandedRaceComments = normalizeExpandedRaceRecords(state.expandedRaceComments);
    if (state.expandedRaceComments[recordKey]) {
      delete state.expandedRaceComments[recordKey];
    } else {
      state.expandedRaceComments[recordKey] = true;
    }
    refresh();
    saveGame();
  }

  function setHorseNameLanguage(language) {
    const nextLanguage = normalizeHorseNameLanguage(language);
    if (state.horseNameLanguage === nextLanguage) return;
    state.horseNameLanguage = nextLanguage;
    saveHorseNameLanguage();
    refresh();
  }

  function setRaceNameMode(mode) {
    const nextMode = normalizeRaceNameMode(mode);
    if (state.raceNameMode === nextMode) return;
    state.raceNameMode = nextMode;
    saveRaceNameMode();
    refresh();
  }

  function setRaceFilterValue(group, value, checked) {
    state.filters = normalizeFilters(state.filters);
    if (group === "japanCourse" && !state.filters.region.includes("japan")) return;
    const values = state.filters[group] || [];
    state.filters[group] = checked
      ? [...new Set(values.concat(value))]
      : values.filter((item) => item !== value);
    if (group === "region" && !state.filters.region.includes("japan")) {
      state.filters.japanCourse = [];
      if (state.activeFilterGroup === "japanCourse") state.activeFilterGroup = "region";
    }
    state.activeFilterGroup = group;
    refresh();
    saveGame();
  }

  function clearRaceFilterGroup(group) {
    state.filters = normalizeFilters(state.filters);
    state.filters[group] = [];
    if (group === "region") state.filters.japanCourse = [];
    state.activeFilterGroup = group;
    refresh();
    saveGame();
  }

  function clearAllRaceFilters() {
    state.filters = defaultFilters();
    state.activeFilterGroup = "";
    refresh();
    saveGame();
  }

  function bindDynamicEvents() {
    const registerRaceBtn = document.getElementById("registerRaceBtn");
    const raceSelect = document.getElementById("raceSelect");
    const nextTurnBtn = document.getElementById("nextTurnBtn");
    const cancelRegistrationBtn = document.getElementById("cancelRegistrationBtn");
    const retireBtn = document.getElementById("retireBtn");
    const historyToggleBtn = document.getElementById("historyToggleBtn");
    const historyExpandAllBtn = document.getElementById("historyExpandAllBtn");
    const historyCollapseAllBtn = document.getElementById("historyCollapseAllBtn");
    const trainerCommentsToggleBtn = document.getElementById("trainerCommentsToggleBtn");
    const adaptationHintsToggleBtn = document.getElementById("adaptationHintsToggleBtn");
    const historyRecordButtons = Array.from(document.querySelectorAll("[data-history-record-toggle]"));
    const historyCommentButtons = Array.from(document.querySelectorAll("[data-history-comment-toggle]"));
    const horseNameLanguageButtons = Array.from(document.querySelectorAll("[data-horse-name-language]"));
    const raceNameModeButtons = Array.from(document.querySelectorAll("[data-race-name-mode]"));
    const raceFilterToggles = Array.from(document.querySelectorAll("[data-race-filter]"));
    const raceFilterPanels = Array.from(document.querySelectorAll("[data-race-filter-group]"));
    const raceFilterClearButtons = Array.from(document.querySelectorAll("[data-filter-clear]"));
    const raceCardButtons = Array.from(document.querySelectorAll("[data-race-card]"));
    const transferStableBtn = document.getElementById("transferStableBtn");
    const clearAllRaceFiltersBtn = document.getElementById("clearAllRaceFiltersBtn");
    const syncRaceCardSelection = () => {
      if (!raceSelect || raceCardButtons.length === 0) return;
      raceCardButtons.forEach((button) => {
        const active = button.dataset.raceCard === raceSelect.value;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
    };
    if (registerRaceBtn) registerRaceBtn.addEventListener("click", registerRace);
    if (raceSelect && raceCardButtons.length) {
      raceSelect.addEventListener("change", syncRaceCardSelection);
      raceCardButtons.forEach((button) => {
        button.addEventListener("click", () => {
          raceSelect.value = button.dataset.raceCard;
          syncRaceCardSelection();
        });
      });
      syncRaceCardSelection();
    }
    if (nextTurnBtn) nextTurnBtn.addEventListener("click", advanceTurn);
    if (cancelRegistrationBtn) cancelRegistrationBtn.addEventListener("click", cancelRegistration);
    if (retireBtn) retireBtn.addEventListener("click", retire);
    if (historyToggleBtn) historyToggleBtn.addEventListener("click", toggleHistory);
    if (historyExpandAllBtn) historyExpandAllBtn.addEventListener("click", expandFullHistory);
    if (historyCollapseAllBtn) historyCollapseAllBtn.addEventListener("click", collapseFullHistory);
    if (trainerCommentsToggleBtn) trainerCommentsToggleBtn.addEventListener("click", toggleTrainerComments);
    if (adaptationHintsToggleBtn) adaptationHintsToggleBtn.addEventListener("click", toggleAdaptationHints);
    historyRecordButtons.forEach((button) => {
      button.addEventListener("click", () => toggleHistoryRecord(button.dataset.historyRecordToggle));
    });
    historyCommentButtons.forEach((button) => {
      button.addEventListener("click", () => toggleHistoryComment(button.dataset.historyCommentToggle));
    });
    horseNameLanguageButtons.forEach((button) => {
      button.addEventListener("click", () => setHorseNameLanguage(button.dataset.horseNameLanguage));
    });
    raceNameModeButtons.forEach((button) => {
      button.addEventListener("click", () => setRaceNameMode(button.dataset.raceNameMode));
    });
    raceFilterToggles.forEach((toggle) => {
      toggle.addEventListener("change", () => {
        setRaceFilterValue(toggle.dataset.raceFilter, toggle.value, toggle.checked);
      });
    });
    raceFilterPanels.forEach((panel) => {
      panel.addEventListener("toggle", () => {
        if (panel.open) {
          raceFilterPanels.forEach((otherPanel) => {
            if (otherPanel !== panel) otherPanel.open = false;
          });
          state.activeFilterGroup = panel.dataset.raceFilterGroup;
        } else if (state.activeFilterGroup === panel.dataset.raceFilterGroup) {
          state.activeFilterGroup = "";
        }
      });
    });
    raceFilterClearButtons.forEach((button) => {
      button.addEventListener("click", () => clearRaceFilterGroup(button.dataset.filterClear));
    });
    if (transferStableBtn) {
      transferStableBtn.addEventListener("click", () => transferStable(transferStableBtn.dataset.transferRegion));
    }
    if (clearAllRaceFiltersBtn) clearAllRaceFiltersBtn.addEventListener("click", clearAllRaceFilters);
  }

  function bindSetupEvents() {
    const helpToggleBtn = document.getElementById("helpToggleBtn");
    const helpPanel = document.getElementById("helpPanel");
    const sireHelpToggleBtn = document.getElementById("sireHelpToggleBtn");
    const sireHelpPanel = document.getElementById("sireHelpPanel");
    const damHelpToggleBtn = document.getElementById("damHelpToggleBtn");
    const damHelpPanel = document.getElementById("damHelpPanel");
    const trainerHelpToggleBtn = document.getElementById("trainerHelpToggleBtn");
    const trainerHelpPanel = document.getElementById("trainerHelpPanel");
    const debugModeToggle = document.getElementById("debugModeToggle");
    const debugPanel = document.getElementById("debugPanel");
    const debugStrength = document.getElementById("debugStrength");
    const debugStrengthValue = document.getElementById("debugStrengthValue");
    const excellentJockeyToggle = document.getElementById("excellentJockeyToggle");
    const classicSireToggle = document.getElementById("classicSireToggle");
    const trainerSelect = document.getElementById("trainerSelect");
    const clearSaveBtn = document.getElementById("clearSaveBtn");
    const bindInlineHelpPanel = (toggleBtn, panel) => {
      if (!toggleBtn || !panel) return;
      const setOpen = (open) => {
        panel.hidden = !open;
        toggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
      };
      toggleBtn.addEventListener("click", () => setOpen(panel.hidden));
      Array.from(panel.querySelectorAll(`[data-help-close="${panel.id}"]`)).forEach((button) => {
        button.addEventListener("click", () => setOpen(false));
      });
    };
    if (helpToggleBtn && helpPanel) {
      helpToggleBtn.addEventListener("click", () => {
        const shouldShow = helpPanel.hidden;
        helpPanel.hidden = !shouldShow;
        helpToggleBtn.textContent = shouldShow ? "收起帮助" : "帮助";
        helpToggleBtn.setAttribute("aria-expanded", shouldShow ? "true" : "false");
      });
    }
    bindInlineHelpPanel(sireHelpToggleBtn, sireHelpPanel);
    bindInlineHelpPanel(damHelpToggleBtn, damHelpPanel);
    bindInlineHelpPanel(trainerHelpToggleBtn, trainerHelpPanel);
    if (debugModeToggle && debugPanel) {
      debugModeToggle.addEventListener("change", () => {
        debugPanel.hidden = !debugModeToggle.checked;
      });
    }
    if (debugStrength && debugStrengthValue) {
      debugStrength.addEventListener("input", () => {
        debugStrengthValue.textContent = debugStrength.value;
      });
    }
    if (excellentJockeyToggle) {
      excellentJockeyToggle.addEventListener("change", refreshMainJockeyOptions);
    }
    if (classicSireToggle) {
      classicSireToggle.addEventListener("change", refreshSireOptions);
      refreshSireOptions();
    }
    if (trainerSelect) {
      trainerSelect.addEventListener("change", refreshMainJockeyOptions);
    }
    if (clearSaveBtn) clearSaveBtn.addEventListener("click", clearSavedGame);
    refreshMainJockeyOptions();
  }

  function bindChangelogEvents() {
    const changelogToggleBtn = document.getElementById("changelogToggleBtn");
    const changelogCloseBtn = document.getElementById("changelogCloseBtn");
    const changelogPanel = document.getElementById("changelogPanel");
    const setOpen = (open) => {
      if (!changelogPanel || !changelogToggleBtn) return;
      changelogPanel.hidden = !open;
      changelogToggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
    };
    if (changelogToggleBtn) {
      changelogToggleBtn.addEventListener("click", () => {
        setOpen(changelogPanel ? changelogPanel.hidden : false);
      });
    }
    if (changelogCloseBtn) {
      changelogCloseBtn.addEventListener("click", () => setOpen(false));
    }
  }

  function bindSaveLifecycleEvents() {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") saveGame({ silent: true });
    });
    window.addEventListener("pagehide", () => {
      saveGame({ silent: true });
    });
  }

  async function init() {
    if (ns.HistoricalHorsesReady) {
      await ns.HistoricalHorsesReady;
      if (ns.HistoricalOpponentRules) {
        ns.HistoricalOpponentRules.reset();
        ns.HistoricalOpponentRules.validate();
      }
    }
    loadSavedGame();
    loadHorseNameLanguage();
    loadRaceNameMode();
    const root = document.getElementById("app");
    ns.UI.renderChangelog(document.getElementById("changelogContent"));
    bindChangelogEvents();
    ns.UI.renderSetup(root);
    document.getElementById("generateBtn").addEventListener("click", generate);
    bindSetupEvents();
    bindSaveLifecycleEvents();
    refresh();
  }

  document.addEventListener("DOMContentLoaded", () => {
    init().catch((error) => {
      console.error(error);
    });
  });
})();
