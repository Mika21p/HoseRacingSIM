'use strict';
// Offline instrumentation is injected identically into either frozen or current rules.
function attach(project,enabled){
 const result={counts:{},examples:{},races:{}};
 if(!enabled)return {result,track(){},record(){}};
 const fs=require('fs'),vm=require('vm'),n=project.rules;
 const file=process.argv.includes('--baseline-replay')?'artifacts/chairman-stage9-baseline-world.js':'js/rules/chairman-world.js';
 let source=fs.readFileSync(file,'utf8');const marker='p.target=target;setTarget(p.h,target,p.role);';
 if(!source.includes(marker))throw Error('Trace instrumentation marker missing');
 source=source.replace(marker,`if(emit)emit('target-allocation',{horseId:p.h.id,selected:target?.key,options:p.allChoices.map(c=>({key:c.key,utility:c.targetUtility,reserved:reserved.get(c.key)||0,occupied:occupied(c.key),capacity:c.race.capacity}))});\n        ${marker}`);
 vm.runInContext(source,project.context);
 const V=n.ChairmanWorld,original=V.plan;
 V.plan=function(w,observer){const events=new Map(),horses=new Map(),choices=new Map(),byId=new Map(w.horses.map(h=>[h.id,h]));
  const add=(kind,h,key,detail={})=>{const e=events.get(key);if(!e||e.race.support||e.turn>=w.turn+6)return;const r=e.race;if(r.regionId!==byId.get(h)?.homeRegionId)return;
   result.counts[kind]=(result.counts[kind]||0)+1;const id=e.key,row=result.races[id]||={name:r.name,turn:e.turn,age:r.ageRule,sex:r.sexRule,region:r.regionId,counts:{}};row.counts[kind]=(row.counts[kind]||0)+1;
   const a=result.examples[kind]||=[];if(a.length<12)a.push({planTurn:w.turn,horseId:h,race:r.name,previous:horses.get(h),...detail});};
  return original(w,d=>{if(observer)observer(d);
   if(d.type==='start')for(const e of d.events)events.set(e.key,e);
   if(d.type==='horse')horses.set(d.horseId,d);
   if(d.type==='target-allocation'){const next=d.options.find(x=>x.key===d.selected),ideal=d.options.reduce((a,c)=>!a||c.utility>a.utility?c:a,null);for(const o of d.options){if(o.key===d.selected)continue;if(o.reserved>=o.capacity||o.occupied>=o.capacity){add('target-capacity',d.horseId,o.key,{option:o,next});if(o===ideal&&(!next||o.utility>next.utility))add('preferred-target-denied',d.horseId,o.key,{option:o,next});}else if(next&&Math.abs(next.utility-o.utility)<=1)add('near-target-alternative',d.horseId,o.key,{option:o,next});}}
   if(d.type==='candidates'){choices.set(d.horseId,d);for(const c of d.choices)if(c.bookingBlocked==='target-preparation')add('target-window',d.horseId,c.key,{target:d.target});for(const r of d.rejected)for(const reason of r.reasons)add(reason,d.horseId,r.key);}
   if(d.type==='allocation')for(const o of d.options)if(o.key!==d.selected){const next=d.options.find(x=>x.key===d.selected);if(o.occupied>=o.capacity)add('booking-capacity',d.horseId,o.key,{option:o,next});else if(next&&next.utility-o.utility<=1)add('near-booking-alternative',d.horseId,o.key,{option:o,next,target:choices.get(d.horseId)?.target});}
  });
 };
 return {result,track(){},record(){}};
}
module.exports={attach};
