"use strict";

// 只读开发分析：固定赛场适性初案，比较组合在不同赛历中的表现。
// 不读取或写入玩家存档，也不修改比赛库或规则表。
const { loadEraRules } = require("../tests/helpers/project-loader");

const SAMPLES_PER_BUCKET = 600;
const SURFACE_SAMPLES = 5000;
const TRACK_KEYS = ["burst", "sustained", "attrition"];
const TRACK_LABELS = { burst: "瞬发", sustained: "持久", attrition: "消耗" };
const TYPE_LABELS = { burst: "瞬发", sustained: "持久", attrition: "消耗" };
const INTENSITIES = [1, 2];
const COMBINATION_TEMPLATES = [
  { id: "oo-triangle", label: "○○△", grades: ["○", "○", "△"] },
  { id: "good-triangle-triangle", label: "◎△△", grades: ["◎", "△", "△"] },
  { id: "good-circle-triangle", label: "◎○△", grades: ["◎", "○", "△"] },
  { id: "ooo", label: "○○○", grades: ["○", "○", "○"] },
  { id: "good-circle-circle", label: "◎○○", grades: ["◎", "○", "○"] },
  { id: "good-good-triangle", label: "◎◎△", grades: ["◎", "◎", "△"] },
  { id: "good-good-circle", label: "◎◎○", grades: ["◎", "◎", "○"] }
];

function uniquePermutations(values) {
  const result = [];
  const visit = (prefix, remaining) => {
    if (!remaining.length) {
      result.push(prefix);
      return;
    }
    [...new Set(remaining)].forEach((value) => {
      const index = remaining.indexOf(value);
      visit(prefix.concat(value), remaining.slice(0, index).concat(remaining.slice(index + 1)));
    });
  };
  visit([], values);
  return result;
}

function variantsFor(template) {
  return uniquePermutations(template.grades).map((grades) => ({
    id: `${template.id}:${grades.join("")}`,
    label: TRACK_KEYS.map((key, index) => `${TRACK_LABELS[key]}${grades[index]}`).join("／"),
    templateId: template.id,
    templateLabel: template.label,
    trackAptitudes: Object.fromEntries(TRACK_KEYS.map((key, index) => [key, grades[index]]))
  }));
}

function profileKey(profile) {
  return `${profile.type}-${profile.intensity}`;
}

function emptyBucketCounts() {
  return Object.fromEntries(TRACK_KEYS.flatMap((type) => INTENSITIES.map((intensity) => [`${type}-${intensity}`, 0])));
}

function countSchedule(profiles) {
  return profiles.reduce((counts, profile) => {
    counts[profileKey(profile)] += 1;
    return counts;
  }, emptyBucketCounts());
}

function createRace(profile) {
  return {
    id: `balance-${profile.type}-${profile.intensity}`,
    name: `${TYPE_LABELS[profile.type]}${profile.intensity === 1 ? "Ⅰ" : "Ⅱ"}分析赛`,
    surface: "草地",
    distance: 2000,
    raceClass: "open",
    courseProfile: profile
  };
}

function createHorse(id, trackAptitudes, surfaceGrades = { grass: "A", dirt: "A" }, strength = 80) {
  return {
    id,
    name: id,
    strength,
    surfaceGrades,
    trackAptitudes,
    distMin: 1000,
    coreDist: 2000,
    distMax: 4200,
    peakStart: "二岁春",
    peakEnd: "八岁冬",
    heavyType: "普通",
    temperamentLabel: "沉稳"
  };
}

function runner(horse) {
  return {
    horse,
    maturity: { status: "成熟期", adjustedStrength: horse.strength },
    temperamentMod: { label: "沉稳", min: 0, max: 0, mod: 0 },
    jockey: { id: `${horse.id}-jockey`, name: "分析骑手", ability: 70 }
  };
}

function syntheticProfile(type, intensity) {
  return {
    id: `balance-${type}-${intensity}`,
    trackId: "balance-track",
    courseConfigId: `balance:${type}:${intensity}`,
    surface: "草地",
    distance: 2000,
    type,
    intensity
  };
}

function weightedMean(rows, weights, valueOf) {
  let total = 0;
  let weight = 0;
  rows.forEach((row) => {
    const rowWeight = weights[row.bucket] || 0;
    total += rowWeight * valueOf(row);
    weight += rowWeight;
  });
  return weight ? total / weight : 0;
}

function simulateDuel(ns, variant) {
  const candidate = createHorse("candidate", variant.trackAptitudes);
  const baseline = createHorse("baseline", { burst: "○", sustained: "○", attrition: "○" });
  const byBucket = [];

  TRACK_KEYS.forEach((type, typeIndex) => {
    INTENSITIES.forEach((intensity, intensityIndex) => {
      const profile = syntheticProfile(type, intensity);
      const race = createRace(profile);
      let wins = 0;
      let completed = 0;
      let rankSum = 0;
      let retirements = 0;
      for (let sample = 0; sample < SAMPLES_PER_BUCKET; sample += 1) {
        const seed = 10_000_000 + typeIndex * 1_000_000 + intensityIndex * 100_000 + sample;
        const result = ns.Random.withSource(ns.Random.seeded(seed), () => ns.RaceRules.simulateWorldRace(
          [runner(candidate), runner(baseline)],
          race,
          { trackCondition: "良", includeAbilityCalculations: true }
        ));
        const row = result.results.find((item) => item.horseId === candidate.id);
        if (row.retired) {
          retirements += 1;
          continue;
        }
        completed += 1;
        rankSum += row.rank;
        if (row.rank === 1) wins += 1;
      }
      const bucket = profileKey(profile);
      const modifier = ns.TrackAptitudeRules.calculateModifiers(candidate, profile).trackAptitudeMod;
      byBucket.push({
        bucket,
        modifier,
        wins,
        completed,
        retirements,
        winRate: completed ? wins / completed : 0,
        averageRank: completed ? rankSum / completed : null
      });
    });
  });

  return {
    ...variant,
    byBucket
  };
}

function applyScheduleWeights(row, scheduleWeights) {
  return {
    ...row,
    weighted: {
      winRate: weightedMean(row.byBucket, scheduleWeights, (bucket) => bucket.winRate),
      averageRank: weightedMean(row.byBucket, scheduleWeights, (bucket) => bucket.averageRank),
      modifier: weightedMean(row.byBucket, scheduleWeights, (bucket) => bucket.modifier)
    }
  };
}

function bestEntry(row) {
  const modifier = Math.max(...row.byBucket.map((bucket) => bucket.modifier));
  const buckets = row.byBucket.filter((bucket) => bucket.modifier === modifier);
  return {
    modifier,
    buckets: buckets.map((bucket) => bucket.bucket),
    winRate: buckets.reduce((sum, bucket) => sum + bucket.winRate, 0) / buckets.length,
    averageRank: buckets.reduce((sum, bucket) => sum + bucket.averageRank, 0) / buckets.length
  };
}

function favorableEntry(row) {
  const baselineModifier = (bucket) => bucket.endsWith("-2") ? -1 : 0;
  const buckets = row.byBucket.filter((bucket) => bucket.modifier > baselineModifier(bucket.bucket));
  if (!buckets.length) return { buckets: [], winRate: null, averageRank: null };
  return {
    buckets: buckets.map((bucket) => bucket.bucket),
    winRate: buckets.reduce((sum, bucket) => sum + bucket.winRate, 0) / buckets.length,
    averageRank: buckets.reduce((sum, bucket) => sum + bucket.averageRank, 0) / buckets.length
  };
}

function surfaceDuel(ns, grade) {
  const profile = syntheticProfile("burst", 1);
  const race = createRace(profile);
  const candidate = createHorse("surface-candidate", { burst: "○", sustained: "○", attrition: "○" }, { grass: grade, dirt: "A" });
  const baseline = createHorse("surface-baseline", { burst: "○", sustained: "○", attrition: "○" });
  let wins = 0;
  let completed = 0;
  for (let sample = 0; sample < SURFACE_SAMPLES; sample += 1) {
    const result = ns.Random.withSource(ns.Random.seeded(20_000_000 + sample), () => ns.RaceRules.simulateWorldRace(
      [runner(candidate), runner(baseline)], race, { trackCondition: "良" }
    ));
    const row = result.results.find((item) => item.horseId === candidate.id);
    if (row.retired) continue;
    completed += 1;
    if (row.rank === 1) wins += 1;
  }
  return { grade, samples: SURFACE_SAMPLES, wins, completed, winRate: completed ? wins / completed : 0 };
}

function summarizeTemplates(variantRows) {
  return COMBINATION_TEMPLATES.map((template) => {
    const rows = variantRows.filter((row) => row.templateId === template.id);
    const values = rows.map((row) => row.weighted);
    const average = (field) => values.reduce((sum, value) => sum + value[field], 0) / values.length;
    return {
      label: template.label,
      variants: rows.length,
      meanWinRate: average("winRate"),
      winRateRange: [Math.min(...values.map((value) => value.winRate)), Math.max(...values.map((value) => value.winRate))],
      meanAverageRank: average("averageRank"),
      meanModifier: average("modifier"),
      modifierRange: [Math.min(...values.map((value) => value.modifier)), Math.max(...values.map((value) => value.modifier))]
    };
  });
}

function directSurfaceRanges(ns) {
  const fixedMaturity = { status: "成熟期", adjustedStrength: 0 };
  const profile = syntheticProfile("burst", 2);
  const strengthLevels = [62, 70, 80, 90];
  return strengthLevels.map((strength) => {
    const surfaces = ns.TrackAptitudeRules.SURFACE_GRADES.map((grade) => {
      const values = ns.TrackAptitudeRules.TRACK_APTITUDE_GRADES.map((trackGrade) => {
        const horse = createHorse("surface", { burst: trackGrade, sustained: "○", attrition: "○" }, { grass: grade, dirt: "A" }, strength);
        const withFloor = ns.HorseRules.calcRaceAbility(horse, createRace(profile), {
          maturity: { ...fixedMaturity, adjustedStrength: strength },
          temperamentMod: { label: "沉稳", min: 0, max: 0, mod: 0 },
          trackCondition: "良"
        });
        const withoutFloor = ns.HorseRules.calcRaceAbility(horse, createRace(profile), {
          maturity: { ...fixedMaturity, adjustedStrength: strength },
          temperamentMod: { label: "沉稳", min: 0, max: 0, mod: 0 },
          trackCondition: "良",
          noAbilityFloor: true
        });
        return { floor: withFloor.ability, raw: withoutFloor.rawAbility };
      });
      return {
        grade,
        rawRange: [Math.min(...values.map((value) => value.raw)), Math.max(...values.map((value) => value.raw))],
        normalRange: [Math.min(...values.map((value) => value.floor)), Math.max(...values.map((value) => value.floor))]
      };
    });
    return { strength, surfaces };
  });
}

function main() {
  const project = loadEraRules();
  const ns = project.rules;
  const profiles = project.races.map((race) => ns.RaceCourseProfiles.resolveForRace(race));
  const allWeights = countSchedule(profiles);
  const confirmedProfiles = profiles.filter((profile) => profile.confidence === "confirmed");
  const confirmedWeights = countSchedule(confirmedProfiles);
  const balancedWeights = Object.fromEntries(Object.keys(allWeights).map((key) => [key, 1]));
  const variants = COMBINATION_TEMPLATES.flatMap(variantsFor);

  const schedules = {
    balanced: balancedWeights,
    fullLibrary: allWeights,
    confirmedOnly: confirmedWeights
  };
  const simulatedVariants = variants.map((variant) => simulateDuel(ns, variant));
  const simulation = Object.fromEntries(Object.entries(schedules).map(([name, weights]) => {
    const rows = simulatedVariants.map((row) => applyScheduleWeights(row, weights));
    return [name, {
      weights,
      variants: rows,
      templates: summarizeTemplates(rows)
    }];
  }));

  const baseline = simulation.fullLibrary.variants.find((row) => row.templateId === "ooo");
  const output = {
    version: "track-aptitude-balance-analysis-v1",
    samplesPerBucket: SAMPLES_PER_BUCKET,
    surfaceSamples: SURFACE_SAMPLES,
    ruleTables: {
      surface: ns.TrackAptitudeRules.SURFACE_MODIFIERS,
      track: ns.TrackAptitudeRules.TRACK_MODIFIERS
    },
    raceCounts: {
      total: profiles.length,
      confirmed: confirmedProfiles.length,
      lowConfidence: profiles.length - confirmedProfiles.length,
      fullLibrary: allWeights,
      confirmedOnly: confirmedWeights
    },
    neutralCalibration: baseline ? baseline.weighted : null,
    simulation,
    bestEntryByVariant: simulatedVariants.map((row) => ({
      template: row.templateLabel,
      arrangement: row.label,
      bestEntry: bestEntry(row),
      favorableEntry: favorableEntry(row)
    })),
    surfaceDuelsAgainstA: ns.TrackAptitudeRules.SURFACE_GRADES.map((grade) => surfaceDuel(ns, grade)),
    surfaceFloorRanges: directSurfaceRanges(ns),
    interpretation: {
      typeGap: { intensity1: 4, intensity2: 8 },
      surfaceGapFromA: Object.fromEntries(
        ns.TrackAptitudeRules.SURFACE_GRADES
          .filter((grade) => grade !== "A")
          .map((grade) => [grade, ns.TrackAptitudeRules.SURFACE_MODIFIERS.A - ns.TrackAptitudeRules.SURFACE_MODIFIERS[grade]])
      ),
      note: "所有双马模拟固定草地A、能力80、距离完全适配、良马场、成熟期、气性0、骑手70，只测赛场类型适性。"
    }
  };
  if (process.argv.includes("--summary")) {
    const compact = {
      version: output.version,
      samplesPerBucket: output.samplesPerBucket,
      surfaceSamples: output.surfaceSamples,
      ruleTables: output.ruleTables,
      raceCounts: output.raceCounts,
      neutralCalibration: output.neutralCalibration,
      templates: Object.fromEntries(Object.entries(output.simulation).map(([name, report]) => [name, report.templates])),
      fullLibraryVariants: output.simulation.fullLibrary.variants.map((row) => ({
        template: row.templateLabel,
        arrangement: row.label,
        weighted: row.weighted
      })),
      bestEntryByVariant: output.bestEntryByVariant,
      surfaceDuelsAgainstA: output.surfaceDuelsAgainstA,
      surfaceFloorRanges: output.surfaceFloorRanges,
      interpretation: output.interpretation
    };
    process.stdout.write(`${JSON.stringify(compact, null, 2)}\n`);
    return;
  }
  if (process.argv.includes("--focus")) {
    const focused = {
      version: output.version,
      samplesPerBucket: output.samplesPerBucket,
      surfaceSamples: output.surfaceSamples,
      raceCounts: output.raceCounts,
      neutralCalibration: output.neutralCalibration,
      fullLibraryTemplates: output.simulation.fullLibrary.templates,
      balancedTemplates: output.simulation.balanced.templates,
      confirmedOnlyTemplates: output.simulation.confirmedOnly.templates,
      commonVariants: output.bestEntryByVariant.filter((row) => ["○○△", "◎△△", "○○○"].includes(row.template)),
      surfaceDuelsAgainstA: output.surfaceDuelsAgainstA,
      surfaceFloorRanges: output.surfaceFloorRanges,
      interpretation: output.interpretation
    };
    process.stdout.write(`${JSON.stringify(focused, null, 2)}\n`);
    return;
  }
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

main();
