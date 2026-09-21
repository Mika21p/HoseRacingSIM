(function () {
  'use strict';
  const ns=window.Keiba, R=ns.Random, S=ns.ChairmanRatings;
  const order=['短途','英里','中距离','中长距离','长距离','超长距离'];
  function getRecentForm(w,h,race,turn,cohort,cohortCache) {
    const W=ns.ChairmanRules, now=w.turn+1, age=W.ageOf(w,h,turn), cat=W.category(race.distance);
    const recent=(h.recentForm||[]).filter(p=>p.turn>=w.turn-12 && !p.retired), all=S.recent(h,now), same=S.recent(h,now,race);
    const regionRows=recent.filter(p=>p.region===race.surfaceRegion && p.surface===race.surface && W.category(p.distance)===cat && p.tf!=null);
    const estimate=regionRows.length>=2 ? S.median(regionRows.map(p=>p.tf)) : same.value;
    const peers=(cohort || w.horses.filter(p=>p.status==='active' && W.ageOf(w,p,turn)===age));
    const cacheKey=`${h.birthYear}:${race.surface}:${cat}`, cached=cohortCache?.get(cacheKey);
    let sample=cached||[];
    for(let widen=0;!cached && widen<3 && sample.length<8;widen++) sample=peers.map(p=>{
      const rows=(p.recentForm||[]).filter(r=>r.turn>=w.turn-12 && r.tf!=null && r.surface===race.surface && (widen===2 || Math.abs(order.indexOf(W.category(r.distance))-order.indexOf(cat))<=widen));
      return {id:p.id,value:rows.length ? S.median(rows.map(r=>r.tf)) : null};
    }).filter(p=>p.value!=null);
    if(!cached)cohortCache?.set(cacheKey,sample);
    const own=sample.find(p=>p.id===h.id), percentile=sample.length>=8 && own ? sample.filter(p=>p.value<=own.value).length/sample.length : null;
    const young=age===2 || age===3 && W.date(turn).month<=6;
    const graded=recent.some(p=>p.raceClass!=='op' && p.rank && p.rank<=3);
    const opwin=recent.some(p=>p.raceClass==='op' && p.rank===1 && (!young || age===3 || p.year===W.date(w.turn).year));
    const challenge=graded || recent.some(p=>p.raceClass==='g1' && p.rank && p.rank<=5 && p.surface===race.surface && Math.abs(p.distance-race.distance)<=400)
      || opwin && (young || percentile>=.75 && percentile!=null)
      || young && percentile!=null && percentile>=.6 && recent.some(p=>p.raceClass==='op' && p.rank && p.rank<=3);
    const last=[...recent].sort((a,b)=>b.turn-a.turn), promotion=graded || percentile!=null && percentile>=.75 || last.slice(0,3).filter(p=>p.raceClass==='op' && p.rank===1).length>=2;
    const failed=last.length>=2 && last.slice(0,2).every(p=>p.raceClass!=='op' && p.count && p.rank>p.count/2);
    const comeback=h.lastInjury && (h.lastRaceTurn??-1)<=h.lastInjury.turn;
    return {value:estimate, overall:all.value, advantage: estimate==null || all.value==null ? 0 : Math.max(-15,Math.min(15,estimate-all.value)), challenge,promotion,failed,comeback,
      reason:challenge ? '近期表现支持挑战G1' : promotion ? '近期表现支持挑战重赏' : '积累参赛表现'};
  }
  function plan(w, api) {
    if(w.phase!=='season')return;
    const random=R.seeded(w.aiRngState ?? S.hash(`ai:${w.seed}`));
    R.withSource(random,()=>{
      const W=ns.ChairmanRules, races=[], cohorts=new Map(), cohortCache=new Map();
      for(const h of w.horses) if(h.status==='active') {const age=W.ageOf(w,h);if(!cohorts.has(age))cohorts.set(age,[]);cohorts.get(age).push(h);}
      for(const d of w.races)for(const year of [W.date(w.turn).year,W.date(w.turn).year+1]){
        const locked=w.lockedRaces?.[`${year}:${d.id}`] || ns.ChairmanSeries?.frozenRace(w,d.id,year); if(!locked&&d.deleted || d.lastHeldYear===year || !locked&&year<(d.notBeforeYear||1))continue;
        const race=locked||api.engineRace(w,d,year), turn=(year-1)*24+(race.month-1)*2+race.half-1;
        if(turn>=w.turn&&turn<w.turn+12)races.push({race,turn,key:`${year}:${race.id}`});
      }
      const proposals=[], accepted=new Map(), pins=new Map();
      for(const h of w.horses){
        const old=h.booked; h.booked=null; if(h.status!=='active'){h.target=null;h.seriesTarget=null;continue;}
        const career=api.careerFor(w,h), candidates=[], cache=new Map();
        const challenges=ns.ChairmanSeries?.challenges(w,h,api)||[], pursuit=challenges.find(s=>s.wins>0);
        h.seriesTarget=pursuit?{seriesId:pursuit.seriesId,name:pursuit.name,wins:pursuit.wins,total:pursuit.total,raceId:pursuit.race.id,turn:pursuit.turn}:null;
        for(const event of races){
          const {race,turn}=event;
          const fixed=old&&old.raceId===race.id&&old.turn===turn&&(w.lockedRaces?.[`${W.date(turn).year}:${race.id}`]||old.preparationTurn!=null&&old.preparationTurn<=w.turn);
          if(!fixed&&ns.ChairmanSeries&&!ns.ChairmanSeries.preserves(w,h,event,pursuit,api))continue; if(!api.eligible(w,h,race,turn)||h.lastRaceTurn!=null&&turn-h.lastRaceTurn<3)continue;
          const route=api.travelContext(career,h,race), time=api.timeFor(w,h,turn);
          if(!ns.RegionRules.isTravelScheduleReachable(route.career,route.race,time))continue;
          const travel=ns.RegionRules.buildTravel(route.career,route.race,time), offset=api.timeFor(w,h).index-w.turn;
          const prep=travel ? travel.prepIndex-offset : null;
          const ck=`${W.ageOf(w,h,turn)}:${W.date(turn).month<=6}:${race.surfaceRegion}:${race.surface}:${W.category(race.distance)}`;
          if(!cache.has(ck))cache.set(ck,getRecentForm(w,h,race,turn,cohorts.get(W.ageOf(w,h))||[],cohortCache));
          const form=cache.get(ck), waiting=w.turn-(h.lastRaceTurn??0); let advantage=form.advantage;
          if(advantage<0)advantage*=waiting>=10?.25:waiting>=6?.5:1;
          const utility=advantage+({op:0,g3:3,g2:5,g1:7}[race.raceClass])+Math.min(6,Math.log2(1+race.prizes[0]/10))
            -(turn-w.turn)*.75-(prep==null?0:turn-prep)+(race.raceClass==='g1'&&form.challenge&&form.advantage>=-5?6:0)
            +(form.promotion&&['g3','g2'].includes(race.raceClass)?4:0)
            +Math.max(0,...challenges.filter(s=>s.race.id===race.id&&s.turn===turn).map(s=>s.boost));
          candidates.push({...event,utility,form,prep,tie:R.next()});
        }
        const graded=candidates.filter(c=>c.race.raceClass!=='op');
        for(const c of candidates)if(c.race.raceClass==='op'&&c.form.promotion&&!c.form.failed&&!c.form.comeback&&graded.length)c.utility-=4;
        graded.sort((a,b)=>b.utility-a.utility||a.turn-b.turn||a.tie-b.tie);
        let target=graded[0], previous=graded.find(c=>h.target?.raceId===c.race.id&&h.target.turn===c.turn);
        if(previous&&target&&target.utility<previous.utility+5)target=previous;
        const stableTarget=(!target&&!h.target)||target&&previous&&target.key===previous.key;
        h.target=target ? {raceId:target.race.id,turn:target.turn,reason:challenges.find(s=>s.race.id===target.race.id)?.name ? `挑战${challenges.find(s=>s.race.id===target.race.id).name}` : target.form.reason} : null;
        let choices=candidates.filter(c=>c.turn<w.turn+6).filter(c=>{
          if(!target||c.key===target.key)return true;
          if(c.turn>=target.turn)return false;
          if(target.turn-c.turn<3)return false;
          // A prep at another location must leave the real route preparation window free.
          const at={...h,locationRegion:c.race.surfaceRegion}, route=api.travelContext(career,at,target.race);
          const travel=ns.RegionRules.buildTravel(route.career,route.race,api.timeFor(w,h,target.turn));
          return !travel || travel.prepIndex-(api.timeFor(w,h).index-w.turn)>c.turn;
        });
        for(const c of choices)if(target&&c.key===target.key)c.utility+=8;
        choices.sort((a,b)=>b.utility-a.utility||a.turn-b.turn||a.tie-b.tie);
        const pinned=old&&candidates.find(c=>c.race.id===old.raceId&&c.turn===old.turn&&(w.lockedRaces?.[c.key]||old.preparationTurn!=null&&old.preparationTurn<=w.turn));
        if(pinned){h.booked=old;const a=pins.get(pinned.key)||[];a.push(h);pins.set(pinned.key,a);continue;}
        const oldChoice=choices.find(c=>c.race.id===old?.raceId&&c.turn===old.turn);
        if(oldChoice && (stableTarget || choices[0].utility<oldChoice.utility+5)) choices.unshift(choices.splice(choices.indexOf(oldChoice),1)[0]);
        if(!oldChoice&&choices.length>1&&R.next()<.1)choices.unshift(choices.splice(R.rollRange(1,choices.length-1),1)[0]);
        // If the target is oversubscribed, these legal races are fallback choices.
        choices.push(...candidates.filter(c=>c.turn<w.turn+6&&!choices.includes(c)).sort((a,b)=>b.utility-a.utility||a.tie-b.tie));
        proposals.push({horse:h,choices,index:0,tie:R.next()});
      }
      const queue=[...proposals];
      while(queue.length){const p=queue.shift(), c=p.choices[p.index++]; if(!c)continue;
        const list=accepted.get(c.key)||[]; list.push({p,c});
        list.sort((a,b)=>(W.entryRating(b.p.horse)??-Infinity)+(b.c.race.raceClass==='g1'&&b.c.form.challenge?3:0)
          -((W.entryRating(a.p.horse)??-Infinity)+(a.c.race.raceClass==='g1'&&a.c.form.challenge?3:0)) || b.p.horse.lifetime.prize-a.p.horse.lifetime.prize||a.p.tie-b.p.tie);
        const capacity=Math.max(0,c.race.capacity-(pins.get(c.key)?.length||0));
        if(list.length>capacity)queue.push(list.pop().p); accepted.set(c.key,list);
      }
      for(const list of accepted.values())for(const {p,c}of list){p.horse.booked={raceId:c.race.id,turn:c.turn,targetRegion:c.race.surfaceRegion,preparationTurn:c.prep};
        p.horse.backups=p.choices.filter(v=>v.key!==c.key).slice(0,3).map(v=>({raceId:v.race.id,turn:v.turn}));}
    });
    w.aiRngState=random.state();
  }
  function preparationRaces(w) {
    const W=ns.ChairmanRules, result=[], seen=new Set(w.races.map(r=>r.prepTemplate).filter(Boolean));
    for(const r of w.races.filter(r=>!r.deleted&&r.raceClass==='g1'&&['2','3'].includes(r.ageRule))){
      const turn=(r.month-1)*2+r.half-1-3;if(turn<0)continue;
      const track=w.tracks.find(t=>t.id===r.trackId), key=`prep:${track.region}:${r.surface}:${W.category(r.distance)}:${r.ageRule}:${turn}`;
      if(seen.has(key))continue;seen.add(key);const d=W.date(turn);
      result.push({name:`${track.region}${r.ageRule}岁${r.surface}${r.distance}米准备赛`,prepTemplate:key,trackId:r.trackId,raceClass:'op',grade:'OP',surface:r.surface,distance:r.distance,
        month:d.month,half:d.half,ageRule:r.ageRule,sexRule:'all',capacity:16,prizes:W.defaultPrizes('op'),deleted:false});
    }return result;
  }
  ns.ChairmanScheduling={plan,getRecentForm,preparationRaces};
})();
