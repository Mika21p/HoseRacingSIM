(function () {
  "use strict";

  const ns = (window.Keiba = window.Keiba || {});
  const STORAGE_KEY = "keiba-track-aptitude-lab-v1";
  const STORAGE_VERSION = 1;
  const MATURITY = { status: "成熟期", adjustedStrength: 0 };
  const TEMPERAMENT = { label: "沉稳", min: 0, max: 0, mod: 0 };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function profiles() {
    return ns.CourseProfiles ? ns.CourseProfiles.all() : [];
  }

  function firstProfileId() {
    const first = profiles()[0];
    return first ? first.id : "";
  }

  function defaultHorse(name, strength, surfaceGrades, trackAptitudes) {
    return {
      name,
      strength,
      surfaceGrades: { ...surfaceGrades },
      trackAptitudes: { ...trackAptitudes }
    };
  }

  function createDefaultState() {
    return {
      version: STORAGE_VERSION,
      profileId: firstProfileId(),
      horse: defaultHorse("实验马", 80, { grass: "A", dirt: "C" }, { burst: "◎", sustained: "○", attrition: "△" }),
      rival: defaultHorse("对照马", 80, { grass: "A", dirt: "A" }, { burst: "○", sustained: "○", attrition: "○" }),
      lastRun: null
    };
  }

  function numberInRange(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(1, Math.min(150, Math.round(parsed))) : fallback;
  }

  function normalizeHorse(value, fallback) {
    const source = value && typeof value === "object" ? value : {};
    const surfaceGrades = source.surfaceGrades && typeof source.surfaceGrades === "object" ? source.surfaceGrades : {};
    const trackAptitudes = source.trackAptitudes && typeof source.trackAptitudes === "object" ? source.trackAptitudes : {};
    const allowedSurfaceGrades = ns.TrackAptitudeRules ? ns.TrackAptitudeRules.SURFACE_GRADES : ["A", "B", "C", "G"];
    const allowedTrackGrades = ns.TrackAptitudeRules ? ns.TrackAptitudeRules.TRACK_APTITUDE_GRADES : ["◎", "○", "△"];
    return {
      name: typeof source.name === "string" && source.name.trim() ? source.name.trim().slice(0, 32) : fallback.name,
      strength: numberInRange(source.strength, fallback.strength),
      surfaceGrades: {
        grass: allowedSurfaceGrades.includes(surfaceGrades.grass) ? surfaceGrades.grass : fallback.surfaceGrades.grass,
        dirt: allowedSurfaceGrades.includes(surfaceGrades.dirt) ? surfaceGrades.dirt : fallback.surfaceGrades.dirt
      },
      trackAptitudes: {
        burst: allowedTrackGrades.includes(trackAptitudes.burst) ? trackAptitudes.burst : fallback.trackAptitudes.burst,
        sustained: allowedTrackGrades.includes(trackAptitudes.sustained) ? trackAptitudes.sustained : fallback.trackAptitudes.sustained,
        attrition: allowedTrackGrades.includes(trackAptitudes.attrition) ? trackAptitudes.attrition : fallback.trackAptitudes.attrition
      }
    };
  }

  function normalizeState(value) {
    const fallback = createDefaultState();
    const source = value && typeof value === "object" ? value : {};
    const validProfileId = profiles().some((profile) => profile.id === source.profileId) ? source.profileId : fallback.profileId;
    return {
      version: STORAGE_VERSION,
      profileId: validProfileId,
      horse: normalizeHorse(source.horse, fallback.horse),
      rival: normalizeHorse(source.rival, fallback.rival),
      lastRun: source.lastRun && typeof source.lastRun === "object" ? clone(source.lastRun) : null
    };
  }

  function readStoredState(storage) {
    if (!storage || typeof storage.getItem !== "function") return createDefaultState();
    try {
      const stored = storage.getItem(STORAGE_KEY);
      return stored ? normalizeState(JSON.parse(stored)) : createDefaultState();
    } catch (error) {
      return createDefaultState();
    }
  }

  function writeStoredState(storage, state) {
    if (!storage || typeof storage.setItem !== "function") throw new Error("当前浏览器不能保存实验配置。");
    const normalized = normalizeState(state);
    storage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function profileFor(id) {
    return ns.CourseProfiles ? ns.CourseProfiles.get(id) : null;
  }

  function buildRace(profile) {
    if (!profile) throw new Error("请选择已经配置的实验赛程。");
    return {
      id: `lab-race:${profile.id}`,
      name: profile.name,
      raceClass: "lab",
      surface: profile.surface,
      distance: profile.distance,
      courseProfileId: profile.id,
      courseProfile: profile
    };
  }

  function buildSimulationHorse(row, profile, key) {
    return {
      id: `lab-${key}`,
      name: row.name,
      strength: row.strength,
      surfaceGrades: clone(row.surfaceGrades),
      trackAptitudes: clone(row.trackAptitudes),
      distMin: 1000,
      coreDist: profile.distance,
      distMax: 4200,
      growthType: "普早",
      peakStart: "二岁春",
      peakEnd: "八岁冬",
      heavyType: "普通",
      temperamentLabel: "沉稳"
    };
  }

  function calculate(row, profile) {
    const horse = buildSimulationHorse(row, profile, "preview");
    const race = buildRace(profile);
    return ns.HorseRules.calcRaceAbility(horse, race, {
      maturity: { ...MATURITY, adjustedStrength: row.strength },
      temperamentMod: TEMPERAMENT,
      trackCondition: "良",
      noAbilityFloor: true
    });
  }

  function runExperiment(state) {
    const normalized = normalizeState(state);
    const profile = profileFor(normalized.profileId);
    const race = buildRace(profile);
    const time = ns.TimeRules && ns.TimeRules.startTime ? ns.TimeRules.startTime() : null;
    const runners = [
      [normalized.horse, "horse", "lab-jockey-horse"],
      [normalized.rival, "rival", "lab-jockey-rival"]
    ].map(([row, key, jockeyId]) => ({
      horse: buildSimulationHorse(row, profile, key),
      time,
      maturity: { ...MATURITY, adjustedStrength: row.strength },
      temperamentMod: TEMPERAMENT,
      jockey: { id: jockeyId, name: "实验骑手", ability: 70 }
    }));
    const simulated = ns.RaceRules.simulateWorldRace(runners, race, {
      trackCondition: "良",
      includeAbilityCalculations: true
    });
    return {
      createdAt: new Date().toISOString(),
      profileId: profile.id,
      race: { id: race.id, name: race.name, surface: race.surface, distance: race.distance },
      result: simulated
    };
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function signed(value) {
    return `${Number(value) > 0 ? "+" : ""}${Number(value)}`;
  }

  function options(values, selected) {
    return values.map((value) => `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}>${escapeHtml(value)}</option>`).join("");
  }

  function horseFields(key, title, horse) {
    const surfaceGrades = ns.TrackAptitudeRules.SURFACE_GRADES;
    const trackGrades = ns.TrackAptitudeRules.TRACK_APTITUDE_GRADES;
    const typeLabels = ns.TrackAptitudeRules.TRACK_TYPE_LABELS;
    return `<section class="tal-card tal-horse-card">
      <h2>${title}</h2>
      <label>马名<input name="${key}.name" value="${escapeHtml(horse.name)}" maxlength="32"></label>
      <label>基础能力<input name="${key}.strength" type="number" min="1" max="150" value="${horse.strength}"></label>
      <fieldset><legend>表面适性</legend>
        <label>草地<select name="${key}.surfaceGrades.grass">${options(surfaceGrades, horse.surfaceGrades.grass)}</select></label>
        <label>泥地<select name="${key}.surfaceGrades.dirt">${options(surfaceGrades, horse.surfaceGrades.dirt)}</select></label>
      </fieldset>
      <fieldset><legend>赛场类型适性</legend>
        ${Object.entries(typeLabels).map(([type, label]) => `<label>${label}<select name="${key}.trackAptitudes.${type}">${options(trackGrades, horse.trackAptitudes[type])}</select></label>`).join("")}
      </fieldset>
    </section>`;
  }

  function calculationCard(title, calculation) {
    const track = calculation.trackAptitude;
    return `<section class="tal-card tal-calculation-card">
      <h2>${title}</h2>
      <dl class="tal-calculation-list">
        <div><dt>成熟期基础能力</dt><dd>${calculation.maturity.adjustedStrength}</dd></div>
        <div><dt>${track.surfaceLabel}${track.surfaceGrade}</dt><dd>${signed(track.surfaceMod)}</dd></div>
        <div><dt>${track.trackTypeLabel}${track.intensityLabel}／${track.trackAptitudeGrade}</dt><dd>${signed(track.trackAptitudeMod)}</dd></div>
        <div><dt>距离、重地、气性、状态</dt><dd>0</dd></div>
        <div class="tal-total"><dt>本场能力</dt><dd>${calculation.ability}</dd></div>
      </dl>
    </section>`;
  }

  function phaseSummary(result) {
    if (!result || !result.phases) return "";
    const gate = result.phases.gate || {};
    const position = result.phases.position || {};
    const sprint = result.phases.sprint || {};
    const values = [gate.total, position.total, sprint.total].map((value) => Number.isFinite(value) ? signed(value) : "退赛");
    return `序盘 ${values[0]}／中盘 ${values[1]}／末盘 ${values[2]}`;
  }

  function resultCard(lastRun) {
    if (!lastRun || !lastRun.result) return `<section class="tal-card tal-result-card"><h2>实验结果</h2><p class="tal-muted">尚未运行比赛。计算明细已经按当前配置预览。</p></section>`;
    const rows = lastRun.result.results || [];
    return `<section class="tal-card tal-result-card">
      <h2>实验结果</h2>
      <p class="tal-muted">${escapeHtml(lastRun.race.name)} · 良 · ${escapeHtml(lastRun.createdAt.replace("T", " ").slice(0, 19))}</p>
      <ol class="tal-results">${rows.map((row) => {
        const calculation = row.calculation || {};
        return `<li><strong>${escapeHtml(row.horseId === "lab-horse" ? "实验马" : "对照马")}</strong>
          <span>${row.retired ? "退赛" : `第${row.rank}名`}</span>
          <small>入场能力 ${row.entryAbility}，最终分 ${row.total == null ? "—" : row.total}；${phaseSummary(row)}</small>
          <small>本场修正：表面 ${signed(calculation.surfaceMod)}，${calculation.trackAptitude ? `${calculation.trackAptitude.trackTypeLabel}${calculation.trackAptitude.intensityLabel}` : "赛场类型"} ${signed(calculation.trackAptitudeMod)}</small>
        </li>`;
      }).join("")}</ol>
    </section>`;
  }

  function render(root, state, message) {
    const profile = profileFor(state.profileId);
    const profileOptions = profiles().map((item) => `<option value="${escapeHtml(item.id)}"${item.id === state.profileId ? " selected" : ""}>${escapeHtml(item.name)} · ${ns.TrackAptitudeRules.trackTypeLabelFor(item.type)}${ns.TrackAptitudeRules.intensityLabelFor(item.intensity)}</option>`).join("");
    const horseCalculation = profile ? calculate(state.horse, profile) : null;
    const rivalCalculation = profile ? calculate(state.rival, profile) : null;
    root.innerHTML = `<main class="tal-shell">
      <header class="tal-header">
        <p class="tal-eyebrow">赛场适性系统 · 实验版</p>
        <h1>赛前能力试跑</h1>
        <p>开发中，数值未定。本页只使用独立实验存储，不会读取、修改或清除正式游戏进度。</p>
      </header>
      <section class="tal-card tal-profile-card">
        <h2>实验赛程</h2>
        <label>赛程<select name="profileId">${profileOptions}</select></label>
        ${profile ? `<div class="tal-profile-detail"><strong>${escapeHtml(profile.trackName)} · ${escapeHtml(profile.routeName)}</strong><span>${profile.surface}${profile.distance}米 · ${ns.TrackAptitudeRules.trackTypeLabelFor(profile.type)}${ns.TrackAptitudeRules.intensityLabelFor(profile.intensity)}</span><small>${escapeHtml(profile.note)}</small></div>` : `<p class="tal-error">没有可用的实验赛程。</p>`}
      </section>
      <div class="tal-horse-grid">${horseFields("horse", "实验马", state.horse)}${horseFields("rival", "对照马", state.rival)}</div>
      <section class="tal-card tal-preview-card">
        <div class="tal-section-heading"><div><h2>当前计算明细</h2><p>固定成熟期、良场、沉稳气性，无距离和状态惩罚。</p></div><span>${message ? escapeHtml(message) : ""}</span></div>
        <div class="tal-calculation-grid">${horseCalculation ? calculationCard("实验马", horseCalculation) : ""}${rivalCalculation ? calculationCard("对照马", rivalCalculation) : ""}</div>
      </section>
      <div class="tal-actions"><button type="button" data-action="run" ${profile ? "" : "disabled"}>运行一场实验赛</button><button type="button" class="tal-secondary" data-action="save">保存实验配置</button><button type="button" class="tal-secondary" data-action="reset">恢复默认</button></div>
      ${resultCard(state.lastRun)}
      <footer class="tal-footer"><a href="index.html">返回正式游戏</a><span>规则版本：${ns.TrackAptitudeRules.VERSION}</span></footer>
    </main>`;
  }

  function browserStorage() {
    try {
      return window.localStorage;
    } catch (error) {
      return null;
    }
  }

  function initializePage() {
    const root = document.getElementById("trackAptitudeLab");
    if (!root || !ns.TrackAptitudeRules || !ns.CourseProfiles || !ns.HorseRules || !ns.RaceRules) return;
    const storage = browserStorage();
    let state = readStoredState(storage);
    let message = storage ? "已载入独立实验配置。" : "当前浏览器不能保存实验配置。";

    const update = () => render(root, state, message);
    update();

    root.addEventListener("change", (event) => {
      const input = event.target;
      if (!input.name) return;
      if (input.name === "profileId") state.profileId = input.value;
      else {
        const [horseKey, group, property] = input.name.split(".");
        const horse = state[horseKey];
        if (!horse) return;
        if (!group) horse[property || "name"] = input.value;
        else if (property) horse[group][property] = input.value;
        else horse[group] = input.value;
      }
      state = normalizeState(state);
      state.lastRun = null;
      message = "已更新预览；点击“保存实验配置”后才写入本地。";
      update();
    });

    root.addEventListener("click", (event) => {
      const action = event.target && event.target.dataset ? event.target.dataset.action : "";
      if (!action) return;
      if (action === "run") {
        state.lastRun = runExperiment(state);
        try {
          state = writeStoredState(storage, state);
          message = "已完成试跑并保存这次实验记录。";
        } catch (error) {
          message = "已完成试跑，但当前浏览器未能保存实验记录。";
        }
      }
      if (action === "save") {
        try {
          state = writeStoredState(storage, state);
          message = "已保存到独立实验存储。";
        } catch (error) {
          message = "当前浏览器不能保存实验配置。";
        }
      }
      if (action === "reset") {
        state = createDefaultState();
        try {
          if (storage && typeof storage.removeItem === "function") storage.removeItem(STORAGE_KEY);
          message = "已恢复实验页默认配置。";
        } catch (error) {
          message = "已恢复默认配置，但未能清理旧实验记录。";
        }
      }
      update();
    });
  }

  ns.TrackAptitudeLab = {
    STORAGE_KEY,
    STORAGE_VERSION,
    createDefaultState,
    normalizeState,
    readStoredState,
    writeStoredState,
    buildRace,
    calculate,
    runExperiment
  };

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initializePage);
    else initializePage();
  }
})();
