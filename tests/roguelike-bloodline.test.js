const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const {loadRoguelikeRules} = require('./helpers/project-loader');
const {rules:n, context} = loadRoguelikeRules();
const copy = x => JSON.parse(JSON.stringify(x));
vm.runInContext(fs.readFileSync('js/data/bloodline-lab-fixtures.js','utf8'),context);
const fixtures = n.BloodlineLabFixtures;

test('肉鸽三档各20匹：实际父母、合法路线、能力边界与冻结资料', () => {
  const results = {};
  for (const [profile,min,max] of [['normal',62,90],['selected',74,94],['champion',81,100]]) {
    results[profile] = [];
    for (let i=0;i<20;i++) {
      const h=n.Random.withSource(n.Random.seeded(9200+i),()=>n.RoguelikeRules.generateCandidate(['sato-yuta','obrien','pletcher'][i%3],profile).horse);
      assert(h.strength>=min && h.strength<=max);
      assert(n.RoguelikeRules.hasReasonableRoute(h));
      assert(n.BloodlineSystem.checkPair(n.CareerBloodline.getLibrary(),h.fatherId,h.motherId).legal);
      assert.equal(h.pedigree.mode,'roguelike'); assert.equal(h.pedigree.ancestors.length,30);
      assert(h.pedigree.ancestors.every(a=>a.lineLabel && Array.isArray(a.factors)));
      assert.equal(h.breedingOutcome.bonus,0); assert.equal(h.breedingOutcome.protectionGain,0);
      assert.equal(h.strength,h.breedingOutcome.rawStrength);
      if(profile==='champion') assert.notEqual(h.temperamentLabel,'极端暴躁');
      results[profile].push(h.strength);
    }
  }
  console.log('60匹轻量检查：',JSON.stringify(Object.fromEntries(Object.entries(results).map(([k,v])=>[k,{count:v.length,min:Math.min(...v),max:Math.max(...v)}]))));
});

test('隐藏Q/S与配合奖励不影响肉鸽速度；正常模式概率表不受改动',()=>{
  const rows=copy(fixtures.records), B=n.BloodlineSystem;
  const low=B.createLibrary(rows,fixtures.nicks);
  rows.forEach(r=>{r.genetics={...r.genetics,quality:99,stability:99};});
  const high=B.createLibrary(rows,fixtures.nicks);
  for(const profile of ['normal','selected','champion']) {
    const a=B.createPair(low,'sire-burst','mare-sustained','roguelike').generate({seed:55,strengthProfile:profile});
    const b=B.createPair(high,'sire-burst','mare-sustained','roguelike').generate({seed:55,strengthProfile:profile});
    const c=B.createPair(low,'sire-burst','mare-sustained','roguelike',{disabledTheories:['nick','ancestor','diversity','specialization','complement']}).generate({seed:55,strengthProfile:profile});
    assert.equal(a.strength,b.strength); assert.equal(a.strength,c.strength);
  }
  for(const m of ['mare-burst','mare-sustained','mare-unknown']) {
    const normal=B.createPair(low,'sire-burst',m).preview;
    const rogue=B.createPair(low,'sire-burst',m,'roguelike').preview;
    assert.deepEqual(copy(normal.trackPlan.combinations),copy(rogue.trackPlan.combinations));
    assert.equal(normal.trackPlan.directionalChance,undefined);
  }
});

test('固定随机检查定向、非定向、草泥距离继承与冠军气性保障',()=>{
  const rows=copy(fixtures.records);rows.forEach(r=>{if(r.genetics)r.genetics.factors=[];});
  const mother=rows.find(r=>r.id==='mare-sustained');mother.genetics.distance={min:1200,core:1600,max:1800};mother.genetics.surfaceGrades={grass:'C',dirt:'A'};mother.genetics.temperamentLabel='极端暴躁';
  const B=n.BloodlineSystem,lib=B.createLibrary(rows),H=n.HorseRules,R=n.Random;
  const base=H.generateHorse({gameMode:'roguelike'}),original={generate:H.generateHorse,peak:H.generatePeak,next:R.next,pick:R.weightedPick};
  try {
    H.generateHorse=()=>copy(base);H.generatePeak=()=>({start:3,end:5});
    for(const [mare,pattern] of [['mare-burst','◎△△'],['mare-sustained','○○△'],['mare-sustained','◎△△'],['mare-sustained','◎◎○'],['mare-unknown','◎○△']]) {
      let choices;
      R.next=()=>.1;
      R.weightedPick=(items,weight)=> {if(items[0]?.pattern)return items.find(r=>r.pattern===pattern);if(items[0]?.values){choices=items;return items[0];}return original.pick(items,weight);};
      const h=B.createPair(lib,'sire-burst',mare,'roguelike').generate();
      assert.equal([...Object.values(h.trackAptitudes)].sort().join(''),[...pattern].sort().join(''));
      if(mare==='mare-burst')assert.equal(h.trackAptitudes.burst,'◎');
      if(mare==='mare-sustained' && pattern==='○○△')assert.equal(h.trackAptitudes.attrition,'△');
      if(mare==='mare-sustained' && pattern==='◎△△')assert.equal(choices.length,2);
      if(pattern==='◎◎○')assert.equal(h.trackAptitudes.burst,'◎');
      if(mare==='mare-unknown')assert.equal(choices.length,6);
    }
    for (const [roll,expected] of [[.1,rows.find(r=>r.id==='sire-burst').genetics],[.6,mother.genetics],[.95,{surfaceGrades:base.surfaceGrades,distance:{min:base.distMin,core:base.coreDist,max:base.distMax}}]]) {
      let choices;
      R.next=()=>roll;
      R.weightedPick=(items,weight)=>{if(items[0]?.pattern)return items.find(r=>r.pattern==='◎○△');if(items[0]?.values){choices=items;return items[0];}return original.pick(items,weight);};
      const h=B.createPair(lib,'sire-burst','mare-sustained','roguelike').generate({strengthProfile:'champion'});
      assert.deepEqual(copy(h.surfaceGrades),copy(expected.surfaceGrades));
      assert.deepEqual([h.distMin,h.coreDist,h.distMax],[expected.distance.min,expected.distance.core,expected.distance.max]);
      assert.notEqual(h.temperamentLabel,'极端暴躁');
      if(roll===.95)assert.equal(choices.length,6);
    }
  } finally {H.generateHorse=original.generate;H.generatePeak=original.peak;R.next=original.next;R.weightedPick=original.pick;}
});

test('近亲禁止、重复祖先去重、缺失资料与只读公开简评',()=>{
  const B=n.BloodlineSystem;
  const close=B.createLibrary([{id:'a',gender:'牡马'},{id:'f',gender:'牡马',fatherId:'a'},{id:'m',gender:'牝马',fatherId:'a'}]);
  assert.throws(()=>B.createPair(close,'f','m','roguelike').generate(),/近亲/);
  const lib=B.createLibrary(fixtures.records,fixtures.nicks),cross=B.createPair(lib,'sire-burst','mare-cross','roguelike');
  assert(cross.preview.legal);assert.equal(cross.preview.risk.level,'高');
  assert.equal(new Set(cross.preview.factorSources.map(f=>f.id+f.trait)).size,cross.preview.factorSources.length);
  const h=cross.generate({seed:73}),before=JSON.stringify(h),publicData=n.CareerBloodline.routeSummary(h.pedigree);
  assert(!/quality|stability|rawStrength|trackAptitudes|surfaceGrades/.test(JSON.stringify(publicData)));
  const other=cross.generate({seed:74});assert.deepEqual(publicData,n.CareerBloodline.routeSummary(other.pedigree));
  n.Random.withSource(()=>{throw Error('Unexpected random');},()=>n.CareerBloodline.routeSummary(JSON.parse(before).pedigree));
  assert.equal(JSON.stringify(h),before);
  const missing=B.createPair(lib,'sire-burst','mare-unknown','roguelike');
  assert(missing.preview.risk.incomplete);assert(n.CareerBloodline.routeSummary(missing.generate({seed:75}).pedigree).warnings.length);
});

test('刷新失败不扣券；鉴定、调教和读档保留出生快照及旧候选',()=>{
  const S=n.RoguelikeRules,s=S.createSave();s.profile.consumables={reroll:1,reappraise:1,adaptation:1};s.run=S.createRun(s.profile);
  const c=s.run.candidates[0],before=JSON.stringify(c.horse.pedigree),old=n.CareerBloodline.generate;
  try {n.CareerBloodline.generate=()=>({...c.horse,surfaceGrades:{grass:'G',dirt:'G'}});assert.equal(S.useRefreshConsumable(s,c.id,'reroll').ok,false);assert.equal(s.profile.consumables.reroll,1);assert.equal(s.run.candidates[0].id,c.id);}finally{n.CareerBloodline.generate=old;}
  assert(S.useReviewConsumable(s,c.id,'reappraise').ok);assert.equal(JSON.stringify(c.horse.pedigree),before);
  assert(S.selectCandidate(s,c.id).ok);
  s.run.selectedCandidate.horse.surfaceGrades.dirt='C';
  assert(S.useAdaptationConsumable(s,'dirt').ok);assert(s.run.selectedCandidate.horse.bloodlineAdapted);
  assert.equal(JSON.stringify(s.run.selectedCandidate.horse.pedigree),before);
  const restored=n.Random.withSource(()=>{throw Error('Unexpected random');},()=>S.normalizeSave(copy(s)));
  assert.equal(JSON.stringify(restored.run.selectedCandidate.horse.pedigree),before);
  delete restored.run.selectedCandidate.horse.pedigree;
  const legacy=S.normalizeSave(copy(restored));assert.equal(legacy.run.selectedCandidate.horse.pedigree,undefined);
});
