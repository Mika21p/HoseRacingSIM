'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const n=require('../tests/helpers/project-loader').loadChairmanRules().rules;
const {createScorer}=require('./lib/chairman-tf-prototype');
const S=n.ChairmanRatings,mean=a=>a.reduce((s,x)=>s+x,0)/a.length,round=x=>Math.round(x*100)/100;
const race={id:'small-check',raceClass:'op',surface:'草地',distance:1600};
function scorer(){return createScorer(S,{durableReference:true});}
function seedForm(p,id,tf,turn=0,surface='草地',distance=1600,root='seed'){p.history.set(id,[{tf,turn,surface,distance,roots:[root],depth:0}]);}
function field(ids){return ids.map((horseId,i)=>({horseId,rank:i+1,margin:i*2}));}
function isolated(kind){
 const p=scorer(),rows=field(['new-a','anchor','new-b','new-c']);
 const target=kind==='wrong-condition'?{...race,surface:'泥地',distance:2800}:race;
 const tf=kind==='high'?140:100,turn=kind==='stale'||kind==='wrong-condition'?48:3;
 seedForm(p,'anchor',tf);
 const form=p.form('anchor',target,turn),events=[];
 for(let i=0;i<4;i++){const t=turn+i*3,r=p.rate(target,rows,t);p.record(target,rows,t,r);events.push({race:i+1,winner:r.rawWinnerRating,confidence:r.confidence,rootCount:r.roots.length,depth:r.depth});}
 return {kind,initialWeight:form.weight,events};
}
function multiple(){
 const p=scorer(),rows=field(['a','b','c','d']);
 for(const [i,r] of rows.entries())seedForm(p,r.horseId,100-i*5,0,'草地',1600,'independent-'+i);
 seedForm(p,'b',135,0,'草地',1600,'bad');
 const r=p.rate(race,rows,3);assert.ok(Math.abs(r.rawWinnerRating-100)<1e-9);
 return {winner:r.rawWinnerRating,roots:r.roots,confidence:r.confidence};
}
function turnover(seed,mode){
 const rng=n.Random.seeded(seed),p=scorer(),ids=Array.from({length:12},(_,i)=>'initial-'+i),events=[];
 for(let k=0;k<48;k++){
  if(mode==='turnover'&&k>0&&k%12===0)for(let j=0;j<4;j++){const slot=((k/12-1)*4+j)%12;ids[slot]=`generation-${k}-${slot}`;}
  const growth=mode==='common-growth'?12*k/47:0;
  const entrants=ids.map((id,i)=>({id,truth:70+i*1.5+growth,perf:70+i*1.5+growth+(rng()-.5)*6})).sort((a,b)=>b.perf-a.perf);
  const rows=entrants.map((h,i)=>({horseId:h.id,rank:i+1,margin:(entrants[0].perf-h.perf)/2.5}));
  const r={...race,raceClass:k?'op':'new'},t=k*3,out=p.rate(r,rows,t);p.record(r,rows,t,out);
  assert.equal(Object.keys(out.ratings).length,12);
  events.push({turn:t,mean:mean(Object.values(out.rawRatings)),truth:mean(entrants.map(h=>h.truth)),values:entrants.map(h=>out.rawRatings[h.id])});
 }
 const start=events.slice(0,12),end=events.slice(-12);
 return {seed,mode,drift:round(mean(end.map(r=>r.mean))-mean(start.map(r=>r.mean))),truthChange:round(mean(end.map(r=>r.truth))-mean(start.map(r=>r.truth))),series:events.map(r=>round(r.mean)),allScores:events.map(r=>r.values)};
}
function main(){
 const report={scope:{seeds:[123,43127],horses:12,racesPerScenario:48,scenarios:3,controlledRaces:288,extraAnchorRaces:17,fullWorldSimulations:0},sourceHash:crypto.createHash('sha256').update(fs.readFileSync('scripts/lib/chairman-tf-prototype.js')).digest('hex'),isolated:['fresh','stale','wrong-condition','high'].map(isolated),multiple:multiple(),controlled:[]};
 for(const seed of report.scope.seeds){const runs=['fixed','turnover','common-growth'].map(m=>turnover(seed,m));
  assert.deepEqual(runs[0].allScores,runs[2].allScores,'Common growth cannot be distinguished from identical margins');
  report.controlled.push(...runs.map(({allScores,...r})=>r));
 }
 fs.writeFileSync('artifacts/chairman-tf-small-check.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
if(require.main===module)main();
