const fs=require('node:fs'),assert=require('node:assert/strict'),{performance}=require('node:perf_hooks');
const {loadChairmanRules}=require('../tests/helpers/project-loader');
const opt=Object.fromEntries(process.argv.slice(2).map(v=>v.replace(/^--/,'').split('=')));
const seeds=(opt.seeds||'123,43127,995173,77,20260921').split(',').map(Number),years=+(opt.years||50);
const keys=opt.packs==='combined'?['japan','usa','britain','france','ireland','germany','italy']:['japan'];
const project=loadChairmanRules(),n=project.rules,W=n.ChairmanRules,B=n.ChairmanBreeding,G=n.ChairmanGenetics;
let breedingMs=0;for(const key of ['closeYear','startYear']){const original=B[key];B[key]=function(...args){const t=performance.now();try{return original(...args);}finally{breedingMs+=performance.now()-t;}};}
const mean=a=>a.reduce((s,v)=>s+v,0)/Math.max(1,a.length),median=a=>a.slice().sort((a,b)=>a-b)[Math.floor(a.length/2)];
const fingerprint=require('node:crypto').createHash('sha256').update(['js/rules/chairman.js','js/rules/chairman-world.js','js/rules/chairman-genetics.js','js/rules/chairman-breeding.js','js/rules/bloodline-system.js'].map(p=>fs.readFileSync(p)).join('')).digest('hex');
const report={version:2,fingerprint,generatedAt:new Date().toISOString(),seeds,years,regionKeys:keys,runs:[],failures:[]};
const filename=`artifacts/chairman-genetics-${opt.packs||'japan'}-${seeds.join('-')}-${years}years.json`;
const save=()=>fs.writeFileSync(filename,JSON.stringify(report,null,2));fs.mkdirSync('artifacts',{recursive:true});
for(const seed of seeds){
 const checkpoint=`artifacts/chairman-genetics-${opt.packs||'japan'}-${seed}${opt.checkpointTag?'-'+opt.checkpointTag:''}-checkpoint.json.gz`,zlib=require('node:zlib');
 const restored=opt.resume==='1'&&fs.existsSync(checkpoint)?JSON.parse(zlib.gunzipSync(fs.readFileSync(checkpoint))):null;
 if(restored)assert.equal(restored.fingerprint,fingerprint,'checkpoint uses a different implementation');
 let w=restored?.world||W.createWorld({worldType:'reference',regionKeys:keys,seed});const run=restored?.run||{seed,years:[]},initialLines=new Set(restored?.initialLines||B.all(w).map(h=>h.genetics?.lineId).filter(Boolean)),start=performance.now()-(restored?.run.elapsedMs||0);report.runs.push(run);report.failures.push(...(restored?.failures||[]));
 for(let y=run.years.length+1;y<=years;y++){
  const yearStart=opt.trace?w:null;
  const totals=Object.fromEntries(w.regions.map(r=>[r.id,{name:r.name,scheduled:0,completed:0,g1:0,g1Runners:0}]));
  let historyBytes=0;const cancelled=[];
  while(w.phase!=='yearEnd'){
   const before=w,out=W.advanceHalfMonth(w);w=out.world;
   const ids=new Set();for(const p of out.performances){assert(!ids.has(p.horseId),'duplicate runner');ids.add(p.horseId);assert(W.ageOf(before,B.get(before,p.horseId))>=2,'underage runner');}
   for(const r of out.occurrences){if(r.race.support)continue;const t=totals[r.race.regionId];t.scheduled++;t.completed+=r.status==='completed'?1:0;if(r.raceClass==='g1'){t.g1++;t.g1Runners+=r.count;}if(r.status!=='completed')cancelled.push({turn:before.turn,event:r});}

   historyBytes+=Buffer.byteLength(JSON.stringify({...out,world:undefined}));
  }
  breedingMs=0;const before=w,t=performance.now(),out=W.finishYear(w),settleMs=performance.now()-t,geneticMs=breedingMs;w=out.world;W.validateWorld(w);
  // A mid-run save/load has exactly the same next-year transaction, including reports and RNG.
  if(y===3){const replay=W.finishYear(JSON.parse(JSON.stringify(before)));assert.deepEqual(JSON.parse(JSON.stringify(replay)),JSON.parse(JSON.stringify(out)),'save/load divergence');}
  const events=out.breedingEvents,quotas=B.quotas(before),mothers=new Set(),usage=new Map(),counts={},lines={},aptitudes={},births=events.map(e=>B.get(w,e.horseId));
  for(const e of events){assert(!mothers.has(e.motherId),'duplicate mare');mothers.add(e.motherId);assert(G.pair(w,e.fatherId,e.motherId).preview.legal,'forbidden mating');const key=e.fatherId+'|'+e.homeRegion;usage.set(key,(usage.get(key)||0)+1);if(!e.manual)assert(usage.get(key)<=Math.max(1,Math.floor(quotas[e.homeRegion]*.2)),'sire cap');counts[e.homeRegion]=(counts[e.homeRegion]||0)+1;}
  for(const [r,q]of Object.entries(quotas))assert.equal(counts[r]||0,q,'annual quota');
  for(const h of births){const id=h.genetics.lineId||'unknown:'+h.id;lines[id]=(lines[id]||0)+1;const a=h.homeRegion+':'+Object.values(h.trackAptitudes).sort().join('');aptitudes[a]=(aptitudes[a]||0)+1;assert.equal(h.genetics.quality,h.breeding.strength);}
  const regions=Object.values(totals).map(r=>({...r,completion:r.completed/Math.max(1,r.scheduled),g1Average:r.g1Runners/Math.max(1,r.g1)}));
  if(y>=3)for(const r of regions)if(r.completion<.9||r.g1&&r.g1Average<8)report.failures.push({seed,year:y,type:'race-population',region:r});
  if(opt.trace&&report.failures.some(f=>f.seed===seed&&f.year===y)){const prefix='artifacts/chairman-gap-'+seed+'-'+y;fs.writeFileSync(prefix+'-year-start.json',JSON.stringify(yearStart));fs.writeFileSync(prefix+'-events.json',JSON.stringify(cancelled,null,2));}
  const stats=out.breedingReports[0],known=Object.entries(lines).filter(([id])=>!id.startsWith('fictional:')&&!id.startsWith('unknown:'));
  const row={year:y,regions,births:births.length,ability:mean(births.map(h=>h.strength)),quality:mean(births.map(h=>h.genetics.quality)),stability:mean(births.map(h=>h.genetics.stability)),lines,knownMaximumShare:Math.max(0,...known.map(([,v])=>v))/Math.max(1,births.length),effectiveLines:births.length**2/Math.max(1,Object.values(lines).reduce((s,v)=>s+v*v,0)),initialLinesSurviving:Object.keys(lines).filter(id=>initialLines.has(id)).length,nonG1SireShare:mean(events.map(e=>B.get(w,e.fatherId).lifetime.g1?0:1)),maternalFamilies:stats.maternalFamilies.length,maternalContinuing:stats.maternalFamilies.filter(f=>f.generations>=2).length,supplements:stats.supplements,aptitudes,settleMs:Math.round(settleMs),breedingMs:Math.round(geneticMs),worldMiB:Buffer.byteLength(JSON.stringify(w))/1048576,historyMiB:historyBytes/1048576};
  run.years.push(row);run.elapsedMs=performance.now()-start;save();fs.writeFileSync(checkpoint+'.tmp',zlib.gzipSync(JSON.stringify({fingerprint,world:w,run,initialLines:[...initialLines],failures:report.failures.filter(f=>f.seed===seed)}),{level:1}));fs.renameSync(checkpoint+'.tmp',checkpoint);console.log(keys.length===1?'Japan':'Combined',seed,y,'mean',row.ability.toFixed(2),'settle',row.settleMs,'ms');if(report.failures.some(f=>f.seed===seed&&f.year===y)){console.error('Hard gate failed; checkpoint and reproduction saved.');process.exit(1);}
 }
 run.settleMedianMs=median(run.years.map(y=>y.settleMs));
 run.breedingMedianMs=median(run.years.map(y=>y.breedingMs));
 if(years>=50&&seed===123){
  require('node:vm').runInContext(fs.readFileSync('artifacts/chairman-breeding-before-v2.js','utf8'),project.context);const old=n.ChairmanBreeding;n.ChairmanBreeding=B;
  run.performance={old:[],current:[]};
  for(const [kind,engine]of [['old',old],['current',B]])for(let i=0;i<3;i++){
   const copy=W.clone(w);if(kind==='old')copy.breeding.version=1;n.ChairmanBreeding=engine;const t=performance.now(),out={},locked=engine.closeYear(copy,out);copy.turn+=24;engine.startYear(copy,out,locked);run.performance[kind].push(performance.now()-t);
  }
  n.ChairmanBreeding=B;run.performance.limit=Math.max(2000,2*median(run.performance.old));run.performance.passed=median(run.performance.current)<=run.performance.limit;if(!run.performance.passed)report.failures.push({seed,type:'performance',...run.performance});
 }

 if(years>=50){run.lateAbilityGrowth=mean(run.years.slice(40,50).map(y=>y.ability))-mean(run.years.slice(10,20).map(y=>y.ability));run.lateKnownMaximumShare=mean(run.years.slice(40,50).map(y=>y.knownMaximumShare));if(run.lateAbilityGrowth>3)report.failures.push({seed,type:'ability-drift',value:run.lateAbilityGrowth});if(run.lateKnownMaximumShare>.5)report.failures.push({seed,type:'line-concentration',value:run.lateKnownMaximumShare});}
 save();
}
report.passed=!report.failures.length;save();console.log(filename,report.passed?'PASS':'FAIL');if(!report.passed)process.exitCode=1;
