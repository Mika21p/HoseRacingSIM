'use strict';
const fs=require('fs'),vm=require('vm'),crypto=require('crypto'),{performance}=require('perf_hooks');
const {loadChairmanRules}=require('../tests/helpers/project-loader');
const files={stage7:'artifacts/chairman-stage8-baseline-world.js',stage8:'artifacts/chairman-stage9-baseline-world.js',stage9:'js/rules/chairman-world.js'},rows=[];
for(let repeat=0;repeat<2;repeat++)for(const label of (repeat?Object.keys(files).reverse():Object.keys(files))){
 const p=loadChairmanRules();vm.runInContext(fs.readFileSync(files[label],'utf8'),p.context);const W=p.rules.ChairmanRules;
 let w=W.createWorld({id:'stage9-bench',worldType:'reference',regionKeys:['japan','usa'],population:{japan:1000,usa:752},annualTargets:{japan:250,usa:188},foundation:false,breeding:false,seed:123,development:true});
 const ms=[];let starts=0,completed=0;for(let turn=0;turn<6;turn++){const t=performance.now(),o=W.advanceHalfMonth(w);ms.push(performance.now()-t);w=o.world;starts+=o.performances.length;completed+=o.occurrences.filter(e=>e.status==='completed').length;}
 rows.push({label,repeat,ms,starts,completed,worldHash:crypto.createHash('sha256').update(JSON.stringify(w)).digest('hex')});
}
const report={scope:'Six half-months, seed123, alternating order, no audit observer or diagnostic scan; rule advance only',hashes:Object.fromEntries(Object.entries(files).map(([k,f])=>[k,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')])),rows};
fs.writeFileSync('artifacts/chairman-stage9-performance.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
