const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("career UI keeps history inside the action workspace and exposes overlays", () => {
  const render = read("js/ui/render.js");
  ["action", "horse", "bloodline", "challenge", "more"].forEach((view) => {
    assert.match(render, new RegExp(`data-workspace-view="${view}"`));
    assert.match(render, new RegExp(`data-workspace-panel="${view}"`));
  });
  const actionMain = render.match(/<div class="action-main-column">([\s\S]*?)<\/div>\s*<aside/);
  assert.ok(actionMain);
  assert.doesNotMatch(actionMain[1], /rogueChallengePanel/);
  assert.match(render, /data-workspace-section="history"/);
  assert.match(render, /class="action-main-column"[\s\S]*id="racePanel"[\s\S]*id="historyPanel"[\s\S]*id="actionAside"/);
  assert.match(render, /id="adaptationSummaryPanel"[\s\S]*id="rogueChallengeHint"/);
  assert.match(render, /id="horsePanel"[\s\S]*id="rogueVeterinarianPanel"[\s\S]*id="feedbackPanel"/);
  assert.match(render, /id="rogueChallengePanel" data-workspace-panel="challenge"/);
  assert.match(render, /id="historyPanel" data-action-anchor="history"/);
  assert.doesNotMatch(render, /data-workspace-panel="history"/);
  assert.match(render, /id="setupOverlay"/);
  assert.match(render, /id="homeScreen"/);
  assert.match(render, /data-return-home/);
  assert.match(render, /workspace-return-button/);
  assert.match(render, /返回模式选择/);
  assert.match(render, /aria-label="返回模式选择页（离开当前游戏模式）"/);
  assert.doesNotMatch(render, /data-return-home[\s\S]{0,160}>[\s\S]{0,160}首页/);
  assert.match(render, /id="raceResultDialog"/);
  assert.match(render, /id="helpPanel"/);
});

test("workspace state remains UI-only and opens the result after a race", () => {
  const app = read("js/app.js");
  assert.match(app, /activeView: "action"/);
  assert.match(app, /activeActionSection: "race"/);
  assert.match(app, /activeScreen: "home"/);
  assert.match(app, /setupReturnScreen: "home"/);
  assert.match(app, /resultOpen: false/);
  assert.match(app, /state\.resultOpen = true/);
  assert.match(app, /normalizeLegendOpponentYears\(career\)/);
  assert.match(app, /renderLastRaceComment/);
  assert.match(app, /closeRaceResult\(\{ section: "history" \}\)/);
  assert.match(app, /SAVE_VERSION = 3/);
});

test("race details default open while comments use a name-leading toggle", () => {
  const render = read("js/ui/render.js");
  assert.match(render, /const isRecordExpanded = !collapsedRecords\[recordKey\]/);
  assert.match(render, /const isCommentExpanded = !!\(commentText && expandedComments\[recordKey\]\)/);
  assert.doesNotMatch(render, /data-history-detail-toggle/);
  assert.doesNotMatch(render, />详<\/button>/);
  assert.match(render, /history-race-name-line">\$\{commentToggle\}<span>\$\{raceName\}<\/span>/);
  assert.match(render, /history-card-title-line">\$\{commentToggle\}<h3>\$\{raceName\}<\/h3>/);
});

test("home, global metadata and mobile navigation are wired", () => {
  const index = read("index.html");
  const render = read("js/ui/render.js");
  const changelog = read("js/data/changelog.js");
  const homeModes = read("js/data/home-modes.js");
  const styles = read("css/styles.css");
  assert.match(index, /styles\.css\?v=20260922-mode-selector-nav/);
  assert.match(index, /render\.js\?v=20260925-hall-v1/);
  assert.match(index, /app\.js\?v=20260925-hall-v1/);
  assert.match(index, /home-modes\.js\?v=20260923-home-copy/);
  assert.match(index, /golden-road-1998\.js\?v=20260720-era-v5/);
  assert.match(index, /race-simulator\.js\?v=20260920-ratings/);
  assert.match(index, /era-narrative\.js\?v=20260720-era-v5/);
  assert.match(index, /era\.js\?v=20260922-trainer-prose/);
  assert.match(index, /id="appVersion"/);
  assert.match(changelog, /version: "v0\.16b"/);
  assert.match(changelog, /version: "v0\.15c"/);
  assert.match(changelog, /nonConditionRaces: 622/);
  assert.match(render, /class="home-mode-grid"/);
  assert.match(render, /class="home-support-row"/);
  assert.doesNotMatch(render, /class="home-route-card"/);
  assert.match(render, /id="homeContinueBtn"/);
  assert.match(render, /id="homeStartBtn"/);
  assert.match(render, /id="homeLegendBtn"/);
  assert.match(render, /id="homeLegendContinueBtn"/);
  assert.match(render, /"homeLegendSaveStatus"/);
  assert.match(render, /id="homeRogueBtn"/);
  assert.match(render, /id="homeRogueContinueBtn"/);
  assert.match(render, /"homeRogueStatus"/);
  assert.match(render, /赛马育成模拟/);
  assert.match(homeModes, /每场比赛迎战五匹名马/);
  assert.match(homeModes, /从随机候选里寻找黑马/);
  assert.doesNotMatch(render, /home-save-notice/);
  assert.doesNotMatch(render, />LEGEND<\/em>/);
  assert.match(render, /id="rogueOverlay"/);
  assert.match(render, /id="rogueChallengePanel"/);
  assert.match(render, /id="copyFeedbackGroupBtn"/);
  assert.match(render, />1050162087<\/strong>/);
  assert.match(render, /id="homeEraBtn"/);
  assert.match(render, /class="site-footer"/);
  assert.doesNotMatch(index, /class="site-footer"/);
  assert.match(styles, /\.workspace-nav/);
  assert.match(styles, /\.workspace-nav-button\.workspace-return-button/);
  assert.match(styles, /\.workspace-return-label/);
  assert.match(styles, /height: 100dvh/);
  assert.match(styles, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(styles, /grid-template-columns: repeat\(6, minmax\(0, 1fr\)\)/);
  assert.match(styles, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.doesNotMatch(styles, /\.home-rogue-feature\s*\{[^}]*grid-column/);
  assert.match(styles, /\.action-main-column > \.panel/);
});

test("home mode copy keeps one data source and a consistent shape", () => {
  const context = vm.createContext({ window: { Keiba: {} } });
  vm.runInContext(read("js/data/home-modes.js"), context, { filename: "js/data/home-modes.js" });
  const modes = context.window.Keiba.HomeModes;
  const length = (value) => [...value].length;

  assert.deepEqual([...modes.ids], ["career", "legend", "rogue", "era", "chairman"]);
  modes.ids.forEach((id) => {
    const copy = modes.copy[id];
    assert.ok(copy, `missing home mode copy for ${id}`);
    assert.match(copy.index, /^0[1-5] \/ [A-Z]+$/, `${id} index format`);
    assert.equal(length(copy.title), 4, `${id} title must be 4 characters`);
    assert.ok([0, 3].includes(length(copy.badge)), `${id} badge must be empty or 3 characters`);
    assert.ok(length(copy.tagline) >= 9 && length(copy.tagline) <= 11, `${id} tagline length`);
    assert.doesNotMatch(copy.tagline, /[，。、；：！？]/, `${id} tagline must not use punctuation`);
    assert.ok(length(copy.description) >= 26 && length(copy.description) <= 32, `${id} description length`);
    assert.match(copy.description, /。$/, `${id} description must end with a full stop`);
    assert.equal(copy.tags.length, 2, `${id} needs exactly two tags`);
    copy.tags.forEach((tag) => assert.equal(length(tag), 4, `${id} tag "${tag}" must be 4 characters`));
    assert.ok(copy.status === "暂无存档" || /^.+ · .+$/.test(copy.status), `${id} status must be a save state or "A · B"`);
    ["startLabel", "resumeLabel"].forEach((key) => {
      if (!copy[key]) return;
      assert.ok(length(copy[key]) >= 4 && length(copy[key]) <= 6, `${id}.${key} length`);
      assert.doesNotMatch(copy[key], /[\s/()（）]/, `${id}.${key} must not use spaces, slashes or brackets`);
    });
    assert.ok(fs.existsSync(path.join(root, copy.icon)), `${id} icon ${copy.icon} must exist`);
  });

  // 普通生涯与传奇模式共用一份存档，两张卡片都要能说明并继续这份存档。
  assert.equal(modes.copy.legend.resumeLabel, "继续传奇生涯");
  assert.equal(modes.copy.chairman.title, "主席模式");
  assert.equal(modes.copy.chairman.badge, "开发中");
  assert.equal(modes.copy.era.badge, "未完成");
});

test("feedback group copy supports modern and fallback clipboard paths", () => {
  const app = read("js/app.js");
  assert.match(app, /navigator\.clipboard\.writeText\(groupNumber\)/);
  assert.match(app, /document\.execCommand\("copy"\)/);
  assert.match(app, /群号已复制到剪贴板/);
  assert.match(app, /复制失败，请长按群号手动复制/);
  assert.match(app, /window\.clearTimeout\(feedbackCopyResetTimer\)/);
});

test("roguelike UI keeps an isolated save and the confirmed normal strength formula", () => {
  const app = read("js/app.js");
  const horseRules = read("js/rules/horse-generator.js");
  const rogueRules = read("js/rules/roguelike.js");
  const styles = read("css/styles.css");
  assert.match(app, /keiba-roguelike-save-v1/);
  assert.match(app, /careerSource: "standard"/);
  assert.match(app, /id="rogueConsumableTitle"/);
  assert.match(app, /data-rogue-consumable=/);
  assert.match(app, /data-rogue-item-select=/);
  assert.match(app, /data-rogue-shop-tab=/);
  assert.match(app, /data-rogue-candidate-tab=/);
  assert.match(app, /data-rogue-comments=/);
  assert.match(app, /class="rogue-inventory-disclosure"/);
  assert.match(app, /class="rogue-candidate-dock"/);
  assert.match(app, /rogueCandidateIndex: 0/);
  assert.match(app, /rogueShopCategory: "consumables"/);
  assert.match(app, /\["action", "horse", "bloodline", "challenge", "more"\]/);
  assert.match(app, /workspaceChallengeNav\.hidden = !isRogueCareer/);
  assert.match(app, /function challengeHintHtml/);
  assert.match(app, /data-workspace-jump="challenge"/);
  assert.match(app, /document\.getElementById\("rogueVeterinarianPanel"\)/);
  assert.match(app, /role="status" aria-live="polite"/);
  assert.match(app, />荣誉商店</);
  assert.doesNotMatch(app, /data-rogue-refresh=/);
  assert.doesNotMatch(app, /data-rogue-review=/);
  assert.match(horseRules, /R\.rollMulti\(2, 15\) \+ 60/);
  assert.match(rogueRules, /PROFILE_VERSION = 3/);
  assert.match(rogueRules, /CONSUMABLE_PRODUCTS/);
  assert.match(rogueRules, /purchaseConsumable/);
  assert.match(rogueRules, /useRefreshConsumable/);
  assert.match(rogueRules, /useReviewConsumable/);
  assert.match(rogueRules, /useAdaptationConsumable/);
  assert.match(rogueRules, /id: "consistency"/);
  assert.match(rogueRules, /windowMatches\(records, 8/);
  assert.match(rogueRules, /buildSettlement/);
  assert.match(styles, /\.rogue-store-shell/);
  assert.match(styles, /\.rogue-inventory-bar/);
  assert.match(styles, /\.rogue-item-use/);
  assert.match(styles, /\.rogue-store-tabs/);
  assert.match(styles, /\.rogue-candidate-tabs/);
  assert.match(styles, /\.rogue-candidate-card:not\(\.is-mobile-active\)/);
  assert.match(styles, /\.rogue-challenge-hint-button/);
  assert.match(styles, /\.rogue-challenge-hint\s*\{\s*display: none !important;/);
  assert.match(styles, /env\(safe-area-inset-bottom\)/);
});
