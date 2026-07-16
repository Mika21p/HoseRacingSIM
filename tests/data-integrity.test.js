const test = require("node:test");
const assert = require("node:assert/strict");

const { loadProjectData } = require("./helpers/project-loader");
const { validateProjectData } = require("./helpers/validate-data");

function validFixture() {
  return {
    races: [{
      id: "fixture-race",
      nameOriginal: "Fixture Race",
      nameZh: "测试赛事",
      raceClass: "g1",
      surface: "草地",
      course: "测试",
      month: 1,
      half: 1,
      distance: 1600
    }],
    jockeys: [{ id: "fixture-jockey", name: "测试骑手", periods: [{ from: 2000, to: 2030, ability: 70 }] }],
    horses: [{
      id: "fixture-horse",
      name: "测试马",
      profile: { baseAbility: 70, peakAbility: 75 },
      races: [{ raceId: "fixture-race", year: 2020, ability: 72, jockeyId: "fixture-jockey", finish: 1 }]
    }]
  };
}

test("all registered project data is internally consistent", () => {
  const project = loadProjectData();

  assert.ok(project.races.length > 0, "expected registered races");
  assert.ok(project.horses.length > 0, "expected registered historical horses");
  assert.ok(project.jockeys.length > 0, "expected registered jockeys");
  assert.equal(
    project.horses.length,
    project.horseFiles.length,
    "each historical-horse data file must register exactly one horse"
  );
  assert.deepEqual(validateProjectData(project), []);
});

test("data validation rejects duplicate race IDs", () => {
  const fixture = validFixture();
  fixture.races.push({ ...fixture.races[0] });
  assert.ok(validateProjectData(fixture).some((error) => error === "DUPLICATE_RACE_ID fixture-race"));
});

test("data validation rejects unknown race references", () => {
  const fixture = validFixture();
  fixture.horses[0].races[0].raceId = "missing-race";
  assert.ok(validateProjectData(fixture).some((error) => error.includes("UNKNOWN_RACE")));
});

test("data validation rejects unknown jockey references", () => {
  const fixture = validFixture();
  fixture.horses[0].races[0].jockeyId = "missing-jockey";
  assert.ok(validateProjectData(fixture).some((error) => error.includes("UNKNOWN_JOCKEY")));
});

test("data validation checks legend-only eligibility wins", () => {
  const fixture = validFixture();
  fixture.horses[0].legendEligibilityWins = [{
    raceName: "Fixture Allowance",
    year: 2020,
    surfaceRegion: "未知赛区",
    surface: "泥地",
    distance: 0,
    jockeyId: "missing-jockey"
  }];
  const errors = validateProjectData(fixture);
  assert.ok(errors.some((error) => error.includes("INVALID_LEGEND_WIN_REGION")));
  assert.ok(errors.some((error) => error.includes("INVALID_LEGEND_WIN_DISTANCE")));
  assert.ok(errors.some((error) => error.includes("UNKNOWN_LEGEND_WIN_JOCKEY")));
});
