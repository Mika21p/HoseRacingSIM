function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function duplicateIds(items) {
  const seen = new Set();
  const duplicates = new Set();
  items.forEach((item) => {
    if (!item || !hasText(item.id)) return;
    if (seen.has(item.id)) duplicates.add(item.id);
    seen.add(item.id);
  });
  return [...duplicates];
}

function validateProjectData({ races, horses, jockeys }) {
  const errors = [];
  const raceList = Array.isArray(races) ? races : [];
  const horseList = Array.isArray(horses) ? horses : [];
  const jockeyList = Array.isArray(jockeys) ? jockeys : [];

  duplicateIds(raceList).forEach((id) => errors.push(`DUPLICATE_RACE_ID ${id}`));
  duplicateIds(horseList).forEach((id) => errors.push(`DUPLICATE_HORSE_ID ${id}`));
  duplicateIds(jockeyList).forEach((id) => errors.push(`DUPLICATE_JOCKEY_ID ${id}`));

  const raceIds = new Set(raceList.map((race) => race && race.id).filter(hasText));
  const raceRegions = new Set(raceList.map((race) => race && race.surfaceRegion).filter(hasText));
  const jockeyIds = new Set(jockeyList.map((jockey) => jockey && jockey.id).filter(hasText));

  raceList.forEach((race, index) => {
    const label = hasText(race && race.id) ? race.id : `#${index + 1}`;
    if (!hasText(race && race.id)) errors.push(`INVALID_RACE_ID ${label}`);
    if (!hasText(race && race.nameOriginal)) errors.push(`INVALID_RACE_NAME_ORIGINAL ${label}`);
    if (!hasText(race && race.nameZh)) errors.push(`INVALID_RACE_NAME_ZH ${label}`);
    if (!hasText(race && race.raceClass)) errors.push(`INVALID_RACE_CLASS ${label}`);
    if (!hasText(race && race.surface)) errors.push(`INVALID_RACE_SURFACE ${label}`);
    if (!hasText(race && race.course)) errors.push(`INVALID_RACE_COURSE ${label}`);
    if (!Number.isInteger(race && race.month) || race.month < 1 || race.month > 12) {
      errors.push(`INVALID_RACE_MONTH ${label}`);
    }
    if (![1, 2].includes(race && race.half)) errors.push(`INVALID_RACE_HALF ${label}`);
    if (!Number.isFinite(race && race.distance) || race.distance <= 0) {
      errors.push(`INVALID_RACE_DISTANCE ${label}`);
    }
  });

  jockeyList.forEach((jockey, index) => {
    const label = hasText(jockey && jockey.id) ? jockey.id : `#${index + 1}`;
    if (!hasText(jockey && jockey.id)) errors.push(`INVALID_JOCKEY_ID ${label}`);
    if (!hasText(jockey && jockey.name)) errors.push(`INVALID_JOCKEY_NAME ${label}`);
    if (!Array.isArray(jockey && jockey.periods) || jockey.periods.length === 0) {
      errors.push(`INVALID_JOCKEY_PERIODS ${label}`);
    }
  });

  horseList.forEach((horse, index) => {
    const label = hasText(horse && horse.id) ? horse.id : `#${index + 1}`;
    if (!hasText(horse && horse.id)) errors.push(`INVALID_HORSE_ID ${label}`);
    if (!hasText(horse && horse.name)) errors.push(`INVALID_HORSE_NAME ${label}`);
    if (!Number.isFinite(horse && horse.profile && horse.profile.baseAbility)) {
      errors.push(`INVALID_HORSE_BASE_ABILITY ${label}`);
    }
    if (!Number.isFinite(horse && horse.profile && horse.profile.peakAbility)) {
      errors.push(`INVALID_HORSE_PEAK_ABILITY ${label}`);
    }
    if (!Array.isArray(horse && horse.races)) {
      errors.push(`INVALID_HORSE_RACES ${label}`);
      return;
    }

    horse.races.forEach((entry, entryIndex) => {
      const entryLabel = `${label}#${entryIndex + 1}`;
      if (!hasText(entry && entry.raceId) || !raceIds.has(entry.raceId)) {
        errors.push(`UNKNOWN_RACE ${entryLabel} ${entry && entry.raceId}`);
      }
      if (!Number.isInteger(entry && entry.year) || entry.year < 1800 || entry.year > 2100) {
        errors.push(`INVALID_HORSE_RACE_YEAR ${entryLabel}`);
      }
      if (!Number.isFinite(entry && entry.ability)) {
        errors.push(`INVALID_HORSE_RACE_ABILITY ${entryLabel}`);
      }
      if (entry && entry.jockeyId && !jockeyIds.has(entry.jockeyId)) {
        errors.push(`UNKNOWN_JOCKEY ${entryLabel} ${entry.jockeyId}`);
      }
      if (entry && entry.finish != null && (!Number.isInteger(entry.finish) || entry.finish < 1)) {
        errors.push(`INVALID_HORSE_RACE_FINISH ${entryLabel}`);
      }
    });

    if (horse.legendEligibilityWins != null && !Array.isArray(horse.legendEligibilityWins)) {
      errors.push(`INVALID_LEGEND_ELIGIBILITY_WINS ${label}`);
      return;
    }
    const seenLegendWins = new Set();
    (horse.legendEligibilityWins || []).forEach((win, winIndex) => {
      const winLabel = `${label}#legend-${winIndex + 1}`;
      if (!hasText(win && win.raceName)) errors.push(`INVALID_LEGEND_WIN_NAME ${winLabel}`);
      if (!Number.isInteger(win && win.year) || win.year < 1800 || win.year > 2100) {
        errors.push(`INVALID_LEGEND_WIN_YEAR ${winLabel}`);
      }
      if (!hasText(win && win.surfaceRegion) || !raceRegions.has(win.surfaceRegion)) {
        errors.push(`INVALID_LEGEND_WIN_REGION ${winLabel} ${win && win.surfaceRegion}`);
      }
      if (!win || !["草地", "泥地"].includes(win.surface)) {
        errors.push(`INVALID_LEGEND_WIN_SURFACE ${winLabel} ${win && win.surface}`);
      }
      if (!Number.isFinite(win && win.distance) || win.distance <= 0) {
        errors.push(`INVALID_LEGEND_WIN_DISTANCE ${winLabel}`);
      }
      if (!hasText(win && win.jockeyId) || !jockeyIds.has(win.jockeyId)) {
        errors.push(`UNKNOWN_LEGEND_WIN_JOCKEY ${winLabel} ${win && win.jockeyId}`);
      }
      const key = [win && win.raceName, win && win.year, win && win.surfaceRegion, win && win.surface, win && win.distance].join(":");
      if (seenLegendWins.has(key)) errors.push(`DUPLICATE_LEGEND_WIN ${winLabel}`);
      seenLegendWins.add(key);
    });
  });

  return errors;
}

module.exports = { validateProjectData };
