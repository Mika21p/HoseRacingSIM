const fs=require('node:fs'),{performance}=require('node:perf_hooks');
const {loadChairmanRules}=require('../tests/helpers/project-loader');
const opt=Object.fromEntries(process.argv.slice(2).map(v=>v.replace(/^--/,'').split('=')));
const seeds=(opt.seeds||'123,43127,995173,77,20260921').split(',').map(Number),years=Number(opt.years||20);
const scenarios=opt.packs==='japan'?[['japan']]:opt.packs==='combined'?[['japan','usa','britain','france','ireland','germany','italy']]:[['japan'],['japan','usa','britain','france','ireland','germany','italy']];
const fingerprint=require('node:crypto').createHash('sha256').update(['js/rules/chairman-world.js','js/rules/chairman.js','js/rules/chairman-breeding.js','js/rules/horse-generator.js','js/data/chairman-venue-records.js','js/data/chairman-venues.js'].map(f=>fs.readFileSync(f,'utf8')).join('')).digest('hex');
const n=loadChairmanRules().rules,W=n.ChairmanRules,report={generatedAt:new Date().toISOString(),years,seeds,runs:[]};
fs.mkdirSync('artifacts',{recursive:true});const filename=`artifacts/chairman-world-${opt.packs||'all'}-${years}years${opt.tag?'-'+opt.tag:''}.json`;
for(const regionKeys of scenarios)for(const seed of seeds){
 const start=performance.now();let w=W.createWorld({worldType:'reference',regionKeys,seed}),ms=[],count=0;
 const run={seed,fingerprint,regionKeys,initialActive:w.horses.filter(h=>h.status==='active').length,years:[]};report.runs.push(run);
 for(let y=1;y<=years;y++){
  const totals=Object.fromEntries(w.regions.map(r=>[r.id,{name:r.name,scheduled:0,completed:0,g1:0,g1Runners:0}]));
  while(w.phase!=='yearEnd'){
   const before=performance.now(),out=W.advanceHalfMonth(w);ms.push(performance.now()-before);w=out.world;
   const used=new Set();for(const p of out.performances){if(used.has(p.horseId))throw Error('同半月重复出赛');used.add(p.horseId);count++;}
   for(const r of out.occurrences){if(r.race.support)continue;const t=totals[r.race.regionId];t.scheduled++;t.completed+=r.status==='completed'?1:0;if(r.raceClass==='g1'){t.g1++;t.g1Runners+=r.count;}}
  }
  const rows=Object.values(totals).map(r=>({...r,completion:r.completed/Math.max(1,r.scheduled),g1Average:r.g1Runners/Math.max(1,r.g1)}));
  run.years.push({year:y,regions:rows,active:w.horses.filter(h=>h.status==='active').length});
  const out=W.finishYear(w);w=out.world;W.validateWorld(w);
  run.elapsedMs=Math.round(performance.now()-start);run.performances=count;run.totalHorses=w.horses.length;const ordered=ms.slice().sort((a,b)=>a-b);run.halfMonthMs={median:Math.round(ordered[Math.floor(ordered.length/2)]),p95:Math.round(ordered[Math.floor(ordered.length*.95)]),max:Math.round(ordered.at(-1))};
  fs.writeFileSync(filename,JSON.stringify(report,null,2));
  console.log(regionKeys.length===1?'Japan':'Combined',seed,y,rows.map(r=>`${r.name}:${(r.completion*100).toFixed(1)}% G1:${r.g1Average.toFixed(1)}`).join(' '));
 }
 const st=performance.now(),serialized=JSON.stringify(w);run.worldSerializeMs=Math.round(performance.now()-st);run.worldMiB=+(Buffer.byteLength(serialized)/1048576).toFixed(2);
}
report.passed=report.runs.every(r=>r.years.filter(y=>y.year>=3).every(y=>y.regions.every(r=>r.completion>=.9&&(!r.g1||r.g1Average>=8))));
fs.writeFileSync(filename,JSON.stringify(report,null,2));console.log(filename,'targets:',report.passed?'PASS':'REQUIRES TUNING');
