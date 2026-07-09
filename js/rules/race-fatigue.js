(function () {
  const ns = (window.Keiba = window.Keiba || {});

  const TRIPLE_CROWN_RACES = ["kentucky-derby", "preakness-stakes", "belmont-stakes"];
  const MAX_PRESSURE = 3;
  const MIN_PROBABILITY = 0.05;
  const MAX_PROBABILITY = 0.85;
  const TRIPLE_CROWN_MULTIPLIER = 0.55;
  const TRIPLE_CROWN_MIN_PROBABILITY = 0.08;

  const BASE_PROBABILITY = {
    1: 0.35,
    2: 0.18
  };

  const CLASS_MOD = {
    new: -0.08,
    maiden: -0.08,
    "one-win": -0.08,
    "two-win": -0.08,
    "three-win": -0.08,
    op: 0,
    listed: 0,
    g3: 0.06,
    jpn3: 0.06,
    g2: 0.10,
    jpn2: 0.10,
    g1: 0.18,
    jpn1: 0.18
  };

  const LEVEL_EFFECTS = {
    1: { abilityMod: -5, accidentProbability: 0 },
    2: { abilityMod: -10, accidentProbability: 0.20 },
    3: { abilityMod: -10, accidentProbability: 0.65 }
  };

  const SEVERITY_LABELS = {
    minor: "小伤",
    medium: "中伤",
    severe: "重伤"
  };

  const REST_RANGES = {
    minor: [1, 3],
    medium: [4, 7],
    severe: [8, 14]
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function hashString(value) {
    let hash = 2166136261;
    const text = String(value || "");
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function seededFloat(key, salt) {
    return hashString(`${key}:${salt || ""}`) / 4294967296;
  }

  function seededRange(key, salt, min, max) {
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    return lo + Math.floor(seededFloat(key, salt) * (hi - lo + 1));
  }

  function ensureFatigueState(career) {
    if (!career) return { pressure: 0, lockedEvents: [], cancellations: [] };
    if (!career.fatigue || typeof career.fatigue !== "object") {
      career.fatigue = {};
    }
    career.fatigue.pressure = clamp(Math.floor(Number(career.fatigue.pressure) || 0), 0, MAX_PRESSURE);
    if (!Array.isArray(career.fatigue.lockedEvents)) career.fatigue.lockedEvents = [];
    if (!Array.isArray(career.fatigue.cancellations)) career.fatigue.cancellations = [];
    return career.fatigue;
  }

  function lastOfficialRecord(career) {
    const records = career && Array.isArray(career.races) ? career.races : [];
    for (let i = records.length - 1; i >= 0; i -= 1) {
      const record = records[i];
      if (record && record.public && !record.public.cancelled) return record;
    }
    return null;
  }

  function previousRaceClass(career) {
    const record = lastOfficialRecord(career);
    return record && record.hidden && record.hidden.race
      ? record.hidden.race.raceClass || ""
      : "";
  }

  function previousRaceId(career) {
    const record = lastOfficialRecord(career);
    if (record && record.hidden && record.hidden.race) return record.hidden.race.id || "";
    return record && record.public ? record.public.raceId || "" : "";
  }

  function isTopLevelClass(raceClass) {
    return raceClass === "g1" || raceClass === "jpn1";
  }

  function isTripleCrownPair(previousId, currentId) {
    return TRIPLE_CROWN_RACES.includes(previousId) && TRIPLE_CROWN_RACES.includes(currentId);
  }

  function gapTurns(career, schedule) {
    if (!career || !schedule || career.lastRaceIndex == null) return null;
    return schedule.index - career.lastRaceIndex;
  }

  function probabilityFor(career, race, schedule) {
    const fatigue = ensureFatigueState(career);
    const gap = gapTurns(career, schedule);
    if (gap !== 1 && gap !== 2) {
      return {
        eligible: false,
        probability: 0,
        gapTurns: gap,
        pressureBefore: fatigue.pressure,
        previousRaceClass: previousRaceClass(career),
        previousRaceId: previousRaceId(career),
        tripleCrownExemption: false
      };
    }

    const prevClass = previousRaceClass(career);
    const prevId = previousRaceId(career);
    const currentId = race && race.id ? race.id : "";
    const tripleCrownExemption = isTripleCrownPair(prevId, currentId);
    let probability = (BASE_PROBABILITY[gap] || 0)
      + (CLASS_MOD[prevClass] || 0)
      + fatigue.pressure * 0.12;
    probability = clamp(probability, MIN_PROBABILITY, MAX_PROBABILITY);
    if (tripleCrownExemption) {
      probability = Math.max(TRIPLE_CROWN_MIN_PROBABILITY, probability * TRIPLE_CROWN_MULTIPLIER);
    }

    return {
      eligible: true,
      probability,
      gapTurns: gap,
      pressureBefore: fatigue.pressure,
      previousRaceClass: prevClass,
      previousRaceId: prevId,
      tripleCrownExemption
    };
  }

  function previewFatigueRisk(career, race, schedule) {
    return probabilityFor(career, race, schedule);
  }

  function fatigueKey(career, race, schedule, info) {
    const horse = career && career.horse ? career.horse : {};
    return [
      "fatigue",
      horse.id || horse.name || "horse",
      race && race.id ? race.id : "race",
      schedule && Number.isFinite(schedule.index) ? schedule.index : "schedule",
      career && career.lastRaceIndex != null ? career.lastRaceIndex : "none",
      info && Number.isFinite(info.pressureBefore) ? info.pressureBefore : 0
    ].join(":");
  }

  function chooseLevel(key, previousClass, pressureBefore) {
    let lv1 = 70;
    let lv2 = 25;
    let lv3 = 5;
    if (isTopLevelClass(previousClass)) {
      lv1 = 50;
      lv2 = 35;
      lv3 = 15;
    }
    if (pressureBefore >= 2) {
      lv1 -= 15;
      lv2 += 10;
      lv3 += 5;
    }
    const roll = seededFloat(key, "level") * (lv1 + lv2 + lv3);
    if (roll < lv1) return 1;
    if (roll < lv1 + lv2) return 2;
    return 3;
  }

  function chooseAccidentReason(key, level) {
    const roll = seededFloat(key, "accident-reason");
    if (level >= 3) return roll < 0.6 ? "受伤" : "拉停";
    return roll < 0.4 ? "受伤" : "拉停";
  }

  function chooseAccidentPhase(key) {
    return seededFloat(key, "accident-phase") < 0.45 ? "中盘" : "末盘";
  }

  function chooseSeverity(key, level) {
    const roll = seededFloat(key, "severity");
    if (level >= 3) {
      if (roll < 0.10) return "minor";
      if (roll < 0.65) return "medium";
      return "severe";
    }
    if (roll < 0.65) return "minor";
    if (roll < 0.95) return "medium";
    return "severe";
  }

  function buildAccidentInjury(key, level, reason, phase) {
    const severity = chooseSeverity(key, level);
    const range = REST_RANGES[severity];
    const restMonths = seededRange(key, "rest", range[0], range[1]);
    const forcedRetirement = severity === "severe" && seededFloat(key, "forced-retirement") < 0.10;
    return {
      phase,
      reason,
      severity,
      severityLabel: SEVERITY_LABELS[severity],
      restMonths,
      forcedRetirement,
      source: "fatigue"
    };
  }

  function lockPreRaceCondition(career, payload) {
    const existing = payload && payload.preRaceCondition;
    if (existing && existing.locked) return existing;

    const race = payload && payload.race ? payload.race : null;
    const schedule = payload && payload.schedule ? payload.schedule : null;
    const fatigue = ensureFatigueState(career);
    const info = probabilityFor(career, race, schedule);
    const key = fatigueKey(career, race, schedule, info);
    const roll = seededFloat(key, "trigger");
    const triggered = info.eligible && roll < info.probability;
    const level = triggered ? chooseLevel(key, info.previousRaceClass, info.pressureBefore) : 0;
    const effect = LEVEL_EFFECTS[level] || { abilityMod: 0, accidentProbability: 0 };
    const accidentRoll = triggered ? seededFloat(key, "accident") : 1;
    const accident = triggered && accidentRoll < effect.accidentProbability;
    const accidentReason = accident ? chooseAccidentReason(key, level) : "";
    const accidentPhase = accident ? chooseAccidentPhase(key) : "";
    let pressureAfter = info.pressureBefore;

    if (triggered) {
      pressureAfter = Math.min(MAX_PRESSURE, pressureAfter + 1);
    } else if (!info.eligible && Number.isFinite(info.gapTurns) && info.gapTurns > 2) {
      pressureAfter = Math.max(0, pressureAfter - 1);
    }
    fatigue.pressure = pressureAfter;

    const locked = {
      locked: true,
      checkedAtIndex: schedule ? schedule.index : null,
      fatigue: {
        eligible: info.eligible,
        triggered,
        level,
        abilityMod: effect.abilityMod,
        accident,
        accidentReason,
        accidentPhase,
        accidentInjury: accident ? buildAccidentInjury(key, level, accidentReason, accidentPhase) : null,
        probability: info.probability,
        roll,
        accidentRoll,
        gapTurns: info.gapTurns,
        pressureBefore: info.pressureBefore,
        pressureAfter,
        previousRaceClass: info.previousRaceClass,
        previousRaceId: info.previousRaceId,
        tripleCrownExemption: info.tripleCrownExemption
      }
    };

    if (payload) payload.preRaceCondition = locked;
    if (triggered) {
      fatigue.lockedEvents.push({
        raceId: race ? race.id : "",
        scheduleIndex: schedule ? schedule.index : null,
        level,
        abilityMod: effect.abilityMod,
        accident,
        pressureBefore: info.pressureBefore,
        pressureAfter
      });
    }
    return locked;
  }

  function abilityMod(condition) {
    const fatigue = condition && condition.fatigue;
    return fatigue && fatigue.triggered ? fatigue.abilityMod || 0 : 0;
  }

  function accidentInjury(condition) {
    const fatigue = condition && condition.fatigue;
    return fatigue && fatigue.triggered && fatigue.accident ? fatigue.accidentInjury : null;
  }

  function recordPreRaceCancellation(career, payload) {
    const fatigue = ensureFatigueState(career);
    const schedule = payload && payload.schedule ? payload.schedule : null;
    const race = payload && payload.race ? payload.race : null;
    if (schedule && Number.isFinite(schedule.index)) {
      career.lastRaceCancelIndex = schedule.index;
    }
    fatigue.cancellations.push({
      raceId: race ? race.id : "",
      scheduleIndex: schedule ? schedule.index : null,
      timeLabel: schedule ? schedule.label || "" : "",
      reason: "pre-race-condition",
      preRaceCondition: payload ? payload.preRaceCondition || null : null
    });
    return fatigue.cancellations[fatigue.cancellations.length - 1];
  }

  ns.RaceFatigueRules = {
    TRIPLE_CROWN_RACES,
    ensureFatigueState,
    previewFatigueRisk,
    lockPreRaceCondition,
    abilityMod,
    accidentInjury,
    recordPreRaceCancellation
  };
})();
