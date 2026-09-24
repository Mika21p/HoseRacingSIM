const fs=require('node:fs'),assert=require('node:assert/strict'),{loadChairmanRules}=require('../tests/helpers/project-loader');
const project=loadChairmanRules(),n=project.rules,R=n.Random,B=n.BloodlineSystem;
const seed=43127,size=500,generations=20;
const mean=a=>a.reduce((s,v)=>s+v,0)/Math.max(1,a.length);
const stats=a=>{const sorted=a.slice().sort((x,y)=>x-y),m=mean(a);return{mean:m,sd:Math.sqrt(mean(a.map(x=>(x-m)**2))),p10:sorted[Math.floor((sorted.length-1)*.1)],p50:sorted[Math.floor((sorted.length-1)*.5)],p90:sorted[Math.floor((sorted.length-1)*.9)],p95:sorted[Math.floor((sorted.length-1)*.95)]};};
const correlation=(x,y)=>{const a=mean(x),b=mean(y),num=mean(x.map((v,i)=>(v-a)*(y[i]-b))),dx=Math.sqrt(mean(x.map(v=>(v-a)**2))),dy=Math.sqrt(mean(y.map(v=>(v-b)**2)));return dx&&dy?num/(dx*dy):0;};
const regressionSlope=rows=>{const xs=rows.map(x=>x.generation),ys=rows.map(x=>x.ability.mean),xm=mean(xs),ym=mean(ys);return xs.reduce((s,x,i)=>s+(x-xm)*(ys[i]-ym),0)/xs.reduce((s,x)=>s+(x-xm)**2,0);};
const summary={scope:'shared genetic engine only; no racing calendar, scheduler, or world-management changes',seed,size,generations,arms:[]};
for(const selection of ['random','public'])R.withSource(R.seeded(seed),()=>{
 let serial=0,all=new Map();
 const founder=gender=>{const id='medium-'+serial++;return{id,gender,name:'中量试验始祖',strength:R.rollRange(62,100),genetics:{quality:50+R.rollMulti(2,26)-27,stability:60+R.rollMulti(2,21)-22,lineId:'fictional:'+id,factors:[]},publicScore:50};};
 let parents=Array.from({length:size},(_,i)=>founder(i%2?'牝马':'牡马'));parents.forEach(h=>all.set(h.id,h));
 const run={selection,generations:[],rejectedKinships:0,breakthroughs:0};
 for(let generation=1;generation<=generations;generation++){
  const library=B.createLibrary([...all.values()]),sires=parents.filter(h=>h.gender==='牡马'),mares=parents.filter(h=>h.gender==='牝马'),children=[],parentMeans=[];
  for(let i=0;i<size;i++){
   const pick=pool=>selection==='public'&&R.next()<.8?R.weightedPick(pool,h=>1+(h.publicScore||50)/25):R.pickOne(pool);
   let f,m,pair;
   for(let attempt=0;attempt<2000;attempt++){f=pick(sires);m=pick(mares);pair=B.createPair(library,f.id,m.id,'chairman');if(pair.preview.legal)break;run.rejectedKinships++;pair=null;}
   assert(pair?.preview.legal,'legal parent pool exhausted');
   const inherited=pair.generate(),child={id:'medium-'+serial++,gender:i%2?'牝马':'牡马',fatherId:f.id,motherId:m.id,strength:inherited.strength,genetics:inherited.genetics};
   child.parentMeanAbility=(f.strength+m.strength)/2;parentMeans.push(child.parentMeanAbility);if(inherited.breedingOutcome?.breakthrough)run.breakthroughs++;children.push(child);
  }
  for(const h of children){const observed=h.strength+R.rollRange(-10,10);h.lifetime={starts:8,wins:observed>=82?1:0,g1:observed>=92?1:0,prize:Math.max(0,observed-62)*10};h.annual={suggested:observed};h.breeding={strength:h.genetics.quality};all.set(h.id,h);}
  const projected={revision:generation,horses:children,pedigrees:[]},assessments=n.ChairmanGenetics.evaluate(projected);for(const h of children)h.publicScore=assessments.get(h.id).score;
  const ability=stats(children.map(h=>h.strength)),quality=stats(children.map(h=>h.genetics.quality)),stability=stats(children.map(h=>h.genetics.stability));
  run.generations.push({generation,ability,quality,stability,abilityAbove90:children.filter(h=>h.strength>=90).length/size,abilityAbove95:children.filter(h=>h.strength>=95).length/size,parentOffspringAbilityCorrelation:correlation(parentMeans,children.map(h=>h.strength)),meanPublicScore:mean(children.map(h=>h.publicScore)),publicScore:stats(children.map(h=>h.publicScore)),publicScoreAbilityCorrelation:correlation(children.map(h=>h.publicScore),children.map(h=>h.strength)),selectedParentAbility:stats(parentMeans)});parents=children;
  const keep=new Set();function visit(id,depth){if(!id||depth>4||keep.has(id))return;keep.add(id);const h=all.get(id);if(h){visit(h.fatherId,depth+1);visit(h.motherId,depth+1);}}parents.forEach(h=>visit(h.id,0));all=new Map([...all].filter(([id])=>keep.has(id)).map(([id,h])=>[id,{...h,fatherId:keep.has(h.fatherId)?h.fatherId:null,motherId:keep.has(h.motherId)?h.motherId:null}]));
  }
  const rows=run.generations,first=rows.slice(0,5),last=rows.slice(-5),comparison=selection==='random'?first:rows.slice(10,15),earlyMean=mean(comparison.map(r=>r.ability.mean)),lateMean=mean(last.map(r=>r.ability.mean));
  Object.assign(run,{meanEarlyAbility:earlyMean,meanLateAbility:lateMean,lateVsReference:lateMean-earlyMean,abilityTrendPerGeneration:regressionSlope(rows),lateAbilityVsTarget:lateMean-81,meanEarlyQuality:mean(comparison.map(r=>r.quality.mean)),meanLateQuality:mean(last.map(r=>r.quality.mean)),meanEarlyStability:mean(comparison.map(r=>r.stability.mean)),meanLateStability:mean(last.map(r=>r.stability.mean)),earlyParentOffspringCorrelation:mean(comparison.map(r=>r.parentOffspringAbilityCorrelation)),lateParentOffspringCorrelation:mean(last.map(r=>r.parentOffspringAbilityCorrelation)),averageP90LastFive:mean(last.map(r=>r.ability.p90)),averageP95RateLastFive:mean(last.map(r=>r.abilityAbove95)),breakthroughRate:run.breakthroughs/(size*generations)});
  summary.arms.push(run);
});
const output='artifacts/chairman-genetics-medium-observation.json';fs.writeFileSync(output,JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));
