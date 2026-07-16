(function () {
  const ns = (window.Keiba = window.Keiba || {});

  const state = {
    career: null,
    retiredSummary: null,
    activeView: "action",
    activeActionSection: "race",
    setupOpen: false,
    resultOpen: false,
    historyExpanded: false,
    trainerCommentsCollapsed: false,
    adaptationHintsCollapsed: false,
    expandedRaceRecords: {},
    collapsedRaceRecords: {},
    expandedRaceComments: {},
    expandedOpponentRosters: {},
    horseNameLanguage: "zh",
    raceNameMode: "zh",
    activeFilterGroup: "",
    filters: {
      grade: [],
      surface: [],
      distance: [],
      region: [],
      japanCourse: [],
      avoidFatigueRisk: false
    }
  };

  const SAVE_KEY = "keiba-career-save-v1";
  const HORSE_NAME_LANGUAGE_KEY = "keiba-horse-name-language-v1";
  const RACE_NAME_MODE_KEY = "keiba-race-name-mode-v1";
  const LEGEND_INTRO_DISMISSED_KEY = "keiba-legend-intro-dismissed-v1";
  const SAVE_VERSION = 2;
  const saveStatus = {
    storageAvailable: true,
    savedAt: null,
    message: ""
  };
  let savePaused = false;
  let legendIntroDismissedForSession = false;
  let resultReturnFocus = null;
  let resultWasVisible = false;
  let actionScrollFrame = 0;

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
    const didNormalizeScheduledRace = normalizeScheduledRacePayload(state.career);
    const didClearExpiredRegistration = clearExpiredRegistration();
    const didMarkTravelPreparation = markScheduledTravelPreparation();
    const app = document.getElementById("app");
    const hasCareer = !!state.career;
    if (app) app.classList.toggle("app-has-career", hasCareer);
    document.body.classList.toggle("has-career", hasCareer);
    const setupOverlay = document.getElementById("setupOverlay");
    const setupCloseBtn = document.getElementById("setupCloseBtn");
    const workspaceShell = document.getElementById("workspaceShell");
    if (setupOverlay) setupOverlay.hidden = hasCareer && !state.setupOpen;
    if (setupCloseBtn) setupCloseBtn.hidden = !hasCareer;
    if (workspaceShell) workspaceShell.hidden = !hasCareer;
    ns.UI.renderWorkspaceStatus(document.getElementById("workspaceStatus"), state.career);
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
    ns.UI.renderHorseSummary(document.getElementById("horseSummaryPanel"), state.career);
    ns.UI.renderLastRaceComment(document.getElementById("lastRacePanel"), state.career);
    ns.UI.renderAdaptationSummary(document.getElementById("adaptationSummaryPanel"), state.career);
    ns.UI.renderHistory(document.getElementById("historyPanel"), state.career, state.retiredSummary, {
      mobile: isMobileLayout(),
      expanded: state.historyExpanded,
      expandedRecords: state.expandedRaceRecords,
      collapsedRecords: state.collapsedRaceRecords,
      expandedComments: state.expandedRaceComments,
      expandedOpponentRosters: state.expandedOpponentRosters,
      horseNameLanguage: state.horseNameLanguage,
      raceNameMode: state.raceNameMode
    });
    ns.UI.renderRaceResult(document.getElementById("raceResultContent"), state.career, {
      horseNameLanguage: state.horseNameLanguage,
      raceNameMode: state.raceNameMode
    });
    applyWorkspaceView();
    applyRaceResultOverlay();
    bindDynamicEvents();
    updateSaveStatus();
    if (didNormalizeScheduledRace || didClearExpiredRegistration || didMarkTravelPreparation) saveGame({ silent: true });
  }

  function clearExpiredRegistration() {
    if (!state.career || !state.career.scheduledRace || !state.career.currentTime) return false;
    const schedule = state.career.scheduledRace.schedule;
    if (!schedule || schedule.index >= state.career.currentTime.index) return false;
    state.career.scheduledRace = null;
    return true;
  }

  function defaultFilters() {
    return { grade: [], surface: [], distance: [], region: [], japanCourse: [], avoidFatigueRisk: false };
  }

  function isMobileLayout() {
    return !!(window.matchMedia && window.matchMedia("(max-width: 760px)").matches);
  }

  function applyWorkspaceView() {
    const view = ["action", "horse", "more"].includes(state.activeView)
      ? state.activeView
      : "action";
    const actionSection = ["race", "history"].includes(state.activeActionSection)
      ? state.activeActionSection
      : "race";
    state.activeView = view;
    state.activeActionSection = actionSection;
    const shell = document.getElementById("workspaceShell");
    if (!shell) return;
    shell.dataset.activeView = view;
    Array.from(shell.querySelectorAll("[data-workspace-panel]")).forEach((panel) => {
      panel.hidden = panel.dataset.workspacePanel !== view;
    });
    Array.from(shell.querySelectorAll("[data-workspace-view], [data-workspace-section]")).forEach((button) => {
      const active = button.dataset.workspaceSection
        ? view === "action" && button.dataset.workspaceSection === actionSection
        : button.dataset.workspaceView === view;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
  }

  function setWorkspaceView(view, options) {
    if (!["action", "horse", "more"].includes(view)) return;
    const opts = options || {};
    state.activeView = view;
    if (view === "action") {
      state.activeActionSection = ["race", "history"].includes(opts.section) ? opts.section : "race";
    }
    state.setupOpen = false;
    applyWorkspaceView();
    const target = view === "action"
      ? document.querySelector(`[data-action-anchor="${state.activeActionSection}"]`)
      : document.querySelector(`[data-workspace-panel="${view}"]`);
    if (target && opts.scroll) target.scrollIntoView({ block: "start", behavior: "smooth" });
    if (target && opts.focus) {
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }
  }

  function openSetup() {
    if (!state.career) return;
    state.setupOpen = true;
    const overlay = document.getElementById("setupOverlay");
    if (overlay) overlay.hidden = false;
    const title = document.getElementById("setupPageTitle");
    if (title) title.focus({ preventScroll: true });
  }

  function closeSetup() {
    if (!state.career) return;
    state.setupOpen = false;
    const overlay = document.getElementById("setupOverlay");
    if (overlay) overlay.hidden = true;
    const trigger = document.getElementById("newCareerBtn");
    if (trigger) trigger.focus({ preventScroll: true });
  }

  function openHelp() {
    const panel = document.getElementById("helpPanel");
    if (!panel) return;
    panel.hidden = false;
    document.body.classList.add("drawer-open");
    const toggle = document.getElementById("helpToggleBtn");
    if (toggle) toggle.setAttribute("aria-expanded", "true");
    const closeButton = panel.querySelector('[data-help-close="helpPanel"]');
    if (closeButton) closeButton.focus({ preventScroll: true });
  }

  function closeHelp() {
    const panel = document.getElementById("helpPanel");
    if (!panel) return;
    panel.hidden = true;
    document.body.classList.remove("drawer-open");
    const toggle = document.getElementById("helpToggleBtn");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  function applyRaceResultOverlay() {
    const overlay = document.getElementById("raceResultDialog");
    if (!overlay) return;
    const shouldOpen = !!(state.career && state.resultOpen && state.career.races && state.career.races.length);
    overlay.hidden = !shouldOpen;
    document.body.classList.toggle("result-open", shouldOpen);
    if (shouldOpen && !resultWasVisible) {
      resultWasVisible = true;
      const closeButton = document.getElementById("raceResultCloseBtn");
      if (closeButton) closeButton.focus({ preventScroll: true });
    } else if (!shouldOpen) {
      resultWasVisible = false;
    }
  }

  function closeRaceResult(options) {
    const wasOpen = state.resultOpen;
    state.resultOpen = false;
    applyRaceResultOverlay();
    const opts = options || {};
    if (opts.section) setWorkspaceView("action", { section: opts.section, focus: true, scroll: true });
    else if (opts.view) setWorkspaceView(opts.view, { focus: true, scroll: true });
    else if (wasOpen && resultReturnFocus && typeof resultReturnFocus.focus === "function") {
      resultReturnFocus.focus({ preventScroll: true });
    }
    resultReturnFocus = null;
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
      japanCourse,
      avoidFatigueRisk: !!source.avoidFatigueRisk
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

  function normalizeRestoredCareer(career, saveVersion) {
    if (!career || typeof career !== "object") return null;
    career.gameMode = saveVersion === 1
      ? "normal"
      : (career.gameMode === "legend" ? "legend" : "normal");
    if (career.horse) career.horse.gameMode = career.gameMode;
    if (!career.currentTime && ns.TimeRules) career.currentTime = ns.TimeRules.startTime();
    if (!Array.isArray(career.races)) career.races = [];
    if (ns.RegionRules && ns.RegionRules.ensureCareerState) ns.RegionRules.ensureCareerState(career);
    normalizeScheduledRacePayload(career);
    if (!career.injury) career.injury = { active: null, history: [] };
    if (!Array.isArray(career.injury.history)) career.injury.history = [];
    if (ns.RaceProgression && ns.RaceProgression.ensureChallengeState) {
      ns.RaceProgression.ensureChallengeState(career);
    }
    if (ns.RaceFatigueRules && ns.RaceFatigueRules.ensureFatigueState) {
      ns.RaceFatigueRules.ensureFatigueState(career);
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
        collapsedRaceRecords: normalizeExpandedRaceRecords(state.collapsedRaceRecords),
        expandedRaceComments: normalizeExpandedRaceRecords(state.expandedRaceComments),
        expandedOpponentRosters: normalizeExpandedRaceRecords(state.expandedOpponentRosters),
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
      if (!payload || ![1, SAVE_VERSION].includes(payload.version) || !payload.state) {
        throw new Error("Unsupported save payload.");
      }
      const restoredCareer = normalizeRestoredCareer(payload.state.career, payload.version);
      if (!restoredCareer) throw new Error("Save payload has no career.");
      state.career = restoredCareer;
      state.retiredSummary = payload.state.retiredSummary || null;
      state.historyExpanded = !!payload.state.historyExpanded;
      state.trainerCommentsCollapsed = !!payload.state.trainerCommentsCollapsed;
      state.adaptationHintsCollapsed = !!payload.state.adaptationHintsCollapsed;
      state.expandedRaceRecords = normalizeExpandedRaceRecords(payload.state.expandedRaceRecords);
      state.collapsedRaceRecords = normalizeExpandedRaceRecords(payload.state.collapsedRaceRecords);
      state.expandedRaceComments = normalizeExpandedRaceRecords(payload.state.expandedRaceComments);
      state.expandedOpponentRosters = normalizeExpandedRaceRecords(payload.state.expandedOpponentRosters);
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
    const savedAtText = formatSavedAt(saveStatus.savedAt);
    let statusText = "暂无存档";
    if (!saveStatus.storageAvailable) {
      statusText = saveStatus.message || "当前浏览器无法使用本机存档。";
    } else if (saveStatus.message === "暂无存档") {
      statusText = "暂无存档";
    } else if (saveStatus.message && savedAtText) {
      statusText = `${saveStatus.message} · ${savedAtText}`;
    } else if (saveStatus.message) {
      statusText = saveStatus.message;
    } else if (savedAtText) {
      statusText = `已自动保存 · ${savedAtText}`;
    }
    if (panel) panel.hidden = false;
    ["saveStatusText", "workspaceSaveStatusText", "workspaceStatusSave"].forEach((id) => {
      const text = document.getElementById(id);
      if (text) text.textContent = id === "workspaceStatusSave" && statusText.includes(" · ")
        ? statusText.split(" · ")[0]
        : statusText;
    });
    ["clearSaveBtn", "workspaceClearSaveBtn"].forEach((id) => {
      const clearButton = document.getElementById(id);
      if (clearButton) clearButton.hidden = !hasSavedGame();
    });
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

  function isLegendIntroDismissed() {
    if (legendIntroDismissedForSession) return true;
    const storage = getStorage();
    if (!storage) return false;
    try {
      return storage.getItem(LEGEND_INTRO_DISMISSED_KEY) === "1";
    } catch (error) {
      console.warn("Failed to load legend intro preference.", error);
      return false;
    }
  }

  function setLegendIntroDismissed(dismissed) {
    legendIntroDismissedForSession = !!dismissed;
    const storage = getStorage();
    if (!storage) return;
    try {
      if (dismissed) storage.setItem(LEGEND_INTRO_DISMISSED_KEY, "1");
      else storage.removeItem(LEGEND_INTRO_DISMISSED_KEY);
    } catch (error) {
      console.warn("Failed to save legend intro preference.", error);
    }
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
    const gameMode = value("gameModeSelect") === "legend" ? "legend" : "normal";
    const trainerId = document.getElementById("trainerSelect").value;
    const mainJockeyId = document.getElementById("mainJockeySelect").value;
    const debugOptions = collectDebugOptions();
    if (debugOptions && !validateDebugOptions(debugOptions)) return;
    const horse = ns.HorseRules.generateHorse({ name, sireId, damId, gameMode });
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
    state.activeView = "action";
    state.activeActionSection = "race";
    state.setupOpen = false;
    state.resultOpen = false;
    state.historyExpanded = false;
    state.trainerCommentsCollapsed = true;
    state.adaptationHintsCollapsed = true;
    state.expandedRaceRecords = {};
    state.collapsedRaceRecords = {};
    state.expandedRaceComments = {};
    state.expandedOpponentRosters = {};
    state.activeFilterGroup = "";
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

  function buildRacePayload(selectedRace, schedule, challenge, expedition, travel, priorityEntry) {
    const legendMode = state.career && state.career.gameMode === "legend";
    const opponents = legendMode
      ? ns.RaceRules.chooseOpponentField(selectedRace, { career: state.career })
      : [];
    const opponent = legendMode ? opponents[0] : ns.RaceRules.chooseOpponent(selectedRace);
    const payload = { race: selectedRace, schedule, opponent, year: opponent.year || null };
    if (legendMode) payload.opponents = opponents;
    if (expedition) payload.expedition = expedition;
    if (travel) payload.travel = { ...travel };
    if (priorityEntry) payload.priorityEntry = { ...priorityEntry };
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

  function normalizeScheduledRacePayload(career) {
    const payload = career && career.scheduledRace;
    if (!payload || !payload.race || !payload.schedule || payload.travel) return false;
    if (!ns.RegionRules || !ns.RegionRules.buildTravel || !ns.RegionRules.isTravelScheduleReachable) return false;
    if (!ns.RegionRules.isTravelScheduleReachable(career, payload.race, payload.schedule)) return false;
    const travel = ns.RegionRules.buildTravel(career, payload.race, payload.schedule);
    if (!travel || !travel.active) return false;
    payload.travel = travel;
    return true;
  }

  function confirmFatigueRisk(plan) {
    if (!state.career || !ns.RaceFatigueRules || !ns.RaceFatigueRules.previewFatigueRisk) return true;
    const risk = ns.RaceFatigueRules.previewFatigueRisk(state.career, plan.race, plan.schedule, {
      priorityEntry: plan.priorityEntry || null
    });
    if (!risk || !risk.eligible) return true;
    const gapText = risk.gapTurns === 1 ? "仅半个月" : "约一个月";
    const priorityText = risk.priorityEntryReduction ? "\n本场为优先出走，疲劳风险已降低。" : "";
    return window.confirm(
      `上一场距离本场${gapText}，存在疲劳作战风险。${priorityText}\n仍要报名这场比赛吗？`
    );
  }

  function confirmTravelPreparation(plan) {
    const travel = plan && plan.travel;
    if (!travel || !travel.active) return true;
    const isReturnTravel = ns.RegionRules && ns.RegionRules.isReturnTravel
      ? ns.RegionRules.isReturnTravel(state.career, travel)
      : !!travel.returnToStable;
    if (isReturnTravel) {
      return window.confirm(
        `当前位于${travel.fromLabel}。报名这场比赛将返回当前厩舍所在地${travel.toLabel}，并立即进入返厩检疫。\n进入检疫后将不能取消本场比赛。\n确定返回并报名吗？`
      );
    }
    const prepText = travel.prepLabel ? `\n检疫预备回合：${travel.prepLabel}` : "";
    return window.confirm(
      `这场比赛需要从${travel.fromLabel}前往${travel.toLabel}，并提前 1 个回合进行远征+检疫。${prepText}\n进入检疫回合后将不能取消本场比赛。\n确定报名吗？`
    );
  }

  function isScheduledTravelLocked(payload) {
    if (!state.career || !payload || !ns.RegionRules || !ns.RegionRules.isTravelPreparationLocked) return false;
    return ns.RegionRules.isTravelPreparationLocked(state.career, payload);
  }

  function isReturnTravelPayload(payload) {
    const travel = payload && payload.travel;
    if (!travel || !travel.active) return false;
    return ns.RegionRules && ns.RegionRules.isReturnTravel
      ? ns.RegionRules.isReturnTravel(state.career, travel)
      : !!travel.returnToStable;
  }

  function travelLockedText(payload) {
    return isReturnTravelPayload(payload) ? "返厩检疫中" : "远征检疫中";
  }

  function markScheduledTravelPreparation() {
    if (!state.career || !state.career.scheduledRace || !ns.RegionRules || !ns.RegionRules.markTravelPreparation) {
      return false;
    }
    const payload = state.career.scheduledRace;
    const travel = payload.travel;
    const wasPrepared = !!(travel && travel.prepared);
    const beforeLocation = state.career.travel && state.career.travel.currentRegionId;
    const marked = ns.RegionRules.markTravelPreparation(state.career, payload);
    const afterLocation = state.career.travel && state.career.travel.currentRegionId;
    return !!(marked && marked.active && ((!wasPrepared && marked.prepared) || beforeLocation !== afterLocation));
  }

  function lockScheduledPreRaceCondition(payload) {
    if (!state.career || !payload || !ns.RaceFatigueRules || !ns.RaceFatigueRules.lockPreRaceCondition) {
      return payload ? payload.preRaceCondition || null : null;
    }
    return ns.RaceFatigueRules.lockPreRaceCondition(state.career, payload);
  }

  function hasTriggeredPreRaceFatigue(condition) {
    return !!(condition && condition.fatigue && condition.fatigue.triggered);
  }

  function cancelScheduledRaceForPreRaceCondition(payload) {
    ns.CareerRules.advanceToTime(state.career, payload.schedule);
    if (ns.RaceFatigueRules && ns.RaceFatigueRules.recordPreRaceCancellation) {
      ns.RaceFatigueRules.recordPreRaceCancellation(state.career, payload);
    } else if (payload.schedule && Number.isFinite(payload.schedule.index)) {
      state.career.lastRaceCancelIndex = payload.schedule.index;
    }
    state.career.scheduledRace = null;
    refresh();
    saveGame();
  }

  function completeRace(payload, jockeyId) {
    const playerJockey = ns.JockeyRules.describePlayerJockey(jockeyId);
    if (!payload.preRaceCondition) lockScheduledPreRaceCondition(payload);
    if (payload.travel && payload.travel.active && ns.RegionRules && ns.RegionRules.markTravelPreparation) {
      ns.RegionRules.markTravelPreparation(state.career, payload);
    }
    ns.CareerRules.advanceToSchedule(state.career, payload.schedule);
    const maturity = ns.MaturityRules.evaluate(
      state.career.horse,
      state.career.currentTime,
      state.career.maturity.decline
    );
    const result = ns.RaceRules.simulateRace(state.career.horse, payload.race, {
      opponent: payload.opponent,
      opponents: payload.opponents || [],
      gameMode: state.career.gameMode,
      playerJockey,
      currentTime: state.career.currentTime,
      maturityDecline: state.career.maturity.decline,
      maturity,
      preRaceCondition: payload.preRaceCondition || null
    });
    result.hidden.expedition = payload.expedition || null;
    result.hidden.travel = payload.travel || null;
    ns.CareerRules.addRace(state.career, result, payload.schedule);
    state.career.scheduledRace = null;
    if (state.career.forcedRetirement) {
      state.retiredSummary = ns.CareerRules.retire(
        state.career,
        state.career.forcedRetirementReason || "因重伤被迫退役"
      );
    }
    state.activeView = "action";
    state.activeActionSection = "race";
    state.resultOpen = true;
    resultReturnFocus = document.activeElement;
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
    if (!ns.TimeRules.isReachableSchedule(state.career, plan.schedule, plan.race)) return;
    const selectedRace = plan.race;
    const schedule = plan.schedule;
    const challenge = plan.challenge || null;
    const priorityEntry = plan.priorityEntry || null;
    if (challenge && !confirmChallengeRegistration(plan)) return;
    if (!confirmTravelPreparation(plan)) return;
    if (!confirmFatigueRisk(plan)) return;
    if (!shouldConfirmLongGap(schedule)) return;
    let payload;
    try {
      payload = buildRacePayload(
        selectedRace,
        schedule,
        challenge,
        plan.expedition || null,
        plan.travel || null,
        priorityEntry
      );
    } catch (error) {
      console.warn("Failed to build race opponents.", error);
      window.alert(error && error.message ? error.message : "无法生成符合条件的史实对手阵容。");
      return;
    }
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
    state.career.scheduledRace = payload;
    markScheduledTravelPreparation();
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
    const preRaceCondition = lockScheduledPreRaceCondition(payload);
    if (hasTriggeredPreRaceFatigue(preRaceCondition)) {
      saveGame({ silent: true });
      if (isScheduledTravelLocked(payload)) {
        window.alert(`本场赛前状态不佳。\n由于已经进入${travelLockedText(payload)}，本场比赛不能取消。`);
      } else if (!window.confirm("本场赛前状态不佳。\n是否仍然出赛？")) {
        cancelScheduledRaceForPreRaceCondition(payload);
        return true;
      }
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
    if (markScheduledTravelPreparation()
      && state.career.scheduledRace
      && state.career.currentTime.index < state.career.scheduledRace.schedule.index) {
      refresh();
      saveGame();
      return;
    }
    if (triggerScheduledRace()) return;
    refresh();
    saveGame();
  }

  function cancelRegistration() {
    if (!state.career || state.career.retired) return;
    if (isScheduledTravelLocked(state.career.scheduledRace)) {
      window.alert(`当前已进入${travelLockedText(state.career.scheduledRace)}，不能取消本场比赛。`);
      return;
    }
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
    state.activeView = "action";
    state.activeActionSection = "history";
    refresh();
    setWorkspaceView("action", { section: "history", focus: true, scroll: true });
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
    state.collapsedRaceRecords = {};
    state.expandedRaceRecords = {};
    refresh();
    saveGame();
  }

  function collapseFullHistory() {
    if (!state.career) return;
    state.historyExpanded = false;
    state.expandedRaceRecords = {};
    state.collapsedRaceRecords = (state.career.races || []).reduce((records, _record, index) => {
      records[`race-${index + 1}`] = true;
      return records;
    }, {});
    state.expandedRaceComments = {};
    state.expandedOpponentRosters = {};
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

  function toggleOpponentRoster(recordKey) {
    if (!state.career || !recordKey) return;
    state.expandedOpponentRosters = normalizeExpandedRaceRecords(state.expandedOpponentRosters);
    if (state.expandedOpponentRosters[recordKey]) {
      delete state.expandedOpponentRosters[recordKey];
    } else {
      state.expandedOpponentRosters[recordKey] = true;
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

  function setRaceFilterToggle(key, checked) {
    state.filters = normalizeFilters(state.filters);
    state.filters[key] = !!checked;
    state.activeFilterGroup = "";
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
    const historyCommentButtons = Array.from(document.querySelectorAll("[data-history-comment-toggle]"));
    const opponentRosterButtons = Array.from(document.querySelectorAll("[data-opponent-roster-toggle]"));
    const horseNameLanguageButtons = Array.from(document.querySelectorAll("[data-horse-name-language]"));
    const raceNameModeButtons = Array.from(document.querySelectorAll("[data-race-name-mode]"));
    const raceFilterToggles = Array.from(document.querySelectorAll("[data-race-filter]"));
    const raceFilterBooleanToggles = Array.from(document.querySelectorAll("[data-race-filter-toggle]"));
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
    historyCommentButtons.forEach((button) => {
      button.addEventListener("click", () => toggleHistoryComment(button.dataset.historyCommentToggle));
    });
    opponentRosterButtons.forEach((button) => {
      button.addEventListener("click", () => toggleOpponentRoster(button.dataset.opponentRosterToggle));
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
    raceFilterBooleanToggles.forEach((toggle) => {
      toggle.addEventListener("change", () => {
        setRaceFilterToggle(toggle.dataset.raceFilterToggle, toggle.checked);
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

  function bindWorkspaceEvents() {
    const shell = document.getElementById("workspaceShell");
    const setupCloseBtn = document.getElementById("setupCloseBtn");
    const newCareerBtn = document.getElementById("newCareerBtn");
    const workspaceHelpBtn = document.getElementById("workspaceHelpBtn");
    const workspaceChangelogBtn = document.getElementById("workspaceChangelogBtn");
    const workspaceClearSaveBtn = document.getElementById("workspaceClearSaveBtn");
    const helpPanel = document.getElementById("helpPanel");
    const resultOverlay = document.getElementById("raceResultDialog");
    const primary = document.querySelector(".workspace-primary");
    const syncActionSection = () => {
      if (state.activeView !== "action") return;
      const history = document.querySelector('[data-action-anchor="history"]');
      if (!history) return;
      const threshold = isMobileLayout() ? 150 : 140;
      const mobileAtBottom = !!(primary
        && primary.scrollTop > 20
        && primary.scrollTop + primary.clientHeight >= primary.scrollHeight - 16);
      const pageAtBottom = window.scrollY > 20
        && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 16;
      const nextSection = history.getBoundingClientRect().top <= threshold || mobileAtBottom || pageAtBottom
        ? "history"
        : "race";
      if (nextSection === state.activeActionSection) return;
      state.activeActionSection = nextSection;
      applyWorkspaceView();
    };
    const scheduleActionSectionSync = () => {
      if (actionScrollFrame) return;
      actionScrollFrame = window.requestAnimationFrame(() => {
        actionScrollFrame = 0;
        syncActionSection();
      });
    };
    if (shell) {
      shell.addEventListener("click", (event) => {
        const target = event.target.closest("[data-workspace-view], [data-workspace-section], [data-workspace-jump]");
        if (!target || !shell.contains(target)) return;
        if (target.dataset.workspaceSection) {
          setWorkspaceView("action", { section: target.dataset.workspaceSection, focus: true, scroll: true });
        } else {
          setWorkspaceView(target.dataset.workspaceView || target.dataset.workspaceJump, { focus: true, scroll: true });
        }
      });
    }
    window.addEventListener("scroll", scheduleActionSectionSync, { passive: true });
    if (primary) primary.addEventListener("scroll", scheduleActionSectionSync, { passive: true });
    if (setupCloseBtn) setupCloseBtn.addEventListener("click", closeSetup);
    if (newCareerBtn) newCareerBtn.addEventListener("click", openSetup);
    if (workspaceHelpBtn) workspaceHelpBtn.addEventListener("click", openHelp);
    if (workspaceChangelogBtn) {
      workspaceChangelogBtn.addEventListener("click", () => {
        const toggle = document.getElementById("changelogToggleBtn");
        if (toggle) toggle.click();
      });
    }
    if (workspaceClearSaveBtn) workspaceClearSaveBtn.addEventListener("click", clearSavedGame);
    if (helpPanel) {
      Array.from(helpPanel.querySelectorAll('[data-help-close="helpPanel"]')).forEach((button) => {
        button.addEventListener("click", closeHelp);
      });
    }
    if (resultOverlay) {
      resultOverlay.addEventListener("click", (event) => {
        if (event.target === resultOverlay || event.target.closest("#raceResultCloseBtn, #raceResultReturnBtn")) {
          closeRaceResult({ section: "race" });
        } else if (event.target.closest("#raceResultHistoryBtn")) {
          closeRaceResult({ section: "history" });
        }
      });
    }
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (state.resultOpen) {
          event.preventDefault();
          closeRaceResult({ section: "race" });
          return;
        }
        if (helpPanel && !helpPanel.hidden) {
          event.preventDefault();
          closeHelp();
          return;
        }
        if (state.setupOpen) {
          event.preventDefault();
          closeSetup();
        }
      }
      if (event.key === "Tab" && state.resultOpen && resultOverlay && !resultOverlay.hidden) {
        const focusable = Array.from(resultOverlay.querySelectorAll("button:not([disabled])"));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
    if (window.matchMedia) {
      const layoutQuery = window.matchMedia("(max-width: 760px)");
      if (layoutQuery.addEventListener) layoutQuery.addEventListener("change", refresh);
    }
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
    const gameModeToggleBtn = document.getElementById("gameModeToggleBtn");
    const gameModeSelect = document.getElementById("gameModeSelect");
    const legendIntroDialog = document.getElementById("legendIntroDialog");
    const legendIntroDismissCheckbox = document.getElementById("legendIntroDismissCheckbox");
    const legendIntroCloseButtons = legendIntroDialog
      ? Array.from(legendIntroDialog.querySelectorAll("[data-legend-intro-close]"))
      : [];
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
    const setGameMode = (mode) => {
      if (!gameModeToggleBtn || !gameModeSelect) return;
      const legendMode = mode === "legend";
      gameModeSelect.value = legendMode ? "legend" : "normal";
      gameModeToggleBtn.classList.toggle("is-active", legendMode);
      gameModeToggleBtn.setAttribute("aria-pressed", legendMode ? "true" : "false");
      const hint = legendMode
        ? "当前为传奇模式，点击切换回普通模式"
        : "当前为普通模式，点击开启传奇模式";
      gameModeToggleBtn.setAttribute("aria-label", hint);
      gameModeToggleBtn.title = hint;
    };
    const closeLegendIntro = () => {
      if (!legendIntroDialog) return;
      if (typeof legendIntroDialog.close === "function" && legendIntroDialog.open) {
        legendIntroDialog.close();
      } else {
        legendIntroDialog.removeAttribute("open");
        if (gameModeToggleBtn) gameModeToggleBtn.focus();
      }
    };
    const openLegendIntro = () => {
      if (!legendIntroDialog || isLegendIntroDismissed()) return;
      if (legendIntroDismissCheckbox) legendIntroDismissCheckbox.checked = false;
      if (typeof legendIntroDialog.showModal === "function") legendIntroDialog.showModal();
      else legendIntroDialog.setAttribute("open", "");
    };
    if (gameModeToggleBtn && gameModeSelect) {
      setGameMode("normal");
      gameModeToggleBtn.addEventListener("click", () => {
        const nextMode = gameModeSelect.value === "legend" ? "normal" : "legend";
        setGameMode(nextMode);
        if (nextMode === "legend") openLegendIntro();
      });
    }
    if (legendIntroDismissCheckbox) {
      legendIntroDismissCheckbox.addEventListener("change", () => {
        setLegendIntroDismissed(legendIntroDismissCheckbox.checked);
      });
    }
    legendIntroCloseButtons.forEach((button) => button.addEventListener("click", closeLegendIntro));
    if (legendIntroDialog) {
      legendIntroDialog.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        closeLegendIntro();
      });
      legendIntroDialog.addEventListener("close", () => {
        if (gameModeToggleBtn) gameModeToggleBtn.focus();
      });
    }
    if (helpToggleBtn && helpPanel) {
      helpToggleBtn.addEventListener("click", () => {
        const shouldShow = helpPanel.hidden;
        if (shouldShow) openHelp();
        else closeHelp();
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
      document.body.classList.toggle("drawer-open", open);
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

  function bindHistoricalDataLoadNotice() {
    const notice = document.getElementById("historicalDataLoadNotice");
    const text = document.getElementById("historicalDataLoadNoticeText");
    const reloadButton = document.getElementById("historicalDataReloadBtn");
    const closeButton = document.getElementById("historicalDataNoticeCloseBtn");
    const report = ns.HistoricalHorseLoadReport;
    if (!notice || !report || report.failed <= 0) return;
    if (text) {
      text.textContent = `${report.failed} 个史实对手资料文件加载失败，继续游戏可能出现随机对手，建议刷新页面重新加载。`;
    }
    notice.hidden = false;
    if (reloadButton) reloadButton.addEventListener("click", () => window.location.reload());
    if (closeButton) closeButton.addEventListener("click", () => {
      notice.hidden = true;
    });
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
    bindHistoricalDataLoadNotice();
    loadSavedGame();
    loadHorseNameLanguage();
    loadRaceNameMode();
    const root = document.getElementById("app");
    ns.UI.renderChangelog(document.getElementById("changelogContent"));
    bindChangelogEvents();
    ns.UI.renderSetup(root);
    document.getElementById("generateBtn").addEventListener("click", generate);
    bindSetupEvents();
    bindWorkspaceEvents();
    bindSaveLifecycleEvents();
    refresh();
  }

  document.addEventListener("DOMContentLoaded", () => {
    init().catch((error) => {
      console.error(error);
    });
  });
})();
