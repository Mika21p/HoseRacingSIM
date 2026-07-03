(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const R = ns.Random;
  const PLAYER_EXCELLENT_MIN_ABILITY = 70;

  function getJockey(jockeyId) {
    return (ns.Jockeys || []).find((jockey) => jockey.id === jockeyId) || null;
  }

  function getPeriod(jockeyId, year) {
    const jockey = getJockey(jockeyId);
    if (!jockey || !year) return null;
    return jockey.periods.find((period) => year >= period.from && year <= period.to) || null;
  }

  function getAbility(jockeyId, year) {
    const period = getPeriod(jockeyId, year);
    return period ? period.ability : null;
  }

  function getDefaultAbility(jockeyId) {
    const jockey = getJockey(jockeyId);
    if (!jockey) return null;
    if (jockey.defaultAbility != null) return jockey.defaultAbility;
    if (!jockey.periods || jockey.periods.length === 0) return null;
    return Math.max(...jockey.periods.map((period) => period.ability));
  }

  function isAvailable(jockeyId, year) {
    return getAbility(jockeyId, year) !== null;
  }

  function hasAffiliation(jockey, affiliation) {
    if (!affiliation) return true;
    return !!jockey && Array.isArray(jockey.affiliations) && jockey.affiliations.includes(affiliation);
  }

  function getPlayerSelectableJockeys(affiliation, options) {
    const filters = options || {};
    return (ns.Jockeys || [])
      .filter((jockey) => jockey.mainSelectable !== false)
      .filter((jockey) => hasAffiliation(jockey, affiliation || "japan"))
      .map((jockey) => ({
        id: jockey.id,
        name: jockey.name,
        ability: getDefaultAbility(jockey.id),
        affiliations: jockey.affiliations || []
      }))
      .filter((jockey) => jockey.ability !== null)
      .filter((jockey) => filters.minAbility == null || jockey.ability >= filters.minAbility);
  }

  function getDefaultJockeys(affiliation) {
    return (ns.Jockeys || [])
      .filter((jockey) => hasAffiliation(jockey, affiliation))
      .map((jockey) => ({
        id: jockey.id,
        name: jockey.name,
        ability: getDefaultAbility(jockey.id),
        affiliations: jockey.affiliations || []
      }))
      .filter((jockey) => jockey.ability !== null);
  }

  function pickDefaultJockey(affiliation) {
    const available = getDefaultJockeys(affiliation);
    if (available.length === 0) return null;
    return R.pickOne(available);
  }

  function getAvailableJockeys(year) {
    return (ns.Jockeys || [])
      .map((jockey) => ({
        id: jockey.id,
        name: jockey.name,
        ability: getAbility(jockey.id, year)
      }))
      .filter((jockey) => jockey.ability !== null)
      .sort((a, b) => b.ability - a.ability || a.name.localeCompare(b.name, "zh-CN"));
  }

  function pickAvailableJockey(year) {
    const available = getAvailableJockeys(year);
    if (available.length === 0) return null;
    return R.pickOne(available);
  }

  function describe(jockeyId, year) {
    return describeHistoricalJockey(jockeyId, year);
  }

  function describeHistoricalJockey(jockeyId, year) {
    const jockey = getJockey(jockeyId);
    const ability = getAbility(jockeyId, year);
    return {
      id: jockeyId,
      name: jockey ? jockey.name : "未知骑手",
      year,
      ability,
      affiliations: jockey ? jockey.affiliations || [] : [],
      available: ability !== null
    };
  }

  function describePlayerJockey(jockeyId) {
    const jockey = getJockey(jockeyId) || getJockey("generic-local");
    const resolvedId = jockey ? jockey.id : jockeyId;
    const ability = getDefaultAbility(resolvedId);
    return {
      id: resolvedId,
      name: jockey ? jockey.name : "未知骑手",
      ability,
      affiliations: jockey ? jockey.affiliations || [] : [],
      available: ability !== null
    };
  }

  ns.JockeyRules = {
    PLAYER_EXCELLENT_MIN_ABILITY,
    getJockey,
    getDefaultAbility,
    getAbility,
    isAvailable,
    hasAffiliation,
    getPlayerSelectableJockeys,
    getDefaultJockeys,
    pickDefaultJockey,
    getAvailableJockeys,
    pickAvailableJockey,
    describePlayerJockey,
    describeHistoricalJockey,
    describe
  };
})();
