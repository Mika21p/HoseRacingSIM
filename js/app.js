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

  const SEASON_ORDER = [
    "二岁夏", "二岁秋", "二岁冬",
    "三岁春", "三岁夏", "三岁秋", "三岁冬",
    "四岁春", "四岁夏", "四岁秋", "四岁冬",
    "五岁春", "五岁夏", "五岁秋", "五岁冬",
    "六岁春", "六岁夏", "六岁秋", "六岁冬",
    "七岁春", "七岁夏", "七岁秋", "七岁冬"
  ];

  function refresh() {
    ns.UI.renderHorse(document.getElementById("horsePanel"), state.career);
    ns.UI.renderRaceSelector(document.getElementById("racePanel"), state.career, state.filters);
    ns.UI.renderHistory(document.getElementById("historyPanel"), state.career, state.retiredSummary, {
      expanded: state.historyExpanded
    });
    bindDynamicEvents();
  }

  function generate() {
    const name = document.getElementById("horseNameInput").value || "未命名小马";
    const sireId = document.getElementById("sireSelect").value;
    const damId = document.getElementById("damSelect").value;
    const mainJockeyId = document.getElementById("mainJockeySelect").value;
    const debugOptions = collectDebugOptions();
    if (debugOptions && !validateDebugOptions(debugOptions)) return;
    const horse = ns.HorseRules.generateHorse({ name, sireId, damId });
    if (debugOptions) ns.HorseRules.applyDebugOverrides(horse, debugOptions);
    horse.mainJockeyId = mainJockeyId;
    const commentDetails = ns.CommentRules.generateDebutCommentDetails(horse);
    const comments = commentDetails.map((comment) => comment.text);
    const debutLock = ns.CommentRules.buildDebutLock(commentDetails);
    state.career = ns.CareerRules.createCareer(horse, comments, commentDetails, debutLock);
    state.retiredSummary = null;
    state.historyExpanded = false;
    state.filters = { grade: "all", surface: "all", distance: "all" };
    refresh();
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
    refresh();
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
    const plan = selectedRacePlan();
    if (!plan) return;
    const selectedRace = plan.race;
    const schedule = plan.schedule;
    if (!shouldConfirmLongGap(schedule)) return;
    const payload = buildRacePayload(selectedRace, schedule);
    state.career.scheduledRace = payload;
    refresh();
  }

  function triggerScheduledRace() {
    if (!state.career || state.career.retired || !state.career.scheduledRace) return false;
    const payload = state.career.scheduledRace;
    if (state.career.currentTime.index < payload.schedule.index) return false;
    completeRace(payload, state.career.mainJockeyId);
    return true;
  }

  function advanceTurn() {
    if (!state.career || state.career.retired) return;
    if (triggerScheduledRace()) return;
    const next = ns.TimeRules.nextTurn(state.career.currentTime);
    ns.CareerRules.advanceToTime(state.career, next);
    if (triggerScheduledRace()) return;
    refresh();
  }

  function cancelRegistration() {
    if (!state.career || state.career.retired) return;
    state.career.scheduledRace = null;
    refresh();
  }

  function retire() {
    if (!state.career || state.career.retired) return;
    state.retiredSummary = ns.CareerRules.retire(state.career);
    refresh();
  }

  function toggleHistory() {
    if (!state.career) return;
    state.historyExpanded = !state.historyExpanded;
    refresh();
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
      });
    }
    if (surfaceFilter) {
      surfaceFilter.addEventListener("change", () => {
        state.filters.surface = surfaceFilter.value;
        refresh();
      });
    }
    if (distanceFilter) {
      distanceFilter.addEventListener("change", () => {
        state.filters.distance = distanceFilter.value;
        refresh();
      });
    }
  }

  function bindSetupEvents() {
    const helpToggleBtn = document.getElementById("helpToggleBtn");
    const helpPanel = document.getElementById("helpPanel");
    const debugModeToggle = document.getElementById("debugModeToggle");
    const debugPanel = document.getElementById("debugPanel");
    const debugStrength = document.getElementById("debugStrength");
    const debugStrengthValue = document.getElementById("debugStrengthValue");
    if (helpToggleBtn && helpPanel) {
      helpToggleBtn.addEventListener("click", () => {
        const shouldShow = helpPanel.hidden;
        helpPanel.hidden = !shouldShow;
        helpToggleBtn.textContent = shouldShow ? "收起帮助" : "属性帮助";
        helpToggleBtn.setAttribute("aria-expanded", shouldShow ? "true" : "false");
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

  async function init() {
    if (ns.HistoricalHorsesReady) {
      await ns.HistoricalHorsesReady;
      if (ns.HistoricalOpponentRules) {
        ns.HistoricalOpponentRules.reset();
        ns.HistoricalOpponentRules.validate();
      }
    }
    const root = document.getElementById("app");
    ns.UI.renderChangelog(document.getElementById("changelogContent"));
    bindChangelogEvents();
    ns.UI.renderSetup(root);
    document.getElementById("generateBtn").addEventListener("click", generate);
    bindSetupEvents();
    refresh();
  }

  document.addEventListener("DOMContentLoaded", () => {
    init().catch((error) => {
      console.error(error);
    });
  });
})();
