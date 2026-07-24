(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const RUN_VERSION = 5;
  const ENTRY_SETUP_VERSION = 1;
  const DEFAULT_SCENARIO_ID = "jp-golden-road";
  const COAT_FALLBACKS = ["鹿毛", "黑鹿毛", "栗毛", "青鹿毛"];
  const TEMPERAMENTS = ["普通", "普通", "沉稳", "沉稳", "冷静"];
  const HEAVY_TYPES = ["不佳", "普通", "普通", "普通", "擅长"];
  const PLAYER_COMMENT_IDS = ["strength", "surface", "distance", "growth", "temperament"];

  function randomRange(min, max) {
    return ns.Random ? ns.Random.rollRange(min, max) : min + Math.floor(Math.random() * (max - min + 1));
  }

  function randomOne(items) {
    return ns.Random ? ns.Random.pickOne(items) : items[Math.floor(Math.random() * items.length)];
  }

  function clonePlain(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function safePlayerReference(value) {
    return String(value || "").trim().slice(0, 20) || "马主";
  }

  function scenarioFor(runOrId) {
    const scenarioId = typeof runOrId === "string"
      ? runOrId
      : (runOrId && runOrId.scenarioId) || DEFAULT_SCENARIO_ID;
    const scenario = ns.EraScenarioRegistry && ns.EraScenarioRegistry.find(scenarioId);
    if (!scenario) throw new Error(`Unknown era scenario: ${scenarioId}`);
    return scenario;
  }

  function occurrenceFor(run, occurrenceId) {
    const scenario = scenarioFor(run);
    return (scenario.occurrences || []).find((item) => item.id === occurrenceId) || null;
  }

  function globalRace(raceId) {
    return (ns.Races || []).find((race) => race && race.id === raceId) || null;
  }

  function globalHorse(horseId) {
    return (ns.HistoricalHorses || []).find((horse) => horse && horse.id === horseId) || null;
  }

  function horseProfile(scenario, horseId) {
    return globalHorse(horseId) || (scenario.eraHorses && scenario.eraHorses[horseId]) || null;
  }

  function horseName(scenario, horseId) {
    if (horseId === "player") return "你的赛马";
    const horse = horseProfile(scenario, horseId);
    return horse ? horse.displayNameZh || horse.displayName || horse.name || horseId : horseId;
  }

  function createOccurrenceRace(occurrence) {
    const source = occurrence.raceSnapshot ? clonePlain(occurrence.raceSnapshot) : globalRace(occurrence.raceId);
    if (!source) throw new Error(`Era occurrence references unknown race: ${occurrence.raceId || occurrence.id}`);
    const race = { ...source, ...(occurrence.override || {}) };
    race.id = source.id;
    race.name = occurrence.nameZh || race.nameZh || race.name || race.nameOriginal;
    race.nameZh = occurrence.nameZh || race.nameZh || race.name;
    race.month = occurrence.month;
    race.half = occurrence.half;
    race.eraOccurrenceId = occurrence.id;
    race.eraDate = occurrence.date;
    return race;
  }

  function occurrenceSchedule(occurrence) {
    const index = ns.TimeRules.toIndex(occurrence.age, occurrence.month, occurrence.half);
    return {
      age: occurrence.age,
      month: occurrence.month,
      half: occurrence.half,
      index,
      label: `${occurrence.date} · ${occurrence.nameZh}`,
      historicalYear: Number(String(occurrence.date).slice(0, 4)),
      historicalDate: occurrence.date
    };
  }

  function currentYear(run) {
    if (run && run.career && run.career.currentTime && run.career.horse) {
      return Number(run.career.horse.birthYear || 1995) + Number(run.career.currentTime.age || 0);
    }
    return run && run.era && run.era.historicalYear ? run.era.historicalYear : 1997;
  }

  function historicalDateFromTime(run, time) {
    const resolved = time || run.career.currentTime;
    const year = Number(run.career.horse.birthYear || 1995) + Number(resolved.age || 0);
    return `${year}-${String(resolved.month).padStart(2, "0")}-${resolved.half === 2 ? "16" : "01"}`;
  }

  function historicalDateFromIndex(run, index) {
    return historicalDateFromTime(run, ns.TimeRules.fromIndex(index));
  }

  function careerTimeFromHistoricalDate(run, date) {
    const match = String(date || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) throw new Error(`Invalid historical date: ${date}`);
    const age = Number(match[1]) - Number(run.career.horse.birthYear || 1995);
    const month = Number(match[2]);
    const half = Number(match[3]) >= 16 ? 2 : 1;
    return { age, month, half, index: ns.TimeRules.toIndex(age, month, half) };
  }

  function eventKnown(run, dedupeKey) {
    return (run.era.events || []).some((event) => event.dedupeKey === dedupeKey);
  }

  function recordEvent(run, event, dedupeKey) {
    if (!run || !run.era) return null;
    if (!Array.isArray(run.era.events)) run.era.events = [];
    const key = String(dedupeKey || event.dedupeKey || "");
    if (key && eventKnown(run, key)) return run.era.events.find((item) => item.dedupeKey === key);
    run.era.nextEventSequence = Number.isFinite(run.era.nextEventSequence) ? run.era.nextEventSequence : 1;
    const sequence = run.era.nextEventSequence++;
    const currentTime = run.career && run.career.currentTime ? run.career.currentTime : {};
    const historicalDate = Object.prototype.hasOwnProperty.call(event, "historicalDate")
      ? event.historicalDate
      : (run.career ? historicalDateFromTime(run, currentTime) : null);
    const inferredOccurrence = event.occurrenceId ? occurrenceFor(run, event.occurrenceId) : null;
    const inferredRace = inferredOccurrence ? createOccurrenceRace(inferredOccurrence) : null;
    const recorded = {
      eventId: event.eventId || `era-event-${sequence}`,
      eventType: event.eventType || "event",
      dedupeKey: key || `sequence:${sequence}`,
      createdSequence: sequence,
      occurrenceId: event.occurrenceId || null,
      raceInstanceId: event.raceInstanceId || null,
      historicalDate: historicalDate || null,
      historicalYear: historicalDate ? Number(String(historicalDate).slice(0, 4)) : null,
      careerAge: Number.isFinite(event.careerAge) ? event.careerAge : (Number.isFinite(currentTime.age) ? currentTime.age : null),
      careerMonth: Number.isFinite(event.careerMonth) ? event.careerMonth : (Number.isFinite(currentTime.month) ? currentTime.month : null),
      careerHalf: Number.isFinite(event.careerHalf) ? event.careerHalf : (Number.isFinite(currentTime.half) ? currentTime.half : null),
      playerFinish: Number.isFinite(event.playerFinish) ? event.playerFinish : null,
      playerRetired: !!event.playerRetired,
      actualWinnerId: event.actualWinnerId || null,
      historicalWinnerId: event.historicalWinnerId || null,
      worldlineKind: event.worldlineKind || null,
      absenceReason: event.absenceReason || null,
      importantTwoYear: !!event.importantTwoYear,
      keyRace: !!event.keyRace,
      raceClass: event.raceClass || (event.details && event.details.raceClass) || (inferredRace && inferredRace.raceClass) || null,
      grade: event.grade || (event.details && event.details.grade) || (inferredRace && inferredRace.grade) || null,
      interruptedPlannedRace: !!event.interruptedPlannedRace,
      routeKey: event.routeKey || null,
      routeValue: event.routeValue || null,
      recordQuality: event.recordQuality || null,
      details: clonePlain(event.details || null)
    };
    run.era.events.push(recorded);
    return recorded;
  }

  function getNarrativeSummary(run, atSequence) {
    const summary = ns.EraNarrative
      ? ns.EraNarrative.summarize(run.era.events || [], scenarioFor(run), atSequence)
      : {};
    run.era.narrativeSummary = clonePlain(summary);
    return summary;
  }

  function baseTokens(run, occurrence, overrides) {
    const scenario = scenarioFor(run);
    const horse = run.career.horse || {};
    const trainer = run.career.trainer || {};
    const historicalWinnerId = occurrence && occurrence.historicalWinnerId;
    return {
      PLAYER_REFERENCE: (run.era && run.era.playerReference) || "马主",
      PLAYER_HORSE_NAME: horse.name || "你的赛马",
      CANDIDATE_HORSE_REFERENCE: run.era && run.era.onboarding && run.era.onboarding.namingComplete
        ? (horse.name || "你的赛马")
        : "那匹尚未命名的马",
      PLAYER_JOCKEY_NAME: (run.career.playerJockey && run.career.playerJockey.name) || "主战骑手",
      PLAYER_TRAINER_NAME: trainer.name || "佐藤悠太",
      RACE_NAME: occurrence ? occurrence.nameZh : "经典赛",
      ACTUAL_WINNER_NAME: historicalWinnerId ? horseName(scenario, historicalWinnerId) : "优胜马",
      HISTORICAL_WINNER_NAME: historicalWinnerId ? horseName(scenario, historicalWinnerId) : "史实优胜马",
      PRIMARY_RIVAL_NAME: horseName(scenario, scenario.primaryRivalIds[0]),
      CURRENT_YEAR: String(currentYear(run)),
      PLAYER_FINISH: "未参赛",
      CLASSIC_WINS: String(run.era.classicWins || 0),
      BEST_FINISH: "无",
      MISSED_RACES: String(run.era.missedKeyRaces.length),
      DIVERGENCE_COUNT: String(run.era.divergenceFlags.length),
      ...(overrides || {})
    };
  }

  function storyKnown(run, textId) {
    return run.era.completedStoryIds.includes(textId)
      || run.era.pendingStories.some((story) => story.textId === textId);
  }

  function queueStory(run, textId, tokens) {
    if (!textId || storyKnown(run, textId)) return null;
    const textEntry = ns.EraTextIndex.get(textId);
    if (!textEntry || textEntry.status === "placeholder") {
      const fallback = ns.EraTextIndex.get("jp.golden-road.main.1998.fallback");
      if (!fallback || storyKnown(run, fallback.id)) return null;
      textId = fallback.id;
    }
    const story = {
      id: `story-${run.era.nextEventNumber++}`,
      textId,
      tokens: { ...(tokens || {}) },
      status: "pending",
      createdAtIndex: run.career.currentTime.index
    };
    run.era.pendingStories.push(story);
    return story;
  }

  function completeStory(run, storyId, skipped) {
    const index = run.era.pendingStories.findIndex((story) => story.id === storyId);
    if (index < 0) return false;
    const story = run.era.pendingStories.splice(index, 1)[0];
    story.status = skipped ? "skipped" : "read";
    story.completedAtIndex = run.career.currentTime.index;
    run.era.storyHistory.push(story);
    if (!run.era.completedStoryIds.includes(story.textId)) run.era.completedStoryIds.push(story.textId);
    return true;
  }

  function deferStory(run, storyId) {
    const story = run.era.pendingStories.find((item) => item.id === storyId);
    if (!story) return false;
    story.status = "deferred";
    return true;
  }

  function reopenStory(run, storyId) {
    const story = run.era.pendingStories.find((item) => item.id === storyId);
    if (!story) return false;
    run.era.pendingStories.forEach((item) => {
      if (item.status === "pending") item.status = "deferred";
    });
    story.status = "pending";
    return true;
  }

  function createPlayerHorse(template, name) {
    const coats = ns.HorseRules && Array.isArray(ns.HorseRules.COATS)
      ? ns.HorseRules.COATS.map((coat) => coat.name)
      : COAT_FALLBACKS;
    const featuredCourses = ["东京", "中山", "京都"];
    const bestCourse = randomOne(featuredCourses);
    const safeName = String(name || "").trim().slice(0, 30) || "你的赛马";
    const randomId = window.crypto && typeof window.crypto.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `era-${Date.now()}-${randomRange(1000, 9999)}`;
    return {
      id: randomId,
      name: safeName,
      birthYear: template.birthYear,
      source: "era",
      gameMode: "era",
      sireId: "era-scripted-sire",
      damId: "era-scripted-dam",
      sireName: "王道路剧本父系",
      damName: "王道路剧本母系",
      strength: randomRange(template.strengthMin, template.strengthMax),
      strengthLabel: `剧情模板 ${template.strengthMin}-${template.strengthMax}`,
      coat: randomOne(coats),
      coatEn: "",
      gender: template.gender,
      weight: randomRange(450, 510),
      temperamentLabel: randomOne(TEMPERAMENTS),
      temperament: 50,
      surfacePref: template.surfacePref,
      grass: { 日本: "A", 香港: "B", 美国: "B", 欧洲: "B", 其他: "B" },
      dirt: { 日本: "C", 中东: "C", 美国: "C" },
      heavyType: randomOne(HEAVY_TYPES),
      courseGrades: {
        东京: bestCourse === "东京" ? "S" : "A",
        中山: bestCourse === "中山" ? "S" : "A",
        京都: bestCourse === "京都" ? "S" : "A",
        阪神: "A",
        其他地方: "B"
      },
      coreDist: template.coreDist,
      distType: "中长距离",
      distMin: template.distMin,
      distMax: template.distMax,
      growthType: template.growthType,
      peakStart: template.peakStart,
      peakEnd: template.peakEnd,
      career: []
    };
  }

  function createPlayerComments(horse, template) {
    if (!ns.CommentRules || !ns.CommentRules.generateDebutCommentDetails) return [];
    const accuracy = template.commentAccuracy || "close";
    const accuracyById = Object.fromEntries(PLAYER_COMMENT_IDS.map((id) => [id, accuracy]));
    return ns.CommentRules.generateDebutCommentDetails(horse, template.trainerId, { accuracyById });
  }

  function applyPlayerComments(career, template, force) {
    const current = Array.isArray(career.commentDetails) ? career.commentDetails : [];
    const accuracy = template.commentAccuracy || "close";
    const complete = current.length === PLAYER_COMMENT_IDS.length
      && PLAYER_COMMENT_IDS.every((id) => current.some((comment) => comment && comment.id === id && comment.accuracy === accuracy));
    if (!force && complete) return current;
    const details = createPlayerComments(career.horse, template);
    career.commentDetails = details;
    career.comments = details.map((comment) => comment.text);
    career.debutLock = ns.CommentRules && ns.CommentRules.buildDebutLock
      ? ns.CommentRules.buildDebutLock(details)
      : null;
    return details;
  }

  function preparePlayerHorse(horse, template, trainer) {
    horse.trainerId = trainer.id;
    horse.trainerName = trainer.name;
    horse.mainJockeyId = template.playerJockey.id;
    horse.homeRegionId = template.homeRegionId;
    horse.currentRegionId = template.homeRegionId;
    horse.gameMode = "era";
    return horse;
  }

  function entryDefinition(entryId) {
    return (ns.EraScenarioRegistry.listEntries ? ns.EraScenarioRegistry.listEntries() : [])
      .find((entry) => entry.id === entryId) || null;
  }

  function materializeEntryCandidate(entry) {
    const scenario = scenarioFor(entry.scenarioId);
    const template = scenario.playerTemplate;
    const trainer = ns.CommentRules && ns.CommentRules.getTrainer
      ? ns.CommentRules.getTrainer(template.trainerId)
      : { id: template.trainerId, name: "佐藤悠太", shortName: "佐藤", regionId: "japan" };
    const horse = preparePlayerHorse(createPlayerHorse(template, "那匹尚未命名的马"), template, trainer);
    return {
      id: entry.id,
      scenarioId: scenario.id,
      routeId: scenario.routeId,
      title: entry.title,
      routeLabel: entry.routeLabel,
      previewTextId: entry.previewTextId,
      trainerId: trainer.id,
      trainerName: trainer.name,
      horse,
      commentDetails: createPlayerComments(horse, template)
    };
  }

  function createEntrySetup(options) {
    const opts = options || {};
    const entries = ns.EraScenarioRegistry.listEntries ? ns.EraScenarioRegistry.listEntries() : [];
    if (!entries.length) throw new Error("No era entry candidates are registered.");
    return {
      version: ENTRY_SETUP_VERSION,
      playerReference: safePlayerReference(opts.playerReference),
      phase: "selection",
      selectedCandidateId: "",
      candidates: entries.map(materializeEntryCandidate)
    };
  }

  function normalizeEntrySetup(setup) {
    if (!setup || setup.version !== ENTRY_SETUP_VERSION || !Array.isArray(setup.candidates)) {
      throw new Error("Unsupported era entry setup.");
    }
    setup.playerReference = safePlayerReference(setup.playerReference);
    const seen = new Set();
    setup.candidates.forEach((candidate) => {
      const definition = entryDefinition(candidate.id);
      if (!definition || seen.has(candidate.id) || !candidate.horse) throw new Error("Invalid era entry candidate.");
      seen.add(candidate.id);
      candidate.scenarioId = definition.scenarioId;
      candidate.routeId = definition.routeId;
      candidate.title = definition.title;
      candidate.routeLabel = definition.routeLabel;
      candidate.previewTextId = definition.previewTextId;
      const scenario = scenarioFor(candidate.scenarioId);
      const trainer = ns.CommentRules && ns.CommentRules.getTrainer
        ? ns.CommentRules.getTrainer(scenario.playerTemplate.trainerId)
        : {
          id: scenario.playerTemplate.trainerId,
          name: candidate.trainerName || "佐藤悠太",
          shortName: "佐藤",
          regionId: scenario.playerTemplate.homeRegionId || "japan"
        };
      preparePlayerHorse(candidate.horse, scenario.playerTemplate, trainer);
      const carrier = { horse: candidate.horse, commentDetails: candidate.commentDetails || [], comments: [], debutLock: null };
      applyPlayerComments(carrier, scenario.playerTemplate, false);
      candidate.commentDetails = carrier.commentDetails;
      candidate.trainerId = trainer.id;
      candidate.trainerName = trainer.name;
    });
    setup.phase = setup.selectedCandidateId ? "selected" : "selection";
    return setup;
  }

  function getEntryCandidates(setup) {
    const normalized = normalizeEntrySetup(setup);
    return normalized.candidates.map((candidate) => ({
      id: candidate.id,
      scenarioId: candidate.scenarioId,
      routeId: candidate.routeId,
      title: candidate.title,
      routeLabel: candidate.routeLabel,
      previewTextId: candidate.previewTextId,
      gender: candidate.horse.gender,
      coat: candidate.horse.coat,
      trainerId: candidate.trainerId,
      trainerName: candidate.trainerName
    }));
  }

  function createRun(options) {
    const opts = options || {};
    const scenario = scenarioFor(opts.scenarioId || DEFAULT_SCENARIO_ID);
    const template = scenario.playerTemplate;
    const horse = opts.playerHorse
      ? clonePlain(opts.playerHorse)
      : createPlayerHorse(template, opts.horseName);
    const playerReference = safePlayerReference(opts.playerReference);
    const trainer = ns.CommentRules && ns.CommentRules.getTrainer
      ? ns.CommentRules.getTrainer(template.trainerId)
      : { id: template.trainerId, name: "佐藤悠太", shortName: "佐藤", regionId: "japan" };
    preparePlayerHorse(horse, template, trainer);
    const commentDetails = Array.isArray(opts.commentDetails) && opts.commentDetails.length
      ? clonePlain(opts.commentDetails)
      : createPlayerComments(horse, template);
    const debutLock = ns.CommentRules && ns.CommentRules.buildDebutLock
      ? ns.CommentRules.buildDebutLock(commentDetails)
      : null;
    const career = ns.CareerRules.createCareer(horse, commentDetails.map((comment) => comment.text), commentDetails, debutLock, trainer);
    career.gameMode = "era";
    career.horse.gameMode = "era";
    career.playerJockey = { ...template.playerJockey };
    career.mainJockeyId = template.playerJockey.id;
    career.entryRights = { eraOpenClass: true };
    const playableStart = scenario.playableStart || { age: 2, month: 6, half: 1 };
    career.currentTime = {
      age: playableStart.age,
      month: playableStart.month,
      half: playableStart.half,
      index: ns.TimeRules.toIndex(playableStart.age, playableStart.month, playableStart.half)
    };
    career.maturity.lastCheckedIndex = career.currentTime.index;
    const rivalRecords = {};
    scenario.primaryRivalIds.forEach((horseId) => {
      rivalRecords[horseId] = { meetings: 0, playerAhead: 0, rivalAhead: 0, ties: 0 };
    });
    const run = {
      version: RUN_VERSION,
      scenarioId: scenario.id,
      routeId: scenario.routeId,
      career,
      era: {
        playerReference,
        entryCandidateId: opts.entryCandidateId || "",
        onboarding: opts.onboarding
          ? { phase: "encounter", step: 0, namingComplete: false }
          : { phase: "complete", step: (scenario.encounterNodes || []).length, namingComplete: true },
        historicalYear: Number(String(playableStart.date || "1997-06-01").slice(0, 4)),
        currentChapter: "two-year-prologue",
        currentObjective: scenario.objective,
        events: [],
        nextEventSequence: 1,
        routes: {},
        routeExcludedOccurrences: [],
        twoYearResults: {},
        twoYearProfile: "two_year_unproven",
        twoYearCalendar: {
          windowChoices: {},
          migratedExpiredWindowIds: [],
          opinionSnapshot: null
        },
        completedOccurrences: [],
        completedKeyRaces: [],
        missedKeyRaces: [],
        keyRaceResults: {},
        classicWins: 0,
        tripleCrownPossible: true,
        rivalRecords,
        completedStoryIds: [],
        pendingStories: [],
        storyHistory: [],
        news: [],
        chronicle: [],
        divergenceFlags: [],
        injuryInterrupted: false,
        earlyRetirement: false,
        endingId: "",
        endingTextId: "",
        endingTokens: null,
        summary: null,
        pendingSummary: null,
        stageState: { status: "playing", pendingEndingId: "", summaryVisible: false },
        nextEventNumber: 1,
        narrative: {
          currentSceneId: "",
          pendingScenes: [],
          timeline: [],
          resolvedSceneIds: [],
          choiceRecords: [],
          reportSnapshots: {},
          nextSequence: 1,
          turnRevision: 0,
          decisionAttempts: {},
          reopenedDecisionNodes: {}
        }
      }
    };
    recordEvent(run, { eventType: "career-start", historicalDate: playableStart.date || "1997-06-01" }, "career-start");
    if (!opts.onboarding) {
      recordEvent(run, {
        eventType: "horse-named",
        historicalDate: playableStart.date || "1997-06-01",
        details: { horseName: horse.name }
      }, "horse-named");
    }
    updateChapter(run);
    syncNarrative(run);
    return run;
  }

  function selectEntryCandidate(setup, candidateId) {
    const normalized = normalizeEntrySetup(setup);
    const candidate = normalized.candidates.find((item) => item.id === candidateId);
    if (!candidate) throw new Error("Unknown era entry candidate.");
    if (normalized.selectedCandidateId) {
      throw new Error("An era entry candidate has already been selected.");
    }
    normalized.selectedCandidateId = candidateId;
    normalized.phase = "selected";
    return createRun({
      scenarioId: candidate.scenarioId,
      playerReference: normalized.playerReference,
      playerHorse: candidate.horse,
      commentDetails: candidate.commentDetails,
      entryCandidateId: candidate.id,
      onboarding: true
    });
  }

  function onboardingComplete(run) {
    return !run || !run.era || !run.era.onboarding || run.era.onboarding.phase === "complete";
  }

  function isSettled(run, occurrenceId) {
    return run.era.completedOccurrences.includes(occurrenceId);
  }

  function ensureTwoYearCalendar(run) {
    if (!run.era.twoYearCalendar || typeof run.era.twoYearCalendar !== "object") run.era.twoYearCalendar = {};
    const calendar = run.era.twoYearCalendar;
    if (!calendar.windowChoices || typeof calendar.windowChoices !== "object") calendar.windowChoices = {};
    if (!Array.isArray(calendar.migratedExpiredWindowIds)) calendar.migratedExpiredWindowIds = [];
    if (!Object.prototype.hasOwnProperty.call(calendar, "opinionSnapshot")) calendar.opinionSnapshot = null;
    return calendar;
  }

  function calendarWindowFor(run, windowId) {
    return (scenarioFor(run).twoYearCalendarWindows || []).find((window) => window.id === windowId) || null;
  }

  function freeRaceResults(run) {
    return (run.era.events || [])
      .filter((event) => event.eventType === "race-result" && (event.historicalYear === 1997 || event.careerAge === 2))
      .slice()
      .sort((left, right) => (left.createdSequence || 0) - (right.createdSequence || 0));
  }

  function freeRaceEligibility(run, occurrence) {
    if (!occurrence || !occurrence.freeRace) return { eligible: true, reason: "" };
    const results = freeRaceResults(run);
    const raceClass = createOccurrenceRace(occurrence).raceClass;
    const wins = results.filter((event) => event.playerFinish === 1 && !event.playerRetired);
    const advancedWin = wins.some((event) => ["one-win", "open", "g3", "g2"].includes(event.raceClass || (event.details && event.details.raceClass)));
    if (!results.length) {
      return raceClass === "new"
        ? { eligible: true, reason: "未出赛马可参加新马战" }
        : { eligible: false, reason: "尚未出赛，只能报名新马战" };
    }
    if (!wins.length) {
      return raceClass === "maiden"
        ? { eligible: true, reason: "尚未取胜，可参加未胜利战" }
        : { eligible: false, reason: "尚未取胜，只能报名未胜利战" };
    }
    if (raceClass === "new" || raceClass === "maiden") {
      return { eligible: false, reason: "已经取胜，不能再报名新马或未胜利战" };
    }
    if (raceClass === "g2" && !advancedWin) {
      return { eligible: false, reason: "需先赢得500万下、公开赛或G3才开放G2" };
    }
    if (raceClass === "one-win" && advancedWin) {
      return { eligible: false, reason: "已赢得更高阶段赛事，不再报名500万下" };
    }
    if (["one-win", "open", "g3", "g2"].includes(raceClass)) {
      return { eligible: true, reason: advancedWin ? "已开放G2及公开级赛事" : "首胜后已开放500万下、公开赛和G3" };
    }
    return { eligible: false, reason: "当前履历不符合这场比赛的级别" };
  }

  function getFreeRaceWindows(run) {
    const calendar = ensureTwoYearCalendar(run);
    const currentIndex = run.career.currentTime.index;
    return (scenarioFor(run).twoYearCalendarWindows || []).map((window) => {
      const decision = careerTimeFromHistoricalDate(run, window.decisionDate);
      const choice = calendar.windowChoices[window.id] || "";
      let status = "future";
      if (calendar.migratedExpiredWindowIds.includes(window.id)) status = "migrated-expired";
      else if (choice) status = choice === "skip" ? "skipped" : "completed";
      else if (decision.index <= currentIndex) status = "current";
      return { ...clonePlain(window), decisionIndex: decision.index, choice, status };
    });
  }

  function getFreeRacePlans(run, windowId) {
    const window = calendarWindowFor(run, windowId);
    if (!window) return [];
    const calendar = ensureTwoYearCalendar(run);
    const currentIndex = run.career.currentTime.index;
    const decisionIndex = careerTimeFromHistoricalDate(run, window.decisionDate).index;
    return (window.occurrenceIds || []).map((occurrenceId) => {
      const occurrence = occurrenceFor(run, occurrenceId);
      if (!occurrence) return null;
      const race = createOccurrenceRace(occurrence);
      const schedule = occurrenceSchedule(occurrence);
      const eligibility = freeRaceEligibility(run, occurrence);
      const windowOpen = !calendar.windowChoices[window.id]
        && !calendar.migratedExpiredWindowIds.includes(window.id)
        && decisionIndex <= currentIndex
        && schedule.index >= currentIndex;
      return {
        occurrence,
        race,
        schedule,
        eligible: windowOpen && eligibility.eligible,
        reason: windowOpen ? eligibility.reason : (calendar.windowChoices[window.id] ? "本旬已经作出赛程选择" : (schedule.index < currentIndex ? "报名窗口已经结束" : "尚未进入本旬报名窗口"))
      };
    }).filter(Boolean);
  }

  function getAvailablePlans(run) {
    if (!run || !onboardingComplete(run) || run.era.endingId || run.career.retired || run.career.scheduledRace) return [];
    if (ns.CareerRules.isResting(run.career)) return [];
    const scenario = scenarioFor(run);
    const currentIndex = run.career.currentTime.index;
    const minIndex = run.career.lastRaceIndex == null ? currentIndex : run.career.lastRaceIndex + 1;
    return scenario.occurrences
      .filter((occurrence) => !isSettled(run, occurrence.id))
      .filter((occurrence) => !(run.era.routeExcludedOccurrences || []).includes(occurrence.id))
      .filter((occurrence) => !occurrence.routeGroup
        || !run.era.routes[occurrence.routeGroup]
        || run.era.routes[occurrence.routeGroup] === occurrence.id)
      .map((occurrence) => ({
        occurrence,
        race: createOccurrenceRace(occurrence),
        schedule: occurrenceSchedule(occurrence)
      }))
      .filter((plan) => plan.schedule.index >= currentIndex && plan.schedule.index >= minIndex)
      .filter((plan) => {
        if (!plan.occurrence.freeRace) return true;
        const windowPlan = getFreeRacePlans(run, plan.occurrence.calendarWindowId)
          .find((item) => item.occurrence.id === plan.occurrence.id);
        return !!(windowPlan && windowPlan.eligible);
      })
      .filter((plan) => ns.TimeRules.isSexEligible(run.career.horse, plan.race))
      .sort((left, right) => left.schedule.index - right.schedule.index);
  }

  function opponentFromParticipation(scenario, occurrence, entry) {
    const horse = horseProfile(scenario, entry.horseId);
    if (!horse) throw new Error(`Unknown era opponent: ${entry.horseId}`);
    const displayNameZh = horse.displayNameZh || horse.displayName || horse.name;
    return {
      id: `${occurrence.id}-${entry.horseId}`,
      horseId: entry.horseId,
      name: displayNameZh,
      originalName: horse.name,
      displayName: displayNameZh,
      displayNameZh,
      displayNameEn: horse.displayNameEn || horse.name,
      year: Number(String(occurrence.date).slice(0, 4)),
      ability: entry.ability,
      jockeyId: entry.jockeyId || "",
      jockeyName: entry.jockeyName,
      riderAbility: entry.riderAbility,
      finish: entry.historicalFinish,
      historicalFinish: entry.historicalFinish,
      historicalScore: entry.historicalScore,
      historical: true,
      source: "era-participation"
    };
  }

  function buildRacePayload(run, occurrenceId) {
    const occurrence = occurrenceFor(run, occurrenceId);
    if (!occurrence || isSettled(run, occurrenceId)) throw new Error("This era occurrence is unavailable.");
    const available = getAvailablePlans(run).find((plan) => plan.occurrence.id === occurrenceId);
    if (!available) throw new Error("This era occurrence is not currently reachable.");
    const scenario = scenarioFor(run);
    let opponent;
    let opponents = [];
    if (occurrence.fieldPolicy === "historical-fixed") {
      opponents = occurrence.opponents.map((entry) => opponentFromParticipation(scenario, occurrence, entry));
      opponent = opponents[0];
    } else {
      const raceYear = Number(String(occurrence.date).slice(0, 4));
      opponent = ns.RaceRules.createGeneratedOpponent(available.race, raceYear, "era-preparation");
      opponent.horseId = opponent.horseId || opponent.id;
      opponent.name = "同世代备战对手";
      opponent.displayName = "同世代备战对手";
      opponent.displayNameZh = "同世代备战对手";
    }
    return {
      eraOccurrenceId: occurrence.id,
      keyRace: !!occurrence.keyRace,
      importantTwoYear: !!occurrence.importantTwoYear,
      routeGroup: occurrence.routeGroup || "",
      freeCalendarWindowId: occurrence.calendarWindowId || "",
      race: available.race,
      schedule: available.schedule,
      opponent,
      opponents,
      year: Number(String(occurrence.date).slice(0, 4)),
      preRaceCondition: null
    };
  }

  function getRegistrationPreview(run, occurrenceId) {
    const occurrence = occurrenceFor(run, occurrenceId);
    if (!occurrence) return null;
    const race = createOccurrenceRace(occurrence);
    const schedule = occurrenceSchedule(occurrence);
    const eligibility = occurrence.freeRace ? freeRaceEligibility(run, occurrence) : { eligible: true, reason: "剧情节点开放" };
    const horse = run.career.horse || {};
    const withinDistance = Number(race.distance) >= Number(horse.distMin || 0)
      && Number(race.distance) <= Number(horse.distMax || Number.MAX_SAFE_INTEGER);
    const fatigue = ns.RaceFatigueRules && ns.RaceFatigueRules.previewFatigueRisk
      ? ns.RaceFatigueRules.previewFatigueRisk(run.career, race, schedule, { gameMode: "era" })
      : { eligible: false, probability: 0, gapTurns: null };
    return {
      occurrenceId,
      eligible: eligibility.eligible,
      reason: eligibility.reason,
      race: clonePlain(race),
      schedule: clonePlain(schedule),
      withinDistance,
      distanceLabel: withinDistance
        ? `适距内（${race.distance}m）`
        : `适距外（本马适距${horse.distMin}—${horse.distMax}m）`,
      fatigue: clonePlain(fatigue),
      fatigueLabel: fatigue.eligible
        ? `连续参赛疲劳风险 ${Math.round(Number(fatigue.probability || 0) * 100)}%`
        : "当前无连续参赛疲劳判定"
    };
  }

  const NARRATIVE_PRIORITY = {
    time: 5,
    "race-result": 10,
    dialogue: 20,
    "race-decision": 25,
    "dynamic-report": 30,
    ending: 35,
    news: 40
  };

  function ensureNarrative(run) {
    if (!run.era.narrative || typeof run.era.narrative !== "object") run.era.narrative = {};
    const narrative = run.era.narrative;
    ["pendingScenes", "timeline", "resolvedSceneIds", "choiceRecords"].forEach((key) => {
      if (!Array.isArray(narrative[key])) narrative[key] = [];
    });
    if (!narrative.reportSnapshots || typeof narrative.reportSnapshots !== "object") narrative.reportSnapshots = {};
    if (!narrative.decisionAttempts || typeof narrative.decisionAttempts !== "object") narrative.decisionAttempts = {};
    if (!narrative.reopenedDecisionNodes || typeof narrative.reopenedDecisionNodes !== "object") narrative.reopenedDecisionNodes = {};
    narrative.currentSceneId = String(narrative.currentSceneId || "");
    narrative.nextSequence = Number.isFinite(narrative.nextSequence) ? narrative.nextSequence : 1;
    narrative.turnRevision = Number.isFinite(narrative.turnRevision) ? narrative.turnRevision : 0;
    return narrative;
  }

  function timeLabelFromIndex(run, index) {
    const time = ns.TimeRules.fromIndex(index);
    const year = Number(run.career.horse.birthYear || 1995) + time.age;
    return `${year}年${time.month}月${time.half === 2 ? "下旬" : "上旬"}`;
  }

  function dateFromIndex(run, index) {
    return historicalDateFromIndex(run, index);
  }

  function characterFor(run, characterId) {
    const scenario = scenarioFor(run);
    const profile = scenario.characters && scenario.characters[characterId];
    if (!profile) return { id: characterId || "narrator", name: "1998赛季记录", role: "旁白", side: "system" };
    const name = profile.nameToken === "PLAYER_REFERENCE"
      ? run.era.playerReference || "马主"
      : profile.name;
    return { ...profile, name: name || "1998赛季记录" };
  }

  function narrativeSceneKnown(narrative, sceneId) {
    return narrative.resolvedSceneIds.includes(sceneId)
      || narrative.pendingScenes.some((scene) => scene.id === sceneId)
      || narrative.timeline.some((scene) => scene.id === sceneId);
  }

  function sortNarrativeScenes(items) {
    return items.sort((left, right) => {
      if (left.createdAtIndex !== right.createdAtIndex) return left.createdAtIndex - right.createdAtIndex;
      const leftPriority = Number.isFinite(left.priority) ? left.priority : (NARRATIVE_PRIORITY[left.type] || 50);
      const rightPriority = Number.isFinite(right.priority) ? right.priority : (NARRATIVE_PRIORITY[right.type] || 50);
      if (leftPriority !== rightPriority) return leftPriority - rightPriority;
      return (left.sequence || 0) - (right.sequence || 0);
    });
  }

  function prepareNarrativeScene(run, scene) {
    const narrative = ensureNarrative(run);
    const createdAtIndex = Number.isFinite(scene.createdAtIndex) ? scene.createdAtIndex : run.career.currentTime.index;
    const summary = scene.narrativeSnapshot || getNarrativeSummary(run, scene.atEventSequence);
    const selectedSlots = scene.textSlots || (ns.EraNarrative
      ? ns.EraNarrative.selectTextSlots({
        scenario: scenarioFor(run),
        node: scene,
        summary,
        currentEvent: scene.currentEvent || null
      })
      : { base: scene.textId });
    const prepared = {
      status: "pending",
      tokens: {},
      speakerId: "",
      sourceKind: "",
      sourceId: "",
      contentStatus: "final",
      ...scene,
      createdAtIndex,
      date: scene.date || dateFromIndex(run, createdAtIndex),
      sequence: Number.isFinite(scene.sequence) ? scene.sequence : narrative.nextSequence++,
      textSlots: clonePlain(selectedSlots),
      tokensSnapshot: clonePlain(scene.tokensSnapshot || scene.tokens || {}),
      narrativeSnapshot: clonePlain(summary)
    };
    prepared.textId = prepared.textId || prepared.textSlots.base || "";
    prepared.tokens = clonePlain(prepared.tokensSnapshot);
    if (["dynamic-report", "news"].includes(prepared.type)) {
      prepared.newsTextSlots = clonePlain(scene.newsTextSlots || {
        title: prepared.textSlots.base || prepared.textId,
        lead: prepared.textSlots.base || prepared.textId,
        background: prepared.textSlots["history-context"] || "",
        analysis: prepared.textSlots["speaker-reaction"] || prepared.textSlots.worldline || "",
        outlook: prepared.textSlots["future-hook"] || ""
      });
    }
    return prepared;
  }

  function archiveNarrativeScene(run, scene, status) {
    const narrative = ensureNarrative(run);
    if (narrativeSceneKnown(narrative, scene.id)) return null;
    const archived = prepareNarrativeScene(run, { ...scene, status: status || "resolved" });
    narrative.timeline.push(archived);
    if (!narrative.resolvedSceneIds.includes(archived.id)) narrative.resolvedSceneIds.push(archived.id);
    sortNarrativeScenes(narrative.timeline);
    return archived;
  }

  function enqueueNarrativeScene(run, scene) {
    const narrative = ensureNarrative(run);
    if (!scene || !scene.id || narrativeSceneKnown(narrative, scene.id)) return null;
    const queued = prepareNarrativeScene(run, scene);
    narrative.pendingScenes.push(queued);
    sortNarrativeScenes(narrative.pendingScenes);
    narrative.currentSceneId = narrative.pendingScenes[0] ? narrative.pendingScenes[0].id : "";
    return queued;
  }

  function sceneNodeIndex(node) {
    return ns.TimeRules.toIndex(node.age || 3, node.month, node.half);
  }

  function sceneNodeApplies(run, node) {
    if (node.untilOccurrenceId && isSettled(run, node.untilOccurrenceId)) return false;
    if ((node.untilAnyOccurrenceIds || []).some((occurrenceId) => isSettled(run, occurrenceId))) return false;
    if (node.requiresCompletedOccurrenceId && !isSettled(run, node.requiresCompletedOccurrenceId)) return false;
    if (node.onlyIfNoCareerRaces && (run.career.races || []).length > 0) return false;
    if (node.onlyIfCareerRaces && !(run.career.races || []).length) return false;
    if (node.calendarWindowId && ensureTwoYearCalendar(run).windowChoices[node.calendarWindowId]) return false;
    if (node.requiresOpinionSnapshot && !ensureTwoYearCalendar(run).opinionSnapshot) return false;
    if (node.skipIfRouteKey && run.era.routes[node.skipIfRouteKey]) return false;
    if (node.requiresRoute && run.era.routes[node.requiresRoute.key] !== node.requiresRoute.value) return false;
    if (node.requiresTwoYearFinalResolved) {
      const route = run.era.routes.twoYearFinal;
      if (!route) return false;
      if (route === "asahi" && !isSettled(run, "1997-asahi")) return false;
      if (route === "radio" && !isSettled(run, "1997-radio-tampa")) return false;
    }
    return true;
  }

  function syncEncounterScene(run) {
    const scenario = scenarioFor(run);
    const onboarding = run.era.onboarding;
    const nodes = scenario.encounterNodes || [];
    const node = nodes[onboarding.step];
    if (!node) {
      onboarding.phase = "complete";
      onboarding.namingComplete = true;
      return null;
    }
    const textEntry = ns.EraTextIndex.get(node.textId);
    return enqueueNarrativeScene(run, {
      id: `encounter:${node.id}`,
      nodeId: node.id,
      type: node.type,
      textId: node.textId,
      speakerId: node.speakerId || "",
      contentStatus: textEntry && textEntry.presentation === "outline" ? "outline" : "final",
      interactionKind: node.interactionKind || "encounter",
      transientChoices: clonePlain(node.transientChoices || []),
      tokens: baseTokens(run, null),
      createdAtIndex: run.career.currentTime.index,
      date: (scenario.playableStart && scenario.playableStart.date) || "1997-06-01",
      sourceKind: "encounter",
      sourceId: node.id
    });
  }

  function syncStaticScenes(run, options) {
    const scenario = scenarioFor(run);
    const narrative = ensureNarrative(run);
    const currentIndex = run.career.currentTime.index;
    (scenario.sceneNodes || []).forEach((node) => {
      const index = sceneNodeIndex(node);
      const migratingExpired = !!(options && options.migratePast && index < currentIndex);
      if (index > currentIndex || (!migratingExpired && !sceneNodeApplies(run, node))) return;
      if (storyKnown(run, node.textId)) return;
      const textEntry = ns.EraTextIndex.get(node.textId);
      const retry = Number(narrative.reopenedDecisionNodes[node.id] || 0);
      const scene = {
        id: retry ? `node:${node.id}:retry:${retry}` : `node:${node.id}`,
        nodeId: node.id,
        type: node.type,
        textId: node.textId,
        speakerId: node.speakerId || (textEntry && textEntry.speakerId) || "",
        contentStatus: textEntry && textEntry.presentation === "outline" ? "outline" : "final",
        tokens: baseTokens(run, null),
        allowedOccurrenceIds: (node.allowedOccurrenceIds || []).slice(),
        sceneChoices: clonePlain(node.sceneChoices || []),
        useNarrativeSlots: !!node.useNarrativeSlots,
        stageTransition: node.stageTransition || "",
        routeGroup: node.routeGroup || "",
        calendarWindowId: node.calendarWindowId || "",
        priority: Number.isFinite(node.priority) ? node.priority : null,
        createdAtIndex: index,
        date: node.date
      };
      if (migratingExpired) archiveNarrativeScene(run, scene, "migrated-expired");
      else enqueueNarrativeScene(run, scene);
    });
  }

  function eventIndex(event) {
    if (event.occurrenceId) {
      const scenario = ns.EraScenarioRegistry.find(event.details && event.details.scenarioId || DEFAULT_SCENARIO_ID);
      const occurrence = scenario && (scenario.occurrences || []).find((item) => item.id === event.occurrenceId);
      if (occurrence) return occurrenceSchedule(occurrence).index;
    }
    if (Number.isFinite(event.careerAge) && Number.isFinite(event.careerMonth)) {
      return ns.TimeRules.toIndex(event.careerAge, event.careerMonth, event.careerHalf || 1);
    }
    return -1;
  }

  function latestRaceEventBefore(run, targetIndex) {
    return (run.era.events || [])
      .filter((event) => event.eventType === "race-result" && eventIndex(event) >= 0 && eventIndex(event) < targetIndex)
      .slice()
      .sort((left, right) => eventIndex(left) - eventIndex(right) || left.createdSequence - right.createdSequence)
      .pop() || null;
  }

  function evaluatePreRaceReport(run, occurrenceId) {
    const occurrence = occurrenceFor(run, occurrenceId);
    if (!occurrence || !occurrence.keyRace || !occurrence.reportKey) return null;
    const targetIndex = occurrenceSchedule(occurrence).index;
    const reportIndex = targetIndex - 1;
    const lastRace = latestRaceEventBefore(run, targetIndex);
    const rank = lastRace && Number.isFinite(lastRace.playerFinish) ? lastRace.playerFinish : null;
    const retired = !!(lastRace && lastRace.playerRetired);
    const injury = run.career.injury && run.career.injury.active;
    const restingAtReport = !!(injury
      && Number.isFinite(injury.startIndex)
      && Number.isFinite(injury.restUntilIndex)
      && injury.startIndex <= reportIndex
      && injury.restUntilIndex > reportIndex);
    let form = "unproven";
    if (retired || restingAtReport) form = "health-question";
    else if (lastRace && rank === 1) form = "winner";
    else if (lastRace && (rank === 2 || rank === 3)) form = "contender";
    else if (lastRace && (rank === 4 || rank === 5)) form = "mixed";
    else if (lastRace) form = "outsider";
    const lastOccurrence = lastRace && lastRace.occurrenceId ? occurrenceFor(run, lastRace.occurrenceId) : null;
    const lastRaceName = lastRace ? (lastRace.details && lastRace.details.raceName) || (lastOccurrence && lastOccurrence.nameZh) || "最近一战" : "此前没有出赛记录";
    const lastRaceFinish = lastRace
      ? finishLabel(rank, retired)
      : "未出赛";
    return {
      occurrenceId: occurrence.id,
      reportKey: occurrence.reportKey,
      form,
      textId: scenarioFor(run).reportDefinitions[occurrence.reportKey][form],
      reportIndex,
      targetIndex,
      lastRaceName,
      lastRaceFinish,
      lastRaceRetired: retired,
      restingAtReport,
      injuryStatus: restingAtReport ? (injury.publicLabel || injury.reason || "伤病休养中") : "无伤病休养",
      tokens: baseTokens(run, occurrence, {
        RACE_NAME: occurrence.nameZh,
        LAST_RACE_NAME: lastRaceName,
        LAST_RACE_FINISH: lastRaceFinish
      })
    };
  }

  function evaluateTwoYearOpinion(run, options) {
    const calendar = ensureTwoYearCalendar(run);
    if (calendar.opinionSnapshot) return calendar.opinionSnapshot;
    const scenario = scenarioFor(run);
    const definition = scenario.twoYearOpinion;
    if (!definition) return null;
    const cutoffEvents = (run.era.events || [])
      .filter((event) => !event.historicalDate || event.historicalDate <= definition.cutoffDate)
      .slice()
      .sort((left, right) => (left.createdSequence || 0) - (right.createdSequence || 0));
    const cutoffSequence = cutoffEvents.length ? cutoffEvents[cutoffEvents.length - 1].createdSequence || 0 : 0;
    const summary = ns.EraNarrative
      ? ns.EraNarrative.summarize(cutoffEvents, scenario, cutoffSequence)
      : { twoYearProfile: "two_year_unproven", twoYearStatistics: {} };
    const latestRace = cutoffEvents.filter((event) => event.eventType === "race-result").pop() || null;
    const latestHealth = cutoffEvents.filter((event) => ["injury-start", "injury-recovery"].includes(event.eventType)).pop() || null;
    const injured = !!(latestHealth && latestHealth.eventType === "injury-start");
    const occurrence = occurrenceFor(run, definition.targetOccurrenceId);
    const tokens = baseTokens(run, occurrence, {
      LAST_RACE_NAME: latestRace && latestRace.details && latestRace.details.raceName || "此前没有出赛记录",
      LAST_RACE_FINISH: latestRace ? finishLabel(latestRace.playerFinish, latestRace.playerRetired) : "未出赛"
    });
    calendar.opinionSnapshot = {
      id: definition.id,
      generatedDate: definition.date,
      cutoffDate: definition.cutoffDate,
      cutoffEventSequence: cutoffSequence,
      profile: summary.twoYearProfile,
      statistics: clonePlain(summary.twoYearStatistics || {}),
      latestRace: latestRace ? {
        eventId: latestRace.eventId,
        occurrenceId: latestRace.occurrenceId,
        raceName: latestRace.details && latestRace.details.raceName || "最近一战",
        playerFinish: latestRace.playerFinish,
        playerRetired: latestRace.playerRetired
      } : null,
      injuryStatus: injured ? (latestHealth.details && latestHealth.details.reason || "伤病休养中") : "无伤病休养",
      textId: definition.textByProfile[summary.twoYearProfile] || definition.textByProfile.two_year_unproven,
      tokensSnapshot: clonePlain(tokens),
      narrativeSnapshot: clonePlain(summary),
      migrated: !!(options && options.migrated)
    };
    return calendar.opinionSnapshot;
  }

  function syncTwoYearOpinion(run, options) {
    const scenario = scenarioFor(run);
    const definition = scenario.twoYearOpinion;
    if (!definition) return null;
    const opinionIndex = careerTimeFromHistoricalDate(run, definition.date).index;
    if (run.career.currentTime.index < opinionIndex) return null;
    const migratingPast = !!(options && options.migratePast && opinionIndex < run.career.currentTime.index);
    const snapshot = evaluateTwoYearOpinion(run, migratingPast ? { migrated: true } : options);
    if (!snapshot || snapshot.migrated) return snapshot;
    enqueueNarrativeScene(run, {
      id: `dynamic-report:${definition.id}`,
      nodeId: definition.id,
      type: "dynamic-report",
      textId: snapshot.textId,
      speakerId: definition.speakerId || "press-keiba-weekly",
      contentStatus: "outline",
      tokens: clonePlain(snapshot.tokensSnapshot),
      tokensSnapshot: clonePlain(snapshot.tokensSnapshot),
      narrativeSnapshot: clonePlain(snapshot.narrativeSnapshot),
      textSlots: { base: snapshot.textId },
      newsTextSlots: { title: snapshot.textId, lead: snapshot.textId },
      createdAtIndex: opinionIndex,
      date: definition.date,
      sourceKind: "two-year-opinion",
      sourceId: definition.id,
      priority: 20
    });
    return snapshot;
  }

  function syncDynamicReports(run, options) {
    const narrative = ensureNarrative(run);
    const scenario = scenarioFor(run);
    const currentIndex = run.career.currentTime.index;
    scenario.occurrences.filter((item) => item.keyRace && item.reportKey).forEach((occurrence) => {
      const reportIndex = occurrenceSchedule(occurrence).index - 1;
      if (currentIndex < reportIndex) return;
      let snapshot = narrative.reportSnapshots[occurrence.id];
      if (!snapshot) {
        snapshot = evaluatePreRaceReport(run, occurrence.id);
        if (!snapshot) return;
        narrative.reportSnapshots[occurrence.id] = snapshot;
      }
      const scene = {
        id: `dynamic-report:${occurrence.id}`,
        type: "dynamic-report",
        textId: snapshot.textId,
        speakerId: "press-keiba-weekly",
        contentStatus: "outline",
        tokens: { ...snapshot.tokens },
        useNarrativeSlots: true,
        createdAtIndex: snapshot.reportIndex,
        date: dateFromIndex(run, snapshot.reportIndex),
        sourceKind: "dynamic-report",
        sourceId: occurrence.id,
        reportForm: snapshot.form
      };
      if (options && options.migratePast && reportIndex < currentIndex) archiveNarrativeScene(run, scene, "migrated");
      else enqueueNarrativeScene(run, scene);
    });
  }

  function storySceneType(textEntry) {
    if (!textEntry) return "dialogue";
    if (textEntry.category === "stage-ending") return "ending";
    if (textEntry.category === "news") return "news";
    if (textEntry.category === "chronicle") return "news";
    return "dialogue";
  }

  function syncStoredNarrativeSources(run, options) {
    const migratePast = !!(options && options.migratePast);
    (run.era.storyHistory || []).forEach((story) => {
      const textEntry = ns.EraTextIndex.get(story.textId);
      archiveNarrativeScene(run, {
        id: `story:${story.id}`,
        type: storySceneType(textEntry),
        textId: story.textId,
        speakerId: textEntry && textEntry.speakerId,
        contentStatus: textEntry && textEntry.presentation === "outline" ? "outline" : "final",
        tokens: { ...(story.tokens || {}) },
        createdAtIndex: Number.isFinite(story.createdAtIndex) ? story.createdAtIndex : run.career.currentTime.index,
        sourceKind: "story",
        sourceId: story.id
      }, story.status || "resolved");
    });
    (run.era.pendingStories || []).forEach((story) => {
      const textEntry = ns.EraTextIndex.get(story.textId);
      enqueueNarrativeScene(run, {
        id: `story:${story.id}`,
        type: storySceneType(textEntry),
        textId: story.textId,
        speakerId: textEntry && textEntry.speakerId,
        contentStatus: textEntry && textEntry.presentation === "outline" ? "outline" : "final",
        tokens: { ...(story.tokens || {}) },
        createdAtIndex: Number.isFinite(story.createdAtIndex) ? story.createdAtIndex : run.career.currentTime.index,
        sourceKind: "story",
        sourceId: story.id
      });
    });
    // Ordinary race news belongs to the newspaper inbox. It must not interrupt
    // the owner's scene flow or be copied into the season record.
    (run.era.chronicle || []).forEach((item) => {
      archiveNarrativeScene(run, {
        id: `chronicle:${item.id}`,
        type: "news",
        textId: item.textId,
        speakerId: "race-announcer",
        tokens: { ...(item.tokens || {}) },
        createdAtIndex: occurrenceFor(run, item.occurrenceId)
          ? occurrenceSchedule(occurrenceFor(run, item.occurrenceId)).index
          : run.career.currentTime.index,
        date: item.time,
        sourceKind: "chronicle",
        sourceId: item.id,
        historyStatus: item.historicalStatus
      }, migratePast ? "migrated" : "recorded");
    });
    (run.era.events || []).filter((event) => ["race-result", "race-absent"].includes(event.eventType)).forEach((event) => {
      const occurrenceId = event.occurrenceId;
      const occurrence = occurrenceId ? occurrenceFor(run, occurrenceId) : null;
      const scheduleIndex = eventIndex(event) >= 0 ? eventIndex(event) : run.career.currentTime.index;
      const scene = {
        id: `race-result:${event.eventId}`,
        type: "race-result",
        textId: "jp.golden-road.main.1998.race.result",
        speakerId: "race-announcer",
        tokens: baseTokens(run, occurrence, {
          RACE_NAME: (event.details && event.details.raceName) || (occurrence && occurrence.nameZh) || "比赛",
          PLAYER_FINISH: event.eventType === "race-absent" ? "未参赛" : finishLabel(event.playerFinish, event.playerRetired)
        }),
        createdAtIndex: scheduleIndex,
        date: event.historicalDate || dateFromIndex(run, scheduleIndex),
        sourceKind: "race",
        sourceId: event.eventId,
        currentEvent: clonePlain(event),
        atEventSequence: event.createdSequence
      };
      if (migratePast || scheduleIndex < run.career.currentTime.index) archiveNarrativeScene(run, scene, "recorded");
      else enqueueNarrativeScene(run, scene);
    });
  }

  function ensureIdleTimeScene(run) {
    if (run.era.endingId || run.career.retired) return null;
    const narrative = ensureNarrative(run);
    if (narrative.pendingScenes.length) return null;
    const index = run.career.currentTime.index;
    const rest = ns.CareerRules.getRestStatus(run.career);
    if (rest) {
      return enqueueNarrativeScene(run, {
        id: `forced-rest:${rest.startIndex}:${index}`,
        type: "time",
        textId: "jp.golden-road.main.1998.time.forced-rest",
        speakerId: "trainer-sato-yuta",
        tokens: baseTokens(run, null, {
          RACE_NAME: rest.restUntilLabel || timeLabelFromIndex(run, rest.restUntilIndex)
        }),
        createdAtIndex: index,
        date: dateFromIndex(run, index),
        sourceKind: "forced-rest"
      });
    }
    return enqueueNarrativeScene(run, {
      id: `time-ready:${index}:${narrative.turnRevision}`,
      type: "time",
      textId: "jp.golden-road.main.1998.time.passage",
      speakerId: "race-announcer",
      tokens: baseTokens(run, null, {
        LAST_RACE_NAME: timeLabelFromIndex(run, index),
        RACE_NAME: "下一个有效事件"
      }),
      createdAtIndex: index,
      date: dateFromIndex(run, index),
      sourceKind: "idle-time"
    });
  }

  function syncNarrative(run, options) {
    if (!run || !run.era || !run.career) return null;
    const opts = options || {};
    ensureNarrative(run);
    if (!onboardingComplete(run)) {
      syncEncounterScene(run);
      const encounterNarrative = ensureNarrative(run);
      sortNarrativeScenes(encounterNarrative.pendingScenes);
      sortNarrativeScenes(encounterNarrative.timeline);
      encounterNarrative.currentSceneId = encounterNarrative.pendingScenes[0] ? encounterNarrative.pendingScenes[0].id : "";
      return encounterNarrative;
    }
    syncStoredNarrativeSources(run, opts);
    syncTwoYearOpinion(run, opts);
    syncStaticScenes(run, opts);
    syncDynamicReports(run, opts);
    const narrative = ensureNarrative(run);
    sortNarrativeScenes(narrative.pendingScenes);
    sortNarrativeScenes(narrative.timeline);
    if (opts.includeIdle !== false) ensureIdleTimeScene(run);
    narrative.currentSceneId = narrative.pendingScenes[0] ? narrative.pendingScenes[0].id : "";
    return narrative;
  }

  function getCurrentScene(run) {
    const narrative = syncNarrative(run);
    if (!narrative) return null;
    return narrative.pendingScenes.find((scene) => scene.id === narrative.currentSceneId)
      || narrative.pendingScenes[0]
      || null;
  }

  function getTimeline(run) {
    const narrative = syncNarrative(run, { includeIdle: false });
    return narrative ? sortNarrativeScenes(narrative.timeline.slice()).reverse() : [];
  }

  function getScheduleOptions(run, providedScene) {
    const scenario = scenarioFor(run);
    const scene = providedScene || getCurrentScene(run);
    const allowedIds = new Set(scene && scene.type === "race-decision" ? scene.allowedOccurrenceIds || [] : []);
    const available = new Map(getAvailablePlans(run).map((plan) => [plan.occurrence.id, plan]));
    const scheduledId = run.career.scheduledRace && run.career.scheduledRace.eraOccurrenceId;
    const currentIndex = run.career.currentTime.index;
    const calendar = ensureTwoYearCalendar(run);
    return scenario.occurrences.map((occurrence) => {
      const plan = available.get(occurrence.id);
      const schedule = occurrenceSchedule(occurrence);
      const preview = getRegistrationPreview(run, occurrence.id);
      let status = "locked";
      if (isSettled(run, occurrence.id)) status = "completed";
      else if ((run.era.routeExcludedOccurrences || []).includes(occurrence.id)) status = "route-excluded";
      else if (scheduledId === occurrence.id) status = "scheduled";
      else if (schedule.index < currentIndex) status = "past";
      else if (occurrence.freeRace && calendar.windowChoices[occurrence.calendarWindowId]) status = "window-excluded";
      else if (occurrence.freeRace && allowedIds.has(occurrence.id) && preview && !preview.eligible) status = "ineligible";
      else if (plan && allowedIds.has(occurrence.id)) status = "available";
      return {
        occurrence,
        race: plan ? plan.race : createOccurrenceRace(occurrence),
        schedule,
        status,
        enabled: status === "available",
        reason: status === "ineligible" ? preview.reason : "",
        preview,
        section: status === "completed" || status === "past" || status === "route-excluded" || status === "window-excluded"
          ? "completed"
          : (allowedIds.has(occurrence.id) || status === "scheduled" ? "current" : "future")
      };
    });
  }

  function getSceneChoices(run, providedScene) {
    const scene = providedScene || getCurrentScene(run);
    if (!scene) return [];
    if (scene.sourceKind === "encounter") {
      if (scene.interactionKind === "transient-choice") {
        return (scene.transientChoices || []).map((choice) => ({ ...choice, action: "transient-preview" }));
      }
      if (scene.interactionKind === "naming") return [];
      return [{ id: "continue", label: scene.interactionKind === "named" ? "进入1997二岁赛季" : "继续相遇", action: "continue" }];
    }
    if (scene.type === "time") return [{ id: "advance", label: scene.sourceKind === "forced-rest" ? "继续休养" : "推进到下一事件", action: "advance" }];
    if (scene.type !== "race-decision") return [{ id: "continue", label: "继续", action: "continue" }];
    const scheduled = run.career.scheduledRace;
    if (scheduled) {
      return [
        { id: "keep-schedule", label: `保留${scheduled.race.nameZh || scheduled.race.name}安排`, action: "continue" },
        { id: "open-schedule", label: "查看赛程手册", action: "open-schedule" }
      ];
    }
    if (scene.calendarWindowId) {
      const choices = [
        { id: "open-schedule", label: "选择本旬赛事", action: "open-schedule" }
      ];
      (scene.sceneChoices || []).filter((choice) => {
        if (choice.onlyIfCareerRaces && !(run.career.races || []).length) return false;
        if (choice.onlyIfNoCareerRaces && (run.career.races || []).length) return false;
        return true;
      }).forEach((choice) => choices.push({
        ...choice,
        label: choice.labelTextId
          ? ns.EraTextIndex.resolve(choice.labelTextId, baseTokens(run, null)).body
          : choice.label
      }));
      return choices;
    }
    const choices = getScheduleOptions(run, scene)
      .filter((option) => option.enabled)
      .map((option) => ({
        id: `schedule:${option.occurrence.id}`,
        label: option.occurrence.choiceTextId
          ? ns.EraTextIndex.resolve(option.occurrence.choiceTextId, baseTokens(run, option.occurrence)).body
          : (option.occurrence.keyRace ? `报名${option.occurrence.nameZh}` : `参加${option.occurrence.nameZh}备战`),
        action: "schedule",
        occurrenceId: option.occurrence.id
      }));
    (scene.sceneChoices || []).forEach((choice) => choices.push({
      ...choice,
      label: choice.labelTextId
        ? ns.EraTextIndex.resolve(choice.labelTextId, baseTokens(run, null)).body
        : choice.label
    }));
    if (!(scene.sceneChoices || []).length) choices.push({ id: "advance", label: "暂不报名并继续", action: "advance" });
    choices.push({ id: "open-schedule", label: "查看赛程手册", action: "open-schedule" });
    return choices;
  }

  function resolveNarrativeScene(run, scene, choice) {
    const narrative = ensureNarrative(run);
    const index = narrative.pendingScenes.findIndex((item) => item.id === scene.id);
    if (index < 0) return null;
    const resolved = narrative.pendingScenes.splice(index, 1)[0];
    resolved.status = "resolved";
    resolved.resolvedAtIndex = run.career.currentTime.index;
    if (resolved.sourceKind === "encounter" && resolved.interactionKind === "transient-choice") {
      delete resolved.transientChoices;
    }
    if (resolved.sourceKind !== "encounter") resolved.choiceId = choice.id;
    narrative.timeline.push(resolved);
    if (!narrative.resolvedSceneIds.includes(resolved.id)) narrative.resolvedSceneIds.push(resolved.id);
    if (resolved.sourceKind !== "encounter") {
      narrative.choiceRecords.push({ sceneId: resolved.id, choiceId: choice.id, action: choice.action, occurrenceId: choice.occurrenceId || "", atIndex: run.career.currentTime.index });
    }
    if (resolved.sourceKind === "story") completeStory(run, resolved.sourceId, false);
    if (resolved.sourceKind === "news") readNews(run, resolved.sourceId);
    if (resolved.stageTransition) {
      recordEvent(run, {
        eventType: "stage-transition",
        routeValue: resolved.stageTransition,
        historicalDate: resolved.date
      }, `stage-transition:${resolved.stageTransition}`);
      run.era.twoYearProfile = getNarrativeSummary(run).twoYearProfile;
    }
    if (resolved.type === "ending" || resolved.sourceKind === "stage-ending") commitStageEnding(run);
    narrative.currentSceneId = narrative.pendingScenes[0] ? narrative.pendingScenes[0].id : "";
    sortNarrativeScenes(narrative.timeline);
    return resolved;
  }

  function advanceOnboarding(run, scene) {
    if (!scene || scene.sourceKind !== "encounter" || onboardingComplete(run)) return;
    run.era.onboarding.step += 1;
    const total = (scenarioFor(run).encounterNodes || []).length;
    if (run.era.onboarding.step >= total) {
      run.era.onboarding.phase = "complete";
      run.era.onboarding.namingComplete = true;
      updateChapter(run);
    }
  }

  function previewSceneChoice(run, sceneId, choiceId) {
    const scene = getCurrentScene(run);
    if (!scene || scene.id !== sceneId || scene.sourceKind !== "encounter" || scene.interactionKind !== "transient-choice") {
      return { type: "ignored", reason: "stale-scene" };
    }
    const choice = (scene.transientChoices || []).find((item) => item.id === choiceId);
    if (!choice) return { type: "ignored", reason: "unknown-choice" };
    return {
      type: "transient-preview",
      sceneId,
      choiceId,
      textId: choice.responseTextId,
      tokens: { ...scene.tokens },
      speakerId: "player"
    };
  }

  function completeTransientScene(run, sceneId) {
    const scene = getCurrentScene(run);
    if (!scene || scene.id !== sceneId || scene.sourceKind !== "encounter" || scene.interactionKind !== "transient-choice") {
      return { type: "ignored", reason: "stale-scene" };
    }
    const resolved = resolveNarrativeScene(run, scene, { id: "continue", action: "continue" });
    advanceOnboarding(run, resolved);
    syncNarrative(run);
    return { type: "encounter-continue", scene: resolved };
  }

  function completeEncounterNaming(run, horseName) {
    const scene = getCurrentScene(run);
    if (!scene || scene.sourceKind !== "encounter" || scene.interactionKind !== "naming") {
      return { type: "ignored", reason: "not-naming" };
    }
    const name = String(horseName == null ? "" : horseName).trim();
    if (!name) throw new Error("请为这匹赛马填写名字。");
    if (name.length > 30) throw new Error("赛马名称不能超过30个字符。");
    const resolved = resolveNarrativeScene(run, scene, { id: "name-horse", action: "naming" });
    run.career.horse.name = name;
    run.era.onboarding.namingComplete = true;
    recordEvent(run, {
      eventType: "horse-named",
      historicalDate: historicalDateFromTime(run),
      details: { horseName: name }
    }, "horse-named");
    advanceOnboarding(run, resolved);
    syncNarrative(run);
    return { type: "encounter-named", horseName: name, scene: resolved };
  }

  function advanceNarrative(run) {
    if (!run || run.era.endingId || run.career.retired) return { type: "ended" };
    if (!onboardingComplete(run)) return { type: "onboarding" };
    const fromIndex = run.career.currentTime.index;
    let outcome = null;
    for (let step = 0; step < 48; step += 1) {
      outcome = advanceTurn(run);
      const narrative = syncNarrative(run, { includeIdle: false });
      if (narrative.pendingScenes.length) break;
      if (outcome && ["race", "ending", "ended"].includes(outcome.type)) break;
      if (ns.CareerRules.isResting(run.career)) break;
    }
    return { type: "narrative-advance", fromIndex, toIndex: run.career.currentTime.index, outcome };
  }

  function resolveSceneChoice(run, sceneId, choiceId) {
    const scene = getCurrentScene(run);
    if (!scene || scene.id !== sceneId) return { type: "ignored", reason: "stale-scene" };
    let choice = getSceneChoices(run, scene).find((item) => item.id === choiceId);
    if (!choice && scene.type === "race-decision" && String(choiceId).startsWith("schedule:")) {
      const occurrenceId = String(choiceId).slice("schedule:".length);
      const option = getScheduleOptions(run, scene).find((item) => item.occurrence.id === occurrenceId && item.enabled);
      if (option) choice = { id: choiceId, action: "schedule", occurrenceId };
    }
    if (!choice) return { type: "ignored", reason: "unknown-choice" };
    if (choice.action === "transient-preview") return previewSceneChoice(run, sceneId, choiceId);
    if (choice.action === "open-schedule") return { type: "open-schedule", scene };
    if (choice.action === "schedule") {
      const occurrence = occurrenceFor(run, choice.occurrenceId);
      const payload = buildRacePayload(run, choice.occurrenceId);
      const narrative = ensureNarrative(run);
      narrative.decisionAttempts[occurrence.id] = Number(narrative.decisionAttempts[occurrence.id] || 0) + 1;
      payload.raceInstanceId = `${occurrence.id}:${payload.schedule.index}:${narrative.decisionAttempts[occurrence.id]}`;
      payload.registrationSource = { nodeId: scene.nodeId || "", sceneId: scene.id };
      run.career.scheduledRace = payload;
      if (occurrence.freeRace && occurrence.calendarWindowId) {
        ensureTwoYearCalendar(run).windowChoices[occurrence.calendarWindowId] = occurrence.id;
        recordEvent(run, {
          eventType: "race-window-choice",
          occurrenceId: occurrence.id,
          routeKey: occurrence.calendarWindowId,
          routeValue: occurrence.id,
          historicalDate: historicalDateFromTime(run)
        }, `race-window-choice:${occurrence.calendarWindowId}:${payload.raceInstanceId}`);
      }
      run.era.voluntaryAbsences = (run.era.voluntaryAbsences || []).filter((occurrenceId) => occurrenceId !== occurrence.id);
      if (occurrence.routeGroup) {
        run.era.routes[occurrence.routeGroup] = occurrence.id;
        (scenarioFor(run).occurrences || [])
          .filter((item) => item.routeGroup === occurrence.routeGroup && item.id !== occurrence.id)
          .forEach((item) => {
            if (!run.era.routeExcludedOccurrences.includes(item.id)) run.era.routeExcludedOccurrences.push(item.id);
          });
        recordEvent(run, {
          eventType: "route-choice",
          routeKey: occurrence.routeGroup,
          routeValue: occurrence.id,
          occurrenceId: occurrence.id,
          historicalDate: historicalDateFromTime(run)
        }, `route-choice:${occurrence.routeGroup}:${occurrence.id}`);
      }
      if (occurrence.routeChoice) {
        run.era.routes[occurrence.routeChoice.key] = occurrence.routeChoice.value;
        recordEvent(run, {
          eventType: "route-choice",
          routeKey: occurrence.routeChoice.key,
          routeValue: occurrence.routeChoice.value,
          occurrenceId: occurrence.id,
          historicalDate: historicalDateFromTime(run)
        }, `route-choice:${occurrence.routeChoice.key}:${occurrence.routeChoice.value}`);
      }
      recordEvent(run, {
        eventType: "race-entered",
        occurrenceId: occurrence.id,
        raceInstanceId: payload.raceInstanceId,
        historicalDate: occurrence.date
      }, `race-entered:${payload.raceInstanceId}`);
    }
    if (choice.action === "route") {
      run.era.routes[choice.routeKey] = choice.routeValue;
      if (choice.routeKey === "twoYearFinal" && ["asahi-declined", "skip"].includes(choice.routeValue)) {
        const excluded = choice.routeValue === "asahi-declined" ? ["1997-asahi"] : ["1997-asahi", "1997-radio-tampa"];
        excluded.forEach((occurrenceId) => {
          if (!run.era.routeExcludedOccurrences.includes(occurrenceId)) run.era.routeExcludedOccurrences.push(occurrenceId);
        });
      }
      recordEvent(run, {
        eventType: "route-choice",
        routeKey: choice.routeKey,
        routeValue: choice.routeValue,
        historicalDate: historicalDateFromTime(run)
        }, `route-choice:${scene.id}:${choice.id}`);
    }
    if (choice.action === "skip-window") {
      const windowId = scene.calendarWindowId;
      if (!windowId) return { type: "ignored", reason: "missing-calendar-window" };
      ensureTwoYearCalendar(run).windowChoices[windowId] = "skip";
      if (choice.routeKey) run.era.routes[choice.routeKey] = choice.routeValue;
      recordEvent(run, {
        eventType: "race-window-skipped",
        routeKey: windowId,
        routeValue: "skip",
        historicalDate: historicalDateFromTime(run),
        details: choice.routeKey ? { routeKey: choice.routeKey, routeValue: choice.routeValue } : null
      }, `race-window-skipped:${windowId}`);
    }
    if (choice.action === "advance" && scene.type === "race-decision") {
      const keyOptions = (scene.allowedOccurrenceIds || [])
        .map((occurrenceId) => occurrenceFor(run, occurrenceId))
        .filter((occurrence) => occurrence && occurrence.keyRace);
      if (keyOptions.length === 1 && (scene.allowedOccurrenceIds || []).length === 1) {
        if (!Array.isArray(run.era.voluntaryAbsences)) run.era.voluntaryAbsences = [];
        if (!run.era.voluntaryAbsences.includes(keyOptions[0].id)) run.era.voluntaryAbsences.push(keyOptions[0].id);
      }
    }
    const resolved = resolveNarrativeScene(run, scene, choice);
    advanceOnboarding(run, resolved);
    let advance = null;
    if (choice.action === "advance" || choice.action === "route" || choice.action === "skip-window") {
      advance = advanceNarrative(run);
      if (resolved && resolved.type === "time") {
        resolved.tokens.RACE_NAME = timeLabelFromIndex(run, run.career.currentTime.index);
        resolved.tokensSnapshot.RACE_NAME = resolved.tokens.RACE_NAME;
      } else if (advance && advance.toIndex > advance.fromIndex) {
        archiveNarrativeScene(run, {
          id: `time-passage:${advance.fromIndex}:${advance.toIndex}`,
          type: "time",
          textId: "jp.golden-road.main.1998.time.passage",
          speakerId: "race-announcer",
          tokens: baseTokens(run, null, {
            LAST_RACE_NAME: timeLabelFromIndex(run, advance.fromIndex),
            RACE_NAME: timeLabelFromIndex(run, advance.toIndex)
          }),
          createdAtIndex: advance.toIndex,
          date: dateFromIndex(run, advance.toIndex)
        });
      }
    }
    syncNarrative(run);
    return { type: choice.action, scene: resolved, advance, scheduledRace: run.career.scheduledRace || null };
  }

  function cancelScheduledRace(run) {
    if (!run || !run.career || !run.career.scheduledRace) return { type: "ignored", reason: "no-scheduled-race" };
    const payload = run.career.scheduledRace;
    const occurrence = occurrenceFor(run, payload.eraOccurrenceId);
    if (!occurrence || isSettled(run, occurrence.id)) return { type: "ignored", reason: "already-settled" };
    const sameWindowRegistration = !!(occurrence.freeRace
      && occurrence.calendarWindowId
      && payload.schedule
      && payload.schedule.index === run.career.currentTime.index);
    if (!payload.schedule || payload.schedule.index < run.career.currentTime.index
      || (payload.schedule.index === run.career.currentTime.index && !sameWindowRegistration)) {
      return { type: "ignored", reason: "expired-schedule" };
    }
    run.career.scheduledRace = null;
    run.career.lastRaceCancelIndex = run.career.currentTime.index;
    if (occurrence.routeGroup && run.era.routes[occurrence.routeGroup] === occurrence.id) {
      delete run.era.routes[occurrence.routeGroup];
      run.era.routeExcludedOccurrences = run.era.routeExcludedOccurrences.filter((occurrenceId) => {
        const candidate = occurrenceFor(run, occurrenceId);
        return !candidate || candidate.routeGroup !== occurrence.routeGroup;
      });
    }
    if (occurrence.routeChoice && run.era.routes[occurrence.routeChoice.key] === occurrence.routeChoice.value) {
      delete run.era.routes[occurrence.routeChoice.key];
    }
    if (occurrence.id === "1997-radio-tampa") {
      run.era.routes.twoYearFinal = "asahi-declined";
      if (!run.era.routeExcludedOccurrences.includes("1997-asahi")) run.era.routeExcludedOccurrences.push("1997-asahi");
    }
    if (occurrence.freeRace && occurrence.calendarWindowId) {
      const calendar = ensureTwoYearCalendar(run);
      if (calendar.windowChoices[occurrence.calendarWindowId] === occurrence.id) {
        delete calendar.windowChoices[occurrence.calendarWindowId];
      }
    }
    const narrative = ensureNarrative(run);
    const sourceNodeId = payload.registrationSource && payload.registrationSource.nodeId;
    if (sourceNodeId) {
      narrative.reopenedDecisionNodes[sourceNodeId] = Number(narrative.reopenedDecisionNodes[sourceNodeId] || 0) + 1;
    }
    narrative.turnRevision += 1;
    narrative.pendingScenes = narrative.pendingScenes.filter((scene) => !["idle-time", "forced-rest"].includes(scene.sourceKind));
    recordEvent(run, {
      eventType: "race-cancelled",
      occurrenceId: occurrence.id,
      raceInstanceId: payload.raceInstanceId || `${occurrence.id}:${payload.schedule.index}`,
      historicalDate: historicalDateFromTime(run),
      details: { registrationSource: clonePlain(payload.registrationSource || null) }
    }, `race-cancelled:${payload.raceInstanceId || `${occurrence.id}:${payload.schedule.index}`}`);
    syncNarrative(run);
    return { type: "race-cancelled", occurrenceId: occurrence.id, sourceNodeId: sourceNodeId || "" };
  }

  function finishLabel(rank, retired) {
    if (retired) return "退赛";
    if (!Number.isFinite(rank)) return "着外";
    return `${rank}着`;
  }

  function resultClass(rank, retired) {
    if (!retired && rank === 1) return "win";
    if (!retired && (rank === 2 || rank === 3)) return "close";
    return "loss";
  }

  function opponentIndexForKey(key) {
    if (key === "opponent") return 0;
    const match = String(key || "").match(/^field-(\d+)$/);
    return match ? Number(match[1]) : -1;
  }

  function actualWinner(run, payload, result, occurrence) {
    const ordered = result.hidden && Array.isArray(result.hidden.fieldResults)
      ? result.hidden.fieldResults
      : (result.hidden && Array.isArray(result.hidden.results) ? result.hidden.results : []);
    const winner = ordered.find((item) => !item.retired) || ordered[0];
    if (!winner || !winner.entry) return occurrence.historicalWinnerId;
    if (winner.entry.key === "player") return "player";
    const index = opponentIndexForKey(winner.entry.key);
    if (payload.opponents[index]) return payload.opponents[index].horseId;
    if (index === 0 && payload.opponent) return payload.opponent.horseId || payload.opponent.id;
    return occurrence.historicalWinnerId;
  }

  function updateRivalRecords(run, occurrence, result) {
    const ordered = result.hidden && Array.isArray(result.hidden.fieldResults) ? result.hidden.fieldResults : [];
    const player = ordered.find((item) => item.entry && item.entry.key === "player");
    if (!player) return;
    const playerPosition = ordered.indexOf(player) + 1;
    const scenario = scenarioFor(run);
    scenario.primaryRivalIds.forEach((horseId) => {
      const opponentIndex = occurrence.opponents.findIndex((entry) => entry.horseId === horseId);
      if (opponentIndex < 0) return;
      const key = opponentIndex === 0 ? "opponent" : `field-${opponentIndex}`;
      const rival = ordered.find((item) => item.entry && item.entry.key === key);
      if (!rival) return;
      const rivalPosition = ordered.indexOf(rival) + 1;
      const record = run.era.rivalRecords[horseId];
      record.meetings += 1;
      if (playerPosition < rivalPosition) record.playerAhead += 1;
      else if (playerPosition > rivalPosition) record.rivalAhead += 1;
      else record.ties += 1;
    });
  }

  function addNewsAndChronicle(run, occurrence, classification, tokens, resultRecord) {
    const text = occurrence.text || {};
    const newsTextId = text.news && text.news[classification] ? text.news[classification] : text.fallback;
    const chronicleTextId = text.chronicle && text.chronicle[classification] ? text.chronicle[classification] : text.fallback;
    if (!run.era.news.some((item) => item.occurrenceId === occurrence.id)) {
      run.era.news.push({
        id: `news-${occurrence.id}`,
        textId: newsTextId,
        time: occurrence.date,
        nature: classification === "absent" ? "historical" : "alternate",
        occurrenceId: occurrence.id,
        raceId: occurrence.raceId || (occurrence.raceSnapshot && occurrence.raceSnapshot.id) || "",
        tokens: { ...tokens },
        textSlots: { title: newsTextId, lead: newsTextId, background: "", analysis: "", outlook: "" },
        read: false
      });
    }
    if (!run.era.chronicle.some((item) => item.occurrenceId === occurrence.id)) {
      run.era.chronicle.push({
        id: `chronicle-${occurrence.id}`,
        textId: chronicleTextId,
        time: occurrence.date,
        historicalStatus: classification === "absent"
          ? "旁观历史"
          : (resultRecord.divergenceKind === "historical-continuation" ? "史实主线延续" : "历史分歧"),
        occurrenceId: occurrence.id,
        raceId: occurrence.raceId || (occurrence.raceSnapshot && occurrence.raceSnapshot.id) || "",
        playerFinish: resultRecord.playerFinish,
        actualWinnerId: resultRecord.actualWinnerId,
        historicalWinnerId: resultRecord.historicalWinnerId,
        tokens: { ...tokens }
      });
    }
  }

  function markOccurrenceComplete(run, occurrence) {
    if (!run.era.completedOccurrences.includes(occurrence.id)) run.era.completedOccurrences.push(occurrence.id);
  }

  function settleKeyRace(run, payload, result) {
    const occurrence = occurrenceFor(run, payload.eraOccurrenceId);
    if (!occurrence || !occurrence.keyRace || run.era.keyRaceResults[occurrence.id]) return null;
    const playerFinish = result.hidden && Number.isFinite(result.hidden.playerFieldPosition)
      ? result.hidden.playerFieldPosition
      : result.public.rank;
    const classification = resultClass(playerFinish, result.public.retired);
    const winnerId = actualWinner(run, payload, result, occurrence);
    const divergenceKind = winnerId === occurrence.historicalWinnerId
      ? "historical-continuation"
      : (winnerId === "player" ? "player-divergence" : "rival-divergence");
    const scenario = scenarioFor(run);
    const winnerName = winnerId === "player" ? run.career.horse.name : horseName(scenario, winnerId);
    const tokens = baseTokens(run, occurrence, {
      ACTUAL_WINNER_NAME: winnerName,
      PLAYER_FINISH: finishLabel(playerFinish, result.public.retired)
    });
    const record = {
      occurrenceId: occurrence.id,
      raceId: occurrence.raceId,
      date: occurrence.date,
      playerFinish: Number.isFinite(playerFinish) ? playerFinish : null,
      playerRetired: !!result.public.retired,
      actualWinnerId: winnerId,
      historicalWinnerId: occurrence.historicalWinnerId,
      classification,
      divergenceKind,
      tokens: { ...tokens },
      settledAtIndex: run.career.currentTime.index
    };
    run.era.keyRaceResults[occurrence.id] = record;
    if (!run.era.completedKeyRaces.includes(occurrence.id)) run.era.completedKeyRaces.push(occurrence.id);
    if (classification === "win") run.era.classicWins += 1;
    if (classification !== "win") run.era.tripleCrownPossible = false;
    if (divergenceKind !== "historical-continuation") {
      run.era.divergenceFlags.push({ occurrenceId: occurrence.id, type: divergenceKind, actualWinnerId: winnerId });
    }
    updateRivalRecords(run, occurrence, result);
    const postTextId = occurrence.text.post[classification] || occurrence.text.fallback;
    queueStory(run, postTextId, tokens);
    if (classification === "win" && occurrence.chapterId !== "kikka") {
      queueStory(run, "jp.golden-road.main.1998.season.triple-alive", tokens);
    } else if (!run.era.tripleCrownPossible && occurrence.chapterId !== "kikka") {
      queueStory(run, "jp.golden-road.main.1998.season.triple-lost", tokens);
    }
    addNewsAndChronicle(run, occurrence, classification, tokens, record);
    markOccurrenceComplete(run, occurrence);
    recordEvent(run, {
      eventType: "race-result",
      occurrenceId: occurrence.id,
      raceInstanceId: payload.raceInstanceId || `${occurrence.id}:${payload.schedule.index}`,
      historicalDate: occurrence.date,
      playerFinish: record.playerFinish,
      playerRetired: record.playerRetired,
      actualWinnerId: record.actualWinnerId,
      historicalWinnerId: record.historicalWinnerId,
      worldlineKind: record.divergenceKind,
      keyRace: true,
      details: { raceName: occurrence.nameZh, scenarioId: run.scenarioId }
    }, `race-result:${payload.raceInstanceId || `${occurrence.id}:${payload.schedule.index}`}`);
    return record;
  }

  function injuryAtIndex(run, index) {
    return (run.career.injury && run.career.injury.history || []).some((injury) => {
      const start = Number.isFinite(injury.startIndex) ? injury.startIndex : -1;
      const end = Number.isFinite(injury.restUntilIndex) ? injury.restUntilIndex : (injury.forcedRetirement ? Infinity : start);
      return start <= index && end > index;
    });
  }

  function absenceReasonForOccurrence(run, occurrence) {
    const index = occurrenceSchedule(occurrence).index;
    if (run.career.forcedRetirement || injuryAtIndex(run, index)) return "injury";
    if ((run.era.voluntaryAbsences || []).includes(occurrence.id)) return "voluntary";
    return "schedule";
  }

  function winnerDisplayName(run, payload, winnerId) {
    if (winnerId === "player") return run.career.horse.name;
    const scenario = scenarioFor(run);
    const known = horseProfile(scenario, winnerId);
    if (known) return horseName(scenario, winnerId);
    if (payload.opponent && (payload.opponent.horseId === winnerId || payload.opponent.id === winnerId)) {
      return payload.opponent.displayNameZh || payload.opponent.displayName || payload.opponent.name || "同世代对手";
    }
    return "同世代对手";
  }

  function settleImportantTwoYear(run, payload, result) {
    const occurrence = occurrenceFor(run, payload.eraOccurrenceId);
    if (!occurrence || !occurrence.importantTwoYear || run.era.twoYearResults[occurrence.id]) return null;
    const playerFinish = result.hidden && Number.isFinite(result.hidden.playerFieldPosition)
      ? result.hidden.playerFieldPosition
      : result.public.rank;
    const classification = resultClass(playerFinish, result.public.retired);
    const winnerId = actualWinner(run, payload, result, occurrence);
    const divergenceKind = winnerId === occurrence.historicalWinnerId
      ? "historical-continuation"
      : (winnerId === "player" ? "player-divergence" : "rival-divergence");
    const tokens = baseTokens(run, occurrence, {
      ACTUAL_WINNER_NAME: winnerDisplayName(run, payload, winnerId),
      PLAYER_FINISH: finishLabel(playerFinish, result.public.retired)
    });
    const record = {
      occurrenceId: occurrence.id,
      raceId: occurrence.raceId || occurrence.raceSnapshot.id,
      date: occurrence.date,
      playerFinish: Number.isFinite(playerFinish) ? playerFinish : null,
      playerRetired: !!result.public.retired,
      actualWinnerId: winnerId,
      historicalWinnerId: occurrence.historicalWinnerId,
      classification,
      divergenceKind,
      tokens: { ...tokens },
      settledAtIndex: run.career.currentTime.index
    };
    run.era.twoYearResults[occurrence.id] = record;
    if (divergenceKind !== "historical-continuation") {
      run.era.divergenceFlags.push({ occurrenceId: occurrence.id, type: divergenceKind, actualWinnerId: winnerId });
    }
    queueStory(run, occurrence.text.post[classification] || occurrence.text.fallback, tokens);
    addNewsAndChronicle(run, occurrence, classification, tokens, record);
    markOccurrenceComplete(run, occurrence);
    recordEvent(run, {
      eventType: "race-result",
      occurrenceId: occurrence.id,
      raceInstanceId: payload.raceInstanceId || `${occurrence.id}:${payload.schedule.index}`,
      historicalDate: occurrence.date,
      playerFinish: record.playerFinish,
      playerRetired: record.playerRetired,
      actualWinnerId: record.actualWinnerId,
      historicalWinnerId: record.historicalWinnerId,
      worldlineKind: record.divergenceKind,
      importantTwoYear: true,
      details: { raceName: occurrence.nameZh, scenarioId: run.scenarioId }
    }, `race-result:${payload.raceInstanceId || `${occurrence.id}:${payload.schedule.index}`}`);
    return record;
  }

  function settleMissedImportantTwoYear(run, occurrence) {
    if (!occurrence.importantTwoYear || run.era.twoYearResults[occurrence.id]) return null;
    const scenario = scenarioFor(run);
    const reason = absenceReasonForOccurrence(run, occurrence);
    const tokens = baseTokens(run, occurrence, {
      ACTUAL_WINNER_NAME: horseName(scenario, occurrence.historicalWinnerId),
      PLAYER_FINISH: "未参赛"
    });
    const record = {
      occurrenceId: occurrence.id,
      raceId: occurrence.raceId || occurrence.raceSnapshot.id,
      date: occurrence.date,
      playerFinish: null,
      playerRetired: false,
      actualWinnerId: occurrence.historicalWinnerId,
      historicalWinnerId: occurrence.historicalWinnerId,
      classification: "absent",
      divergenceKind: "historical-continuation",
      absenceReason: reason,
      tokens: { ...tokens },
      settledAtIndex: run.career.currentTime.index
    };
    run.era.twoYearResults[occurrence.id] = record;
    queueStory(run, occurrence.text.post.absent || occurrence.text.fallback, tokens);
    addNewsAndChronicle(run, occurrence, "absent", tokens, record);
    markOccurrenceComplete(run, occurrence);
    recordEvent(run, {
      eventType: "race-absent",
      occurrenceId: occurrence.id,
      raceInstanceId: `${occurrence.id}:${occurrenceSchedule(occurrence).index}`,
      historicalDate: occurrence.date,
      actualWinnerId: occurrence.historicalWinnerId,
      historicalWinnerId: occurrence.historicalWinnerId,
      worldlineKind: "historical-continuation",
      absenceReason: reason,
      importantTwoYear: true,
      interruptedPlannedRace: reason === "injury",
      details: { raceName: occurrence.nameZh, scenarioId: run.scenarioId }
    }, `race-absent:${occurrence.id}:${occurrenceSchedule(occurrence).index}`);
    return record;
  }

  function settleMissedKeyRace(run, occurrence) {
    if (!occurrence.keyRace || run.era.keyRaceResults[occurrence.id]) return null;
    const scenario = scenarioFor(run);
    const tokens = baseTokens(run, occurrence, {
      ACTUAL_WINNER_NAME: horseName(scenario, occurrence.historicalWinnerId),
      PLAYER_FINISH: "未参赛"
    });
    const record = {
      occurrenceId: occurrence.id,
      raceId: occurrence.raceId,
      date: occurrence.date,
      playerFinish: null,
      playerRetired: false,
      actualWinnerId: occurrence.historicalWinnerId,
      historicalWinnerId: occurrence.historicalWinnerId,
      classification: "absent",
      divergenceKind: "historical-continuation",
      tokens: { ...tokens },
      settledAtIndex: run.career.currentTime.index
    };
    run.era.keyRaceResults[occurrence.id] = record;
    run.era.missedKeyRaces.push(occurrence.id);
    run.era.tripleCrownPossible = false;
    queueStory(run, occurrence.text.post.absent || occurrence.text.fallback, tokens);
    if (occurrence.chapterId !== "kikka") queueStory(run, "jp.golden-road.main.1998.season.triple-lost", tokens);
    addNewsAndChronicle(run, occurrence, "absent", tokens, record);
    markOccurrenceComplete(run, occurrence);
    recordEvent(run, {
      eventType: "race-absent",
      occurrenceId: occurrence.id,
      raceInstanceId: `${occurrence.id}:${occurrenceSchedule(occurrence).index}`,
      historicalDate: occurrence.date,
      actualWinnerId: occurrence.historicalWinnerId,
      historicalWinnerId: occurrence.historicalWinnerId,
      worldlineKind: "historical-continuation",
      absenceReason: absenceReasonForOccurrence(run, occurrence),
      keyRace: true,
      interruptedPlannedRace: absenceReasonForOccurrence(run, occurrence) === "injury",
      details: { raceName: occurrence.nameZh, scenarioId: run.scenarioId }
    }, `race-absent:${occurrence.id}:${occurrenceSchedule(occurrence).index}`);
    return record;
  }

  function updateChapter(run) {
    if (!onboardingComplete(run)) {
      run.era.currentChapter = "prologue";
      run.era.currentObjective = run.era.onboarding && run.era.onboarding.namingComplete
        ? "确认你与赛马的1997二岁赛季"
        : "完成与候选马的初次相遇";
      return;
    }
    if (run.era.endingId) {
      run.era.currentChapter = "summary";
      run.era.currentObjective = "查看1998经典赛季年度总结";
      return;
    }
    if (run.era.stageState && run.era.stageState.status === "ending-pending") {
      run.era.currentChapter = "ending";
      run.era.currentObjective = "完成年度结局场景后查看总结";
      return;
    }
    if (currentYear(run) < 1998) {
      run.era.currentChapter = "two-year-prologue";
      run.era.currentObjective = "完成1997二岁前章并确定进入三岁春季的履历";
      return;
    }
    const scenario = scenarioFor(run);
    const next = scenario.occurrences
      .filter((occurrence) => occurrence.keyRace && !run.era.keyRaceResults[occurrence.id])
      .sort((left, right) => occurrenceSchedule(left).index - occurrenceSchedule(right).index)[0];
    run.era.currentChapter = next ? next.chapterId : "summary";
    run.era.currentObjective = next ? `准备${next.nameZh}（${next.date}）` : "完成1998年度总结";
  }

  function bestFinish(run) {
    const finishes = Object.values(run.era.keyRaceResults)
      .map((record) => record.playerFinish)
      .filter(Number.isFinite);
    return finishes.length ? Math.min(...finishes) : null;
  }

  function finalizeStage(run, explicitEnding) {
    if (run.era.endingId) return run.era.summary;
    if (run.era.stageState && run.era.stageState.status === "ending-pending") return run.era.pendingSummary;
    let endingId = explicitEnding || "";
    if (!endingId) {
      if (run.era.missedKeyRaces.length > 0) endingId = "absent";
      else if (run.era.classicWins === 3) endingId = "triple";
      else if (run.era.classicWins > 0) endingId = "partial";
      else endingId = "none";
    }
    const scenario = scenarioFor(run);
    const best = bestFinish(run);
    const summary = {
      endingId,
      participated: Object.values(run.era.keyRaceResults).filter((record) => record.classification !== "absent").length,
      classicWins: run.era.classicWins,
      bestFinish: best,
      tripleCrown: run.era.classicWins === 3,
      missedRaces: run.era.missedKeyRaces.length,
      divergenceCount: run.era.divergenceFlags.length,
      results: Object.values(run.era.keyRaceResults).map((record) => ({ ...record }))
    };
    const tokens = baseTokens(run, null, {
      CLASSIC_WINS: String(summary.classicWins),
      BEST_FINISH: best ? `${best}着` : "无",
      MISSED_RACES: String(summary.missedRaces),
      DIVERGENCE_COUNT: String(summary.divergenceCount)
    });
    run.era.endingTextId = scenario.endingTextIds[endingId];
    run.era.endingTokens = { ...tokens };
    run.era.pendingSummary = summary;
    run.era.stageState = { status: "ending-pending", pendingEndingId: endingId, summaryVisible: false };
    const narrative = ensureNarrative(run);
    narrative.turnRevision += 1;
    narrative.pendingScenes = narrative.pendingScenes.filter((scene) => !["idle-time", "forced-rest"].includes(scene.sourceKind));
    if (!explicitEnding && run.era.keyRaceResults["1998-kikka"]) {
      queueStory(run, "jp.golden-road.main.1998.season.review", tokens);
    }
    queueStory(run, run.era.endingTextId, tokens);
    updateChapter(run);
    return summary;
  }

  function commitStageEnding(run) {
    if (!run || !run.era || !run.era.stageState || run.era.stageState.status !== "ending-pending") {
      return run && run.era ? run.era.summary : null;
    }
    const endingId = run.era.stageState.pendingEndingId;
    run.era.endingId = endingId;
    run.era.summary = clonePlain(run.era.pendingSummary);
    run.era.pendingSummary = null;
    run.era.stageState = { status: "complete", pendingEndingId: "", summaryVisible: true };
    recordEvent(run, {
      eventType: "stage-ending",
      routeValue: endingId,
      historicalDate: historicalDateFromTime(run)
    }, `stage-ending:${endingId}`);
    updateChapter(run);
    return run.era.summary;
  }

  function settleCrossedKeyRaces(run) {
    const scenario = scenarioFor(run);
    const currentIndex = run.career.currentTime.index;
    scenario.occurrences.forEach((occurrence) => {
      const schedule = occurrenceSchedule(occurrence);
      if (occurrence.keyRace && schedule.index < currentIndex && !run.era.keyRaceResults[occurrence.id]) {
        settleMissedKeyRace(run, occurrence);
        if (occurrence.chapterId === "kikka") {
          const resting = ns.CareerRules.isResting(run.career);
          finalizeStage(run, resting ? "injury" : "");
        }
      }
      if (occurrence.importantTwoYear
        && schedule.index < currentIndex
        && !run.era.twoYearResults[occurrence.id]
        && run.era.routes[occurrence.routeGroup] === occurrence.id
        && !run.era.routeExcludedOccurrences.includes(occurrence.id)) {
        settleMissedImportantTwoYear(run, occurrence);
      }
    });
    run.era.historicalYear = currentYear(run);
    updateChapter(run);
  }

  function completeRace(run, payload) {
    if (!run || !onboardingComplete(run)) return { type: "onboarding" };
    const occurrence = occurrenceFor(run, payload.eraOccurrenceId);
    if (!occurrence || isSettled(run, occurrence.id)) return { type: "ignored", reason: "already-settled" };
    if (injuryAtIndex(run, payload.schedule.index) || run.career.forcedRetirement) {
      run.career.scheduledRace = null;
      if (occurrence.keyRace) settleMissedKeyRace(run, occurrence);
      else if (occurrence.importantTwoYear) settleMissedImportantTwoYear(run, occurrence);
      else {
        markOccurrenceComplete(run, occurrence);
        recordEvent(run, {
          eventType: "race-absent",
          occurrenceId: occurrence.id,
          raceInstanceId: payload.raceInstanceId || `${occurrence.id}:${payload.schedule.index}`,
          historicalDate: occurrence.date,
          absenceReason: "injury",
          interruptedPlannedRace: true,
          details: { raceName: occurrence.nameZh, scenarioId: run.scenarioId }
        }, `race-absent:${payload.raceInstanceId || `${occurrence.id}:${payload.schedule.index}`}`);
      }
      ensureNarrative(run).turnRevision += 1;
      if (run.career.forcedRetirement) {
        run.era.injuryInterrupted = true;
        if (!run.career.retired) ns.CareerRules.retire(run.career, run.career.forcedRetirementReason || "因伤提前退役");
        recordEvent(run, { eventType: "retirement", historicalDate: occurrence.date, details: { reason: "injury" } }, "retirement:injury");
        finalizeStage(run, "injury");
      } else if (occurrence.chapterId === "kikka") {
        finalizeStage(run, "injury");
      }
      return { type: "race-absent", occurrence, reason: "injury" };
    }
    if (!payload.preRaceCondition && ns.RaceFatigueRules && ns.RaceFatigueRules.lockPreRaceCondition) {
      ns.RaceFatigueRules.lockPreRaceCondition(run.career, payload);
    }
    ns.CareerRules.advanceToSchedule(run.career, payload.schedule);
    const maturity = ns.MaturityRules.evaluate(
      run.career.horse,
      run.career.currentTime,
      run.career.maturity.decline
    );
    const result = ns.RaceRules.simulateRace(run.career.horse, payload.race, {
      opponent: payload.opponent,
      opponents: payload.opponents || [],
      gameMode: "era",
      playerJockey: run.career.playerJockey,
      currentTime: run.career.currentTime,
      maturityDecline: run.career.maturity.decline,
      maturity,
      preRaceCondition: payload.preRaceCondition || null
    });
    result.hidden.eraOccurrenceId = occurrence.id;
    ns.CareerRules.addRace(run.career, result, payload.schedule);
    run.career.scheduledRace = null;
    markOccurrenceComplete(run, occurrence);
    const keyRecord = occurrence.keyRace ? settleKeyRace(run, payload, result) : null;
    const twoYearRecord = occurrence.importantTwoYear ? settleImportantTwoYear(run, payload, result) : null;
    if (!occurrence.keyRace && !occurrence.importantTwoYear) {
      const playerFinish = result.hidden && Number.isFinite(result.hidden.playerFieldPosition)
        ? result.hidden.playerFieldPosition
        : result.public.rank;
      const winnerId = actualWinner(run, payload, result, occurrence);
      recordEvent(run, {
        eventType: "race-result",
        occurrenceId: occurrence.id,
        raceInstanceId: payload.raceInstanceId || `${occurrence.id}:${payload.schedule.index}`,
        historicalDate: occurrence.date,
        playerFinish,
        playerRetired: !!result.public.retired,
        actualWinnerId: winnerId,
        historicalWinnerId: occurrence.historicalWinnerId || null,
        worldlineKind: occurrence.historicalWinnerId
          ? (winnerId === occurrence.historicalWinnerId ? "historical-continuation" : (winnerId === "player" ? "player-divergence" : "rival-divergence"))
          : null,
        details: { raceName: occurrence.nameZh, scenarioId: run.scenarioId }
      }, `race-result:${payload.raceInstanceId || `${occurrence.id}:${payload.schedule.index}`}`);
    }
    if (result.hidden && result.hidden.injury) {
      const injury = result.hidden.injury;
      recordEvent(run, {
        eventType: "injury-start",
        occurrenceId: occurrence.id,
        historicalDate: occurrence.date,
        interruptedPlannedRace: !!injury.forcedRetirement,
        details: { reason: injury.reason, restUntilIndex: injury.restUntilIndex, forcedRetirement: !!injury.forcedRetirement }
      }, `injury-start:${occurrence.id}:${payload.schedule.index}`);
    }
    ensureNarrative(run).turnRevision += 1;
    if (run.career.forcedRetirement) {
      run.era.injuryInterrupted = true;
      ns.CareerRules.retire(run.career, run.career.forcedRetirementReason || "因伤提前退役");
      recordEvent(run, { eventType: "retirement", historicalDate: occurrence.date, details: { reason: "injury" } }, "retirement:injury");
      finalizeStage(run, "injury");
    } else if (occurrence.chapterId === "kikka") {
      finalizeStage(run);
    }
    updateChapter(run);
    return { type: "race", occurrence, result, keyRecord, twoYearRecord };
  }

  function advanceTurn(run) {
    if (!run || run.era.endingId || run.career.retired) return { type: "ended" };
    if (!onboardingComplete(run)) return { type: "onboarding" };
    const scheduled = run.career.scheduledRace;
    if (scheduled && run.career.currentTime.index >= scheduled.schedule.index) {
      return completeRace(run, scheduled);
    }
    const next = ns.TimeRules.nextTurn(run.career.currentTime);
    const activeBefore = run.career.injury && run.career.injury.active ? clonePlain(run.career.injury.active) : null;
    ns.CareerRules.advanceToTime(run.career, next);
    if (activeBefore && !(run.career.injury && run.career.injury.active)) {
      recordEvent(run, {
        eventType: "injury-recovery",
        historicalDate: historicalDateFromTime(run),
        details: { reason: activeBefore.reason || null }
      }, `injury-recovery:${activeBefore.startIndex}:${next.index}`);
      ensureNarrative(run).turnRevision += 1;
    }
    settleCrossedKeyRaces(run);
    if (run.era.endingId) return { type: "ending", summary: run.era.summary };
    if (run.career.scheduledRace && run.career.currentTime.index >= run.career.scheduledRace.schedule.index) {
      return completeRace(run, run.career.scheduledRace);
    }
    return { type: "turn", currentTime: run.career.currentTime };
  }

  function retire(run) {
    if (!run || run.era.endingId || !onboardingComplete(run)) return null;
    run.era.earlyRetirement = true;
    ns.CareerRules.retire(run.career, "玩家选择提前退役");
    recordEvent(run, { eventType: "retirement", historicalDate: historicalDateFromTime(run), details: { reason: "voluntary" } }, "retirement:voluntary");
    return finalizeStage(run, "retired");
  }

  function readNews(run, newsId) {
    const item = run.era.news.find((news) => news.id === newsId);
    if (!item) return false;
    item.read = true;
    return true;
  }

  function getNewspaperItems(run) {
    if (!run || !run.era) return [];
    return (run.era.news || [])
      .map((item) => clonePlain(item))
      .sort((left, right) => String(right.time || "").localeCompare(String(left.time || "")));
  }

  function detachOrdinaryNewsScenes(run) {
    const narrative = ensureNarrative(run);
    const isOrdinaryNews = (scene) => scene && (
      scene.sourceKind === "news" || String(scene.id || "").startsWith("news:")
    );
    narrative.pendingScenes = narrative.pendingScenes.filter((scene) => !isOrdinaryNews(scene));
    narrative.timeline = narrative.timeline.filter((scene) => !isOrdinaryNews(scene));
    narrative.resolvedSceneIds = narrative.resolvedSceneIds.filter((id) => !String(id || "").startsWith("news:"));
    if (String(narrative.currentSceneId || "").startsWith("news:")) narrative.currentSceneId = "";
  }

  function migrateLegacyEvents(run) {
    recordEvent(run, {
      eventType: "career-start",
      historicalDate: null,
      recordQuality: "legacy_unrecorded"
    }, "legacy:career-start");
    Object.values(run.era.keyRaceResults || {}).forEach((record) => {
      const occurrence = occurrenceFor(run, record.occurrenceId);
      recordEvent(run, {
        eventType: record.classification === "absent" ? "race-absent" : "race-result",
        occurrenceId: record.occurrenceId,
        raceInstanceId: occurrence ? `${occurrence.id}:${occurrenceSchedule(occurrence).index}` : null,
        historicalDate: record.date || (occurrence && occurrence.date) || null,
        playerFinish: record.playerFinish,
        playerRetired: record.playerRetired,
        actualWinnerId: record.actualWinnerId,
        historicalWinnerId: record.historicalWinnerId,
        worldlineKind: record.divergenceKind,
        absenceReason: record.classification === "absent" ? (record.absenceReason || "schedule") : null,
        keyRace: true,
        details: { raceName: occurrence ? occurrence.nameZh : null, scenarioId: run.scenarioId }
      }, `legacy:key:${record.occurrenceId}`);
    });
    (run.career.races || []).forEach((record, index) => {
      const occurrenceId = record.hidden && record.hidden.eraOccurrenceId;
      const occurrence = occurrenceId ? occurrenceFor(run, occurrenceId) : null;
      if (occurrenceId && (run.era.events || []).some((event) => event.occurrenceId === occurrenceId)) return;
      const schedule = record.hidden && record.hidden.schedule;
      recordEvent(run, {
        eventType: "race-result",
        occurrenceId: occurrenceId || null,
        raceInstanceId: occurrenceId && schedule ? `${occurrenceId}:${schedule.index}` : `legacy-race:${index}`,
        historicalDate: occurrence ? occurrence.date : null,
        careerAge: schedule && schedule.age,
        careerMonth: schedule && schedule.month,
        careerHalf: schedule && schedule.half,
        playerFinish: record.public && record.public.rank,
        playerRetired: !!(record.public && record.public.retired),
        keyRace: !!(occurrence && occurrence.keyRace),
        importantTwoYear: !!(occurrence && occurrence.importantTwoYear),
        details: { raceName: record.public && record.public.raceName || (occurrence && occurrence.nameZh) || null, scenarioId: run.scenarioId }
      }, `legacy:race:${occurrenceId || index}`);
    });
    (run.career.injury && run.career.injury.history || []).forEach((injury, index) => {
      recordEvent(run, {
        eventType: "injury-start",
        historicalDate: null,
        interruptedPlannedRace: !!injury.forcedRetirement,
        details: { reason: injury.reason || null, restUntilIndex: injury.restUntilIndex || null }
      }, `legacy:injury:${index}`);
    });
    if (run.career.retired) {
      recordEvent(run, {
        eventType: "retirement",
        historicalDate: null,
        details: { reason: run.career.retirementReason || null }
      }, "legacy:retirement");
    }
  }

  function migrateV4Calendar(run) {
    const scenario = scenarioFor(run);
    const calendar = ensureTwoYearCalendar(run);
    const scheduledId = run.career.scheduledRace && run.career.scheduledRace.eraOccurrenceId;
    (scenario.twoYearCalendarWindows || []).forEach((window) => {
      if (calendar.windowChoices[window.id]) return;
      const selectedId = (window.occurrenceIds || []).find((occurrenceId) => isSettled(run, occurrenceId) || scheduledId === occurrenceId);
      if (selectedId) calendar.windowChoices[window.id] = selectedId;
      else {
        const decisionIndex = careerTimeFromHistoricalDate(run, window.decisionDate).index;
        if (decisionIndex < run.career.currentTime.index && !calendar.migratedExpiredWindowIds.includes(window.id)) {
          calendar.migratedExpiredWindowIds.push(window.id);
        }
      }
    });
    const oldFinalRoute = run.era.routes["1997-year-end"];
    if (!run.era.routes.twoYearFinal && oldFinalRoute === "1997-asahi") run.era.routes.twoYearFinal = "asahi";
    if (!run.era.routes.twoYearFinal && oldFinalRoute === "1997-radio-tampa") run.era.routes.twoYearFinal = "radio";

    const obsoleteNodeIds = new Set([
      "1997-08-debut-route",
      "1997-10-prep-route",
      "1997-11-late-debut-route",
      "1997-11-year-end-route"
    ]);
    const narrative = ensureNarrative(run);
    narrative.pendingScenes = narrative.pendingScenes.filter((scene) => {
      if (!obsoleteNodeIds.has(scene.nodeId)) return true;
      if (scene.createdAtIndex < run.career.currentTime.index) {
        scene.status = "migrated-expired";
        narrative.timeline.push(scene);
        if (!narrative.resolvedSceneIds.includes(scene.id)) narrative.resolvedSceneIds.push(scene.id);
      }
      return false;
    });

    const definition = scenario.twoYearOpinion;
    if (definition) {
      const opinionIndex = careerTimeFromHistoricalDate(run, definition.date).index;
      if (run.career.currentTime.index >= opinionIndex && !calendar.opinionSnapshot) {
        evaluateTwoYearOpinion(run, { migrated: true });
      }
    }
  }

  function normalizeSave(savedRun) {
    if (!savedRun || ![1, 2, 3, 4, RUN_VERSION].includes(savedRun.version)) throw new Error("Unsupported era save version.");
    const previousVersion = savedRun.version;
    const scenario = scenarioFor(savedRun);
    if (!savedRun.career || !savedRun.career.horse || !savedRun.era) throw new Error("Incomplete era save.");
    savedRun.career.gameMode = "era";
    savedRun.career.horse.gameMode = "era";
    if (!savedRun.career.currentTime) throw new Error("Era save has no current time.");
    if (!Array.isArray(savedRun.career.races)) savedRun.career.races = [];
    if (!savedRun.career.injury) savedRun.career.injury = { active: null, history: [] };
    if (!Array.isArray(savedRun.career.injury.history)) savedRun.career.injury.history = [];
    if (!savedRun.career.maturity) {
      savedRun.career.maturity = { decline: 0, lastCheckedIndex: savedRun.career.currentTime.index, events: [] };
    }
    applyPlayerComments(savedRun.career, scenario.playerTemplate, false);
    const era = savedRun.era;
    era.playerReference = safePlayerReference(era.playerReference);
    ["completedOccurrences", "completedKeyRaces", "missedKeyRaces", "completedStoryIds", "pendingStories", "storyHistory", "news", "chronicle", "divergenceFlags", "events", "routeExcludedOccurrences", "voluntaryAbsences"].forEach((key) => {
      if (!Array.isArray(era[key])) era[key] = [];
    });
    if (!era.keyRaceResults || typeof era.keyRaceResults !== "object") era.keyRaceResults = {};
    if (!era.twoYearResults || typeof era.twoYearResults !== "object") era.twoYearResults = {};
    if (!era.routes || typeof era.routes !== "object") era.routes = {};
    if (!era.rivalRecords || typeof era.rivalRecords !== "object") era.rivalRecords = {};
    scenario.primaryRivalIds.forEach((horseId) => {
      if (!era.rivalRecords[horseId]) era.rivalRecords[horseId] = { meetings: 0, playerAhead: 0, rivalAhead: 0, ties: 0 };
    });
    era.nextEventNumber = Number.isFinite(era.nextEventNumber) ? era.nextEventNumber : 1;
    era.nextEventSequence = Number.isFinite(era.nextEventSequence) ? era.nextEventSequence : 1;
    era.classicWins = Number.isFinite(era.classicWins) ? era.classicWins : 0;
    era.tripleCrownPossible = era.tripleCrownPossible !== false;
    era.entryCandidateId = String(era.entryCandidateId || "");
    if (previousVersion < 4 || !era.onboarding || typeof era.onboarding !== "object") {
      era.onboarding = {
        phase: "complete",
        step: (scenario.encounterNodes || []).length,
        namingComplete: true
      };
    }
    const narrative = ensureNarrative(savedRun);
    narrative.pendingScenes.concat(narrative.timeline).forEach((scene) => {
      if (!scene.textSlots || typeof scene.textSlots !== "object") scene.textSlots = { base: scene.textId };
      if (!scene.tokensSnapshot || typeof scene.tokensSnapshot !== "object") scene.tokensSnapshot = clonePlain(scene.tokens || {});
      if (!scene.narrativeSnapshot || typeof scene.narrativeSnapshot !== "object") {
        scene.narrativeSnapshot = { twoYearProfile: previousVersion < 4 ? "legacy_unrecorded" : (era.twoYearProfile || "two_year_unproven"), calculatedAtSequence: 0 };
      }
    });
    if (previousVersion < 4) {
      era.twoYearProfile = "legacy_unrecorded";
      migrateLegacyEvents(savedRun);
      detachOrdinaryNewsScenes(savedRun);
    }
    ensureTwoYearCalendar(savedRun);
    if (previousVersion === 4) migrateV4Calendar(savedRun);
    if (!era.stageState || typeof era.stageState !== "object") {
      era.stageState = era.endingId
        ? { status: "complete", pendingEndingId: "", summaryVisible: true }
        : { status: "playing", pendingEndingId: "", summaryVisible: false };
    }
    if (era.endingId && era.summary) era.stageState.summaryVisible = true;
    era.pendingSummary = era.pendingSummary || null;
    era.historicalYear = currentYear(savedRun);
    savedRun.version = RUN_VERSION;
    updateChapter(savedRun);
    syncNarrative(savedRun, previousVersion < RUN_VERSION ? { migratePast: true } : {});
    return savedRun;
  }

  function getNextKeyRace(run) {
    const scenario = scenarioFor(run);
    return scenario.occurrences
      .filter((occurrence) => occurrence.keyRace && !run.era.keyRaceResults[occurrence.id])
      .sort((left, right) => occurrenceSchedule(left).index - occurrenceSchedule(right).index)[0] || null;
  }

  ns.EraRules = {
    RUN_VERSION,
    ENTRY_SETUP_VERSION,
    DEFAULT_SCENARIO_ID,
    createEntrySetup,
    normalizeEntrySetup,
    getEntryCandidates,
    selectEntryCandidate,
    createRun,
    getAvailablePlans,
    getFreeRaceWindows,
    getFreeRacePlans,
    getRegistrationPreview,
    getScheduleOptions,
    buildRacePayload,
    cancelScheduledRace,
    advanceTurn,
    advanceNarrative,
    completeRace,
    syncNarrative,
    getCurrentScene,
    getTimeline,
    getSceneChoices,
    resolveSceneChoice,
    previewSceneChoice,
    completeTransientScene,
    completeEncounterNaming,
    evaluatePreRaceReport,
    evaluateTwoYearOpinion,
    retire,
    finalizeStage,
    commitStageEnding,
    normalizeSave,
    completeStory,
    deferStory,
    reopenStory,
    readNews,
    getNewspaperItems,
    scenarioFor,
    occurrenceFor,
    occurrenceSchedule,
    createOccurrenceRace,
    historicalDateFromTime,
    historicalDateFromIndex,
    careerTimeFromHistoricalDate,
    getNarrativeSummary,
    recordEvent,
    getNextKeyRace,
    baseTokens,
    horseName,
    characterFor
  };
})();
