const test = require('node:test');
const assert = require('node:assert/strict');
const { IDBFactory } = require('fake-indexeddb');
const { loadRoguelikeRules, loadChairmanRules, runProjectFile, projectRoot } = require('./helpers/project-loader');
const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');

function eligibleCareer(id, overrides = {}) {
  const races = Array.from({ length: 3 }, (_, i) => ({
    public: { rank: 1, rankLabel: '一着', timeLabel: `三岁春 ${i + 1}月` },
    hidden: { race: { id: `g1-${i}`, name: `一级赛${i + 1}`, raceClass: i === 0 ? 'jpn1' : 'g1' } }
  }));
  return {
    gameMode: 'normal', retired: true, currentTime: { age: 6 }, races,
    horse: { id, name: `殿堂测试马${id}`, gender: '牡马', gameMode: 'normal', strength: 88,
      homeRegionId: 'japan', sireName: '父系', damName: '母系', distMin: 1400, coreDist: 2000, distMax: 2600,
      surfaceGrades: { grass: 'A', dirt: 'C' }, trackAptitudes: { burst: '◎', sustained: '○', attrition: '△' },
      growthType: '晚熟', temperamentLabel: '普通', heavyType: '普通',
      genetics: { quality: 77, stability: 68, lineId: 'line-test', familyId: 'family-test', factors: [{ trait: 'burst', power: 1 }],
        surfaceGrades: { grass: 'A', dirt: 'C' }, trackAptitudes: { burst: '◎', sustained: '○', attrition: '△' },
        distance: { min: 1400, core: 2000, max: 2600 }, growthType: '晚熟', temperamentLabel: '普通', heavyType: '普通' },
      pedigree: { ancestorRecords: [{ id: 'known-ancestor', name: '已知祖先', gender: '牡马', fatherId: null, motherId: null,
        genetics: { quality: 50, stability: 50, lineId: 'test-line', factors: [] } }] }
    }, ...overrides
  };
}

test('Hall storage enforces qualification and ten slots, retains genealogy after removal, and roundtrips backups', async () => {
  const project = loadRoguelikeRules();
  project.context.window.indexedDB = new IDBFactory();
  vm.runInContext(fs.readFileSync(path.join(projectRoot, 'js/rules/hall-of-fame.js'), 'utf8'), project.context, { filename: 'js/rules/hall-of-fame.js' });
  const hall = project.rules.HallOfFame;
  await hall.open();
  assert.equal(hall.eligible(eligibleCareer('two-wins', { races: eligibleCareer('x').races.slice(0, 2) })), false);
  assert.equal(hall.eligible(eligibleCareer('debug', { horse: { ...eligibleCareer('debug').horse, debugMode: true } })), false);
  assert.equal(hall.eligible(eligibleCareer('qualified')), true);
  const rogueRules = project.rules.RoguelikeRules;
  const oldSave = rogueRules.normalizeSave({ version: rogueRules.PROFILE_VERSION, profile: {}, run: { phase: 'candidates', candidates: [] } });
  assert.equal(oldSave.run.includeHall, false);
  for (let i = 0; i < 10; i++) await hall.add(eligibleCareer(`hall-${i}`), { starts: 12, wins: 5, g1Wins: 2, jpn1Wins: 1 });
  assert.equal(hall.count(), 10);
  await assert.rejects(hall.add(eligibleCareer('hall-overflow'), { starts: 3, wins: 3 }), /已满/);
  const removedId = 'player:normal:hall-0';
  const backup = hall.exportData();
  await hall.remove(removedId);
  assert.equal(hall.count(), 9);
  assert.equal(hall.bloodlineRecords().find(row => row.id === removedId).core, false);
  assert.equal(hall.bloodlineRecords().some(row => row.id === 'known-ancestor'), true);
  assert.equal(await hall.importData(backup, [removedId]), 1);
  assert.equal(hall.count(), 10);
  assert.equal(hall.find(removedId).career.horse.genetics.quality, 77);
  assert.equal(project.rules.CareerBloodline.parents('牡马').some(row => row.id === removedId), true);
  assert.equal(project.rules.CareerBloodline.parents('牡马', { includeHall: false }).some(row => row.id === removedId), false);
});
test('Chairman can manually import an active Hall template as a retired breeder with saved pre-entry career', () => {
  const project = loadChairmanRules(), { rules } = project, { ChairmanRules: W, ChairmanBreeding: B } = rules;
  const template = {
    id: 'hall-template:player:normal:retired-star', source: 'hall', sourceKey: 'player:normal:retired-star',
    name: '退役殿堂星', displayName: '退役殿堂星', originalName: '退役殿堂星', gender: '牡马', birthYear: null,
    fatherId: '', motherId: '', core: true, disabled: false, region: '日本',
    preHallCareer: { summary: { starts: 15, wins: 7, gradeOneWins: 3 }, races: [{ public: { rankLabel: '一着' }, hidden: { race: { name: '殿堂大赛' } } }] },
    game: { genetics: { quality: 77, stability: 68, lineId: 'line-hall', familyId: 'family-hall', factors: [{ trait: 'burst', power: 1 }] },
      breedingBase: 77, surfaceGrades: { grass: 'A', dirt: 'C' }, trackAptitudes: { burst: '◎', sustained: '○', attrition: '△' },
      distance: { min: 1400, core: 2000, max: 2600 }, growthType: '晚熟', temperamentLabel: '普通', heavyType: '普通' }
  };
  rules.HallOfFame = { chairmanTemplates: () => [template] };
  const world = W.createWorld({ seed: 9147, blank: true, breeding: true });
  const out = B.edit(world, 'introduce', { templateId: template.id, region: '日本' });
  const imported = out.world.pedigrees.find(h => h.templateId === template.id);
  assert.ok(imported);
  assert.equal(imported.sourceKind, 'hall');
  assert.equal(imported.status, 'retired');
  assert.equal(imported.genetics.quality, 77);
  assert.equal(imported.genetics.stability, 68);
  assert.equal(imported.trackAptitudes.burst, '◎');
  assert.equal(imported.preHallCareer.races[0].hidden.race.name, '殿堂大赛');
  assert.ok(B.query(out.world, { view: 'library', search: '退役殿堂星' }).rows.some(row => row.id === template.id && row.source === 'hall'));
});
