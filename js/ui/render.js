(function () {
  const ns = (window.Keiba = window.Keiba || {});

  function optionList(items, selectedId) {
    return items.map((item) => `<option value="${item.id}" ${item.id === selectedId ? "selected" : ""}>${item.name}</option>`).join("");
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

  function raceMatchesFilters(plan, filters) {
    const grade = filters && filters.grade ? filters.grade : "all";
    const surface = filters && filters.surface ? filters.surface : "all";
    const distance = filters && filters.distance ? filters.distance : "all";
    const raceClass = plan.race.raceClass;
    const gradeMatched = grade === "all"
      || raceClass === grade
      || (grade === "g1" && raceClass === "jpn1")
      || (grade === "g2" && raceClass === "jpn2")
      || (grade === "g3" && raceClass === "jpn3")
      || (grade === "condition" && ns.RaceProgression.CONDITION_CLASSES.includes(raceClass));
    const surfaceMatched = surface === "all" || plan.race.surface === surface;
    const raceDistance = plan.race.distance;
    const distanceMatched = distance === "all"
      || (distance === "sprint" && raceDistance >= 1000 && raceDistance <= 1300)
      || (distance === "mile" && raceDistance >= 1400 && raceDistance <= 1800)
      || (distance === "middle" && raceDistance >= 1900 && raceDistance <= 2200)
      || (distance === "intermediate" && raceDistance >= 2300 && raceDistance <= 2600)
      || (distance === "long" && raceDistance >= 2601);
    return gradeMatched && surfaceMatched && distanceMatched;
  }

  function renderSetup(root) {
    const sireBloodlines = ns.SireBloodlines || ns.Bloodlines || [];
    const damBloodlines = ns.DamBloodlines || ns.Bloodlines || [];
    const jockeys = ns.JockeyRules
      ? ns.JockeyRules.getPlayerSelectableJockeys("japan")
      : ns.Jockeys || [];
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
          <button class="secondary help-toggle" id="helpToggleBtn" type="button" aria-expanded="false">属性帮助</button>
        </div>
        <div class="help-panel" id="helpPanel" hidden>${ns.Help ? ns.Help.attributeHelpHtml : ""}</div>
        <div class="form-grid">
          <label>马名
            <input id="horseNameInput" type="text" value="未命名小马">
          </label>
          <label>父系
            <select id="sireSelect">${optionList(sireBloodlines, "random")}</select>
          </label>
          <label>母系
            <select id="damSelect">${optionList(damBloodlines, "random")}</select>
          </label>
          <div class="field-block trainer-field">
            <div class="field-label-row">
              <span>练马师</span>
              <button class="secondary icon-help-button" id="trainerHelpToggleBtn" type="button" aria-expanded="false" aria-label="查看练马师信息" title="练马师信息">?</button>
            </div>
            <select id="trainerSelect">${optionList(trainers, "sato-yuta")}</select>
          </div>
          <label>主战骑手
            <select id="mainJockeySelect">${optionList(jockeys, "take-yutaka")}</select>
          </label>
        </div>
        <div class="help-panel trainer-help-panel" id="trainerHelpPanel" hidden>${ns.Help ? ns.Help.trainerHelpHtml : ""}</div>
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

  function renderHorse(panel, career) {
    if (!career) {
      panel.innerHTML = `<p class="muted">生成后会显示出道前评语。</p>`;
      return;
    }
    const horse = career.horse;
    const trainer = career.trainer || (ns.CommentRules && ns.CommentRules.getTrainer(career.trainerId || horse.trainerId));
    const mainJockey = ns.JockeyRules.getJockey(career.mainJockeyId);
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
      </div>
      <div class="trainer-comments">
        ${comments.map((comment, index) => `
          <div class="trainer-comment comment-tone-${(index % 5) + 1}">
            <span>${comment.label || comment.item || `评语 ${index + 1}`}</span>
            <p>${comment.text}</p>
          </div>
        `).join("")}
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

  function renderRaceSelector(panel, career, filters) {
    if (!career || career.retired) {
      panel.innerHTML = "";
      return;
    }
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
      const opponentName = payload.opponent.displayName || payload.opponent.name || "随机对手";
      const opponentYear = payload.year ? `${payload.year} ` : "";
      panel.innerHTML = `
        ${racePanelHeader(career, "下一场比赛")}
        <div class="scheduled-race">
          <span class="badge">已报名</span>
          <h2>${payload.schedule.label} · ${race.name}</h2>
          <p>${race.grade} · ${race.ageRule}${raceRestrictionLabel(race)} · ${race.surfaceRegion || "日本"}${race.surface}${race.distance}m · ${race.course}</p>
          <p class="muted">预定对手：${opponentYear}${opponentName}</p>
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
    const currentFilters = filters || { grade: "all", surface: "all", distance: "all" };
    const filteredPlans = plans.filter((plan) => raceMatchesFilters(plan, currentFilters));
    panel.innerHTML = `
      ${racePanelHeader(career, "下一场比赛")}
      <div class="filter-row">
        <label>等级
          <select id="gradeFilter">
            <option value="all" ${currentFilters.grade === "all" ? "selected" : ""}>全部</option>
            <option value="g1" ${currentFilters.grade === "g1" ? "selected" : ""}>G1/JpnI</option>
            <option value="g2" ${currentFilters.grade === "g2" ? "selected" : ""}>G2/JpnII</option>
            <option value="g3" ${currentFilters.grade === "g3" ? "selected" : ""}>G3/JpnIII</option>
            <option value="op" ${currentFilters.grade === "op" ? "selected" : ""}>公开赛</option>
            <option value="condition" ${currentFilters.grade === "condition" ? "selected" : ""}>条件赛</option>
          </select>
        </label>
        <label>场地
          <select id="surfaceFilter">
            <option value="all" ${currentFilters.surface === "all" ? "selected" : ""}>全部</option>
            <option value="草地" ${currentFilters.surface === "草地" ? "selected" : ""}>草地</option>
            <option value="泥地" ${currentFilters.surface === "泥地" ? "selected" : ""}>泥地</option>
          </select>
        </label>
        <label>距离
          <select id="distanceFilter">
            <option value="all" ${currentFilters.distance === "all" ? "selected" : ""}>全部</option>
            <option value="sprint" ${currentFilters.distance === "sprint" ? "selected" : ""}>短途1000-1300</option>
            <option value="mile" ${currentFilters.distance === "mile" ? "selected" : ""}>英里1400-1800</option>
            <option value="middle" ${currentFilters.distance === "middle" ? "selected" : ""}>中距离1900-2200</option>
            <option value="intermediate" ${currentFilters.distance === "intermediate" ? "selected" : ""}>中长距离2300-2600</option>
            <option value="long" ${currentFilters.distance === "long" ? "selected" : ""}>长距离2601+</option>
          </select>
        </label>
      </div>
      <div id="jockeyNotice"></div>
      ${filteredPlans.length ? `
        <div class="race-row">
          <select id="raceSelect">
            ${filteredPlans.map((plan) => `<option value="${plan.race.id}">${plan.schedule.label} · ${plan.race.name} · ${plan.race.grade} · ${plan.race.ageRule}${raceRestrictionLabel(plan.race)} · ${plan.race.surfaceRegion || "日本"}${plan.race.surface}${plan.race.distance}m · ${plan.race.course}</option>`).join("")}
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
    const orderedRecords = career.races
      .map((item, index) => ({ item, number: index + 1 }))
      .reverse();
    const visibleRecords = expanded ? orderedRecords : orderedRecords.slice(0, 3);
    const hasHiddenRows = orderedRecords.length > visibleRecords.length;
    const revealScores = !!summary;
    const rows = visibleRecords.map(({ item, number }) => {
      const opponentYear = item.public.opponentYear ? `${item.public.opponentYear} ` : "";
      const opponent = item.public.opponentName ? `${opponentYear}${item.public.opponentName}` : "随机对手";
      const opponentJockey = item.public.opponentJockeyName ? ` / ${item.public.opponentJockeyName}` : "";
      const replacementNote = item.public.scheduledOpponentRetired ? " 退赛（随机对手递补）" : "";
      const retired = item.public.retired ? ` · ${item.public.retiredPhase}退赛` : "";
      const injuryText = item.public.injury && item.public.injury.label ? ` · ${item.public.injury.label}` : "";
      const resultText = `${item.public.rankLabel || "着外"}${retired}${injuryText}`;
      const trackCondition = item.public.trackCondition || (item.hidden && item.hidden.trackCondition) || "";
      const scoreLine = revealScores ? `<td>${(item.hidden && item.hidden.scoreLine) || ""}</td>` : "";
      return `<tr><td>${number}</td><td>${item.public.timeLabel || ""}</td><td>${item.public.raceName}</td><td>${trackCondition}</td><td>${resultText}</td><td>${item.public.playerJockeyName || ""}</td><td>${opponent}${opponentJockey}${replacementNote}</td>${scoreLine}</tr>`;
    }).join("");

    let reveal = "";
    if (summary) {
      const h = summary.horse;
      const finalMaturity = ns.MaturityRules.evaluate(h, career.currentTime, career.maturity.decline);
      reveal = `
        <div class="reveal">
          <p class="eyebrow">退役揭晓</p>
          <h2>${h.name} 生涯 ${summary.starts}战 ${summary.wins}胜 · G1 ${summary.g1Wins}胜 · JpnI ${summary.jpn1Wins || 0}胜</h2>
          ${summary.retirementReason ? `<p class="muted">${summary.retirementReason}</p>` : ""}
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
          ${career.horse.debugMode ? `<span class="badge debug-badge">调试模式</span>` : ""}
        </div>
        ${orderedRecords.length > 3 ? `<button class="secondary history-toggle" id="historyToggleBtn">${expanded ? "收起" : "展开全部"}</button>` : ""}
      </div>
      <div class="history-table-wrap">
        <table>
          <thead><tr><th>#</th><th>时间</th><th>比赛</th><th>场地</th><th>结果</th><th>骑手</th><th>主要对手</th>${revealScores ? "<th>出目</th>" : ""}</tr></thead>
          <tbody>${rows || `<tr><td colspan="${revealScores ? 8 : 7}">还没有出赛记录。</td></tr>`}</tbody>
        </table>
      </div>
      ${reveal}
    `;
  }

  ns.UI = { renderSetup, renderChangelog, renderHorse, renderLastRaceComment, renderRaceSelector, renderHistory };
})();
