'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {source}=require('./audit-chairman-population');
function summarize(directories){
 const fingerprint=source(),runs=[];
 for(const directory of directories)for(const file of fs.readdirSync(directory).filter(x=>x.endsWith('.json')&&x!=='matrix.json')){
  const r=JSON.parse(fs.readFileSync(path.join(directory,file),'utf8'));assert.equal(r.source.fingerprint,fingerprint.fingerprint);assert.equal(r.source.populationRunner,fingerprint.populationRunner);
  runs.push({file:path.join(directory,file).replaceAll('\\','/'),id:r.id,status:r.status,config:r.config,initial:r.initial.map(x=>({name:x.name,initial:x.initial,annual:x.annual})),performance:r.performance,years:r.years.map(y=>({year:y.year,verdict:y.verdict,performances:y.performances,overseasStarts:y.overseasStarts,crossGroupStarts:y.crossGroupStarts,targetDue:y.targetDue,targetStarted:y.targetStarted,violations:y.violations,
   regions:Object.entries(y.regions).map(([id,x])=>({...x,regionId:id,completion:x.scheduled?x.completed/x.scheduled:null,gradedSixRate:x.graded?x.gradedSix/x.graded:null,highG1EightRate:x.highG1?x.highG1Eight/x.highG1:null,active:y.populationEnd.find(x=>x.id===id)?.active})),
   shortFieldReasons:y.shortFields.reduce((s,x)=>(s[x.primary]=(s[x.primary]||0)+1,s),{}),cancellations:y.shortFields.filter(x=>x.status==='cancelled'),smallRegionShortFields:y.shortFields.filter(x=>y.regions[x.regionId].scheduled<=40),
   aggregate:{scheduled:Object.values(y.regions).reduce((s,x)=>s+x.scheduled,0),completed:Object.values(y.regions).reduce((s,x)=>s+x.completed,0),graded:Object.values(y.regions).reduce((s,x)=>s+x.graded,0),gradedSix:Object.values(y.regions).reduce((s,x)=>s+x.gradedSix,0),highG1:Object.values(y.regions).reduce((s,x)=>s+x.highG1,0),highG1Eight:Object.values(y.regions).reduce((s,x)=>s+x.highG1Eight,0)}}))});
 }
 return {generatedAt:new Date().toISOString(),source:fingerprint,runs,completedRuns:runs.filter(x=>['rejected','qualified'].includes(x.status)).length,years:runs.reduce((s,x)=>s+x.years.length,0),violations:runs.flatMap(x=>x.years.flatMap(y=>y.violations)),qualified:runs.filter(x=>x.status==='qualified').map(x=>x.id),caveat:'A qualified single seed is not a qualified population recommendation; use the matrix verdict. Different scenarios are not pooled for acceptance.'};
}
if(require.main===module){const directories=process.argv.slice(2);assert(directories.length);const report=summarize(directories),file='artifacts/chairman-population-stage4-summary.json';fs.writeFileSync(file,JSON.stringify(report,null,2));console.log(JSON.stringify({file,completedRuns:report.completedRuns,years:report.years,violations:report.violations.length,qualified:report.qualified}));}
module.exports={summarize};
