'use strict';
const fs=require('node:fs'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const {loadChairmanRules}=require('../tests/helpers/project-loader'),D=require('./audit-chairman-double-population'),A=require('./lib/chairman-scheduling-audit');
function main(){
 const directory='artifacts/chairman-double-population',file=directory+'/usa-extra-maiden-s123.json';assert(!fs.existsSync(file),'choose a fresh output; diagnostic already exists');
 const initial=JSON.parse(zlib.gunzipSync(fs.readFileSync(directory+'/usa-s123.initial.gz'))),n=loadChairmanRules().rules,W=n.ChairmanRules,V=n.ChairmanWorld;
 assert.equal(initial.source.fingerprint,A.manifest().fingerprint);let w=initial.world;const horseHash=A.hash(w.horses),baseNamed=w.races.filter(r=>!r.support).length,added=[];
 for(let turn=0;turn<24;turn++)for(const surface of ['草地','泥地']){const track=w.tracks.find(t=>t.surfaces.includes(surface)),date=W.date(turn);const r=V.sourceRace(w,{id:`audit-maiden:${turn}:${surface}`,name:`诊断二岁${surface}未胜利`,raceClass:'maiden',surface,distance:[1200,1600,2000,2400][turn%4],month:date.month,half:date.half,ageRestriction:{type:'exact',age:2}},track,{support:true,demandDriven:true,sourceNote:'仅用于新马出口诊断'});W.validateRace(w,r);w.races.push(r);added.push(r.id);}
 assert.equal(A.hash(w.horses),horseHash);assert.equal(w.races.filter(r=>!r.support).length,baseNamed);V.plan(w);W.validateWorld(w);
 const m=D.newYear(n,w);for(let i=0;i<24;i++){const out=W.advanceHalfMonth(w);D.observe(n,w,out,m);w=out.world;}
 m.verdict=D.verdict(m);const report={status:'complete',id:'usa-extra-maiden-s123',source:{...A.manifest(),runner:A.hash(fs.readFileSync(__filename,'utf8'))},initialSource:initial.source,initialHorseHash:horseHash,config:{scenario:'usa',seed:123,years:1,factor:2,addedTwoYearOldMaidens:48,extraHorses:0},initial:D.cohorts(n,initial.world),addedRaceIds:added,years:[m],worldHash:A.hash(w)};fs.writeFileSync(file,JSON.stringify(report,null,2));console.log(JSON.stringify({file,criteria:m.criteria,youngStarts:m.youngStarts,youngWins:m.youngWins,verdict:m.verdict}));
}
if(require.main===module)main();
