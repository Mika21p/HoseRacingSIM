(function () {
  const ns = (window.Keiba = window.Keiba || {});

  const HINT_VERSION = 4;

  const STATUS = {
    strong: "strong",
    fit: "fit",
    possible: "possible",
    unfit: "unfit",
    unknown: "unknown"
  };

  const STATUS_LABELS = {
    strong: "擅长",
    fit: "适应",
    possible: "可能适应",
    unfit: "不适应",
    unknown: "未知"
  };

  const CONFIDENCE = {
    certain: "certain",
    suspected: "suspected",
    unknown: "unknown"
  };

  const CONFIDENCE_LABELS = {
    certain: "赛后确认",
    suspected: "练马师判断",
    unknown: ""
  };

  const DISTANCE_TYPES = [
    { id: "sprint", label: "短距离", min: 1000, max: 1300 },
    { id: "mile", label: "英里", min: 1400, max: 1800 },
    { id: "middle", label: "中距离", min: 1900, max: 2200 },
    { id: "classic", label: "中长距离", min: 2300, max: 2600 },
    { id: "long", label: "长距离", min: 2601, max: 4200 }
  ];

  const GROWTH_TYPES = {
    "早熟": { fit: ["age2", "age3"], unfit: [] },
    "普早": { fit: ["age2", "age3"], unfit: [] },
    "普迟": { fit: ["age3", "age4"], unfit: [] },
    "晚熟": { fit: ["age4", "age5plus"], unfit: ["age2"] }
  };

  const SECTIONS = [
    {
      id: "distance",
      label: "距离",
      items: DISTANCE_TYPES.map((item) => ({ id: item.id, label: item.label }))
    },
    {
      id: "growth",
      label: "成长性",
      items: [
        { id: "age2", label: "2岁" },
        { id: "age3", label: "3岁" },
        { id: "age4", label: "4岁" },
        { id: "age5plus", label: "5+岁" },
        { id: "decline", label: "衰退风险" }
      ]
    },
    {
      id: "surface",
      label: "草泥适性",
      items: [{ id: "grass", label: "草地" }, { id: "dirt", label: "泥地" }]
    },
    {
      id: "track",
      label: "赛场类型",
      items: [{ id: "burst", label: "瞬发" }, { id: "sustained", label: "持久" }, { id: "attrition", label: "消耗" }]
    }
  ];

  function emptyCell() {
    return { status: STATUS.unknown, confidence: CONFIDENCE.unknown };
  }

  function createCell(status, confidence) {
    const normalizedStatus = normalizeStatus(status);
    if (normalizedStatus === STATUS.unknown) return emptyCell();
    return {
      status: normalizedStatus,
      confidence: normalizeConfidence(confidence || CONFIDENCE.suspected)
    };
  }

  function emptyHints() {
    return SECTIONS.reduce((hints, section) => {
      hints[section.id] = section.items.reduce((items, item) => {
        items[item.id] = emptyCell();
        return items;
      }, {});
      return hints;
    }, {});
  }

  function statusLabel(status) {
    return STATUS_LABELS[status] || STATUS_LABELS.unknown;
  }

  function confidenceLabel(confidence) {
    return CONFIDENCE_LABELS[confidence] || "";
  }

  function normalizeStatus(status) {
    return STATUS_LABELS[status] ? status : STATUS.unknown;
  }

  function normalizeConfidence(confidence) {
    return CONFIDENCE_LABELS[confidence] != null ? confidence : CONFIDENCE.suspected;
  }

  function normalizeCell(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return createCell(value, CONFIDENCE.suspected);
    }
    return createCell(value.status, value.confidence);
  }

  function normalizeSectionItem(sourceSection, sectionId, itemId) {
    return normalizeCell(sourceSection && sourceSection[itemId]);
  }

  function normalizeHints(hints) {
    const source = hints || {};
    const normalized = emptyHints();
    SECTIONS.forEach((section) => {
      section.items.forEach((item) => {
        normalized[section.id][item.id] = normalizeSectionItem(source[section.id], section.id, item.id);
      });
    });
    return normalized;
  }

  function setStatus(hints, sectionId, itemId, status, options) {
    if (!hints || !hints[sectionId] || !Object.prototype.hasOwnProperty.call(hints[sectionId], itemId)) return;
    const opts = options || {};
    const current = normalizeCell(hints[sectionId][itemId]);
    const next = createCell(status, opts.confidence);
    if (next.status === STATUS.unknown) return;
    if (!opts.force && current.confidence === CONFIDENCE.certain && next.confidence !== CONFIDENCE.certain) return;
    hints[sectionId][itemId] = next;
  }

  function commentById(commentDetails, id) {
    return (commentDetails || []).find((comment) => comment && comment.id === id) || null;
  }

  function distanceTypeForDistance(distance) {
    return DISTANCE_TYPES.find((item) => distance >= item.min && distance <= item.max) || null;
  }

  function distanceTypesInRange(min, max) {
    return DISTANCE_TYPES.filter((item) => max >= item.min && min <= item.max);
  }

  function applyDistanceRange(hints, range) {
    if (!range || !Number.isFinite(range.min) || !Number.isFinite(range.max)) return;
    distanceTypesInRange(range.min, range.max).forEach((item) => {
      setStatus(hints, "distance", item.id, STATUS.fit, { confidence: CONFIDENCE.suspected });
    });
  }

  function applyDistanceBoundary(hints, claim, lock) {
    if (!claim || !lock || !lock.distance) return false;
    const range = lock.distance;
    if (claim.boundary === "max") {
      DISTANCE_TYPES.forEach((item) => {
        if (item.max <= range.max) {
          setStatus(hints, "distance", item.id, STATUS.possible, { confidence: CONFIDENCE.suspected });
        }
        if (item.min > range.max) {
          setStatus(hints, "distance", item.id, STATUS.unfit, { confidence: CONFIDENCE.suspected });
        }
      });
      return true;
    }
    if (claim.boundary === "min") {
      DISTANCE_TYPES.forEach((item) => {
        if (item.min >= range.min) {
          setStatus(hints, "distance", item.id, STATUS.possible, { confidence: CONFIDENCE.suspected });
        }
        if (item.max < range.min) {
          setStatus(hints, "distance", item.id, STATUS.unfit, { confidence: CONFIDENCE.suspected });
        }
      });
      return true;
    }
    return false;
  }

  function applyStaminaHint(hints, stamina) {
    if (stamina === "short") {
      setStatus(hints, "distance", "sprint", STATUS.possible, { confidence: CONFIDENCE.suspected });
      setStatus(hints, "distance", "mile", STATUS.possible, { confidence: CONFIDENCE.suspected });
    } else if (stamina === "stays") {
      setStatus(hints, "distance", "middle", STATUS.possible, { confidence: CONFIDENCE.suspected });
      setStatus(hints, "distance", "classic", STATUS.possible, { confidence: CONFIDENCE.suspected });
      setStatus(hints, "distance", "long", STATUS.possible, { confidence: CONFIDENCE.suspected });
    }
  }

  function applyDistanceComment(hints, comment) {
    if (!comment) return;
    const claim = comment.claim || {};
    const lock = comment.lock || {};
    if (Number.isFinite(claim.min) && Number.isFinite(claim.max)) {
      applyDistanceRange(hints, { min: claim.min, max: claim.max });
      return;
    }
    if (applyDistanceBoundary(hints, claim, lock)) return;
    if (claim.stamina) {
      applyStaminaHint(hints, claim.stamina);
      return;
    }
    if (lock.distance) applyDistanceRange(hints, lock.distance);
  }

  function applyAptitudeComment(hints, section, comment) {
    const assessments = comment && comment.claim && comment.claim.assessments;
    (assessments || []).forEach((assessment) => {
      const good = section === "surface" ? ["A", "B"] : ["◎", "○"];
      const valid = section === "surface" ? ["A", "B", "C", "G"] : ["◎", "○", "△"];
      const grades = assessment.grades || [];
      let status = STATUS.unknown;
      if (assessment.judgment === "strong" && section === "track") status = STATUS.strong;
      else if (assessment.judgment === "suitable") status = STATUS.fit;
      else if (assessment.judgment === "unsuitable") status = STATUS.unfit;
      else if (assessment.tendency === "suitable") status = STATUS.possible;
      else if (assessment.tendency === "unsuitable") status = STATUS.unfit;
      else if (grades.length && grades.every((grade) => valid.includes(grade))) {
        status = grades.every((grade) => good.includes(grade)) ? STATUS.fit
          : grades.every((grade) => !good.includes(grade)) ? STATUS.unfit : STATUS.possible;
      }
      setStatus(hints, section, assessment.target, status, { confidence: CONFIDENCE.suspected });
    });
  }

  function growthTypesFromComment(comment) {
    if (!comment) return [];
    if (comment.lock && Array.isArray(comment.lock.growthTypes)) return comment.lock.growthTypes.slice();
    if (comment.claim && Array.isArray(comment.claim.growthTypes)) return comment.claim.growthTypes.slice();
    if (comment.claim && comment.claim.growthType) return [comment.claim.growthType];
    return [];
  }

  function applyGrowthComment(hints, comment) {
    const growthTypes = growthTypesFromComment(comment);
    growthTypes.forEach((type) => {
      const rule = GROWTH_TYPES[type];
      if (!rule) return;
      rule.fit.forEach((stage) => {
        setStatus(hints, "growth", stage, STATUS.fit, { confidence: CONFIDENCE.suspected });
      });
      rule.unfit.forEach((stage) => {
        setStatus(hints, "growth", stage, STATUS.unfit, { confidence: CONFIDENCE.suspected });
      });
    });
  }

  function createInitial(commentDetails) {
    const hints = emptyHints();
    applyDistanceComment(hints, commentById(commentDetails, "distance"));
    applyAptitudeComment(hints, "surface", commentById(commentDetails, "surface"));
    applyAptitudeComment(hints, "track", commentById(commentDetails, "track"));
    applyGrowthComment(hints, commentById(commentDetails, "growth"));
    return hints;
  }

  function timeToGrowthStage(time) {
    let resolved = time || null;
    if (resolved && resolved.index != null && ns.TimeRules && ns.TimeRules.fromIndex) {
      resolved = ns.TimeRules.fromIndex(resolved.index);
    }
    if (!resolved || !Number.isFinite(resolved.age)) return "";
    if (resolved.age <= 2) return "age2";
    if (resolved.age === 3) return "age3";
    if (resolved.age === 4) return "age4";
    return "age5plus";
  }

  function postRaceComment(raceResult, explicitComment) {
    if (explicitComment) return explicitComment;
    return raceResult && raceResult.hidden ? raceResult.hidden.postRaceComment : null;
  }

  function ensureCurrent(career) {
    if (!career || typeof career !== "object") return null;
    if (!career.adaptationHints) career.adaptationHints = createInitial(career.commentDetails);
    career.adaptationHints = normalizeHints(career.adaptationHints);
    career.adaptationHintsVersion = HINT_VERSION;
    return career.adaptationHints;
  }

  function applyDistanceTooShort(hints, distance) {
    const current = distanceTypeForDistance(distance);
    if (!current) return;
    DISTANCE_TYPES.forEach((item) => {
      if (item.id === current.id) {
        setStatus(hints, "distance", item.id, STATUS.unfit, { confidence: CONFIDENCE.suspected });
      } else if (item.max < current.min) {
        setStatus(hints, "distance", item.id, STATUS.unfit, { confidence: CONFIDENCE.certain });
      }
    });
  }

  function applyDistanceTooLong(hints, distance) {
    const current = distanceTypeForDistance(distance);
    if (!current) return;
    DISTANCE_TYPES.forEach((item) => {
      if (item.id === current.id) {
        setStatus(hints, "distance", item.id, STATUS.unfit, { confidence: CONFIDENCE.suspected });
      } else if (item.min > current.max) {
        setStatus(hints, "distance", item.id, STATUS.unfit, { confidence: CONFIDENCE.certain });
      }
    });
  }

  function applyNoIssueEvidence(hints, raceResult, confidence) {
    const hidden = raceResult.hidden || {};
    const race = hidden.race || {};
    const calc = hidden.playerCalc || {};
    const maturity = calc.maturity || {};

    if (Number.isFinite(calc.distancePenalty) && calc.distancePenalty <= 0 && Number.isFinite(race.distance)) {
      const distanceType = distanceTypeForDistance(race.distance);
      if (distanceType) setStatus(hints, "distance", distanceType.id, STATUS.fit, { confidence });
    }

    if (maturity.status === "成熟期") {
      const stage = timeToGrowthStage(hidden.schedule);
      if (stage) setStatus(hints, "growth", stage, STATUS.fit, { confidence });
    }
  }

  function applyPostRace(career, raceResult, explicitComment) {
    if (!career || !raceResult) return null;
    const hints = ensureCurrent(career);
    const comment = postRaceComment(raceResult, explicitComment);
    if (!comment) return hints;
    if (comment.mode === "broad" && comment.issueState === "no_issue") {
      applyNoIssueEvidence(hints, raceResult, CONFIDENCE.suspected);
      return hints;
    }
    if (comment.mode !== "clear") return hints;
    const race = raceResult.hidden && raceResult.hidden.race;
    if (comment.reason === "distance_too_short") {
      if (race && Number.isFinite(race.distance)) applyDistanceTooShort(hints, race.distance);
    } else if (comment.reason === "distance_too_long") {
      if (race && Number.isFinite(race.distance)) applyDistanceTooLong(hints, race.distance);
    } else if (comment.reason === "surface_mismatch" || comment.reason === "track_mismatch") {
      const target = comment.target;
      const expectedSection = comment.reason === "surface_mismatch" ? "surface" : "track";
      if (target && target.section === expectedSection) {
        setStatus(hints, target.section, target.item, STATUS.unfit, { confidence: CONFIDENCE.certain });
      }
    } else if (comment.reason === "immature") {
      const stage = timeToGrowthStage(raceResult.hidden && raceResult.hidden.schedule || career.currentTime);
      if (stage) setStatus(hints, "growth", stage, STATUS.unfit, { confidence: CONFIDENCE.suspected });
    } else if (comment.reason === "declining") {
      setStatus(hints, "growth", "decline", STATUS.unfit, { confidence: CONFIDENCE.certain });
    } else if (comment.reason === "off_day" || comment.reason === "outclassed") {
      applyNoIssueEvidence(hints, raceResult, CONFIDENCE.certain);
    }
    return hints;
  }

  function rebuild(career) {
    career.adaptationHints = createInitial(career.commentDetails);
    career.adaptationHintsVersion = HINT_VERSION;
    (career.races || []).forEach((record) => {
      applyPostRace(career, record);
    });
    return career.adaptationHints;
  }

  function hasReplaySource(career) {
    return (Array.isArray(career.commentDetails) && career.commentDetails.length > 0)
      || (Array.isArray(career.races) && career.races.length > 0);
  }

  function ensure(career) {
    if (!career || typeof career !== "object") return null;
    if (career.adaptationHintsVersion !== HINT_VERSION && hasReplaySource(career)) return rebuild(career);
    return ensureCurrent(career);
  }

  function getSections(career) {
    const hints = ensure(career) || emptyHints();
    return SECTIONS.map((section) => ({
      id: section.id,
      label: section.label,
      items: section.items.map((item) => {
        const cell = normalizeCell(hints[section.id] && hints[section.id][item.id]);
        return {
          id: item.id,
          label: item.label,
          status: cell.status,
          statusLabel: (section.id === "track" || section.id === "surface") && cell.status === STATUS.fit ? "合适"
            : section.id === "track" && cell.status === STATUS.unfit ? "不擅长"
            : section.id === "surface" && cell.status === STATUS.unfit ? "不合适" : statusLabel(cell.status),
          confidence: cell.confidence,
          confidenceLabel: confidenceLabel(cell.confidence)
        };
      })
    }));
  }

  ns.AdaptationHintRules = {
    HINT_VERSION,
    STATUS,
    CONFIDENCE,
    SECTIONS,
    createInitial,
    applyPostRace,
    ensure,
    getSections,
    statusLabel,
    confidenceLabel
  };
})();
