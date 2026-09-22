(function () {
  'use strict';
  const ns = window.Keiba, R = ns.Random, W = () => ns.ChairmanRules;
  const copy = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  const check = (v, message) => { if (!v) throw Error(message); };
  const isV2 = w => w?.worldSystemVersion === 2;
  const classes = ['new','maiden','one-win','two-win','three-win','op','g3','g2','g1'];
  const graded = r => ['g1','g2','g3'].includes(typeof r === 'string' ? r : r.raceClass);
  const labels = {new:'新马',maiden:'未胜利','one-win':'1胜','two-win':'2胜','three-win':'3胜',op:'OP',g3:'G3',g2:'G2',g1:'G1'};
  const level = {new:0,maiden:0,'one-win':1,'two-win':2,'three-win':3};
  const defaults = () => ({surfaceWeights:{草地:60,泥地:35,二刀流:5},trackTypeWeights:{burst:1,sustained:1,attrition:1},distanceWeights:{grass:[20,20,20,20,10,10],dirt:[30,30,30,12,2,1]}});
  const mint = (w, prefix) => `${prefix}-${w.nextId++}`;
  const year = w => W().date(w.turn).year;
  const at = (y,r) => (y-1)*24+(r.month-1)*2+r.half-1;
  const region = (w,key) => w.regions.find(r=>r.id===key || r.name===key);
  function profile(w,key) {
    const r=region(w,key);check(r&&!r.disabled,'请选择启用的生成来源地区。');
    return {trackTypeWeights:{burst:1,sustained:1,attrition:1},...copy(r.generation),grass:r.environment.grass,dirt:r.environment.dirt};
  }
  function newRegion(w,v={}) {
    const base=v.baseRegion||'日本';
    return {id:v.id||mint(w,'region'),name:v.name||'新地区',shortName:v.shortName||v.name||'新地区',country:v.country||v.name||'',area:v.area||'',description:v.description||'',order:v.order??w.regions.length,
      baseRegion:base,autoPopulate:v.autoPopulate??true,disabled:false,initialCount:v.initialCount??0,annualTarget:v.annualTarget??0,trafficGroup:v.trafficGroup||v.area||base,
      competitionSystem:v.competitionSystem||'open',environment:{grass:base,dirt:base==='欧洲'?'日本':base,jockeyPool:base,...v.environment},...copy(v),generation:{...defaults(),...copy(v.generation)}};
  }
  function horseInput(w,v) {
    const r=region(w,v.homeRegionId||v.homeRegion); if(!r)return v;check(!r.disabled,'请选择启用地区。');
    const old=w.horses.find(h=>h.id===v.id);
    return {...v,homeRegion:r.name,homeRegionId:r.id,...(!old?{locationRegionId:r.id,locationRegion:r.name}:{})};
  }
  function initializeHorse(w,h,opts) {
    const r=region(w,opts.homeRegionId||h.homeRegion);check(r&&!r.disabled,'所属地区未启用。');
    h.homeRegionId=r.id;h.homeRegion=r.name;h.locationRegionId=opts.locationRegionId||r.id;
    h.locationRegion=region(w,h.locationRegionId)?.name||r.name;
    h.generationRegionId=opts.generationRegionId||r.id;h.generationVersion=opts.generationVersion||r.generationVersion||1;h.generationProfile=copy(opts.generationProfile||profile(w,h.generationRegionId));
    h.qualification=opts.qualification??0;h.initialQualification=opts.initialQualification??null;
  }
  // Names are compatibility/display projections. All new-world references have IDs.
  function synchronize(w) {
    if(!isV2(w))return;
    w.settings.annualNewHorses=w.regions.filter(r=>r.autoPopulate&&!r.disabled).reduce((n,r)=>n+r.annualTarget,0);
    for(const h of [...w.horses,...(w.pedigrees||[])])for(const [key,idKey] of [['homeRegion','homeRegionId'],['locationRegion','locationRegionId']]){
      if(!h[key]&&!h[idKey])continue;
      const r=region(w,h[idKey]||h[key]);if(r){h[idKey]=r.id;h[key]=r.name;}
    }
    for(const t of w.tracks){const r=region(w,t.regionId||t.region);if(r){t.regionId=r.id;t.region=r.name;}}
    for(const h of w.horses)if(h.booked){const b=h.booked,r=region(w,b.targetRegionId||b.targetRegion);if(r){b.targetRegionId=r.id;b.targetRegion=r.name;}}
    for(const p of w.breeding?.manual||[]){const r=region(w,p.homeRegionId||p.homeRegion);if(r){p.homeRegionId=r.id;p.homeRegion=r.name;}}
  }
  function travelTurns(w,from,to) {
    if(from===to)return 0;
    const key=[from,to].sort().join('|'),override=w.travelOverrides?.[key];
    if(override!=null)return override;
    return region(w,from)?.trafficGroup===region(w,to)?.trafficGroup?1:2;
  }
  function route(w,h,race,turn) {
    const from=h.locationRegionId||region(w,h.locationRegion)?.id,to=race.regionId;
    const duration=travelTurns(w,from,to),earliest=Math.max(w.turn+duration,(h.lastRaceTurn??-3)+3,h.restUntil||0);
    return {reachable:turn>=earliest,preparationTurn:duration?turn-duration:null,fromRegionId:from,targetRegionId:to,targetRegion:race.surfaceRegion,duration};
  }
  function groupFor(w,raceId) {return (w.meetingGroups||[]).find(g=>g.enabled!==false&&g.raceIds.includes(raceId));}
  function assignment(w,g,y) {
    const existing=w.venueAssignments.find(a=>a.groupId===g.id&&a.year===y);
    if(existing?.frozen)return existing;
    const ids=g.trackIds,offset=Math.max(0,y-g.startYear)%ids.length;
    const trackId=g.yearOverrides?.[y]||ids[g.mode==='fixed'?0:offset];
    return {id:`${g.id}:${y}`,groupId:g.id,year:y,trackId,frozen:false};
  }
  function courseProfile(w,t,surface,distance) {
    const manual=t.courseProfiles?.find(p=>p.surface===surface&&p.distance===distance);
    const publicProfile=!manual&&ns.RaceCourseProfiles?.resolveForTrackCourse?.(t.key,surface,distance);
    const base=manual||publicProfile||{type:surface==='泥地'?(distance<=1400?'attrition':'sustained'):'burst',intensity:1,status:'provisional'};
    return {...copy(base),id:publicProfile?.id||`chairman:${w.id}:${t.id}:${surface}:${distance}`,trackId:t.id,trackKey:t.key||t.id,trackName:t.name,
      courseConfigId:t.configurations?.find(c=>c.surface===surface)?.id||`${t.id}:${surface}`,surface,distance,routeId:'standard',routeName:'标准路线',
      chairmanSource:manual?'manual':publicProfile?'public':'fallback',status:manual?'confirmed':base.status||'confirmed'};
  }
  function courseProfileFields(w,r,t) {
    const p=courseProfile(w,t,r.surface,r.distance);
    return {courseProfile:p,courseProfileId:p.id,courseRouteId:p.routeId,courseRouteName:p.routeName};
  }
  function courseLabel(p) {
    if(!p)return '赛程分类未记录';
    return `${{burst:'瞬发',sustained:'持久',attrition:'消耗'}[p.type]}${p.intensity===1?'Ⅰ':'Ⅱ'} · ${p.chairmanSource==='manual'?'手动设置':p.status==='provisional'?'暂定，待设置':'公共资料'}`;
  }
  function courseRows(w,t) {
    const rows=new Map((t.courseProfiles||[]).map(p=>[`${p.surface}:${p.distance}`,p]));
    for(const r of w.races.filter(r=>!r.deleted&&(r.trackId===t.id||w.meetingGroups.some(g=>g.enabled!==false&&g.trackIds.includes(t.id)&&g.raceIds.includes(r.id))))) {
      rows.set(`${r.surface}:${r.distance}`,{surface:r.surface,distance:r.distance});
    }
    return [...rows.values()].map(r=>courseProfile(w,t,r.surface,r.distance)).sort((a,b)=>a.surface.localeCompare(b.surface)||a.distance-b.distance);
  }
  function validateCourseProfiles(t) {
    check(t.courseProfiles==null||Array.isArray(t.courseProfiles),'赛程配置必须是列表。');
    const keys=new Set();
    for(const p of t.courseProfiles||[]) {
      const key=`${p.surface}:${p.distance}`;
      check(!keys.has(key),'同一马场的草泥与距离赛程不能重复。');keys.add(key);
      check(t.surfaces.includes(p.surface)&&Number.isInteger(p.distance)&&p.distance>0&&['burst','sustained','attrition'].includes(p.type)&&[1,2].includes(p.intensity),'赛程的场地、距离或分类无效。');
    }
  }
  function resolveRace(w,r,y=year(w)) {
    const locked=w.lockedRaces?.[`${y}:${r.id}`];if(locked)return copy(locked);
    const archived=w.venueAssignments.find(a=>a.year===y&&a.frozen&&a.races?.some(x=>x.id===r.id));
    if(archived){const snapshot=archived.races.find(x=>x.id===r.id);if(y<year(w)||r.lastHeldYear===y)return copy(snapshot);
      const venueKeys=['trackId','trackName','regionId','surfaceRegion','engineRegion','course','courseConfigId','courseName','courseProfile','courseProfileId','courseRouteId','courseRouteName','chairmanEnvironment','competitionSystem','meetingGroupId','venueYear','venueMode'];
      const fields=r.distance!==snapshot.distance?courseProfileFields(w,r,archived.trackSnapshot||w.tracks.find(t=>t.id===snapshot.trackId)):{};
      return {...copy(r),...Object.fromEntries(venueKeys.map(k=>[k,copy(snapshot[k])])),...fields,venueFrozen:true};}
    const g=groupFor(w,r.id),a=g?assignment(w,g,y):null;
    const frozen=a?.frozen?a.races?.find(x=>x.id===r.id):null;if(frozen)return copy(frozen);
    const t=w.tracks.find(t=>t.id===(a?.trackId||r.trackId));check(t,'赛事举办马场不存在。');
    const area=region(w,t.regionId),config=t.configurations?.find(c=>c.id===r.courseConfigId&&c.surface===r.surface)||t.configurations?.find(c=>c.surface===r.surface);
    check(area&&t.surfaces.includes(r.surface)&&config,'举办地地区或场地配置不匹配。');
    const {courseProfile,courseProfileId,courseRouteId,courseRouteName,...base}=copy(r),profile=courseProfileFields(w,r,t);
    return {...base,trackId:t.id,trackKey:t.key,trackName:t.name,regionId:area.id,surfaceRegion:area.name,engineRegion:area.baseRegion,course:config?.courseType||t.courseType,
      courseConfigId:config?.id||'',courseName:config?.name||r.surface,...profile,chairmanEnvironment:copy(area.environment),competitionSystem:area.competitionSystem,meetingGroupId:g?.id||'',venueYear:y,venueMode:g?.mode||'fixed',venueFrozen:!!a?.frozen};
  }
  function refreshAssignments(w) {
    for(const g of w.meetingGroups.filter(g=>g.enabled!==false))for(const y of [year(w),year(w)+1]){
      const a=assignment(w,g,y),old=w.venueAssignments.find(x=>x.id===a.id);
      if(!old)w.venueAssignments.push(a);else if(!old.frozen)Object.assign(old,a);
    }
  }
  function freeze(w,raceId,y=year(w)) {
    if(!isV2(w))return;
    const g=groupFor(w,raceId);if(!g)return;
    const a=assignment(w,g,y);if(a.frozen)return;
    a.groupName=g.name;a.trackSnapshot=copy(w.tracks.find(t=>t.id===a.trackId));a.trackName=a.trackSnapshot.name;a.races=g.raceIds.map(id=>resolveRace(w,w.races.find(r=>r.id===id),y));a.frozen=true;
    const old=w.venueAssignments.find(x=>x.id===a.id);if(old)Object.assign(old,a);else w.venueAssignments.push(a);
  }
  function rememberActual(w,race,y) {
    const a=w.venueAssignments.find(a=>a.year===y&&a.frozen&&a.races.some(r=>r.id===race.id));
    if(a){const i=a.races.findIndex(r=>r.id===race.id);a.races[i]={...copy(race),venueFrozen:true};}
  }
  function validateGroup(w,g) {
    check(typeof g.name==='string'&&g.name.trim(),'请填写举办组名称。');
    check(['fixed','cycle'].includes(g.mode)&&Number.isInteger(g.startYear)&&g.startYear>=1,'轮换方式或起始年份无效。');
    check(Array.isArray(g.raceIds)&&g.raceIds.length&&new Set(g.raceIds).size===g.raceIds.length,'举办组成员缺失或重复。');
    check(Array.isArray(g.trackIds)&&g.trackIds.length&&new Set(g.trackIds).size===g.trackIds.length,'候选场地缺失或重复。');
    const races=g.raceIds.map(id=>w.races.find(r=>r.id===id));check(races.every(Boolean),'举办组引用了不存在的赛事。');
    check(!w.meetingGroups.some(o=>o.id!==g.id&&o.raceIds.some(id=>g.raceIds.includes(id))),'赛事不能同时属于两个举办组。');
    for(const id of g.trackIds){const t=w.tracks.find(t=>t.id===id);check(t&&(g.enabled===false||!t.deleted&&!region(w,t.regionId)?.disabled),'候选马场不存在或已停用。');for(const r of g.enabled===false?[]:races)check(t.surfaces.includes(r.surface),`${t.name}不支持${r.name}需要的${r.surface}。`);}
    for(const [y,id]of Object.entries(g.yearOverrides||{}))check(Number.isInteger(Number(y))&&Number(y)>=1&&(g.trackIds.includes(id)||w.venueAssignments.some(a=>a.frozen&&a.groupId===g.id&&a.year===Number(y)&&a.trackId===id)),'年度指定场地或年份无效。');
  }
  function eligible(w,h,r) {
    const q=h.qualification??0;
    if(r.raceClass==='new')return q===0&&h.lifetime.starts===0;
    if(Object.hasOwn(level,r.raceClass))return q===level[r.raceClass];
    const area=region(w,r.regionId||w.tracks.find(t=>t.id===r.trackId)?.regionId);
    if((r.competitionSystem||area?.competitionSystem)==='japan')return q>=1;
    return !graded(r)||q>=1||h.lifetime.wins>0;
  }
  function recordPerformance(h,p) {
    if(p.rank!==1||p.retired)return;
    h.qualification=Object.hasOwn(level,p.raceClass)?Math.max(h.qualification||0,level[p.raceClass]+1):4;
  }
  function prizes(c,grade) {const first={new:5,maiden:5,'one-win':10,'two-win':20,'three-win':40,op:grade==='L'?80:60,g3:100,g2:300,g1:1000}[c];return [1,.4,.25,.15,.1].map(v=>v*first);}
  function sourceRace(w,s,t,extra={}) {
    const age=s.ageRestriction||{type:'min',age:2};
    const raceClass=/^jpn([123])$/.test(s.raceClass)?`g${s.raceClass.at(-1)}`:s.raceClass;
    return {id:mint(w,'race'),sourceId:s.id,name:s.nameZh||s.name,originalName:s.nameOriginal||s.name,trackId:t.id,courseConfigId:t.configurations.find(c=>c.surface===s.surface)?.id,
      raceClass,grade:s.grade==='OP/L'?'L':s.grade||labels[raceClass],surface:s.surface,distance:s.distance,month:s.month,half:s.half,
      ageRule:age.type==='exact'?String(age.age):`${age.age}+`,sexRule:s.sexRestriction==='牝馬'||s.sexRestriction==='牝马'?'female':'all',capacity:16,prizes:prizes(raceClass,s.grade==='OP/L'?'L':s.grade),prizeSource:'游戏奖金',
      courseProfileId:s.courseProfileId||'',courseRouteId:s.courseRouteId||'',courseRouteName:s.courseRouteName||'',deleted:false,...extra};
  }
  function newTrack(w,area,spec) {
    const id=spec.id||mint(w,'track'),surfaces=spec.surfaces||['草地','泥地'];
    const configurations=spec.configurations||surfaces.map((surface,i)=>({id:`${id}:course:${i}`,name:surface,surface,courseType:spec.courseType||'其他地方'}));
    return {id,name:spec.name,originalName:spec.originalName||spec.name,aliases:[],regionId:area.id,region:area.name,country:area.country,city:spec.city||'',state:spec.state||'',courseType:spec.courseType||'其他地方',surfaces,configurations,courseProfiles:[],deleted:false,...copy(spec)};
  }
  function addSupport(w,area) {
    const tracks=w.tracks.filter(t=>t.regionId===area.id&&!t.deleted);if(!tracks.length)return;
    if(area.competitionSystem==='japan'){
      const seen=new Set();
      for(const s of ns.RaceRegistry.all().filter(r=>r.surfaceRegion==='日本'&&Object.hasOwn(level,r.raceClass))){
        const t=tracks.find(t=>t.sourceCourse===s.course);if(!t)continue;
        const age=s.ageRestriction.age,ageRule=age>=4?'4+':String(age),key=[s.raceClass,ageRule,s.month,s.half,t.id,s.surface,s.distance].join(':');if(seen.has(key))continue;seen.add(key);
        w.races.push(sourceRace(w,s,t,{ageRule,demandDriven:true,support:true}));
      }
      // Adult non-winners retain an outlet after the source maiden age window ends.
      for(let k=0;k<24;k++)for(const surface of ['草地','泥地']){const pool=tracks.filter(t=>t.surfaces.includes(surface));if(!pool.length)continue;const t=pool[k%pool.length],d=W().date(k);w.races.push(sourceRace(w,{id:`adult-maiden:${k}:${surface}`,name:`${t.name}成年未胜利补充赛`,raceClass:'maiden',surface,distance:[1200,1600,2000,2400][k%4],month:d.month,half:d.half,ageRestriction:{type:'min',age:4}},t,{demandDriven:true,support:true,sourceNote:'主席补充赛事'}));}
    }else for(let k=0;k<24;k++)for(const surface of ['草地','泥地']){
      const pool=tracks.filter(t=>t.surfaces.includes(surface));if(!pool.length)continue;const t=pool[k%pool.length],d=W().date(k);
      for(let lane=0;lane<2;lane++)w.races.push(sourceRace(w,{id:`support:${area.id}:${k}:${surface}:${lane}`,name:`${area.name}${d.month}月${d.half===1?'上':'下'}${surface}补充公开赛`,raceClass:'op',surface,distance:[1200,1600,2000,2400][(k+lane)%4],month:d.month,half:d.half,ageRestriction:{type:'min',age:2}},t,{support:true,demandDriven:true,sourceNote:'主席补充赛事'}));
    }
  }
  function create(opts={}) {
    const w=W().createWorld({id:opts.id,seed:opts.seed,name:opts.name,blank:true});
    Object.assign(w,{worldSystemVersion:2,worldType:opts.worldType,generationVersion:1,regions:[],tracks:[],races:[],meetingGroups:[],venueAssignments:[],travelOverrides:{},referenceAudit:[],worldChanges:[],referenceVersion:ns.ChairmanVenues?.version||'1',worldPhase:'setup'});
    w.honors.associations={};
    const selected=opts.worldType==='blank'?[]:opts.regionKeys||['japan'];
    check(new Set(selected).size===selected.length,'地区选择重复。');
    for(const key of selected){
      const spec=ns.ChairmanVenues.regionSpecs.find(r=>r.key===key);check(spec,'参考地区不存在。');
      const entries=ns.ChairmanVenues.catalogue().filter(r=>r.regionKey===key),confirmed=entries.filter(r=>r.status==='confirmed');
      const count=opts.population?.[key]??(key==='japan'?1000:Math.max(100,Math.ceil(confirmed.length*5/4)*4));
      check(Number.isSafeInteger(count)&&count>=0,'初始马数须为非负整数。');
      const area=newRegion(w,{...spec,id:mint(w,'region'),initialCount:count,annualTarget:opts.annualTargets?.[key]??Math.ceil(count/4),generation:{...defaults(),...(key==='japan'?{surfaceWeights:{草地:70,泥地:25,二刀流:5}}:{})}});validateRegion(area);w.regions.push(area);
      w.referenceAudit.push(...entries.map(e=>({...copy(e),regionId:area.id})));
      const hostedVenueKeys={
        'breeders-cup':['santa-anita','del-mar','keeneland'],
        jbc:['oi','funabashi','kawasaki','morioka','nagoya','saga','kanazawa']
      };
      const venueKeys=new Set(confirmed.flatMap(e=>hostedVenueKeys[e.hostGroup]||[e.venueKey]));
      if(key==='japan')ns.ChairmanVenues.tracks.filter(t=>t.regionKey==='japan').forEach(t=>venueKeys.add(t.key));
      for(const venueKey of venueKeys){const data=ns.ChairmanVenues.tracks.find(t=>t.key===venueKey);check(data,'马场资料缺失。');w.tracks.push(newTrack(w,area,{...data,id:mint(w,'track')}));}
      const source=new Map(ns.RaceRegistry.all().map(r=>[r.id,r]));
      for(const e of confirmed){const t=w.tracks.find(t=>t.key===e.venueKey);const s=source.get(e.sourceId);const race=sourceRace(w,s,t,{sourceRecord:copy(e),sourceBaseline:copy(s)});if(e.courseName){const config=t.configurations.find(c=>c.name===e.courseName);check(config,'赛事赛道资料缺失。');race.courseConfigId=config.id;}w.races.push(race);}
      addSupport(w,area);
    }
    const hostedGroups=[
      {sourceKey:'breeders-cup',name:'育马者杯',trackKeys:['santa-anita','del-mar','keeneland']},
      {sourceKey:'jbc',name:'JBC',trackKeys:['oi','funabashi','kawasaki','morioka','nagoya','saga','kanazawa']}
    ];
    for(const definition of hostedGroups){
      const members=w.races.filter(r=>r.sourceRecord?.hostGroup===definition.sourceKey);
      if(members.length)w.meetingGroups.push({id:mint(w,'meeting'),sourceKey:definition.sourceKey,name:definition.name,mode:'cycle',startYear:1,trackIds:definition.trackKeys.map(k=>w.tracks.find(t=>t.key===k)?.id).filter(Boolean),raceIds:members.map(r=>r.id),yearOverrides:{},enabled:true});
    }
    ns.ChairmanHonors.initialize(w);
    W().seeded(w,()=>{for(const area of w.regions)for(let i=0;i<area.initialCount;i++){
      const age=2+Math.floor(i/Math.max(1,Math.ceil(area.initialCount/4)))%4,q=age===2?0:1+i%4;
      W().addHorse(w,{homeRegion:area.name,homeRegionId:area.id,age,qualification:q,initialQualification:q,sourceKind:'initial'});
    }});
    w.settings.annualNewHorses=w.regions.reduce((n,r)=>n+r.annualTarget,0);
    if(opts.breeding!==false)ns.ChairmanBreeding.enable(w,{foundation:opts.foundation!==false&&selected.length>0,background:opts.foundation!==false&&selected.length>0});
    synchronize(w);refreshAssignments(w);if(w.horses.length&&w.races.length){w.worldPhase='running';plan(w);}W().validateWorld(w);return w;
  }
  function assertReady(w) {
    check(w.regions.some(r=>!r.disabled)&&w.tracks.some(t=>!t.deleted)&&w.races.some(r=>!r.deleted),'世界仍在筹备：请先创建地区、马场和赛事。');
    check(w.horses.filter(h=>h.status==='active').length>=2,'世界仍在筹备：至少需要两匹可参赛马。');
  }
  function plan(w) {
    if(w.phase!=='season')return;
    synchronize(w);refreshAssignments(w);ns.ChairmanSeries?.prepare(w);
    const random=R.seeded(w.aiRngState),now=w.turn,events=[],indexes=new Map();
    for(const d of w.races)for(const y of [year(w),year(w)+1]){
      const locked=w.lockedRaces?.[`${y}:${d.id}`]||ns.ChairmanSeries?.frozenRace(w,d.id,y);
      if(!locked&&(d.deleted||d.lastHeldYear===y||y<(d.notBeforeYear||1)))continue;
      const race=locked||resolveRace(w,d,y),turn=at(y,race);if(turn<now||turn>=now+6)continue;
      const e={race,turn,key:`${y}:${d.id}`,locked:!!locked};events.push(e);indexes.set(e.key,e);
    }
    R.withSource(random,()=>{
      const accepted=new Map(),pending=[],eligibleBuckets=new Map(),preserved=new Set();
      const active=w.horses.filter(h=>h.status==='active');
      for(const h of active){
        const b=h.booked,old=b&&indexes.get(`${W().date(b.turn).year}:${b.raceId}`);
        if(old&&(old.locked||b.preparationTurn!=null&&b.preparationTurn<=now)){
          const list=accepted.get(old.key)||[];list.push(h);accepted.set(old.key,list);preserved.add(old.key);continue;
        }
        h.booked=null;
        const goals=(w.seriesState?.current||[]).filter(s=>!s.settled&&s.results.length&&s.results.every(r=>r.horseId===h.id&&r.eligible)&&ns.ChairmanSeries.ageOK(s.ageRule,W().ageOf(w,h))).map(s=>s.races.filter(r=>!s.results.some(p=>p.raceId===r.id)).map(r=>({race:r,turn:at(s.year,r)})).sort((a,b)=>a.turn-b.turn)[0]).filter(Boolean);
        const goal=goals.sort((a,b)=>a.turn-b.turn)[0];
        const bucketKey=[h.birthYear,h.gender,h.qualification,h.lifetime.starts===0,h.lifetime.wins>0].join(':');
        if(!eligibleBuckets.has(bucketKey))eligibleBuckets.set(bucketKey,events.filter(e=>W().eligible(w,{...h,restUntil:0},e.race,e.turn)));
        const forms=new Map();for(const p of h.recentForm||[])if(p.tf!=null){const key=p.surface+':'+W().category(p.distance),v=forms.get(key)||{sum:0,count:0};v.sum+=p.tf;v.count++;forms.set(key,v);}
        const regional=region(w,h.generationRegionId||h.homeRegionId),choices=[];
        for(const e of eligibleBuckets.get(bucketKey)){
          const r=e.race;if(goal&&r.id!==goal.race.id&&(e.turn>=goal.turn||goal.turn-e.turn<Math.max(3,travelTurns(w,r.regionId,goal.race.regionId))))continue;const path=route(w,h,r,e.turn);if(!path.reachable)continue;
          const sample=forms.get(r.surface+':'+W().category(r.distance)),form=sample?sample.sum/sample.count:100;
          const surfacePrior=(regional?.generation.surfaceWeights[r.surface]||0)/100;
          const suitable=(form-100)*.16+(!h.lifetime.starts?surfacePrior:0);
          const isGraded=graded(r),promotion=(h.qualification||0)>=3||h.lifetime.wins>0;
          const utility=(goal?.race.id===r.id?12:0)+suitable+({g1:9,g2:8,g3:7,op:4,'three-win':6,'two-win':6,'one-win':6,new:7,maiden:6}[r.raceClass]||0)+(isGraded&&promotion?2:0)-(e.turn-now)*1.4-path.duration+(r.regionId===h.homeRegionId?1:0)+R.next()*3;
          choices.push({...e,path,utility});
        }
        const target=choices.filter(e=>graded(e.race)).reduce((best,e)=>!best||e.utility>best.utility?e:best,null);h.target=target?{raceId:target.race.id,turn:target.turn,reason:'依据公开表现与可达赛历安排'}:null;
        pending.push({h,choices:choices.filter(e=>e.turn<now+6),rating:W().entryRating(h)??0,tie:R.next()});
      }
      pending.sort((a,b)=>b.rating-a.rating||b.h.lifetime.prize-a.h.lifetime.prize||a.tie-b.tie);
      for(const p of pending){
        // Occupied support races attract the next legal runner, reducing fragmentation.
        const need=e=>e.race.support?((accepted.get(e.key)?.length||0)>0?2:0):Math.max(0,8-(accepted.get(e.key)?.length||0));
        let e=null,score=-Infinity;for(const candidate of p.choices){if((accepted.get(candidate.key)?.length||0)>=candidate.race.capacity)continue;const value=candidate.utility+need(candidate);if(value>score){e=candidate;score=value;}}if(!e)continue;
        const list=accepted.get(e.key)||[];list.push(p.h);accepted.set(e.key,list);
        p.h.booked={raceId:e.race.id,turn:e.turn,targetRegion:e.path.targetRegion,targetRegionId:e.path.targetRegionId,fromRegionId:e.path.fromRegionId,preparationTurn:e.path.preparationTurn,travelTurns:e.path.duration};
      }
      // A minimum legal field for a planned named event takes priority over
      // extra runners elsewhere. Only move unlocked, eligible public candidates;
      // keep at least two runners in every other named event.
      for(const e of events.filter(e=>!e.race.support&&!e.locked&&!preserved.has(e.key)).sort((a,b)=>a.turn-b.turn)){
        const list=accepted.get(e.key)||[];
        if(list.length>=2)continue;
        for(const p of pending.slice().reverse()){
          if(list.length>=2)break;
          const choice=p.choices.find(c=>c.key===e.key);if(!choice||list.includes(p.h))continue;
          const booked=p.h.booked,donor=booked&&indexes.get(`${W().date(booked.turn).year}:${booked.raceId}`),rows=donor&&accepted.get(donor.key);
          if(donor&&(donor.locked||preserved.has(donor.key)||!donor.race.support&&rows.length<=2))continue;
          if(rows)rows.splice(rows.indexOf(p.h),1);
          list.push(p.h);accepted.set(e.key,list);
          p.h.booked={raceId:e.race.id,turn:e.turn,targetRegion:choice.path.targetRegion,targetRegionId:choice.path.targetRegionId,fromRegionId:choice.path.fromRegionId,preparationTurn:choice.path.preparationTurn,travelTurns:choice.path.duration};
        }
      }
      // Consolidate single-runner demand races before they are locked.
      for(const [key,list]of accepted){const e=indexes.get(key);if(!list.length||list.length>=8||!e.race.demandDriven||e.locked||preserved.has(key))continue;
        const alternative=[...accepted].find(([k,rows])=>{const a=indexes.get(k);return k!==key&&!preserved.has(k)&&!a.locked&&rows.length>0&&rows.length<8&&rows.length+list.length<=a.race.capacity&&a.race.demandDriven&&a.turn===e.turn&&a.race.raceClass===e.race.raceClass&&a.race.ageRule===e.race.ageRule&&a.race.sexRule===e.race.sexRule&&a.race.surface===e.race.surface&&a.race.regionId===e.race.regionId&&list.every(h=>W().eligible(w,h,a.race,a.turn));});
        if(alternative){const a=indexes.get(alternative[0]);for(const h of list){alternative[1].push(h);h.booked={...h.booked,raceId:a.race.id};}list.length=0;}
      }
    });
    w.aiRngState=random.state();
    for(const h of w.horses){const b=h.booked;if(b&&b.preparationTurn!=null&&b.preparationTurn<=w.turn){const y=W().date(b.turn).year;freeze(w,b.raceId,y);w.lockedRaces[`${y}:${b.raceId}`]||=resolveRace(w,w.races.find(r=>r.id===b.raceId),y);}}
    ns.ChairmanSeries?.prepare(w);
  }
  function validateRegion(r) {
    check(typeof r.name==='string'&&r.name.trim()&&r.name.length<=80,'地区名称须为1～80字。');
    check(['日本','欧洲','美国'].includes(r.baseRegion),'无效的基础环境。');
    check(['日本','香港','美国','欧洲','其他'].includes(r.environment?.grass)&&['日本','中东','美国'].includes(r.environment?.dirt)&&['日本','欧洲','美国'].includes(r.environment?.jockeyPool),'比赛环境无效。');
    const g=r.generation,weights=g?.surfaceWeights;check(weights&&['草地','泥地','二刀流'].every(k=>Number.isFinite(weights[k])&&weights[k]>=0)&&Math.abs(Object.values(weights).reduce((a,b)=>a+b,0)-100)<1e-8,'草泥类型比例须为非负数且合计100%。');
    const tw=g.trackTypeWeights||defaults().trackTypeWeights;check(['burst','sustained','attrition'].every(k=>Number.isFinite(tw[k])&&tw[k]>=0)&&['burst','sustained','attrition'].some(k=>tw[k]>0),'三类型权重必须非负且至少一项大于0。');
    for(const k of ['grass','dirt'])check(Array.isArray(g.distanceWeights?.[k])&&g.distanceWeights[k].length===6&&g.distanceWeights[k].every(v=>Number.isFinite(v)&&v>=0)&&g.distanceWeights[k].some(v=>v>0),'距离权重须为六项非负数且至少一项大于零。');
    check(Number.isSafeInteger(r.annualTarget)&&r.annualTarget>=0&&Number.isSafeInteger(r.initialCount)&&r.initialCount>=0,'人口设置须为非负整数。');
    check(typeof r.trafficGroup==='string'&&r.trafficGroup.trim(),'请填写交通分组。');
  }
  const editKinds=['region','track','race','meeting','traffic','qualification','populate','source'];
  function edit(world,kind,v) {
    return W().mutate(world,w=>{
      if(kind==='source'){
        const audit=w.referenceAudit.find(r=>r.sourceId===v.sourceId),source=ns.RaceRegistry.all().find(r=>r.id===v.sourceId),track=w.tracks.find(t=>t.id===v.trackId);check(audit&&source&&track&&!track.deleted,'来源赛事或选定马场不存在。');check(track.surfaces.includes(source.surface),'所选马场不支持该赛事场地。');
        const old=w.races.find(r=>r.sourceId===v.sourceId);check(!old,'来源赛事已经启用，请在赛历中编辑。');
        const record={...copy(audit),status:'modified',venueKey:track.key||null,reason:'玩家指定举办地；未作为官方核对结论。',sourceUrl:String(v.sourceUrl||audit.sourceUrl||''),checkedAt:null};
        w.races.push(sourceRace(w,source,track,{sourceRecord:record,sourceBaseline:copy(source)}));Object.assign(audit,record);
      }else if(kind==='populate'){
        const area=region(w,v.regionId);check(area&&!area.disabled&&Number.isInteger(v.count)&&v.count>=1&&v.count<=10000,'请选择启用地区与1～10000匹生成数量。');for(let i=0;i<v.count;i++)W().addHorse(w,{homeRegionId:area.id,homeRegion:area.name,age:2,sourceKind:'external'});
      }else if(kind==='region'){
        const old=region(w,v.id),r=old?{...copy(old),...copy(v)}:newRegion(w,v);validateRegion(r);
        check(!w.regions.some(a=>a.id!==r.id&&a.name===r.name),'地区名称已存在。');
        if(r.disabled)check(!w.venueAssignments.some(a=>a.frozen&&a.year>=year(w)&&w.tracks.find(t=>t.id===a.trackId)?.regionId===r.id)&&!Object.values(w.lockedRaces||{}).some(x=>x.regionId===r.id)&&!w.tracks.some(t=>t.regionId===r.id&&!t.deleted)&&!w.horses.some(h=>h.homeRegionId===r.id&&['active','juvenile'].includes(h.status)||h.booked?.targetRegionId===r.id)&&!(w.breeding?.manual||[]).some(p=>(p.homeRegionId||region(w,p.homeRegion)?.id)===r.id),'地区仍有在用马场、马匹、报名或繁殖安排，请先处理关联。');
        if(old&&(JSON.stringify(old.generation)!==JSON.stringify(r.generation)||JSON.stringify(old.environment)!==JSON.stringify(r.environment)))r.generationVersion=(old.generationVersion||1)+1;
        if(old&&w.honors?.associations[old.id]?.name===old.name+'马会')w.honors.associations[old.id].name=r.name+'马会';
        r.playerModified=true;if(old)Object.assign(old,r);else w.regions.push(r);
      }else if(kind==='track'){
        const old=w.tracks.find(t=>t.id===v.id),area=region(w,v.regionId||v.region);check(area&&!area.disabled,'请选择启用的地区。');
        const t=newTrack(w,area,{...(old||{}),...v,regionId:area.id,region:area.name});W().validateTrack(t,w);validateCourseProfiles(t);
        check(!w.tracks.some(x=>x.id!==t.id&&x.name===t.name),'马场名称已存在。');
        for(const r of w.races.filter(r=>!r.deleted&&r.trackId===t.id))check(!t.deleted&&t.surfaces.includes(r.surface),'马场仍有使用该场地的赛事。');
        for(const a of w.venueAssignments.filter(a=>a.frozen&&a.year>=year(w)&&a.trackId===t.id))check(!t.deleted,`该马场已锁定第${a.year}年举办安排。`);
        for(const [key,r]of Object.entries(w.lockedRaces||{}))if(Number(key.split(':')[0])>=year(w)&&r.trackId===t.id)check(!t.deleted,'马场仍有已锁定届次，不能停用。');
        t.playerModified=true;if(old)Object.assign(old,t);else w.tracks.push(t);
      }else if(kind==='race'){
        const old=w.races.find(r=>r.id===v.id),r={...(old||{id:mint(w,'race'),deleted:false}),...copy(v)};
        r.grade=r.raceClass==='op'&&r.grade==='L'?'L':labels[r.raceClass];W().validateRace(w,r);
        if(old?.lastHeldYear===year(w))r.notBeforeYear=year(w)+1;
        for(const a of w.venueAssignments.filter(a=>a.year===year(w)&&a.frozen&&a.races.some(x=>x.id===r.id)))check(a.races.find(x=>x.id===r.id).surface===r.surface,'本届举办地已锁定，不能改变所需草泥场地。');
        if(old?.sourceRecord)r.sourceRecord={...old.sourceRecord,status:'modified'};
        if(old)Object.assign(old,r);else w.races.push(r);
      }else if(kind==='meeting'){
        const old=w.meetingGroups.find(g=>g.id===v.id),g={id:old?.id||mint(w,'meeting'),yearOverrides:{},enabled:true,...copy(old),...copy(v)};
        validateGroup(w,g);
        for(const a of w.venueAssignments.filter(a=>a.groupId===g.id&&a.frozen))check(!g.yearOverrides[a.year]||g.yearOverrides[a.year]===a.trackId,'本届举办地已锁定，只能调整未来年度。');
        g.playerModified=true;if(old)Object.assign(old,g);else w.meetingGroups.push(g);
      }else if(kind==='traffic'){
        check(region(w,v.from)&&region(w,v.to)&&v.from!==v.to&&Number.isInteger(v.turns)&&v.turns>=0&&v.turns<=4,'交通地区或准备回合无效。');w.travelOverrides[[v.from,v.to].sort().join('|')]=v.turns;
      }else if(kind==='qualification'){
        check(w.editor?.enabled,'请先开启世界编辑模式。');const h=w.horses.find(h=>h.id===v.id);check(h&&Number.isInteger(v.value)&&v.value>=0&&v.value<=4,'参赛资格无效。');h.qualification=v.value;
      }
      synchronize(w);for(const g of w.meetingGroups)validateGroup(w,g);plan(w);validate(w);
      w.worldChanges.push({id:mint(w,'change'),turn:w.turn,kind,entityId:v.id||null,patch:copy(v)});
    });
  }
  function preview(w,kind,value) {const out=edit(w,kind,value);W().validateWorld(out.world);return {worldId:w.id,revision:w.revision,kind,value:copy(value),output:out};}
  function apply(w,p){check(p.worldId===w.id&&p.revision===w.revision,'世界已改变，请重新预览。');W().validateWorld(p.output.world);return p.output;}
  function validate(w) {
    check(w.worldSystemVersion===2&&['blank','reference'].includes(w.worldType),'新世界版本或类型无效。');
    for(const r of w.regions)validateRegion(r);
    for(const t of w.tracks)validateCourseProfiles(t);
    for(const h of w.horses){check(region(w,h.homeRegionId)&&region(w,h.locationRegionId),'马匹地区编号缺失。');check(Number.isInteger(h.qualification)&&h.qualification>=0&&h.qualification<=4,'马匹资格无效。');}
    for(const t of w.tracks){check(region(w,t.regionId),'马场地区编号缺失。');check(Array.isArray(t.configurations)&&t.configurations.length&&new Set(t.configurations.map(c=>c.id)).size===t.configurations.length,'赛道配置缺失或重复。');for(const c of t.configurations)check(t.surfaces.includes(c.surface)&&['东京','中山','京都','阪神','其他地方'].includes(c.courseType),'赛道场地或适性映射无效。');check(t.surfaces.every(s=>t.configurations.some(c=>c.surface===s)),'场地缺少赛道配置。');}
    for(const r of w.races){const t=w.tracks.find(t=>t.id===r.trackId);check(t,'赛事马场编号缺失。');if(!r.deleted&&r.courseConfigId)check(t.configurations.some(c=>c.id===r.courseConfigId&&c.surface===r.surface),'指定赛道不属于举办马场或场地不匹配。');}
    for(const g of w.meetingGroups)validateGroup(w,g);
    check(new Set(w.venueAssignments.map(a=>a.id)).size===w.venueAssignments.length,'年度举办记录重复。');
    for(const a of w.venueAssignments)check(w.meetingGroups.some(g=>g.id===a.groupId)&&w.tracks.some(t=>t.id===a.trackId)&&Number.isInteger(a.year)&&a.year>=1&&(!a.frozen||Array.isArray(a.races)&&a.races.every(r=>r.trackId===a.trackId)),'年度举办记录无效。');
  }
  ns.ChairmanWorld={courseLabel,courseProfile,courseRows,isV2,classes,labels,graded,defaults,newRegion,newTrack,profile,region,horseInput,initializeHorse,synchronize,travelTurns,route,groupFor,resolveRace,refreshAssignments,freeze,rememberActual,validateGroup,eligible,recordPerformance,create,assertReady,plan,editKinds,edit,preview,apply,validate,prizes,sourceRace};
})();
