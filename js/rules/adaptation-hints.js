(function () {
  const ns = (window.Keiba = window.Keiba || {});

  const HINT_VERSION = 2;

  const STATUS = {
    fit: "fit",
    possible: "possible",
    unfit: "unfit",
    unknown: "unknown"
  };

  const STATUS_LABELS = {
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
    certain: "确",
    suspected: "疑",
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
      id: "grass",
      label: "草地适性",
      items: [
        { id: "japan", label: "日本草地" },
        { id: "hongkong", label: "香港草地" },
        { id: "europe", label: "欧洲草地" },
        { id: "america", label: "美国草地" },
        { id: "middleEast", label: "中东草地" }
      ]
    },
    {
      id: "dirt",
      label: "泥地适性",
      items: [
        { id: "japan", label: "日本泥地" },
        { id: "america", label: "美国泥地" },
        { id: "middleEast", label: "中东泥地" }
      ]
    }
  ];

  const REGION_LABEL_TO_ID = {
    "日本": "japan",
    "香港": "hongkong",
    "欧洲": "europe",
    "美国": "america",
    "北美": "america",
    "中东": "middleEast"
  };

  const LEGACY_GROWTH_IDS = {
    age2: ["age2", "early"],
    age3: ["age3", "classic"],
    age4: ["age4", "older"],
    age5plus: ["age5plus", "older"],
    decline: ["decline"]
  };

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

  function cellRank(cell) {
    const normalized = normalizeCell(cell);
    if (normalized.status === STATUS.unknown) return 0;
    if (normalized.status === STATUS.unfit && normalized.confidence === CONFIDENCE.certain) return 60;
    if (normalized.status === STATUS.fit && normalized.confidence === CONFIDENCE.certain) return 50;
    if (normalized.status === STATUS.unfit && normalized.confidence === CONFIDENCE.suspected) return 40;
    if (normalized.status === STATUS.fit && normalized.confidence === CONFIDENCE.suspected) return 30;
    if (normalized.status === STATUS.possible && normalized.confidence === CONFIDENCE.certain) return 25;
    if (normalized.status === STATUS.possible && normalized.confidence === CONFIDENCE.suspected) return 20;
    return 0;
  }

  function normalizeSectionItem(sourceSection, sectionId, itemId) {
    if (!sourceSection) return emptyCell();
    if (sectionId === "growth" && LEGACY_GROWTH_IDS[itemId]) {
      const candidates = LEGACY_GROWTH_IDS[itemId];
      return candidates
        .map((key) => normalizeCell(sourceSection[key]))
        .sort((a, b) => cellRank(b) - cellRank(a))[0] || emptyCell();
    }
    return normalizeCell(sourceSection[itemId]);
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
    if (!opts.force && cellRank(next) < cellRank(current)) return;
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

  function surfaceRegionId(label) {
    return Object.keys(REGION_LABEL_TO_ID).find((region) => label.indexOf(region) >= 0);
  }

  function surfaceGroupId(label) {
    if (label.indexOf("泥地") >= 0) return "dirt";
    if (label.indexOf("草地") >= 0) return "grass";
    return "";
  }

  function applySurfaceType(hints, surfaceType) {
    if (surfaceType === "草地" || surfaceType === "二刀流") {
      Object.keys(hints.grass).forEach((key) => {
        setStatus(hints, "grass", key, STATUS.possible, { confidence: CONFIDENCE.suspected });
      });
    }
    if (surfaceType === "泥地" || surfaceType === "二刀流") {
      Object.keys(hints.dirt).forEach((key) => {
        setStatus(hints, "dirt", key, STATUS.possible, { confidence: CONFIDENCE.suspected });
      });
    }
  }

  function applySurfaceGrade(hints, gradeInfo) {
    if (!gradeInfo || !gradeInfo.surface) return;
    const regionLabel = surfaceRegionId(gradeInfo.surface);
    const sectionId = surfaceGroupId(gradeInfo.surface);
    const itemId = REGION_LABEL_TO_ID[regionLabel];
    if (!sectionId || !itemId || !hints[sectionId] || !Object.prototype.hasOwnProperty.call(hints[sectionId], itemId)) return;
    const status = gradeInfo.grade === "C" || gradeInfo.grade === "G" ? STATUS.unfit : STATUS.fit;
    setStatus(hints, sectionId, itemId, status, { confidence: CONFIDENCE.suspected });
  }

  function applySurfaceComment(hints, comment) {
    if (!comment || !comment.claim) return;
    applySurfaceType(hints, comment.claim.surfaceType);
    (comment.claim.grades || []).forEach((grade) => applySurfaceGrade(hints, grade));
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
    applySurfaceComment(hints, commentById(commentDetails, "surface"));
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

  function raceSurfaceItem(race) {
    if (!race) return null;
    const sectionId = race.surface === "泥地" ? "dirt" : (race.surface === "草地" ? "grass" : "");
    const itemId = REGION_LABEL_TO_ID[race.surfaceRegion || "日本"] || "japan";
    return sectionId ? { sectionId, itemId } : null;
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

  function applyPostRace(career, raceResult, explicitComment) {
    if (!career || !raceResult) return null;
    const hints = ensureCurrent(career);
    const comment = postRaceComment(raceResult, explicitComment);
    if (!comment || comment.mode !== "clear") return hints;
    const race = raceResult.hidden && raceResult.hidden.race;
    if (comment.reason === "distance_too_short") {
      if (race && Number.isFinite(race.distance)) applyDistanceTooShort(hints, race.distance);
    } else if (comment.reason === "distance_too_long") {
      if (race && Number.isFinite(race.distance)) applyDistanceTooLong(hints, race.distance);
    } else if (comment.reason === "surface_mismatch") {
      const surfaceItem = raceSurfaceItem(race);
      if (surfaceItem) {
        setStatus(hints, surfaceItem.sectionId, surfaceItem.itemId, STATUS.unfit, { confidence: CONFIDENCE.certain });
      }
    } else if (comment.reason === "immature") {
      const stage = timeToGrowthStage(raceResult.hidden && raceResult.hidden.schedule || career.currentTime);
      if (stage) setStatus(hints, "growth", stage, STATUS.unfit, { confidence: CONFIDENCE.suspected });
    } else if (comment.reason === "declining") {
      setStatus(hints, "growth", "decline", STATUS.unfit, { confidence: CONFIDENCE.certain });
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
          statusLabel: statusLabel(cell.status),
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
