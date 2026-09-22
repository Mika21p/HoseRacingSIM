const { chromium } = require("playwright");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

(async () => {
  const root = path.resolve("dist");
  const server = http.createServer((req, res) => {
    const relative = decodeURIComponent(new URL(req.url, "http://local").pathname);
    const target = path.resolve(root, `.${relative === "/" ? "/index.html" : relative}`);
    if (!target.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(target, (error, data) => {
      if (error) return res.writeHead(404).end();
      res.setHeader("Content-Type", ({ ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml" })[path.extname(target)] || "application/octet-stream");
      res.end(data);
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe" });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [], report = {};
  page.on("pageerror", (error) => errors.push(String(error)));
  const assert = (value, message) => { if (!value) throw Error(message); };
  try {
    await page.goto('http://127.0.0.1:' + server.address().port + '/');
    page.on('dialog', async dialog => { report.dialogs = [...(report.dialogs || []), dialog.message()]; await dialog.accept(); });
    await page.locator('#homeStartBtn').click();
    await page.locator('#horseNameInput').fill('单轮验收马');
    await page.locator('#generateBtn').click();
    const readSave = () => page.evaluate(() => JSON.parse(localStorage.getItem('keiba-career-save-v1')));
    let save = await readSave();
    assert(save.state.career.commentDetails.length === 6, 'six debut assessments');
    assert(Object.keys(save.state.career.horse.surfaceGrades).length === 2, 'surface traits');
    assert(Object.keys(save.state.career.horse.trackAptitudes).length === 3, 'track traits');
    report.generated = {name:save.state.career.horse.name, comments:6};
    const originalComments = JSON.stringify(save.state.career.commentDetails);
    await page.locator('#registerRaceBtn').click();
    save = await readSave();
    assert(save.state.career.scheduledRace, 'race registration');
    report.registered = save.state.career.scheduledRace.race.name;
    let turns = 0;
    while (!(await readSave()).state.career.races.length && turns < 120) {
      await page.locator('#nextTurnBtn').click(); turns += 1;
    }
    save = await readSave();
    assert(save.state.career.races.length === 1, 'exactly one completed race');
    const record = save.state.career.races[0], calc = record.hidden.playerCalc;
    assert(calc.ruleVersion === 'track-aptitude-v1' && calc.courseProfileId, 'formal aptitude calculation');
    assert(record.hidden.postRaceComment && record.public.postRaceCommentText === record.hidden.postRaceComment.text, 'stored post-race feedback');
    assert(JSON.stringify(save.state.career.commentDetails) === originalComments, 'debut assessments unchanged');
    report.race = {turns, name:record.public.raceName, rank:record.public.rank, courseProfileId:calc.courseProfileId,
      type:calc.trackAptitude.trackType, intensity:calc.trackAptitude.intensity, comment:record.public.postRaceCommentText};
    await page.locator('#raceResultTitle').waitFor({state:'visible'});
    await page.screenshot({path:'artifacts/phase6-single-race.png'});
    const frozen = JSON.stringify({races:save.state.career.races,hints:save.state.career.adaptationHints,comments:save.state.career.commentDetails});
    await page.reload(); await page.locator('#homeContinueBtn').click();
    save = await readSave();
    assert(JSON.stringify({races:save.state.career.races,hints:save.state.career.adaptationHints,comments:save.state.career.commentDetails}) === frozen,'save reload preserves race, judgments and hints');
    report.reload = true;
    if (await page.locator('#raceResultReturnBtn').isVisible()) await page.locator('#raceResultReturnBtn').click();
    await page.locator('[data-workspace-view="action"][data-workspace-section="race"]:visible').first().click();
    await page.locator('#retireBtn').click();
    save = await readSave();
    assert(save.state.career.retired && save.state.retiredSummary,'retirement summary persisted');
    assert(await page.locator('.reveal').isVisible(),'retirement reveals traits');
    await page.setViewportSize({width:390,height:844});
    assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'mobile horizontal overflow');
    await page.locator('.reveal').waitFor({state:'visible'});
    await page.screenshot({path:'artifacts/phase6-single-retirement.png',fullPage:true});
    report.retired = {starts:save.state.retiredSummary.starts, mobileOverflow:false};
    await page.reload(); await page.locator('#homeContinueBtn').click();
    assert((await readSave()).state.career.retired,'retirement reload');
    report.errors=errors;assert(!errors.length,errors.join('\n'));
    fs.writeFileSync('artifacts/phase6-single-flow.json',JSON.stringify(report,null,2));
    console.log(JSON.stringify(report));
  } finally { await browser.close(); await new Promise(resolve=>server.close(resolve)); }
})().catch(error=>{console.error(error);process.exitCode=1;});
