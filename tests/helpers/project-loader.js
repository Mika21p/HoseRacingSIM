const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..", "..");

function walkFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const file = path.join(directory, entry.name);
      return entry.isDirectory() ? walkFiles(file) : [file];
    })
    .sort((left, right) => left.localeCompare(right));
}

function listJavaScriptFiles(relativeDirectory) {
  const directory = path.join(projectRoot, relativeDirectory);
  return walkFiles(directory).filter((file) => file.endsWith(".js"));
}

function createBrowserContext() {
  return vm.createContext({
    window: { Keiba: {} },
    console
  });
}

function runProjectFile(context, file) {
  const absoluteFile = path.isAbsolute(file) ? file : path.join(projectRoot, file);
  const relativeFile = path.relative(projectRoot, absoluteFile).replaceAll("\\", "/");
  vm.runInContext(fs.readFileSync(absoluteFile, "utf8"), context, {
    filename: relativeFile
  });
}

function loadProjectData() {
  const context = createBrowserContext();
  runProjectFile(context, "js/data/jockeys.js");
  runProjectFile(context, "js/data/races/registry.js");
  runProjectFile(context, "js/data/races/core.js");
  runProjectFile(context, "js/data/jra-course-catalogue.js");

  const raceFiles = listJavaScriptFiles("js/data/races")
    .filter((file) => !["registry.js", "core.js"].includes(path.basename(file)));
  raceFiles.forEach((file) => runProjectFile(context, file));
  runProjectFile(context, "js/data/race-course-profiles.js");

  runProjectFile(context, "js/data/historical-horses/registry.js");
  const horseRegistrations = [];
  const registry = context.window.Keiba.HistoricalHorseRegistry;
  const registerHorse = registry.register.bind(registry);
  registry.register = (horse) => {
    horseRegistrations.push(horse);
    registerHorse(horse);
  };

  const horseFiles = listJavaScriptFiles("js/data/historical-horses")
    .filter((file) => !["registry.js", "index.js"].includes(path.basename(file)));
  horseFiles.forEach((file) => runProjectFile(context, file));

  return {
    context,
    races: context.window.Keiba.RaceRegistry.all(),
    horses: horseRegistrations,
    jockeys: context.window.Keiba.Jockeys,
    raceFiles,
    horseFiles
  };
}

function loadCoreRules() {
  const project = loadProjectData();
  const { context } = project;
  context.window.Keiba.HistoricalHorses = project.horses;

  runProjectFile(context, "js/utils/random.js");
  runProjectFile(context, "js/data/races.js");
  runProjectFile(context, "js/rules/jockey-rules.js");
  runProjectFile(context, "js/rules/historical-opponents.js");
  runProjectFile(context, "js/rules/race-simulator.js");
  runProjectFile(context, "js/rules/career.js");

  return {
    ...project,
    rules: context.window.Keiba
  };
}

function loadTrackAptitudeLabRules() {
  const project = loadCoreRules();
  [
    "js/rules/time.js",
    "js/rules/maturity.js",
    "js/rules/temperament.js",
    "js/rules/track-aptitude.js",
    "js/rules/horse-generator.js",
    "js/data/course-profiles.js",
    "js/track-aptitude-lab.js"
  ].forEach((file) => runProjectFile(project.context, file));
  return project;
}

function loadRoguelikeRules() {
  const project = loadProjectData();
  const { context } = project;
  context.window.Keiba.HistoricalHorses = project.horses;
  [
    "js/utils/random.js",
    "js/data/bloodlines.js",
    "js/data/races.js",
    "js/rules/time.js",
    "js/rules/region-rules.js",
    "js/rules/track-aptitude.js",
    "js/rules/horse-generator.js",
    "js/rules/comments.js",
    "js/rules/career.js",
    "js/rules/achievements.js",
    "js/rules/roguelike.js"
  ].forEach((file) => runProjectFile(context, file));
  return { ...project, rules: context.window.Keiba };
}

function loadEraRules() {
  const project = loadProjectData();
  const { context } = project;
  context.window.Keiba.HistoricalHorses = project.horses;
  [
    "js/utils/random.js",
    "js/data/bloodlines.js",
    "js/data/races.js",
    "js/data/era/registry.js",
    "js/data/era/texts.js",
    "js/data/era/golden-road-1998.js",
    "js/rules/time.js",
    "js/rules/region-rules.js",
    "js/rules/race-progression.js",
    "js/rules/debut-lock.js",
    "js/rules/maturity.js",
    "js/rules/temperament.js",
    "js/rules/jockey-rules.js",
    "js/rules/injury-rules.js",
    "js/rules/race-fatigue.js",
    "js/rules/track-aptitude.js",
    "js/rules/horse-generator.js",
    "js/rules/comments.js",
    "js/rules/historical-opponents.js",
    "js/rules/race-simulator.js",
    "js/rules/career.js",
    "js/rules/era-narrative.js",
    "js/rules/era.js"
  ].forEach((file) => runProjectFile(context, file));
  return { ...project, rules: context.window.Keiba };
}

function loadChangelogData() {
  const context = createBrowserContext();
  runProjectFile(context, "js/data/changelog.js");
  return context.window.Keiba.Changelog;
}

function loadChairmanRules() {
  const project = loadEraRules();
  ["js/data/chairman-pedigrees.js", "js/rules/chairman-ratings.js", "js/rules/chairman-scheduling.js", "js/rules/chairman.js", "js/rules/chairman-breeding.js", "js/rules/chairman-office.js", "js/rules/chairman-honors.js", "js/chairman-csv.js", "js/rules/chairman-series.js", "js/chairman-packages.js", "js/rules/chairman-editor.js", "js/data/chairman-venue-records.js", "js/data/chairman-venues.js", "js/rules/chairman-world.js", "js/chairman-world-packages.js"].forEach((file) => runProjectFile(project.context, file));
  return project;
}

module.exports = {
  projectRoot,
  listJavaScriptFiles,
  loadProjectData,
  loadCoreRules,
  loadTrackAptitudeLabRules,
  loadRoguelikeRules,
  loadEraRules,
  loadChairmanRules,
  loadChangelogData
};
