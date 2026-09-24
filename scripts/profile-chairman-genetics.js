const fs=require('node:fs'),vm=require('node:vm'),{performance}=require('node:perf_hooks'),{loadChairmanRules}=require('../tests/helpers/project-loader');
const p=loadChairmanRules(),n=p.rules,W=n.ChairmanRules,modern=n.ChairmanBreeding;
vm.runInContext(fs.readFileSync('artifacts/chairman-breeding-before-v2.js','utf8'),p.context);const legacy=n.ChairmanBreeding;n.ChairmanBreeding=modern;
const report=[];
for(const regionKeys of [['japan'],['japan','usa','britain','france','ireland','germany','italy']]){
 const w=W.createWorld({worldType:'reference',regionKeys,seed:123});
 const run={regionKeys,horses:w.horses.length,ancestors:w.pedigrees.length,old:[],current:[],parts:[]};
 for(const [kind,B]of [['old',legacy],['current',modern]])for(let i=0;i<3;i++){
  const c=W.clone(w);if(kind==='old')c.breeding.version=1;n.ChairmanBreeding=B;
  const parts={};const originals={};if(kind==='current')for(const key of ['plan','inherited','report']){originals[key]=n.ChairmanGenetics[key];n.ChairmanGenetics[key]=function(...args){const t=performance.now();try{return originals[key](...args);}finally{parts[key]=(parts[key]||0)+performance.now()-t;}};}
  const t=performance.now(),out={},locked=B.closeYear(c,out);c.turn=24;B.startYear(c,out,locked);run[kind].push(performance.now()-t);if(kind==='current'){run.worldMiB=Buffer.byteLength(JSON.stringify(c))/1048576;run.annualHistoryMiB=Buffer.byteLength(JSON.stringify(out))/1048576;for(const key in originals)n.ChairmanGenetics[key]=originals[key];run.parts.push(parts);}
 }
 n.ChairmanBreeding=modern;const median=a=>a.slice().sort((a,b)=>a-b)[1];run.limit=Math.max(2000,median(run.old)*2);run.passed=median(run.current)<=run.limit;report.push(run);fs.writeFileSync('artifacts/chairman-genetics-performance.json',JSON.stringify(report,null,2));console.log(JSON.stringify(run));
}
if(report.some(r=>!r.passed))process.exitCode=1;
