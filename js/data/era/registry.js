(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const scenarios = [];

  function register(scenario) {
    if (!scenario || !scenario.id) throw new Error("Era scenario requires a stable id.");
    if (scenarios.some((item) => item.id === scenario.id)) {
      throw new Error(`Duplicate era scenario id: ${scenario.id}`);
    }
    scenarios.push(scenario);
    return scenario;
  }

  function find(scenarioId) {
    return scenarios.find((scenario) => scenario.id === scenarioId) || null;
  }

  function list() {
    return scenarios.slice();
  }

  function listEntries() {
    return scenarios
      .filter((scenario) => scenario.entryCandidate)
      .map((scenario) => ({ ...scenario.entryCandidate, scenarioId: scenario.id, routeId: scenario.routeId }));
  }

  function collectTextIds(value, ids) {
    if (!value) return;
    if (typeof value === "string") {
      if (value.includes(".")) ids.push(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => collectTextIds(item, ids));
      return;
    }
    if (typeof value === "object") {
      Object.values(value).forEach((item) => collectTextIds(item, ids));
    }
  }

  function validate() {
    const warnings = [];
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    const reportForms = ["unproven", "winner", "contender", "mixed", "outsider", "health-question"];
    const sceneTypes = new Set(["dialogue", "news", "dynamic-report", "time", "race-decision", "race-result", "ending"]);
    const raceIds = new Set((ns.Races || []).map((race) => race.id));
    const globalHorseIds = new Set((ns.HistoricalHorses || []).map((horse) => horse.id));
    const jockeyIds = new Set((ns.Jockeys || []).map((jockey) => jockey.id));
    const scenarioIds = new Set();
    const entryIds = new Set();

    scenarios.forEach((scenario) => {
      if (scenarioIds.has(scenario.id)) warnings.push({ type: "duplicate-scenario", scenarioId: scenario.id });
      scenarioIds.add(scenario.id);
      const eraHorseIds = new Set(Object.keys(scenario.eraHorses || {}));
      const occurrenceIds = new Set();
      const characterIds = new Set(Object.keys(scenario.characters || {}));
      const sceneIds = new Set();
      const calendarWindowIds = new Set();
      if (!scenario.playerTemplate || scenario.playerTemplate.commentAccuracy !== "close") {
        warnings.push({ type: "invalid-era-comment-accuracy", scenarioId: scenario.id });
      }
      if (!scenario.playableStart || !scenario.playableEnd
        || !datePattern.test(scenario.playableStart.date || "")
        || !datePattern.test(scenario.playableEnd.date || "")) {
        warnings.push({ type: "invalid-playable-range", scenarioId: scenario.id });
      }
      if (!scenario.textNamespace || !Number.isFinite(scenario.historicalStartYear)
        || !Number.isFinite(scenario.historicalEndYear)) {
        warnings.push({ type: "invalid-scenario-metadata", scenarioId: scenario.id });
      }
      const entry = scenario.entryCandidate;
      if (!entry || !entry.id) warnings.push({ type: "missing-entry-candidate", scenarioId: scenario.id });
      else {
        if (entryIds.has(entry.id)) warnings.push({ type: "duplicate-entry-candidate", scenarioId: scenario.id, entryId: entry.id });
        entryIds.add(entry.id);
        const previewText = ns.EraTextIndex && ns.EraTextIndex.get(entry.previewTextId);
        if (!previewText) warnings.push({ type: "unknown-entry-preview", scenarioId: scenario.id, entryId: entry.id, textId: entry.previewTextId });
      }

      (scenario.occurrences || []).forEach((occurrence) => {
        if (occurrenceIds.has(occurrence.id)) {
          warnings.push({ type: "duplicate-occurrence", scenarioId: scenario.id, occurrenceId: occurrence.id });
        }
        occurrenceIds.add(occurrence.id);
        const hasSnapshot = occurrence.raceSnapshot
          && occurrence.raceSnapshot.id
          && occurrence.raceSnapshot.nameZh
          && occurrence.raceSnapshot.course
          && Number.isFinite(occurrence.raceSnapshot.distance);
        if (!raceIds.has(occurrence.raceId) && !hasSnapshot) {
          warnings.push({ type: "unknown-race", scenarioId: scenario.id, occurrenceId: occurrence.id, raceId: occurrence.raceId });
        }
        if (!datePattern.test(occurrence.date || "")) {
          warnings.push({ type: "invalid-date", scenarioId: scenario.id, occurrenceId: occurrence.id, date: occurrence.date });
        } else {
          const year = Number(String(occurrence.date).slice(0, 4));
          if (year < scenario.historicalStartYear || year > scenario.historicalEndYear) {
            warnings.push({ type: "date-outside-scenario", scenarioId: scenario.id, occurrenceId: occurrence.id, date: occurrence.date });
          }
        }
        const opponents = occurrence.opponents || [];
        const fixedField = occurrence.fieldPolicy === "historical-fixed";
        if (fixedField && opponents.length !== 5) {
          warnings.push({ type: "invalid-fixed-field-size", scenarioId: scenario.id, occurrenceId: occurrence.id, count: opponents.length });
        }
        if (!["historical-fixed", "generated"].includes(occurrence.fieldPolicy || "")) {
          warnings.push({ type: "invalid-field-policy", scenarioId: scenario.id, occurrenceId: occurrence.id, fieldPolicy: occurrence.fieldPolicy });
        }
        if (new Set(opponents.map((entry) => entry.horseId)).size !== opponents.length) {
          warnings.push({ type: "duplicate-opponent", scenarioId: scenario.id, occurrenceId: occurrence.id });
        }
        opponents.forEach((entry) => {
          if (!globalHorseIds.has(entry.horseId) && !eraHorseIds.has(entry.horseId)) {
            warnings.push({ type: "unknown-horse", scenarioId: scenario.id, occurrenceId: occurrence.id, horseId: entry.horseId });
          }
          if (entry.jockeyId && !jockeyIds.has(entry.jockeyId)) {
            warnings.push({ type: "unknown-jockey", scenarioId: scenario.id, occurrenceId: occurrence.id, jockeyId: entry.jockeyId });
          }
          if (!Number.isFinite(entry.ability) || !Number.isFinite(entry.historicalFinish)) {
            warnings.push({ type: "invalid-participation", scenarioId: scenario.id, occurrenceId: occurrence.id, horseId: entry.horseId });
          }
          if (fixedField && (!Number.isFinite(entry.historicalScore) || entry.historicalScore <= 0)) {
            warnings.push({ type: "invalid-historical-score", scenarioId: scenario.id, occurrenceId: occurrence.id, horseId: entry.horseId });
          }
        });

        const textIds = [];
        collectTextIds(occurrence.text, textIds);
        if (occurrence.choiceTextId) textIds.push(occurrence.choiceTextId);
        textIds.forEach((textId) => {
          const textEntry = ns.EraTextIndex && ns.EraTextIndex.get(textId);
          if (!textEntry) warnings.push({ type: "unknown-text", scenarioId: scenario.id, occurrenceId: occurrence.id, textId });
          else if (textEntry.status === "placeholder") {
            warnings.push({ type: "triggerable-placeholder", scenarioId: scenario.id, occurrenceId: occurrence.id, textId });
          }
        });

        if (occurrence.reportKey) {
          const definition = scenario.reportDefinitions && scenario.reportDefinitions[occurrence.reportKey];
          reportForms.forEach((form) => {
            const textId = definition && definition[form];
            const textEntry = ns.EraTextIndex && ns.EraTextIndex.get(textId);
            if (!textEntry) warnings.push({ type: "unknown-report-text", scenarioId: scenario.id, occurrenceId: occurrence.id, textId });
            else if (textEntry.status !== "outline" || textEntry.presentation !== "outline") {
              warnings.push({ type: "invalid-report-outline", scenarioId: scenario.id, occurrenceId: occurrence.id, textId });
            }
          });
        }
      });

      (scenario.twoYearCalendarWindows || []).forEach((window) => {
        if (!window || !window.id || calendarWindowIds.has(window.id)) {
          warnings.push({ type: "duplicate-calendar-window", scenarioId: scenario.id, windowId: window && window.id || "" });
          return;
        }
        calendarWindowIds.add(window.id);
        if (!datePattern.test(window.decisionDate || "")) {
          warnings.push({ type: "invalid-calendar-window-date", scenarioId: scenario.id, windowId: window.id, date: window.decisionDate });
        }
        if (!Array.isArray(window.occurrenceIds) || !window.occurrenceIds.length) {
          warnings.push({ type: "empty-calendar-window", scenarioId: scenario.id, windowId: window.id });
        }
        (window.occurrenceIds || []).forEach((occurrenceId) => {
          const occurrence = (scenario.occurrences || []).find((item) => item.id === occurrenceId);
          if (!occurrence) warnings.push({ type: "unknown-calendar-occurrence", scenarioId: scenario.id, windowId: window.id, occurrenceId });
          else if (!occurrence.freeRace || occurrence.calendarWindowId !== window.id) {
            warnings.push({ type: "invalid-free-calendar-link", scenarioId: scenario.id, windowId: window.id, occurrenceId });
          }
        });
      });
      (scenario.occurrences || []).filter((occurrence) => occurrence.freeRace).forEach((occurrence) => {
        if (!calendarWindowIds.has(occurrence.calendarWindowId)) {
          warnings.push({ type: "unknown-occurrence-calendar-window", scenarioId: scenario.id, occurrenceId: occurrence.id, windowId: occurrence.calendarWindowId || "" });
        }
      });

      const opinion = scenario.twoYearOpinion;
      if (!opinion || !datePattern.test(opinion.date || "") || !datePattern.test(opinion.cutoffDate || "")) {
        warnings.push({ type: "invalid-two-year-opinion", scenarioId: scenario.id });
      } else {
        const profileIds = ["two_year_star", "two_year_injury", "two_year_consistent", "late_debut", "two_year_struggling", "two_year_unproven", "legacy_unrecorded"];
        profileIds.forEach((profileId) => {
          const textId = opinion.textByProfile && opinion.textByProfile[profileId];
          const textEntry = ns.EraTextIndex && ns.EraTextIndex.get(textId);
          if (!textEntry) warnings.push({ type: "unknown-opinion-text", scenarioId: scenario.id, profileId, textId });
          else if (textEntry.status !== "outline" || textEntry.presentation !== "outline") {
            warnings.push({ type: "invalid-opinion-outline", scenarioId: scenario.id, profileId, textId });
          }
        });
      }

      (scenario.sceneNodes || []).forEach((scene) => {
        if (sceneIds.has(scene.id)) warnings.push({ type: "duplicate-scene", scenarioId: scenario.id, sceneId: scene.id });
        sceneIds.add(scene.id);
        if (!sceneTypes.has(scene.type)) {
          warnings.push({ type: "invalid-scene-type", scenarioId: scenario.id, sceneId: scene.id, sceneType: scene.type });
        }
        if (!datePattern.test(scene.date || "")) {
          warnings.push({ type: "invalid-scene-date", scenarioId: scenario.id, sceneId: scene.id, date: scene.date });
        }
        if (scene.speakerId && !characterIds.has(scene.speakerId)) {
          warnings.push({ type: "unknown-scene-character", scenarioId: scenario.id, sceneId: scene.id, characterId: scene.speakerId });
        }
        const sceneTextIds = [];
        collectTextIds(scene.textSlots || { base: scene.textId }, sceneTextIds);
        sceneTextIds.forEach((textId) => {
          const textEntry = ns.EraTextIndex && ns.EraTextIndex.get(textId);
          if (!textEntry) warnings.push({ type: "unknown-scene-text", scenarioId: scenario.id, sceneId: scene.id, textId });
          else if (textEntry.status === "placeholder") warnings.push({ type: "triggerable-placeholder", scenarioId: scenario.id, sceneId: scene.id, textId });
        });
        (scene.allowedOccurrenceIds || []).forEach((occurrenceId) => {
          if (!(scenario.occurrences || []).some((item) => item.id === occurrenceId)) {
            warnings.push({ type: "unknown-scene-occurrence", scenarioId: scenario.id, sceneId: scene.id, occurrenceId });
          }
        });
        if (scene.calendarWindowId && !calendarWindowIds.has(scene.calendarWindowId)) {
          warnings.push({ type: "unknown-scene-calendar-window", scenarioId: scenario.id, sceneId: scene.id, windowId: scene.calendarWindowId });
        }
        (scene.sceneChoices || []).forEach((choice) => {
          if (!choice.id || (!choice.label && !choice.labelTextId) || !choice.action) {
            warnings.push({ type: "invalid-scene-choice", scenarioId: scenario.id, sceneId: scene.id, choiceId: choice.id || "" });
          }
          if (choice.labelTextId && !(ns.EraTextIndex && ns.EraTextIndex.get(choice.labelTextId))) {
            warnings.push({ type: "unknown-choice-text", scenarioId: scenario.id, sceneId: scene.id, choiceId: choice.id, textId: choice.labelTextId });
          }
        });
      });
      (scenario.encounterNodes || []).forEach((scene) => {
        if (sceneIds.has(scene.id)) warnings.push({ type: "duplicate-scene", scenarioId: scenario.id, sceneId: scene.id });
        sceneIds.add(scene.id);
        if (!sceneTypes.has(scene.type)) warnings.push({ type: "invalid-scene-type", scenarioId: scenario.id, sceneId: scene.id, sceneType: scene.type });
        if (scene.speakerId && !characterIds.has(scene.speakerId)) {
          warnings.push({ type: "unknown-scene-character", scenarioId: scenario.id, sceneId: scene.id, characterId: scene.speakerId });
        }
        [scene.textId].concat((scene.transientChoices || []).map((choice) => choice.responseTextId)).forEach((textId) => {
          const textEntry = ns.EraTextIndex && ns.EraTextIndex.get(textId);
          if (!textEntry) warnings.push({ type: "unknown-scene-text", scenarioId: scenario.id, sceneId: scene.id, textId });
          else if (textEntry.status === "placeholder") warnings.push({ type: "triggerable-placeholder", scenarioId: scenario.id, sceneId: scene.id, textId });
        });
      });

      const narrativeTextIds = [];
      collectTextIds(scenario.narrativeTextSlots, narrativeTextIds);
      narrativeTextIds.forEach((textId) => {
        const textEntry = ns.EraTextIndex && ns.EraTextIndex.get(textId);
        if (!textEntry) warnings.push({ type: "unknown-narrative-slot-text", scenarioId: scenario.id, textId });
        else if (textEntry.status === "placeholder") warnings.push({ type: "triggerable-placeholder", scenarioId: scenario.id, textId });
      });
    });
    return warnings;
  }

  ns.EraScenarioRegistry = { register, find, list, listEntries, validate };
})();
