(function(){
  'use strict';
  const ns=window.Keiba,W=ns.ChairmanRules,V=ns.ChairmanWorld,copy=W.clone;
  const check=(v,m)=>{if(!v)throw Error(m);};
  const hash=v=>String(ns.ChairmanRatings.hash(JSON.stringify(v)));
  function exportEvents(w,options={}){
    const series=w.series.filter(s=>!s.deleted&&(!options.seriesIds||options.seriesIds.includes(s.id))&&(options.seriesIds||!options.raceIds));
    const ids=new Set([...(options.raceIds||[]),...series.flatMap(s=>s.raceIds)]);
    const races=w.races.filter(r=>!r.deleted&&(!options.raceIds&&!options.seriesIds||ids.has(r.id))).map(r=>{const v=copy(r);delete v.lastHeldYear;delete v.notBeforeYear;return v;});
    check(races.length,'没有可导出的比赛。');
    const groups=w.meetingGroups.filter(g=>g.raceIds.some(id=>races.some(r=>r.id===id))).map(g=>({...copy(g),sourceKey:g.sourceKey||`${w.id}:${g.id}`,raceIds:g.raceIds.filter(id=>races.some(r=>r.id===id))}));
    const trackIds=new Set([...races.map(r=>r.trackId),...groups.flatMap(g=>[...g.trackIds,...Object.values(g.yearOverrides)])]);
    const assignments=w.venueAssignments.filter(a=>groups.some(g=>g.id===a.groupId)).map(a=>({...copy(a),races:a.races?.filter(r=>races.some(v=>v.id===r.id))}));
    assignments.forEach(a=>trackIds.add(a.trackId));
    const tracks=w.tracks.filter(t=>trackIds.has(t.id)),regions=w.regions.filter(r=>tracks.some(t=>t.regionId===r.id));
    const data={worldSystemVersion:2,regions:copy(regions),tracks:copy(tracks),races,series:copy(series),meetingGroups:groups,venueAssignments:assignments};
    return {format:'keiba-chairman-content',version:2,kind:'events',id:'events:'+w.id,revision:hash(data),...data};
  }
  function* previewSteps(world,p,options={}){
    check(V.isV2(world),'此赛事包包含新版地区与举办规则，请导入新建的主席世界；旧世界不会自动升级。');
    const w=copy(world),changes=[],warnings=[],maps={},mode=options.mode||'skip',bindings=options.mappings||{};
    const collections={region:w.regions,track:w.tracks,race:w.races,meeting:w.meetingGroups,series:w.series};
    function map(kind,row){
      const key=`${p.id}:${kind}:${row.id}`,mapping=w.sourceMappings.find(m=>m.id===key);
      const stable=kind==='race'?row.sourceId:kind==='meeting'?row.sourceKey:kind==='region'?row.key:kind==='track'?row.key:null;
      const stableKey=kind==='race'?'sourceId':kind==='meeting'?'sourceKey':'key';
      const bound=bindings[`${kind}:${row.id}`];
      const old=collections[kind].find(v=>v.id===(bound||mapping?.localId))||(!bound&&stable?collections[kind].find(v=>v[stableKey]===stable&&(kind!=='race'||!row.support||w.tracks.find(t=>t.id===v.trackId)?.key===p.tracks.find(t=>t.id===row.trackId)?.key)):null);
      check(!bound||old,'指定的本地关联不存在。');
      const name=String(options.renames?.[`${kind}:${row.id}`]||row.name||'').trim();
      check(old||kind==='race'||!collections[kind].some(v=>v.name===name),'同名对象需要明确关联或改名：'+name);
      const id=old?.id||`${kind}-${w.nextId++}`;
      const modified=old?.sourceRecord?.status==='modified'||old?.playerModified||kind==='race'&&old&&w.worldChanges.some(c=>c.kind==='race'&&c.entityId===old.id)||options.referenceUpdate&&kind==='region'&&!!old;
      const write=!old||mode==='update'&&!modified&&!bound&&!(options.referenceUpdate&&world.referenceVersion===ns.ChairmanVenues.version);
      if(modified&&mode==='update')warnings.push(name+'已由玩家修改，本次保留。');
      maps[`${kind}:${row.id}`]=id;
      if(!mapping)w.sourceMappings.push({id:key,packageId:p.id,kind,sourceId:row.id,localId:id,revision:p.revision,hash:hash(row)});
      else if(write)Object.assign(mapping,{revision:p.revision,hash:hash(row)});
      changes.push({kind,sourceId:row.id,id,name,action:!old?'新增':write?'更新':'复用／保留',before:write&&old?copy(old):null,after:write?copy(row):null});
      return {id,old,write,name};
    }
    function put(kind,m,value){if(!m.write)return;if(m.old)Object.assign(m.old,value);else collections[kind].push(value);}
    function remapProfile(r) {
      if(!r.courseProfile)return r;
      r.courseProfile={...r.courseProfile,id:`chairman:${w.id}:${r.trackId}:${r.surface}:${r.distance}`,trackId:r.trackId,trackKey:w.tracks.find(t=>t.id===r.trackId)?.key||r.trackId,courseConfigId:r.courseConfigId};
      r.courseProfileId=r.courseProfile.id;
      return r;
    }
    for(const r of p.regions){const m=map('region',r);put('region',m,V.newRegion(w,{...r,id:m.id,name:m.name,initialCount:0,annualTarget:r.annualTarget||0}));}
    for(const t of p.tracks){const m=map('track',t),sourceRegion=p.regions.find(r=>r.id===t.regionId||r.name===t.region),region=w.regions.find(r=>r.id===maps['region:'+sourceRegion?.id]);check(region,'马场引用缺失地区。');
      const v=V.newTrack(w,region,{...copy(t),id:m.id,name:m.name,regionId:region.id,region:region.name,configurations:t.configurations?.map((x,i)=>({...x,id:m.old?.configurations[i]?.id||`${m.id}:course:${i}`}))});
      if(!m.write)check(m.old.regionId===region.id&&t.surfaces.every(s=>m.old.surfaces.includes(s)),'复用马场的地区或场地不匹配。');
      put('track',m,v);
      (t.configurations||[]).forEach((x,i)=>{const target=(m.write?v:m.old).configurations.find(c=>c.name===x.name&&c.surface===x.surface)||(m.write?v:m.old).configurations[i];check(target,'复用马场缺少来源赛道。');maps['course:'+x.id]=target.id;});
    }
    for(const r of p.races){const m=map('race',r),trackId=maps['track:'+r.trackId];check(trackId,'赛事缺少马场。');const v={...copy(r),id:m.id,name:m.name,trackId,courseConfigId:maps['course:'+r.courseConfigId]||'',grade:r.grade||V.labels[r.raceClass],deleted:false};
      if(m.old?.lastHeldYear){v.lastHeldYear=m.old.lastHeldYear;if(v.lastHeldYear===W.date(w.turn).year)v.notBeforeYear=v.lastHeldYear+1;}
      delete v.courseProfile;delete v.courseProfileId;delete v.courseRouteId;delete v.courseRouteName;
      W.validateRace(w,v);put('race',m,v);
    }
    for(const g of p.meetingGroups||[]){const m=map('meeting',g),members=g.raceIds.map(id=>maps['race:'+id]);check(members.every(Boolean),'举办组成员引用缺失。');const value={...copy(g),id:m.id,name:m.name,trackIds:g.trackIds.map(id=>maps['track:'+id]),raceIds:[...new Set([...(m.old?.raceIds||[]),...members])],yearOverrides:Object.fromEntries(Object.entries(g.yearOverrides||{}).map(([y,id])=>[y,maps['track:'+id]]))};
      if(m.old){if(m.write)Object.assign(m.old,value);else m.old.raceIds=value.raceIds;}else w.meetingGroups.push(value);
    }
    for(const a of p.venueAssignments||[]){const groupId=maps['meeting:'+a.groupId],trackId=maps['track:'+a.trackId];check(groupId&&trackId,'年度举办记录引用缺失。');const id=`${groupId}:${a.year}`,old=w.venueAssignments.find(x=>x.id===id);
      const rows=(a.races||[]).map(r=>remapProfile({...copy(r),id:maps['race:'+r.id],trackId:maps['track:'+r.trackId],regionId:maps['region:'+r.regionId],courseConfigId:maps['course:'+r.courseConfigId]||'',meetingGroupId:groupId}));check(rows.every(r=>r.id&&r.trackId&&r.regionId),'锁定赛事依赖缺失。');
      if(old?.frozen){check(!a.frozen||old.trackId===trackId,'导入的锁定届次与当前世界冲突。');for(const r of rows)if(!old.races.some(x=>x.id===r.id))old.races.push(r);}
      else if(a.frozen){const value={...copy(a),id,groupId,trackId,races:rows};
        if(value.trackSnapshot){value.trackSnapshot.id=trackId;value.trackSnapshot.regionId=maps['region:'+value.trackSnapshot.regionId];value.trackSnapshot.configurations=value.trackSnapshot.configurations.map(c=>({...c,id:maps['course:'+c.id]||`${trackId}:course:${c.surface}`}));}
        if(old)Object.assign(old,value);else w.venueAssignments.push(value);}
    }
    for(const s of p.series){const m=map('series',s);if(!m.write)continue;const value={...copy(s),id:m.id,name:m.name,raceIds:s.raceIds.map(id=>maps['race:'+id]),deleted:false,startYear:s.startYear||W.date(w.turn).year};warnings.push(...ns.ChairmanSeries.validateDefinition(w,value).warnings);put('series',m,value);}
    yield {done:p.races.length,total:p.races.length,name:'校验举办组与年度届次'};
    V.synchronize(w);W.planEntries(w);W.validateWorld(w);w.revision=world.revision+1;
    return {baseRevision:world.revision,worldId:world.id,kind:p.kind,changes,warnings,errors:[],output:{world:w}};
  }
  function* referencePreview(w){
    check(V.isV2(w)&&w.worldType==='reference','仅现实参考新世界支持资料更新。');
    const keys=w.regions.map(r=>r.key).filter(k=>ns.ChairmanVenues.regionSpecs.some(r=>r.key===k));
    const fresh=V.create({worldType:'reference',regionKeys:keys,population:Object.fromEntries(keys.map(k=>[k,0])),foundation:false,breeding:false,seed:1,id:'reference-catalogue'});
    const p=exportEvents(fresh,{raceIds:fresh.races.filter(r=>!r.support).map(r=>r.id)}),out=yield* previewSteps(w,p,{mode:'update',referenceUpdate:true});
    out.output.world.referenceAudit=ns.ChairmanVenues.catalogue().filter(r=>keys.includes(r.regionKey)).map(r=>{const old=w.referenceAudit.find(a=>a.sourceId===r.sourceId);return {...copy(old?.status==='modified'?old:r),regionId:out.output.world.regions.find(a=>a.key===r.regionKey).id};});out.output.world.referenceVersion=ns.ChairmanVenues.version;return out;
  }
  ns.ChairmanWorldPackages={exportEvents,previewSteps,referencePreview};
})();
