(function () {
  const ns = (window.Keiba = window.Keiba || {});

  const state = {
    career: null,
    careerSource: "standard",
    rogueSave: null,
    rogueShopNotice: "",
    rogueShopCategory: "consumables",
    rogueCandidateIndex: 0,
    rogueInventoryExpanded: false,
    rogueExpandedCommentGroups: {},
    eraEntrySetup: null,
    eraRun: null,
    eraShowHub: true,
    eraScheduleOpen: false,
    eraNewspaperOpen: false,
    eraTransientScene: null,
    eraSaveMessage: "",
    retiredSummary: null,
    activeScreen: "home",
    setupReturnScreen: "home",
    activeView: "action",
    activeActionSection: "race",
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
    raceSelection: {},
    filters: {
      grade: [],
      surface: [],
      distance: [],
      region: [],
      track: [],
      type: [],
      avoidFatigueRisk: false
    }
  };

  const SAVE_KEY = "keiba-career-save-v1";
  const ROGUE_SAVE_KEY = "keiba-roguelike-save-v1";
  const ERA_SAVE_KEY = "keiba-era-save-v1";
  const HORSE_NAME_LANGUAGE_KEY = "keiba-horse-name-language-v1";
  const RACE_NAME_MODE_KEY = "keiba-race-name-mode-v1";
  const LEGEND_INTRO_DISMISSED_KEY = "keiba-legend-intro-dismissed-v1";
  const SAVE_VERSION = 3;
  const ERA_SAVE_VERSION = 3;
  const saveStatus = {
    storageAvailable: true,
    savedAt: null,
    message: ""
  };
  let selectionCareer = null;
  let savePaused = false;
  let legendIntroDismissedForSession = false;
  let resultReturnFocus = null;
  let resultWasVisible = false;
  let actionScrollFrame = 0;
  let helpReturnFocus = null;
  let feedbackCopyResetTimer = 0;
  let feedbackCopyRequest = 0;

  const SEASON_ORDER = [
    "二岁夏", "二岁秋", "二岁冬",
    "三岁春", "三岁夏", "三岁秋", "三岁冬",
    "四岁春", "四岁夏", "四岁秋", "四岁冬",
    "五岁春", "五岁夏", "五岁秋", "五岁冬",
    "六岁春", "六岁夏", "六岁秋", "六岁冬",
    "七岁春", "七岁夏", "七岁秋", "七岁冬"
  ];

  function refresh() {
    if (selectionCareer !== state.career) { selectionCareer = state.career; state.raceSelection = {}; }
    if (state.career && ns.RegionRules) ns.RegionRules.ensureCareerState(state.career);
    const didNormalizeScheduledRace = normalizeScheduledRacePayload(state.career);
    const didClearExpiredRegistration = clearExpiredRegistration();
    const didMarkTravelPreparation = markScheduledTravelPreparation();
    const app = document.getElementById("app");
    const hasCareer = !!state.career;
    if (state.activeScreen === "career" && !hasCareer) state.activeScreen = "home";
    const isCareerScreen = state.activeScreen === "career" && hasCareer;
    if (app) app.classList.toggle("app-has-career", isCareerScreen);
    document.body.classList.toggle("has-career", isCareerScreen);
    const homeScreen = document.getElementById("homeScreen");
    const homeContinueBtn = document.getElementById("homeContinueBtn");
    const homeLegendContinueBtn = document.getElementById("homeLegendContinueBtn");
    const homeStartBtn = document.getElementById("homeStartBtn");
    const homeRogueContinueBtn = document.getElementById("homeRogueContinueBtn");
    const homeRogueStatus = document.getElementById("homeRogueStatus");
    const setupOverlay = document.getElementById("setupOverlay");
    const rogueOverlay = document.getElementById("rogueOverlay");
    const eraOverlay = document.getElementById("eraOverlay");
    const setupCloseBtn = document.getElementById("setupCloseBtn");
    const workspaceShell = document.getElementById("workspaceShell");
    const workspaceChallengeNav = document.getElementById("workspaceChallengeNav");
    const isRogueCareer = !!(state.career && state.career.gameMode === "roguelike");
    if (homeScreen) homeScreen.hidden = state.activeScreen !== "home";
    const hasStandardCareer = hasSavedGame();
    const savedMode = savedCareerMode();
    // 普通生涯与传奇模式共用一份存档，继续入口只出现在与存档模式相符的卡片上。
    if (homeContinueBtn) homeContinueBtn.hidden = !hasStandardCareer || savedMode === "legend";
    if (homeLegendContinueBtn) homeLegendContinueBtn.hidden = savedMode !== "legend";
    if (homeStartBtn) homeStartBtn.textContent = hasStandardCareer ? "开始新生涯" : "开始生涯";
    if (setupOverlay) setupOverlay.hidden = state.activeScreen !== "setup";
    if (rogueOverlay) rogueOverlay.hidden = state.activeScreen !== "rogue";
    if (eraOverlay) eraOverlay.hidden = state.activeScreen !== "era";
    document.body.classList.toggle("has-era", state.activeScreen === "era");
    if (homeRogueContinueBtn) homeRogueContinueBtn.hidden = !(state.rogueSave && state.rogueSave.run);
    if (homeRogueStatus && state.rogueSave) {
      const unlocked = state.rogueSave.profile.unlockedTrainerIds.length;
      homeRogueStatus.textContent = `荣誉币 ${state.rogueSave.profile.honorCoins} · 已解锁 ${unlocked}/3 位练马师`;
    }
    if (setupCloseBtn) setupCloseBtn.textContent = state.setupReturnScreen === "career" && hasCareer
      ? "返回生涯"
      : "返回主页";
    if (workspaceShell) {
      workspaceShell.hidden = !isCareerScreen;
      workspaceShell.classList.toggle("is-rogue-career", isRogueCareer);
    }
    if (workspaceChallengeNav) workspaceChallengeNav.hidden = !isRogueCareer;
    const bloodlineNav = document.getElementById("workspaceBloodlineNav");
    if (bloodlineNav) bloodlineNav.hidden = isRogueCareer;
    ns.CareerBloodlineUI.render(document.getElementById("bloodlinePanel"), state.career);
    ns.UI.renderWorkspaceStatus(document.getElementById("workspaceStatus"), state.career);
    ns.UI.renderHorse(document.getElementById("horsePanel"), state.career, {
      trainerCommentsCollapsed: state.trainerCommentsCollapsed
    });
    ns.UI.renderRaceSelector(document.getElementById("racePanel"), state.career, state.filters, {
      activeFilterGroup: state.activeFilterGroup,
      selection: state.raceSelection,
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
    renderRogueCareerPanels();
    if (state.activeScreen === "rogue") renderRogueScreen();
    if (eraOverlay && ns.EraUI) {
      ns.EraUI.render(eraOverlay, state.eraRun, {
        showHub: state.eraShowHub,
        scheduleOpen: state.eraScheduleOpen,
        newspaperOpen: state.eraNewspaperOpen,
        transientScene: state.eraTransientScene,
        entrySetup: state.eraEntrySetup,
        saveMessage: state.eraSaveMessage
      });
    }
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
    return ns.RaceSelection.normalize({});
  }

  function isMobileLayout() {
    return !!(window.matchMedia && window.matchMedia("(max-width: 760px)").matches);
  }

  function applyWorkspaceView() {
    const isRogueCareer = !!(state.career && state.career.gameMode === "roguelike");
    const allowedViews = isRogueCareer
      ? ["action", "horse", "challenge", "more"]
      : ["action", "horse", "bloodline", "more"];
    const view = allowedViews.includes(state.activeView)
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
    const isRogueCareer = !!(state.career && state.career.gameMode === "roguelike");
    const allowedViews = isRogueCareer
      ? ["action", "horse", "challenge", "more"]
      : ["action", "horse", "bloodline", "more"];
    if (!allowedViews.includes(view)) return;
    const opts = options || {};
    state.activeView = view;
    if (view === "action") {
      state.activeActionSection = ["race", "history"].includes(opts.section) ? opts.section : "race";
    }
    state.activeScreen = "career";
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

  function openSetup(returnScreen) {
    state.setupReturnScreen = returnScreen === "career" && state.career ? "career" : "home";
    state.activeScreen = "setup";
    state.resultOpen = false;
    closeHelp({ restoreFocus: false });
    refresh();
    const title = document.getElementById("setupPageTitle");
    if (title) title.focus({ preventScroll: true });
  }

  function closeSetup() {
    const returnToCareer = state.setupReturnScreen === "career" && !!state.career;
    state.activeScreen = returnToCareer ? "career" : "home";
    refresh();
    const trigger = document.getElementById(returnToCareer ? "newCareerBtn" : "homeStartBtn");
    if (trigger) trigger.focus({ preventScroll: true });
  }

  function showHome() {
    if (state.career) saveGame({ silent: true });
    if (state.eraRun || state.eraEntrySetup) saveEraGame({ silent: true });
    state.activeScreen = "home";
    state.setupReturnScreen = "home";
    state.resultOpen = false;
    closeHelp({ restoreFocus: false });
    refresh();
    const title = document.getElementById("homeTitle");
    if (title) {
      title.setAttribute("tabindex", "-1");
      title.focus({ preventScroll: true });
    }
  }

  function showCareer() {
    if (!state.career) return;
    state.activeScreen = "career";
    state.resultOpen = false;
    closeHelp({ restoreFocus: false });
    refresh();
    const status = document.getElementById("workspaceStatus");
    if (status) {
      status.setAttribute("tabindex", "-1");
      status.focus({ preventScroll: true });
    }
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function openRogue() {
    if (state.career) saveGame({ silent: true });
    state.activeScreen = "rogue";
    state.resultOpen = false;
    closeHelp({ restoreFocus: false });
    refresh();
  }

  function openEra() {
    if (state.career) saveGame({ silent: true });
    state.activeScreen = "era";
    state.eraShowHub = true;
    state.eraScheduleOpen = false;
    state.eraNewspaperOpen = false;
    state.eraTransientScene = null;
    state.resultOpen = false;
    closeHelp({ restoreFocus: false });
    refresh();
    resetEraScroll();
  }

  function resetEraScroll() {
    const overlay = document.getElementById("eraOverlay");
    if (overlay) overlay.scrollTop = 0;
  }

  function restoreStandardCareer() {
    if (state.career) saveGame({ silent: true });
    state.career = null;
    state.retiredSummary = null;
    state.careerSource = "standard";
    return loadSavedGame();
  }

  function showStandardCareer() {
    if (!restoreStandardCareer()) return;
    showCareer();
  }

  function openStandardSetup(legend) {
    restoreStandardCareer();
    openSetup("home");
    if (legend) {
      const gameModeSelect = document.getElementById("gameModeSelect");
      const gameModeToggleBtn = document.getElementById("gameModeToggleBtn");
      if (gameModeSelect && gameModeSelect.value !== "legend" && gameModeToggleBtn) gameModeToggleBtn.click();
    }
  }

  function continueRogue() {
    const run = state.rogueSave && state.rogueSave.run;
    if (!run) {
      openRogue();
      return;
    }
    if (["career", "settled"].includes(run.phase) && run.activeCareer) {
      state.career = run.activeCareer;
      state.careerSource = "rogue";
      state.retiredSummary = run.retiredSummary || null;
      showCareer();
      return;
    }
    openRogue();
  }

  function rogueSaveAndRefresh() {
    saveRogueGame();
    refresh();
  }

  function startRogueRun() {
    if (state.rogueSave.run) return;
    state.rogueSave.run = ns.RoguelikeRules.createRun(state.rogueSave.profile);
    state.rogueShopNotice = "";
    state.rogueCandidateIndex = 0;
    state.rogueInventoryExpanded = false;
    state.rogueExpandedCommentGroups = {};
    rogueSaveAndRefresh();
  }

  function permanentProductHtml(id, name, description) {
    const rules = ns.RoguelikeRules;
    const profile = state.rogueSave.profile;
    const unlocked = id === "veterinarian"
      ? profile.residentVeterinarian
      : profile.unlockedTrainerIds.includes(id);
    const price = rules.PERMANENT_PRICES[id];
    return `
      <article class="rogue-shop-card rogue-permanent-card ${unlocked ? "is-owned" : ""}">
        <div class="rogue-product-heading"><span class="badge">永久解锁</span><strong>${unlocked ? "已解锁" : `${price}枚`}</strong></div>
        <div><h3>${name}</h3><p class="rogue-product-description">${description}</p><details class="rogue-product-details"><summary>查看效果</summary><p>${description}</p></details></div>
        <button type="button" data-rogue-permanent="${id}" ${unlocked || profile.honorCoins < price ? "disabled" : ""}>${unlocked ? "已解锁" : `${price}枚`}</button>
      </article>
    `;
  }

  function consumableProductHtml(product) {
    const profile = state.rogueSave.profile;
    const count = profile.consumables[product.id] || 0;
    const categoryLabel = product.category === "refresh" ? "候选刷新" : (product.category === "review" ? "评语复核" : "选马后使用");
    return `
      <article class="rogue-shop-card rogue-consumable-card">
        <div class="rogue-product-heading"><span class="badge rogue-stock-type">${categoryLabel}</span><strong>库存 ${count}</strong></div>
        <div><h3>${escapeHtml(product.label)}</h3><p class="rogue-product-description">${escapeHtml(product.description)}</p><details class="rogue-product-details"><summary>查看效果</summary><p>${escapeHtml(product.description)}</p></details></div>
        <button type="button" data-rogue-consumable="${product.id}" ${profile.honorCoins < product.price ? "disabled" : ""} aria-label="购买一件${escapeHtml(product.label)}，消耗 ${product.price} 枚荣誉币">购买一件 · ${product.price}枚</button>
      </article>
    `;
  }

  function consumableInventoryHtml(compact) {
    const products = Object.values(ns.RoguelikeRules.CONSUMABLE_PRODUCTS);
    const profile = state.rogueSave.profile;
    const used = (state.rogueSave.run && state.rogueSave.run.consumablesUsed) || {};
    return `
      <div class="rogue-inventory-bar ${compact ? "is-compact" : ""}" aria-label="消耗品库存">
        ${products.map((product) => `
          <span class="${used[product.id] ? "is-used" : ""}">
            <small>${escapeHtml(product.label)}</small><b>×${profile.consumables[product.id] || 0}</b>${used[product.id] ? "<em>本局已用</em>" : ""}
          </span>
        `).join("")}
      </div>
    `;
  }

  function renderRogueHub() {
    const products = Object.values(ns.RoguelikeRules.CONSUMABLE_PRODUCTS);
    const activeCategory = state.rogueShopCategory === "permanent" ? "permanent" : "consumables";
    state.rogueShopCategory = activeCategory;
    return `
      <div class="rogue-store-shell">
        <header class="rogue-store-header">
          <div><p class="eyebrow">肉鸽挑战</p><h1 id="roguePageTitle">荣誉商店</h1><p>为下一次挑战准备库存，再进入三匹候选的评估阶段。</p></div>
          <div class="rogue-store-header-actions"><div class="rogue-balance"><span>当前荣誉币</span><strong>${state.rogueSave.profile.honorCoins}</strong></div><button class="secondary" type="button" data-rogue-home>返回主页</button></div>
        </header>
        <ol class="rogue-store-steps" aria-label="肉鸽挑战流程"><li class="is-active"><b>1</b><span>商店备货</span></li><li><b>2</b><span>进入选马</span></li><li><b>3</b><span>开始生涯</span></li></ol>
        <div class="rogue-store-tabs" role="tablist" aria-label="商店商品分类">
          <button id="rogueShopConsumablesTab" type="button" role="tab" aria-controls="rogueConsumablesPanel" aria-selected="${activeCategory === "consumables"}" tabindex="${activeCategory === "consumables" ? "0" : "-1"}" data-rogue-shop-tab="consumables">消耗品</button>
          <button id="rogueShopPermanentTab" type="button" role="tab" aria-controls="roguePermanentPanel" aria-selected="${activeCategory === "permanent"}" tabindex="${activeCategory === "permanent" ? "0" : "-1"}" data-rogue-shop-tab="permanent">永久解锁</button>
        </div>
        <section id="rogueConsumablesPanel" class="rogue-store-section is-primary ${activeCategory === "consumables" ? "is-mobile-active" : ""}" role="tabpanel" aria-labelledby="rogueShopConsumablesTab rogueConsumableTitle">
          <div class="section-title-row"><div><p class="eyebrow">消耗品</p><h2 id="rogueConsumableTitle">为未来的挑战备货</h2></div><span class="muted">跨局保存 · 每次购买一件</span></div>
          <div class="rogue-shop-grid rogue-consumable-grid">${products.map(consumableProductHtml).join("")}</div>
        </section>
        <section id="roguePermanentPanel" class="rogue-store-section ${activeCategory === "permanent" ? "is-mobile-active" : ""}" role="tabpanel" aria-labelledby="rogueShopPermanentTab roguePermanentTitle">
          <div class="section-title-row"><div><p class="eyebrow">永久解锁</p><h2 id="roguePermanentTitle">扩展马房与长期能力</h2></div><span class="muted">购买后永久生效</span></div>
        <div class="rogue-shop-grid">
          ${permanentProductHtml("obrien", "欧洲练马师 · O'Brien", "解锁欧洲所属候选与欧洲赛事体系。")}
          ${permanentProductHtml("pletcher", "北美练马师 · Pletcher", "解锁北美所属候选与北美赛事体系。")}
          ${permanentProductHtml("veterinarian", "驻场兽医", "每局可将当前伤病休养缩短3个月，不能逆转强制退役。")}
        </div>
        </section>
        <p class="rogue-shop-notice" role="status" aria-live="polite">${escapeHtml(state.rogueShopNotice)}</p>
        <div class="rogue-start-card">
          <div><p class="eyebrow">库存已准备好</p><h2>进入三匹候选的选马页面</h2><p>无需购买商品也能开始；进入后商店会锁定至本局结算。</p></div>
          <span class="rogue-mobile-dock-balance">余额 <b>${state.rogueSave.profile.honorCoins}</b></span>
          <button type="button" data-rogue-start>进入选马</button>
        </div>
      </div>
    `;
  }

  function bloodlineNote(kind, id) {
    const list = kind === "sire" ? ns.SireBloodlines : ns.DamBloodlines;
    const found = (list || []).find((item) => item.id === id);
    return found && found.note ? found.note : "没有额外倾向说明。";
  }

  function commentsHtml(comments) {
    return ns.UI.trainerCommentCards(comments, "rogue");
  }

  function commentGroupHtml(comments, key, label, review) {
    const expanded = !!state.rogueExpandedCommentGroups[key];
    return `
      <div class="rogue-comment-group ${review ? "is-review" : ""} ${expanded ? "is-expanded" : ""}" data-rogue-comment-group="${escapeHtml(key)}">
        <div class="rogue-comment-group-heading"><p class="eyebrow">${escapeHtml(label)}</p><button class="secondary" type="button" data-rogue-comments="${escapeHtml(key)}" aria-expanded="${expanded}">${expanded ? "收起评语" : "展开完整评语"}</button></div>
        <div class="rogue-comment-list">${commentsHtml(comments)}</div>
      </div>
    `;
  }

  function candidateCardHtml(candidate, index) {
    const run = state.rogueSave.run;
    const profile = state.rogueSave.profile;
    const h = candidate.horse;
    const products = Object.values(ns.RoguelikeRules.CONSUMABLE_PRODUCTS);
    const itemControl = (category, label) => {
      const categoryProducts = products.filter((product) => product.category === category);
      const candidateBlocked = category === "review" && !!candidate.reviewComments;
      const available = categoryProducts.some((product) => !run.consumablesUsed[product.id] && (profile.consumables[product.id] || 0) > 0);
      const options = categoryProducts.map((product) => {
        const count = profile.consumables[product.id] || 0;
        const used = !!run.consumablesUsed[product.id];
        const disabled = used || count < 1 || candidateBlocked;
        const stateLabel = used ? "本局已用" : (count < 1 ? "无库存" : `库存 ${count}`);
        return `<option value="${product.id}" ${disabled ? "disabled" : ""}>${escapeHtml(product.label)} · ${stateLabel}</option>`;
      }).join("");
      return `
        <label class="rogue-item-use"><span>${label}</span><select data-rogue-item-select="${category}" aria-label="候选 ${index + 1} ${label}" ${!available || candidateBlocked ? "disabled" : ""}><option value="" selected>选择${label}</option>${options}</select><button class="secondary" type="button" data-rogue-use="${category}" data-candidate-id="${candidate.id}" disabled>使用</button></label>
      `;
    };
    return `
      <article id="rogueCandidatePanel-${index}" class="rogue-candidate-card ${state.rogueCandidateIndex === index ? "is-mobile-active" : ""}" role="tabpanel" aria-labelledby="rogueCandidateTab-${index}">
        <div class="rogue-candidate-heading"><span>候选 ${index + 1}</span><strong id="rogueCandidateTitle-${index}" tabindex="-1">${escapeHtml(candidate.trainerName)}</strong><em>${escapeHtml(candidate.regionLabel)}所属</em></div>
        <div class="rogue-candidate-facts">
          <span><small>性别</small><b>${escapeHtml(h.gender)}</b></span>
          <span><small>毛色</small><b>${escapeHtml(h.coat)}</b></span>
          <span><small>体重</small><b>${h.weight}kg</b></span>
        </div>
        <div class="rogue-bloodline-row">
          <details class="rogue-bloodline"><summary><span>父系</span><strong>${escapeHtml(h.sireName)}</strong></summary><p>${escapeHtml(bloodlineNote("sire", h.sireId))}</p></details>
          <details class="rogue-bloodline"><summary><span>母系</span><strong>${escapeHtml(h.damName)}</strong></summary><p>${escapeHtml(bloodlineNote("dam", h.damId))}</p></details>
        </div>
        ${commentGroupHtml(candidate.initialComments, `${candidate.id}:initial`, "初次评估", false)}
        ${candidate.reviewComments ? commentGroupHtml(candidate.reviewComments, `${candidate.id}:review`, candidate.reviewLabel, true) : ""}
        <div class="rogue-service-groups">${itemControl("refresh", "刷新券")}${itemControl("review", "评语券")}</div>
        <button class="rogue-select-candidate rogue-card-select" type="button" data-rogue-select="${candidate.id}">选择这匹赛马</button>
      </article>
    `;
  }

  function renderRogueCandidates(run) {
    const candidates = run.candidates || [];
    state.rogueCandidateIndex = Math.max(0, Math.min(state.rogueCandidateIndex, candidates.length - 1));
    const activeCandidate = candidates[state.rogueCandidateIndex];
    const usedCount = Object.values(run.consumablesUsed || {}).filter(Boolean).length;
    const inventoryOpen = !isMobileLayout() || state.rogueInventoryExpanded;
    return `
      <div class="rogue-page-heading">
        <div><p class="eyebrow">候选评估</p><h1 id="roguePageTitle">从血统与评语中寻找答案</h1></div>
        <div class="rogue-heading-actions"><span class="rogue-coin-pill">商店已锁定</span><button class="secondary" type="button" data-rogue-home>返回主页</button></div>
      </div>
      <details class="rogue-inventory-disclosure" ${inventoryOpen ? "open" : ""}>
        <summary><span>道具库存</span><strong>6 种 · 本局已用 ${usedCount} 种</strong></summary>
        ${consumableInventoryHtml(true)}
      </details>
      <p class="rogue-candidate-note">每种道具每局限用一次；刷新已有复核评语的候选会一并丢失评语，道具不会返还。</p>
      <div class="rogue-candidate-tabs" role="tablist" aria-label="选择候选赛马">
        ${candidates.map((candidate, index) => `<button id="rogueCandidateTab-${index}" type="button" role="tab" aria-controls="rogueCandidatePanel-${index}" aria-selected="${state.rogueCandidateIndex === index}" tabindex="${state.rogueCandidateIndex === index ? "0" : "-1"}" data-rogue-candidate-tab="${index}"><span>候选 ${index + 1}</span><strong>${escapeHtml(candidate.trainerName)}</strong></button>`).join("")}
      </div>
      <div class="rogue-candidate-grid">${candidates.map(candidateCardHtml).join("")}</div>
      ${activeCandidate ? `<div class="rogue-candidate-dock"><span>候选 <b>${state.rogueCandidateIndex + 1}</b> / ${candidates.length}</span><button type="button" data-rogue-select="${activeCandidate.id}">选择这匹赛马</button></div>` : ""}
    `;
  }

  function challengeOptionsHtml(run) {
    return run.challengeOptions.map((id) => {
      const challenge = ns.RoguelikeRules.challengeById(id);
      return `
        <article class="rogue-challenge-option">
          <span class="badge">${challenge.groupLabel}</span><h3>${challenge.name}</h3>
          <ol><li><b>铜</b>${challenge.conditions.bronze}</li><li><b>银</b>${challenge.conditions.silver}</li><li><b>金</b>${challenge.conditions.gold}</li></ol>
          <button type="button" data-rogue-challenge="${id}">选择此目标</button>
        </article>
      `;
    }).join("");
  }

  function renderRogueHorseSetup(run) {
    const selected = run.selectedCandidate;
    const name = escapeHtml(run.pendingName || "未命名小马");
    const directionButton = (id, label) => {
      const eligible = ns.RoguelikeRules.eligibleAdaptationFields(selected.horse, id).length > 0;
      const inventory = state.rogueSave.profile.consumables.adaptation || 0;
      const used = !!run.consumablesUsed.adaptation;
      const disabled = !eligible || inventory < 1 || used;
      return `<button class="secondary" type="button" data-rogue-adaptation="${id}" ${disabled ? "disabled" : ""}>${label} · 幼驹调教券 ×${inventory}</button>`;
    };
    return `
      <div class="rogue-page-heading">
        <div><p class="eyebrow">选马完成</p><h1 id="roguePageTitle">锁定名字、调教与挑战</h1></div>
        <span class="rogue-coin-pill">荣誉币 ${state.rogueSave.profile.honorCoins}</span>
      </div>
      <div class="rogue-selected-summary"><strong>${escapeHtml(selected.trainerName)}</strong><span>${escapeHtml(selected.regionLabel)} · ${escapeHtml(selected.horse.gender)} · ${escapeHtml(selected.horse.coat)}</span><span>${escapeHtml(selected.horse.sireName)} × ${escapeHtml(selected.horse.damName)}</span></div>
      <label class="rogue-name-field">马名<input id="rogueHorseName" type="text" maxlength="30" value="${name}"></label>
      <section class="rogue-section">
        <div><p class="eyebrow">幼驹调教</p><h2>使用一张幼驹调教券，或直接跳过</h2><p class="muted">可选择草地、泥地或两者随机提升一项。只按G→C→B→A提升；前后等级保持隐藏，A不会提升为S。</p></div>
        ${run.adaptationResolved
          ? `<div class="rogue-resolved"><strong>${run.services.adaptation ? "幼驹调教已完成" : "已跳过幼驹调教"}</strong></div>`
          : `<div class="rogue-adaptation-actions">${directionButton("grass", "草地适应")}${directionButton("dirt", "泥地适应")}${directionButton("balanced", "随机场地")}<button type="button" data-rogue-adaptation-skip>不购买并继续</button></div>`}
      </section>
      ${run.adaptationResolved ? `<section class="rogue-section"><div><p class="eyebrow">本局挑战</p><h2>选择后不可更换</h2></div><div class="rogue-challenge-grid">${challengeOptionsHtml(run)}</div></section>` : ""}
    `;
  }

  function renderRogueJockey(run) {
    const selected = run.selectedCandidate;
    const affiliation = ns.RegionRules.getJockeyAffiliation(selected.regionId);
    const jockeys = ns.JockeyRules.getPlayerSelectableJockeys(affiliation);
    const challenge = ns.RoguelikeRules.challengeById(run.selectedChallengeId);
    return `
      <div class="rogue-page-heading"><div><p class="eyebrow">最终确认</p><h1 id="roguePageTitle">选择主战骑手</h1></div><span class="rogue-coin-pill">荣誉币 ${state.rogueSave.profile.honorCoins}</span></div>
      <div class="rogue-final-grid">
        <div><span>赛马</span><strong>${escapeHtml(run.pendingName || "未命名小马")}</strong></div>
        <div><span>练马师／所属地</span><strong>${escapeHtml(selected.trainerName)}／${escapeHtml(selected.regionLabel)}</strong></div>
        <div><span>挑战目标</span><strong>${escapeHtml(challenge.name)}</strong></div>
      </div>
      <label class="rogue-name-field">主战骑手<select id="rogueJockeySelect">${jockeys.map((jockey) => `<option value="${jockey.id}">${escapeHtml(jockey.name)}</option>`).join("")}</select></label>
      <div class="rogue-final-actions"><button type="button" data-rogue-begin-career>正式进入生涯</button></div>
    `;
  }

  function settlementHtml(settlement) {
    if (!settlement) return "";
    const progress = settlement.challengeProgress;
    const challenge = progress.challenge;
    const achievementRows = settlement.achievements.length
      ? settlement.achievements.map((item) => `<li><span>${escapeHtml(item.name)} · ${item.first ? "首次" : "重复"}</span><strong>+${item.coins}</strong></li>`).join("")
      : `<li><span>本局没有可结算成就</span><strong>+0</strong></li>`;
    const suppressed = settlement.suppressedAchievements.length
      ? `<div class="rogue-suppressed"><p class="eyebrow">重叠未重复结算</p>${settlement.suppressedAchievements.map((item) => `<span>${escapeHtml(item.name)}：${escapeHtml(item.reason)}</span>`).join("")}</div>`
      : "";
    return `
      <div class="rogue-settlement-heading"><div><p class="eyebrow">本局结算</p><h2>${settlement.valid ? "有效生涯" : "无效生涯"}</h2></div><strong class="rogue-total-income">+${settlement.totalCoins}枚</strong></div>
      ${settlement.valid ? `<div class="rogue-settlement-challenge"><span>挑战目标</span><strong>${challenge ? challenge.name : "未知挑战"} · ${ns.RoguelikeRules.STAGE_LABELS[progress.stage]}</strong><em>+${settlement.challengeCoins}</em></div>` : `<p class="rogue-invalid-note">未满足3战且推进至3岁夏的主动结算条件，本局不发放奖励。</p>`}
      <ul class="rogue-achievement-payouts">${achievementRows}</ul>
      ${suppressed}
      <div class="rogue-settlement-totals"><span>挑战积分 ${settlement.challengeScore}</span><span>成就积分 ${settlement.achievementScore}</span><strong>生涯积分 ${settlement.totalScore}</strong><strong>结算后余额 ${settlement.balanceAfter}</strong></div>
    `;
  }

  function renderRogueSettled(run) {
    return `
      <div class="rogue-page-heading"><div><p class="eyebrow">肉鸽挑战</p><h1 id="roguePageTitle">生涯已经结算</h1></div><button class="secondary" type="button" data-rogue-home>返回主页</button></div>
      ${settlementHtml(run.settlement)}
      <div class="rogue-final-actions"><button class="secondary" type="button" data-rogue-view-career>查看完整生涯</button><button type="button" data-rogue-next-run>返回商店，准备下一匹马</button></div>
    `;
  }

  function renderRogueScreen() {
    const content = document.getElementById("rogueContent");
    if (!content || !state.rogueSave) return;
    const run = state.rogueSave.run;
    if (!run) content.innerHTML = renderRogueHub();
    else if (run.phase === "candidates") content.innerHTML = renderRogueCandidates(run);
    else if (run.phase === "horse-setup") content.innerHTML = renderRogueHorseSetup(run);
    else if (run.phase === "jockey") content.innerHTML = renderRogueJockey(run);
    else if (run.phase === "settled") content.innerHTML = renderRogueSettled(run);
    else content.innerHTML = `<div class="rogue-page-heading"><h1 id="roguePageTitle">肉鸽生涯进行中</h1></div><button type="button" data-rogue-view-career>返回生涯</button>`;
    bindRogueScreenEvents(content);
  }

  function rememberRogueName() {
    const input = document.getElementById("rogueHorseName");
    if (!input || !state.rogueSave.run) return;
    state.rogueSave.run.pendingName = input.value.trim() || "未命名小马";
    saveRogueGame();
  }

  function bindRogueScreenEvents(content) {
    const one = (selector, handler) => {
      const element = content.querySelector(selector);
      if (element) element.addEventListener("click", handler);
    };
    content.querySelectorAll("[data-rogue-home]").forEach((button) => button.addEventListener("click", showHome));
    one("[data-rogue-start]", startRogueRun);
    const shopTabs = Array.from(content.querySelectorAll("[data-rogue-shop-tab]"));
    const activateShopTab = (button, focus) => {
      if (!button) return;
      const category = button.dataset.rogueShopTab === "permanent" ? "permanent" : "consumables";
      state.rogueShopCategory = category;
      shopTabs.forEach((tab) => {
        const active = tab === button;
        tab.setAttribute("aria-selected", String(active));
        tab.setAttribute("tabindex", active ? "0" : "-1");
      });
      const consumables = content.querySelector("#rogueConsumablesPanel");
      const permanent = content.querySelector("#roguePermanentPanel");
      if (consumables) consumables.classList.toggle("is-mobile-active", category === "consumables");
      if (permanent) permanent.classList.toggle("is-mobile-active", category === "permanent");
      if (focus) button.focus({ preventScroll: true });
    };
    shopTabs.forEach((button, index) => {
      button.addEventListener("click", () => activateShopTab(button, false));
      button.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const nextIndex = event.key === "Home"
          ? 0
          : (event.key === "End" ? shopTabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + shopTabs.length) % shopTabs.length);
        activateShopTab(shopTabs[nextIndex], true);
      });
    });
    const candidateTabs = Array.from(content.querySelectorAll("[data-rogue-candidate-tab]"));
    const activateCandidateTab = (button, focus) => {
      if (!button || !state.rogueSave.run) return;
      const index = Number(button.dataset.rogueCandidateTab);
      if (!Number.isInteger(index) || !state.rogueSave.run.candidates[index]) return;
      state.rogueCandidateIndex = index;
      candidateTabs.forEach((tab) => {
        const active = tab === button;
        tab.setAttribute("aria-selected", String(active));
        tab.setAttribute("tabindex", active ? "0" : "-1");
      });
      content.querySelectorAll(".rogue-candidate-card").forEach((card, cardIndex) => card.classList.toggle("is-mobile-active", cardIndex === index));
      const dock = content.querySelector(".rogue-candidate-dock");
      if (dock) {
        const label = dock.querySelector("span");
        const select = dock.querySelector("[data-rogue-select]");
        if (label) label.innerHTML = `候选 <b>${index + 1}</b> / ${candidateTabs.length}`;
        if (select) select.dataset.rogueSelect = state.rogueSave.run.candidates[index].id;
      }
      if (focus) button.focus({ preventScroll: true });
    };
    candidateTabs.forEach((button, index) => {
      button.addEventListener("click", () => activateCandidateTab(button, false));
      button.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const nextIndex = event.key === "Home"
          ? 0
          : (event.key === "End" ? candidateTabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + candidateTabs.length) % candidateTabs.length);
        activateCandidateTab(candidateTabs[nextIndex], true);
      });
    });
    const inventoryDisclosure = content.querySelector(".rogue-inventory-disclosure");
    if (inventoryDisclosure) inventoryDisclosure.addEventListener("toggle", () => {
      if (isMobileLayout()) state.rogueInventoryExpanded = inventoryDisclosure.open;
    });
    content.querySelectorAll("[data-rogue-comments]").forEach((button) => button.addEventListener("click", () => {
      const key = button.dataset.rogueComments;
      const group = button.closest("[data-rogue-comment-group]");
      const expanded = !state.rogueExpandedCommentGroups[key];
      state.rogueExpandedCommentGroups[key] = expanded;
      if (group) group.classList.toggle("is-expanded", expanded);
      button.setAttribute("aria-expanded", String(expanded));
      button.textContent = expanded ? "收起评语" : "展开完整评语";
    }));
    content.querySelectorAll("[data-rogue-permanent]").forEach((button) => button.addEventListener("click", () => {
      const result = ns.RoguelikeRules.purchasePermanent(state.rogueSave, button.dataset.roguePermanent);
      if (!result.ok) window.alert(result.reason);
      else state.rogueShopNotice = `永久解锁购买成功，剩余荣誉币 ${state.rogueSave.profile.honorCoins}。`;
      rogueSaveAndRefresh();
    }));
    content.querySelectorAll("[data-rogue-consumable]").forEach((button) => button.addEventListener("click", () => {
      const itemId = button.dataset.rogueConsumable;
      const result = ns.RoguelikeRules.purchaseConsumable(state.rogueSave, itemId);
      if (!result.ok) window.alert(result.reason);
      else {
        const product = ns.RoguelikeRules.CONSUMABLE_PRODUCTS[itemId];
        state.rogueShopNotice = `已购买${product.label}，当前库存 ${result.count}，剩余荣誉币 ${state.rogueSave.profile.honorCoins}。`;
      }
      rogueSaveAndRefresh();
    }));
    content.querySelectorAll("[data-rogue-item-select]").forEach((select) => select.addEventListener("change", () => {
      const button = select.closest(".rogue-item-use").querySelector("[data-rogue-use]");
      if (button) button.disabled = !select.value;
    }));
    content.querySelectorAll("[data-rogue-use]").forEach((button) => button.addEventListener("click", () => {
      const control = button.closest(".rogue-item-use");
      const select = control && control.querySelector("[data-rogue-item-select]");
      const itemId = select && select.value;
      const product = ns.RoguelikeRules.CONSUMABLE_PRODUCTS[itemId];
      if (!itemId || !product) return;
      const candidate = state.rogueSave.run.candidates.find((item) => item.id === button.dataset.candidateId);
      const losesReview = button.dataset.rogueUse === "refresh" && candidate && candidate.reviewComments;
      const message = losesReview
        ? `使用${product.label}会替换这匹候选，并丢失已有复核评语；道具不会返还。确定使用吗？`
        : `确定对这匹候选使用${product.label}吗？使用后道具不会返还。`;
      if (!window.confirm(message)) return;
      const result = button.dataset.rogueUse === "refresh"
        ? ns.RoguelikeRules.useRefreshConsumable(state.rogueSave, button.dataset.candidateId, itemId)
        : ns.RoguelikeRules.useReviewConsumable(state.rogueSave, button.dataset.candidateId, itemId);
      if (!result.ok) window.alert(result.reason);
      rogueSaveAndRefresh();
    }));
    content.querySelectorAll("[data-rogue-select]").forEach((button) => button.addEventListener("click", () => {
      if (!window.confirm("选择赛马后，另外两匹候选会立即失效且不可恢复。确定吗？")) return;
      const result = ns.RoguelikeRules.selectCandidate(state.rogueSave, button.dataset.rogueSelect);
      if (!result.ok) window.alert(result.reason);
      rogueSaveAndRefresh();
    }));
    const nameInput = content.querySelector("#rogueHorseName");
    if (nameInput) {
      nameInput.addEventListener("change", rememberRogueName);
      nameInput.addEventListener("input", rememberRogueName);
    }
    content.querySelectorAll("[data-rogue-adaptation]").forEach((button) => button.addEventListener("click", () => {
      rememberRogueName();
      if (!window.confirm("将消耗一张幼驹调教券，并随机提升对应方向的一项适性。确定使用吗？")) return;
      const result = ns.RoguelikeRules.useAdaptationConsumable(state.rogueSave, button.dataset.rogueAdaptation);
      if (!result.ok) window.alert(result.reason);
      rogueSaveAndRefresh();
    }));
    one("[data-rogue-adaptation-skip]", () => {
      rememberRogueName();
      ns.RoguelikeRules.skipAdaptation(state.rogueSave);
      rogueSaveAndRefresh();
    });
    content.querySelectorAll("[data-rogue-challenge]").forEach((button) => button.addEventListener("click", () => {
      rememberRogueName();
      if (!window.confirm("挑战目标选择后不可更换。确定选择吗？")) return;
      const result = ns.RoguelikeRules.chooseChallenge(state.rogueSave, button.dataset.rogueChallenge);
      if (!result.ok) window.alert(result.reason);
      rogueSaveAndRefresh();
    }));
    one("[data-rogue-begin-career]", beginRogueCareer);
    content.querySelectorAll("[data-rogue-view-career]").forEach((button) => button.addEventListener("click", continueRogue));
    content.querySelectorAll("[data-rogue-next-run]").forEach((button) => button.addEventListener("click", nextRogueRun));
  }

  function beginRogueCareer() {
    const run = state.rogueSave.run;
    if (!run || run.phase !== "jockey") return;
    const candidate = run.selectedCandidate;
    const horse = candidate.horse;
    horse.name = run.pendingName || "未命名小马";
    const jockeySelect = document.getElementById("rogueJockeySelect");
    horse.mainJockeyId = jockeySelect ? jockeySelect.value : "take-yutaka";
    const trainer = ns.CommentRules.getTrainer(candidate.trainerId);
    const effectiveComments = candidate.reviewComments || candidate.initialComments;
    const debutLock = ns.CommentRules.buildDebutLock(effectiveComments);
    const career = ns.CareerRules.createCareer(horse, effectiveComments.map((comment) => comment.text), effectiveComments, debutLock, trainer);
    career.roguelike = {
      runId: run.id,
      challengeId: run.selectedChallengeId,
      initialComments: candidate.initialComments,
      reviewComments: candidate.reviewComments || [],
      reviewLabel: candidate.reviewLabel || "",
      honorCoins: state.rogueSave.profile.honorCoins,
      veterinarianUnlocked: state.rogueSave.profile.residentVeterinarian,
      veterinarianUsed: false
    };
    run.activeCareer = career;
    run.phase = "career";
    state.career = career;
    state.careerSource = "rogue";
    state.retiredSummary = null;
    state.activeScreen = "career";
    state.activeView = "action";
    state.activeActionSection = "race";
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
    saveRogueGame();
    refresh();
  }

  function nextRogueRun() {
    state.rogueSave.run = null;
    state.career = null;
    state.retiredSummary = null;
    state.careerSource = "rogue";
    state.activeScreen = "rogue";
    state.rogueShopCategory = "consumables";
    state.rogueCandidateIndex = 0;
    state.rogueInventoryExpanded = false;
    state.rogueExpandedCommentGroups = {};
    saveRogueGame();
    refresh();
  }

  function challengeProgressHtml(progress) {
    if (!progress || !progress.challenge) return "";
    const conditions = ["bronze", "silver", "gold"].map((stage) => {
      const complete = progress.flags[stage];
      const failed = progress.failedStages.includes(stage);
      return `<li class="${complete ? "is-complete" : (failed ? "is-failed" : "")}"><b>${ns.RoguelikeRules.STAGE_LABELS[stage]}</b><span>${escapeHtml(progress.challenge.conditions[stage])}</span><em>${complete ? "已完成" : (failed ? "已失败" : "进行中")}</em></li>`;
    }).join("");
    const metrics = progress.metrics;
    const surfaceText = Object.keys(metrics.surfaces || {}).map((surface) => {
      const item = metrics.surfaces[surface];
      return `${surface}${item.wins}胜/顶级${item.top}`;
    }).join(" · ") || "尚无草泥胜利";
    return `
      <div class="section-title-row"><div><p class="eyebrow">本局挑战</p><h2>${escapeHtml(progress.challenge.name)}</h2></div><span class="badge rogue-badge">当前 ${ns.RoguelikeRules.STAGE_LABELS[progress.stage]}</span></div>
      <ol class="rogue-progress-stages">${conditions}</ol>
      <div class="rogue-progress-metrics">
        <span><small>战绩</small><b>${metrics.starts}战 ${metrics.wins}胜</b></span>
        <span><small>顶级胜利</small><b>${metrics.topWins}</b></span>
        <span><small>连续前二</small><b>当前${metrics.currentTopTwoStreak}／最佳${metrics.bestTopTwoStreak}</b></span>
        <span><small>连胜</small><b>当前${metrics.currentWinStreak}／最佳${metrics.bestWinStreak}</b></span>
        <span><small>距离类别</small><b>${escapeHtml(metrics.distanceCategories.join("、") || "暂无")}</b></span>
        <span><small>草泥成绩</small><b>${escapeHtml(surfaceText)}</b></span>
        <span><small>完成地区</small><b>${escapeHtml(metrics.regions.join("、") || "暂无")}</b></span>
        <span><small>完成年龄</small><b>${escapeHtml(metrics.ages.map((age) => `${age}岁`).join("、") || "暂无")}</b></span>
      </div>
    `;
  }

  function challengeHintHtml(progress) {
    if (!progress || !progress.challenge) return "";
    const stageLabel = ns.RoguelikeRules.STAGE_LABELS[progress.stage] || "未完成";
    return `
      <button class="rogue-challenge-hint-button" type="button" data-workspace-jump="challenge" aria-label="查看本局挑战${escapeHtml(progress.challenge.name)}详情">
        <span><small>本局挑战</small><strong>${escapeHtml(progress.challenge.name)}</strong></span>
        <b>${escapeHtml(stageLabel)}</b>
        <em>查看详情</em>
      </button>
    `;
  }

  function renderRogueCareerPanels() {
    const challengePanel = document.getElementById("rogueChallengePanel");
    const challengeHint = document.getElementById("rogueChallengeHint");
    const veterinarianPanel = document.getElementById("rogueVeterinarianPanel");
    const settlementPanel = document.getElementById("rogueSettlementPanel");
    const isRogue = state.career && state.career.gameMode === "roguelike";
    if (settlementPanel) settlementPanel.hidden = true;
    if (challengeHint) challengeHint.hidden = true;
    if (veterinarianPanel) veterinarianPanel.hidden = true;
    if (!isRogue || !challengePanel) {
      if (challengePanel) challengePanel.innerHTML = "";
      if (challengeHint) challengeHint.innerHTML = "";
      if (veterinarianPanel) veterinarianPanel.innerHTML = "";
      return;
    }
    const progress = ns.RoguelikeRules.evaluateChallenge(state.career, state.career.roguelike && state.career.roguelike.challengeId);
    const activeInjury = state.career.injury && state.career.injury.active;
    const canUseVet = state.rogueSave
      && state.rogueSave.profile.residentVeterinarian
      && activeInjury
      && !state.career.roguelike.veterinarianUsed
      && !state.career.retired;
    challengePanel.innerHTML = challengeProgressHtml(progress);
    if (challengeHint && progress.challenge) {
      challengeHint.hidden = false;
      challengeHint.innerHTML = challengeHintHtml(progress);
    }
    if (veterinarianPanel && canUseVet) {
      veterinarianPanel.hidden = false;
      veterinarianPanel.innerHTML = `<div class="rogue-vet-action"><div><strong>驻场兽医</strong><span>将当前剩余休养缩短3个月，本局仅一次。</span></div><button type="button" id="rogueVeterinarianBtn">立即治疗</button></div>`;
    }
    const vetButton = document.getElementById("rogueVeterinarianBtn");
    if (vetButton) vetButton.addEventListener("click", useRogueVeterinarian);
    const run = state.rogueSave && state.rogueSave.run;
    if (run && run.settlement && settlementPanel) {
      settlementPanel.hidden = false;
      settlementPanel.innerHTML = `${settlementHtml(run.settlement)}<div class="rogue-final-actions"><button class="secondary" type="button" id="rogueSettlementHomeBtn">返回主页</button><button type="button" id="rogueSettlementNextBtn">返回商店，准备下一匹马</button></div>`;
      const nextButton = document.getElementById("rogueSettlementNextBtn");
      const homeButton = document.getElementById("rogueSettlementHomeBtn");
      if (nextButton) nextButton.addEventListener("click", nextRogueRun);
      if (homeButton) homeButton.addEventListener("click", showHome);
    }
  }

  function useRogueVeterinarian() {
    if (!state.career || !state.rogueSave) return;
    const result = ns.RoguelikeRules.useVeterinarian(state.career, state.rogueSave.profile);
    if (!result.ok) {
      window.alert(result.reason);
      return;
    }
    window.alert(result.healed ? "治疗完成，赛马已经康复。" : "治疗完成，剩余休养时间已缩短3个月。");
    saveGame();
    refresh();
  }

  function settleRogueCareer(forced) {
    const run = state.rogueSave && state.rogueSave.run;
    if (!run || run.settled) return run && run.settlement;
    const result = ns.RoguelikeRules.buildSettlement(state.rogueSave.profile, state.career, forced);
    state.rogueSave.profile = result.profile;
    run.settlement = result.settlement;
    run.settled = true;
    run.phase = "settled";
    run.activeCareer = state.career;
    run.retiredSummary = state.retiredSummary;
    state.career.roguelike.honorCoins = state.rogueSave.profile.honorCoins;
    saveRogueGame();
    return result.settlement;
  }

  function copyTextFallback(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    let copied = false;
    try {
      copied = !!(document.execCommand && document.execCommand("copy"));
    } catch (error) {
      copied = false;
    }
    textarea.remove();
    return copied;
  }

  async function copyFeedbackGroupNumber(button) {
    if (!button) return;
    const groupNumber = button.dataset.feedbackGroupNumber || "1050162087";
    const status = document.getElementById("feedbackCopyStatus");
    const request = ++feedbackCopyRequest;
    let copied = false;
    window.clearTimeout(feedbackCopyResetTimer);
    button.textContent = "复制中…";
    if (status) status.textContent = "正在复制群号";
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        const clipboardAttempt = navigator.clipboard.writeText(groupNumber);
        copied = copyTextFallback(groupNumber);
        if (copied) {
          clipboardAttempt.catch(() => {});
        } else {
          await Promise.race([
            clipboardAttempt,
            new Promise((resolve, reject) => {
              window.setTimeout(() => reject(new Error("clipboard-timeout")), 800);
            })
          ]);
          copied = true;
        }
      } else {
        copied = copyTextFallback(groupNumber);
      }
    } catch (error) {
      copied = copyTextFallback(groupNumber);
    }
    if (request !== feedbackCopyRequest) return;
    if (!copied) {
      button.textContent = "复制群号";
      if (status) status.textContent = "复制失败，请长按群号手动复制";
      return;
    }
    button.textContent = "已复制";
    if (status) status.textContent = "群号已复制到剪贴板";
    feedbackCopyResetTimer = window.setTimeout(() => {
      if (!button.isConnected) return;
      button.textContent = "复制群号";
      if (status) status.textContent = "点击按钮即可复制";
    }, 2000);
  }

  function openHelp(trigger) {
    const panel = document.getElementById("helpPanel");
    if (!panel) return;
    helpReturnFocus = trigger || document.activeElement;
    panel.hidden = false;
    document.body.classList.add("drawer-open");
    const toggle = document.getElementById("helpToggleBtn");
    if (toggle) toggle.setAttribute("aria-expanded", "true");
    const closeButton = panel.querySelector('[data-help-close="helpPanel"]');
    if (closeButton) closeButton.focus({ preventScroll: true });
  }

  function closeHelp(options) {
    const panel = document.getElementById("helpPanel");
    if (!panel) return;
    panel.hidden = true;
    document.body.classList.remove("drawer-open");
    const toggle = document.getElementById("helpToggleBtn");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    const opts = options || {};
    if (opts.restoreFocus !== false && helpReturnFocus && typeof helpReturnFocus.focus === "function") {
      helpReturnFocus.focus({ preventScroll: true });
    }
    helpReturnFocus = null;
  }

  function applyRaceResultOverlay() {
    const overlay = document.getElementById("raceResultDialog");
    if (!overlay) return;
    const shouldOpen = !!(state.activeScreen === "career" && state.career && state.resultOpen && state.career.races && state.career.races.length);
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

  function normalizeFilters(filters) { return ns.RaceSelection.normalize(filters || {}); }

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
    if (ns.RaceRules && ns.RaceRules.normalizeLegendOpponentYears) {
      ns.RaceRules.normalizeLegendOpponentYears(career);
    }
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
    if (state.careerSource === "rogue") {
      if (state.rogueSave && state.rogueSave.run && state.career) {
        state.career.roguelike = state.career.roguelike || {};
        state.career.roguelike.honorCoins = state.rogueSave.profile.honorCoins;
        state.rogueSave.run.activeCareer = state.career;
        state.rogueSave.run.retiredSummary = state.retiredSummary;
      }
      return saveRogueGame();
    }
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
      const restoredCareer = normalizeRestoredCareer(payload.state.career, payload.version);
      if (!restoredCareer) throw new Error("Save payload has no career.");
      state.career = restoredCareer;
      state.careerSource = "standard";
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
    if (!storage) return false;
    try {
      const payload = JSON.parse(storage.getItem(SAVE_KEY) || "null");
      return !!(payload && payload.version === SAVE_VERSION && payload.state);
    } catch (error) {
      return false;
    }
  }

  // 本机生涯存档所属的模式（"normal" / "legend"），无有效存档时为 null。
  // 首页用它区分两种模式共用存档时的状态文案与继续入口。
  function savedCareerMode() {
    const storage = getStorage();
    if (!storage) return null;
    try {
      const payload = JSON.parse(storage.getItem(SAVE_KEY) || "null");
      const career = payload && payload.version === SAVE_VERSION && payload.state && payload.state.career;
      if (!career) return null;
      return career.gameMode === "legend" ? "legend" : "normal";
    } catch (error) {
      return null;
    }
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
    const rogueCareerActive = state.activeScreen === "career" && state.careerSource === "rogue";
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
      if (!text) return;
      if (rogueCareerActive) {
        text.textContent = id === "workspaceStatusSave" ? "肉鸽存档已保存" : "肉鸽模式使用独立自动存档";
        return;
      }
      text.textContent = id === "workspaceStatusSave" && statusText.includes(" · ")
        ? statusText.split(" · ")[0]
        : statusText;
    });
    // 普通生涯与传奇模式共用一份生涯存档，首页两张卡片分别说明这份存档属于哪种模式。
    const savedMode = savedCareerMode();
    const homeModeStatus = (mode) => (savedMode && savedMode !== mode
      ? (mode === "legend" ? "本机存档为普通生涯" : "本机存档为传奇模式")
      : statusText);
    const homeSaveStatusText = document.getElementById("homeSaveStatus");
    if (homeSaveStatusText) homeSaveStatusText.textContent = homeModeStatus("normal");
    const homeLegendSaveStatusText = document.getElementById("homeLegendSaveStatus");
    if (homeLegendSaveStatusText) homeLegendSaveStatusText.textContent = homeModeStatus("legend");
    ["clearSaveBtn", "workspaceClearSaveBtn"].forEach((id) => {
      const clearButton = document.getElementById(id);
      if (clearButton) clearButton.hidden = rogueCareerActive || !hasSavedGame();
    });
  }

  function loadRogueGame() {
    const storage = getStorage();
    if (!storage || !ns.RoguelikeRules) {
      state.rogueSave = ns.RoguelikeRules ? ns.RoguelikeRules.createSave() : null;
      return false;
    }
    try {
      const raw = storage.getItem(ROGUE_SAVE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && parsed.version !== ns.RoguelikeRules.PROFILE_VERSION) {
        storage.removeItem(ROGUE_SAVE_KEY);
        state.rogueSave = ns.RoguelikeRules.createSave();
        return false;
      }
      state.rogueSave = ns.RoguelikeRules.normalizeSave(parsed);
      return !!raw;
    } catch (error) {
      console.warn("Failed to load roguelike save.", error);
      state.rogueSave = ns.RoguelikeRules.createSave();
      return false;
    }
  }

  function saveRogueGame() {
    const storage = getStorage();
    if (!storage || !state.rogueSave) return false;
    try {
      storage.setItem(ROGUE_SAVE_KEY, JSON.stringify(state.rogueSave));
      return true;
    } catch (error) {
      console.warn("Failed to save roguelike game.", error);
      return false;
    }
  }

  function loadEraGame() {
    const storage = getStorage();
    if (!storage || !ns.EraRules) return false;
    const raw = storage.getItem(ERA_SAVE_KEY);
    if (!raw) {
      state.eraEntrySetup = null;
      state.eraRun = null;
      state.eraSaveMessage = "";
      return false;
    }
    try {
      const payload = JSON.parse(raw);
      if (!payload || payload.version !== ERA_SAVE_VERSION || (!payload.run && !payload.entrySetup)) {
        throw new Error("Unsupported era save payload.");
      }
      state.eraEntrySetup = payload.version >= 2 && payload.entrySetup
        ? ns.EraRules.normalizeEntrySetup(payload.entrySetup)
        : null;
      state.eraRun = payload.run ? ns.EraRules.normalizeSave(payload.run) : null;
      state.eraSaveMessage = `已恢复独立存档 · ${formatSavedAt(payload.savedAt)}`;
      return true;
    } catch (error) {
      console.warn("Failed to load era save.", error);
      storage.removeItem(ERA_SAVE_KEY);
      state.eraEntrySetup = null;
      state.eraRun = null;
      state.eraSaveMessage = "剧情模式旧规则存档已清除；可重新开始。";
      return false;
    }
  }

  function saveEraGame(options) {
    const opts = options || {};
    const storage = getStorage();
    if (!storage || (!state.eraRun && !state.eraEntrySetup)) return false;
    const payload = {
      version: ERA_SAVE_VERSION,
      savedAt: new Date().toISOString(),
      entrySetup: state.eraEntrySetup,
      run: state.eraRun
    };
    try {
      storage.setItem(ERA_SAVE_KEY, JSON.stringify(payload));
      if (!opts.silent) state.eraSaveMessage = "剧情模式进度已自动保存";
      return true;
    } catch (error) {
      console.warn("Failed to save era game.", error);
      state.eraSaveMessage = "剧情模式存档写入失败。";
      return false;
    }
  }

  function removeEraSave() {
    const storage = getStorage();
    if (!storage) return false;
    try {
      storage.removeItem(ERA_SAVE_KEY);
      return true;
    } catch (error) {
      console.warn("Failed to remove era save.", error);
      return false;
    }
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
    if (state.career && !window.confirm(`当前${state.career.gameMode === "legend" ? "传奇模式" : "普通生涯"}的存档会被新小马覆盖，确定继续吗？`)) return;
    const name = document.getElementById("horseNameInput").value || "未命名小马";
    const sireId = document.getElementById("sireSelect").value;
    const damId = document.getElementById("damSelect").value;
    const gameMode = value("gameModeSelect") === "legend" ? "legend" : "normal";
    const trainerId = document.getElementById("trainerSelect").value;
    const mainJockeyId = document.getElementById("mainJockeySelect").value;
    const debugOptions = collectDebugOptions();
    if (debugOptions && !validateDebugOptions(debugOptions)) return;
    let horse;
    try { horse = ns.CareerBloodline.generate({ name, sireId, damId, gameMode }); }
    catch (error) { document.getElementById("pairBrief").textContent = error.message; return; }
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
    state.activeScreen = "career";
    state.setupReturnScreen = "home";
    state.activeView = "action";
    state.activeActionSection = "race";
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
      surfaceGrass: value("debugSurfaceGrass"),
      surfaceDirt: value("debugSurfaceDirt"),
      trackBurst: value("debugTrackBurst"),
      trackSustained: value("debugTrackSustained"),
      trackAttrition: value("debugTrackAttrition")
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
      if (state.career.gameMode === "roguelike") settleRogueCareer(true);
    }
    state.activeView = "action";
    state.activeActionSection = "race";
    state.resultOpen = true;
    resultReturnFocus = document.activeElement;
    refresh();
    saveGame();
  }

  function selectedRacePlan() {
    if (!state.career || state.career.retired || !state.raceSelection.selected) return;
    return ns.TimeRules.getAvailableRacePlans(state.career, ns.Races || [])
      .find(plan => ns.RaceSelection.key(plan) === state.raceSelection.selected && ns.RaceSelection.matches(plan, state.filters, state.career));
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
    payload.race = { ...payload.race, venueDisplay: ns.RaceSelection.venue(payload.race) };
    state.raceSelection = {};
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
    const isRogue = state.career.gameMode === "roguelike";
    const validRogue = !isRogue || ns.RoguelikeRules.isValidCareer(state.career, false);
    const warning = isRogue && !validRogue
      ? `当前生涯未满足至少3战且推进至3岁夏的有效条件，主动放弃不会获得任何荣誉币或成就记录。\n\n仍要让${horseName}退役吗？`
      : `确定让${horseName}退役吗？退役后会结束当前生涯并揭示隐藏能力。`;
    if (!window.confirm(warning)) return;
    state.retiredSummary = ns.CareerRules.retire(state.career);
    if (isRogue) settleRogueCareer(false);
    state.activeView = "action";
    state.activeActionSection = isRogue ? "race" : "history";
    refresh();
    if (isRogue) {
      const settlementPanel = document.getElementById("rogueSettlementPanel");
      if (settlementPanel) {
        settlementPanel.setAttribute("tabindex", "-1");
        settlementPanel.focus({ preventScroll: true });
        settlementPanel.scrollIntoView({ block: "start", behavior: "smooth" });
      }
    } else {
      setWorkspaceView("action", { section: "history", focus: true, scroll: true });
    }
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

  function refreshRaceSelection() {
    const focused = document.activeElement;
    const marker = focused?.id ? '#' + CSS.escape(focused.id) : focused?.matches('[data-race-filter]')
      ? `[data-race-filter="${focused.dataset.raceFilter}"][value="${CSS.escape(focused.value)}"]` : focused?.dataset.racePick
      ? `[data-race-pick="${CSS.escape(focused.dataset.racePick)}"]` : focused?.dataset.filterRemove ? `[data-filter-remove="${CSS.escape(focused.dataset.filterRemove)}"][data-value="${CSS.escape(focused.dataset.value||'')}"]` : null;
    const x = window.scrollX, y = window.scrollY;
    refresh();
    if (marker) (document.querySelector(marker) || document.querySelector('.rs-common-filters summary'))?.focus({ preventScroll: true });
    window.scrollTo(x,y);
  }

  function setRaceFilterValue(group, value, checked) {
    state.filters = normalizeFilters(state.filters);
    if (!Array.isArray(state.filters[group]) || group === 'track' && !state.filters.region.length) return;
    const values = state.filters[group];
    state.filters[group] = checked ? [...new Set([...values,value])] : values.filter(item=>item!==value);
    state.raceSelection.notice = '';
    state.activeFilterGroup = group;
    refreshRaceSelection(); saveGame();
  }

  function setRaceFilterToggle(key, checked) {
    state.filters = normalizeFilters(state.filters); state.filters[key] = !!checked;
    state.raceSelection.notice = ''; refreshRaceSelection(); saveGame();
  }

  function clearRaceFilterGroup(group) {
    state.filters = normalizeFilters(state.filters); state.filters[group] = [];
    state.activeFilterGroup = group; state.raceSelection.notice = '';
    refreshRaceSelection(); saveGame();
  }

  function clearAllRaceFilters() {
    state.filters = defaultFilters(); state.activeFilterGroup = ''; state.raceSelection.trackSearch = ''; state.raceSelection.notice = '';
    refreshRaceSelection(); saveGame();
  }

  function continueEra() {
    if (!state.eraRun) return;
    state.eraShowHub = false;
    state.eraScheduleOpen = false;
    state.eraNewspaperOpen = false;
    state.eraTransientScene = null;
    refresh();
    resetEraScroll();
  }

  function createEraCandidates() {
    const referenceInput = document.getElementById("eraPlayerReferenceInput");
    const playerReference = referenceInput ? referenceInput.value : "马主";
    try {
      state.eraEntrySetup = ns.EraRules.createEntrySetup({ playerReference });
      state.eraRun = null;
      state.eraShowHub = true;
      state.eraSaveMessage = "候选已经生成并保存";
      saveEraGame();
      refresh();
      resetEraScroll();
    } catch (error) {
      console.warn("Failed to create era candidates.", error);
      window.alert(error && error.message ? error.message : "剧情模式候选暂时无法生成。" );
    }
  }

  function selectEraCandidate(candidateId) {
    if (!state.eraEntrySetup || !candidateId) return;
    try {
      state.eraRun = ns.EraRules.selectEntryCandidate(state.eraEntrySetup, candidateId);
      state.eraShowHub = false;
      state.eraScheduleOpen = false;
      state.eraNewspaperOpen = false;
      state.eraTransientScene = null;
      state.eraSaveMessage = "候选已确定，相遇进度会自动保存";
      saveEraGame();
      refresh();
      resetEraScroll();
    } catch (error) {
      console.warn("Failed to select era candidate.", error);
      window.alert(error && error.message ? error.message : "当前路线候选无法选择。" );
    }
  }

  function restartEra() {
    if ((state.eraRun || state.eraEntrySetup) && !window.confirm("确定重新开始剧情模式吗？当前候选与1997—1998世界线会被清除，其他模式存档不受影响。")) return;
    state.eraEntrySetup = null;
    state.eraRun = null;
    state.eraShowHub = true;
    state.eraScheduleOpen = false;
    state.eraNewspaperOpen = false;
    state.eraTransientScene = null;
    state.eraSaveMessage = "旧剧情模式存档已清除，可以创建新的世界线。";
    removeEraSave();
    refresh();
    resetEraScroll();
  }

  function resolveEraChoice(sceneId, choiceId, closeSchedule) {
    if (!state.eraRun || !sceneId || !choiceId) return;
    try {
      const result = ns.EraRules.resolveSceneChoice(state.eraRun, sceneId, choiceId);
      if (result && result.type === "open-schedule") {
        state.eraScheduleOpen = true;
        state.eraNewspaperOpen = false;
        refresh();
        return;
      }
      if (result && result.type === "ignored") return;
      state.eraTransientScene = null;
      if (closeSchedule) state.eraScheduleOpen = false;
      saveEraGame();
      refresh();
    } catch (error) {
      console.warn("Failed to resolve era scene choice.", error);
      window.alert(error && error.message ? error.message : "当前剧情选项无法执行。" );
    }
  }

  function previewEraEncounter(sceneId, choiceId) {
    if (!state.eraRun || !sceneId || !choiceId) return;
    const preview = ns.EraRules.previewSceneChoice(state.eraRun, sceneId, choiceId);
    if (!preview || preview.type !== "transient-preview") return;
    state.eraTransientScene = preview;
    refresh();
  }

  function completeEraTransient(sceneId) {
    if (!state.eraRun || !sceneId) return;
    const result = ns.EraRules.completeTransientScene(state.eraRun, sceneId);
    if (!result || result.type === "ignored") return;
    state.eraTransientScene = null;
    saveEraGame();
    refresh();
  }

  function nameEraHorse() {
    if (!state.eraRun) return;
    const input = document.getElementById("eraEncounterHorseName");
    try {
      const result = ns.EraRules.completeEncounterNaming(state.eraRun, input ? input.value : "");
      if (!result || result.type === "ignored") return;
      state.eraTransientScene = null;
      state.eraSaveMessage = `${result.horseName}已正式命名`;
      saveEraGame();
      refresh();
    } catch (error) {
      window.alert(error && error.message ? error.message : "这个名字暂时无法使用。" );
    }
  }

  function readEraNews(newsId) {
    if (!state.eraRun || !newsId || !ns.EraRules.readNews(state.eraRun, newsId)) return;
    saveEraGame();
    refresh();
  }

  function cancelEraRace() {
    if (!state.eraRun || !state.eraRun.career.scheduledRace) return;
    const result = ns.EraRules.cancelScheduledRace(state.eraRun);
    if (!result || result.type === "ignored") return;
    saveEraGame();
    refresh();
  }

  function retireEra() {
    if (!state.eraRun || state.eraRun.era.endingId) return;
    if (!window.confirm(`确定让${state.eraRun.career.horse.name}提前退役并结束当前剧情赛季吗？`)) return;
    ns.EraRules.retire(state.eraRun);
    ns.EraRules.syncNarrative(state.eraRun);
    state.eraScheduleOpen = false;
    state.eraNewspaperOpen = false;
    saveEraGame();
    refresh();
  }

  function bindEraEvents() {
    const container = document.getElementById("eraOverlay");
    if (!container) return;
    container.addEventListener("click", (event) => {
      const target = event.target.closest("button, [data-era-schedule-close], [data-era-newspaper-close]");
      if (!target || !container.contains(target)) return;
      if (target.hasAttribute("data-era-home")) showHome();
      else if (target.hasAttribute("data-era-hub")) {
        state.eraShowHub = true;
        state.eraScheduleOpen = false;
        state.eraNewspaperOpen = false;
        state.eraTransientScene = null;
        refresh();
        resetEraScroll();
      } else if (target.hasAttribute("data-era-continue")) continueEra();
      else if (target.hasAttribute("data-era-create-candidates")) createEraCandidates();
      else if (target.dataset.eraSelectCandidate) selectEraCandidate(target.dataset.eraSelectCandidate);
      else if (target.hasAttribute("data-era-restart")) restartEra();
      else if (target.hasAttribute("data-era-cancel-race")) cancelEraRace();
      else if (target.hasAttribute("data-era-retire")) retireEra();
      else if (target.hasAttribute("data-era-schedule-open")) {
        state.eraScheduleOpen = true;
        state.eraNewspaperOpen = false;
        refresh();
      } else if (target.hasAttribute("data-era-schedule-close")) {
        state.eraScheduleOpen = false;
        refresh();
      } else if (target.hasAttribute("data-era-newspaper-open")) {
        state.eraNewspaperOpen = true;
        state.eraScheduleOpen = false;
        refresh();
      } else if (target.hasAttribute("data-era-newspaper-close")) {
        state.eraNewspaperOpen = false;
        refresh();
      } else if (target.dataset.eraNewsRead) {
        readEraNews(target.dataset.eraNewsRead);
      } else if (target.dataset.eraTransientChoice) {
        previewEraEncounter(target.dataset.eraSceneId, target.dataset.eraTransientChoice);
      } else if (target.dataset.eraTransientComplete) {
        completeEraTransient(target.dataset.eraTransientComplete);
      } else if (target.hasAttribute("data-era-name-horse")) {
        nameEraHorse();
      } else if (target.dataset.eraChoice) {
        resolveEraChoice(target.dataset.eraSceneId, target.dataset.eraChoice, false);
      } else if (target.dataset.eraDrawerRegister) {
        resolveEraChoice(target.dataset.eraSceneId, `schedule:${target.dataset.eraDrawerRegister}`, true);
      }
    });
  }

  function bindDynamicEvents() {
    const registerRaceBtn = document.getElementById("registerRaceBtn");
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
    const transferStableBtn = document.getElementById("transferStableBtn");
    const clearAllRaceFiltersBtn = document.getElementById("clearAllRaceFiltersBtn");
    if (registerRaceBtn) registerRaceBtn.addEventListener("click", registerRace);
    document.querySelectorAll('[data-race-pick]').forEach(button => button.addEventListener('click', () => {
      state.raceSelection.selected = button.dataset.racePick; state.raceSelection.revealSelection = true; state.raceSelection.notice = '';
      state.raceSelection.moreOpen = false; state.activeFilterGroup = '';
      refreshRaceSelection();
    }));
    document.querySelectorAll('[data-race-month]').forEach(details => details.addEventListener('toggle', () => {
      if (details.isConnected) (state.raceSelection.months ||= {})[details.dataset.raceMonth] = details.open;
    }));
    document.querySelectorAll('[data-race-months]').forEach(button => button.addEventListener('click', () => {
      document.querySelectorAll('[data-race-month]').forEach(details => { details.open = button.dataset.raceMonths === 'expand'; (state.raceSelection.months ||= {})[details.dataset.raceMonth] = details.open; });
    }));
    document.querySelectorAll('[data-filter-remove]').forEach(button=>button.addEventListener('click',()=> {
      if(button.dataset.filterRemove==='avoidFatigueRisk')setRaceFilterToggle('avoidFatigueRisk',false);
      else setRaceFilterValue(button.dataset.filterRemove,button.dataset.value,false);
    }));
    const more = document.getElementById('raceMoreFilters');
    more?.addEventListener('toggle',()=>{if(more.isConnected)state.raceSelection.moreOpen=more.open;});
    const trackSearch = document.getElementById('raceTrackSearch');
    const searchTracks = () => {
      const query = (state.raceSelection.trackSearch || '').trim().toLowerCase();
      const options = [...document.querySelectorAll('[data-track-option]')];
      options.forEach(el=>{el.hidden=!el.dataset.search.includes(query);});
      document.querySelectorAll('[data-track-country]').forEach(el=>{el.hidden=!options.some(o=>!o.hidden&&o.dataset.country===el.dataset.trackCountry);});
      const empty = document.querySelector('.rs-track-empty'); if(empty)empty.hidden=options.some(el=>!el.hidden);
    };
    trackSearch?.addEventListener('input',()=>{state.raceSelection.trackSearch=trackSearch.value;searchTracks();});
    searchTracks();
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
        if (!panel.isConnected) return;
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
    const homeContinueBtn = document.getElementById("homeContinueBtn");
    const homeStartBtn = document.getElementById("homeStartBtn");
    const homeLegendBtn = document.getElementById("homeLegendBtn");
    const homeLegendContinueBtn = document.getElementById("homeLegendContinueBtn");
    const homeRogueBtn = document.getElementById("homeRogueBtn");
    const homeRogueContinueBtn = document.getElementById("homeRogueContinueBtn");
    const homeEraBtn = document.getElementById("homeEraBtn");
    const homeHelpBtn = document.getElementById("homeHelpBtn");
    const homeChangelogBtn = document.getElementById("homeChangelogBtn");
    const copyFeedbackGroupBtn = document.getElementById("copyFeedbackGroupBtn");
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
        const target = event.target.closest("[data-return-home], [data-workspace-view], [data-workspace-section], [data-workspace-jump]");
        if (!target || !shell.contains(target)) return;
        if (target.hasAttribute("data-return-home")) {
          showHome();
        } else if (target.dataset.workspaceSection) {
          setWorkspaceView("action", { section: target.dataset.workspaceSection, focus: true, scroll: true });
        } else {
          setWorkspaceView(target.dataset.workspaceView || target.dataset.workspaceJump, { focus: true, scroll: true });
        }
      });
    }
    window.addEventListener("scroll", scheduleActionSectionSync, { passive: true });
    if (primary) primary.addEventListener("scroll", scheduleActionSectionSync, { passive: true });
    if (homeContinueBtn) homeContinueBtn.addEventListener("click", showStandardCareer);
    if (homeStartBtn) homeStartBtn.addEventListener("click", () => openStandardSetup(false));
    if (homeLegendBtn) {
      homeLegendBtn.addEventListener("click", () => openStandardSetup(true));
    }
    if (homeLegendContinueBtn) homeLegendContinueBtn.addEventListener("click", showStandardCareer);
    if (homeRogueBtn) homeRogueBtn.addEventListener("click", openRogue);
    if (homeRogueContinueBtn) homeRogueContinueBtn.addEventListener("click", continueRogue);
    if (homeEraBtn) homeEraBtn.addEventListener("click", openEra);
    if (homeHelpBtn) homeHelpBtn.addEventListener("click", () => openHelp(homeHelpBtn));
    if (homeChangelogBtn) {
      homeChangelogBtn.addEventListener("click", () => {
        const toggle = document.getElementById("changelogToggleBtn");
        if (toggle) toggle.click();
      });
    }
    if (copyFeedbackGroupBtn) {
      copyFeedbackGroupBtn.addEventListener("click", () => copyFeedbackGroupNumber(copyFeedbackGroupBtn));
    }
    if (setupCloseBtn) setupCloseBtn.addEventListener("click", closeSetup);
    if (newCareerBtn) newCareerBtn.addEventListener("click", () => {
      if (state.career && state.career.gameMode === "roguelike") {
        if (state.career.retired) nextRogueRun();
        else window.alert("肉鸽生涯必须先退役或强制退役结算，不能直接覆盖当前赛马。");
        return;
      }
      openSetup("career");
    });
    if (workspaceHelpBtn) workspaceHelpBtn.addEventListener("click", () => openHelp(workspaceHelpBtn));
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
        if (state.activeScreen === "setup") {
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
      gameModeSelect.dispatchEvent(new Event("change"));
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
        if (shouldShow) openHelp(helpToggleBtn);
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

  function renderAppMeta() {
    const meta = ns.Changelog && ns.Changelog.meta;
    if (!meta) return;
    const version = document.getElementById("appVersion");
    const updatedAt = document.getElementById("appUpdatedAt");
    const toggle = document.getElementById("changelogToggleBtn");
    if (version) version.textContent = meta.version;
    if (updatedAt) updatedAt.textContent = `更新于 ${meta.displayUpdatedAt}`;
    if (toggle) toggle.setAttribute("aria-label", `查看 ${meta.version} 更新日志`);
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
      if (document.visibilityState === "hidden") saveEraGame({ silent: true });
    });
    window.addEventListener("pagehide", () => {
      saveGame({ silent: true });
      saveEraGame({ silent: true });
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
    const eraWarnings = []
      .concat(ns.EraTextIndex ? ns.EraTextIndex.validate() : [])
      .concat(ns.EraScenarioRegistry ? ns.EraScenarioRegistry.validate() : []);
    if (eraWarnings.length) console.warn("Era scenario data warnings:", eraWarnings);
    bindHistoricalDataLoadNotice();
    loadSavedGame();
    loadRogueGame();
    loadEraGame();
    loadHorseNameLanguage();
    loadRaceNameMode();
    const root = document.getElementById("app");
    renderAppMeta();
    ns.UI.renderChangelog(document.getElementById("changelogContent"));
    bindChangelogEvents();
    ns.UI.renderSetup(root);
    ns.CareerBloodlineUI.bindSetup();
    document.getElementById("generateBtn").addEventListener("click", generate);
    bindSetupEvents();
    bindWorkspaceEvents();
    bindEraEvents();
    bindSaveLifecycleEvents();
    refresh();
    if (ns.ChairmanApp) ns.ChairmanApp.mount();
  }

  document.addEventListener("DOMContentLoaded", () => {
    init().catch((error) => {
      console.error(error);
    });
  });
})();
