'use strict';
// Maximum bipartite matching of quota slots: a horse may fill only one slot.
// This is a same-turn feasibility bound, not a season planner or a live fill rule.
function match(pools,required){
 const slots=[];pools.forEach((_,i)=>{for(let j=0;j<required[i];j++)slots.push(i);});const owner=new Map();
 function place(slot,seen){for(const id of pools[slots[slot]]){if(seen.has(id))continue;seen.add(id);if(!owner.has(id)||place(owner.get(id),seen)){owner.set(id,slot);return true;}}return false;}
 let filled=0;for(let s=0;s<slots.length;s++)if(place(s,new Set()))filled++;
 const counts=required.map(()=>0);for(const slot of owner.values())counts[slots[slot]]++;
 return {required:slots.length,filled,missing:slots.length-filled,counts};
}
function evidence(n,w,h){
 const rows=(h.recentForm||[]).filter(p=>Number.isFinite(p.tf)&&!p.retired&&Number.isInteger(p.turn)&&p.turn<=w.turn&&p.turn>=w.turn-12&&Number.isFinite(p.distance)&&p.distance>0&&['草地','泥地'].includes(p.surface)&&(p.rank==null||p.rank>0)).sort((a,b)=>b.turn-a.turn).slice(0,8).filter(p=>!p.assessment),groups=new Map();
 for(const p of rows){const key=p.surface+':'+n.ChairmanRules.category(p.distance),a=groups.get(key)||[];a.push(p);groups.set(key,a);}
 const median=n.ChairmanRatings.median,best=[...groups.values()].filter(a=>a.length>=2).map(a=>({surface:a[0].surface,distance:median(a.map(p=>p.distance)),value:median(a.map(p=>p.tf))})).sort((a,b)=>b.value-a.value)[0];return {rows,groups,best};
}
function risky(n,e,r){const sample=e.groups.get(r.surface+':'+n.ChairmanRules.category(r.distance))||e.rows.filter(p=>p.surface===r.surface&&Math.abs(p.distance-r.distance)<=400),b=e.best;return !!(b&&(sample.length>=2&&n.ChairmanRatings.median(sample.map(p=>p.tf))<b.value-15||e.rows.length&&!sample.length&&(b.surface!==r.surface||Math.abs(b.distance-r.distance)>600)));}
function inspect(n,w,out){const W=n.ChairmanRules,V=n.ChairmanWorld,results=[],cache=new Map();
 for(const region of w.regions){const events=out.occurrences.filter(e=>!e.race.support&&e.race.regionId===region.id);if(!events.length)continue;
 const horses=w.horses.filter(h=>h.status==='active'&&h.homeRegionId===region.id&&h.qualification>=1),required=events.map(e=>e.raceClass==='g1'&&n.ChairmanPrestige.value(e.race)>=85?8:5),legal=[],safe=[],committed=[],free=[],races=[];
 events.forEach((e,i)=>{const a=[],b=[],c=[],d=[];let capableBeginners=0,unbooked=0,support=0,targetOther=0;
 for(const h of horses){if(h.transit||!W.eligible(w,h,e.race,w.turn)||!V.route(w,h,e.race,w.turn).reachable)continue;a.push(h.id);if(!cache.has(h.id))cache.set(h.id,evidence(n,w,h));if(risky(n,cache.get(h.id),e.race))continue;b.push(h.id);
 const book=h.booked,target=h.target,same=book?.raceId===e.race.id&&book.turn===w.turn;
 const protectedBooking=book&&(w.lockedRaces?.[W.date(book.turn).year+':'+book.raceId]||book.preparationTurn!=null&&book.preparationTurn<=w.turn);
 if(!protectedBooking||same)c.push(h.id);
 const compatible=!target||target.raceId===e.race.id&&target.turn===w.turn||w.turn<target.turn&&target.turn-w.turn>=Math.max(3,V.travelTurns(w,e.race.regionId,w.races.find(r=>r.id===target.raceId)?.regionId)+1);
 if((!protectedBooking||same)&&compatible)d.push(h.id);
 if(!h.lifetime.starts&&(W.entryRating(h)??0)>=95)capableBeginners++;
 if(!book)unbooked++;else if(w.races.find(r=>r.id===book.raceId)?.support)support++;if(target&&target.raceId!==e.race.id)targetOther++;
 }legal.push(a);safe.push(b);committed.push(c);free.push(d);races.push({id:e.race.id,name:e.race.name,age:e.race.ageRule,sex:e.race.sexRule,count:e.count,required:required[i],legal:a.length,safe:b.length,unlocked:c.length,targetTimeCompatible:d.length,capableBeginners,unbooked,support,targetOther});});
 results.push({turn:w.turn,region:region.name,races,legal:match(legal,required),safe:match(safe,required),unlocked:match(committed,required),targetTimeCompatible:match(free,required)});
 }return results;
}
module.exports={match,inspect};
