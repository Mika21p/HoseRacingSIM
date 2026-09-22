(function () {
  'use strict';
  const ns=window.Keiba, W=()=>ns.ChairmanRules;
  const check=(ok,message)=>{if(!ok)throw new Error(message);};
  const copy=x=>W().clone(x), year=w=>W().date(w.turn).year;
  const turn=(y,r)=>(y-1)*24+(r.month-1)*2+r.half-1;
  const ageOK=(rule,age)=>!rule||rule==='all'||(rule.endsWith('+')?age>=Number(rule.slice(0,-1)):age===Number(rule));
  const sexOK=(rule,sex)=>rule==='all'||({male:'牡马',female:'牝马',gelding:'骟马'}[rule]===sex)||rule==='male-female'&&sex!=='骟马';
  function initialize(w){w.series||=[];w.familyTemplates||=[];w.sourceMappings||=[];w.contentState||={version:1,rngState:ns.ChairmanRatings.hash('content:'+w.seed)};w.seriesState||={version:1,year:year(w),current:[],notices:[]};}
  function pinned(w,raceId,y){return !!w.lockedRaces?.[`${y}:${raceId}`]||w.horses.some(h=>h.booked?.raceId===raceId&&W().date(h.booked.turn).year===y&&h.booked.preparationTurn!=null&&h.booked.preparationTurn<=w.turn);}
  function frozenRace(w,id,y=year(w)){return w.seriesState?.year===y?w.seriesState.current.find(s=>s.frozen&&s.races.some(r=>r.id===id))?.races.find(r=>r.id===id):null;}
  function validateDefinition(w,v){
    check(typeof v.name==='string'&&v.name.trim().length>0&&v.name.length<=80,'系列名称须为1～80字。');
    check(typeof v.title==='string'&&v.title.trim().length>0&&v.title.length<=100,'冠军称号须为1～100字。');
    check(['all','2','3','4','4+'].includes(v.ageRule),'系列年龄条件无效。');
    check(Number.isFinite(v.bonus)&&v.bonus>=0&&Number.isSafeInteger(Math.round(v.bonus*100))&&Math.abs(v.bonus*100-Math.round(v.bonus*100))<1e-6,'奖金须非负，最多两位小数。');
    check(Number.isInteger(v.honorWeight)&&v.honorWeight>=1&&v.honorWeight<=5,'荣誉权重须为1～5的整数。');
    check(Array.isArray(v.raceIds)&&v.raceIds.length>=2&&new Set(v.raceIds).size===v.raceIds.length,'至少选择两场不同的重赏。');
    const races=v.raceIds.map(id=>w.races.find(r=>r.id===id));
    check(races.every(r=>r&&!r.deleted&&['g1','g2','g3'].includes(r.raceClass)),'分站必须是未停办的G1、G2或G3。');
    check([2,3,4,5,6].some(a=>ageOK(v.ageRule,a)&&races.every(r=>ageOK(r.ageRule,a)))&&['牡马','牝马','骟马'].some(s=>races.every(r=>sexOK(r.sexRule,s))),'分站年龄或性别条件不存在共同合法参赛对象。');
    const resolved=w.worldSystemVersion===2?races.map(r=>W().engineRace(w,r,Math.max(year(w),v.startYear||year(w)))):races;
    const sorted=resolved.slice().sort((a,b)=>turn(1,a)-turn(1,b)||a.id.localeCompare(b.id)),warnings=[];
    for(let i=1;i<sorted.length;i++){
      const a=sorted[i-1],b=sorted[i],gap=turn(1,b)-turn(1,a),at=w.tracks.find(t=>t.id===a.trackId),bt=w.tracks.find(t=>t.id===b.trackId);
      if(gap<3)warnings.push(`${a.name}→${b.name}仅间隔${gap}个半月，无法满足正常参赛间隔。`);
      else if(w.worldSystemVersion===2?gap<ns.ChairmanWorld.travelTurns(w,a.regionId,b.regionId):at.region!==bt.region&&gap<5)warnings.push(`${a.name}→${b.name}涉及跨地区行程，可能缺少准备时间。`);
    }
    const key=v.raceIds.slice().sort().join('|');
    if(w.series.some(s=>s.id!==v.id&&!s.deleted&&s.raceIds.slice().sort().join('|')===key))warnings.push('已有完全相同分站的系列；奖金会分别发放，殿堂荣誉只取最高权重。');
    return {raceIds:sorted.map(r=>r.id),warnings};
  }
  function prepare(w,lockDue=false){
    initialize(w);const y=year(w),state=w.seriesState;
    if(state.year!==y){state.year=y;state.current=[];state.notices=[];}
    const old=new Map(state.current.map(s=>[s.seriesId,s]));
    state.current=w.series.flatMap(d=>{
      const existing=old.get(d.id);if(existing?.frozen)return [existing];
      if(d.deleted||d.startYear>y)return [];
      const races=d.raceIds.map(id=>w.races.find(r=>r.id===id));
      if(races.some(r=>!r||r.deleted))return [];
      const s={id:`${y}:${d.id}`,seriesId:d.id,year:y,name:d.name,title:d.title,ageRule:d.ageRule,bonus:d.bonus,honorWeight:d.honorWeight,
        races:races.map(r=>copy(W().engineRace(w,r,y))),results:existing?.results||[],frozen:false,settled:false};
      s.frozen=races.some(r=>pinned(w,r.id,y)||lockDue&&turn(y,r)<=w.turn);
      if(s.frozen&&w.worldSystemVersion===2)for(const r of races)ns.ChairmanWorld.freeze(w,r.id,y);
      return [s];
    });
  }
  function edit(world,value,options={}){
    return W().mutate(world,w=>{
      prepare(w);let old=w.series.find(s=>s.id===value.id);
      if(options.stop){check(old,'系列不存在。');old.deleted=true;prepare(w);return;}
      const v={id:old?.id||value.id||`series-${w.nextId++}`,name:String(value.name||'').trim(),title:String(value.title||`${value.name||''}冠军`).trim(),ageRule:value.ageRule||'all',raceIds:value.raceIds,bonus:Number(value.bonus??0),honorWeight:Number(value.honorWeight??3),deleted:false};
      const valid=validateDefinition(w,v);check(!valid.warnings.length||options.acceptWarnings,valid.warnings.join('\n'));v.raceIds=valid.raceIds;
      const y=year(w),frozen=w.seriesState.current.find(s=>s.seriesId===v.id)?.frozen;
      v.startYear=frozen?y+1:v.raceIds.some(id=>{const r=w.races.find(r=>r.id===id);return r.lastHeldYear===y||turn(y,r)<w.turn||pinned(w,id,y);})?y+1:y;
      if(old)Object.assign(old,v);else w.series.push(v);prepare(w);if(!options.deferPlanning)W().planEntries(w);
    });
  }
  function settle(w,out){
    initialize(w);w.seriesState.notices=[];
    for(const s of w.seriesState.current){
      if(s.settled)continue;
      for(const r of out.occurrences||[]){
        if(!s.races.some(v=>v.id===r.raceId)||s.results.some(v=>v.raceId===r.raceId))continue;
        s.frozen=true;const p=(out.performances||[]).find(p=>p.occurrenceId===r.id&&p.rank===1&&!p.retired);
        s.results.push({raceId:r.raceId,occurrenceId:r.id,turn:r.turn,status:r.status,horseId:p?.horseId||null,horseName:p?.horseName||null,eligible:!!p&&ageOK(s.ageRule,p.age)});
        const wins=s.results.filter(v=>v.eligible&&v.horseId===p?.horseId).length;
        if(p&&s.results.every(v=>v.eligible&&v.horseId===p.horseId))w.seriesState.notices.push({seriesId:s.seriesId,name:s.name,horseId:p.horseId,horseName:p.horseName,wins,total:s.races.length,completed:false});
      }
      if(s.results.length===s.races.length){
        s.settled=true;s.turn=w.turn;const first=s.results[0];
        if(first?.eligible&&s.results.every(r=>r.eligible&&r.horseId===first.horseId)){
          const h=w.horses.find(h=>h.id===first.horseId);check(h,'系列冠军档案缺失。');
          const award={id:s.id,seriesId:s.seriesId,year:s.year,turn:w.turn,horseId:h.id,horseName:h.name,name:s.name,title:s.title,bonus:s.bonus,honorWeight:s.honorWeight,raceIds:s.races.map(r=>r.id),victories:copy(s.results)};
          (h.seriesTitles||=[]).push(award);for(const stats of [h.annual,h.lifetime]){stats.prize+=s.bonus;stats.seriesPrize=Math.round(((stats.seriesPrize||0)+s.bonus)*100)/100;}
          s.championId=h.id;s.championName=h.name;(out.seriesRewards||=[]).push(award);
          const notice=w.seriesState.notices.find(n=>n.seriesId===s.seriesId);if(notice)Object.assign(notice,{completed:true,bonus:s.bonus,title:s.title});
        }else s.reason=s.results.some(r=>r.status==='cancelled')?'分站取消':s.results.some(r=>!r.horseId)?'分站无完赛胜马':'无人全胜';
      }
      if(s.frozen)(out.seriesYears||=[]).push(copy(s));
    }
  }
  function honor(h){const groups=new Map();for(const t of h.seriesTitles||[]){const k=t.year+':'+t.raceIds.slice().sort().join('|');groups.set(k,Math.max(groups.get(k)||0,t.honorWeight));}return [...groups.values()].reduce((a,b)=>a+b,0);}
  function challenges(w,h,api){
    const options=[];
    for(const s of w.seriesState?.current||[]){
      if(s.settled||!ageOK(s.ageRule,W().ageOf(w,h))||s.results.some(r=>r.horseId!==h.id||!r.eligible))continue;
      const remaining=s.races.filter(r=>!s.results.some(v=>v.raceId===r.id)).map(r=>({race:r,turn:turn(s.year,r)})).sort((a,b)=>a.turn-b.turn);
      if(!remaining.length||remaining[0].turn<w.turn)continue;
      let at=h,ok=true,last=h.lastRaceTurn;
      for(const e of remaining){
        if(last!=null&&e.turn-last<3||!api.eligible(w,at,e.race,e.turn)){ok=false;break;}
        const route=api.travelContext(api.careerFor(w,at),at,e.race);
        if(!ns.RegionRules.isTravelScheduleReachable(route.career,route.race,api.timeFor(w,at,e.turn))){ok=false;break;}
        const travel=ns.RegionRules.buildTravel(route.career,route.race,api.timeFor(w,at,e.turn));
        if(last!=null&&travel&&travel.prepIndex-(api.timeFor(w,at).index-w.turn)<=last){ok=false;break;}
        at={...h,locationRegion:e.race.surfaceRegion};last=e.turn;
      }
      if(ok)options.push({...remaining[0],seriesId:s.seriesId,name:s.name,wins:s.results.length,total:s.races.length,
        boost:(s.results.length?(remaining.length===1?10:6):2)+Math.min(3,Math.log2(1+s.bonus/100))});
    }
    return options.sort((a,b)=>b.wins-a.wins||b.boost-a.boost||a.turn-b.turn||a.seriesId.localeCompare(b.seriesId));
  }
  function preserves(w,h,c,goal,api){
    if(!goal||!goal.wins||c.race.id===goal.race.id&&c.turn===goal.turn)return true;
    if(c.turn>=goal.turn||goal.turn-c.turn<3)return false;
    const at={...h,locationRegion:c.race.surfaceRegion},route=api.travelContext(api.careerFor(w,at),at,goal.race),t=api.timeFor(w,at,goal.turn);
    if(!ns.RegionRules.isTravelScheduleReachable(route.career,route.race,t))return false;
    const travel=ns.RegionRules.buildTravel(route.career,route.race,t);return !travel||travel.prepIndex-(api.timeFor(w,at).index-w.turn)>c.turn;
  }
  function validate(w){
    if(!w.seriesState)return;
    check(w.seriesState.version===1&&Number.isInteger(w.seriesState.year)&&Array.isArray(w.seriesState.current)&&Array.isArray(w.series)&&new Set(w.series.map(s=>s.id)).size===w.series.length,'系列数据无效。');
    const races=new Set(w.races.map(r=>r.id)),horses=new Set(w.horses.map(h=>h.id));
    const rewards=s=>Number.isFinite(s.bonus)&&s.bonus>=0&&Math.abs(s.bonus*100-Math.round(s.bonus*100))<1e-6&&Number.isInteger(s.honorWeight)&&s.honorWeight>=1&&s.honorWeight<=5;
    for(const s of w.series){check(typeof s.id==='string'&&s.id&&typeof s.name==='string'&&s.name&&typeof s.title==='string'&&s.title&&Number.isInteger(s.startYear)&&s.startYear>=1&&typeof s.deleted==='boolean'&&['all','2','3','4','4+'].includes(s.ageRule),'系列身份或年份无效。');check(Array.isArray(s.raceIds)&&s.raceIds.length>=2&&new Set(s.raceIds).size===s.raceIds.length&&s.raceIds.every(id=>races.has(id)),'系列引用缺失赛事。');check(rewards(s),'系列奖励无效。');}
    for(const s of w.seriesState.current){check(w.series.some(d=>d.id===s.seriesId)&&s.id===`${s.year}:${s.seriesId}`&&s.year===w.seriesState.year&&Array.isArray(s.races)&&s.races.length>=2&&s.races.every(r=>races.has(r.id))&&Array.isArray(s.results)&&new Set(s.results.map(r=>r.raceId)).size===s.results.length&&s.results.every(r=>s.races.some(v=>v.id===r.raceId)&&(!r.horseId||horses.has(r.horseId)))&&rewards(s),'系列届次无效。');}
    for(const h of w.horses){const ids=new Set();for(const t of h.seriesTitles||[]){check(!ids.has(t.id)&&w.series.some(s=>s.id===t.seriesId)&&t.horseId===h.id&&Number.isInteger(t.year)&&Array.isArray(t.raceIds)&&t.raceIds.every(id=>races.has(id))&&rewards(t),'系列称号无效。');ids.add(t.id);}}
  }
  function validateHistory(w,records){
    const defs=new Set((w.series||[]).map(s=>s.id)),horses=new Map(w.horses.map(h=>[h.id,h])),occ=new Map((records.occurrences||[]).map(r=>[r.id,r]));
    for(const s of records.seriesYears||[]){check(defs.has(s.seriesId)&&s.id===`${s.year}:${s.seriesId}`&&Array.isArray(s.races)&&Array.isArray(s.results),'系列历史关联无效。');for(const r of s.results)check(occ.get(r.occurrenceId)?.raceId===r.raceId,'系列分站缺少正式届次。');}
    for(const r of records.seriesRewards||[]){const h=horses.get(r.horseId),s=(records.seriesYears||[]).find(s=>s.id===r.id);check(h&&s?.settled&&s.championId===h.id&&Number.isFinite(r.bonus)&&r.bonus>=0&&(h.seriesTitles||[]).some(t=>t.id===r.id),'系列奖励关联无效。');}
    const rewardIds=new Set((records.seriesRewards||[]).map(r=>r.id));for(const h of w.horses)for(const t of h.seriesTitles||[])check(rewardIds.has(t.id),'系列称号缺少发放记录。');
  }
  ns.ChairmanSeries={initialize,prepare,edit,validateDefinition,frozenRace,settle,honor,challenges,preserves,validate,validateHistory,turn,ageOK};
})();
