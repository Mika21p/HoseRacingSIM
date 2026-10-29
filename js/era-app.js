(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const ERA_SAVE_KEY = "keiba-era-save-v1";
  const ERA_SAVE_VERSION = 3;

  function create(options) {
    const { state, document, getStorage, refresh, showHome, alert, confirm } = options;
    function loadEraGame() {
      const storage = getStorage();
      if (!storage || !ns.EraSave) return false;
      const result = ns.EraSave.read(storage);
      state.eraEntrySetup = result.entrySetup || null;
      state.eraRun = result.run || null;
      state.eraSaveBlocked = result.blocked;
      state.eraSaveMessage = result.message;
      return !!(result.run || result.entrySetup);
    }

    function saveEraGame(options) {
      const opts = options || {};
      const storage = getStorage();
      if (!storage || state.eraSaveBlocked || (!state.eraRun && !state.eraEntrySetup)) return false;
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

    function resetEraScroll() {
      const overlay = document.getElementById("eraOverlay");
      if (overlay) overlay.scrollTop = 0;
    }

    function continueEra() {
      if (!state.eraRun) return;
      state.eraShowHub = false;
      state.eraActivePanel = "scene";
      state.eraBrowseState = {};
      state.eraScheduleOpen = false;
      state.eraNewspaperOpen = false;
      state.eraTransientScene = null;
      refresh();
      resetEraScroll();
    }

    function createEraCandidates() {
      if (state.eraSaveBlocked) { alert("原始剧情存档尚未备份，禁止覆盖。"); return; }
      const referenceInput = document.getElementById("eraPlayerReferenceInput");
      const playerReference = referenceInput ? referenceInput.value : "马主";
      try {
        state.eraEntrySetup = ns.EraRules.createEntrySetup({ playerReference, seed: document.getElementById("eraSeedInput")?.value });
        state.eraRun = null;
        state.eraActivePanel = "scene";
        state.eraBrowseState = {};
        state.eraShowHub = true;
        state.eraSaveMessage = "候选已经生成并保存";
        saveEraGame();
        refresh();
        resetEraScroll();
      } catch (error) {
        console.warn("Failed to create era candidates.", error);
        alert(error && error.message ? error.message : "剧情模式候选暂时无法生成。" );
      }
    }

    function selectEraCandidate(candidateId) {
      if (!state.eraEntrySetup || !candidateId) return;
      try {
        state.eraRun = ns.EraRules.selectEntryCandidate(state.eraEntrySetup, candidateId);
        state.eraShowHub = false;
        state.eraActivePanel = "scene";
        state.eraBrowseState = {};
        state.eraScheduleOpen = false;
        state.eraNewspaperOpen = false;
        state.eraTransientScene = null;
        state.eraSaveMessage = "候选已确定，相遇进度会自动保存";
        saveEraGame();
        refresh();
        resetEraScroll();
      } catch (error) {
        console.warn("Failed to select era candidate.", error);
        alert(error && error.message ? error.message : "当前路线候选无法选择。" );
      }
    }

    function restartEra() {
      if (state.eraSaveBlocked) { alert("请先备份无法读取的剧情存档，当前禁止覆盖。"); return; }
      if ((state.eraRun || state.eraEntrySetup) && !confirm("确定重新开始剧情模式吗？当前候选与1998世界线会被清除，其他模式存档不受影响。")) return;
      state.eraEntrySetup = null;
      state.eraRun = null;
      state.eraActivePanel = "scene";
      state.eraBrowseState = {};
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
        alert(error && error.message ? error.message : "当前剧情选项无法执行。" );
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
        alert(error && error.message ? error.message : "这个名字暂时无法使用。" );
      }
    }

    function readEraNews(newsId) {
      if (!state.eraRun || !newsId || !ns.EraRules.readNews(state.eraRun, newsId)) return;
      saveEraGame();
      refresh();
    }

    function cancelEraRace() {
      if (!state.eraRun || !state.eraRun.scheduledRace) return;
      const result = ns.EraRules.cancelScheduledRace(state.eraRun);
      if (!result || result.type === "ignored") return;
      saveEraGame();
      refresh();
    }

    function retireEra() {
      if (!state.eraRun || state.eraRun.ended) return;
      if (!confirm(`确定让${state.eraRun.career.horse.name}提前退役并结束当前剧情赛季吗？`)) return;
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
      const filterEraRecords = (event) => {
        if (event.target.matches("[data-era-filter]")) ns.EraUI.filterRecords(event.target.closest("[data-era-records]"));
      };
      container.addEventListener("input", filterEraRecords);
      container.addEventListener("change", filterEraRecords);
      container.addEventListener("click", (event) => {
        const target = event.target.closest("button, [data-era-schedule-close], [data-era-newspaper-close]");
        if (!target || !container.contains(target)) return;
        if (target.hasAttribute("data-era-record-link")) {
          state.eraBrowseState = state.eraBrowseState || {};
          const panel = ns.EraUI.navigateRecord(container, state.eraBrowseState, target.dataset.eraRecordLink, state.eraActivePanel);
          if (panel) state.eraActivePanel = panel;
          return;
        }
        if (target.hasAttribute("data-era-source-return")) {
          const panel = ns.EraUI.returnToSource(container, state.eraBrowseState);
          if (panel) state.eraActivePanel = panel;
          return;
        }
        if (target.hasAttribute("data-era-filter-reset")) {
          const records = target.closest("[data-era-records]");
          records.querySelectorAll("[data-era-filter]").forEach((input) => { input.value = input.dataset.default || ""; });
          ns.EraUI.filterRecords(records);
          records.querySelector("[data-era-filter]")?.focus();
          return;
        }
        if (target.dataset.eraPanelSelect) {
          const id = target.dataset.eraPanelSelect;
          if (!["scene", "timeline", "yearbook", "encyclopedia"].includes(id)) return;
          state.eraActivePanel = id;
          container.querySelectorAll("[data-era-panel]").forEach((panel) => { panel.hidden = panel.dataset.eraPanel !== id; });
          container.querySelectorAll("[data-era-panel-select]").forEach((button) => { button.setAttribute("aria-pressed", String(button.dataset.eraPanelSelect === id)); });
          return;
        }
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
        } else if (target.dataset.eraRegister) {
          const result = ns.EraRules.registerRace(state.eraRun, target.dataset.eraRegister);
          if (result.type !== "ignored") { state.eraScheduleOpen = false; saveEraGame(); refresh(); }
        } else if (target.dataset.eraDrawerRegister) {
          resolveEraChoice(target.dataset.eraSceneId, `schedule:${target.dataset.eraDrawerRegister}`, true);
        }
      });
    }


    function render() {
      const eraOverlay = document.getElementById("eraOverlay");
    if (eraOverlay && ns.EraUI) {
      ns.EraUI.render(eraOverlay, state.eraRun, {
        showHub: state.eraShowHub,
        activePanel: state.eraActivePanel,
        browseState: state.eraBrowseState,
        scheduleOpen: state.eraScheduleOpen,
        newspaperOpen: state.eraNewspaperOpen,
        transientScene: state.eraTransientScene,
        entrySetup: state.eraEntrySetup,
        saveMessage: state.eraSaveMessage
      });
    }
    }
    function openHub() {
      state.eraShowHub = true;
      state.eraScheduleOpen = false;
      state.eraNewspaperOpen = false;
      state.eraTransientScene = null;
    }
    return { load: loadEraGame, save: saveEraGame, bind: bindEraEvents, render, openHub, resetScroll: resetEraScroll };
  }
  ns.EraApp = { create };
})();
