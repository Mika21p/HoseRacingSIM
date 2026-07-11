const fs = require("fs");
const path = require("path");
const vm = require("vm");

const projectRoot = path.resolve(__dirname, "..");
const horseRoot = path.join(projectRoot, "js", "data", "historical-horses");
const raceRoot = path.join(projectRoot, "js", "data", "races");
const requestedRegion = process.argv[2] || "";

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

function runFile(file, context) {
  vm.runInNewContext(fs.readFileSync(file, "utf8"), context, { filename: file });
}

function loadHorses() {
  const horses = [];
  const files = walk(horseRoot).filter((file) => {
    return file.endsWith(".js") && !["index.js", "registry.js"].includes(path.basename(file));
  });

  for (const file of files) {
    const context = {
      window: {
        Keiba: {
          HistoricalHorseRegistry: {
            register(horse) {
              horses.push({
                ...horse,
                file: path.relative(projectRoot, file).replaceAll("\\", "/"),
                region: path.relative(horseRoot, file).split(path.sep)[0]
              });
            }
          }
        }
      }
    };
    runFile(file, context);
  }

  return requestedRegion
    ? horses.filter((horse) => horse.region.toLowerCase() === requestedRegion.toLowerCase())
    : horses;
}

function loadRaces() {
  const context = { window: { Keiba: {} } };
  runFile(path.join(raceRoot, "registry.js"), context);
  runFile(path.join(raceRoot, "core.js"), context);

  const files = walk(raceRoot).filter((file) => {
    return file.endsWith(".js") && !["registry.js", "core.js"].includes(path.basename(file));
  });
  for (const file of files) runFile(file, context);

  return context.window.Keiba.RaceRegistry.all();
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&amp;/gi, "and")
    .replace(/\b(the|sponsored|presented|by)\b/gi, " ")
    .replace(/[^a-z0-9]+/gi, "")
    .toLowerCase();
}

const raceAliases = {
  "asahi-hai-fs": ["Asahi Hai Futurity Stakes"],
  "breeders-cup-filly-mare-turf": ["Breeders' Cup Filly & Mare Turf"],
  "breeders-cup-filly-mare-sprint": ["Breeders' Cup Filly & Mare Sprint"],
  "copa-republica-argentina": ["Copa Republica Argentina"],
  "deutsches-derby": ["German Derby"],
  "epsom-derby": ["Epsom Derby", "The Derby"],
  "hopeful-stakes-us": ["Hopeful Stakes"],
  "champions-cup": ["Japan Cup Dirt", "Champions Cup"],
  "daily-hai-nisai-stakes": ["Daily Hai Nisai Stakes", "Daily Hai Sansai Stakes"],
  "dubai-turf": ["Dubai Turf", "Dubai Duty Free"],
  "hanshin-juvenile-fillies": ["Hanshin Juvenile Fillies", "Hanshin Sansai Himba Stakes"],
  "kikka-sho": ["Kikuka Sho", "Japanese St Leger"],
  "mile-championship-nambu-hai": ["Mile Championship Nambu Hai", "Nambu Hai"],
  "oka-sho": ["Oka Sho", "Japanese 1000 Guineas"],
  "prix-de-larc": ["Prix de l'Arc de Triomphe"],
  "satsuki-sho": ["Satsuki Sho", "Japanese 2000 Guineas"],
  "tenno-sho-aki": ["Tenno Sho (Autumn)", "Tenno Sho Autumn"],
  "tenno-sho-haru": ["Tenno Sho (Spring)", "Tenno Sho Spring"],
  "tokyo-yushun": ["Tokyo Yushun", "Japanese Derby"],
  "tokinominoru-kinen": ["Kyodo Tsushin Hai", "Tokinominoru Kinen"],
  "two-thousand-guineas": ["2000 Guineas", "2,000 Guineas"],
  "yushun-himba": ["Yushun Himba", "Japanese Oaks"]
};

function aliasesForRace(race) {
  const fromId = race.id
    .replace(/-us$/, "")
    .replace(/-fs$/, "-futurity-stakes")
    .replaceAll("-", " ");
  return [race.id, fromId, race.nameOriginal, race.nameZh, ...(raceAliases[race.id] || [])]
    .map(normalize)
    .filter(Boolean);
}

function stripWikitext(value) {
  return value
    .replace(/<!--[^]*?-->/g, "")
    .replace(/<ref\b[^>]*\/>/gi, "")
    .replace(/<ref\b[^>]*>[^]*?<\/ref>/gi, "")
    .replace(/\[\[[^\]|]+\|([^\]]+)]]/g, "$1")
    .replace(/\[\[([^\]]+)]]/g, "$1")
    .replace(/{{(?:nowrap|small)\|([^{}]+)}}/gi, "$1")
    .replace(/'''?/g, "")
    .replace(/&ndash;|&mdash;/gi, "-")
    .replace(/&amp;/gi, "&");
}

function parseMajorWins(wikitext) {
  const field = wikitext.match(/^\s*\|\s*race\s*=\s*([^]*?)(?=^\s*\|\s*[a-zA-Z_][\w ]*\s*=|^\s*}})/im);
  if (!field) return [];

  return stripWikitext(field[1])
    .split(/<br\s*\/?>|\n\s*\*|\n/gi)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .flatMap((entry) => {
      const yearGroupIndex = entry.search(/\((?:[^()]|\([^)]*\))*?(?:18|19|20)\d{2}/);
      if (yearGroupIndex < 0) return [];
      const years = [...entry.slice(yearGroupIndex).matchAll(/(?:18|19|20)\d{2}/g)]
        .map((match) => Number(match[0]));
      if (!years.length) return [];
      const name = entry.slice(0, yearGroupIndex).trim();
      return years.map((year) => ({ name, normalizedName: normalize(name), year }));
    });
}

async function fetchWikiPages(titles) {
  const pages = new Map();
  for (let index = 0; index < titles.length; index += 50) {
    const batch = titles.slice(index, index + 50);
    const params = new URLSearchParams({
      action: "query",
      prop: "revisions",
      rvprop: "content",
      rvslots: "main",
      redirects: "1",
      format: "json",
      formatversion: "2",
      titles: batch.join("|")
    });
    let response;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
        headers: { "user-agent": "KeibaHistoricalAudit/1.0" }
      });
      if (response.status !== 429) break;
      await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
    }
    if (!response.ok) throw new Error(`Wikipedia request failed: ${response.status}`);
    const result = await response.json();
    for (const page of result.query.pages) {
      pages.set(page.title.toLowerCase(), page);
    }
    for (const redirect of result.query.redirects || []) {
      const target = pages.get(redirect.to.toLowerCase());
      if (target) pages.set(redirect.from.toLowerCase(), target);
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  return pages;
}

async function searchWikiRacehorsePage(title) {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `\"${title}\" racehorse`,
    gsrlimit: "5",
    prop: "revisions",
    rvprop: "content",
    rvslots: "main",
    format: "json",
    formatversion: "2"
  });
  const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
    headers: { "user-agent": "KeibaHistoricalAudit/1.0 (historical race result verification)" }
  });
  if (response.status === 429) return null;
  if (!response.ok) throw new Error(`Wikipedia search failed: ${response.status}`);
  const result = await response.json();
  const expectedTitle = normalize(title);
  return (result.query?.pages || []).find((page) => {
    const content = page.revisions?.[0]?.slots?.main?.content || "";
    const actualTitle = normalize(page.title).replace(/(?:japanese)?(?:thoroughbred)?racehorse|horse/g, "");
    return actualTitle === expectedTitle
      && /{{\s*Infobox racehorse\b/i.test(content)
      && parseMajorWins(content).length;
  }) || null;
}

function bestRaceMatch(externalWin, racesWithAliases) {
  const exact = racesWithAliases.find(({ aliases }) => aliases.includes(externalWin.normalizedName));
  if (exact) return exact.race;

  const candidates = racesWithAliases.filter(({ aliases }) => aliases.some((alias) => {
    const shorter = alias.length < externalWin.normalizedName.length ? alias : externalWin.normalizedName;
    const longer = alias.length < externalWin.normalizedName.length ? externalWin.normalizedName : alias;
    return shorter.length >= 8 && longer.includes(shorter);
  }));
  return candidates.length === 1 ? candidates[0].race : null;
}

async function main() {
  const horses = loadHorses();
  const races = loadRaces();
  const racesById = new Map(races.map((race) => [race.id, race]));
  const racesWithAliases = races.map((race) => ({ race, aliases: aliasesForRace(race) }));
  const titles = horses.map((horse) => horse.displayNameEn || horse.name);
  const pageCandidates = titles.flatMap((title) => [
    title,
    `${title} (horse)`,
    `${title} (racehorse)`
  ]);
  const pages = await fetchWikiPages(pageCandidates);
  const summary = { horses: horses.length, checked: 0, missingPage: 0, noMajorWins: 0, projectOnly: 0, externalOnly: 0 };

  for (const horse of horses) {
    const title = horse.displayNameEn || horse.name;
    let page = [title, `${title} (horse)`, `${title} (racehorse)`]
      .map((candidate) => pages.get(candidate.toLowerCase()))
      .find((candidate) => {
        const content = candidate?.revisions?.[0]?.slots?.main?.content || "";
        return /{{\s*Infobox racehorse\b/i.test(content) && parseMajorWins(content).length;
      }) || pages.get(title.toLowerCase());
    let wikitext = page?.revisions?.[0]?.slots?.main?.content || "";
    let externalWins = parseMajorWins(wikitext);
    if (!externalWins.length) {
      const searchedPage = await searchWikiRacehorsePage(title);
      if (searchedPage) {
        page = searchedPage;
        wikitext = page.revisions?.[0]?.slots?.main?.content || "";
        externalWins = parseMajorWins(wikitext);
      }
    }

    if (!page || page.missing) {
      summary.missingPage += 1;
      console.log(["MISSING_PAGE", horse.region, horse.id, title, horse.file].join("\t"));
      continue;
    }

    if (!externalWins.length) {
      summary.noMajorWins += 1;
      console.log(["NO_MAJOR_WINS", horse.region, horse.id, title, page.title, horse.file].join("\t"));
      continue;
    }

    summary.checked += 1;
    const projectRacesWithAliases = (horse.races || [])
      .map((win) => racesById.get(win.raceId))
      .filter(Boolean)
      .map((race) => ({ race, aliases: aliasesForRace(race) }));
    const externalKeys = new Set();
    for (const win of externalWins) {
      const race = bestRaceMatch(win, projectRacesWithAliases) || bestRaceMatch(win, racesWithAliases);
      if (race) externalKeys.add(`${race.id}|${win.year}`);
    }

    const projectKeys = new Set((horse.races || []).map((win) => `${win.raceId}|${win.year}`));
    for (const win of horse.races || []) {
      const race = racesById.get(win.raceId);
      if (!externalKeys.has(`${win.raceId}|${win.year}`)) {
        summary.projectOnly += 1;
        console.log(["PROJECT_ONLY", horse.region, horse.id, title, win.year, win.raceId, race?.nameOriginal || "UNKNOWN_RACE", horse.file].join("\t"));
      }
    }

    for (const win of externalWins) {
      const race = bestRaceMatch(win, projectRacesWithAliases) || bestRaceMatch(win, racesWithAliases);
      if (race && !projectKeys.has(`${race.id}|${win.year}`)) {
        summary.externalOnly += 1;
        console.log(["EXTERNAL_ONLY", horse.region, horse.id, title, win.year, race.id, win.name, horse.file].join("\t"));
      }
    }
  }

  console.error(JSON.stringify(summary));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
