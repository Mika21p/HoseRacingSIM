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
  const capture = async (name, selector) => {
    const element = page.locator(selector).first();
    await element.scrollIntoViewIfNeeded();
    await element.screenshot({ path: `artifacts/trainer-${name}.png` });
    const layout = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth,
      cards: document.querySelectorAll(".trainer-note").length }));
    assert(!layout.overflow, `${name}: horizontal overflow`);
    report[name] = layout;
  };
  try {
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.locator("#homeStartBtn").click();
    await page.locator("#horseNameInput").fill("晨光试跑");
    await page.locator("#generateBtn").click();
    await page.locator('[data-workspace-view="horse"]:visible, [data-workspace-section="horse"]:visible').first().click();
    const toggle = page.locator("#trainerCommentsToggleBtn");
    if (await toggle.getAttribute("aria-expanded") === "false") await toggle.click();
    assert(await page.locator("#trainerComments .trainer-note").count() === 6, "normal mode must render six comments");
    await capture("career-desktop", "#horsePanel");
    const textBefore = await page.locator("#trainerComments").textContent();
    await toggle.click();
    assert(!await page.locator("#trainerComments").isVisible(), "collapse notes");
    await toggle.click();
    assert(await page.locator("#trainerComments").textContent() === textBefore, "toggle must not reroll notes");
    await page.reload();
    await page.locator("#homeContinueBtn").click();
    await page.locator('[data-workspace-view="horse"]:visible, [data-workspace-section="horse"]:visible').first().click();
    if (await toggle.getAttribute("aria-expanded") === "false") await toggle.click();
    assert(await page.locator("#trainerComments").textContent() === textBefore, "reload must preserve notes");
    report.saveReload = true;
    await page.setViewportSize({ width: 390, height: 844 });
    await capture("career-mobile", "#horsePanel");

    // Use the production renderers with deterministic evidence in an isolated browser page.
    await page.evaluate(() => {
      const n = window.Keiba;
      const saved = JSON.parse(localStorage.getItem("keiba-career-save-v1"));
      const career = saved.state.career;
      career.lastRaceComment = { raceName: "赛场适性试跑杯", text: "这场还没到最后一段就开始持续提速，这样的展开不太合它，下次可以换个比赛路子。本场还有其他不利因素，不能把失利只归于这一项。" };
      career.adaptationHints.track.sustained = { status: "unfit", confidence: "certain" };
      document.querySelectorAll(".setup-overlay,.workspace-shell,.home-page,.app-meta-widget").forEach((el) => { el.hidden = true; });
      const host = document.createElement("main"); host.id = "trainerQa";
      host.style.cssText = "max-width:1100px;margin:24px auto;padding:16px;box-sizing:border-box";
      host.innerHTML = '<section class="panel" id="qaPost"></section><section class="panel" id="qaHints"></section><section class="panel" id="qaReview"></section><section class="panel" id="qaHistory"></section><section class="panel" id="qaResult"></section><section id="qaEra"></section>';
      document.body.append(host);
      n.UI.renderLastRaceComment(document.getElementById("qaPost"), career);
      n.UI.renderAdaptationHints(document.getElementById("qaHints"), career);
      document.getElementById("qaReview").innerHTML = '<div class="rogue-comment-group is-expanded"><p class="eyebrow">初次评估</p><div class="rogue-comment-list">' + n.UI.trainerCommentCards(career.commentDetails, "rogue") + '</div></div><div class="rogue-comment-group is-review is-expanded"><p class="eyebrow">权威复核</p><div class="rogue-comment-list">' + n.UI.trainerCommentCards(n.CommentRules.generateDebutCommentDetails(career.horse, career.trainerId, { accuracyById: { surface: "close", track: "close" } }), "rogue") + '</div></div>';
      const run = n.EraRules.createRun({ horseName: "剧情评估验收" });
      n.EraUI.render(document.getElementById("qaEra"), run, { showHub: false });
      const race = n.Races.find((item) => item.id === "tokyo-yushun");
      const result = n.RaceRules.simulateRace(career.horse, race, { currentTime: career.currentTime });
      n.CareerRules.addRace(career, result);
      n.UI.renderRaceResult(document.getElementById("qaResult"), career);
      n.UI.renderHistory(document.getElementById("qaHistory"), career, null, { expanded: true, expandedComments: { "race-1": true } });
    });
    await capture("feedback-mobile", "#qaHints");
    await capture("post-mobile", "#qaPost");
    await capture("review-mobile", "#qaReview");
    await capture("era-mobile", "#qaEra .era-trainer-comments");
    await capture("history-mobile", "#qaHistory");
    assert(await page.locator("#qaHistory .history-card-comment").isVisible(), "expanded historical comment missing");
    await capture("result-mobile", "#qaResult");
    await page.setViewportSize({ width: 1440, height: 1000 });
    await capture("feedback-desktop", "#qaHints");
    await capture("post-desktop", "#qaPost");
    await capture("review-desktop", "#qaReview");
    await capture("era-desktop", "#qaEra .era-trainer-comments");
    await capture("history-desktop", "#qaHistory");
    await capture("result-desktop", "#qaResult");
    assert(!await page.locator("#trainerQa").textContent().then((text) => /完全谬误|非常准确|基本准确|日本草地|欧洲草地/.test(text)), "hidden accuracy or legacy regions leaked");
    const rogue = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    rogue.on("pageerror", (error) => errors.push(String(error)));
    await rogue.goto(`http://127.0.0.1:${server.address().port}/`);
    await rogue.evaluate(() => {
      const r = window.Keiba.RoguelikeRules, save = r.createSave();
      save.profile.honorCoins = 1000;
      r.purchaseConsumable(save, "authoritative");
      save.run = r.createRun(save.profile);
      r.useReviewConsumable(save, save.run.candidates[0].id, "authoritative");
      localStorage.setItem("keiba-roguelike-save-v1", JSON.stringify(save));
    });
    await rogue.reload();
    await rogue.locator("#homeRogueContinueBtn").click();
    await rogue.locator(".rogue-comment-group").first().screenshot({ path: "artifacts/trainer-candidate-desktop.png" });
    await rogue.setViewportSize({ width: 390, height: 844 });
    const reviewToggle = rogue.locator("[data-rogue-comments]").first();
    await reviewToggle.click();
    assert(await reviewToggle.getAttribute("aria-expanded") === "true", "candidate expand");
    await rogue.locator(".rogue-comment-group").first().screenshot({ path: "artifacts/trainer-candidate-mobile.png" });
    report.candidateOverflow = await rogue.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert(!report.candidateOverflow, "candidate mobile overflow");
    await rogue.close();
    report.errors = errors;
    assert(!errors.length, errors.join("\n"));
    fs.writeFileSync("artifacts/trainer-browser.json", JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
