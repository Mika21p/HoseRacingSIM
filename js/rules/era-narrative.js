(function () {
  const ns = (window.Keiba = window.Keiba || {});

  const TWO_YEAR_PROFILES = new Set([
    "two_year_star",
    "two_year_consistent",
    "two_year_unproven",
    "late_debut",
    "two_year_struggling",
    "two_year_injury",
    "legacy_unrecorded"
  ]);
  const SPRING_PROFILES = new Set([
    "spring_unbeaten",
    "spring_prep_winner",
    "spring_consistent",
    "spring_uncertain",
    "spring_rebound",
    "spring_health_question",
    "spring_direct_entry"
  ]);
  const CLASSIC_TRAJECTORIES = new Set([
    "triple_alive",
    "double_crown_alive",
    "classic_winner",
    "classic_contender",
    "generation_spoiler",
    "historical_observer",
    "injury_interrupted",
    "unfinished_campaign"
  ]);

  function clonePlain(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function orderedEvents(events, atSequence) {
    return (Array.isArray(events) ? events : [])
      .filter((event) => event && (!Number.isFinite(atSequence) || event.createdSequence <= atSequence))
      .slice()
      .sort((left, right) => (left.createdSequence || 0) - (right.createdSequence || 0));
  }

  function raceResults(events, predicate) {
    return events.filter((event) => event.eventType === "race-result" && (!predicate || predicate(event)));
  }

  function finishOf(event) {
    return Number.isFinite(event && event.playerFinish) ? event.playerFinish : null;
  }

  function isRetiredResult(event) {
    return !!(event && event.playerRetired);
  }

  function eventRaceClass(event, scenario) {
    const direct = event && (event.raceClass || (event.details && event.details.raceClass));
    if (direct) return direct;
    const occurrence = scenario && (scenario.occurrences || []).find((item) => item.id === (event && event.occurrenceId));
    return occurrence && ((occurrence.raceSnapshot && occurrence.raceSnapshot.raceClass)
      || (occurrence.override && occurrence.override.raceClass)) || "";
  }

  function twoYearStatistics(events, scenario) {
    const results = raceResults(events, (event) => event.historicalYear === 1997 || event.careerAge === 2);
    const wins = results.filter((event) => finishOf(event) === 1 && !isRetiredResult(event));
    const interrupted = events.some((event) => ["injury-start", "race-absent"].includes(event.eventType)
      && event.interruptedPlannedRace
      && (event.historicalYear === 1997 || event.careerAge === 2));
    const topThree = results.filter((event) => Number.isFinite(finishOf(event)) && finishOf(event) <= 3).length;
    const weak = results.filter((event) => !Number.isFinite(finishOf(event)) || finishOf(event) >= 4).length;
    const gradedWins = wins.filter((event) => {
      const raceClass = eventRaceClass(event, scenario);
      return raceClass === "g2" || raceClass === "g3";
    });
    const first = results[0] || null;
    const latest = results.length ? results[results.length - 1] : null;
    return {
      starts: results.length,
      wins: wins.length,
      topThree,
      fourthOrWorse: weak,
      gradedWins: gradedWins.length,
      firstStartDate: first ? first.historicalDate || null : null,
      firstStartSequence: first ? first.createdSequence || null : null,
      injuryInterrupted: interrupted,
      latestRaceEventId: latest ? latest.eventId || null : null
    };
  }

  function twoYearProfile(events, statistics, scenario) {
    if (events.some((event) => event.recordQuality === "legacy_unrecorded")) return "legacy_unrecorded";
    const stats = statistics || twoYearStatistics(events, scenario);
    if (stats.gradedWins > 0 || stats.wins >= 2) return "two_year_star";
    if (stats.injuryInterrupted) return "two_year_injury";
    if (stats.starts >= 2 && stats.topThree >= 2 && stats.topThree >= stats.fourthOrWorse) return "two_year_consistent";

    const first = raceResults(events, (event) => event.historicalYear === 1997 || event.careerAge === 2)[0];
    if (first && ((first.historicalDate && first.historicalDate >= "1997-11-01") || first.careerMonth >= 11)) return "late_debut";
    if (stats.starts && (stats.topThree === 0 || stats.fourthOrWorse > stats.topThree)) return "two_year_struggling";
    return "two_year_unproven";
  }

  function springProfile(events) {
    const springResults = raceResults(events, (event) => event.historicalYear === 1998
      && !event.keyRace
      && event.historicalDate
      && event.historicalDate < "1998-04-19");
    const healthQuestion = events.some((event) => ["injury-start", "race-absent"].includes(event.eventType)
      && (event.historicalYear === 1998 || event.careerAge === 3)
      && (event.absenceReason === "injury" || event.interruptedPlannedRace));
    if (healthQuestion || springResults.some(isRetiredResult)) return "spring_health_question";
    if (!springResults.length) return "spring_direct_entry";

    const latest = springResults[springResults.length - 1];
    const allCareerResults = raceResults(events);
    if (finishOf(latest) === 1 && allCareerResults.length && allCareerResults.every((event) => finishOf(event) === 1)) {
      return "spring_unbeaten";
    }
    if (finishOf(latest) === 1) return "spring_prep_winner";

    const previous = allCareerResults.slice(0, -1).pop();
    const recovered = events.some((event) => event.eventType === "injury-recovery" && event.historicalYear === 1998);
    if (finishOf(latest) != null && finishOf(latest) <= 3
      && (recovered || (previous && (finishOf(previous) == null || finishOf(previous) >= 4)))) {
      return "spring_rebound";
    }
    if (finishOf(latest) != null && finishOf(latest) <= 3) return "spring_consistent";
    return "spring_uncertain";
  }

  function classicTrajectory(events) {
    const classicEvents = events.filter((event) => event.keyRace && ["race-result", "race-absent"].includes(event.eventType)
      && event.historicalYear === 1998);
    if (classicEvents.some((event) => event.absenceReason === "injury" || event.playerRetired)) return "injury_interrupted";

    const results = classicEvents.filter((event) => event.eventType === "race-result");
    const wins = results.filter((event) => finishOf(event) === 1).length;
    const settledIds = new Set(classicEvents.map((event) => event.occurrenceId));
    const firstTwoSettled = settledIds.has("1998-satsuki") && settledIds.has("1998-derby");
    const kikkaSettled = settledIds.has("1998-kikka");
    if (!kikkaSettled && wins === classicEvents.length && wins > 0) return "triple_alive";
    if (!kikkaSettled && firstTwoSettled && wins === 1) return "double_crown_alive";
    if (wins > 0) return "classic_winner";
    if (results.some((event) => finishOf(event) != null && finishOf(event) <= 3)) return "classic_contender";
    if (results.some((event) => event.worldlineKind && event.worldlineKind !== "historical-continuation")) {
      return "generation_spoiler";
    }
    if (classicEvents.length && (kikkaSettled || classicEvents.every((event) => event.eventType === "race-absent"))) {
      return "historical_observer";
    }
    return "unfinished_campaign";
  }

  function absenceContext(events) {
    const latest = events.slice().reverse().find((event) => event.eventType === "race-absent");
    if (!latest) return "no_absence";
    if (latest.absenceReason === "injury") return "injury_absence";
    if (latest.absenceReason === "voluntary") return "voluntary_absence";
    return "schedule_absence";
  }

  function worldlineContext(events) {
    const raceEvents = events.filter((event) => ["race-result", "race-absent"].includes(event.eventType));
    if (raceEvents.some((event) => event.worldlineKind === "player-divergence" || event.actualWinnerId === "player")) {
      return "player-rewrite";
    }
    if (raceEvents.some((event) => event.worldlineKind === "rival-divergence"
      || (event.actualWinnerId && event.historicalWinnerId && event.actualWinnerId !== event.historicalWinnerId))) {
      return "rival-rewrite";
    }
    return "historical-continuation";
  }

  function keyMemories(events) {
    const weighted = events
      .filter((event) => ["race-result", "race-absent", "injury-start", "injury-recovery"].includes(event.eventType))
      .map((event) => {
        let weight = 0;
        if (event.keyRace && finishOf(event) === 1) weight = 100;
        else if (event.eventType === "injury-start" && event.interruptedPlannedRace) weight = 90;
        else if (event.keyRace && finishOf(event) != null && finishOf(event) <= 3) weight = 80;
        else if (event.importantTwoYear) weight = 70;
        else if (event.worldlineKind && event.worldlineKind !== "historical-continuation") weight = 60;
        else weight = 10;
        return { event, weight };
      })
      .sort((left, right) => right.weight - left.weight || (right.event.createdSequence || 0) - (left.event.createdSequence || 0));
    return weighted.slice(0, 2).map((item) => item.event.eventId);
  }

  function nextHistoricalQuestion(events) {
    const settled = new Set(events
      .filter((event) => ["race-result", "race-absent"].includes(event.eventType))
      .map((event) => event.occurrenceId));
    if (!settled.has("1998-satsuki")) return "question_satsuki_credentials";
    if (!settled.has("1998-derby")) return "question_derby_response";
    if (!settled.has("1998-kikka")) return "question_kikka_meaning";
    return "question_final_worldline";
  }

  function summarize(events, scenario, atSequence) {
    const selected = orderedEvents(events, atSequence);
    const twoYearStats = twoYearStatistics(selected, scenario);
    const settledClassics = selected.filter((event) => event.keyRace && ["race-result", "race-absent"].includes(event.eventType));
    const tripleCrownPossible = settledClassics.every((event) => event.eventType === "race-result"
      && finishOf(event) === 1
      && !event.playerRetired);
    return {
      twoYearProfile: twoYearProfile(selected, twoYearStats, scenario),
      twoYearStatistics: twoYearStats,
      springProfile: springProfile(selected),
      classicTrajectory: classicTrajectory(selected),
      absenceContext: absenceContext(selected),
      worldlineContext: worldlineContext(selected),
      keyMemories: keyMemories(selected),
      nextHistoricalQuestion: nextHistoricalQuestion(selected),
      tripleCrownPossible,
      calculatedAtSequence: selected.length ? selected[selected.length - 1].createdSequence || 0 : 0,
      cutoffEventSequence: selected.length ? selected[selected.length - 1].createdSequence || 0 : 0,
      scenarioId: scenario && scenario.id ? scenario.id : ""
    };
  }

  function mappedSlot(mapping, value) {
    return mapping && (mapping[value] || mapping.fallback) || "";
  }

  function selectTextSlots(options) {
    const opts = options || {};
    const node = opts.node || {};
    const summary = opts.summary || {};
    const scenario = opts.scenario || {};
    const mappings = scenario.narrativeTextSlots || {};
    const declared = node.textSlots || {};
    const includeContext = !!node.useNarrativeSlots;
    const slots = {
      base: declared.base || node.textId || "",
      "history-context": declared["history-context"] || (includeContext ? mappedSlot(mappings.twoYearProfile, summary.twoYearProfile) : ""),
      "speaker-reaction": declared["speaker-reaction"] || (includeContext ? mappedSlot(mappings.springProfile, summary.springProfile) : ""),
      worldline: declared.worldline || (includeContext ? mappedSlot(mappings.worldlineContext, summary.worldlineContext) : ""),
      "future-hook": declared["future-hook"] || (includeContext ? mappedSlot(mappings.nextHistoricalQuestion, summary.nextHistoricalQuestion) : "")
    };
    return Object.fromEntries(Object.entries(slots).filter((entry) => !!entry[1]));
  }

  function createSceneSnapshot(options) {
    const opts = options || {};
    return {
      textSlots: clonePlain(opts.textSlots || {}),
      tokensSnapshot: clonePlain(opts.tokensSnapshot || opts.tokens || {}),
      narrativeSnapshot: clonePlain(opts.narrativeSnapshot || {}),
      createdAt: opts.createdAt || null,
      resolvedAt: opts.resolvedAt || null
    };
  }

  function validate(summary) {
    const warnings = [];
    if (!summary || !TWO_YEAR_PROFILES.has(summary.twoYearProfile)) warnings.push("invalid-two-year-profile");
    if (!summary || !SPRING_PROFILES.has(summary.springProfile)) warnings.push("invalid-spring-profile");
    if (!summary || !CLASSIC_TRAJECTORIES.has(summary.classicTrajectory)) warnings.push("invalid-classic-trajectory");
    if (summary && summary.classicTrajectory === "triple_alive" && summary.tripleCrownPossible === false) {
      warnings.push("invalid-triple-crown-state");
    }
    return warnings;
  }

  ns.EraNarrative = {
    TWO_YEAR_PROFILES,
    SPRING_PROFILES,
    CLASSIC_TRAJECTORIES,
    summarize,
    selectTextSlots,
    createSceneSnapshot,
    validate
  };
})();
