const fs=require('node:fs'),vm=require('node:vm'),{performance}=require('node:perf_hooks'),{IDBFactory,IDBKeyRange}=require('fake-indexeddb');
const {loadChairmanRules}=require('../tests/helpers/project-loader');
(async()=>{
 const p=loadChairmanRules(),n=p.rules,W=n.ChairmanRules,V=n.ChairmanWorld;
 Object.assign(p.context.window,{indexedDB:new IDBFactory(),IDBKeyRange,setInterval,clearInterval});for(const f of ['js/chairman-storage.js','js/chairman-history.js'])vm.runInContext(fs.readFileSync(f,'utf8'),p.context);
 const w=V.create({worldType:'reference',regionKeys:n.ChairmanVenues.regionSpecs.map(r=>r.key),foundation:false,breeding:false,seed:97,id:'world-storage-audit'});w.turn=480;w.lastCompletedTurn=479;w.seriesState.year=21;
 for(const h of w.horses){h.birthYear+=20;h.annual.year=21;h.booked=null;}for(const h of w.honorProfiles)h.year=21;
 const occurrences=[],performances=[];
 for(let y=1;y<=20;y++){for(const g of w.meetingGroups)V.freeze(w,g.raceIds[0],y);for(const definition of w.races.filter(r=>!r.support)){
  const r=V.resolveRace(w,definition,y),turn=(y-1)*24+(r.month-1)*2+r.half-1,id=`${y}:${r.id}`;
  occurrences.push({id,raceId:r.id,race:r,year:y,turn,name:r.name,raceClass:r.raceClass,count:12,status:'completed'});
  for(let i=0;i<12;i++){const h=w.horses[(turn*17+i)%w.horses.length];performances.push({id:`${id}:${h.id}`,occurrenceId:id,horseId:h.id,horseName:h.name,raceId:r.id,raceName:r.name,raceClass:r.raceClass,year:y,turn,homeRegion:h.homeRegion,homeRegionId:h.homeRegionId,regionId:r.regionId,trackId:r.trackId,rank:i+1,total:100-i,tf:110-i,manualRating:null,prize:i<5?r.prizes[i]:0});}
 }}
 W.validateWorld(w);const s=await n.ChairmanStorage.open();try{await s.acquire(w.id);let t=performance.now();await s.commitChanges(null,{world:w,occurrences,performances});const saveMs=performance.now()-t;t=performance.now();const history=await s.historyPage(w,{},0),queryMs=performance.now()-t;t=performance.now();const track=await s.historyPage(w,{},0,{trackId:w.tracks[0].id}),trackQueryMs=performance.now()-t;t=performance.now();const snapshot=await s.exportWorld(w.id),exportMs=performance.now()-t;s.validateSnapshot(snapshot);await s.saveSlot(w.id,1);const restore=await s.loadSlot(1,true);s.validateSnapshot(await s.exportWorld(restore.id));
 const report={syntheticHistory:true,description:'真实组合预设马群规模，构造20年每场12匹历史用于独立存储压力检查；不是长期模拟完成率证据。',horses:w.horses.length,occurrences:occurrences.length,performances:performances.length,saveMs:Math.round(saveMs),historyQueryMs:Math.round(queryMs),trackQueryMs:Math.round(trackQueryMs),exportMs:Math.round(exportMs),exportMiB:+(Buffer.byteLength(JSON.stringify(snapshot))/1048576).toFixed(2),resultsReturned:history.rows.length,trackResultsReturned:track.rows.length,restoredVersion:restore.worldSystemVersion};fs.writeFileSync('artifacts/chairman-world-storage.json',JSON.stringify(report,null,2));console.log(report);
 }finally{await s.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
