(function () {
  const ns = (window.Keiba = window.Keiba || {});

  function optionList(items, selectedId) {
    return items.map((item) => `<option value="${item.id}" ${item.id === selectedId ? "selected" : ""}>${item.name}</option>`).join("");
  }

  function currentSireBloodlines(items) {
    return items.filter((item) => item.id === "random" || item.group !== "classic");
  }

  function valueOptions(items, selected) {
    return items.map((item) => `<option value="${item}" ${item === selected ? "selected" : ""}>${item}</option>`).join("");
  }

  function numberOptions(items, selected) {
    return items.map((item) => `<option value="${item}" ${item === selected ? "selected" : ""}>${item}m</option>`).join("");
  }

  function debugGradeSelect(id, label, selected, grades) {
    return `<label>${label}<select id="${id}">${valueOptions(grades || ["S", "A", "B", "C", "G"], selected)}</select></label>`;
  }

  function renderGradeList(items) {
    return Object.entries(items)
      .map(([name, grade]) => `<span class="grade-chip grade-${grade}">${name} <b>${grade}</b></span>`)
      .join("");
  }

  function changelogVersionParts(version) {
    const match = String(version || "").match(/^v?(\d+(?:\.\d+)*)([a-z]*)$/i);
    if (!match) return { numbers: [0], suffix: "" };
    return {
      numbers: match[1].split(".").map((part) => Number.parseInt(part, 10) || 0),
      suffix: match[2].toLowerCase()
    };
  }

  function compareChangelogEntries(a, b) {
    const left = changelogVersionParts(a.version);
    const right = changelogVersionParts(b.version);
    const length = Math.max(left.numbers.length, right.numbers.length);
    for (let index = 0; index < length; index += 1) {
      const diff = (right.numbers[index] || 0) - (left.numbers[index] || 0);
      if (diff !== 0) return diff;
    }
    if (left.suffix !== right.suffix) return right.suffix.localeCompare(left.suffix);
    return String(b.date || "").localeCompare(String(a.date || ""));
  }

  function normalizeHorseNameLanguage(language) {
    return language === "en" ? "en" : "zh";
  }

  function historicalHorseById(horseId) {
    if (!horseId) return null;
    return (ns.HistoricalHorses || []).find((horse) => horse.id === horseId) || null;
  }

  function historicalOpponentName(opponent, language, fallback) {
    const normalizedLanguage = normalizeHorseNameLanguage(language);
    const fallbackName = fallback || "随机对手";
    if (!opponent) return fallbackName;
    if (!opponent.historical && !opponent.horseId) {
      return opponent.displayName || opponent.name || fallbackName;
    }
    const horse = historicalHorseById(opponent.horseId);
    const source = horse || opponent;
    if (normalizedLanguage === "en") {
      return source.displayNameEn
        || opponent.displayNameEn
        || source.name
        || opponent.name
        || source.displayName
        || opponent.displayName
        || fallbackName;
    }
    return source.displayNameZh
      || opponent.displayNameZh
      || source.displayName
      || opponent.displayName
      || source.name
      || opponent.name
      || fallbackName;
  }

  function recordOpponentName(record, language) {
    const item = record || {};
    const publicResult = item.public || {};
    const hidden = item.hidden || {};
    const source = hidden.scheduledOpponent || hidden.opponent || null;
    const fallback = normalizeHorseNameLanguage(language) === "en"
      ? publicResult.opponentNameEn || publicResult.opponentName
      : publicResult.opponentNameZh || publicResult.opponentName;
    return historicalOpponentName(source, language, fallback || "随机对手");
  }

  function publicOpponentName(opponent, language) {
    if (!opponent) return "史实对手";
    const fallback = normalizeHorseNameLanguage(language) === "en"
      ? opponent.displayNameEn || opponent.displayName
      : opponent.displayNameZh || opponent.displayName;
    return historicalOpponentName({ ...opponent, historical: true }, language, fallback || "史实对手");
  }

  function renderOpponentRoster(opponents, language) {
    return `
      <div class="opponent-roster" aria-label="其他同场史实马">
        ${opponents.slice(1).map((opponent) => {
          const year = opponent.year ? `${opponent.year} ` : "";
          const savedRankLabel = opponent.rankLabel || "着外";
          const isOutsideTopFive = Number(opponent.rank) > 5 || /^[6-9]\d*着$/.test(savedRankLabel);
          const status = opponent.retired ? "退赛" : (isOutsideTopFive ? "着外" : savedRankLabel);
          return `
            <div class="opponent-roster-item">
              <strong>${year}${publicOpponentName(opponent, language)}</strong>
              <span>${opponent.jockeyName || "骑手不详"}</span>
              <em>${status}</em>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderHorseNameLanguageToggle(language) {
    const current = normalizeHorseNameLanguage(language);
    return `
      <div class="name-language-toggle" role="group" aria-label="史实马对手名称语言">
        <button class="secondary name-language-button ${current === "zh" ? "is-active" : ""}" type="button" data-horse-name-language="zh" aria-pressed="${current === "zh" ? "true" : "false"}">中文</button>
        <button class="secondary name-language-button ${current === "en" ? "is-active" : ""}" type="button" data-horse-name-language="en" aria-pressed="${current === "en" ? "true" : "false"}">EN</button>
      </div>
    `;
  }

  function normalizeRaceNameMode(mode) {
    return ns.RaceNameRules && ns.RaceNameRules.normalizeMode
      ? ns.RaceNameRules.normalizeMode(mode)
      : (mode === "original" ? "original" : "zh");
  }

  function raceById(raceId) {
    if (!raceId) return null;
    if (ns.RaceNameRules && ns.RaceNameRules.findRaceById) {
      return ns.RaceNameRules.findRaceById(raceId);
    }
    return (ns.Races || []).find((race) => race && race.id === raceId) || null;
  }

  function raceDisplayName(race, mode, fallback) {
    if (ns.RaceNameRules && ns.RaceNameRules.displayName) {
      return ns.RaceNameRules.displayName(race, mode, fallback);
    }
    return (race && (race.nameZh || race.name || race.nameOriginal)) || fallback || "";
  }

  function recordRaceName(record, mode) {
    const item = record || {};
    const publicResult = item.public || {};
    const race = raceById(publicResult.raceId) || (item.hidden && item.hidden.race) || null;
    const fallback = normalizeRaceNameMode(mode) === "original"
      ? publicResult.raceNameOriginal || publicResult.raceName
      : publicResult.raceNameZh || publicResult.raceName;
    return raceDisplayName(race, mode, fallback || "");
  }

  function renderRaceNameModeToggle(mode) {
    const current = normalizeRaceNameMode(mode);
    return `
      <div class="name-language-toggle race-name-mode-toggle" role="group" aria-label="赛事名显示模式">
        <button class="secondary name-language-button ${current === "zh" ? "is-active" : ""}" type="button" data-race-name-mode="zh" aria-pressed="${current === "zh" ? "true" : "false"}">中文</button>
        <button class="secondary name-language-button ${current === "original" ? "is-active" : ""}" type="button" data-race-name-mode="original" aria-pressed="${current === "original" ? "true" : "false"}">原名</button>
      </div>
    `;
  }

  function renderChangelogEntry(entry) {
    return `
      <article class="changelog-entry">
        <div>
          <span class="changelog-meta">${entry.date} · ${entry.version}</span>
          <h2>${entry.title}</h2>
        </div>
        <ul>
          ${(entry.items || []).map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </article>
    `;
  }

  function renderChangelog(container) {
    if (!container) return;
    const changelog = ns.Changelog || {};
    const roadmap = changelog.roadmap;
    const entries = (changelog.entries || []).slice().sort(compareChangelogEntries);
    const sections = [];

    if (roadmap && roadmap.items && roadmap.items.length) {
      sections.push(`
        <section class="changelog-section">
          <p class="changelog-section-title">计划中的更新目标</p>
          <article class="changelog-entry changelog-roadmap">
            <div>
              <span class="changelog-meta">计划中</span>
              <h2>${roadmap.title}</h2>
            </div>
            <ul>
              ${roadmap.items.map((item) => `<li>${item}</li>`).join("")}
            </ul>
          </article>
        </section>
      `);
    }

    if (entries.length) {
      sections.push(`
        <section class="changelog-section">
          <p class="changelog-section-title">版本更新日志</p>
          ${entries.map(renderChangelogEntry).join("")}
        </section>
      `);
    }

    container.innerHTML = sections.length ? sections.join("") : `<p class="muted">暂无更新记录。</p>`;
  }

  function raceRestrictionLabel(race) {
    return race.sexRestriction ? ` · ${race.sexRestriction}限定` : "";
  }

  function raceSurfaceDistanceLabel(race) {
    return `${race.surface}${race.distance}m`;
  }

  function raceVenueLabel(race) {
    const region = race.surfaceRegion || "日本";
    const course = race.course || "";
    if (region === "日本") return course || "其他地方";
    if (course && course !== "其他地方") return course;
    return ns.RegionRules && ns.RegionRules.getRaceRegionLabel
      ? ns.RegionRules.getRaceRegionLabel(race)
      : region;
  }

  function historyRecordKey(number) {
    return `race-${number}`;
  }

  function historyRaceDetail(record) {
    const item = record || {};
    const publicResult = item.public || {};
    const race = (item.hidden && item.hidden.race) || raceById(publicResult.raceId);
    if (!race) return "";
    return [
      item.hidden && item.hidden.expedition && item.hidden.expedition.active ? "远征" : "",
      race.surface,
      race.grade,
      race.distance ? `${race.distance}m` : "",
      raceVenueLabel(race)
    ].filter(Boolean).join(" · ");
  }

  function formatMarginLength(value, tieOutcome) {
    if (tieOutcome === "dead-heat") return "";
    if (tieOutcome === "player-win" || tieOutcome === "player-loss") return "鼻差";
    if (typeof value !== "number" || !Number.isFinite(value)) return "";
    if (value === 0) return "鼻差";
    if (value > 0 && value < 1) return "0.5马身";

    const integer = Math.floor(value);
    if (value === integer) return `${integer}马身`;
    return `${integer + 0.5}马身`;
  }

  function historyMarginText(record) {
    const hidden = record && record.hidden ? record.hidden : {};
    const publicResult = record && record.public ? record.public : {};
    const tieOutcome = hidden.tieOutcome || publicResult.tieOutcome || "";
    const margin = hidden.marginLabel || formatMarginLength(hidden.marginLengths, tieOutcome);
    if (!margin) return "";
    return hidden.scoreDiff < 0 || tieOutcome === "player-loss" ? `（${margin}）` : margin;
  }

  function historyPostRaceCommentText(record) {
    const item = record || {};
    const publicResult = item.public || {};
    const hiddenComment = item.hidden && item.hidden.postRaceComment;
    const text = publicResult.postRaceCommentText || (hiddenComment && hiddenComment.text) || "";
    return typeof text === "string" ? text : "";
  }

  function renderHistoryBulkControls(disabled) {
    return `
      <span class="history-index-heading">
        <span>#</span>
        <span class="history-bulk-controls" aria-label="生涯记录批量操作">
          <button class="secondary history-bulk-toggle" id="historyExpandAllBtn" type="button" aria-label="完全展开比赛记录" title="完全展开比赛记录" ${disabled ? "disabled" : ""}>+</button>
          <button class="secondary history-bulk-toggle" id="historyCollapseAllBtn" type="button" aria-label="完全折叠比赛记录" title="完全折叠比赛记录" ${disabled ? "disabled" : ""}>-</button>
        </span>
      </span>
    `;
  }

  function renderHistoryRecordSummary(career) {
    const summary = ns.CareerRules && ns.CareerRules.getRecordSummary
      ? ns.CareerRules.getRecordSummary(career)
      : { starts: 0, wins: 0, firsts: 0, seconds: 0, thirds: 0, others: 0, grade1Wins: 0, grade2Wins: 0, grade3Wins: 0 };
    return `
      <div class="history-record-summary" aria-label="当前战绩统计">
        <span>${summary.starts}战${summary.wins}胜</span>
        <span>[${summary.firsts}-${summary.seconds}-${summary.thirds}-${summary.others}]</span>
        <span>G1 ${summary.grade1Wins}胜</span>
        <span>G2 ${summary.grade2Wins}胜</span>
        <span>G3 ${summary.grade3Wins}胜</span>
      </div>
    `;
  }

  function renderAchievements(career) {
    const achievements = ns.AchievementRules && ns.AchievementRules.evaluate
      ? ns.AchievementRules.evaluate(career)
      : [];
    if (!achievements.length) {
      return `
        <div class="achievement-section">
          <p class="eyebrow">成就</p>
          <p class="muted">暂无特殊成就。</p>
        </div>
      `;
    }
    const groups = achievements.reduce((items, achievement) => {
      const key = achievement.category || "base";
      if (!items[key]) {
        items[key] = {
          label: achievement.categoryLabel || "成就",
          achievements: []
        };
      }
      items[key].achievements.push(achievement);
      return items;
    }, {});
    return `
      <div class="achievement-section">
        <p class="eyebrow">成就</p>
        <div class="achievement-board">
          ${Object.keys(groups).map((key) => `
            <div class="achievement-group achievement-group-${key}">
              <h3>${groups[key].label}</h3>
              <div class="achievement-list">
                ${groups[key].achievements.map((achievement) => `
                  <span class="achievement-chip achievement-chip-${key}" title="${achievement.description || achievement.name}">${achievement.name}</span>
                `).join("")}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  function isReturnTravel(travel) {
    return !!travel && !!travel.active && (travel.kind === "return" || travel.returnToStable);
  }

  function travelPlanLabel(travel) {
    return isReturnTravel(travel) ? "返厩检疫" : "远征+检疫";
  }

  function travelBadgeLabel(travel, locked) {
    if (isReturnTravel(travel)) return locked ? "返厩检疫中" : "需返厩检疫";
    return locked ? "远征检疫中" : "需远征检疫";
  }

  function travelLockedText(travel) {
    return isReturnTravel(travel) ? "正在返厩检疫中，本场比赛不能取消。" : "正在远征检疫中，本场比赛不能取消。";
  }

  function raceOptionLabel(plan, mode) {
    const challengeLabel = plan.challenge ? "[格上] " : "";
    const priorityLabel = plan.priorityEntry ? "[优先] " : "";
    const expeditionLabel = plan.travel && plan.travel.active
      ? `[${travelPlanLabel(plan.travel)}] `
      : (plan.expedition && plan.expedition.active ? "[远征] " : "");
    return `${expeditionLabel}${challengeLabel}${priorityLabel}${plan.schedule.label} · ${raceDisplayName(plan.race, mode)} · ${plan.race.grade} · ${plan.race.ageRule}${raceRestrictionLabel(plan.race)} · ${raceSurfaceDistanceLabel(plan.race)} · ${raceVenueLabel(plan.race)}`;
  }

  const FEATURED_COURSES = ["京都", "阪神", "中山", "东京"];
  const REGION_FILTER_VALUES = ["japan", "america", "europe", "other"];
  const JAPAN_COURSE_FILTER_VALUES = ["kyoto", "hanshin", "tokyo", "nakayama", "other"];
  const JAPAN_COURSE_VALUE_MAP = {
    kyoto: "京都",
    hanshin: "阪神",
    nakayama: "中山",
    tokyo: "东京"
  };
  const LEGACY_COURSE_TO_JAPAN_COURSE = {
    kyoto: "kyoto",
    hanshin: "hanshin",
    tokyo: "tokyo",
    nakayama: "nakayama",
    "other-japan": "other"
  };
  const RACE_FILTER_GROUPS = [
    {
      id: "grade",
      label: "等级",
      options: [
        { value: "g1", label: "G1/JpnI" },
        { value: "g2", label: "G2/JpnII" },
        { value: "g3", label: "G3/JpnIII" },
        { value: "op", label: "公开赛" },
        { value: "condition", label: "条件赛" }
      ]
    },
    {
      id: "surface",
      label: "场地",
      options: [
        { value: "草地", label: "草地" },
        { value: "泥地", label: "泥地" }
      ]
    },
    {
      id: "distance",
      label: "距离",
      options: [
        { value: "sprint", label: "短途1000-1300" },
        { value: "mile", label: "英里1400-1800" },
        { value: "middle", label: "中距离1900-2200" },
        { value: "intermediate", label: "中长距离2300-2600" },
        { value: "long", label: "长距离2601+" }
      ]
    },
    {
      id: "region",
      label: "地区",
      options: [
        { value: "japan", label: "日本" },
        { value: "america", label: "美国" },
        { value: "europe", label: "欧洲" },
        { value: "other", label: "其他" }
      ]
    },
    {
      id: "japanCourse",
      label: "日本赛场",
      options: [
        { value: "kyoto", label: "京都" },
        { value: "hanshin", label: "阪神" },
        { value: "tokyo", label: "东京" },
        { value: "nakayama", label: "中山" },
        { value: "other", label: "其他" }
      ]
    }
  ];

  function filterValues(filters, key) {
    const value = filters && filters[key];
    if (Array.isArray(value)) return value.filter((item) => item && item !== "all");
    if (!value || value === "all") return [];
    return [value];
  }

  function normalizeRaceFilters(filters) {
    let region = filterValues(filters, "region").filter((item) => REGION_FILTER_VALUES.includes(item));
    let japanCourse = filterValues(filters, "japanCourse").filter((item) => JAPAN_COURSE_FILTER_VALUES.includes(item));
    const legacyCourses = filterValues(filters, "course")
      .map((item) => LEGACY_COURSE_TO_JAPAN_COURSE[item])
      .filter(Boolean);

    if (region.length === 0 && japanCourse.length === 0 && legacyCourses.length > 0) {
      region = ["japan"];
      japanCourse = [...new Set(legacyCourses)];
    }
    if (!region.includes("japan")) japanCourse = [];

    return {
      grade: filterValues(filters, "grade"),
      surface: filterValues(filters, "surface"),
      distance: filterValues(filters, "distance"),
      region,
      japanCourse,
      avoidFatigueRisk: !!(filters && filters.avoidFatigueRisk)
    };
  }

  function gradeMatches(raceClass, value) {
    return raceClass === value
      || (value === "g1" && raceClass === "jpn1")
      || (value === "g2" && raceClass === "jpn2")
      || (value === "g3" && raceClass === "jpn3")
      || (value === "op" && raceClass === "listed")
      || (value === "condition" && ns.RaceProgression.CONDITION_CLASSES.includes(raceClass));
  }

  function distanceMatches(distance, value) {
    return (value === "sprint" && distance >= 1000 && distance <= 1300)
      || (value === "mile" && distance >= 1400 && distance <= 1800)
      || (value === "middle" && distance >= 1900 && distance <= 2200)
      || (value === "intermediate" && distance >= 2300 && distance <= 2600)
      || (value === "long" && distance >= 2601);
  }

  function raceRegionValue(race) {
    const region = race.surfaceRegion || "日本";
    if (region === "日本") return "japan";
    if (region === "美国") return "america";
    if (region === "欧洲") return "europe";
    return "other";
  }

  function regionMatches(race, value) {
    return raceRegionValue(race) === value;
  }

  function japanCourseMatches(race, value) {
    const region = race.surfaceRegion || "日本";
    if (region !== "日本") return true;
    if (JAPAN_COURSE_VALUE_MAP[value]) return race.course === JAPAN_COURSE_VALUE_MAP[value];
    if (value === "other") return !FEATURED_COURSES.includes(race.course);
    return false;
  }

  function groupMatches(values, matcher) {
    return values.length === 0 || values.some(matcher);
  }

  function hasFatigueRisk(career, plan) {
    if (!career || !plan || !ns.RaceFatigueRules || !ns.RaceFatigueRules.previewFatigueRisk) return false;
    const risk = ns.RaceFatigueRules.previewFatigueRisk(career, plan.race, plan.schedule, {
      priorityEntry: plan.priorityEntry || null
    });
    return !!(risk && risk.eligible && risk.probability > 0);
  }

  function raceMatchesFilters(plan, filters, career) {
    const currentFilters = normalizeRaceFilters(filters);
    if (currentFilters.avoidFatigueRisk && hasFatigueRisk(career, plan)) return false;
    const raceClass = plan.race.raceClass;
    const raceDistance = plan.race.distance;
    const gradeMatched = groupMatches(currentFilters.grade, (value) => gradeMatches(raceClass, value));
    const surfaceMatched = groupMatches(currentFilters.surface, (value) => plan.race.surface === value);
    const distanceMatched = groupMatches(currentFilters.distance, (value) => distanceMatches(raceDistance, value));
    const regionMatched = groupMatches(currentFilters.region, (value) => regionMatches(plan.race, value));
    const japanCourseMatched = groupMatches(currentFilters.japanCourse, (value) => japanCourseMatches(plan.race, value));
    return gradeMatched && surfaceMatched && distanceMatched && regionMatched && japanCourseMatched;
  }

  function filterSummary(group, selectedValues, disabled) {
    if (disabled) return "需先选日本";
    if (selectedValues.length === 0) return "全部";
    const labels = selectedValues
      .map((value) => (group.options.find((option) => option.value === value) || {}).label)
      .filter(Boolean);
    if (labels.length <= 2) return labels.join("+");
    return `${labels.slice(0, 2).join("+")}+${labels.length - 2}`;
  }

  function renderFilterGroup(group, filters, activeFilterGroup, disabled) {
    const selectedValues = filterValues(filters, group.id);
    const selectedSet = new Set(selectedValues);
    const isOpen = !disabled && activeFilterGroup === group.id;
    return `
      <details class="race-filter-menu ${disabled ? "is-disabled" : ""}" data-race-filter-group="${group.id}" ${isOpen ? "open" : ""} ${disabled ? `aria-disabled="true"` : ""}>
        <summary>
          <span>${group.label}：${filterSummary(group, selectedValues, disabled)}</span>
          <b>${disabled ? "未启用" : selectedValues.length || "全部"}</b>
        </summary>
        <div class="race-filter-options">
          ${group.options.map((option) => `
            <label class="race-filter-option">
              <input type="checkbox" data-race-filter="${group.id}" value="${option.value}" ${selectedSet.has(option.value) ? "checked" : ""} ${disabled ? "disabled" : ""}>
              <span>${option.label}</span>
            </label>
          `).join("")}
          <button class="secondary filter-clear-button" type="button" data-filter-clear="${group.id}" ${selectedValues.length && !disabled ? "" : "disabled"}>清除${group.label}</button>
        </div>
      </details>
    `;
  }

  function hasActiveRaceFilters(filters) {
    return RACE_FILTER_GROUPS.some((group) => filterValues(filters, group.id).length > 0)
      || !!(filters && filters.avoidFatigueRisk);
  }

  function renderRiskFilter(filters) {
    const checked = filters && filters.avoidFatigueRisk;
    return `
      <label class="race-risk-filter">
        <input type="checkbox" data-race-filter-toggle="avoidFatigueRisk" ${checked ? "checked" : ""}>
        <span>避开疲劳风险赛事</span>
      </label>
    `;
  }

  function renderRaceFilters(filters, activeFilterGroup) {
    const currentFilters = normalizeRaceFilters(filters);
    const active = hasActiveRaceFilters(currentFilters);
    return `
      <div class="filter-row" aria-label="比赛筛选">
        ${RACE_FILTER_GROUPS.map((group) => renderFilterGroup(
          group,
          currentFilters,
          activeFilterGroup,
          group.id === "japanCourse" && !currentFilters.region.includes("japan")
        )).join("")}
        ${renderRiskFilter(currentFilters)}
        <button class="secondary filter-clear-all" id="clearAllRaceFiltersBtn" type="button" ${active ? "" : "disabled"}>清除筛选</button>
      </div>
    `;
  }

  function renderRacePlanCards(plans, mode) {
    return `
      <div class="race-card-list" role="listbox" aria-label="可报名赛事">
        ${plans.map((plan, index) => `
          <button class="secondary race-plan-card ${index === 0 ? "is-active" : ""}" type="button" data-race-card="${plan.race.id}" aria-pressed="${index === 0 ? "true" : "false"}">
            <span class="race-card-meta">${plan.schedule.label} · ${plan.race.grade}</span>
            <strong>${raceDisplayName(plan.race, mode)}</strong>
            <span>${plan.race.ageRule}${raceRestrictionLabel(plan.race)} · ${raceSurfaceDistanceLabel(plan.race)} · ${raceVenueLabel(plan.race)}</span>
            ${plan.travel && plan.travel.active && plan.travel.prepLabel ? `<span>检疫预备：${plan.travel.prepLabel}</span>` : ""}
            ${plan.challenge ? `<em>格上</em>` : ""}
            ${plan.priorityEntry ? `<em>优先</em>` : ""}
            ${plan.travel && plan.travel.active ? `<em>${travelPlanLabel(plan.travel)}</em>` : (plan.expedition && plan.expedition.active ? `<em>远征</em>` : "")}
          </button>
        `).join("")}
      </div>
    `;
  }

  function renderSetup(root) {
    const sireBloodlines = currentSireBloodlines(ns.SireBloodlines || ns.Bloodlines || []);
    const damBloodlines = ns.DamBloodlines || ns.Bloodlines || [];
    const defaultTrainer = ns.CommentRules ? ns.CommentRules.getTrainer("sato-yuta") : null;
    const defaultRegionId = ns.RegionRules && ns.RegionRules.regionIdForTrainer
      ? ns.RegionRules.regionIdForTrainer(defaultTrainer)
      : "japan";
    const defaultAffiliation = ns.RegionRules && ns.RegionRules.getJockeyAffiliation
      ? ns.RegionRules.getJockeyAffiliation(defaultRegionId)
      : "japan";
    const jockeys = ns.JockeyRules
      ? ns.JockeyRules.getPlayerSelectableJockeys(defaultAffiliation)
      : ns.Jockeys || [];
    const excellentJockeyMinAbility = ns.JockeyRules ? ns.JockeyRules.PLAYER_EXCELLENT_MIN_ABILITY : 70;
    const trainers = ns.CommentRules ? ns.CommentRules.getTrainerOptions() : [];
    const grades = ["S", "A", "B", "C", "G"];
    const courseGrades = ["S", "A", "B"];
    const seasons = [
      "二岁夏", "二岁秋", "二岁冬",
      "三岁春", "三岁夏", "三岁秋", "三岁冬",
      "四岁春", "四岁夏", "四岁秋", "四岁冬",
      "五岁春", "五岁夏", "五岁秋", "五岁冬",
      "六岁春", "六岁夏", "六岁秋", "六岁冬",
      "七岁春", "七岁夏", "七岁秋", "七岁冬"
    ];
    const distances = [1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 3000, 3200, 3600];
    root.innerHTML = `
      <section class="home-screen" id="homeScreen" aria-labelledby="homeTitle">
        <header class="home-brand-bar">
          <div class="home-brand"><img src="assets/home/logo.svg" width="48" height="48" alt=""><div><strong>赛马生涯模拟</strong><span>KEIBA CAREER SIMULATOR</span></div></div>
          <span class="home-brand-note">每一次出闸，都是新的可能。</span>
        </header>
        <section class="home-banner" aria-labelledby="homeTitle">
          <img class="home-banner-art" src="assets/home/racing-hero.png" alt="" fetchpriority="high" width="2172" height="724">
          <div class="home-banner-copy">
            <p class="home-kicker"><span></span> YOUR NEXT CHAPTER STARTS HERE</p>
            <h1 id="homeTitle" tabindex="-1">下一匹传奇，<br>由你<span>缔造。</span></h1>
            <p class="home-banner-lead">培育赛马，规划竞赛生涯。<br>从初次出闸，到世界赛场，奔赴属于你的终点线。</p>
            <div class="home-banner-caption"><span>育成</span><i></i><span>竞逐</span><i></i><span>荣耀</span></div>
          </div>
          <span class="home-art-caption" aria-hidden="true">THE TRACK IS YOURS.</span>
        </section>
        <div class="home-mode-heading"><div><p class="home-kicker">CHOOSE YOUR JOURNEY</p><h2>选择你的赛马之旅</h2></div><span>五种玩法，无限可能</span></div>
        <div class="home-mode-grid">
          <section class="home-mode-card home-mode-career" aria-labelledby="homeCareerTitle">
            <div class="home-card-top"><img src="assets/home/career.svg" width="44" height="44" alt=""><span class="home-card-index">01 / CAREER</span></div>
            <h3 id="homeCareerTitle">普通生涯</h3><p class="home-card-tagline">从第一步，跑向无限可能</p>
            <p class="home-card-description">选择血统、练马师与骑手，培育独一无二的赛马，规划你的竞赛生涯。</p>
            <div class="home-card-tags"><span>自由育成</span><span>全球赛程</span></div>
            <div class="home-card-bottom">
              <p class="home-card-status" id="homeSaveStatus" aria-live="polite">暂无存档</p>
              <div class="home-card-actions"><button class="home-mode-action" id="homeStartBtn" type="button">开始生涯</button><button class="home-mode-resume" id="homeContinueBtn" type="button" hidden>继续生涯</button></div>
            </div>
          </section>
          <section class="home-mode-card home-mode-legend" aria-labelledby="homeLegendTitle">
            <div class="home-card-top"><img src="assets/home/legend.svg" width="44" height="44" alt=""><span class="home-card-index">02 / LEGEND</span></div>
            <h3 id="homeLegendTitle">传奇模式</h3><p class="home-card-tagline">迎战五匹史实强敌</p>
            <p class="home-card-description">以更高潜力出道，与史实名马同场较量，把你的名字写进赛场传奇。</p>
            <div class="home-card-tags"><span>史实阵容</span><span>报名锁定</span></div>
            <div class="home-card-bottom"><p class="home-card-status">向历代名马发起挑战</p><div class="home-card-actions"><button class="home-mode-action" id="homeLegendBtn" type="button">开始传奇模式</button></div></div>
          </section>
          <section class="home-mode-card home-mode-rogue" aria-labelledby="homeRogueTitle">
            <div class="home-card-top"><img src="assets/home/rogue.svg" width="44" height="44" alt=""><span class="home-card-index">03 / ROGUELIKE</span></div>
            <h3 id="homeRogueTitle">肉鸽挑战</h3><p class="home-card-tagline">从未知候选中押注传奇</p>
            <p class="home-card-description">挑选随机小马，锁定本轮挑战。积累荣誉币，让每一次重来更进一步。</p>
            <div class="home-card-tags"><span>随机候选</span><span>荣誉币循环</span></div>
            <div class="home-card-bottom"><p class="home-card-status" id="homeRogueStatus">荣誉币 0 · 仅佐藤悠太已解锁</p><div class="home-card-actions"><button class="home-mode-action" id="homeRogueBtn" type="button">进入肉鸽挑战</button><button class="home-mode-resume" id="homeRogueContinueBtn" type="button" hidden>继续肉鸽进度</button></div></div>
          </section>
          <section class="home-mode-card home-mode-era" aria-labelledby="homeEraTitle">
            <div class="home-card-top"><img src="assets/home/era.svg" width="44" height="44" alt=""><span class="home-card-index">04 / STORY</span></div>
            <h3 id="homeEraTitle">剧情模式 <span class="home-mode-badge">测试</span></h3><p class="home-card-tagline">走进黄金时代的故事</p>
            <p class="home-card-description">踏入 1997—1998 年的赛马世界，在时代的交汇处，书写你的赛场篇章。</p>
            <div class="home-card-tags"><span>时代叙事</span><span>剧情体验</span></div>
            <div class="home-card-bottom"><p class="home-card-status">黄金世代 · 故事由此展开</p><div class="home-card-actions"><button class="home-mode-action" id="homeEraBtn" type="button">进入剧情模式</button></div></div>
          </section>
        </div>

        <section class="home-how-to" aria-labelledby="homeHowToTitle">
          <div class="home-section-heading">
            <p class="eyebrow">简单玩法</p>
            <h2 id="homeHowToTitle">三个步骤，开始一段赛马生涯</h2>
          </div>
          <div class="home-play-grid">
            <article class="home-play-card"><span>01</span><h3>创建小马</h3><p>选择血统、练马师和主战骑手，生成独特的能力、成长与适性。</p></article>
            <article class="home-play-card"><span>02</span><h3>规划赛程</h3><p>根据距离、场地和成长阶段报名比赛，再逐回合推进时间。</p></article>
            <article class="home-play-card"><span>03</span><h3>冲击荣誉</h3><p>挑战各地重赏与史实名马，最终回顾完整战绩和生涯成就。</p></article>
          </div>
        </section>

        <div class="home-support-row">
          <section class="home-feedback-card" aria-labelledby="homeFeedbackTitle">
            <div class="home-feedback-copy">
              <p class="eyebrow">交流与反馈</p>
              <h2 id="homeFeedbackTitle">一起把赛马生涯做得更好</h2>
              <p>发现问题、想补充赛事与名马资料，或有新的玩法建议？欢迎加入反馈群，和我们一起完善这段赛马生涯。</p>
            </div>
            <div class="home-feedback-number">
              <div>
                <span>QQ群</span>
                <strong id="feedbackGroupNumber">1050162087</strong>
                <small id="feedbackCopyStatus" aria-live="polite">点击按钮即可复制</small>
              </div>
              <button id="copyFeedbackGroupBtn" type="button" data-feedback-group-number="1050162087" aria-describedby="feedbackCopyStatus">复制群号</button>
            </div>
          </section>
          <div class="home-secondary-actions">
            <button class="secondary" id="homeHelpBtn" type="button">游戏帮助</button>
            <button class="secondary" id="homeChangelogBtn" type="button">更新日志</button>
          </div>
        </div>
        <footer class="site-footer">
          <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">沪ICP备2026032931号</a>
        </footer>
      </section>

      <div class="setup-overlay" id="setupOverlay" hidden>
      <section class="panel setup-panel" aria-labelledby="setupPageTitle">
        <div class="setup-title-row">
          <div class="setup-heading-group">
            <p class="eyebrow">出道准备</p>
            <div class="setup-heading-line">
              <h1 id="setupPageTitle" tabindex="-1">赛马生涯模拟</h1>
              <button class="secondary legend-mode-toggle" id="gameModeToggleBtn" type="button" aria-pressed="false" aria-label="当前为普通模式，点击开启传奇模式" title="当前为普通模式，点击开启传奇模式">
                <span class="legend-mode-toggle-indicator" aria-hidden="true"></span>
                <span>传奇模式</span>
              </button>
            </div>
          </div>
          <div class="setup-title-actions">
            <button class="secondary help-toggle" id="helpToggleBtn" type="button" aria-expanded="false">帮助</button>
            <button class="secondary setup-close" id="setupCloseBtn" type="button">返回主页</button>
          </div>
        </div>
        <input id="gameModeSelect" type="hidden" value="normal">
        <dialog class="legend-intro-dialog" id="legendIntroDialog" aria-labelledby="legendIntroTitle" aria-describedby="legendIntroSummary">
          <div class="legend-intro-header">
            <div>
              <p class="eyebrow">高强度生涯挑战</p>
              <h2 id="legendIntroTitle">传奇模式</h2>
            </div>
            <button class="secondary legend-intro-close" type="button" data-legend-intro-close aria-label="关闭传奇模式介绍" title="关闭">×</button>
          </div>
          <p id="legendIntroSummary">玩家马会以更高潜力出道，但每场比赛都要面对完整的史实强敌阵容。</p>
          <ul class="legend-intro-list">
            <li><strong>更高出道潜力</strong>：玩家马更容易拥有顶级实力，血统仍会影响适性、成长和气性。</li>
            <li><strong>完整史实阵容</strong>：所有史实对手都会参与完整比赛计算，并留下实际名次。</li>
            <li><strong>按胜鞍筛选强敌</strong>：对手必须在合适的场地、距离和认可赛区证明过自己，顶级赛事会优先安排强马。</li>
            <li><strong>报名即锁定阵容</strong>：刷新和读取存档不会重抽，也不会加入隐藏马、随机马或退赛递补。</li>
            <li><strong>评语更加可靠</strong>：出道前判断和输赛后的原因诊断会比普通模式更准确。</li>
          </ul>
          <label class="legend-intro-preference">
            <input id="legendIntroDismissCheckbox" type="checkbox">
            <span>下次不再显示此介绍</span>
          </label>
          <div class="legend-intro-actions">
            <button type="button" data-legend-intro-close>知道了</button>
          </div>
        </dialog>
        <div class="save-panel" id="savePanel" aria-live="polite">
          <div>
            <p class="eyebrow">本机存档</p>
            <p class="muted" id="saveStatusText">暂无存档</p>
          </div>
          <button class="secondary save-clear" id="clearSaveBtn" type="button" hidden>清除存档</button>
        </div>
        <div class="form-grid">
          <label>马名
            <input id="horseNameInput" type="text" value="未命名小马">
          </label>
          <div class="field-block sire-field">
            <div class="field-label-row">
              <div class="field-label-title">
                <span>父系</span>
                <button class="secondary icon-help-button" id="sireHelpToggleBtn" type="button" aria-expanded="false" aria-label="查看父系特点" title="父系特点">?</button>
              </div>
              <label class="filter-checkbox sire-classic-toggle">
                <input id="classicSireToggle" type="checkbox">
                经典父系
              </label>
            </div>
            <select id="sireSelect">${optionList(sireBloodlines, "random")}</select>
          </div>
          <div class="field-block dam-field">
            <div class="field-label-row">
              <div class="field-label-title">
                <span>母系</span>
                <button class="secondary icon-help-button" id="damHelpToggleBtn" type="button" aria-expanded="false" aria-label="查看母系特点" title="母系特点">?</button>
              </div>
            </div>
            <select id="damSelect">${optionList(damBloodlines, "random")}</select>
          </div>
          <div class="field-block trainer-field">
            <div class="field-label-row">
              <span>练马师</span>
              <button class="secondary icon-help-button" id="trainerHelpToggleBtn" type="button" aria-expanded="false" aria-label="查看练马师信息" title="练马师信息">?</button>
            </div>
            <select id="trainerSelect">${optionList(trainers, "sato-yuta")}</select>
            <p class="muted trainer-region-note" id="trainerRegionText">所属地：${ns.RegionRules ? ns.RegionRules.getRegion(defaultRegionId).label : "日本"}</p>
          </div>
          <div class="field-block jockey-field">
            <div class="field-label-row">
              <span>主战骑手</span>
            </div>
            <select id="mainJockeySelect">${optionList(jockeys, "take-yutaka")}</select>
            <div class="jockey-filter-row" aria-label="骑手筛选">
              <label class="filter-checkbox">
                <input id="excellentJockeyToggle" type="checkbox" data-min-ability="${excellentJockeyMinAbility}">
                优秀骑手
              </label>
            </div>
          </div>
        </div>
        <div class="help-panel sire-help-panel" id="sireHelpPanel" hidden>
          ${ns.Help ? ns.Help.sireHelpHtml : ""}
          <div class="help-panel-actions">
            <button class="secondary help-panel-close" type="button" data-help-close="sireHelpPanel">收起</button>
          </div>
        </div>
        <div class="help-panel dam-help-panel" id="damHelpPanel" hidden>
          ${ns.Help ? ns.Help.damHelpHtml : ""}
          <div class="help-panel-actions">
            <button class="secondary help-panel-close" type="button" data-help-close="damHelpPanel">收起</button>
          </div>
        </div>
        <div class="help-panel trainer-help-panel" id="trainerHelpPanel" hidden>
          ${ns.Help ? ns.Help.trainerHelpHtml : ""}
          <div class="help-panel-actions">
            <button class="secondary help-panel-close" type="button" data-help-close="trainerHelpPanel">收起</button>
          </div>
        </div>
        <label class="debug-toggle">
          <input id="debugModeToggle" type="checkbox">
          调试模式
        </label>
        <div class="debug-panel" id="debugPanel" hidden>
          <div>
            <p class="eyebrow">自选属性</p>
            <p class="muted">仅用于测试。生成后会在生涯记录显示调试模式。</p>
          </div>
          <div class="debug-section">
            <h3>基础</h3>
            <div class="debug-grid">
              <label>性别
                <select id="debugGender">${valueOptions(["牡马", "牝马"], "牡马")}</select>
              </label>
              <label>毛色
                <select id="debugCoat">${valueOptions((ns.HorseRules.COATS || []).map((coat) => coat.name), "鹿毛")}</select>
              </label>
              <label>实力
                <input id="debugStrength" type="range" min="62" max="100" value="80">
                <output id="debugStrengthValue">80</output>
              </label>
              <label>马体重
                <input id="debugWeight" type="number" min="350" max="620" step="1" value="480">
              </label>
              <label>气性
                <select id="debugTemperament">${valueOptions(["极端暴躁", "暴躁", "胆小", "普通", "沉稳", "冷静", "极其聪明"], "普通")}</select>
              </label>
              <label>主场倾向
                <select id="debugSurfacePref">${valueOptions(["草地", "泥地", "二刀流"], "草地")}</select>
              </label>
            </div>
          </div>
          <div class="debug-section">
            <h3>距离与成长</h3>
            <div class="debug-grid">
              <label>核心距离
                <select id="debugCoreDist">${numberOptions(distances, 2000)}</select>
              </label>
              <label>距离下限
                <select id="debugDistMin">${numberOptions(distances, 1600)}</select>
              </label>
              <label>距离上限
                <select id="debugDistMax">${numberOptions(distances, 2400)}</select>
              </label>
              <label>成长型
                <select id="debugGrowthType">${valueOptions(["早熟", "普早", "普迟", "晚熟"], "普早")}</select>
              </label>
              <label>成熟期开始
                <select id="debugPeakStart">${valueOptions(seasons, "三岁春")}</select>
              </label>
              <label>成熟期结束
                <select id="debugPeakEnd">${valueOptions(seasons, "五岁春")}</select>
              </label>
              <label>重场
                <select id="debugHeavyType">${valueOptions(["不佳", "普通", "擅长", "鬼"], "普通")}</select>
              </label>
            </div>
          </div>
          <div class="debug-section">
            <h3>场地适性</h3>
            <div class="debug-grid">
              ${debugGradeSelect("debugGrassJapan", "日本草地", "A", grades)}
              ${debugGradeSelect("debugGrassHongKong", "香港草地", "B", grades)}
              ${debugGradeSelect("debugGrassUsa", "美国草地", "B", grades)}
              ${debugGradeSelect("debugGrassEurope", "欧洲草地", "B", grades)}
              ${debugGradeSelect("debugGrassOther", "其他草地", "B", grades)}
              ${debugGradeSelect("debugDirtJapan", "日本泥地", "B", grades)}
              ${debugGradeSelect("debugDirtMiddleEast", "中东泥地", "B", grades)}
              ${debugGradeSelect("debugDirtUsa", "美国泥地", "B", grades)}
            </div>
          </div>
          <div class="debug-section">
            <h3>日本赛场适性</h3>
            <div class="debug-grid">
              ${debugGradeSelect("debugCourseTokyo", "东京", "A", courseGrades)}
              ${debugGradeSelect("debugCourseNakayama", "中山", "A", courseGrades)}
              ${debugGradeSelect("debugCourseKyoto", "京都", "A", courseGrades)}
              ${debugGradeSelect("debugCourseHanshin", "阪神", "A", courseGrades)}
              ${debugGradeSelect("debugCourseOther", "其他地方", "A", courseGrades)}
            </div>
          </div>
        </div>
        <button class="primary" id="generateBtn">生成小马</button>
      </section>
      </div>

      <div class="rogue-overlay" id="rogueOverlay" hidden>
        <section class="panel rogue-panel" aria-labelledby="roguePageTitle">
          <div id="rogueContent"></div>
        </section>
      </div>

      <div class="era-overlay" id="eraOverlay" hidden></div>

      <section class="workspace-shell" id="workspaceShell" hidden aria-label="生涯工作台">
        <header class="workspace-status" id="workspaceStatus"></header>
        <div class="workspace-layout">
          <nav class="workspace-nav" aria-label="生涯页面">
            <button class="workspace-nav-button" type="button" data-return-home>
              <span class="workspace-nav-icon" aria-hidden="true">⌂</span><span>首页</span>
            </button>
            <button class="workspace-nav-button is-active" type="button" data-workspace-view="action" data-workspace-section="race" aria-current="page">
              <span class="workspace-nav-icon" aria-hidden="true">▶</span><span>行动</span>
            </button>
            <button class="workspace-nav-button" type="button" data-workspace-section="history">
              <span class="workspace-nav-icon" aria-hidden="true">▤</span><span>记录</span>
            </button>
            <button class="workspace-nav-button" type="button" data-workspace-view="horse">
              <span class="workspace-nav-icon" aria-hidden="true">◆</span><span>马匹</span>
            </button>
            <button class="workspace-nav-button" id="workspaceChallengeNav" type="button" data-workspace-view="challenge" hidden>
              <span class="workspace-nav-icon" aria-hidden="true">★</span><span>挑战</span>
            </button>
            <button class="workspace-nav-button" type="button" data-workspace-view="more">
              <span class="workspace-nav-icon" aria-hidden="true">•••</span><span>更多</span>
            </button>
          </nav>
          <div class="workspace-content">
            <div class="workspace-primary">
              <div class="workspace-view action-view" data-workspace-panel="action">
                <div class="action-overview-grid">
                  <div class="action-main-column">
                    <section class="panel rogue-settlement-panel" id="rogueSettlementPanel" hidden></section>
                    <section class="panel" id="racePanel" data-action-anchor="race"></section>
                    <section class="panel" id="historyPanel" data-action-anchor="history"></section>
                  </div>
                  <aside class="workspace-aside" id="actionAside" aria-label="当前生涯摘要">
                    <section class="panel summary-panel" id="horseSummaryPanel"></section>
                    <section class="panel last-race-panel" id="lastRacePanel" hidden></section>
                    <section class="panel compact-adaptation-panel" id="adaptationSummaryPanel"></section>
                    <section class="panel rogue-challenge-hint" id="rogueChallengeHint" hidden></section>
                  </aside>
                </div>
              </div>
              <div class="workspace-view horse-view" data-workspace-panel="horse" hidden>
                <section class="panel" id="horsePanel"></section>
                <section class="panel rogue-veterinarian-panel" id="rogueVeterinarianPanel" hidden></section>
                <section class="panel feedback-panel" id="feedbackPanel" hidden></section>
              </div>
              <section class="panel workspace-view rogue-challenge-page" id="rogueChallengePanel" data-workspace-panel="challenge" hidden></section>
              <section class="panel workspace-view more-panel" id="morePanel" data-workspace-panel="more" hidden>
                <div class="section-title-row">
                  <div>
                    <p class="eyebrow">生涯管理</p>
                    <h2>更多</h2>
                  </div>
                </div>
                <div class="more-action-grid">
                  <button class="secondary more-action" id="newCareerBtn" type="button"><strong>开始新生涯</strong><span>重新选择血统、练马师与模式</span></button>
                  <button class="secondary more-action" id="workspaceHelpBtn" type="button"><strong>游戏帮助</strong><span>查看属性、规则与操作说明</span></button>
                  <button class="secondary more-action" id="workspaceChangelogBtn" type="button"><strong>更新日志</strong><span>查看近期改动和后续计划</span></button>
                </div>
                <div class="workspace-save-card">
                  <div><p class="eyebrow">本机存档</p><p class="muted" id="workspaceSaveStatusText">暂无存档</p></div>
                  <button class="secondary" id="workspaceClearSaveBtn" type="button">清除存档</button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>

      <aside class="help-panel workspace-drawer" id="helpPanel" hidden aria-label="游戏帮助">
        <div class="drawer-header"><div><p class="eyebrow">使用说明</p><h2>游戏帮助</h2></div><button class="secondary" type="button" data-help-close="helpPanel">关闭</button></div>
        <div class="drawer-scroll">${ns.Help ? ns.Help.attributeHelpHtml : ""}</div>
      </aside>
      <div class="race-result-overlay" id="raceResultDialog" role="dialog" aria-modal="true" aria-labelledby="raceResultTitle" hidden>
        <section class="race-result-dialog" id="raceResultContent"></section>
      </div>
    `;
  }

  function renderWorkspaceStatus(panel, career) {
    if (!panel || !career) return;
    const horse = career.horse || {};
    const locationLabel = ns.RegionRules && ns.RegionRules.getCurrentLocationLabel
      ? ns.RegionRules.getCurrentLocationLabel(career)
      : "";
    const timeLabel = career.currentTime && ns.TimeRules
      ? ns.TimeRules.formatAgeMonth(career.currentTime)
      : "生涯准备中";
    const summary = ns.CareerRules && ns.CareerRules.getRecordSummary
      ? ns.CareerRules.getRecordSummary(career)
      : { starts: 0, wins: 0 };
    panel.innerHTML = `
      <div class="workspace-status-identity">
        <span class="workspace-status-label">当前赛马</span>
        <strong title="${horse.name || "未命名小马"}">${horse.name || "未命名小马"}</strong>
        ${career.gameMode === "legend" ? `<span class="badge legend-badge">传奇</span>` : ""}
        ${career.gameMode === "roguelike" ? `<span class="badge rogue-badge">肉鸽挑战</span>` : ""}
      </div>
      <div class="workspace-status-facts">
        <span><small>当前时间</small><b>${timeLabel}</b></span>
        <span><small>当前位置</small><b>${locationLabel || "未知"}</b></span>
        <span><small>战绩</small><b>${summary.starts}战 ${summary.wins}胜</b></span>
        ${career.gameMode === "roguelike" ? `<span><small>荣誉币</small><b>${(career.roguelike && career.roguelike.honorCoins) || 0}</b></span>` : ""}
      </div>
      <div class="workspace-status-save" id="workspaceStatusSave" aria-live="polite">自动存档</div>
    `;
  }

  function renderHorseSummary(panel, career) {
    if (!panel || !career) return;
    const horse = career.horse || {};
    const trainer = career.trainer || (ns.CommentRules && ns.CommentRules.getTrainer(career.trainerId || horse.trainerId));
    const jockey = ns.JockeyRules && ns.JockeyRules.getJockey(career.mainJockeyId);
    panel.innerHTML = `
      <div class="summary-heading">
        <div><p class="eyebrow">马匹摘要</p><h2>${horse.name || "未命名小马"}</h2></div>
        <button class="secondary summary-link" type="button" data-workspace-jump="horse">完整资料</button>
      </div>
      <div class="summary-stat-grid">
        <span><small>基础</small><b>${horse.gender || "-"} · ${horse.coat || "-"}</b></span>
        <span><small>主战骑手</small><b>${jockey ? jockey.name : "未指定"}</b></span>
        <span class="summary-stat-wide"><small>血统</small><b>${horse.sireName || "-"} × ${horse.damName || "-"}</b></span>
        <span><small>练马师</small><b>${trainer ? trainer.name : "未指定"}</b></span>
        <span><small>状态</small><b>${career.retired ? "已退役" : "现役"}</b></span>
      </div>
    `;
  }

  function renderAdaptationSummary(panel, career) {
    if (!panel || !career || !ns.AdaptationHintRules) {
      if (panel) panel.innerHTML = "";
      return;
    }
    const sections = ns.AdaptationHintRules.getSections(career);
    const knownItems = sections.flatMap((section) => section.items
      .filter((item) => item.status !== "unknown")
      .map((item) => ({ ...item, sectionLabel: section.label }))
    ).slice(0, 8);
    panel.innerHTML = `
      <div class="summary-heading">
        <div><p class="eyebrow">适应性摘要</p><h2>已知倾向</h2></div>
        <button class="secondary summary-link" type="button" data-workspace-jump="horse">查看全部</button>
      </div>
      <div class="compact-adaptation-list">
        ${knownItems.length ? knownItems.map((item) => `
          <span><small>${item.label}</small><b class="adaptation-status adaptation-status-${item.status}">${item.statusLabel}${item.confidenceLabel ? ` · ${item.confidenceLabel}` : ""}</b></span>
        `).join("") : `<p class="muted">完成比赛后会逐步确认适应性。</p>`}
      </div>
    `;
  }

  function renderRaceResult(panel, career, options) {
    if (!panel || !career || !career.races || career.races.length === 0) {
      if (panel) panel.innerHTML = "";
      return;
    }
    const opts = options || {};
    const record = career.races[career.races.length - 1];
    const publicResult = record.public || {};
    const hidden = record.hidden || {};
    const isDeadHeat = publicResult.deadHeat || publicResult.tieOutcome === "dead-heat" || hidden.tieOutcome === "dead-heat";
    const rankText = isDeadHeat ? "一着同着" : (publicResult.rankLabel || "着外");
    const opponentName = recordOpponentName(record, opts.horseNameLanguage);
    const commentText = historyPostRaceCommentText(record)
      || (career.lastRaceComment && career.lastRaceComment.text)
      || "练马师暂时没有补充评语。";
    panel.innerHTML = `
      <div class="race-result-header">
        <div><p class="eyebrow">比赛结束</p><h2 id="raceResultTitle">${recordRaceName(record, opts.raceNameMode)}</h2></div>
        <button class="secondary race-result-close" id="raceResultCloseBtn" type="button" aria-label="关闭赛果">×</button>
      </div>
      <div class="race-result-rank"><span>最终结果</span><strong>${rankText}</strong><em>${historyMarginText(record)}</em></div>
      <div class="race-result-facts">
        <span><small>时间</small><b>${publicResult.timeLabel || "-"}</b></span>
        <span><small>场地</small><b>${publicResult.trackCondition || hidden.trackCondition || "-"}</b></span>
        <span><small>主要对手</small><b>${opponentName || "随机对手"}</b></span>
      </div>
      <div class="post-race-comment-card race-result-comment"><span>${(career.lastRaceComment && career.lastRaceComment.label) || "练马师回顾"}</span><p>${commentText}</p></div>
      <div class="race-result-actions">
        <button class="secondary" id="raceResultReturnBtn" type="button">返回行动</button>
        <button id="raceResultHistoryBtn" type="button">查看完整记录</button>
      </div>
    `;
  }

  function renderHorse(panel, career, options) {
    if (!career) {
      panel.innerHTML = `<p class="muted">生成后会显示出道前评语。</p>`;
      return;
    }
    const opts = options || {};
    const commentsCollapsed = !!opts.trainerCommentsCollapsed;
    const horse = career.horse;
    const trainer = career.trainer || (ns.CommentRules && ns.CommentRules.getTrainer(career.trainerId || horse.trainerId));
    const mainJockey = ns.JockeyRules.getJockey(career.mainJockeyId);
    const originalRegionLabel = ns.RegionRules ? ns.RegionRules.getOriginalRegionLabel(career) : "日本";
    const stableRegionLabel = ns.RegionRules ? ns.RegionRules.getStableRegionLabel(career) : originalRegionLabel;
    const currentLocationLabel = ns.RegionRules && ns.RegionRules.getCurrentLocationLabel
      ? ns.RegionRules.getCurrentLocationLabel(career)
      : stableRegionLabel;
    const transfer = ns.RegionRules ? ns.RegionRules.canTransfer(career) : { allowed: false };
    const transferText = transfer.allowed
      ? `<button class="secondary" id="transferStableBtn" type="button" data-transfer-region="${transfer.targetRegionId}">转厩至${transfer.targetLabel}</button>`
      : "";
    const comments = career.commentDetails && career.commentDetails.length
      ? career.commentDetails
      : career.comments.map((text, index) => ({ label: `评语 ${index + 1}`, text }));
    const rogueInitialComments = career.gameMode === "roguelike" && career.roguelike
      ? career.roguelike.initialComments || []
      : [];
    const rogueReviewComments = career.gameMode === "roguelike" && career.roguelike
      ? career.roguelike.reviewComments || []
      : [];
    panel.innerHTML = `
      <div class="section-title-row">
        <p class="eyebrow">出道前评语</p>
        ${career.gameMode === "legend" ? `<span class="badge legend-badge">传奇模式</span>` : ""}
        ${career.gameMode === "roguelike" ? `<span class="badge rogue-badge">肉鸽挑战</span>` : ""}
      </div>
      <div class="trainer-card-grid">
        <div class="trainer-card trainer-card-name">
          <span>马名</span>
          <h2>${horse.name}</h2>
        </div>
        <div class="trainer-card trainer-card-basic">
          <span>基础信息</span>
          <strong>${horse.gender} · ${horse.coat}</strong>
        </div>
        <div class="trainer-card trainer-card-bloodline">
          <span>血统</span>
          <strong>${horse.sireName} x ${horse.damName}</strong>
        </div>
        <div class="trainer-card trainer-card-jockey">
          <span>主战骑手</span>
          <strong>${mainJockey ? mainJockey.name : "未指定"}</strong>
        </div>
        <div class="trainer-card trainer-card-trainer">
          <span>练马师</span>
          <strong>${trainer ? trainer.name : "未指定"}</strong>
        </div>
        <div class="trainer-card trainer-card-region">
          <span>所属地</span>
          <strong>${originalRegionLabel}</strong>
        </div>
        <div class="trainer-card trainer-card-stable">
          <span>当前厩舍</span>
          <strong>${stableRegionLabel}</strong>
        </div>
        <div class="trainer-card trainer-card-location">
          <span>当前位置</span>
          <strong>${currentLocationLabel}</strong>
        </div>
      </div>
      ${transferText ? `<div class="race-row stable-action-row">${transferText}</div>` : ""}
      <div class="trainer-comments" id="trainerComments" ${commentsCollapsed ? "hidden" : ""}>
        ${rogueInitialComments.length ? `<p class="eyebrow trainer-comment-group-title">初次评估</p>` : ""}
        ${(rogueInitialComments.length ? rogueInitialComments : comments).map((comment, index) => `
          <div class="trainer-comment comment-tone-${(index % 5) + 1}">
            <span>${comment.label || comment.item || `评语 ${index + 1}`}</span>
            <p>${comment.text}</p>
          </div>
        `).join("")}
        ${rogueReviewComments.length ? `
          <p class="eyebrow trainer-comment-group-title">${career.roguelike.reviewLabel || "复核评估"}</p>
          ${rogueReviewComments.map((comment, index) => `
            <div class="trainer-comment comment-tone-${(index % 5) + 1}">
              <span>${comment.label || comment.item || `评语 ${index + 1}`}</span>
              <p>${comment.text}</p>
            </div>
          `).join("")}
        ` : ""}
      </div>
      <div class="race-row trainer-comments-toggle-row">
        <button class="secondary" id="trainerCommentsToggleBtn" type="button" aria-expanded="${commentsCollapsed ? "false" : "true"}" aria-controls="trainerComments">${commentsCollapsed ? "展开评语" : "收起评语"}</button>
      </div>
    `;
  }

  function currentTimeBlock(career) {
    const locationLabel = ns.RegionRules && ns.RegionRules.getCurrentLocationLabel
      ? ns.RegionRules.getCurrentLocationLabel(career)
      : "";
    return `
      <div class="current-time-block">
        <span>当前时间</span>
        <strong>${ns.TimeRules.formatAgeMonth(career.currentTime)}</strong>
        ${locationLabel ? `<em>（位于${locationLabel}）</em>` : ""}
      </div>
    `;
  }

  function racePanelHeader(career, title) {
    return `
      <div class="race-panel-header">
        <p class="eyebrow">${title}</p>
        ${currentTimeBlock(career)}
      </div>
    `;
  }

  function renderLastRaceComment(panel, career) {
    if (!panel) return;
    if (!career || !career.lastRaceComment || !career.lastRaceComment.text) {
      panel.hidden = true;
      panel.innerHTML = "";
      return;
    }
    panel.hidden = false;
    panel.innerHTML = `
      <div class="section-title-row">
        <p class="eyebrow">上场比赛评语</p>
      </div>
      <div class="post-race-comment-card">
        <span>${career.lastRaceComment.label || "练马师回顾"}</span>
        <p>${career.lastRaceComment.text}</p>
      </div>
    `;
  }

  function renderAdaptationHints(panel, career, options) {
    if (!panel) return;
    if (!career || !ns.AdaptationHintRules) {
      panel.hidden = true;
      panel.innerHTML = "";
      return;
    }
    const opts = options || {};
    const collapsed = !!opts.collapsed;
    const sections = ns.AdaptationHintRules.getSections(career);
    panel.hidden = false;
    panel.innerHTML = `
      <div class="section-title-row adaptation-title-row">
        <div>
          <p class="eyebrow">适应性提示</p>
          <p class="muted">基于练马师评语与赛后确定反馈整理，可能存在误判。</p>
        </div>
      </div>
      <div class="adaptation-board" id="adaptationHintsBoard" ${collapsed ? "hidden" : ""}>
        ${sections.map((section) => `
          <div class="adaptation-section adaptation-section-${section.id}">
            <h3>${section.label}</h3>
            <div class="adaptation-list">
              ${section.items.map((item) => `
                <div class="adaptation-item">
                  <span>${item.label}</span>
                  <b class="adaptation-status adaptation-status-${item.status}">
                    <span>${item.statusLabel}</span>
                    ${item.confidenceLabel ? `<em class="adaptation-confidence adaptation-confidence-${item.confidence}">${item.confidenceLabel}</em>` : ""}
                  </b>
                </div>
              `).join("")}
            </div>
          </div>
        `).join("")}
      </div>
      <div class="race-row adaptation-toggle-row">
        <button class="secondary" id="adaptationHintsToggleBtn" type="button" aria-expanded="${collapsed ? "false" : "true"}" aria-controls="adaptationHintsBoard">${collapsed ? "展开提示" : "折叠提示"}</button>
      </div>
    `;
  }

  function renderRaceSelector(panel, career, filters, options) {
    if (!career || career.retired) {
      panel.innerHTML = "";
      return;
    }
    const raceNameMode = normalizeRaceNameMode(options && options.raceNameMode);
    const restStatus = ns.CareerRules && ns.CareerRules.getRestStatus
      ? ns.CareerRules.getRestStatus(career)
      : null;
    if (restStatus) {
      panel.innerHTML = `
        ${racePanelHeader(career, "强制休养")}
        <div class="scheduled-race">
          <span class="badge">休养中</span>
          <h2>${restStatus.severityLabel} · ${restStatus.reason}</h2>
          <p>需休养至 ${restStatus.restUntilLabel}，预计剩余 ${restStatus.remainingMonths} 个月。</p>
          <p class="muted">强制休养期间不能报名比赛，只能逐回合推进时间。</p>
        </div>
        <div class="race-row">
          <button id="nextTurnBtn">下一回合</button>
          <button class="secondary" id="retireBtn">退役</button>
        </div>
      `;
      return;
    }
    if (career.scheduledRace) {
      const payload = career.scheduledRace;
      const race = payload.race;
      const travel = payload.travel;
      const travelLocked = ns.RegionRules && ns.RegionRules.isTravelPreparationLocked
        ? ns.RegionRules.isTravelPreparationLocked(career, payload)
        : false;
      const travelNote = travel && travel.active
        ? `<p class="muted">${travel.fromLabel} → ${travel.toLabel}${travel.prepLabel ? ` · 检疫预备：${travel.prepLabel}` : ""}</p>`
        : "";
      panel.innerHTML = `
        ${racePanelHeader(career, "下一场比赛")}
        <div class="scheduled-race">
          <span class="badge">已报名</span>
          ${payload.challenge ? `<span class="badge">格上通过</span>` : ""}
          ${travel && travel.active ? `<span class="badge">${travelBadgeLabel(travel, travelLocked)}</span>` : (payload.expedition && payload.expedition.active ? `<span class="badge">远征</span>` : "")}
          <h2>${payload.schedule.label} · ${raceDisplayName(race, raceNameMode)}</h2>
          <p>${race.grade} · ${race.ageRule}${raceRestrictionLabel(race)} · ${raceSurfaceDistanceLabel(race)} · ${raceVenueLabel(race)}</p>
          ${travelNote}
        </div>
        <div class="race-row">
          <button id="nextTurnBtn">下一回合</button>
          ${travelLocked ? "" : `<button class="secondary" id="cancelRegistrationBtn">取消报名</button>`}
          <button class="secondary" id="retireBtn">退役</button>
        </div>
        <p class="muted">${travelLocked ? travelLockedText(travel) : "到达报名赛事回合时会自动进行比赛。"}</p>
      `;
      return;
    }
    const plans = ns.TimeRules.getAvailableRacePlans(career, ns.Races || []);
    if (plans.length === 0) {
      const message = career.races.length === 0 && career.debutLock
        ? "根据出道前评语锁定后，没有符合距离、场地和成熟时机的新马战。可以重新生成小马，或之后放宽锁定规则。"
        : "没有可参加的未来赛事。可以选择退役。";
      panel.innerHTML = `
        ${racePanelHeader(career, "下一场比赛")}
        <p class="muted">${message}</p>
        <button id="nextTurnBtn">下一回合</button>
        <button class="secondary" id="retireBtn">退役</button>
      `;
      return;
    }
    const currentFilters = normalizeRaceFilters(filters);
    const activeFilterGroup = options && options.activeFilterGroup;
    const filteredPlans = plans.filter((plan) => raceMatchesFilters(plan, currentFilters, career));
    panel.innerHTML = `
      ${racePanelHeader(career, "下一场比赛")}
      ${renderRaceFilters(currentFilters, activeFilterGroup)}
      <div id="jockeyNotice"></div>
      ${filteredPlans.length ? `
        <div class="race-row">
          <select class="race-select" id="raceSelect">
            ${filteredPlans.map((plan) => `<option value="${plan.race.id}">${raceOptionLabel(plan, raceNameMode)}</option>`).join("")}
          </select>
          ${renderRacePlanCards(filteredPlans, raceNameMode)}
          <button id="registerRaceBtn">报名比赛</button>
          <button class="secondary" id="nextTurnBtn">下一回合</button>
          <button class="secondary" id="retireBtn">退役</button>
        </div>
      ` : `
        <p class="muted">当前筛选条件下没有可参加的赛事。</p>
        <button id="nextTurnBtn">下一回合</button>
        <button class="secondary" id="retireBtn">退役</button>
      `}
      <p class="muted">报名赛事后，可以逐回合推进到该赛事自动开赛。</p>
    `;
  }

  function renderHistory(panel, career, summary, options) {
    if (!career) {
      panel.innerHTML = "";
      return;
    }
    const opts = options || {};
    const expanded = !!opts.expanded;
    const mobile = !!opts.mobile;
    const collapsedLimit = mobile ? 1 : 3;
    const horseNameLanguage = normalizeHorseNameLanguage(options && options.horseNameLanguage);
    const raceNameMode = normalizeRaceNameMode(options && options.raceNameMode);
    const collapsedRecords = (options && options.collapsedRecords) || {};
    const expandedComments = (options && options.expandedComments) || {};
    const expandedOpponentRosters = (options && options.expandedOpponentRosters) || {};
    const orderedRecords = career.races
      .map((item, index) => ({ item, number: index + 1 }))
      .reverse();
    const visibleRecords = expanded ? orderedRecords : orderedRecords.slice(0, collapsedLimit);
    const hasHiddenRows = orderedRecords.length > visibleRecords.length;
    const canToggleHistory = orderedRecords.length > collapsedLimit;
    const revealScores = !!summary;
    const renderedRecords = visibleRecords.map(({ item, number }) => {
      const recordKey = historyRecordKey(number);
      const isRecordExpanded = !collapsedRecords[recordKey];
      const opponentYear = item.public.opponentYear ? `${item.public.opponentYear} ` : "";
      const opponentName = recordOpponentName(item, horseNameLanguage);
      const opponent = opponentName ? `${opponentYear}${opponentName}` : "随机对手";
      const opponentJockey = item.public.opponentJockeyName || "";
      const replacementNote = item.public.scheduledOpponentRetired
        ? ((item.hidden && item.hidden.fieldRace) ? " 退赛" : " 退赛（随机对手递补）")
        : "";
      const opponentRoster = Array.isArray(item.public.opponents) ? item.public.opponents : [];
      const hasOpponentRoster = opponentRoster.length > 1;
      const showOpponentJockey = hasOpponentRoster || isRecordExpanded;
      const isOpponentRosterExpanded = !!expandedOpponentRosters[recordKey];
      const opponentToggleLabel = isOpponentRosterExpanded ? "收起其他同场对手" : "查看其他同场对手";
      const opponentDisplay = hasOpponentRoster
        ? `<button class="history-opponent-toggle" type="button" data-opponent-roster-toggle="${recordKey}" aria-expanded="${isOpponentRosterExpanded ? "true" : "false"}" aria-label="${opponentToggleLabel}">${opponent}${replacementNote}<span aria-hidden="true">${isOpponentRosterExpanded ? "▲" : "▼"}</span></button>`
        : `<span>${opponent}${replacementNote}</span>`;
      const opponentRosterHtml = hasOpponentRoster && isOpponentRosterExpanded
        ? renderOpponentRoster(opponentRoster, horseNameLanguage)
        : "";
      const retired = item.public.retired ? ` · ${item.public.retiredPhase}退赛` : "";
      const injuryText = item.public.injury && item.public.injury.label ? ` · ${item.public.injury.label}` : "";
      const isDeadHeat = item.public.deadHeat
        || item.public.tieOutcome === "dead-heat"
        || (item.hidden && item.hidden.tieOutcome === "dead-heat");
      const rankText = isDeadHeat ? "一着同着" : (item.public.rankLabel || "着外");
      const resultText = `${rankText}${retired}${injuryText}`;
      const trackCondition = item.public.trackCondition || (item.hidden && item.hidden.trackCondition) || "";
      const raceName = recordRaceName(item, raceNameMode);
      const fullRaceDetail = historyRaceDetail(item);
      const fullMarginText = historyMarginText(item);
      const raceDetail = isRecordExpanded ? fullRaceDetail : "";
      const marginText = isRecordExpanded ? fullMarginText : "";
      const commentText = historyPostRaceCommentText(item);
      const isCommentExpanded = !!(commentText && expandedComments[recordKey]);
      const commentToggleLabel = isCommentExpanded ? "收起历史评语" : "展开历史评语";
      const scoreLine = revealScores ? `<td>${(item.hidden && item.hidden.scoreLine) || ""}</td>` : "";
      const rowClasses = [
        isRecordExpanded ? "history-record-expanded" : "",
        isCommentExpanded ? "history-comment-expanded" : ""
      ].filter(Boolean).join(" ");
      const commentToggle = commentText
        ? `<button class="secondary history-comment-toggle history-card-action" type="button" data-history-comment-toggle="${recordKey}" aria-expanded="${isCommentExpanded ? "true" : "false"}" aria-label="${commentToggleLabel}" title="${commentToggleLabel}">评</button>`
        : "";
      const commentRow = isCommentExpanded ? `
        <tr class="history-comment-row">
          <td colspan="${revealScores ? 8 : 7}">
            <div class="history-comment-card">
              <span>练马师评语</span>
              <p>${commentText}</p>
            </div>
          </td>
        </tr>
      ` : "";
      const opponentRosterRow = opponentRosterHtml ? `
        <tr class="opponent-roster-row">
          <td colspan="${revealScores ? 8 : 7}">${opponentRosterHtml}</td>
        </tr>
      ` : "";
      const scoreLineText = (item.hidden && item.hidden.scoreLine) || "";
      const isCardExpanded = isRecordExpanded;
      const cardDetail = isCardExpanded && fullRaceDetail
        ? `<p class="history-card-detail">${fullRaceDetail}</p>`
        : "";
      const cardMargin = isCardExpanded && fullMarginText ? `<em>${fullMarginText}</em>` : "";
      const cardComment = isCommentExpanded ? `
        <div class="history-comment-card history-card-comment">
          <span>练马师评语</span>
          <p>${commentText}</p>
        </div>
      ` : "";
      const cardScore = revealScores && scoreLineText
        ? `<p class="history-card-score">出目：${scoreLineText}</p>`
        : "";
      return {
        row: `
        <tr class="${rowClasses}">
          <td class="history-index-cell"><span class="history-index-number">${number}</span></td>
          <td>${item.public.timeLabel || ""}</td>
          <td>
            <span class="history-race-name-line">${commentToggle}<span>${raceName}</span></span>
            ${raceDetail ? `<span class="history-cell-subtext">${raceDetail}</span>` : ""}
          </td>
          <td>${trackCondition}</td>
          <td>
            <span>${resultText}</span>
            ${marginText ? `<span class="history-cell-subtext history-margin-text">${marginText}</span>` : ""}
          </td>
          <td>${item.public.playerJockeyName || ""}</td>
          <td>
            ${opponentDisplay}
            ${showOpponentJockey && opponentJockey ? `<span class="history-cell-subtext">${opponentJockey}</span>` : ""}
          </td>
          ${scoreLine}
        </tr>
        ${opponentRosterRow}
        ${commentRow}
        `,
        card: `
          <article class="history-card ${rowClasses} ${isCardExpanded ? "history-card-expanded" : ""}">
            <div class="history-card-head">
              <div>
                <span class="history-card-kicker">#${number} · ${item.public.timeLabel || ""}</span>
                <div class="history-card-title-line">${commentToggle}<h3>${raceName}</h3></div>
              </div>
            </div>
            <div class="history-card-stats">
              <span>${trackCondition || "场地未知"}</span>
              <span>${resultText}${cardMargin}</span>
              <span>${item.public.playerJockeyName || "骑手未定"}</span>
            </div>
            <div class="history-card-opponent">
              <span>主要对手</span>
              ${opponentDisplay}
              ${(hasOpponentRoster || isCardExpanded) && opponentJockey ? `<em>${opponentJockey}</em>` : ""}
            </div>
            ${opponentRosterHtml}
            ${cardDetail}
            ${cardScore}
            ${cardComment}
          </article>
        `
      };
    });
    const rows = renderedRecords.map((record) => record.row).join("");
    const cards = renderedRecords.map((record) => record.card).join("");

    let reveal = "";
    if (summary) {
      const h = summary.horse;
      const finalMaturity = ns.MaturityRules.evaluate(h, career.currentTime, career.maturity.decline);
      const stable = career.stable || {};
      const transfers = Array.isArray(stable.transfers) ? stable.transfers : [];
      const transferText = transfers.length
        ? transfers.map((item) => `${item.timeLabel || ""} ${item.fromLabel || ""}→${item.toLabel || ""}`).join("；")
        : "无";
      reveal = `
        <div class="reveal">
          <p class="eyebrow">退役揭晓</p>
          <h2>${h.name} 生涯 ${summary.starts}战 ${summary.wins}胜 · G1 ${summary.g1Wins}胜 · JpnI ${summary.jpn1Wins || 0}胜</h2>
          ${summary.retirementReason ? `<p class="muted">${summary.retirementReason}</p>` : ""}
          ${renderAchievements(career)}
          <div class="stat-grid">
            <span>真实实力 <b>${h.strength}</b></span>
            <span>退役时实力 <b>${finalMaturity.adjustedStrength}</b></span>
            <span>核心距离 <b>${h.coreDist}m</b></span>
            <span>距离范围 <b>${h.distMin}-${h.distMax}m</b></span>
            <span>成长型 <b>${h.growthType}</b></span>
            <span>成熟期 <b>${h.peakStart}-${h.peakEnd}</b></span>
            <span>衰退扣点 <b>${summary.maturityDecline}</b></span>
            <span>重场 <b>${h.heavyType}</b></span>
            <span>气性 <b>${h.temperamentLabel}</b></span>
            <span>初始所属地 <b>${ns.RegionRules ? ns.RegionRules.getOriginalRegionLabel(career) : "日本"}</b></span>
            <span>退役所属地 <b>${ns.RegionRules ? ns.RegionRules.getStableRegionLabel(career) : "日本"}</b></span>
            <span>转厩记录 <b>${transferText}</b></span>
          </div>
          <div class="aptitude-grid">
            <div>
              <h3>草地适性</h3>
              <div class="grade-list">${renderGradeList(h.grass)}</div>
            </div>
            <div>
              <h3>泥地适性</h3>
              <div class="grade-list">${renderGradeList(h.dirt)}</div>
            </div>
            <div>
              <h3>日本赛场适性</h3>
              <div class="grade-list">${renderGradeList(h.courseGrades)}</div>
            </div>
          </div>
        </div>
      `;
    }

    panel.innerHTML = `
      <div class="section-title-row">
        <div class="title-with-actions">
          <p class="eyebrow">生涯记录</p>
          ${renderHistoryRecordSummary(career)}
          ${career.gameMode === "legend" ? `<span class="badge legend-badge">传奇模式</span>` : ""}
          ${career.gameMode === "roguelike" ? `<span class="badge rogue-badge">肉鸽挑战</span>` : ""}
          ${career.horse.debugMode ? `<span class="badge debug-badge">调试模式</span>` : ""}
        </div>
        ${canToggleHistory ? `<button class="secondary history-toggle" id="historyToggleBtn">${expanded ? "收起" : "展开全部"}</button>` : ""}
      </div>
      <div class="history-mobile-display-controls" aria-label="生涯记录显示设置">
        <div><span>赛事名</span>${renderRaceNameModeToggle(raceNameMode)}</div>
        <div><span>对手名</span>${renderHorseNameLanguageToggle(horseNameLanguage)}</div>
      </div>
      <div class="history-table-wrap">
        <table>
          <thead><tr><th class="history-index-header">${renderHistoryBulkControls(orderedRecords.length === 0)}</th><th>时间</th><th class="race-name-header"><span>比赛</span>${renderRaceNameModeToggle(raceNameMode)}</th><th>场地</th><th>结果</th><th>骑手</th><th class="opponent-name-header"><span>主要对手</span>${renderHorseNameLanguageToggle(horseNameLanguage)}</th>${revealScores ? "<th>出目</th>" : ""}</tr></thead>
          <tbody>${rows || `<tr><td colspan="${revealScores ? 8 : 7}">还没有出赛记录。</td></tr>`}</tbody>
        </table>
      </div>
      <div class="history-card-list">
        ${cards || `<div class="history-empty-card">还没有出赛记录。</div>`}
      </div>
      ${reveal}
    `;
  }

  ns.UI = {
    renderSetup,
    renderChangelog,
    renderWorkspaceStatus,
    renderHorseSummary,
    renderAdaptationSummary,
    renderRaceResult,
    renderHorse,
    renderLastRaceComment,
    renderAdaptationHints,
    renderRaceSelector,
    renderHistory
  };
})();
