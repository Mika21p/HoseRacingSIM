const test = require("node:test");
const assert = require("node:assert/strict");
const { loadEraRules } = require("./helpers/project-loader");

const plain = (value) => JSON.parse(JSON.stringify(value));

function setup() {
  const project = loadEraRules();
  return { ns: project.rules, almanac: project.rules.EraAlmanac };
}

function tokensIn(text) {
  return [...String(text).matchAll(/\{\{([A-Z0-9_]+)\}\}/g)].map((match) => match[1]);
}

test("condition language rejects unknown keys, bad values and unknown effects", () => {
  const { ns } = setup();
  assert.deepEqual(plain(ns.EraConditions.validate({ tags: ["winner"], window: ["1998-01-01", "1998-12-31"], rank: 3, upset: true }, "t")), []);
  assert.equal(ns.EraConditions.validate({ arbitrary: true }, "t").length, 1);
  assert.equal(ns.EraConditions.validate({ window: ["1998-01-01"] }, "t").length, 1);
  assert.equal(ns.EraConditions.validate({ rank: "3" }, "t").length, 1);
  assert.equal(ns.EraConditions.validate({ retired: "yes" }, "t").length, 1);
  assert.equal(ns.EraConditions.validateEffect({ type: "give-win" }, "t").length, 1);
  assert.equal(ns.EraConditions.validateEffect({ type: "fame", delta: 0 }, "t").length, 1);
  assert.equal(ns.EraConditions.validateEffect({ type: "relation", target: "x", kind: "unknown" }, "t").length, 1);
});

test("condition matching only fires on the declared situation", () => {
  const { ns } = setup();
  const ctx = {
    date: "1998-05-01", tags: ["winner"], fame: 20, horseType: "road",
    eventTypes: new Set(["race-result"]), entered: new Set(["1998-satsuki-sho"]),
    rewritten: new Set(), registered: "1998-tokyo-yushun", starts: 3,
    rank: 1, grade: "G1", retired: false, deadHeat: false, upset: true, maiden: false, rivalId: ""
  };
  assert.equal(ns.EraConditions.matches({ tags: ["winner"] }, ctx), true);
  assert.equal(ns.EraConditions.matches({ tags: ["crown-lost"] }, ctx), false);
  assert.equal(ns.EraConditions.matches({ entered: "1998-satsuki-sho" }, ctx), true);
  assert.equal(ns.EraConditions.matches({ entered: "1998-kikka-sho" }, ctx), false);
  assert.equal(ns.EraConditions.matches({ registered: "1998-tokyo-yushun" }, ctx), true);
  assert.equal(ns.EraConditions.matches({ registered: "1998-kikka-sho" }, ctx), false);
  assert.equal(ns.EraConditions.matches({ window: ["1998-01-01", "1998-04-30"] }, ctx), false);
  assert.equal(ns.EraConditions.matches({ window: ["1998-04-01", "1998-06-30"] }, ctx), true);
  assert.equal(ns.EraConditions.matches({ rank: 1, grade: "G1" }, ctx), true);
  assert.equal(ns.EraConditions.matches({ rank: 2 }, ctx), false);
  assert.equal(ns.EraConditions.matches({ upset: true }, ctx), true);
  assert.equal(ns.EraConditions.matches({ hasTagPrefix: "rival:" }, ctx), false);
});

test("every news template and yearly note uses only registered tokens", () => {
  const { ns } = setup();
  const registered = new Set(Object.keys(ns.EraTextIndex.REGISTERED_TOKENS));
  const templates = ns.EraNewsTemplates.list();
  assert.ok(templates.length >= 25, `only ${templates.length} templates`);
  const notes = ns.EraNewsNotes.list();
  assert.ok(notes.length >= 25, `only ${notes.length} notes`);
  for (const item of [...templates, ...notes]) {
    for (const token of tokensIn(`${item.title}\n${item.body}`)) assert.ok(registered.has(token), `${item.id} -> ${token}`);
  }
});

test("every 1998 news note points at a race that exists and is a recorded tier", () => {
  const { ns, almanac } = setup();
  const notes = ns.EraNewsNotes.list();
  assert.ok(notes.length >= 25, `only ${notes.length} notes`);
  for (const note of notes) {
    const race = almanac.race(note.raceId);
    assert.ok(race, note.raceId);
    assert.equal(race.tier, "top5", note.raceId);
  }
});

test("news template selection covers every player result type", () => {
  const { ns, almanac } = setup();
  const edition = almanac.race("1998-satsuki-sho");
  const pick = (overrides) => {
    const ctx = {
      date: "1998-04-19", tags: [], fame: 10, horseType: "road",
      eventTypes: new Set(["race-result"]), entered: new Set(), rewritten: new Set(),
      registered: "", starts: 1, rank: undefined, grade: undefined, retired: false,
      deadHeat: false, upset: false, maiden: false, rivalId: "", event: null
    };
    Object.assign(ctx, overrides);
    return ns.EraNewsTemplates.select("result", ctx)?.id;
  };
  assert.equal(pick({ rank: 1, grade: "G1", upset: true }), "result.win.upset");
  assert.equal(pick({ rank: 1, grade: "G1", upset: false, maiden: true }), "result.win.maiden");
  assert.equal(pick({ rank: 1, grade: "G1", upset: false, maiden: false }), "result.win.g1");
  assert.equal(pick({ rank: 1, grade: "G2", upset: false, maiden: false }), "result.win.graded");
  assert.equal(pick({ rank: 2 }), "result.place.second");
  assert.equal(pick({ rank: 4 }), "result.place.third");
  assert.equal(pick({ rank: 9 }), "result.place.beaten");
  assert.equal(pick({ rank: 3, deadHeat: true }), "result.deadheat");
  assert.equal(pick({ rank: undefined, retired: true }), "result.retired");
  assert.ok(edition);
});

test("1998 storylets all resolve to existing texts and valid conditions", () => {
  const { ns } = setup();
  assert.deepEqual(plain(ns.EraStorylets.validate()), []);
  const ids = ns.EraStoryletData.map((node) => node.id);
  assert.ok(ids.length >= 12, `only ${ids.length} storylets`);
  const scenario = ns.EraRules.scenarioFor();
  scenario.storyletIds.forEach((id) => assert.ok(ids.includes(id), id));
});

test("the 1998 classics split between two horses and no triple crown exists", () => {
  const { almanac } = setup();
  const winnerOf = (id) => almanac.race(id).results[0].horseId;
  assert.equal(winnerOf("1998-satsuki-sho"), "seiun-sky");
  assert.equal(winnerOf("1998-tokyo-yushun"), "special-week");
  assert.equal(winnerOf("1998-kikka-sho"), "seiun-sky");
  const classicHolders = new Set([winnerOf("1998-satsuki-sho"), winnerOf("1998-tokyo-yushun"), winnerOf("1998-kikka-sho")]);
  assert.equal(classicHolders.size, 2);
});

test("encyclopedia entries validate and only cite known horses and races", () => {
  const { almanac } = setup();
  const entries = almanac.entriesOf(1998);
  assert.ok(entries.length >= 20, `only ${entries.length} entries`);
  assert.deepEqual(plain(almanac.validate()), []);
  entries.forEach((entry) => {
    assert.ok(["horse", "scene", "year"].includes(entry.category), entry.id);
    assert.ok(entry.title && entry.body, entry.id);
    if (entry.horseId) assert.ok(almanac.horse(entry.horseId), `${entry.id} -> ${entry.horseId}`);
    if (entry.raceId) assert.ok(almanac.race(entry.raceId), `${entry.id} -> ${entry.raceId}`);
    assert.equal(entry.status, "draft", entry.id);
  });
  const categories = new Set(entries.map((entry) => entry.category));
  assert.deepEqual([...categories].sort(), ["horse", "scene", "year"]);
});

test("encyclopedia horse entries only claim races the almanac actually recorded", () => {
  const { almanac } = setup();
  const entries = almanac.entriesOf(1998).filter((entry) => entry.category === "horse");
  entries.forEach((entry) => {
    const record = almanac.horseRecord(entry.horseId);
    assert.ok(record.length, entry.id);
    record.forEach((item) => {
      const race = almanac.race(item.raceId);
      assert.ok(race.results.some((result) => result.horseId === entry.horseId && result.finish === item.finish), `${entry.id} ${item.raceId}`);
    });
  });
});

test("news notes for the classics do not claim a triple crown winner", () => {
  const { ns } = setup();
  const note = ns.EraNewsNotes.noteFor("1998-kikka-sho");
  assert.ok(note);
  assert.ok(!/三冠马|拿下当年度的三冠/.test(note.body.replace(/没有三冠马[^。]*。/, "")), note.body);
});

test("1999 almanac follows the same two-tier rule as 1998", () => {
  const { almanac } = setup();
  const races = almanac.racesOf(1999);
  assert.equal(races.length, 117);
  const count = (grade) => races.filter((race) => race.grade === grade).length;
  assert.deepEqual([count("G1"), count("G2"), count("G3")], [20, 33, 64]);
  races.forEach((race) => {
    assert.match(race.source, /^https:\/\/www\.jbis\.or\.jp\/race\/result\/1999\d{4}\/1\d\d\/\d{2}\/$/);
    assert.ok(race.date.startsWith("1999-"));
    if (race.grade === "G1") assert.equal(race.tier, "top5", race.id);
    const finishes = plain(race.results.map((result) => result.finish));
    if (race.tier === "top5") assert.ok(finishes.length >= 5, race.id);
    else assert.equal(finishes[0], 1, race.id);
    assert.ok(race.results.every((result) => result.time), race.id);
  });
});

test("the 1999 calendar only opens the races that were open to older horses", () => {
  const { ns, almanac } = setup();
  const entries = ns.EraCalendarRegistry.all().filter((entry) => entry.almanacRaceId.startsWith("1999-"));
  assert.equal(entries.length, 14);
  entries.forEach((entry) => {
    const race = almanac.race(entry.almanacRaceId);
    assert.ok(race, entry.almanacRaceId);
    assert.ok(race.surface === "草地", entry.almanacRaceId);
    assert.ok(race.distance >= 1800 && race.distance <= 3200, entry.almanacRaceId);
    // 旧制马龄换算：サラ系５才上对实龄四岁以上开放，４才上对实龄三岁以上开放。
    const expected = /サラ系５才上/.test(race.condition) ? 4 : /サラ系４才上/.test(race.condition) ? 3 : null;
    assert.equal(entry.age.min, expected, entry.almanacRaceId);
    assert.ok(ns.EraPerformances[entry.almanacRaceId], entry.almanacRaceId);
  });
});

test("1999 encyclopedia entries validate and only cite known horses and races", () => {
  const { almanac } = setup();
  const entries = almanac.entriesOf(1999);
  assert.ok(entries.length >= 20, `only ${entries.length} entries`);
  entries.forEach((entry) => {
    assert.ok(["horse", "scene", "year"].includes(entry.category), entry.id);
    assert.ok(entry.title && entry.body, entry.id);
    if (entry.horseId) assert.ok(almanac.horse(entry.horseId), `${entry.id} -> ${entry.horseId}`);
    if (entry.raceId) assert.ok(almanac.race(entry.raceId), `${entry.id} -> ${entry.raceId}`);
    assert.equal(entry.status, "final", entry.id);
  });
  const categories = new Set(entries.map((entry) => entry.category));
  assert.deepEqual([...categories].sort(), ["horse", "scene", "year"]);
  // 名马条目引用的比赛必须真的收录了该马的成绩。
  entries.filter((entry) => entry.category === "horse").forEach((entry) => {
    const record = almanac.horseRecord(entry.horseId);
    assert.ok(record.length, entry.id);
    record.forEach((item) => {
      const race = almanac.race(item.raceId);
      assert.ok(race.results.some((result) => result.horseId === entry.horseId && result.finish === item.finish), `${entry.id} ${item.raceId}`);
    });
  });
});

test("a full season produces the encyclopedia, the scenes and the newspaper", () => {
  const { ns } = setup();
  const run = ns.EraRules.createRun({ seed: 3, horseName: "检验马" });
  const targets = ["1998-satsuki-sho", "1998-tokyo-yushun", "1998-kikka-sho", "1998-arima-kinen"];
  for (let step = 0; step < 400 && !run.ended; step++) {
    let scene = ns.EraRules.getCurrentScene(run);
    if (!scene) throw new Error("missing scene");
    if (scene.id.startsWith("time:") && !run.scheduledRace) {
      const plans = ns.EraRules.getAvailablePlans(run).filter((plan) => targets.includes(plan.occurrence.id));
      const selected = plans.find((plan) => targets.includes(plan.occurrence.id));
      if (selected) {
        ns.EraRules.registerRace(run, selected.occurrence.id);
        scene = ns.EraRules.getCurrentScene(run);
      }
    }
    ns.EraRules.resolveSceneChoice(run, scene.id, scene.choices[0].id);
  }
  assert.ok(run.ended);
  assert.ok(run.storylets.resolved.includes("1999-year-end"));
  assert.ok(run.storylets.resolved.includes("year-end-transition"));
  assert.ok(run.storylets.resolved.includes("arima-after"));
  assert.ok(run.storylets.resolved.includes("satsuki-eve"));
  assert.ok(run.news.some((item) => item.kind === "historical"));
  assert.ok(run.news.some((item) => item.kind === "result"));
  assert.ok(run.news.some((item) => item.kind === "feature"));
  assert.ok(run.news.every((item) => item.title && item.body));
  assert.ok(run.news.every((item) => !/\{\{/.test(item.title + item.body)));
});

test("winning all three classics raises the triple crown scene and its report", () => {
  const { ns } = setup();
  const run = ns.EraRules.createRun({ seed: 5, horseName: "三冠马" });
  const scenario = ns.EraRules.scenarioFor(run);
  for (const raceId of scenario.goals.classics) {
    const edition = ns.EraAlmanac.race(raceId);
    run.events.push({
      id: `event-${run.events.length + 1}`, sequence: run.events.length + 1, type: "race-result",
      date: edition.date, raceId, rank: 1, retired: false, grade: "G1", winnerId: "player",
      historicalWinnerId: edition.results[0].horseId, namedOpponents: edition.results.map((row) => row.horseId),
      namedOpponentFinishes: {}
    });
    run.settled.push(raceId);
  }
  run.summary = ns.EraNarrative.summarize(run.events, scenario);
  assert.ok(run.summary.tags.includes("triple-crown"), run.summary.tags.join(","));
  assert.ok(!run.summary.tags.includes("crown-lost"), run.summary.tags.join(","));
  ns.EraStorylets.sync(run, scenario);
  const pending = run.storylets.pending.find((item) => item.id === "triple-crown");
  assert.ok(pending, run.storylets.pending.map((item) => item.id).join(","));
  assert.equal(pending.textId, "jp.era.1998.scene.triple-crown");
  assert.ok(!/\{\{/.test(pending.content.body), pending.content.body);
  const focus = run.events[run.events.length - 1];
  ns.EraNews.syncFeatures(run, focus);
  const feature = run.news.find((item) => item.featureTag === "triple-crown");
  assert.ok(feature, run.news.map((item) => item.featureTag).join(","));
  assert.ok(feature.body.includes("1998年的史实里没有三冠马"), feature.body);
  assert.ok(!feature.body.includes("史实的三冠由别的马完成"), feature.body);
});

test("retiring inside 1998 still plays the 1998 year-end scene", () => {
  const { ns } = setup();
  const run = ns.EraRules.createRun({ seed: 9, horseName: "退役马" });
  ns.EraRules.retire(run);
  for (let step = 0; step < 20 && !run.ended; step++) {
    const scene = ns.EraRules.getCurrentScene(run);
    if (!scene) break;
    ns.EraRules.resolveSceneChoice(run, scene.id, scene.choices[0].id);
  }
  assert.ok(run.ended);
  assert.ok(run.storylets.resolved.includes("year-end"), run.storylets.resolved.join(","));
});

test("the comeback scene waits for an injury recovery in the event stream", () => {
  const { ns } = setup();
  const run = ns.EraRules.createRun({ seed: 6, horseName: "伤愈马" });
  const scenario = ns.EraRules.scenarioFor(run);
  run.events.push({ id: `event-${run.events.length + 1}`, sequence: run.events.length + 1, type: "injury-start", date: run.date, severity: "轻" });
  ns.EraStorylets.sync(run, scenario);
  assert.ok(!run.storylets.pending.some((item) => item.id === "comeback"));
  run.events.push({ id: `event-${run.events.length + 1}`, sequence: run.events.length + 1, type: "injury-recovery", date: run.date });
  ns.EraStorylets.sync(run, scenario);
  const pending = run.storylets.pending.find((item) => item.id === "comeback");
  assert.ok(pending, run.storylets.pending.map((item) => item.id).join(","));
  assert.equal(pending.textId, "jp.era.1998.scene.comeback");
});

test("1999 post-race scenes describe both finishers and retirements", () => {
  const { ns } = setup();
  const run = { date: "1999-12-26", career: { horse: { name: "核验马" } }, events: [], summary: { tags: [], wins: 0, g1Wins: 0 }, news: [], storylets: { pending: [], resolved: [] } };
  for (const raceId of ["1999-tenno-sho-haru", "1999-takarazuka-kinen", "1999-tenno-sho-aki", "1999-japan-cup", "1999-arima-kinen"]) {
    const node = ns.EraStoryletData.find((item) => item.when?.entered === raceId);
    for (const retired of [false, true]) {
      const event = { type: "race-result", raceId, rank: retired ? null : 2, retired, date: ns.EraAlmanac.race(raceId).date };
      const text = ns.EraTextIndex.resolve(node.textId, ns.EraNews.tokens(run, event)).body;
      assert.ok(text.includes(retired ? "本场结果：退赛" : "本场结果：2着"), text);
      assert.doesNotMatch(text, /退赛着|\{\{/);
    }
  }
});

test("delayed post-race snapshots use their own race result across years", () => {
  const { ns } = setup();
  for (const raceId of ["1998-arima-kinen", "1999-tenno-sho-haru"]) {
    const run = { date: "1999-07-11", career: { horse: { name: "核验马" } }, summary: { tags: [], wins: 2, g1Wins: 1 }, news: [], storylets: { pending: [], resolved: [] } };
    const node = ns.EraStoryletData.find((item) => item.when?.entered === raceId);
    run.events = [
      { type: "race-result", raceId, date: ns.EraAlmanac.race(raceId).date, rank: 2, winnerName: "本场冠军" },
      { type: "race-result", raceId: "1999-takarazuka-kinen", date: "1999-07-11", rank: 4, retired: true, winnerName: "另一场冠军" }
    ];
    ns.EraStorylets.sync(run, { storyletIds: [node.id] });
    const pending = run.storylets.pending[0];
    assert.equal(pending.tokensSnapshot.PLAYER_RANK, 2);
    assert.equal(pending.tokensSnapshot.FINISH, "2着");
    assert.equal(pending.tokensSnapshot.WINNER_NAME, "本场冠军");
    assert.equal(pending.date, ns.EraAlmanac.race(raceId).date);
    assert.match(pending.content.body, /本场结果：2着/);
    assert.equal(pending.tokensSnapshot.WINS, 2, "whole-run totals are unchanged");
  }
});

test("1999 wording keeps history separate and does not require a full season", () => {
  const { ns } = setup();
  const run = { date: "1999-01-05", career: { horse: { name: "提前结束马" } }, events: [{ type: "season-end" }], summary: { starts: 0, wins: 0, g1Wins: 0, tags: [] }, news: [], storylets: { pending: [], resolved: [] } };
  ns.EraStorylets.sync(run, { storyletIds: ["1999-year-end"] });
  const text = run.storylets.pending[0].content.body;
  assert.match(text, /出赛0次/);
  assert.doesNotMatch(text, /赛程走完|跑到四岁的冬天/);
  const arima = ns.EraTextIndex.get("jp.era.1999.scene.arima-eve").body;
  assert.match(arima, /史实中赢下当年宝塚纪念/);
  assert.match(arima, /本局此前的胜负另有记录/);
  assert.doesNotMatch(ns.EraTextIndex.get("jp.era.1999.scene.season-open").body, /日本德比与年末有马纪念的特别周|1999年1月/);
  const node = ns.EraStoryletData.find((item) => item.id === "1999-tenno-spring-eve");
  assert.match(node.choices[1].label, /公开表态/);
  assert.deepEqual(plain(node.choices[1].effects), [{ type: "fame", delta: 2 }]);
});

test("1999 historical copy separates verified starters from simulation headcount", () => {
  const { ns, almanac } = setup();
  for (const [raceId, starters, headcount] of [["1999-satsuki-sho", 17, 18], ["1999-takamatsunomiya-kinen", 16, 17], ["1999-arima-kinen", 14, 15]]) {
    const run = { date: almanac.race(raceId).date, career: { horse: { name: "核验马" } }, events: [], summary: { tags: [] }, news: [] };
    const event = { id: raceId, type: "historical-race", raceId, date: run.date };
    const item = ns.EraNews.add(run, "historical", event);
    assert.ok(item.body.includes(`${starters}匹马出赛`), item.body);
    assert.equal(almanac.race(raceId).headcount, headcount, "simulation input stays unchanged");
  }
  assert.equal(almanac.race("1999-japan-cup").headcount, 15);
  const entries = new Map(almanac.entriesOf(1999).map((entry) => [entry.id, entry]));
  assert.match(entries.get("1999-scene-satsuki").body, /十七匹马出赛/);
  for (const id of ["1999-scene-japan-cup", "1999-scene-arima"]) assert.match(entries.get(id).body, /十四匹马出赛/);
});

test("1999 revised entries keep recorded counts, names and classic results", () => {
  const { ns, almanac } = setup();
  const entries = new Map(almanac.entriesOf(1999).map((entry) => [entry.id, entry]));
  for (const [id, phrase] of [["special-week", "五度夺冠"], ["mejiro-bright", "五度进入前五"], ["king-halo", "五度进入前五"], ["umeno-fiber", "三度进入前五"], ["primordine", "三度进入前五"], ["buzen-candle", "两度进入前五"], ["tsurumaru-tsuyoshi", "三度进入前五"]]) assert.ok(entries.get(`1999-entry-${id}`).body.includes(phrase), id);
  for (const entry of entries.values()) {
    assert.equal(entry.status, "final");
    assert.doesNotMatch(`${entry.title}${entry.subtitle}${entry.body}`, /竞标|宝冢|�/);
    if (entry.horseId) assert.ok(entry.body.includes(`练马师${almanac.horse(entry.horseId).trainer.replace(/\s/g, "")}，`), entry.id);
  }
  assert.match(entries.get("1999-entry-tm-opera-o").body, /全部跑进前三，却只赢下皋月赏/);
  assert.match(entries.get("1999-entry-admire-vega").body, /皋月赏与菊花赏都只跑出第六/);
  assert.match(entries.get("1999-entry-eishin-preston").body, /只有一条1999年记录/);
  assert.doesNotMatch(entries.get("1999-entry-eishin-preston").body, /每日杯|最后一个G1/);
  assert.match(entries.get("1999-scene-mile-line").body, /东京1600米.*京都1600米/);
  assert.match(entries.get("1999-scene-satsuki").body, /冠亚相差一个马颈.*第二与第三只隔一个马鼻/);
  for (const note of ns.EraNewsNotes.list().filter((item) => item.year === 1999)) assert.doesNotMatch(`${note.title}${note.body}`, /竞标|宝冢|四场G1全部第二|十一天之后的日本杯/);
});

test("1998 revised copy keeps sex, placements and historical names consistent", () => {
  const { ns, almanac } = setup();
  const entries = new Map(almanac.entriesOf(1998).map((entry) => [entry.id, entry]));
  const body = (id) => entries.get(`1998-entry-${id}`).body;
  assert.match(ns.EraNewsNotes.noteFor("1998-tokinominoru-kinen").body, /这匹牡马/);
  assert.match(body("air-groove"), /1993年出生的牝马/);
  assert.match(body("special-week"), /七场比赛/);
  assert.match(body("special-week"), /一年四胜/);
  assert.match(body("falernopsis"), /五度进入前五/);
  assert.match(body("silence-suzuka"), /五场全胜/);
  assert.doesNotMatch(body("silence-suzuka"), /同属一厩|一厩两匹/);
  assert.match(body("stay-gold"), /有马纪念排到了第三/);
  assert.equal(entries.get("1998-entry-stay-gold").subtitle, "三场G1的第二名");
  assert.match(entries.get("1998-scene-arima").body, /一匹牝马、四匹牡马/);
  assert.doesNotMatch(entries.get("1998-scene-arima").body, /全部.*赢过重赏|每一个.*赢过重赏/);
  const kikka = almanac.race("1998-kikka-sho");
  const third = almanac.horse(kikka.results.find((result) => result.finish === 3).horseId);
  assert.ok(ns.EraNewsNotes.noteFor(kikka.id).title.includes(third.nameZh));
  for (const entry of entries.values()) {
    assert.doesNotMatch(`${entry.title}${entry.subtitle}${entry.body}`, /竞标|宝冢|�/);
    const sentences = entry.body.split("。");
    assert.notEqual(sentences[0], sentences[1], entry.id);
    if (entry.horseId) {
      const trainer = almanac.horse(entry.horseId).trainer.replace(/\s/g, "");
      assert.ok(entry.body.includes(`练马师${trainer}，`), entry.id);
    }
  }
});

test("1998 post-race scenes describe both finishers and retirements", () => {
  const { ns } = setup();
  const run = { date: "1999-01-05", career: { horse: { name: "核验马" } }, events: [], summary: { tags: [], wins: 99, g1Wins: 99 }, news: [], storylets: { pending: [], resolved: [] } };
  for (const raceId of ["1998-satsuki-sho", "1998-tokyo-yushun", "1998-kikka-sho", "1998-arima-kinen"]) {
    const node = ns.EraStoryletData.find((item) => item.when?.entered === raceId);
    for (const retired of [false, true]) {
      const event = { type: "race-result", raceId, rank: retired ? null : 2, retired, date: "1998-12-27" };
      const text = ns.EraTextIndex.resolve(node.textId, ns.EraNews.tokens(run, event)).body;
      assert.ok(text.includes(retired ? "本场结果：退赛" : "本场结果：2着"), text);
      assert.ok(!text.includes("退赛着"), text);
    }
  }
});

test("1998 year-end snapshots exclude 1999 results on both paths", () => {
  const { ns } = setup();
  const run = { date: "1999-01-05", career: { horse: { name: "核验马" } }, events: [], summary: { tags: [], wins: 99, g1Wins: 99 }, news: [], storylets: { pending: [], resolved: [] } };
  run.events = [
    { type: "race-result", date: "1998-04-19", rank: 1, grade: "G1" },
    { type: "race-result", date: "1998-11-01", rank: 1, grade: "G1", retired: true },
    { type: "race-result", date: "1999-01-05", rank: 1, grade: "G3" },
    { type: "race-result", date: "1999-01-05", rank: 1, grade: "G1" }
  ];
  ns.EraStorylets.sync(run, { storyletIds: ["year-end-transition"] });
  let snapshot = run.storylets.pending[0];
  assert.equal(snapshot.tokensSnapshot.WINS, 1);
  assert.equal(snapshot.tokensSnapshot.G1_WINS, 1);
  assert.match(snapshot.content.body, /1998年，1胜，G1 1场/);
  assert.equal(ns.EraNews.tokens(run).WINS, 99, "default tokens still use whole-run summary");
  run.storylets.pending = [];
  run.date = "1998-12-27";
  run.events.push({ type: "season-end" });
  ns.EraStorylets.sync(run, { storyletIds: ["year-end"] });
  assert.equal(run.storylets.pending[0].tokensSnapshot.WINS, 1);
  run.storylets.pending = [];
  run.events = [{ type: "race-result", date: "1999-01-05", rank: 1, grade: "G3" }];
  run.date = "1999-01-05";
  ns.EraStorylets.sync(run, { storyletIds: ["year-end-transition"] });
  snapshot = run.storylets.pending[0];
  assert.equal(snapshot.tokensSnapshot.WINS, 0);
  assert.equal(snapshot.tokensSnapshot.G1_WINS, 0);
});

test("relationship features render the horse matching their own tag", () => {
  const { ns } = setup();
  const run = { date: "1999-01-05", career: { horse: { name: "核验马" } }, events: [], summary: { tags: [], wins: 99, g1Wins: 99 }, news: [], storylets: { pending: [], resolved: [] } };
  run.summary.tags = ["rival:special-week", "nemesis:seiun-sky"];
  ns.EraNews.syncFeatures(run, null);
  const nemesis = run.news.find((item) => item.featureTag === "nemesis:");
  const rival = run.news.find((item) => item.featureTag === "rival:");
  assert.equal(nemesis.tokensSnapshot.RIVAL_NAME, "青云天空");
  assert.equal(nemesis.title, "克星：青云天空");
  assert.equal(rival.tokensSnapshot.RIVAL_NAME, "特别周");
});

test("first rewrite and chosen rival do not claim repeated meetings", () => {
  const { ns } = setup();
  const run = { date: "1999-01-05", career: { horse: { name: "核验马" } }, events: [], summary: { tags: [], wins: 99, g1Wins: 99 }, news: [], storylets: { pending: [], resolved: [] } };
  run.summary.tags = ["worldline-rewriter", "rival:special-week"];
  ns.EraNews.syncFeatures(run, null);
  assert.equal(run.news.length, 2);
  assert.ok(run.news.every((item) => !/不止一次|一次又一次|数次相遇/.test(item.body)));
});

test("1998 factual wording distinguishes classics and recorded scope", () => {
  const { ns } = setup();
  assert.match(ns.EraNewsNotes.noteFor("1998-tokinominoru-kinen").title, /^共同通信杯四岁锦标：/);
  assert.match(ns.EraNewsNotes.noteFor("1998-new-zealand-trophy").title, /^新西兰杯四岁锦标：/);
  assert.match(ns.EraNewsNotes.noteFor("1998-satsuki-sho").body, /三冠路线的第一关/);
  assert.doesNotMatch(ns.EraNewsNotes.noteFor("1998-shuka-sho").body, /古典赛/);
  assert.doesNotMatch(ns.EraNewsNotes.noteFor("1998-yushun-himba").body, /三场古典赛/);
  assert.doesNotMatch(ns.EraNewsNotes.noteFor("1998-mainichi-hai").body, /并不常见/);
  const entries = ns.EraAlmanac.entriesOf(1998);
  const body = (horse) => entries.find((item) => item.id === `1998-entry-${horse}`).body;
  assert.match(body("stay-gold"), /年末的有马纪念/);
  assert.match(body("falernopsis"), /牝马三冠系列/);
  assert.match(body("taiki-shuttle"), /在日本赢下/);
  assert.match(body("grass-wonder"), /年鉴收录的最后/);
  assert.doesNotMatch(body("king-halo"), /两场古典赛，两次/);
});

test("1999 approved prose is final without approving shared or 1998 text", () => {
  const { ns, almanac } = setup();
  const scenes = ns.EraTextIndex.ALL.filter(item => item.id.startsWith("jp.era.1999."));
  const notes = ns.EraNewsNotes.list().filter(item => item.year === 1999);
  assert.equal(scenes.length, 11);
  assert.equal(notes.length, 38);
  assert.equal(almanac.entriesOf(1999).length, 31);
  for (const item of [...scenes, ...notes, ...almanac.entriesOf(1999)]) assert.equal(item.status, "final");
  for (const item of ns.EraTextIndex.ALL.filter(item => item.id.startsWith("jp.era.1998."))) assert.equal(item.status, "draft");
  for (const item of ns.EraNewsTemplates.list()) assert.notEqual(item.status, "final");
});

test("1999 historical tokens use starters without changing simulation headcount", () => {
  const { ns, almanac } = setup();
  const run = ns.EraRules.createRun({ seed: 1999, horseName: "人数验证" });
  for (const [id, starters, total] of [["satsuki-sho",17,18],["takamatsunomiya-kinen",16,17],["japan-cup",14,15],["arima-kinen",14,15]]) {
    const raceId = `1999-${id}`, e = almanac.race(raceId);
    assert.equal(e.starterCount, starters);
    assert.equal(e.headcount, total);
    assert.equal(ns.EraNews.tokens(run, null, { raceId }).HEADCOUNT, starters);
  }
  assert.equal(almanac.racesOf(1999).filter(e => Number.isInteger(e.starterCount)).length, 117);
  almanac.race("1999-japan-cup").starterCount = null;
  assert.equal(ns.EraNews.tokens(run, null, { raceId: "1999-japan-cup" }).HEADCOUNT, "待核实");
});
