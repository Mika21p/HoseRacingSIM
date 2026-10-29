(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const racesByYear = new Map();
  const racesById = new Map();
  const horsesById = new Map();
  const entriesByYear = new Map();
  const entriesById = new Map();
  const TIERS = new Set(["top5", "winner"]);
  const HORSE_NAME_STATUSES = new Set(["global", "final", "default-approved"]);
  const ENTRY_CATEGORIES = new Set(["horse", "scene", "year"]);

  function registerRaces(year, races) {
    if (!Number.isInteger(year)) throw new Error("Era almanac races require a year.");
    const list = racesByYear.get(year) || [];
    (races || []).forEach((race) => {
      if (!race || !race.id) throw new Error("Era almanac race requires a stable id.");
      if (racesById.has(race.id)) throw new Error(`Duplicate era almanac race id: ${race.id}`);
      racesById.set(race.id, race);
      list.push(race);
    });
    list.sort((left, right) => left.date.localeCompare(right.date) || left.raceNo - right.raceNo);
    racesByYear.set(year, list);
  }

  function registerHorses(horses) {
    (horses || []).forEach((horse) => {
      if (!horse || !horse.id) throw new Error("Era almanac horse requires a stable id.");
      const existing = horsesById.get(horse.id);
      // 同一匹马会出现在多个年份文件中；后出现的条目只补充空字段。
      if (existing) {
        Object.keys(horse).forEach((key) => {
          if (existing[key] == null || existing[key] === "") existing[key] = horse[key];
        });
      } else {
        horsesById.set(horse.id, { ...horse });
      }
    });
  }

  function racesOf(year) {
    return (racesByYear.get(year) || []).slice();
  }

  // 百科条目：名马、名场面与年度回顾，文字由 Claude 撰写、用户审核。
  function registerEntries(year, entries) {
    if (!Number.isInteger(year)) throw new Error("Era almanac entries require a year.");
    const list = entriesByYear.get(year) || [];
    (entries || []).forEach((item) => {
      if (!item || !item.id) throw new Error("Era almanac entry requires a stable id.");
      if (entriesById.has(item.id)) throw new Error(`Duplicate era almanac entry id: ${item.id}`);
      entriesById.set(item.id, { year, ...item });
      list.push(item);
    });
    entriesByYear.set(year, list);
  }

  function entriesOf(year) {
    return (entriesByYear.get(year) || []).slice();
  }

  function entry(id) {
    return entriesById.get(id) || null;
  }

  function race(raceId) {
    return racesById.get(raceId) || null;
  }

  // 缺字段沿用旧年份口径；显式未知不得回退成结果表行数。
  function historicalHeadcount(edition) {
    if (!edition) return { count: null, source: "missing" };
    if (!Object.prototype.hasOwnProperty.call(edition, "starterCount")) return { count: edition.headcount, source: "legacy" };
    const count = edition.starterCount;
    return { count: Number.isInteger(count) && count > 0 && count <= edition.headcount ? count : null, source: "starters" };
  }

  function horse(horseId) {
    return horsesById.get(horseId) || null;
  }

  function horseName(horseId) {
    const entry = horse(horseId);
    return entry ? entry.nameZh || entry.name : horseId;
  }

  function horseRecord(horseId) {
    return [...racesById.values()]
      .flatMap((item) => item.results
        .filter((result) => result.horseId === horseId)
        .map((result) => ({ raceId: item.id, date: item.date, nameOriginal: item.nameOriginal, grade: item.grade, finish: result.finish })))
      .sort((left, right) => left.date.localeCompare(right.date));
  }

  function validate() {
    const warnings = [];
    racesById.forEach((item) => {
      if (!TIERS.has(item.tier)) warnings.push({ type: "invalid-tier", raceId: item.id });
      if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date || "")) warnings.push({ type: "invalid-date", raceId: item.id });
      if (!item.source) warnings.push({ type: "missing-source", raceId: item.id });
      const results = item.results || [];
      if (!results.length || results[0].finish !== 1) warnings.push({ type: "missing-winner", raceId: item.id });
      if (!["G1", "G2", "G3", "重"].includes(item.grade)) warnings.push({ type: "invalid-grade", raceId: item.id });
      if (Object.prototype.hasOwnProperty.call(item, "starterCount") && item.starterCount !== null
        && (!Number.isInteger(item.starterCount) || item.starterCount <= 0 || item.starterCount > item.headcount
          || item.starterCount < new Set(results.map((result) => result.horseId)).size)) warnings.push({ type: "invalid-starter-count", raceId: item.id });
      const covered = results.filter((result) => Number.isInteger(result.finish) && result.finish <= 5);
      if (item.tier === "top5") {
        // Competition ranking: ties repeat a place and consume subsequent places (1,2,3,3,5).
        covered.forEach((result, index) => {
          const sameRank = index > 0 && result.finish === covered[index - 1].finish;
          if (result.finish !== (sameRank ? covered[index - 1].finish : index + 1)) warnings.push({ type: "invalid-finish-sequence", raceId: item.id });
          const tied = covered.some((other) => other !== result && other.finish === result.finish);
          if (!!result.deadHeat !== tied || ((result.margin === "同着") !== sameRank)) warnings.push({ type: "invalid-dead-heat", raceId: item.id });
        });
        if (covered.length < Math.min(5, item.headcount || 5)) warnings.push({ type: "incomplete-top5", raceId: item.id });
      }
      const horseIds = new Set();
      results.forEach((result) => {
        if (horseIds.has(result.horseId)) warnings.push({ type: "duplicate-result-horse", raceId: item.id });
        horseIds.add(result.horseId);
        if (!horsesById.has(result.horseId)) warnings.push({ type: "unknown-horse", raceId: item.id, horseId: result.horseId });
      });
      if (item.globalRaceId && ns.Races && !ns.Races.some((global) => global.id === item.globalRaceId)) {
        warnings.push({ type: "unknown-global-race", raceId: item.id, globalRaceId: item.globalRaceId });
      }
    });
    horsesById.forEach((entry) => {
      if (!entry.nameZh) warnings.push({ type: "missing-horse-chinese-name", horseId: entry.id });
      if (!HORSE_NAME_STATUSES.has(entry.nameZhStatus)) warnings.push({ type: "invalid-horse-name-status", horseId: entry.id, status: entry.nameZhStatus || "" });
      if (entry.historicalHorseId && ns.HistoricalHorses && !ns.HistoricalHorses.some((global) => global.id === entry.historicalHorseId)) {
        warnings.push({ type: "unknown-global-horse", horseId: entry.id, historicalHorseId: entry.historicalHorseId });
      }
    });
    entriesById.forEach((item) => {
      if (!ENTRY_CATEGORIES.has(item.category)) warnings.push({ type: "invalid-entry-category", entryId: item.id, category: item.category || "" });
      if (!item.title || !item.body) warnings.push({ type: "incomplete-entry", entryId: item.id });
      if (item.horseId && !horsesById.has(item.horseId)) warnings.push({ type: "unknown-entry-horse", entryId: item.id, horseId: item.horseId });
      if (item.raceId && !racesById.has(item.raceId)) warnings.push({ type: "unknown-entry-race", entryId: item.id, raceId: item.raceId });
    });
    return warnings;
  }

  ns.EraAlmanac = {
    registerRaces,
    registerHorses,
    registerEntries,
    racesOf,
    race,
    horse,
    horseName,
    historicalHeadcount,
    horseRecord,
    entriesOf,
    entry,
    years: () => [...racesByYear.keys()].sort(),
    validate
  };
})();
