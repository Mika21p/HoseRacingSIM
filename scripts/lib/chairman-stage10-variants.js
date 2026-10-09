'use strict';
function variant(source,name){
 if(name==='prep'||name==='combined'){
  const old="if(target&&target.turn<now+6)p.choices=p.choices.map(c=>({...c,utility:c.utility+(c.key===target.key?5:0)}));";
  if(!source.includes(old))throw Error('Prep variant marker missing');
  source=source.replace(old,`const youngFilly=p.h.gender==='牝马'&&[2,3].includes(W().ageOf(w,p.h));
        const usefulPrep=youngFilly&&target&&target.race.regionId===p.h.homeRegionId&&p.choices.some(c=>c.key!==target.key&&!c.race.support&&c.race.regionId===p.h.homeRegionId&&c.turn<=now+1&&!c.form.risky&&occupied(c.key)<c.race.capacity&&Math.abs(raceTiers[c.race.raceClass]-raceTiers[target.race.raceClass])<=2);
        if(target&&target.turn<now+6&&!usefulPrep)p.choices=p.choices.map(c=>({...c,utility:c.utility+(c.key===target.key?5:0)}));`);
 }
 if(name==='intent'||name==='combined'){
  const old='if(old&&old.race.regionId===p.h.homeRegionId&&p.h.locationRegionId===p.h.homeRegionId&&(reserved.get(old.key)||0)<old.race.capacity)';
  if(!source.includes(old))throw Error('Intent variant marker missing');
  source=source.replace(old,"if(old&&!(old.turn>=now+6&&old.race.raceClass==='g1'&&ns.ChairmanPrestige.value(old.race)>=85&&!old.seriesGoal)&&old.race.regionId===p.h.homeRegionId&&p.h.locationRegionId===p.h.homeRegionId&&(reserved.get(old.key)||0)<old.race.capacity)");
 }
 if(name==='review'){
  const marker='for(const p of pending){const old=p.allChoices.find';
  if(!source.includes(marker))throw Error('Review variant marker missing');
  source=source.replace(marker,`const reviewPlaces=new Set(),applicants=new Map();
      for(const p of pending){if(W().entryRating(p.h)==null)continue;const best=p.allChoices.reduce((a,c)=>!a||c.targetUtility>a.targetUtility?c:a,null);
        if(!best||best.locked||best.seriesGoal||best.turn<now+3||best.race.raceClass!=='g1'||ns.ChairmanPrestige.value(best.race)<85||best.race.regionId!==p.h.homeRegionId||p.h.locationRegionId!==p.h.homeRegionId||best.race.id===p.oldTarget?.raceId&&best.turn===p.oldTarget.turn)continue;
        const list=applicants.get(best.key)||[];list.push(p);applicants.set(best.key,list);}
      for(const [key,challengers]of applicants){const event=indexes.get(key),owners=pending.filter(p=>W().entryRating(p.h)!=null&&p.oldTarget?.raceId===event.race.id&&p.oldTarget.turn===event.turn&&!(p.old?.raceId===event.race.id&&p.old.turn===event.turn)&&p.allChoices.some(c=>c.key===key&&!c.seriesGoal));
        owners.sort((a,b)=>a.rating-b.rating||a.tie-b.tie);let count=0;for(const challenger of challengers){const owner=owners.find(p=>!reviewPlaces.has(p.h.id)&&challenger.rating>=p.rating+10);if(!owner)continue;reviewPlaces.add(owner.h.id);if(++count>=Math.min(2,event.race.capacity))break;}}
      for(const p of pending){const old=p.allChoices.find`);
  source=source.replace('if(old&&old.race.regionId===p.h.homeRegionId','if(old&&!reviewPlaces.has(p.h.id)&&old.race.regionId===p.h.homeRegionId');
 }
 if(!['baseline','prep','intent','combined','review'].includes(name))throw Error('Unknown variant');
 return source;
}
module.exports={variant};
