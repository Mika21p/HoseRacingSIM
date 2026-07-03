(function () {
  const ns = (window.Keiba = window.Keiba || {});

  const state = {
    career: null,
    retiredSummary: null,
    historyExpanded: false,
    filters: {
      grade: "all",
      surface: "all",
      distance: "all"
    }
  };

  const SAVE_KEY = "keiba-career-save-v1";
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
    const didClearExpiredRegistration = clearExpiredRegistration();
    ns.UI.renderHorse(document.getElementById("horsePanel"), state.career);
    ns.UI.renderRaceSelector(document.getElementById("racePanel"), state.career, state.filters);
    ns.UI.renderLastRaceComment(document.getElementById("feedbackPanel"), state.career);
    ns.UI.renderHistory(document.getElementById("historyPanel"), state.career, state.retiredSummary, {
      expanded: state.historyExpanded
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
    return { grade: "all", surface: "all", distance: "all" };
  }

  function normalizeFilters(filters) {
    return {
      ...defaultFilters(),
      ...(filters || {})
    };
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

  function normalizeRestoredCareer(career) {
    if (!career || typeof career !== "object") return null;
    if (!career.currentTime && ns.TimeRules) career.currentTime = ns.TimeRules.startTime();
    if (!Array.isArray(career.races)) career.races = [];
    if (!career.injury) career.injury = { active: null, history: [] };
    if (!Array.isArray(career.injury.history)) career.injury.history = [];
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

  function fallbackPlayerSelectableJockeys(filters) {
    const currentFilters = filters || {};
    return (ns.Jockeys || [])
      .filter((jockey) => jockey.mainSelectable !== false)
      .filter((jockey) => !Array.isArray(jockey.affiliations) || jockey.affiliations.includes("japan"))
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
    return ns.JockeyRules
      ? ns.JockeyRules.getPlayerSelectableJockeys("japan", filters)
      : fallbackPlayerSelectableJockeys(filters);
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
    horse.trainerId = trainer.id;
    horse.trainerName = trainer.name;
    horse.mainJockeyId = mainJockeyId;
    const commentDetails = ns.CommentRules.generateDebutCommentDetails(horse, trainer.id);
    const comments = commentDetails.map((comment) => comment.text);
    const debutLock = ns.CommentRules.buildDebutLock(commentDetails);
    state.career = ns.CareerRules.createCareer(horse, comments, commentDetails, debutLock, trainer);
    state.retiredSummary = null;
    state.historyExpanded = false;
    state.filters = defaultFilters();
    refresh();
    saveGame();
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

  function buildRacePayload(selectedRace, schedule) {
    const opponent = ns.RaceRules.chooseOpponent(selectedRace);
    return { race: selectedRace, schedule, opponent, year: opponent.year || null };
  }

  function shouldConfirmLongGap(schedule) {
    const currentIndex = state.career.currentTime ? state.career.currentTime.index : ns.TimeRules.startTime().index;
    const turnGap = schedule.index - currentIndex;
    if (turnGap <= 12) return true;
    return window.confirm(
      `这场比赛将在${schedule.label}举行，距离当前时间超过6个月。确定报名并逐回合推进到该赛事吗？`
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
    if (!shouldConfirmLongGap(schedule)) return;
    const payload = buildRacePayload(selectedRace, schedule);
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

  function retire() {
    if (!state.career || state.career.retired) return;
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

  function bindDynamicEvents() {
    const registerRaceBtn = document.getElementById("registerRaceBtn");
    const nextTurnBtn = document.getElementById("nextTurnBtn");
    const cancelRegistrationBtn = document.getElementById("cancelRegistrationBtn");
    const retireBtn = document.getElementById("retireBtn");
    const historyToggleBtn = document.getElementById("historyToggleBtn");
    const gradeFilter = document.getElementById("gradeFilter");
    const surfaceFilter = document.getElementById("surfaceFilter");
    const distanceFilter = document.getElementById("distanceFilter");
    if (registerRaceBtn) registerRaceBtn.addEventListener("click", registerRace);
    if (nextTurnBtn) nextTurnBtn.addEventListener("click", advanceTurn);
    if (cancelRegistrationBtn) cancelRegistrationBtn.addEventListener("click", cancelRegistration);
    if (retireBtn) retireBtn.addEventListener("click", retire);
    if (historyToggleBtn) historyToggleBtn.addEventListener("click", toggleHistory);
    if (gradeFilter) {
      gradeFilter.addEventListener("change", () => {
        state.filters.grade = gradeFilter.value;
        refresh();
        saveGame();
      });
    }
    if (surfaceFilter) {
      surfaceFilter.addEventListener("change", () => {
        state.filters.surface = surfaceFilter.value;
        refresh();
        saveGame();
      });
    }
    if (distanceFilter) {
      distanceFilter.addEventListener("change", () => {
        state.filters.distance = distanceFilter.value;
        refresh();
        saveGame();
      });
    }
  }

  function bindSetupEvents() {
    const helpToggleBtn = document.getElementById("helpToggleBtn");
    const helpPanel = document.getElementById("helpPanel");
    const trainerHelpToggleBtn = document.getElementById("trainerHelpToggleBtn");
    const trainerHelpPanel = document.getElementById("trainerHelpPanel");
    const debugModeToggle = document.getElementById("debugModeToggle");
    const debugPanel = document.getElementById("debugPanel");
    const debugStrength = document.getElementById("debugStrength");
    const debugStrengthValue = document.getElementById("debugStrengthValue");
    const excellentJockeyToggle = document.getElementById("excellentJockeyToggle");
    const clearSaveBtn = document.getElementById("clearSaveBtn");
    if (helpToggleBtn && helpPanel) {
      helpToggleBtn.addEventListener("click", () => {
        const shouldShow = helpPanel.hidden;
        helpPanel.hidden = !shouldShow;
        helpToggleBtn.textContent = shouldShow ? "收起帮助" : "属性帮助";
        helpToggleBtn.setAttribute("aria-expanded", shouldShow ? "true" : "false");
      });
    }
    if (trainerHelpToggleBtn && trainerHelpPanel) {
      trainerHelpToggleBtn.addEventListener("click", () => {
        const shouldShow = trainerHelpPanel.hidden;
        trainerHelpPanel.hidden = !shouldShow;
        trainerHelpToggleBtn.setAttribute("aria-expanded", shouldShow ? "true" : "false");
      });
    }
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
    if (clearSaveBtn) clearSaveBtn.addEventListener("click", clearSavedGame);
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
