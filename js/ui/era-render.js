(function () {
  const ns = (window.Keiba = window.Keiba || {});

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function resolvedText(textId, tokens) {
    try {
      return ns.EraTextIndex.resolve(textId, tokens || {});
    } catch (_error) {
      return {
        title: "赛季记录",
        body: "这条记录暂时无法显示。",
        nature: "system",
        category: "fallback",
        presentation: "article"
      };
    }
  }

  function currentTimeLabel(run) {
    const time = run.career.currentTime;
    const year = Number(run.career.horse.birthYear || 1995) + Number(time.age || 0);
    return `${year}年${time.month}月${time.half === 2 ? "下旬" : "上旬"}`;
  }

  function chapterLabel(chapterId) {
    const labels = {
      prologue: "序章",
      "two-year-prologue": "二岁前章",
      satsuki: "皋月赏篇",
      derby: "日本德比篇",
      kikka: "菊花赏篇",
      ending: "年度结局",
      summary: "年度总结"
    };
    return labels[chapterId] || "经典赛季";
  }

  function sceneTypeLabel(type) {
    const labels = {
      dialogue: "人物场景",
      news: "新闻／纪事",
      "dynamic-report": "赛前动态报道",
      time: "时间推进",
      "race-decision": "赛程决定",
      "race-result": "赛果快报",
      ending: "年度总结"
    };
    return labels[type] || "赛季记录";
  }

  function reportFormLabel(form) {
    const labels = {
      unproven: "未经检验",
      winner: "胜势正盛",
      contender: "有力竞争",
      mixed: "谨慎观察",
      outsider: "挑战者",
      "health-question": "健康疑问"
    };
    return labels[form] || form;
  }

  function formatSceneDate(scene) {
    if (!scene || !scene.date) return "当前赛季";
    const match = String(scene.date).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return match ? `${Number(match[1])}年${Number(match[2])}月${Number(match[3])}日` : scene.date;
  }

  function scenarioFacts(scenario) {
    return `
      <div class="era-scenario-facts">
        <span><small>赛季年份</small><b>${escapeHtml((scenario.playableRange || [1997, 1998]).join("—"))}</b></span>
        <span><small>试玩范围</small><b>二岁前章＋经典三冠</b></span>
        <span><small>叙事视角</small><b>玩家本人</b></span>
        <span><small>主要群像</small><b>黄金世代相关人员</b></span>
      </div>
    `;
  }

  function renderEntryCandidates(setup) {
    const candidates = ns.EraRules.getEntryCandidates(setup);
    return `
      <section class="era-entry-selection" aria-labelledby="eraEntrySelectionTitle">
        <div class="era-section-heading">
          <div><p class="eyebrow">ROUTE ENTRIES / 路线候选</p><h2 id="eraEntrySelectionTitle">选择你要遇见的赛马</h2></div>
          <span>${candidates.length} 项</span>
        </div>
        <p class="muted">候选已经生成并保存。刷新或返回不会改变它的外观、能力与练马师判断。</p>
        <div class="era-entry-grid">
          ${candidates.map((candidate) => {
            const preview = resolvedText(candidate.previewTextId, {});
            return `
              <article class="era-entry-card">
                <p class="eyebrow">${escapeHtml(candidate.routeLabel)}</p>
                <h3>${escapeHtml(candidate.title || "尚未命名")}</h3>
                ${preview.status === "outline" ? `<span class="era-outline-note">剧情提要 · 待优化</span>` : ""}
                <p>${escapeHtml(outlineBody(preview))}</p>
                <dl>
                  <div><dt>当前称呼</dt><dd>尚未命名</dd></div>
                  <div><dt>性别</dt><dd>${escapeHtml(candidate.gender)}</dd></div>
                  <div><dt>毛色</dt><dd>${escapeHtml(candidate.coat)}</dd></div>
                  <div><dt>练马师</dt><dd>${escapeHtml(candidate.trainerName)}</dd></div>
                </dl>
                <button type="button" data-era-select-candidate="${escapeHtml(candidate.id)}">前往马房相遇</button>
              </article>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

  function renderHub(container, run, options) {
    const scenario = ns.EraRules.scenarioFor(run || ns.EraRules.DEFAULT_SCENARIO_ID);
    const summary = resolvedText(scenario.summaryTextId, run ? ns.EraRules.baseTokens(run, null) : {});
    const objective = resolvedText(scenario.objectiveTextId, run ? ns.EraRules.baseTokens(run, null) : {});
    container.innerHTML = `
      <section class="era-screen era-hub" aria-labelledby="eraHubTitle">
        <header class="era-topbar">
          <button class="secondary" type="button" data-era-home>返回主页</button>
          <span class="era-test-badge">剧情模式测试入口</span>
        </header>
        <div class="era-hub-card">
          <div class="era-masthead"><span>OWNER'S SEASON</span><b>${escapeHtml(scenario.seasonTitle)}</b></div>
          <p class="eyebrow">剧情模式 · ${escapeHtml(scenario.stageLabel)}</p>
          <h1 id="eraHubTitle">${escapeHtml(scenario.name)}</h1>
          <p class="era-lead">${escapeHtml(summary.body.replace(/^\[|\]$/g, ""))}</p>
          ${scenarioFacts(scenario)}
          <div class="era-objective-card">
            <strong>本期纵向切片</strong>
            <p>${escapeHtml(objective.body.replace(/^\[|\]$/g, ""))}</p>
          </div>
          ${options.saveMessage ? `<p class="era-save-message" role="status">${escapeHtml(options.saveMessage)}</p>` : ""}
          ${run ? `
            <div class="era-hub-actions">
              <button type="button" data-era-continue>${run.era.onboarding && run.era.onboarding.phase !== "complete" ? "继续马房相遇" : `继续 ${escapeHtml(run.career.horse.name)} 的赛季`}</button>
              <button class="secondary" type="button" data-era-restart>重新开始</button>
            </div>
            <p class="muted">${escapeHtml(run.era.playerReference || "马主")} · ${escapeHtml(currentTimeLabel(run))} · ${escapeHtml(run.era.currentObjective)}</p>
          ` : options.entrySetup ? `
            ${renderEntryCandidates(options.entrySetup)}
            <div class="era-hub-actions"><button class="secondary" type="button" data-era-restart>重新开始填写称呼</button></div>
          ` : `
            <div class="era-create-form">
              <label for="eraPlayerReferenceInput">玩家称呼</label>
              <input id="eraPlayerReferenceInput" type="text" maxlength="20" value="马主" autocomplete="off" aria-describedby="eraReferenceHint">
              <p id="eraReferenceHint" class="muted">其他人物会用这个称呼叫你，也会用作你的发言名牌。</p>
              <p class="muted">赛马将在下一步生成。你会先与它相遇，听取练马师评估，最后再为它命名。</p>
              <button type="button" data-era-create-candidates>生成本次路线候选</button>
            </div>
          `}
        </div>
      </section>
    `;
  }

  function characterForScene(run, scene) {
    return ns.EraRules.characterFor(run, scene && scene.speakerId);
  }

  function isNewspaperInsert(scene) {
    return !!(scene && (scene.type === "dynamic-report" || scene.speakerId === "press-keiba-weekly"));
  }

  function newspaperMasthead(label) {
    return `<div class="era-newspaper-masthead"><span>KEIBA WEEKLY / 竞马周报</span><b>${escapeHtml(label || "赛季特别版")}</b></div>`;
  }

  function outlineBody(content) {
    return content && content.status === "outline"
      ? String(content.body || "").replace(/^\[|\]$/g, "")
      : String(content && content.body || "");
  }

  function renderSceneBody(run, scene, isCurrent) {
    const slotOrder = ["base", "history-context", "speaker-reaction", "worldline", "future-hook"];
    const slots = scene.textSlots && Object.keys(scene.textSlots).length ? scene.textSlots : { base: scene.textId };
    const tokens = scene.tokensSnapshot || scene.tokens || {};
    const contents = slotOrder
      .filter((slot) => slots[slot])
      .map((slot) => ({ slot, content: resolvedText(slots[slot], tokens) }));
    Object.keys(slots).filter((slot) => !slotOrder.includes(slot)).forEach((slot) => {
      contents.push({ slot, content: resolvedText(slots[slot], tokens) });
    });
    const content = contents[0] ? contents[0].content : resolvedText(scene.textId, tokens);
    const character = characterForScene(run, scene);
    const outline = scene.contentStatus === "outline" || contents.some((item) => item.content.status === "outline" || item.content.presentation === "outline");
    const playerSpeaker = character.id === "player";
    return `
      ${isNewspaperInsert(scene) ? newspaperMasthead(scene.type === "dynamic-report" ? "赛前动态报道" : "时代背景插页") : ""}
      <div class="era-scene-meta">
        <time>${escapeHtml(formatSceneDate(scene))}</time>
        <span>${escapeHtml(sceneTypeLabel(scene.type))}</span>
        ${outline ? `<em>剧情提要 · 待优化</em>` : ""}
      </div>
      <div class="era-speaker ${playerSpeaker ? "is-player" : ""}">
        <span>${escapeHtml(character.name)}</span>
        <small>${escapeHtml(character.role || "赛季记录")}</small>
      </div>
      <div class="era-scene-slots">
        ${contents.map((item, index) => `
          <section class="era-scene-slot era-scene-slot-${escapeHtml(item.slot)}">
            <h${index === 0 ? (isCurrent ? "2" : "3") : "4"}>${escapeHtml(item.content.title)}</h${index === 0 ? (isCurrent ? "2" : "3") : "4"}>
            <p>${escapeHtml(outlineBody(item.content))}</p>
          </section>
        `).join("")}
      </div>
      ${scene.reportForm ? `<div class="era-report-angle">报道角度：${escapeHtml(reportFormLabel(scene.reportForm))}</div>` : ""}
    `;
  }

  function renderTrainerComments(run, compact) {
    const comments = Array.isArray(run.career.commentDetails) ? run.career.commentDetails : [];
    return `
      <section class="era-trainer-comments ${compact ? "is-encounter" : ""}" aria-label="出道前评估">
        <header>
          <div><small>TRAINER'S NOTES</small><h3>佐藤悠太的出道前评估</h3></div>
          <span>六项观察</span>
        </header>
        <div class="trainer-notes-grid">${ns.UI.trainerCommentCards(comments, "era")}</div>
      </section>
    `;
  }

  function renderCurrentScene(run, options) {
    const scene = ns.EraRules.getCurrentScene(run);
    if (!scene) return `<section class="era-current-scene is-empty"><p>当前赛季记录已全部整理。</p></section>`;
    const choices = ns.EraRules.getSceneChoices(run, scene);
    const transient = options.transientScene && options.transientScene.sceneId === scene.id
      ? options.transientScene
      : null;
    const response = transient ? resolvedText(transient.textId, transient.tokens) : null;
    const isNaming = scene.sourceKind === "encounter" && scene.interactionKind === "naming";
    const isAssessment = scene.sourceKind === "encounter" && scene.interactionKind === "assessment";
    return `
      <section class="era-current-scene era-scene-${escapeHtml(scene.type)}" data-era-current-scene aria-live="polite">
        <div class="era-current-kicker">CURRENT SCENE / 当前场景</div>
        ${renderSceneBody(run, scene, true)}
        ${isAssessment ? renderTrainerComments(run, true) : ""}
        ${response ? `
          <div class="era-transient-response">
            <span>即时反应 · 不写入存档${response.status === "outline" ? " · 剧情提要待优化" : ""}</span>
            <h3>${escapeHtml(response.title)}</h3>
            <p>${escapeHtml(outlineBody(response))}</p>
            <button type="button" data-era-transient-complete="${escapeHtml(scene.id)}">继续相遇</button>
          </div>
        ` : isNaming ? `
          <div class="era-encounter-naming">
            <label for="eraEncounterHorseName">为这匹赛马命名</label>
            <input id="eraEncounterHorseName" type="text" maxlength="30" autocomplete="off" placeholder="输入正式马名">
            <p class="muted">名称不能为空，最长30字符；输入将作为纯文本安全显示。</p>
            <button type="button" data-era-name-horse data-era-scene-id="${escapeHtml(scene.id)}">确认名字</button>
          </div>
        ` : choices.length ? `
          <div class="era-scene-choices" aria-label="当前场景选项">
            ${choices.map((choice, index) => `
              <button class="${index === 0 ? "" : "secondary"}" type="button" ${choice.action === "transient-preview" ? `data-era-transient-choice="${escapeHtml(choice.id)}"` : `data-era-choice="${escapeHtml(choice.id)}"`} data-era-scene-id="${escapeHtml(scene.id)}">${escapeHtml(choice.label)}</button>
            `).join("")}
          </div>
        ` : ""}
      </section>
    `;
  }

  function renderTimeline(run) {
    const timeline = ns.EraRules.getTimeline(run);
    return `
      <section class="era-timeline-section" data-era-timeline aria-labelledby="eraTimelineTitle">
        <header class="era-section-heading">
          <div><p class="eyebrow">YOUR SEASON / 历史记录流</p><h2 id="eraTimelineTitle">你的赛季记录</h2></div>
          <span>${timeline.length} 条</span>
        </header>
        <div class="era-timeline">
          ${timeline.length ? timeline.map((scene) => `
            <article class="era-timeline-item era-scene-${escapeHtml(scene.type)}">
              ${renderSceneBody(run, scene, false)}
              ${scene.historyStatus ? `<span class="era-history-status">${escapeHtml(scene.historyStatus)}</span>` : ""}
            </article>
          `).join("") : `<p class="era-empty-record">从第一次走进马房开始，你经历的相遇、对话、赛果与时间变化都会收录在这里。</p>`}
        </div>
      </section>
    `;
  }

  function latestRace(run) {
    const races = run.career.races || [];
    return races.length ? races[races.length - 1] : null;
  }

  function latestRaceLabel(run) {
    const record = latestRace(run);
    if (!record || !record.public) return "尚无出赛记录";
    return `${record.public.raceName || "最近一战"} · ${record.public.rankLabel || (record.public.retired ? "退赛" : "着外")}`;
  }

  function conditionLabel(run) {
    const injury = run.career.injury && run.career.injury.active;
    if (injury) return injury.publicLabel || `${injury.reason || "伤病"}休养中`;
    if (run.career.forcedRetirement) return "因伤强制退役";
    return "可出赛";
  }

  function fatigueLabel(run) {
    const pressure = run.career.fatigue && Number.isFinite(run.career.fatigue.pressure)
      ? run.career.fatigue.pressure
      : 0;
    return ["充足", "轻度累积", "需要留意", "高风险"][Math.max(0, Math.min(3, pressure))];
  }

  function renderDossier(run) {
    const horse = run.career.horse;
    const trainer = run.career.trainer || {};
    const jockey = run.career.playerJockey || {};
    const scheduled = run.career.scheduledRace;
    const assessmentRevealed = !run.era.onboarding
      || run.era.onboarding.phase === "complete"
      || run.era.onboarding.step >= 2;
    return `
      <aside class="era-dossier" aria-label="赛季人物资料">
        <div class="era-dossier-heading"><span>DOSSIER</span><b>主角资料</b></div>
        <section class="era-dossier-horse">
          <p class="eyebrow">PLAYER HORSE</p>
          <h2>${escapeHtml(horse.name)}</h2>
          <p>${escapeHtml(horse.gender)} · ${escapeHtml(horse.coat || "毛色未记录")} · 草地王道路</p>
        </section>
        <dl class="era-data-list">
          <div><dt>当前状态</dt><dd>${escapeHtml(conditionLabel(run))}</dd></div>
          <div><dt>比赛疲劳</dt><dd>${escapeHtml(fatigueLabel(run))}</dd></div>
          <div><dt>最近一战</dt><dd>${escapeHtml(latestRaceLabel(run))}</dd></div>
          <div><dt>当前安排</dt><dd>${escapeHtml(scheduled ? `${scheduled.race.nameZh || scheduled.race.name} · ${scheduled.schedule.historicalDate || scheduled.schedule.label}` : "尚未报名")}</dd></div>
        </dl>
        ${assessmentRevealed ? renderTrainerComments(run, false) : `
          <section class="era-trainer-comments is-locked">
            <header><div><small>TRAINER'S NOTES</small><h3>佐藤悠太的五项评估</h3></div><span>相遇后公开</span></header>
            <p class="muted">能力、场地、距离、成长与气性评语会由佐藤悠太在相遇过程中说明。</p>
          </section>
        `}
        <section class="era-personnel-list">
          <h3>赛马相关人员</h3>
          <div><span>${escapeHtml(trainer.name || "佐藤悠太")}</span><small>练马师</small></div>
          <div><span>${escapeHtml(jockey.name || "高桥隼人")}</span><small>主战骑手 · 能力${escapeHtml(jockey.ability || 70)}</small></div>
          <div><span>${escapeHtml(run.era.playerReference || "马主")}</span><small>玩家称呼</small></div>
        </section>
        <div class="era-route-notes">
          <span>经典胜场 <b>${escapeHtml(run.era.classicWins)}</b></span>
          <span>三冠可能 <b>${run.era.tripleCrownPossible ? "保留" : "已失去"}</b></span>
          <span>历史分歧 <b>${escapeHtml(run.era.divergenceFlags.length)}</b></span>
        </div>
      </aside>
    `;
  }

  function scheduleStatusLabel(option) {
    const labels = {
      available: "当前可选",
      scheduled: "已报名",
      completed: "已完成",
      past: "已错过",
      locked: "剧情未开放",
      ineligible: "资格未满足",
      "window-excluded": "本旬已作选择",
      "route-excluded": "路线互斥·不计缺席"
    };
    return labels[option.status] || "不可报名";
  }

  function renderScheduleDrawer(run, options) {
    const currentScene = ns.EraRules.getCurrentScene(run);
    const scheduleOptions = ns.EraRules.getScheduleOptions(run, currentScene);
    const scheduledId = run.career.scheduledRace && run.career.scheduledRace.eraOccurrenceId;
    const sections = [
      { id: "current", title: "当前可报", empty: "当前剧情节点没有可报名赛事。" },
      { id: "future", title: "未来赛历", empty: "没有尚未开放的赛事。" },
      { id: "completed", title: "已完成", empty: "赛季记录中尚无已完成或已关闭赛事。" }
    ];
    const renderRows = (items) => items.map((option) => {
      const occurrence = option.occurrence;
      const race = option.race;
      const preview = option.preview || {};
      return `
        <article class="era-schedule-row is-${escapeHtml(option.status)}">
          <div class="era-schedule-date"><b>${escapeHtml(occurrence.date.slice(5))}</b><small>${escapeHtml(occurrence.date.slice(0, 4))}</small></div>
          <div class="era-schedule-copy">
            <span>${escapeHtml(scheduleStatusLabel(option))}</span>
            <h3>${escapeHtml(occurrence.nameZh)}</h3>
            <p>${escapeHtml(race.grade)} · ${escapeHtml(ns.RaceSelection.label(race))} · ${escapeHtml(race.surface)}${escapeHtml(race.distance)}m</p>
            ${option.reason ? `<p class="era-registration-reason">${escapeHtml(option.reason)}</p>` : ""}
            ${option.section === "current" ? `<div class="era-registration-preview">
              <small class="${preview.withinDistance === false ? "is-warning" : ""}">${escapeHtml(preview.distanceLabel || "")}</small>
              <small class="${preview.fatigue && preview.fatigue.eligible ? "is-warning" : ""}">${escapeHtml(preview.fatigueLabel || "")}</small>
            </div>` : ""}
          </div>
          ${option.enabled && currentScene ? `<button type="button" data-era-drawer-register="${escapeHtml(occurrence.id)}" data-era-scene-id="${escapeHtml(currentScene.id)}">报名</button>` : ""}
          ${scheduledId === occurrence.id ? `<button class="secondary" type="button" data-era-cancel-race>取消报名</button>` : ""}
        </article>
      `;
    }).join("");
    return `
      <div class="era-drawer-backdrop" ${options.scheduleOpen ? "" : "hidden"} data-era-schedule-close></div>
      <aside class="era-schedule-drawer ${options.scheduleOpen ? "is-open" : ""}" data-era-schedule-drawer aria-hidden="${options.scheduleOpen ? "false" : "true"}" aria-label="赛程手册">
        <header>
          <div><p class="eyebrow">LIMITED CALENDAR 1997—1998</p><h2>赛程手册</h2></div>
          <button class="secondary" type="button" data-era-schedule-close>关闭</button>
        </header>
        <p class="era-drawer-note">每个自由赛历窗口最多参加一场；未选择的普通比赛不会记为缺席。</p>
        <div class="era-schedule-list">
          ${sections.map((section) => {
            const items = scheduleOptions.filter((option) => option.section === section.id);
            return `<section class="era-schedule-section is-${section.id}">
              <h3>${escapeHtml(section.title)} <small>${items.length}</small></h3>
              ${items.length ? renderRows(items) : `<p class="era-empty-record">${escapeHtml(section.empty)}</p>`}
            </section>`;
          }).join("")}
        </div>
        <details class="era-season-menu">
          <summary>赛季管理</summary>
          <p>提前退役会立即结束当前世界线，普通、传奇和肉鸽存档不会受影响。</p>
          ${run.era.endingId || (run.era.stageState && run.era.stageState.status === "ending-pending") ? "" : `<button class="secondary era-retire-button" type="button" data-era-retire>让${escapeHtml(run.career.horse.name)}提前退役</button>`}
        </details>
      </aside>
    `;
  }

  function renderNewspaperDrawer(run, options) {
    const items = ns.EraRules.getNewspaperItems(run);
    return `
      <div class="era-newspaper-backdrop" ${options.newspaperOpen ? "" : "hidden"} data-era-newspaper-close></div>
      <aside class="era-newspaper-drawer ${options.newspaperOpen ? "is-open" : ""}" data-era-newspaper-drawer aria-hidden="${options.newspaperOpen ? "false" : "true"}" aria-label="报纸箱">
        <header>
          <div><p class="eyebrow">DELIVERED PAPERS</p><h2>报纸箱</h2></div>
          <button class="secondary" type="button" data-era-newspaper-close>关闭</button>
        </header>
        <p class="era-drawer-note">普通赛后新闻会投递到这里，不会中断你正在经历的人物场景。</p>
        <div class="era-newspaper-list">
          ${items.length ? items.map((item) => {
            const content = resolvedText(item.textId, item.tokens);
            return `
              <article class="era-newspaper-item ${item.read ? "is-read" : "is-unread"}">
                ${newspaperMasthead(item.time || "赛季记录")}
                <time>${escapeHtml(item.time || "赛季记录")}</time>
                <h3>${escapeHtml(content.title)}</h3>
                <p>${escapeHtml(content.body)}</p>
                ${item.read ? `<span class="era-read-state">已读</span>` : `<button type="button" data-era-news-read="${escapeHtml(item.id)}">标记已读</button>`}
              </article>
            `;
          }).join("") : `<p class="era-empty-record">尚无报纸投递。重要赛前报道仍会作为插页出现在当前场景中。</p>`}
        </div>
      </aside>
    `;
  }

  function renderSummary(run) {
    if (!run.era.summary || !run.era.stageState || !run.era.stageState.summaryVisible) return "";
    const summary = run.era.summary;
    const content = resolvedText(run.era.endingTextId, run.era.endingTokens);
    return `
      <section class="era-editorial-summary" data-era-summary>
        <p class="eyebrow">1998年度总结 · 阶段1完成</p>
        <h2>${escapeHtml(content.title)}</h2>
        <p>${escapeHtml(content.body)}</p>
        <div>
          <span><small>参赛关键战</small><b>${escapeHtml(summary.participated)}/3</b></span>
          <span><small>经典胜场</small><b>${escapeHtml(summary.classicWins)}</b></span>
          <span><small>最佳名次</small><b>${summary.bestFinish ? `${escapeHtml(summary.bestFinish)}着` : "无"}</b></span>
          <span><small>历史分歧</small><b>${escapeHtml(summary.divergenceCount)}</b></span>
        </div>
        <small>1999古马战线尚未开放。</small>
      </section>
    `;
  }

  function renderRun(container, run, options) {
    const scenario = ns.EraRules.scenarioFor(run);
    const nextKey = ns.EraRules.getNextKeyRace(run);
    const encounterActive = !!(run.era.onboarding && run.era.onboarding.phase !== "complete");
    const newspaperItems = ns.EraRules.getNewspaperItems(run);
    const unreadCount = newspaperItems.filter((item) => !item.read).length;
    container.innerHTML = `
      <section class="era-screen era-run" aria-labelledby="eraRunTitle">
        <header class="era-editorial-header">
          <div class="era-edition-mark"><span>OWNER'S SEASON</span><b>${escapeHtml(scenario.seasonTitle)}</b></div>
          <div class="era-run-identity">
            <p class="eyebrow">剧情模式 · ${escapeHtml(chapterLabel(run.era.currentChapter))}</p>
            <h1 id="eraRunTitle">${escapeHtml(run.career.horse.name)}</h1>
            <p>${escapeHtml(run.era.playerReference || "马主")} · ${escapeHtml(currentTimeLabel(run))} · ${encounterActive ? "当前目标：完成马房相遇" : `当前目标：${escapeHtml(run.era.currentObjective || (nextKey ? nextKey.nameZh : "年度总结"))}`}</p>
          </div>
          <div class="era-header-actions">
            <span title="${escapeHtml(options.saveMessage || "剧情模式使用独立自动存档")}">● 独立自动存档</span>
            ${encounterActive ? "" : `<button class="secondary" type="button" data-era-schedule-open>赛程手册</button>`}
            <button class="secondary" type="button" data-era-newspaper-open>报纸箱${unreadCount ? `（${unreadCount}）` : ""}</button>
            <button class="secondary" type="button" data-era-hub>剧本菜单</button>
            <button class="secondary" type="button" data-era-home>返回主页</button>
          </div>
        </header>
        <div class="era-editorial-grid">
          <main class="era-narrative-column">
            ${renderCurrentScene(run, options)}
            ${renderSummary(run)}
            ${renderTimeline(run)}
          </main>
          ${renderDossier(run)}
        </div>
        ${encounterActive ? "" : renderScheduleDrawer(run, options)}
        ${renderNewspaperDrawer(run, options)}
      </section>
    `;
  }

  function render(container, run, options) {
    if (!container) return;
    const opts = {
      showHub: true,
      scheduleOpen: false,
      newspaperOpen: false,
      transientScene: null,
      entrySetup: null,
      saveMessage: "",
      ...(options || {})
    };
    if (!run || opts.showHub) renderHub(container, run, opts);
    else renderRun(container, run, opts);
  }

  ns.EraUI = { render, escapeHtml, resolvedText, sceneTypeLabel };
})();
