(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const CONDITION_RACE_CLASSES = ["new", "maiden", "one-win", "two-win", "three-win"];

  function normalizeMode(mode) {
    return mode === "original" ? "original" : "zh";
  }

  function isConditionRace(race) {
    return !!race && CONDITION_RACE_CLASSES.includes(race.raceClass);
  }

  function findRaceById(raceId) {
    if (!raceId || !Array.isArray(ns.Races)) return null;
    return ns.Races.find((race) => race && race.id === raceId) || null;
  }

  function normalizeRaceNames(race) {
    if (!race) return;
    const nameZh = race.nameZh || race.name || race.nameOriginal || "";
    const nameOriginal = race.nameOriginal || nameZh;
    race.nameZh = nameZh;
    race.nameOriginal = nameOriginal;
    race.name = nameZh;
  }

  function applyRaceNameOverrides(races) {
    if (!Array.isArray(races)) return;
    races.forEach(normalizeRaceNames);
  }

  function buildRaceNames(races) {
    const result = {};
    if (!Array.isArray(races)) return result;
    races.forEach((race) => {
      if (!race || !race.id || isConditionRace(race)) return;
      normalizeRaceNames(race);
      result[race.id] = {
        nameOriginal: race.nameOriginal,
        nameZh: race.nameZh
      };
    });
    return result;
  }

  function displayName(race, mode, fallback) {
    const source = race && race.id ? findRaceById(race.id) || race : race;
    const fallbackName = fallback || (source && (source.nameZh || source.name || source.nameOriginal)) || "";
    if (!source) return fallbackName;
    if (isConditionRace(source)) return source.nameZh || source.name || fallbackName;
    if (normalizeMode(mode) === "original") {
      return source.nameOriginal || source.nameZh || source.name || fallbackName;
    }
    return source.nameZh || source.name || source.nameOriginal || fallbackName;
  }

  applyRaceNameOverrides(ns.Races);

  ns.RaceNames = buildRaceNames(ns.Races);
  ns.RaceNameRules = {
    CONDITION_RACE_CLASSES,
    normalizeMode,
    isConditionRace,
    findRaceById,
    applyRaceNameOverrides,
    displayName
  };
})();
