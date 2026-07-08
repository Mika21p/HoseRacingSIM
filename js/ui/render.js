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

  function raceOptionLabel(plan, mode) {
    const challengeLabel = plan.challenge ? "[格上] " : "";
    const expeditionLabel = plan.expedition && plan.expedition.active ? "[远征] " : "";
    return `${expeditionLabel}${challengeLabel}${plan.schedule.label} · ${raceDisplayName(plan.race, mode)} · ${plan.race.grade} · ${plan.race.ageRule}${raceRestrictionLabel(plan.race)} · ${raceSurfaceDistanceLabel(plan.race)} · ${raceVenueLabel(plan.race)}`;
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
      japanCourse
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

  function raceMatchesFilters(plan, filters) {
    const currentFilters = normalizeRaceFilters(filters);
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
    return RACE_FILTER_GROUPS.some((group) => filterValues(filters, group.id).length > 0);
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
        <button class="secondary filter-clear-all" id="clearAllRaceFiltersBtn" type="button" ${active ? "" : "disabled"}>清除筛选</button>
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
      <section class="panel setup-panel">
        <div class="setup-title-row">
          <div>
            <p class="eyebrow">出道准备</p>
            <h1>赛马生涯模拟</h1>
          </div>
          <button class="secondary help-toggle" id="helpToggleBtn" type="button" aria-expanded="false">帮助</button>
        </div>
        <div class="help-panel" id="helpPanel" hidden>${ns.Help ? ns.Help.attributeHelpHtml : ""}</div>
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
      <section class="panel" id="horsePanel"></section>
      <section class="panel" id="racePanel"></section>
      <section class="panel feedback-panel" id="feedbackPanel" hidden></section>
      <section class="panel" id="historyPanel"></section>
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
    const transfer = ns.RegionRules ? ns.RegionRules.canTransfer(career) : { allowed: false };
    const transferText = transfer.allowed
      ? `<button class="secondary" id="transferStableBtn" type="button" data-transfer-region="${transfer.targetRegionId}">转厩至${transfer.targetLabel}</button>`
      : "";
    const comments = career.commentDetails && career.commentDetails.length
      ? career.commentDetails
      : career.comments.map((text, index) => ({ label: `评语 ${index + 1}`, text }));
    panel.innerHTML = `
      <p class="eyebrow">出道前评语</p>
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
      </div>
      ${transferText ? `<div class="race-row stable-action-row">${transferText}</div>` : ""}
      <div class="trainer-comments" id="trainerComments" ${commentsCollapsed ? "hidden" : ""}>
        ${comments.map((comment, index) => `
          <div class="trainer-comment comment-tone-${(index % 5) + 1}">
            <span>${comment.label || comment.item || `评语 ${index + 1}`}</span>
            <p>${comment.text}</p>
          </div>
        `).join("")}
      </div>
      <div class="race-row trainer-comments-toggle-row">
        <button class="secondary" id="trainerCommentsToggleBtn" type="button" aria-expanded="${commentsCollapsed ? "false" : "true"}" aria-controls="trainerComments">${commentsCollapsed ? "展开评语" : "收起评语"}</button>
      </div>
    `;
  }

  function currentTimeBlock(career) {
    return `
      <div class="current-time-block">
        <span>当前时间</span>
        <strong>${ns.TimeRules.formatAgeMonth(career.currentTime)}</strong>
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
      panel.innerHTML = `
        ${racePanelHeader(career, "下一场比赛")}
        <div class="scheduled-race">
          <span class="badge">已报名</span>
          ${payload.challenge ? `<span class="badge">格上通过</span>` : ""}
          ${payload.expedition && payload.expedition.active ? `<span class="badge">远征</span>` : ""}
          <h2>${payload.schedule.label} · ${raceDisplayName(race, raceNameMode)}</h2>
          <p>${race.grade} · ${race.ageRule}${raceRestrictionLabel(race)} · ${raceSurfaceDistanceLabel(race)} · ${raceVenueLabel(race)}</p>
        </div>
        <div class="race-row">
          <button id="nextTurnBtn">下一回合</button>
          <button class="secondary" id="cancelRegistrationBtn">取消报名</button>
          <button class="secondary" id="retireBtn">退役</button>
        </div>
        <p class="muted">到达报名赛事回合时会自动进行比赛。</p>
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
    const filteredPlans = plans.filter((plan) => raceMatchesFilters(plan, currentFilters));
    panel.innerHTML = `
      ${racePanelHeader(career, "下一场比赛")}
      ${renderRaceFilters(currentFilters, activeFilterGroup)}
      <div id="jockeyNotice"></div>
      ${filteredPlans.length ? `
        <div class="race-row">
          <select id="raceSelect">
            ${filteredPlans.map((plan) => `<option value="${plan.race.id}">${raceOptionLabel(plan, raceNameMode)}</option>`).join("")}
          </select>
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
    const expanded = !!(options && options.expanded);
    const horseNameLanguage = normalizeHorseNameLanguage(options && options.horseNameLanguage);
    const raceNameMode = normalizeRaceNameMode(options && options.raceNameMode);
    const expandedRecords = (options && options.expandedRecords) || {};
    const expandedComments = (options && options.expandedComments) || {};
    const orderedRecords = career.races
      .map((item, index) => ({ item, number: index + 1 }))
      .reverse();
    const visibleRecords = expanded ? orderedRecords : orderedRecords.slice(0, 3);
    const hasHiddenRows = orderedRecords.length > visibleRecords.length;
    const revealScores = !!summary;
    const rows = visibleRecords.map(({ item, number }) => {
      const recordKey = historyRecordKey(number);
      const isRecordExpanded = !!expandedRecords[recordKey];
      const opponentYear = item.public.opponentYear ? `${item.public.opponentYear} ` : "";
      const opponentName = recordOpponentName(item, horseNameLanguage);
      const opponent = opponentName ? `${opponentYear}${opponentName}` : "随机对手";
      const opponentJockey = item.public.opponentJockeyName || "";
      const replacementNote = item.public.scheduledOpponentRetired ? " 退赛（随机对手递补）" : "";
      const retired = item.public.retired ? ` · ${item.public.retiredPhase}退赛` : "";
      const injuryText = item.public.injury && item.public.injury.label ? ` · ${item.public.injury.label}` : "";
      const isDeadHeat = item.public.deadHeat
        || item.public.tieOutcome === "dead-heat"
        || (item.hidden && item.hidden.tieOutcome === "dead-heat");
      const rankText = isDeadHeat ? "一着同着" : (item.public.rankLabel || "着外");
      const resultText = `${rankText}${retired}${injuryText}`;
      const trackCondition = item.public.trackCondition || (item.hidden && item.hidden.trackCondition) || "";
      const raceName = recordRaceName(item, raceNameMode);
      const raceDetail = isRecordExpanded ? historyRaceDetail(item) : "";
      const marginText = isRecordExpanded ? historyMarginText(item) : "";
      const toggleLabel = isRecordExpanded ? "收起比赛详情" : "展开比赛详情";
      const commentText = historyPostRaceCommentText(item);
      const isCommentExpanded = !!(commentText && expandedComments[recordKey]);
      const commentToggleLabel = isCommentExpanded ? "收起历史评语" : "展开历史评语";
      const scoreLine = revealScores ? `<td>${(item.hidden && item.hidden.scoreLine) || ""}</td>` : "";
      const rowClasses = [
        isRecordExpanded ? "history-record-expanded" : "",
        isCommentExpanded ? "history-comment-expanded" : ""
      ].filter(Boolean).join(" ");
      const commentToggle = commentText
        ? `<button class="secondary history-comment-toggle" type="button" data-history-comment-toggle="${recordKey}" aria-expanded="${isCommentExpanded ? "true" : "false"}" aria-label="${commentToggleLabel}" title="${commentToggleLabel}">评</button>`
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
      return `
        <tr class="${rowClasses}">
          <td class="history-index-cell">
            <button class="secondary history-record-toggle" type="button" data-history-record-toggle="${recordKey}" aria-expanded="${isRecordExpanded ? "true" : "false"}" aria-label="${toggleLabel}" title="${toggleLabel}">${isRecordExpanded ? "▲" : "▼"}</button>
            <span>${number}</span>
          </td>
          <td>${item.public.timeLabel || ""}</td>
          <td>
            <span class="history-race-name-line"><span>${raceName}</span>${commentToggle}</span>
            ${raceDetail ? `<span class="history-cell-subtext">${raceDetail}</span>` : ""}
          </td>
          <td>${trackCondition}</td>
          <td>
            <span>${resultText}</span>
            ${marginText ? `<span class="history-cell-subtext history-margin-text">${marginText}</span>` : ""}
          </td>
          <td>${item.public.playerJockeyName || ""}</td>
          <td>
            <span>${opponent}${replacementNote}</span>
            ${isRecordExpanded && opponentJockey ? `<span class="history-cell-subtext">${opponentJockey}</span>` : ""}
          </td>
          ${scoreLine}
        </tr>
        ${commentRow}
      `;
    }).join("");

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
          ${career.horse.debugMode ? `<span class="badge debug-badge">调试模式</span>` : ""}
        </div>
        ${orderedRecords.length > 3 ? `<button class="secondary history-toggle" id="historyToggleBtn">${expanded ? "收起" : "展开全部"}</button>` : ""}
      </div>
      <div class="history-table-wrap">
        <table>
          <thead><tr><th class="history-index-header">${renderHistoryBulkControls(orderedRecords.length === 0)}</th><th>时间</th><th class="race-name-header"><span>比赛</span>${renderRaceNameModeToggle(raceNameMode)}</th><th>场地</th><th>结果</th><th>骑手</th><th class="opponent-name-header"><span>主要对手</span>${renderHorseNameLanguageToggle(horseNameLanguage)}</th>${revealScores ? "<th>出目</th>" : ""}</tr></thead>
          <tbody>${rows || `<tr><td colspan="${revealScores ? 8 : 7}">还没有出赛记录。</td></tr>`}</tbody>
        </table>
      </div>
      ${reveal}
    `;
  }

  ns.UI = { renderSetup, renderChangelog, renderHorse, renderLastRaceComment, renderAdaptationHints, renderRaceSelector, renderHistory };
})();
