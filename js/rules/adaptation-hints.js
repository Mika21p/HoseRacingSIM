(function () {
  const ns = (window.Keiba = window.Keiba || {});

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

  const DISTANCE_TYPES = [
    { id: "sprint", label: "短距离", min: 1000, max: 1300 },
    { id: "mile", label: "英里", min: 1400, max: 1800 },
    { id: "middle", label: "中距离", min: 1900, max: 2200 },
    { id: "classic", label: "中长距离", min: 2300, max: 2600 },
    { id: "long", label: "长距离", min: 2601, max: 4200 }
  ];

  const GROWTH_TYPES = {
    "早熟": ["early", "classic"],
    "普早": ["early", "classic"],
    "普迟": ["classic", "older"],
    "晚熟": ["older"]
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
        { id: "early", label: "早期" },
        { id: "classic", label: "经典期" },
        { id: "older", label: "古马期" },
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

  function emptyHints() {
    return SECTIONS.reduce((hints, section) => {
      hints[section.id] = section.items.reduce((items, item) => {
        items[item.id] = STATUS.unknown;
        return items;
      }, {});
      return hints;
    }, {});
  }

  function statusLabel(status) {
    return STATUS_LABELS[status] || STATUS_LABELS.unknown;
  }

  function normalizeStatus(status) {
    return STATUS_LABELS[status] ? status : STATUS.unknown;
  }

  function normalizeHints(hints) {
    const source = hints || {};
    const normalized = emptyHints();
    SECTIONS.forEach((section) => {
      section.items.forEach((item) => {
        normalized[section.id][item.id] = normalizeStatus(
          source[section.id] && source[section.id][item.id]
        );
      });
    });
    return normalized;
  }

  function setStatus(hints, sectionId, itemId, status, options) {
    if (!hints || !hints[sectionId] || !Object.prototype.hasOwnProperty.call(hints[sectionId], itemId)) return;
    const opts = options || {};
    const current = hints[sectionId][itemId];
    const next = normalizeStatus(status);
    if (!opts.force && next === STATUS.possible && current !== STATUS.unknown) return;
    if (!opts.force && current === STATUS.unfit && next === STATUS.fit) return;
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
      setStatus(hints, "distance", item.id, STATUS.fit);
    });
  }

  function applyDistanceBoundary(hints, claim, lock) {
    if (!claim || !lock || !lock.distance) return false;
    const range = lock.distance;
    if (claim.boundary === "max") {
      DISTANCE_TYPES.forEach((item) => {
        if (item.max <= range.max) setStatus(hints, "distance", item.id, STATUS.possible);
        if (item.min > range.max) setStatus(hints, "distance", item.id, STATUS.unfit);
      });
      return true;
    }
    if (claim.boundary === "min") {
      DISTANCE_TYPES.forEach((item) => {
        if (item.min >= range.min) setStatus(hints, "distance", item.id, STATUS.possible);
        if (item.max < range.min) setStatus(hints, "distance", item.id, STATUS.unfit);
      });
      return true;
    }
    return false;
  }

  function applyStaminaHint(hints, stamina) {
    if (stamina === "short") {
      setStatus(hints, "distance", "sprint", STATUS.possible);
      setStatus(hints, "distance", "mile", STATUS.possible);
    } else if (stamina === "stays") {
      setStatus(hints, "distance", "middle", STATUS.possible);
      setStatus(hints, "distance", "classic", STATUS.possible);
      setStatus(hints, "distance", "long", STATUS.possible);
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
      Object.keys(hints.grass).forEach((key) => setStatus(hints, "grass", key, STATUS.possible));
    }
    if (surfaceType === "泥地" || surfaceType === "二刀流") {
      Object.keys(hints.dirt).forEach((key) => setStatus(hints, "dirt", key, STATUS.possible));
    }
  }

  function applySurfaceGrade(hints, gradeInfo) {
    if (!gradeInfo || !gradeInfo.surface) return;
    const regionLabel = surfaceRegionId(gradeInfo.surface);
    const sectionId = surfaceGroupId(gradeInfo.surface);
    const itemId = REGION_LABEL_TO_ID[regionLabel];
    if (!sectionId || !itemId || !hints[sectionId] || !Object.prototype.hasOwnProperty.call(hints[sectionId], itemId)) return;
    const status = gradeInfo.grade === "C" || gradeInfo.grade === "G" ? STATUS.unfit : STATUS.fit;
    setStatus(hints, sectionId, itemId, status, { force: true });
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
      (GROWTH_TYPES[type] || []).forEach((stage) => setStatus(hints, "growth", stage, STATUS.fit));
      if (type === "晚熟") setStatus(hints, "growth", "early", STATUS.unfit);
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
    if (!time) return "";
    if (time.index != null && ns.TimeRules && ns.TimeRules.toIndex) {
      if (time.index <= ns.TimeRules.toIndex(2, 10, 2)) return "early";
      if (time.index <= ns.TimeRules.toIndex(3, 5, 2)) return "classic";
      return "older";
    }
    if (time.age < 3) return time.month <= 10 ? "early" : "classic";
    if (time.age === 3 && time.month <= 5) return "classic";
    return "older";
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

  function applyPostRace(career, raceResult, explicitComment) {
    if (!career || !raceResult) return null;
    career.adaptationHints = normalizeHints(career.adaptationHints || createInitial(career.commentDetails));
    const comment = postRaceComment(raceResult, explicitComment);
    if (!comment || comment.mode !== "clear") return career.adaptationHints;
    const race = raceResult.hidden && raceResult.hidden.race;
    if (comment.reason === "distance_too_short" || comment.reason === "distance_too_long") {
      const distanceType = race && distanceTypeForDistance(race.distance);
      if (distanceType) setStatus(career.adaptationHints, "distance", distanceType.id, STATUS.unfit, { force: true });
    } else if (comment.reason === "surface_mismatch") {
      const surfaceItem = raceSurfaceItem(race);
      if (surfaceItem) setStatus(career.adaptationHints, surfaceItem.sectionId, surfaceItem.itemId, STATUS.unfit, { force: true });
    } else if (comment.reason === "immature") {
      const stage = timeToGrowthStage(raceResult.hidden && raceResult.hidden.schedule || career.currentTime);
      if (stage) setStatus(career.adaptationHints, "growth", stage, STATUS.unfit, { force: true });
    } else if (comment.reason === "declining") {
      setStatus(career.adaptationHints, "growth", "decline", STATUS.unfit, { force: true });
    }
    return career.adaptationHints;
  }

  function ensure(career) {
    if (!career || typeof career !== "object") return null;
    if (career.adaptationHints) {
      career.adaptationHints = normalizeHints(career.adaptationHints);
      return career.adaptationHints;
    }
    career.adaptationHints = createInitial(career.commentDetails);
    (career.races || []).forEach((record) => {
      applyPostRace(career, record);
    });
    return career.adaptationHints;
  }

  function getSections(career) {
    const hints = ensure(career) || emptyHints();
    return SECTIONS.map((section) => ({
      id: section.id,
      label: section.label,
      items: section.items.map((item) => {
        const status = normalizeStatus(hints[section.id] && hints[section.id][item.id]);
        return {
          id: item.id,
          label: item.label,
          status,
          statusLabel: statusLabel(status)
        };
      })
    }));
  }

  ns.AdaptationHintRules = {
    STATUS,
    SECTIONS,
    createInitial,
    applyPostRace,
    ensure,
    getSections,
    statusLabel
  };
})();
