(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const DAY = 86400000;
  function day(date) { return Date.parse(`${date}T00:00:00Z`) / DAY; }
  function time(run, date) {
    const [year, month, d] = date.split("-").map(Number), age = year - run.career.horse.birthYear;
    return { age, month, half: d >= 16 ? 2 : 1, index: ns.TimeRules.toIndex(age, month, d >= 16 ? 2 : 1), label: date, historicalDate: date };
  }
  function raceFor(id) { const race = ns.EraAlmanac.race(id); if (!race) throw new Error(`Unknown historical edition ${id}`); return race; }
  function toRace(edition) {
    return { id: edition.id, name: edition.nameZh || edition.nameOriginal, nameZh: edition.nameZh || edition.nameOriginal, nameOriginal: edition.nameOriginal, grade: edition.grade, raceClass: edition.grade.toLowerCase(), surface: edition.surface, surfaceRegion: "日本", course: edition.course, distance: edition.distance, month: Number(edition.date.slice(5, 7)), half: Number(edition.date.slice(8)) >= 16 ? 2 : 1, ageRestriction: { type: "min", age: 3 }, ageRule: "3岁以上", eraDate: edition.date };
  }
  function validate() {
    const warnings = [];
    for (const c of ns.EraCalendarRegistry.all()) {
      const e = ns.EraAlmanac.race(c.almanacRaceId), p = ns.EraPerformances[c.almanacRaceId];
      if (!e || !p || p.values.length !== e.results.length) { warnings.push({ type: "missing-era-performance", id: c.almanacRaceId }); continue; }
      e.results.forEach((r, i) => {
        if (!Number.isFinite(p.values[i])) warnings.push({ type: "invalid-performance", id: e.id });
        if (i && (r.finish === e.results[i - 1].finish ? p.values[i] !== p.values[i - 1] : p.values[i] >= p.values[i - 1])) warnings.push({ type: "performance-order", id: e.id });
      });
    }
    return warnings;
  }
  function availability(run, id, scenario) {
    const e = raceFor(id), c = ns.EraCalendarRegistry.find(id);
    let reason = "";
    if (run.ended || run.endingPending) reason = "赛季已经结束";
    else if (!run.onboarding.namingComplete) reason = "请先完成命名";
    else if (run.settled.includes(id)) reason = "比赛已经结算";
    else if (e.date < run.date) reason = "比赛日期已过";
    else if (!c || !ns.EraPerformances[id]) reason = "仅供年鉴浏览，原型尚未标定或核实参赛条件";
    else if (c.origin !== "japan-domestic" || c.rights !== "prototype-open") reason = "资格尚未核实";
    else if (c.age.exact && time(run, e.date).age !== c.age.exact || c?.age.min && time(run, e.date).age < c.age.min) reason = "不符合当年实龄条件";
    else if (c.sex !== "any" && c.sex !== run.career.horse.gender) reason = "不符合性别限制";
    else if (run.scheduledRace) reason = run.scheduledRace === id ? "已报名" : "已有报名，请先取消";
    else if (ns.CareerRules.isResting(run.career)) reason = "伤病休养中";
    else if (run.lastRaceDate && day(e.date) - day(run.lastRaceDate) < scenario.minimumGapDays) reason = `距上一战不足${scenario.minimumGapDays}日（原型间隔）`;
    else if (e.headcount <= e.results.length) reason = "没有可替换的匿名参赛位";
    return { eligible: !reason, reason, edition: e, race: toRace(e), schedule: time(run, e.date) };
  }
  function buildPayload(run, id, scenario) {
    const plan = availability(run, id, scenario);
    if (!plan.eligible) throw new Error(plan.reason);
    const e = plan.edition, p = ns.EraPerformances[id];
    const opponents = e.results.map((r, index) => ({ horseId: r.horseId, id: r.horseId, name: ns.EraAlmanac.horseName(r.horseId), displayNameZh: ns.EraAlmanac.horseName(r.horseId), historicalScore: p.values[index], historicalFinish: r.finish, deadHeat: !!r.deadHeat, anonymous: false, jockeyId: r.jockeyId, jockeyName: r.jockey, riderAbility: 0 }));
    const count = e.headcount - opponents.length - 1, floor = p.values[p.values.length - 1];
    for (let i = 0; i < count; i++) opponents.push({ id: `${id}-anonymous-${i}`, horseId: `${id}-anonymous-${i}`, name: "未收录参赛马", historicalScore: floor - 2 - i * 1.5, historicalFinish: e.results.length + 1 + i, anonymous: true, riderAbility: 0, jockeyName: "未收录骑手" });
    const trackCondition = ({ "良": "良", "稍重": "稍重", "重": "重", "不良": "不良" })[e.going] || "良";
    return { ...plan, opponents, headcount: e.headcount, trackCondition, scoreSource: p.source, raceInstanceId: id };
  }
  // 剧本覆盖的年份：由剧本决定，引擎不再写死 1998。
  function scenarioYears(run) {
    const scenario = ns.EraScenarioRegistry?.find(run?.scenarioId);
    if (Array.isArray(scenario?.years) && scenario.years.length) return scenario.years.slice();
    if (scenario?.year) return [scenario.year];
    return [];
  }
  function scenarioRaces(run) {
    return scenarioYears(run).flatMap((year) => ns.EraAlmanac.racesOf(year));
  }
  function yearbook(run) {
    return scenarioRaces(run).filter((e) => run.ended || run.settled.includes(e.id)).map((e) => ({ edition: e, actual: run.worldResults[e.id] || null }));
  }
  ns.EraWorld = { day, time, raceFor, toRace, validate, availability, buildPayload, yearbook, scenarioYears, scenarioRaces };
})();
