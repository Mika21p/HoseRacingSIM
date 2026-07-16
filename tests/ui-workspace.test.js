const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("career UI keeps history inside the action workspace and exposes overlays", () => {
  const render = read("js/ui/render.js");
  ["action", "horse", "more"].forEach((view) => {
    assert.match(render, new RegExp(`data-workspace-view="${view}"`));
    assert.match(render, new RegExp(`data-workspace-panel="${view}"`));
  });
  assert.match(render, /data-workspace-section="history"/);
  assert.match(render, /class="action-main-column"[\s\S]*id="racePanel"[\s\S]*id="historyPanel"[\s\S]*id="actionAside"/);
  assert.match(render, /id="historyPanel" data-action-anchor="history"/);
  assert.doesNotMatch(render, /data-workspace-panel="history"/);
  assert.match(render, /id="setupOverlay"/);
  assert.match(render, /id="homeScreen"/);
  assert.match(render, /data-return-home/);
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
  assert.doesNotMatch(app, /SAVE_VERSION = 3/);
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
  const styles = read("css/styles.css");
  assert.match(index, /styles\.css\?v=20260716-home2/);
  assert.match(index, /render\.js\?v=20260716-home2/);
  assert.match(index, /app\.js\?v=20260716-opponent-year/);
  assert.match(index, /id="appVersion"/);
  assert.match(changelog, /version: "v0\.12f"/);
  assert.match(render, /id="homeContinueBtn"/);
  assert.match(render, /id="homeStartBtn"/);
  assert.match(render, /id="homeLegendBtn"/);
  assert.match(render, />NEW!<\/span>/);
  assert.match(render, /class="site-footer"/);
  assert.doesNotMatch(index, /class="site-footer"/);
  assert.match(styles, /\.workspace-nav/);
  assert.match(styles, /height: 100dvh/);
  assert.match(styles, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.action-main-column > \.panel/);
});
