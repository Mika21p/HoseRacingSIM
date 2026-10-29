(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const RUN_VERSION = 6, ENTRY_SETUP_VERSION = 2, DEFAULT_SCENARIO_ID = "jp-1998-road";
  const clone = (x) => JSON.parse(JSON.stringify(x));
  function scenarioFor(run) { return ns.EraScenarioRegistry.find(typeof run === "string" ? run : run?.scenarioId || DEFAULT_SCENARIO_ID); }
  function randomAction(run, action) {
    const rng = ns.Random.seeded(run.rngState); let result;
    ns.Random.withSource(rng, () => { result = action(); }); run.rngState = rng.state(); return result;
  }
  function createEntrySetup(options) {
    const seed = (options?.seed === "" || options?.seed == null ? Date.now() : Number(options.seed)) >>> 0;
    const setup = { version: ENTRY_SETUP_VERSION, seed, rngState: seed, playerReference: String(options?.playerReference || "马主").trim().slice(0, 20) || "马主", selectedCandidateId: "", candidates: [] };
    randomAction(setup, () => {
      const template = scenarioFor().playerTemplate, trainer = ns.CommentRules.getTrainer(template.trainerId);
      const horse = { id: `era-${seed}-horse`, name: "尚未命名", source: "era", gameMode: "era", birthYear: 1995, gender: template.gender, strength: ns.Random.rollRange(template.strengthMin, template.strengthMax), coat: ns.Random.pickOne(["鹿毛", "栗毛", "黑鹿毛"]), weight: ns.Random.rollRange(450, 510), temperamentLabel: "普通", temperament: 50, surfacePref: "草地", surfaceGrades: { grass: "A", dirt: "C" }, trackAptitudes: { burst: "○", sustained: "○", attrition: "△" }, heavyType: "普通", coreDist: template.coreDist, distMin: template.distMin, distMax: template.distMax, growthType: template.growthType, peakStart: template.peakStart, peakEnd: template.peakEnd, homeRegionId: "japan", currentRegionId: "japan", trainerId: trainer.id, trainerName: trainer.name, mainJockeyId: template.playerJockey.id, career: [] };
      const accuracyById = Object.fromEntries(["strength", "surface", "track", "distance", "growth", "temperament"].map((id) => [id, "close"]));
      const comments = ns.CommentRules.generateDebutCommentDetails(horse, trainer.id, { accuracyById });
      setup.candidates.push({ id: "1998-road-entry", horse, commentDetails: comments, trainer });
    });
    return setup;
  }
  function normalizeEntrySetup(setup) {
    if (setup?.version !== ENTRY_SETUP_VERSION || setup.candidates?.length !== 1 || !Number.isInteger(setup.rngState)) throw new Error("Unsupported era entry setup");
    return setup;
  }
  function getEntryCandidates(setup) { return normalizeEntrySetup(setup).candidates.map((c) => ({ id: c.id, title: "王道路候选马", coat: c.horse.coat, gender: c.horse.gender, trainerName: c.trainer.name })); }
  function event(run, type, details) {
    const e = { id: `event-${run.events.length + 1}`, sequence: run.events.length + 1, type, date: run.date, ...details };
    run.events.push(e); run.summary = ns.EraNarrative.summarize(run.events, scenarioFor(run)); return e;
  }
  function syncNarrative(run) { ns.EraStorylets.sync(run, scenarioFor(run)); return run.storylets; }
  // 剧情片段的效果写进事件流，标签与名声因此可以在读档后重算，不必单独存字段。
  function recordEffect(run, effect) { return event(run, "storylet-effect", { effect }); }
  function selectEntryCandidate(setup, id) {
    normalizeEntrySetup(setup); if (setup.selectedCandidateId || setup.candidates[0].id !== id) throw new Error("Candidate unavailable");
    const c = clone(setup.candidates[0]), template = scenarioFor().playerTemplate;
    const career = ns.CareerRules.createCareer(c.horse, c.commentDetails.map((x) => x.text), c.commentDetails, null, c.trainer);
    career.gameMode = "era"; career.playerJockey = clone(template.playerJockey);
    const run = { version: RUN_VERSION, scenarioId: DEFAULT_SCENARIO_ID, seed: setup.seed, rngState: setup.rngState, playerReference: setup.playerReference, career, date: "1998-01-01", onboarding: { namingComplete: false }, scheduledRace: null, events: [], settled: [], worldResults: {}, news: [], timeline: [], storylets: { pending: [], resolved: [] }, media: "quiet", endingPending: false, ended: false, summary: {} };
    ns.CareerRules.advanceToTime(career, ns.EraWorld.time(run, run.date));
    event(run, "career-start"); setup.selectedCandidateId = id; return run;
  }
  function createRun(options) {
    const setup = createEntrySetup(options), run = selectEntryCandidate(setup, setup.candidates[0].id);
    completeEncounterNaming(run, options?.horseName || "你的赛马"); return run;
  }
  function completeEncounterNaming(run, value) {
    if (run.onboarding.namingComplete) return { type: "ignored" };
    const name = String(value || "").trim(); if (!name || name.length > 30) throw new Error("请输入1至30字的马名。");
    run.career.horse.name = name; run.onboarding.namingComplete = true; event(run, "horse-named"); syncNarrative(run);
    return { type: "named", horseName: name };
  }
  function getCurrentScene(run) {
    const scenario = scenarioFor(run);
    const textIds = scenario.textIds || {};
    if (!run.onboarding.namingComplete) return { id: "naming", textId: textIds.entry || "jp.era.1998.scene.entry", interactionKind: "naming", tokensSnapshot: ns.EraNews.tokens(run) };
    if (run.storylets.pending.length) return run.storylets.pending[0];
    if (run.ended) return null;
    return { id: `time:${run.date}`, textId: textIds.time || "jp.era.1998.scene.time", tokensSnapshot: ns.EraNews.tokens(run), choices: [{ id: "advance", label: run.scheduledRace ? "推进到下一事件（已报名）" : "推进到下一事件", effects: [] }] };
  }
  function getScheduleOptions(run) {
    return ns.EraWorld.scenarioRaces(run).map((edition) => {
      const p = ns.EraWorld.availability(run, edition.id, scenarioFor(run));
      return { ...p, occurrence: { id: edition.id, nameZh: edition.nameZh || edition.nameOriginal, date: edition.date }, enabled: p.eligible, status: run.settled.includes(edition.id) ? "completed" : run.scheduledRace === edition.id ? "scheduled" : p.eligible ? "available" : "locked", section: run.settled.includes(edition.id) ? "completed" : "future" };
    });
  }
  function registerRace(run, id) {
    if (!ns.EraWorld.availability(run, id, scenarioFor(run)).eligible) return { type: "ignored", reason: "unavailable" };
    run.scheduledRace = id; event(run, "race-entered", { raceId: id }); syncNarrative(run); return { type: "scheduled" };
  }
  function cancelScheduledRace(run) {
    if (!run.scheduledRace) return { type: "ignored" };
    event(run, "race-cancelled", { raceId: run.scheduledRace }); run.scheduledRace = null; run.career.scheduledRace = null; return { type: "cancelled" };
  }
  function finish(run, reason) {
    if (run.ended || run.endingPending) return;
    run.endingPending = true; run.scheduledRace = null; event(run, "season-end", { reason }); syncNarrative(run);
  }
  function historical(run, edition) {
    run.settled.push(edition.id);
    const winner = edition.results[0].horseId;
    const e = event(run, "historical-race", { raceId: edition.id, raceName: edition.nameZh || edition.nameOriginal, grade: edition.grade, winnerId: winner, winnerName: ns.EraAlmanac.horseName(winner) });
    run.worldResults[edition.id] = { kind: "historical", winnerId: winner, results: clone(edition.results) };
    // 史实简讯只覆盖重赏与主要前哨赛（年鉴收录前五的档位），其余赛事只在年鉴里留档。
    if (edition.tier === "top5") ns.EraNews.add(run, "historical", e);
  }
  function completeRace(run, id) {
    if (run.settled.includes(id)) return;
    const edition = ns.EraWorld.raceFor(id);
    // Clear registration for the eligibility query; actual simulation remains atomic inside advance.
    run.scheduledRace = null;
    if (ns.CareerRules.isResting(run.career) || run.career.retired) {
      historical(run, edition);
      const absent = event(run, "race-absent", { raceId: id, reason: "injury", raceName: edition.nameZh || edition.nameOriginal, grade: edition.grade });
      ns.EraNews.add(run, "absent", absent);
      return;
    }
    const payload = ns.EraWorld.buildPayload(run, id, scenarioFor(run));
    payload.opponent = payload.opponents[0];
    if (run.lastRaceDate && ns.EraWorld.day(edition.date) - ns.EraWorld.day(run.lastRaceDate) < 14 && run.career.lastRaceIndex === payload.schedule.index) {
      // Shared fatigue skips a zero-turn gap; in this mode seven-day same-half starts still count as consecutive.
      const originalIndex = run.career.lastRaceIndex;
      run.career.lastRaceIndex = payload.schedule.index - 1;
      try { ns.RaceFatigueRules.lockPreRaceCondition(run.career, payload); } finally { run.career.lastRaceIndex = originalIndex; }
    } else ns.RaceFatigueRules.lockPreRaceCondition(run.career, payload);
    const maturity = ns.MaturityRules.evaluate(run.career.horse, run.career.currentTime, run.career.maturity.decline);
    const result = ns.RaceRules.simulateEraFieldRace(run.career.horse, payload.race, { ...payload, playerJockey: run.career.playerJockey, currentTime: run.career.currentTime, maturity, maturityDecline: run.career.maturity.decline });
    ns.CareerRules.advanceToSchedule(run.career, payload.schedule);
    ns.CareerRules.addRace(run.career, result, payload.schedule);
    run.lastRaceDate = edition.date; run.settled.push(id);
    const rows = result.public.opponents || [];
    const winner = result.public.rank === 1 ? { horseId: "player", displayNameZh: run.career.horse.name } : rows.find((r) => r.rank === 1);
    const winnerRow = winner && winner.horseId !== "player" ? edition.results.find((r) => r.horseId === winner.horseId) : null;
    const winnerJockey = winner?.horseId === "player" ? run.career.playerJockey.name : (winnerRow?.jockey || "");
    const e = event(run, "race-result", {
      raceId: id, raceName: payload.race.nameZh, grade: edition.grade,
      rank: result.public.rank, retired: result.public.retired,
      winnerId: winner?.horseId, winnerName: winner?.displayNameZh || winner?.displayName || "史实优胜马", winnerJockey,
      historicalWinnerId: edition.results[0].horseId,
      namedOpponents: edition.results.map((r) => r.horseId),
      namedOpponentFinishes: Object.fromEntries(edition.results.map((r) => [r.horseId, r.finish]))
    });
    run.worldResults[id] = { kind: "simulated", winnerId: e.winnerId, playerRank: e.rank, retired: e.retired, results: clone(rows), fieldSize: result.hidden.fieldSize, historicalWinnerId: edition.results[0].horseId };
    ns.EraNews.add(run, "result", e);
    ns.EraNews.syncFeatures(run, e);
    if (result.hidden.injury) event(run, "injury-start", { raceId: id, severity: result.hidden.injury.severity });
    if (run.career.forcedRetirement) { ns.CareerRules.retire(run.career, "因伤退役"); finish(run, "injury"); }
  }
  function advanceNarrative(run) {
    if (run.ended || run.endingPending || !run.onboarding.namingComplete || run.storylets.pending.length) return { type: "ignored" };
    // Mutate a draft, then commit only a completed action, including its RNG state.
    const draft = clone(run);
    randomAction(draft, () => {
      const scenario = scenarioFor(draft);
      const all = ns.EraWorld.scenarioRaces(draft);
      const dates = all.filter((e) => !draft.settled.includes(e.id) && e.date >= draft.date).map((e) => e.date);
      const resting = ns.CareerRules.getRestStatus(draft.career);
      let recoveryDate;
      if (resting) {
        const t = ns.TimeRules.fromIndex(resting.restUntilIndex);
        recoveryDate = `${draft.career.horse.birthYear + t.age}-${String(t.month).padStart(2, "0")}-${t.half === 2 ? "16" : "01"}`;
        if (recoveryDate > draft.date && recoveryDate <= scenario.endDate) dates.push(recoveryDate);
      }
      const next = dates.sort()[0] || scenario.endDate;
      draft.date = next;
      const wasResting = ns.CareerRules.isResting(draft.career);
      ns.CareerRules.advanceToTime(draft.career, ns.EraWorld.time(draft, next));
      if (wasResting && !ns.CareerRules.isResting(draft.career)) event(draft, "injury-recovery");
      const editions = all.filter((e) => e.date === next && !draft.settled.includes(e.id));
      for (const edition of editions) {
        if (draft.scheduledRace === edition.id) completeRace(draft, edition.id); else historical(draft, edition);
      }
      if (!all.some((e) => !draft.settled.includes(e.id)) || next === scenario.endDate) { draft.date = scenario.endDate; finish(draft, "year-end"); }
      syncNarrative(draft);
    });
    Object.assign(run, draft); return { type: "advanced", date: run.date };
  }
  function resolveSceneChoice(run, sceneId, choiceId) {
    if (String(choiceId).startsWith("schedule:")) return registerRace(run, choiceId.slice(9));
    const scene = getCurrentScene(run); if (!scene || scene.id !== sceneId) return { type: "ignored" };
    if (choiceId === "advance" && scene.id.startsWith("time:")) return advanceNarrative(run);
    if (!ns.EraStorylets.resolve(run, sceneId, choiceId)) return { type: "ignored" };
    event(run, "scene-choice", { sceneId, choiceId });
    syncNarrative(run);
    // 赛季结束要等所有待播片段都放完，年终总结才不会盖过最后一场的余韵。
    if (run.endingPending && !run.storylets.pending.length) { run.ended = true; run.endingPending = false; }
    return { type: "resolved" };
  }
  function retire(run) { if (!run.ended && !run.endingPending && run.onboarding.namingComplete) { ns.CareerRules.retire(run.career, "玩家选择退役"); finish(run, "retired"); } }
  function normalizeSave(run) {
    if (run?.version !== RUN_VERSION || !scenarioFor(run) || !run.career?.horse || !Array.isArray(run.events) || !Array.isArray(run.settled) || !Number.isInteger(run.rngState) || !/^\d{4}-\d\d-\d\d$/.test(run.date)) throw new Error("Unsupported or incomplete era run");
    if (new Set(run.settled).size !== run.settled.length) throw new Error("Duplicate settled race");
    return run;
  }
  ns.EraRules = { RUN_VERSION, ENTRY_SETUP_VERSION, DEFAULT_SCENARIO_ID, createEntrySetup, normalizeEntrySetup, getEntryCandidates, selectEntryCandidate, createRun, completeEncounterNaming, scenarioFor, getCurrentScene, getSceneChoices: (run, scene) => (scene || getCurrentScene(run))?.choices || [], getScheduleOptions, getAvailablePlans: (run) => getScheduleOptions(run).filter((p) => p.enabled), registerRace, cancelScheduledRace, advanceNarrative, advanceTurn: advanceNarrative, resolveSceneChoice, retire, normalizeSave, syncNarrative, recordEffect, getTimeline: (run) => run.timeline.slice().reverse(), getNewspaperItems: (run) => clone(run.news).reverse(), readNews: (run, id) => { const n = run.news.find((x) => x.id === id); if (!n) return false; n.read = true; return true; } };
})();
