const fs=require('node:fs');
const {loadChairmanRules}=require('../tests/helpers/project-loader');
const n=loadChairmanRules().rules,keys=['burst','sustained','attrition'];
const patterns=['○○△','◎△△','◎○△','○○○','◎○○','◎◎△','◎◎○'];
const pattern=h=>patterns.find(p=>[...p].sort().join('')===Object.values(h.trackAptitudes).sort().join(''));
const parent=grades=>({surfaceGrades:{grass:'A',dirt:'C'},trackAptitudes:Object.fromEntries(keys.map((k,i)=>[k,[...grades][i]]))});
const report={seed:20260922,samplesPerCase:10000,order:'瞬发／持久／消耗',cases:[]};
for(const [name,father,mother] of [['地区随机基线',null,null],['普通同向','○○△','○○△'],['优秀同向','◎○○','◎○○'],['优秀互补','◎○○','○◎○']]){
 const counts=Object.fromEntries(patterns.map(p=>[p,0])),directions=Object.fromEntries(keys.map(k=>[k,0]));let projected=0,noSuitableSurface=0;
 n.Random.withSource(n.Random.seeded(report.seed),()=>{
  for(let i=0;i<report.samplesPerCase;i++){
   const h=n.HorseRules.generateHorse({chairmanProfile:n.ChairmanWorld.defaults()});
   if(father){const original=n.HorseRules.constrainTrackAptitudes;n.HorseRules.constrainTrackAptitudes=raw=>{const out=original(raw);if(keys.some(k=>out[k]!==raw[k]))projected++;return out;};
    try{n.ChairmanBreeding.inheritAptitudes(h,parent(father),parent(mother));}finally{n.HorseRules.constrainTrackAptitudes=original;}}
   const p=pattern(h);if(!p)throw Error('Illegal genotype');counts[p]++;
   for(const k of keys)if(h.trackAptitudes[k]==='◎')directions[k]++;
   if(!Object.values(h.surfaceGrades).some(g=>['A','B'].includes(g)))noSuitableSurface++;
  }
 });
 const percent=v=>Number((v/report.samplesPerCase*100).toFixed(2));
 report.cases.push({name,father,mother,percentages:Object.fromEntries(Object.entries(counts).map(([p,v])=>[p,percent(v)])),strongByDimension:Object.fromEntries(Object.entries(directions).map(([p,v])=>[p,percent(v)])),projectedPercent:percent(projected),noSuitableSurfacePercent:percent(noSuitableSurface)});
}
fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/chairman-aptitude-inheritance.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
