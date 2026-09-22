const { chromium } = require('playwright');
const fs = require('node:fs');
const http = require('node:http'), path = require('node:path');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHAIRMAN_TEST_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const root = path.resolve('dist'), server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname));
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const target = fs.existsSync(file) && fs.statSync(file).isDirectory() ? path.join(file, 'index.html') : file;
    fs.readFile(target, (error, data) => { if (error) { res.writeHead(404).end(); return; }
      res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml' })[path.extname(target)] || 'application/octet-stream'); res.end(data); });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }), errors = [], report = {};
  page.on('pageerror', e => errors.push(String(e)));
  try {
    await page.goto(process.env.CHAIRMAN_TEST_URL || `http://127.0.0.1:${server.address().port}/`); await page.waitForSelector('#chairmanLaunch');
    await page.evaluate(async () => {
      const n = window.Keiba, W = n.ChairmanRules, H = n.ChairmanHonors, w = W.createWorld({ blank: true, seed: 571, id: 'honors-browser' });
      W.seeded(w, () => { for (let i = 0; i < 6; i++) {
        const h = W.addHorse(w, { name: `评议测试马${i}`, age: 4, homeRegion: '日本', gender: i % 2 ? '牝马' : '牡马', status: 'retired' });
        h.lifetime = { starts: 6, wins: 2, g1: i < 2 ? 1 : 0, prize: 400 };
        Object.assign(h.annual, h.lifetime, { tf: i < 2 ? 130 : 110, runs: [{ raceClass: i < 2 ? 'g1' : 'op', rank: 1, surface: '草地', distance: 1600 }] });
        const p = H.profile(w, h.id); p.distance.英里 = p.annualDistance.英里 = 10; p.surface.草地 = p.annualSurface.草地 = 10;
      } });
      const s = await n.ChairmanStorage.open(); await s.acquire(w.id); await s.commitChanges(null, { world: w }); await s.close();
    });
    const {click,submit,filter}=require('./chairman-browser-controls').controls(page);
    await click('#chairmanLaunch'); await click('[data-action=openWorld][data-id=honors-browser]'); await click('[data-action=tab][data-id=hall]');
    await click('[data-action=honorView][data-id=council]'); await click('[data-action=honorEditType]');
    if (await page.locator('[name="motive.random"]').inputValue() !== '0' || await page.locator('[name="motive.g1"]').inputValue() !== '40') throw new Error('Central defaults are not achievement based');
    await page.locator('[name=name]').fill('玩家短途草地理事'); await page.locator('[name=count]').fill('12'); await page.locator('[name="affinity.短途"]').fill('80'); await page.locator('[name="affinity.草地"]').fill('60');
    await page.screenshot({ path: 'artifacts/honors-editor-desktop.png', fullPage: true });
    await click('.cm-dialog-footer button[type=submit]');
    await click('[data-action=honorView][data-id=candidates]'); await click('[data-action=honorGenerateHall]');
    await page.screenshot({ path: 'artifacts/honors-votes-desktop.png', fullPage: true });
    if (!(await page.locator('.cm-dialog').textContent()).includes('综合评分择优')) throw new Error('New hall mechanism label missing');
    await click('[data-action=honorVotes]');
    if (!(await page.locator('.cm-dialog').textContent()).includes('最终排序分')) throw new Error('Hall score explanation missing');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'artifacts/honors-v2-ballots-mobile.png', fullPage: false });
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Ballot details overflow on mobile');
    await page.setViewportSize({ width: 1440, height: 900 });
    await click('[data-action=honorRevote]'); await click('[data-action=honorConfirmRevote]');
    await click('dialog [data-action=honorInduct]'); await page.locator('[name=comment]').fill('主席核准记录'); await submit('[data-form=honorInduct]');
    await click('[data-action=honorView][data-id=history]');
    await filter('[data-form=honorHistoryFilter]');await page.locator('[name=historyKind]').selectOption('hallEvents'); await submit('[data-form=honorHistoryFilter]');
    if (!await page.locator('.cm-body').textContent().then(s => s.includes('主席核准记录'))) throw new Error('Induction audit history missing');
    await page.screenshot({ path: 'artifacts/honors-history-desktop.png', fullPage: true });
    await click('[data-action=tab][data-id=awards]'); await page.locator('[data-form=honorAwardScope] [name=scope]').selectOption('japan'); await submit('[data-form=honorAwardScope]');
    await click('[data-action=honorChooseLocal][data-id=representative]'); await click('[data-action=honorPickLocal]:not([data-id=""])');
    await page.locator('[name=comment]').fill('地方马会评语'); await click('[data-action=close]');
    report.saved = await page.evaluate(async () => { const s = await window.Keiba.ChairmanStorage.open(), w = await s.load('honors-browser'), snapshot = await s.exportWorld(w.id); s.validateSnapshot(snapshot); const r = { directors: w.councilTypes[0].members.length, inducted: w.honorProfiles.filter(p => p.induction).length, localComment: w.honors.drafts['japan:representative'].comment, votes: snapshot.records.councilVotes.length }; await s.close(); return r; });
    if (report.saved.directors !== 12 || report.saved.inducted !== 1 || report.saved.localComment !== '地方马会评语') throw new Error('Browser honor changes were not saved');
    await page.setViewportSize({ width: 390, height: 844 }); await page.screenshot({ path: 'artifacts/honors-local-mobile.png', fullPage: true });
    for (const view of ['candidates', 'history', 'council']) {
      await click('[data-action=tab][data-id=hall]'); await click(`[data-action=honorView][data-id=${view}]`);
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error(`Honor mobile overflow: ${view}`);
    }
    await click('[data-action=honorEditType]'); await page.screenshot({ path: 'artifacts/honors-editor-mobile.png', fullPage: true });
    report.mobile = await page.evaluate(() => { const r = document.querySelector('.cm-dialog-footer button[type=submit]').getBoundingClientRect(); return { overflow: document.documentElement.scrollWidth > innerWidth, saveBottom: r.bottom }; });
    if (report.mobile.overflow || report.mobile.saveBottom > 844) throw new Error('Mobile editor save is inaccessible');
    await click('[data-action=close]'); await page.reload(); await page.waitForSelector('#chairmanLaunch'); await click('#chairmanLaunch'); await click('[data-action=openWorld][data-id=honors-browser]');
    await click('[data-action=tab][data-id=hall]'); await click('[data-action=honorView][data-id=inducted]');
    if (!await page.locator('.cm-body').textContent().then(s => s.includes('评议测试马'))) throw new Error('Induction missing after refresh'); report.reload = true;
    await page.locator('.cm-world-bar details summary').click(); await click('.cm-floating-menu [data-action=exit]');
    const legacyId = await page.evaluate(async snapshot => { const s = await window.Keiba.ChairmanStorage.open(); const w = await s.importWorld(snapshot); await s.close(); return w.id; }, JSON.parse(fs.readFileSync('tests/fixtures/chairman-hall-v1.json', 'utf8')));
    await click('#chairmanLaunch'); await click(`[data-action=openWorld][data-id="${legacyId}"]`);
    await click('[data-action=tab][data-id=hall]'); await click('[data-action=honorView][data-id=history]'); await click('[data-action=honorRound]');
    if (!(await page.locator('.cm-dialog').textContent()).includes('历史抽选规则')) throw new Error('Legacy hall label missing');
    await click('[data-action=honorVotes]'); if (!(await page.locator('.cm-dialog').textContent()).includes('基础')) throw new Error('Legacy ballot details missing');
    report.legacy = true; await click('[data-action=close]');
    if (process.argv.includes('--large')) {
      await page.locator('.cm-world-bar details summary').click(); await click('.cm-floating-menu [data-action=exit]');
      report.large = await page.evaluate(async () => {
        const n = window.Keiba, W = n.ChairmanRules, H = n.ChairmanHonors; let w = W.createWorld({ seed: 7, blank: true, id: 'honors-large' });
        const begin = performance.now();
        W.seeded(w, () => { for (let i = 0; i < 10000; i++) { const h = W.addHorse(w, { age: 7, status: 'retired', name: `历史马${i}` }); h.lifetime = { starts: 8, wins: 3, g1: 1, prize: i }; } });
        w = H.edit(w, 'type', { name: '规模测试', scope: 'central', regionId: '', enabled: true, count: 1000, weight: 1,
          motives: { g1: 20, rating: 20, prize: 20, winRate: 10, honor: 0, local: 0, continuity: 10, random: 15, abstain: 5 }, affinities: Object.fromEntries(H.affinities.map(k => [k, 0])) }).world;
        const s = await n.ChairmanStorage.open(); await s.acquire(w.id); await s.commitChanges(null, { world: w });
        let chunks = 0; const started = performance.now();
        for (let y = 1; y <= 20; y++) {
          const out = W.mutate(w, (draft) => { draft.turn = (y - 1) * 24; draft.honors.latest = {}; draft.horses.forEach(h => { h.annual = W.emptyStats(y); }); });
          await H.consume(H.buildCouncilBallot(out.world, out, 'central', 'hall'), () => chunks++);
          await s.commitChanges(w, out); w = out.world;
        }
        const votingAndSaveMs = Math.round(performance.now() - started);
        const lastId = w.honors.latest['central:hall'].id, queryStart = performance.now(), history = await s.queryHonorHistory(w.id, 'councilVotes', { roundId: lastId, offset: 950 });
        const queryMs = performance.now() - queryStart, restoreStart = performance.now(), loaded = await s.load(w.id), loadMs = performance.now() - restoreStart;
        const roundsStarted = performance.now(), rounds = await s.queryHonorHistory(w.id, 'councilRounds'), roundsQueryMs = Math.round(performance.now() - roundsStarted);
        if (rounds.rows.length !== 20) throw new Error('Round history is incomplete');
        const out = W.mutate(w, () => {}), before = w.honors.rngState; let cancel = false;
        try { await H.consume(H.buildCouncilBallot(out.world, out, 'central', 'hall', true), () => { cancel = true; }, () => cancel); throw new Error('Cancellation failed'); } catch (e) { if (!String(e.message).includes('取消')) throw e; }
        if ((await s.load(w.id)).honors.rngState !== before) throw new Error('Cancelled vote changed saved RNG');
        const result = { horses: loaded.horses.length, directors: 1000, years: 20, voteRows: 20000, chunks, historyPage: history.rows.length, queryMs: Math.round(queryMs), roundsQueryMs, loadMs: Math.round(loadMs), votingAndSaveMs, totalMs: Math.round(performance.now() - begin), cancelledWithoutCommit: true };
        await s.close(); return result;
      });
    }
    report.errors = errors; if (errors.length) throw new Error(errors.join('\n'));
    fs.writeFileSync('artifacts/honors-browser.json', JSON.stringify(report, null, 2)); console.log(JSON.stringify(report));
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(e => { console.error(e); process.exitCode = 1; });
