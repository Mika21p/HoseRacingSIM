const test = require("node:test");
const assert = require("node:assert/strict");

const { loadRoguelikeRules } = require("./helpers/project-loader");

const { rules } = loadRoguelikeRules();

function raceRecord({
  id = "fixture-race",
  raceClass = "g1",
  rank = 1,
  retired = false,
  deadHeat = false,
  age = 3,
  region = "日本",
  surface = "草地",
  distance = 2000
} = {}) {
  return {
    public: {
      raceId: id,
      rank,
      rankLabel: rank === 1 ? "一着" : (rank === 2 ? "二着" : `${rank}着`),
      retired,
      deadHeat,
      timeLabel: `${age}岁6月上半`
    },
    hidden: {
      race: { id, name: id, raceClass, surfaceRegion: region, surface, distance },
      schedule: { age, month: 6, half: 1, index: rules.TimeRules.toIndex(age, 6, 1) }
    }
  };
}

function career(records, challengeId = "winning-streak", homeRegionId = "japan") {
  return {
    gameMode: "roguelike",
    horse: { homeRegionId },
    stable: { originalRegionId: homeRegionId },
    races: records,
    currentTime: rules.TimeRules.fromIndex(rules.TimeRules.toIndex(3, 6, 1)),
    roguelike: { challengeId }
  };
}

test("roguelike normal strength is based on 2d15+60 and keeps 62-90 bounds", () => {
  const originalRollMulti = rules.Random.rollMulti;
  try {
    rules.Random.rollMulti = () => 2;
    assert.equal(rules.HorseRules.rollProfileStrength("normal", { strengthType: "standard" }), 62);
    rules.Random.rollMulti = () => 30;
    assert.equal(rules.HorseRules.rollProfileStrength("normal", { strengthType: "standard" }), 90);
  } finally {
    rules.Random.rollMulti = originalRollMulti;
  }
});

test("trainer bloodline preferences remain light and never zero out ordinary bloodlines", () => {
  const sires = rules.SireBloodlines.filter((item) => item.id !== "random");
  sires.forEach((sire) => {
    assert.ok(rules.RoguelikeRules.bloodlineWeight(sire, "sato-yuta", "sire") > 0);
    assert.ok(rules.RoguelikeRules.bloodlineWeight(sire, "obrien", "sire") > 0);
    assert.ok(rules.RoguelikeRules.bloodlineWeight(sire, "pletcher", "sire") > 0);
  });
  assert.equal(rules.RoguelikeRules.bloodlineWeight({ id: "deep-impact" }, "sato-yuta", "sire"), 135);
  assert.equal(rules.RoguelikeRules.bloodlineWeight({ id: "urban-sea" }, "obrien", "dam"), 115);
  assert.equal(rules.RoguelikeRules.bloodlineWeight({ id: "deep-impact" }, "pletcher", "sire"), 100);
});

test("candidate generation records actual parents and a usable route", () => {
  const candidate = rules.RoguelikeRules.generateCandidate("sato-yuta", "normal");
  assert.notEqual(candidate.horse.sireId, "random");
  assert.notEqual(candidate.horse.damId, "random");
  assert.ok(candidate.horse.strength >= 62 && candidate.horse.strength <= 90);
  assert.equal(rules.RoguelikeRules.hasReasonableRoute(candidate.horse), true);
  assert.equal(candidate.initialComments.length, 5);
});

test("consumable shop preserves inventory across saves and locks after candidate generation", () => {
  const save = rules.RoguelikeRules.createSave();
  save.profile.honorCoins = 1000;
  assert.equal(rules.RoguelikeRules.CONSUMABLE_PRODUCTS.reappraise.price, 20);
  assert.equal(rules.RoguelikeRules.CONSUMABLE_PRODUCTS.authoritative.price, 50);
  assert.equal(rules.RoguelikeRules.CONSUMABLE_PRODUCTS.adaptation.price, 20);
  assert.equal(rules.RoguelikeRules.CONSUMABLE_PRODUCTS.adaptation.label, "幼驹调教券");
  Object.keys(rules.RoguelikeRules.CONSUMABLE_PRODUCTS).forEach((itemId) => {
    assert.equal(rules.RoguelikeRules.purchaseConsumable(save, itemId).ok, true);
  });
  assert.equal(rules.RoguelikeRules.purchaseConsumable(save, "reroll").ok, true);
  assert.equal(save.profile.honorCoins, 670);
  assert.equal(save.profile.consumables.reroll, 2);
  assert.equal(save.profile.consumables.champion, 1);

  const normalized = rules.RoguelikeRules.normalizeSave(JSON.parse(JSON.stringify(save)));
  assert.equal(normalized.profile.consumables.reroll, 2);
  assert.equal(normalized.profile.consumables.adaptation, 1);
  normalized.run = rules.RoguelikeRules.createRun(normalized.profile);
  const balance = normalized.profile.honorCoins;
  const inventory = normalized.profile.consumables.selected;
  assert.equal(rules.RoguelikeRules.purchaseConsumable(normalized, "selected").ok, false);
  assert.equal(normalized.profile.honorCoins, balance);
  assert.equal(normalized.profile.consumables.selected, inventory);
});

test("each consumable works once per run while different items remain independent", () => {
  const save = rules.RoguelikeRules.createSave();
  save.profile.honorCoins = 1000;
  ["reroll", "reroll", "selected", "champion", "reappraise", "authoritative"].forEach((itemId) => {
    assert.equal(rules.RoguelikeRules.purchaseConsumable(save, itemId).ok, true);
  });
  save.run = rules.RoguelikeRules.createRun(save.profile);
  const balanceAfterShopping = save.profile.honorCoins;
  const first = save.run.candidates[0];
  const second = save.run.candidates[1];
  const firstReview = rules.RoguelikeRules.useReviewConsumable(save, first.id, "reappraise");
  assert.equal(firstReview.ok, true);
  assert.equal(save.profile.consumables.reappraise, 0);
  const blockedSameHorse = rules.RoguelikeRules.useReviewConsumable(save, first.id, "authoritative");
  assert.equal(blockedSameHorse.ok, false);
  assert.equal(save.profile.consumables.authoritative, 1);
  assert.equal(save.run.consumablesUsed.authoritative, false);

  const authoritative = rules.RoguelikeRules.useReviewConsumable(save, second.id, "authoritative");
  assert.equal(authoritative.ok, true);
  authoritative.candidate.initialComments.forEach((comment, index) => {
    const before = rules.RoguelikeRules.ACCURACY_ORDER.indexOf(comment.accuracy);
    const after = rules.RoguelikeRules.ACCURACY_ORDER.indexOf(authoritative.candidate.reviewComments[index].accuracy);
    assert.equal(after, Math.min(rules.RoguelikeRules.ACCURACY_ORDER.length - 1, before + 1));
  });

  const refreshedReviewedHorse = rules.RoguelikeRules.useRefreshConsumable(save, first.id, "champion");
  assert.equal(refreshedReviewedHorse.ok, true);
  assert.equal(refreshedReviewedHorse.candidate.trainerId, first.trainerId);
  assert.equal(refreshedReviewedHorse.candidate.reviewComments, null);
  assert.ok(refreshedReviewedHorse.candidate.horse.strength >= 81 && refreshedReviewedHorse.candidate.horse.strength <= 100);

  const rerolled = rules.RoguelikeRules.useRefreshConsumable(save, refreshedReviewedHorse.candidate.id, "reroll");
  assert.equal(rerolled.ok, true);
  assert.equal(save.profile.consumables.reroll, 1);
  assert.equal(rules.RoguelikeRules.useRefreshConsumable(save, rerolled.candidate.id, "reroll").ok, false);
  assert.equal(save.profile.consumables.reroll, 1);
  assert.equal(rules.RoguelikeRules.useRefreshConsumable(save, save.run.candidates[2].id, "selected").ok, true);
  assert.equal(save.profile.honorCoins, balanceAfterShopping);
});

test("adaptation consumes inventory only after a valid effect and skipping is free", () => {
  const save = rules.RoguelikeRules.createSave();
  save.profile.honorCoins = 100;
  assert.equal(rules.RoguelikeRules.purchaseConsumable(save, "adaptation").ok, true);
  save.run = rules.RoguelikeRules.createRun(save.profile);
  const candidate = save.run.candidates[0];
  candidate.horse.grass["日本"] = "A";
  candidate.horse.dirt["日本"] = "A";
  assert.equal(rules.RoguelikeRules.selectCandidate(save, candidate.id).ok, true);
  assert.equal(rules.RoguelikeRules.useAdaptationConsumable(save, "japan").ok, false);
  assert.equal(save.profile.consumables.adaptation, 1);
  assert.equal(save.run.consumablesUsed.adaptation, false);
  candidate.horse.grass["日本"] = "G";
  candidate.horse.dirt["日本"] = "G";
  const adapted = rules.RoguelikeRules.useAdaptationConsumable(save, "japan");
  assert.equal(adapted.ok, true);
  assert.equal(save.profile.consumables.adaptation, 0);
  assert.equal(save.run.challengeOptions.length, 3);
  assert.equal([save.run.selectedCandidate.horse.grass["日本"], save.run.selectedCandidate.horse.dirt["日本"]].filter((grade) => grade === "C").length, 1);

  const skipped = rules.RoguelikeRules.createSave();
  skipped.profile.consumables.adaptation = 2;
  skipped.run = rules.RoguelikeRules.createRun(skipped.profile);
  assert.equal(rules.RoguelikeRules.selectCandidate(skipped, skipped.run.candidates[0].id).ok, true);
  assert.equal(rules.RoguelikeRules.skipAdaptation(skipped).ok, true);
  assert.equal(skipped.profile.consumables.adaptation, 2);
  assert.equal(skipped.run.consumablesUsed.adaptation, false);
});

test("legacy service purchases migrate to used consumables without refunds", () => {
  const legacyCandidate = rules.RoguelikeRules.generateCandidate("sato-yuta", "normal");
  legacyCandidate.reviewComments = legacyCandidate.initialComments;
  legacyCandidate.reviewLabel = "权威复核";
  const legacy = {
    version: 1,
    profile: { honorCoins: 77, unlockedTrainerIds: ["sato-yuta"] },
    run: {
      phase: "candidates",
      candidates: [legacyCandidate],
      services: {
        refresh: { serviceId: "selected", candidateId: legacyCandidate.id, price: 70 },
        review: { serviceId: "authoritative", candidateId: legacyCandidate.id, price: 60 },
        adaptation: null
      },
      spentCoins: 130
    }
  };
  const migrated = rules.RoguelikeRules.normalizeSave(legacy);
  assert.equal(migrated.version, 2);
  assert.equal(migrated.profile.honorCoins, 77);
  assert.equal(JSON.stringify(migrated.profile.consumables), JSON.stringify({ reroll: 0, selected: 0, champion: 0, reappraise: 0, authoritative: 0, adaptation: 0 }));
  assert.equal(migrated.run.consumablesUsed.selected, true);
  assert.equal(migrated.run.consumablesUsed.authoritative, true);
  assert.equal(migrated.run.services.refresh.length, 1);
  assert.equal(migrated.run.services.review.length, 1);
  assert.equal(migrated.run.candidates[0].reviewLabel, "权威复核");
});

test("stable challenge uses the final top-two 5/5/8 requirements", () => {
  const silverRecords = Array.from({ length: 5 }, (_, index) => raceRecord({
    id: `silver-${index}`,
    raceClass: index < 3 ? "g1" : "g3",
    rank: index % 2 === 0 ? 1 : 2
  }));
  const silver = rules.RoguelikeRules.evaluateChallenge(career(silverRecords, "consistency"), "consistency");
  assert.equal(silver.stage, "silver");

  const goldRecords = Array.from({ length: 8 }, (_, index) => raceRecord({
    id: `gold-${index}`,
    raceClass: index < 5 ? "g1" : "g3",
    rank: index < 3 ? 1 : 2
  }));
  const gold = rules.RoguelikeRules.evaluateChallenge(career(goldRecords, "consistency"), "consistency");
  assert.equal(gold.stage, "gold");
});

test("retirements break streaks and count against the limited-campaign race cap", () => {
  const records = [
    raceRecord({ id: "win-1" }),
    raceRecord({ id: "win-2" }),
    raceRecord({ id: "retired", retired: true }),
    raceRecord({ id: "loss-after-retirement", rank: 5 }),
    raceRecord({ id: "loss-1", rank: 5 }),
    raceRecord({ id: "loss-2", rank: 5 })
  ];
  const streak = rules.RoguelikeRules.evaluateChallenge(career(records, "winning-streak"), "winning-streak");
  assert.equal(streak.metrics.bestWinStreak, 2);
  const limited = rules.RoguelikeRules.evaluateChallenge(career(records, "selective-campaign"), "selective-campaign");
  assert.equal(limited.stage, "none");
  assert.ok(limited.failedStages.includes("bronze"));
});

test("world tour excludes JpnI and recognizes an overseas G1", () => {
  const jpni = raceRecord({ id: "foreign-jpni", raceClass: "jpn1", region: "美国" });
  const before = rules.RoguelikeRules.evaluateChallenge(career([jpni], "world-tour"), "world-tour");
  assert.equal(before.stage, "none");
  const after = rules.RoguelikeRules.evaluateChallenge(career([
    jpni,
    raceRecord({ id: "foreign-g1", raceClass: "g1", region: "美国" })
  ], "world-tour"), "world-tour");
  assert.equal(after.stage, "bronze");
});

test("alternate Japanese triple crown accepts any three eligible 3-year-old wins, including Tenno Sho Autumn", () => {
  const records = [
    raceRecord({ id: "oka-sho", age: 3 }),
    raceRecord({ id: "tokyo-yushun", age: 3 }),
    raceRecord({ id: "tenno-sho-aki", age: 3 })
  ];
  const achievementIds = rules.AchievementRules.evaluate(career(records)).map((achievement) => achievement.id);
  assert.equal(achievementIds.includes("japan-alternate-triple-crown"), true);
});

test("alternate Japanese triple crown does not count a Tenno Sho Autumn win after age three", () => {
  const records = [
    raceRecord({ id: "oka-sho", age: 3 }),
    raceRecord({ id: "tokyo-yushun", age: 3 }),
    raceRecord({ id: "tenno-sho-aki", age: 4 })
  ];
  const achievementIds = rules.AchievementRules.evaluate(career(records)).map((achievement) => achievement.id);
  assert.equal(achievementIds.includes("japan-alternate-triple-crown"), false);
});

test("Japanese classic and filly triple crowns suppress the alternate crown in all achievement results", () => {
  const cases = [
    {
      records: [
        raceRecord({ id: "satsuki-sho" }),
        raceRecord({ id: "tokyo-yushun" }),
        raceRecord({ id: "kikka-sho" })
      ],
      crownId: "japan-classic-triple-crown",
      reason: "与日本经典三冠重叠"
    },
    {
      records: [
        raceRecord({ id: "oka-sho" }),
        raceRecord({ id: "yushun-himba" }),
        raceRecord({ id: "shuka-sho" })
      ],
      crownId: "japan-filly-triple-crown",
      reason: "与日本牝马三冠重叠"
    }
  ];

  cases.forEach(({ records, crownId, reason }) => {
    const achievementIds = rules.AchievementRules.evaluate(career(records)).map((achievement) => achievement.id);
    assert.equal(achievementIds.includes(crownId), true);
    assert.equal(achievementIds.includes("japan-alternate-triple-crown"), false);

    const settlement = rules.RoguelikeRules.buildSettlement(rules.RoguelikeRules.createProfile(), career(records)).settlement;
    assert.equal(settlement.achievements.some((achievement) => achievement.id === "japan-alternate-triple-crown"), false);
    const suppressed = settlement.suppressedAchievements.find((achievement) => achievement.id === "japan-alternate-triple-crown");
    assert.equal(suppressed.name, "日本变则三冠");
    assert.equal(suppressed.reason, reason);
  });
});

test("settlement pays first achievements in full and repeats at half without race points", () => {
  const records = [
    raceRecord({ id: "fixture-g1", raceClass: "g1", rank: 1 }),
    raceRecord({ id: "fixture-loss-1", raceClass: "g3", rank: 5 }),
    raceRecord({ id: "fixture-loss-2", raceClass: "g3", rank: 5 })
  ];
  const first = rules.RoguelikeRules.buildSettlement(rules.RoguelikeRules.createProfile(), career(records));
  assert.equal(first.settlement.valid, true);
  assert.equal(first.settlement.challengeCoins, 10);
  assert.equal(first.settlement.achievementCoins, 10);
  assert.equal(first.settlement.totalScore, 20);
  const repeat = rules.RoguelikeRules.buildSettlement(first.profile, career(records));
  assert.equal(repeat.settlement.achievementCoins, 5);
  assert.equal(repeat.settlement.achievementScore, 10);
});

test("invalid voluntary careers pay nothing while forced retirement is always valid", () => {
  const shortCareer = career([raceRecord()]);
  shortCareer.currentTime = rules.TimeRules.fromIndex(rules.TimeRules.toIndex(2, 7, 1));
  const voluntary = rules.RoguelikeRules.buildSettlement(rules.RoguelikeRules.createProfile(), shortCareer, false);
  assert.equal(voluntary.settlement.valid, false);
  assert.equal(voluntary.settlement.totalCoins, 0);
  const forced = rules.RoguelikeRules.buildSettlement(rules.RoguelikeRules.createProfile(), shortCareer, true);
  assert.equal(forced.settlement.valid, true);
  assert.ok(forced.settlement.totalCoins >= 10);
});

test("resident veterinarian removes six turns and cannot be reused", () => {
  const currentTime = rules.TimeRules.fromIndex(rules.TimeRules.toIndex(4, 1, 1));
  const injuredCareer = {
    currentTime,
    retired: false,
    injury: { active: { restUntilIndex: currentTime.index + 8, restUntilLabel: "" }, history: [] },
    roguelike: { veterinarianUsed: false }
  };
  const profile = rules.RoguelikeRules.createProfile();
  profile.residentVeterinarian = true;
  const first = rules.RoguelikeRules.useVeterinarian(injuredCareer, profile);
  assert.equal(first.ok, true);
  assert.equal(injuredCareer.injury.active.restUntilIndex, currentTime.index + 2);
  assert.equal(rules.RoguelikeRules.useVeterinarian(injuredCareer, profile).ok, false);
});
