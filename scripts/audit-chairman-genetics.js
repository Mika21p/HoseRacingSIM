const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {loadChairmanRules}=require('../tests/helpers/project-loader');
const p=loadChairmanRules(),n=p.rules,R=n.Random,B=n.BloodlineSystem;
vm.runInContext(fs.readFileSync('js/data/bloodline-lab-fixtures.js','utf8'),p.context);
const clone=x=>JSON.parse(JSON.stringify(x)),mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
const stats=a=>{const s=a.slice().sort((a,b)=>a-b),m=mean(a);return {mean:m,sd:Math.sqrt(mean(a.map(v=>(v-m)**2))),p10:s[Math.floor(s.length*.1)],p50:s[Math.floor(s.length*.5)],p90:s[Math.floor(s.length*.9)]};};
const result={version:2,distribution:[],generations:[],failures:[]},check=(ok,label,data)=>{if(!ok)result.failures.push({label,...data});};
const save=()=>fs.writeFileSync('artifacts/chairman-genetics-distributions.json',JSON.stringify(result,null,2));
const fixture=n.BloodlineLabFixtures;
for(const theory of [false,true])for(const q of [30,60,90])for(const s of [35,60,80]){
 const records=theory?clone(fixture.records):[{id:'f',gender:'牡马'},{id:'m',gender:'牝马'}];
 const f=theory?'sire-burst':'f',m=theory?'mare-sustained':'m';
 for(const h of records){h.genetics||={};h.genetics.quality=q;h.genetics.stability=s;}
 const pair=B.createPair(B.createLibrary(records,theory?fixture.nicks:[]),f,m,'chairman'),values=[],ordinary=[],qualities=[],stabilities=[],patterns={};let breaks=0,excellent=0;
 R.withSource(R.seeded(43127),()=>{for(let i=0;i<10000;i++){const h=pair.generate();values.push(h.strength);if(!h.breedingOutcome.breakthrough)ordinary.push(h.strength);else breaks++;excellent+=+h.breedingOutcome.excellent;qualities.push(h.genetics.quality);stabilities.push(h.genetics.stability);const pattern=h.breedingOutcome.pattern;patterns[pattern]=(patterns[pattern]||0)+1;assert(h.strength>=62&&h.strength<=100);assert(h.genetics.factors.length<=2);}});
 const row={theory,q,s,ability:stats(values),ordinary:stats(ordinary),quality:stats(qualities),stability:stats(stabilities),ninety:values.filter(v=>v>=90).length/10000,ninetyFive:values.filter(v=>v>=95).length/10000,breakthrough:breaks/10000,excellent:excellent/10000,patterns,expected:clone(pair.preview.trackPlan?.combinations||pair.preview.trackCombination?.combinations||[])};
 // The preview is the same table consumed by generation.
 const plan=pair.generate({seed:17}).pedigree.trackPlan;row.expected=clone(plan.combinations);
 check(Math.abs(row.breakthrough-.03)<=4*Math.sqrt(.03*.97/10000),'breakthrough probability',{q,s,theory});
 for(const c of plan.combinations)check(Math.abs((patterns[c.pattern]||0)/10000-c.probability)<=4*Math.sqrt(c.probability*(1-c.probability)/10000),'pattern probability',{q,s,theory,pattern:c.pattern});
 check(Math.abs(row.quality.mean-Math.round(50+.65*(q-50)))<.35,'quality regression',{q,s,theory});check(Math.abs(row.stability.mean-Math.round(50+.6*(s-50)))<.35,'stability regression',{q,s,theory});
 result.distribution.push(row);save();console.log('distribution',theory,q,s,row.ability.mean.toFixed(2));
}
for(const theory of [false,true]){for(const s of [35,60,80]){const rows=result.distribution.filter(r=>r.theory===theory&&r.s===s);check(rows[2].ability.mean-rows[0].ability.mean>=8,'Q separation',{theory,s});}for(const q of [30,60,90]){const rows=result.distribution.filter(r=>r.theory===theory&&r.q===q);check(rows[2].ordinary.sd<rows[0].ordinary.sd,'stability variance',{theory,q});}}
// Isolated genetic trials. Selection uses simulated public race results, never Q or S.
for(const seed of [123,43127,995173])for(const selection of ['random','public'])for(const kinship of [false,true]){
 R.withSource(R.seeded(seed),()=>{
  let serial=0,all=new Map();const newRoot=gender=>({id:'g'+serial++,gender,name:'始祖',genetics:{quality:50+R.rollMulti(2,26)-27,stability:60+R.rollMulti(2,21)-22,lineId:'fictional:'+serial,factors:[]},publicScore:50});
  let parents=Array.from({length:1000},(_,i)=>newRoot(i%2?'牝马':'牡马'));parents.forEach(h=>all.set(h.id,h));const run={seed,selection,kinship,years:[],rejected:0,supplements:0};
  for(let generation=1;generation<=30;generation++){
   const library=B.createLibrary([...all.values()]),sires=parents.filter(h=>h.gender==='牡马'),mares=parents.filter(h=>h.gender==='牝马'),children=[];
   for(let i=0;i<1000;i++){
    const pick=pool=>selection==='public'&&R.next()<.8?R.weightedPick(pool,h=>1+h.publicScore/25):R.pickOne(pool);let f,m,pair;
    for(let attempts=0;attempts<1000;attempts++){f=pick(sires);m=pick(mares);pair=B.createPair(library,f.id,m.id,'chairman');if(!kinship||pair.preview.legal)break;run.rejected++;}
    if(!kinship&&!pair.preview.legal){const basic=B.createLibrary([f,m].map(h=>({...h,fatherId:null,motherId:null})));pair=B.createPair(basic,f.id,m.id,'chairman');}
    assert(pair.preview.legal,'legal population exhausted');const h=pair.generate();const child={id:'g'+serial++,name:'后代',gender:i%2?'牝马':'牡马',fatherId:kinship?f.id:null,motherId:kinship?m.id:null,genetics:h.genetics,strength:h.strength};children.push(child);
   }
   for(const h of children){h.lifetime={starts:1,wins:h.strength>=82?1:0,g1:h.strength>=92?1:0,prize:(h.strength-62)*10};h.annual={suggested:h.strength};h.breeding={strength:h.genetics.quality};all.set(h.id,h);}
   const publicWorld={revision:generation,horses:children,pedigrees:[]};const assessments=n.ChairmanGenetics.evaluate(publicWorld);for(const h of children)h.publicScore=assessments.get(h.id).score;
   run.years.push({generation,ability:stats(children.map(h=>h.strength)),quality:stats(children.map(h=>h.genetics.quality)),stability:stats(children.map(h=>h.genetics.stability))});parents=children;
   // Keep the complete relevant four-generation horizon, not unrelated historic cohorts.
   const keep=new Set();function visit(id,depth){if(!id||depth>4||keep.has(id))return;keep.add(id);const h=all.get(id);if(h){visit(h.fatherId,depth+1);visit(h.motherId,depth+1);}}parents.forEach(h=>visit(h.id,0));all=new Map([...all].filter(([id])=>keep.has(id)).map(([id,h])=>[id,{...h,fatherId:keep.has(h.fatherId)?h.fatherId:null,motherId:keep.has(h.motherId)?h.motherId:null}]));
  }
  const early=selection==='random'?run.years.slice(0,5):run.years.slice(10,15);run.drift=mean(run.years.slice(-5).map(y=>y.ability.mean))-mean(early.map(y=>y.ability.mean));check(selection==='random'?Math.abs(run.drift)<=3:run.drift<=3,'generation drift',{seed,selection,kinship,drift:run.drift});result.generations.push(run);save();console.log('generations',seed,selection,kinship,run.drift.toFixed(2));
 });
}
result.passed=!result.failures.length;save();if(!result.passed)process.exitCode=1;
