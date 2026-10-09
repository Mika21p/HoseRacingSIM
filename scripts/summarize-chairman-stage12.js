'use strict';
// Recompute formal-race denominators from retained history; audit starts includes support races.
const fs=require('fs'),crypto=require('crypto');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const report={};
for(const mode of ['all','breeding','breeding-check']){
 const base='artifacts/chairman-stage12-'+mode, audit=JSON.parse(fs.readFileSync(base+'.json')),bundle=JSON.parse(fs.readFileSync(base+'-yearend.json'));
 const events=new Map(bundle.records.occurrences.map(e=>[e.id,e])),regions=new Map(bundle.world.regions.map(r=>[r.id,r]));
 const sources=Object.entries(audit.sourceHashes).map(([p,h])=>{const file=mode==='breeding'&&p==='scripts/audit-chairman-stage12.js'?'artifacts/chairman-stage12-audit-v1.js':p;return {file,match:hash(file)===h};});
 if(sources.some(s=>!s.match))throw Error('Source mismatch '+JSON.stringify(sources.filter(s=>!s.match)));
 const years=audit.results.map(y=>{
  const formal=bundle.records.performances.filter(p=>{const e=events.get(p.occurrenceId);return e.year===y.year&&!e.race.support;});
  const byRegion=Object.fromEntries([...regions].map(([id,r])=>{
   const p=formal.filter(p=>p.regionId===id),graded=p.filter(p=>['g1','g2','g3'].includes(p.raceClass)),foreign=p.filter(p=>p.homeRegionId!==id);
   const hosted=bundle.records.occurrences.filter(e=>e.year===y.year&&!e.race.support&&e.race.regionId===id);
   return [r.name,{formalStarts:p.length,rated:p.filter(p=>p.tf!=null).length,graded:graded.length,gradedRated:graded.filter(p=>p.tf!=null).length,foreign:foreign.length,sameGroupForeign:foreign.filter(p=>regions.get(p.homeRegionId)?.trafficGroup===r.trafficGroup).length,low:p.filter(p=>p.tf!=null&&p.tf<40).length,high:p.filter(p=>p.tf>140).length,deficient:hosted.filter(e=>e.count<(e.raceClass==='g1'&&e.race.prestige>=85?8:5)).map(e=>({name:e.name,count:e.count,age:e.race.ageRule,sex:e.race.sexRule,distance:e.race.distance,surface:e.race.surface,grade:e.raceClass}))}];
  }));
  return {year:y.year,regions:byRegion};
 });
 report[mode]={fingerprint:audit.fingerprint,sourcesVerified:sources.length,years};
}
fs.writeFileSync('artifacts/chairman-stage12-summary.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
