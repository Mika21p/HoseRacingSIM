const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {loadChairmanRules}=require('./helpers/project-loader');
test('five seeds run ten years with and without series; rewards, pursuit and populations remain consistent',()=>{
  const {rules:n}=loadChairmanRules(),W=n.ChairmanRules,S=n.ChairmanSeries,report=[];
  for(const seed of [17,37,73,131,811]){
    const initial=W.createWorld({seed,horseCount:90});initial.settings.annualNewHorses=30;
    const ids=['takamatsunomiya-kinen','tokyo-yushun','japan-cup'].map(id=>initial.races.find(r=>r.sourceId===id)?.id).filter(Boolean);
    // Preset definitions retain source identity as their own stable race IDs.
    const picked=ids.length===3?ids:initial.races.filter(r=>['高松宫纪念','日本德比','日本杯'].includes(r.name)).map(r=>r.id);
    assert.equal(picked.length,3);
    // A controlled spring/autumn calendar: compatible ages, surface and sufficient rest.
    picked.forEach((id,i)=>Object.assign(initial.races.find(r=>r.id===id),{ageRule:'3+',surface:'草地',distance:1600,month:[3,6,10][i],half:1,trackId:initial.races.find(r=>r.id===picked[0]).trackId}));
    W.planEntries(initial);
    const withSeries=S.edit(initial,{name:'春秋三冠试验',raceIds:picked,bonus:3000},{acceptWarnings:true}).world;
    for(const enabled of [false,true]){let w=enabled?withSeries:W.clone(initial),starts=0,chances=0,followups=0,completed=0,cancelled=0,idle=0,continuationChances=0,continuationStarts=0,naturalSweeps=0,emptyYears=0;const rewards=new Set();
      for(let y=0;y<10;y++){
        const winners=[];
        while(w.phase==='season'){
          if(enabled)for(const h of w.horses)if(h.seriesTarget){chances++;if(h.booked?.raceId===h.seriesTarget.raceId)followups++;}
          const out=W.advanceHalfMonth(w);starts+=out.performances.length;cancelled+=out.occurrences.filter(r=>picked.includes(r.raceId)&&r.status==='cancelled').length;
          for(const r of out.seriesRewards||[]){assert.ok(!rewards.has(r.id));rewards.add(r.id);completed++;assert.equal(r.victories.length,3);assert.ok(r.victories.every(v=>v.horseId===r.horseId));}
          for(const raceId of picked){const occurrence=out.occurrences.find(o=>o.raceId===raceId);if(!occurrence)continue;const field=out.performances.filter(p=>p.occurrenceId===occurrence.id);if(winners.length&&winners[0]&&winners.every(id=>id===winners[0])){continuationChances++;if(field.some(p=>p.horseId===winners[0]))continuationStarts++;}winners.push(field.find(p=>p.rank===1&&!p.retired)?.horseId||null);}
          w=out.world;assert.ok(w.horses.every(h=>Number.isFinite(h.lifetime.prize)));
        }
        if(winners.length===3&&winners[0]&&winners.every(id=>id===winners[0]))naturalSweeps++;else emptyYears++;
        idle+=w.horses.filter(h=>h.status==='active'&&!h.annual.starts).length;W.validateWorld(w);w=W.finishYear(w).world;
      }
      report.push({seed,enabled,starts,pursuitTurns:chances,bookedNext:followups,completed,cancelled,idle,continuationChances,continuationStarts,naturalSweeps,emptyYears,duplicateRewards:0});
      assert.equal(W.date(w.turn).year,11);if(enabled)assert.equal(completed,naturalSweeps);
    }
  }
  fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/series-ten-year-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
});
test('ten thousand family templates validate and preview with progress, no hidden attributes or partial mutation',()=>{
  const {rules:n}=loadChairmanRules(),W=n.ChairmanRules,P=n.ChairmanPackages,w=W.createWorld({blank:true,seed:77,breeding:true});
  const nodes=Array.from({length:10000},(_,i)=>({id:'node-'+i,sourceKey:'scale:'+i,name:'家系资料'+i,gender:i%2?'牝马':'牡马',birthYear:i<2?1940:1960,fatherId:i<2?'':'node-0',motherId:i<2?'':'node-1',grade:'未公开',aliases:[],region:'日本'}));
  const p={format:'keiba-chairman-content',version:1,kind:'family',id:'scale-family',revision:'1',roots:nodes.slice(2).map(n=>n.id),nodes};
  const start=performance.now(),g=P.previewSteps(w,p);let chunks=0,result;for(;;){const next=g.next();if(next.done){result=next.value;break;}chunks++;}assert.ok(chunks>=100);assert.equal(w.familyTemplates.length,0);const applied=P.apply(w,result,true).world;
  assert.equal(applied.familyTemplates.length,10000);assert.equal(applied.horses.length,0);const query=n.ChairmanBreeding.query(applied,{view:'library',source:'imported',search:'家系资料',offset:9950});assert.equal(query.rows.length,50);assert.equal(query.total,10000);
  console.log(JSON.stringify({familyNodes:10000,chunks,previewAndQueryMs:Math.round(performance.now()-start)}));
});
