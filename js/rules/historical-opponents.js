(function () {
  const ns = (window.Keiba = window.Keiba || {});
  let cachedIndex = null;

  function normalizeEntry(horse, entry) {
    return {
      id: `${horse.id}-${entry.raceId}-${entry.year}`,
      horseId: horse.id,
      name: horse.name,
      displayName: horse.displayName || horse.name,
      displayNameZh: horse.displayNameZh || horse.displayName || horse.name,
      displayNameEn: horse.displayNameEn || horse.name || horse.displayName,
      year: entry.year,
      ability: entry.ability,
      jockeyId: entry.jockeyId,
      trackCondition: entry.trackCondition || "",
      finish: entry.finish || null,
      historical: true,
      source: "historical-horses",
      profile: horse.profile || {}
    };
  }

  function buildRaceIndex() {
    const index = {};
    (ns.HistoricalHorses || []).forEach((horse) => {
      (horse.races || []).forEach((entry) => {
        if (!entry.raceId) return;
        if (!index[entry.raceId]) index[entry.raceId] = [];
        index[entry.raceId].push(normalizeEntry(horse, entry));
      });
    });
    return index;
  }

  function validate() {
    const raceIds = new Set((ns.Races || []).map((race) => race.id));
    const jockeyIds = new Set((ns.Jockeys || []).map((jockey) => jockey.id));
    const seenEntries = new Set();
    const warnings = [];

    (ns.HistoricalHorses || []).forEach((horse) => {
      if (!horse.id) warnings.push({ type: "missing-horse-id", horse });
      if (!horse.name) warnings.push({ type: "missing-horse-name", horseId: horse.id || "" });
      (horse.races || []).forEach((entry) => {
        const key = `${horse.id || ""}:${entry.raceId || ""}:${entry.year || ""}`;
        if (seenEntries.has(key)) {
          warnings.push({ type: "duplicate-entry", horseId: horse.id || "", raceId: entry.raceId || "", year: entry.year || "" });
        }
        seenEntries.add(key);
        if (!entry.raceId || !raceIds.has(entry.raceId)) {
          warnings.push({ type: "unknown-race", horseId: horse.id || "", raceId: entry.raceId || "" });
        }
        if (!entry.jockeyId || !jockeyIds.has(entry.jockeyId)) {
          warnings.push({ type: "unknown-jockey", horseId: horse.id || "", jockeyId: entry.jockeyId || "" });
        }
        if (!Number.isFinite(entry.year)) {
          warnings.push({ type: "invalid-year", horseId: horse.id || "", raceId: entry.raceId || "", year: entry.year });
        }
        if (!Number.isFinite(entry.ability)) {
          warnings.push({ type: "invalid-ability", horseId: horse.id || "", raceId: entry.raceId || "", ability: entry.ability });
        }
      });
      const seenLegendWins = new Set();
      const legendWins = Array.isArray(horse.legendEligibilityWins) ? horse.legendEligibilityWins : [];
      if (horse.legendEligibilityWins != null && !Array.isArray(horse.legendEligibilityWins)) {
        warnings.push({ type: "invalid-legend-wins", horseId: horse.id || "" });
      }
      legendWins.forEach((win) => {
        const key = `${win.raceName || ""}:${win.year || ""}:${win.surfaceRegion || ""}:${win.surface || ""}:${win.distance || ""}`;
        if (seenLegendWins.has(key)) {
          warnings.push({ type: "duplicate-legend-win", horseId: horse.id || "", raceName: win.raceName || "", year: win.year || "" });
        }
        seenLegendWins.add(key);
        if (!win.raceName || !Number.isFinite(win.year) || !win.surfaceRegion || !["草地", "泥地"].includes(win.surface) || !Number.isFinite(win.distance)) {
          warnings.push({ type: "invalid-legend-win", horseId: horse.id || "", win });
        }
        if (!win.jockeyId || !jockeyIds.has(win.jockeyId)) {
          warnings.push({ type: "unknown-legend-win-jockey", horseId: horse.id || "", jockeyId: win.jockeyId || "" });
        }
      });
    });

    if (warnings.length > 0) {
      console.warn("Historical horse data warnings:", warnings);
    }
    return warnings;
  }

  function reset() {
    cachedIndex = null;
  }

  function getByRaceId(raceId) {
    if (!cachedIndex) cachedIndex = buildRaceIndex();
    return cachedIndex[raceId] ? cachedIndex[raceId].slice() : [];
  }

  ns.HistoricalOpponentRules = {
    buildRaceIndex,
    getByRaceId,
    validate,
    reset
  };
})();
