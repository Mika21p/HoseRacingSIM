const { chromium } = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');

(async () => {
  fs.mkdirSync('artifacts', { recursive: true });
  const root = path.resolve('.');
  const server = http.createServer((request, response) => {
    const filename = path.resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://local').pathname));
    if (filename !== root && !filename.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    const file = filename === root ? path.join(root, 'index.html') : filename;
    fs.readFile(file, (error, data) => {
      if (error) { response.writeHead(404).end(); return; }
      response.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml' })[path.extname(file)] || 'application/octet-stream');
      response.end(data);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage(), errors = [], report = {};
  page.on('pageerror', error => errors.push(String(error)));
  page.on('dialog', dialog => dialog.accept());
  try {
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.locator('#homeHallBtn').click();
    await page.locator('#hallDialog').waitFor({ state: 'visible' });
    assert((await page.locator('#hallDialogBody').innerText()).includes('殿堂还没有赛马'));
    await page.screenshot({ path: 'artifacts/hall-empty-desktop.png' });
    await page.locator('[data-hall-close]').click();

    await page.evaluate(() => {
      const ns = window.Keiba, [sireId, damId] = ns.CareerBloodline.randomPair();
      const trainer = ns.CommentRules.getTrainer('sato-yuta');
      const horse = ns.CareerBloodline.generate({ name: '殿堂实走测试马', sireId, damId, gameMode: 'normal' });
      horse.id = 'hall-browser-entry'; horse.gender = '牡马';
      const career = ns.CareerRules.createCareer(horse, [], [], null, trainer);
      career.retired = true;
      career.races = ['jpn1', 'g1', 'g1'].map((raceClass, index) => ({
        public: { rank: 1, rankLabel: '一着', timeLabel: `三岁春 ${index + 1}月`, trackCondition: '良', playerJockeyName: '测试骑手', opponents: [] },
        hidden: { race: { id: `test-g1-${index}`, name: ['皋月赏', '日本德比', '菊花赏'][index], raceClass, surface: 'grass', distance: 2000 }, scoreLine: '79 / 76' }
      }));
      ns.CareerRules.retire(career);
      const payload = { version: 3, savedAt: new Date().toISOString(), state: { career, retiredSummary: null } };
      localStorage.setItem('keiba-career-save-v1', JSON.stringify(payload));
    });
    await page.reload();
    await page.locator('#homeContinueBtn').click();
    await page.locator('[data-hall-collect]').waitFor({ state: 'visible' });
    assert((await page.locator('.hall-retirement-action').innerText()).includes('殿堂 0／10'));
    await page.locator('[data-hall-collect]').click();
    await page.waitForFunction(() => document.getElementById('homeHallCount')?.textContent === '1／10');
    assert.equal(await page.locator('#homeHallCount').textContent(), '1／10');
    report.retirementCollect = true;

    await page.reload();
    await page.locator('#homeHallBtn').click();
    await page.locator('.hall-card').waitFor();
    assert((await page.locator('#hallDialogBody').innerText()).includes('殿堂实走测试马'));
    await page.screenshot({ path: 'artifacts/hall-management-desktop.png' });
    await page.locator('.hall-card-open').first().click();
    await page.locator('[data-hall-tab="history"]').click();
    assert.equal(await page.locator('#hallHistory .history-table-wrap tbody tr').count(), 3);
    await page.screenshot({ path: 'artifacts/hall-history-desktop.png' });
    await page.locator('[data-hall-tab="bloodline"]').click();
    assert((await page.locator('.hall-detail-content').innerText()).includes('父'));
    report.historyAndPedigree = true;
    await page.locator('[data-hall-back]').click();

    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: 'artifacts/hall-management-mobile.png' });
    report.mobileNoHorizontalOverflow = true;
    await page.locator('[data-hall-close]').click();

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator('#homeRogueBtn').click();
    await page.locator('.rogue-store-shell').waitFor({ state: 'visible' });
    const optIn = page.locator('#rogueHallOptIn');
    assert.equal(await optIn.isChecked(), false);
    await optIn.check();
    await page.locator('[data-rogue-start]').click();
    await page.locator('.rogue-candidate-card').first().waitFor({ state: 'visible' });
    const rogue = await page.evaluate(() => JSON.parse(localStorage.getItem('keiba-roguelike-save-v1')));
    assert.equal(rogue.run.includeHall, true);
    report.roguelikeOptInLocked = true;
    await page.screenshot({ path: 'artifacts/hall-rogue-candidates-desktop.png' });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: 'artifacts/hall-rogue-candidates-mobile.png' });
    await page.reload();
    const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('keiba-roguelike-save-v1')));
    assert.equal(restored.run.includeHall, true);
    report.restoreKeepsRogueSetting = true;
    assert.deepEqual(errors, []);
    report.errors = errors; report.passed = true;
    fs.writeFileSync('artifacts/hall-of-fame-browser.json', JSON.stringify(report, null, 2));
    console.log('Hall of Fame browser PASS');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
