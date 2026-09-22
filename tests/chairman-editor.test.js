const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {IDBFactory,IDBKeyRange}=require('fake-indexeddb'),{loadChairmanRules}=require('./helpers/project-loader');const plain=v=>JSON.parse(JSON.stringify(v));
function setup(){const p=loadChairmanRules(),n=p.rules,W=n.ChairmanRules,E=n.ChairmanEditor,B=n.ChairmanBreeding;let w=W.createWorld({blank:true,seed:903,breeding:true});w.settings.annualNewHorses=0;W.seeded(w,()=>W.addHorse(w,{name:'普通测试马',age:3,gender:'牡马'}));return {...p,n,W,E,B,w};}
const streams=w=>[w.rngState,w.aiRngState,w.breeding?.rngState,w.honors?.rngState,w.contentState?.rngState];
test('editor defaults off, exposes private values only while enabled and preserves source and random streams',()=>{
 const {W,E,w}=setup(),id=w.horses[0].id,before=streams(w);assert.equal(w.editor.enabled,false);assert.ok(!E.project(w,w.horses[0]).real);assert.throws(()=>E.preview(w,'horse',id,{strength:91}),/开启/);
 const on=E.toggle(w,true).world;assert.equal(E.project(on,on.horses[0]).real.strength,on.horses[0].strength);const p=E.preview(on,'horse',id,{strength:91,breedingStrength:97});assert.deepEqual(streams(on),before);
 const out=E.apply(on,p).world;assert.equal(out.horses[0].origin,'ai');assert.equal(out.horses[0].strength,91);assert.equal(out.horses[0].breeding.strength,97);assert.deepEqual(streams(out),before);assert.equal(w.horses[0].editedByWorld,undefined);
 const off=E.toggle(out,false).world;assert.ok(!E.project(off,off.horses[0]).real);assert.equal(off.horses[0].strength,91);assert.throws(()=>E.apply(out,p),/重新预览/);
});
test('edits preserve existing performance, deterioration, rating and locked entry constraints',()=>{
 const {W,E,w}=setup();w.horses[0].annual.tf=124;w.horses[0].annual.starts=w.horses[0].lifetime.starts=2;w.horses[0].maturity.decline=8;let on=E.toggle(w,true).world,h=on.horses[0];
 assert.throws(()=>E.preview(on,'horse',h.id,{age:5}),/出赛/);assert.throws(()=>E.preview(on,'horse',h.id,{status:'active',restUntil:0}),/不允许/);
 const out=E.apply(on,E.preview(on,'horse',h.id,{name:'新名字',strength:88,peakEnd:'八岁冬'})).world;assert.equal(out.horses[0].annual.tf,124);assert.equal(out.horses[0].lifetime.starts,2);assert.equal(out.horses[0].maturity.decline,8);
 h.booked={raceId:'locked',turn:1,preparationTurn:0};assert.throws(()=>E.preview(on,'horse',h.id,{homeRegion:'欧洲'}),/锁定/);
});
test('world template overlays affect future founders, not existing individuals or another world',()=>{
 const {n,W,E,B,w}=setup(),t=n.ChairmanPedigrees.records.find(t=>t.core&&t.gender==='牡马');const existing=B.seeded(w,()=>B.founder(w,'日本','牡马',t)),strength=existing.breeding.strength;
 const on=E.toggle(w,true).world,changed=E.apply(on,E.preview(on,'template',t.id,{displayName:'改库测试',game:{...t.game,breedingBase:100}})).world;
 assert.equal(B.get(changed,existing.id).breeding.strength,strength);assert.equal(E.template(w,t.id).displayName,t.displayName);assert.equal(n.ChairmanPedigrees.records.find(v=>v.id===t.id).game.breedingBase,t.game.breedingBase);
 const fresh=W.createWorld({blank:true,seed:17,breeding:true});fresh.templateOverrides=plain(changed.templateOverrides);const h=B.seeded(fresh,()=>B.founder(fresh,'日本','牡马',E.template(fresh,t.id)));assert.equal(h.name,'改库测试');assert.ok(h.breeding.strength>=95);
 const reset=E.apply(changed,E.preview(changed,'template',t.id,{}, {reset:true})).world;assert.equal(E.template(reset,t.id).displayName,t.displayName);
});
test('pedigree edits rename shared ancestors, reject invalid relationships, and never fabricate ancestor traits',()=>{
 const {W,E,B,w}=setup();const f=B.seeded(w,()=>B.founder(w,'日本','牡马'));w.horses[0].fatherId=f.id;let on=E.toggle(w,true).world;
 const renamed=E.apply(on,E.preview(on,'horse',f.id,{name:'共享新名'})).world;assert.equal(B.get(renamed,renamed.horses[0].fatherId).name,'共享新名');assert.throws(()=>E.preview(on,'horse',f.id,{gender:'牝马'}),/性别|父母/);assert.throws(()=>E.preview(on,'horse',f.id,{fatherId:w.horses[0].id}),/年代|循环/);
 const ancestor={id:'pure',name:'仅档案',gender:'牡马',birthYear:-40,status:'ancestor'};on.pedigrees.push(ancestor);assert.deepEqual(Object.keys(E.project(on,ancestor).real).sort(),['breedingStrength','decline','lastInjury']);assert.throws(()=>E.preview(on,'horse','pure',{strength:80}),/无模拟/);
});
test('template disabling, source updates, precise generation presets and public exports remain separate',()=>{
 const {n,W,E,w}=setup(),P=n.ChairmanPackages,p=P.exportFamily(w,[w.horses[0].id]);let target=W.createWorld({blank:true,seed:17,breeding:true});target=P.apply(target,P.preview(target,p),true).world;target=E.toggle(target,true).world;const id=target.familyTemplates[0].id;
 target=E.apply(target,E.preview(target,'template',id,{name:'家系修改',displayName:'家系修改',game:{breedingBase:100,distance:2000,growthType:'晚熟',surface:'草地'},disabled:true})).world;assert.throws(()=>P.introduce(target,id),/停用/);assert.equal(n.ChairmanBreeding.query(target,{view:'library',instantiable:true,source:'imported'}).total,0);
 const updated=plain(p);updated.nodes[0].name='来源新版';updated.revision='2';target=P.apply(target,P.preview(target,updated,{mode:'update'}),true).world;assert.equal(E.template(target,id).name,'家系修改');
 target=E.apply(target,E.preview(target,'template',id,{disabled:false})).world;const generated=P.introduce(target,id).world.horses[0];assert.ok(generated.breeding.strength>=95);assert.equal(generated.growthType,'晚熟');assert.equal(generated.coreDist,2000);
 const family=P.exportFamily(target,[id]);assert.doesNotMatch(JSON.stringify(family),/breedingBase|strength|game|peakStart/);assert.equal(family.nodes[0].playerModified,true);assert.equal(n.ChairmanCSV.exportRows(w,'horse').includes(w.horses[0].name),false);
});
test('undo survives preferences and toggles, stops after gameplay and rejects no-op edits',()=>{
 const {W,E,w}=setup();let on=E.toggle(w,true).world,id=on.horses[0].id;assert.throws(()=>E.apply(on,E.preview(on,'horse',id,{name:on.horses[0].name})),/没有实际/);
 const changed=E.apply(on,E.preview(on,'horse',id,{name:'已修改'})).world;let ui=W.edit(changed,'ui',{horses:{sort:'strength',normalSort:'prize'}}).world;ui=E.toggle(E.toggle(ui,false).world,true).world;assert.equal(ui.ui.horses.sort,'prize');assert.ok(E.canUndo(ui));assert.equal(E.undo(ui).world.horses[0].name,w.horses[0].name);
 const advanced=W.advanceHalfMonth(changed).world;assert.equal(E.canUndo(advanced),false);assert.throws(()=>E.undo(advanced),/恢复点/);
});
test('editor transactions, checkpoint retention, reload undo, migration and snapshot v7 are complete',async()=>{
 const {n,W,E,w,context}=setup();Object.assign(context.window,{indexedDB:new IDBFactory(),IDBKeyRange,setInterval,clearInterval});for(const p of ['js/chairman-storage.js','js/chairman-history.js'])vm.runInContext(fs.readFileSync(p,'utf8'),context);
 const s=await n.ChairmanStorage.open();try{let current=E.toggle(w,true).world;await s.acquire(current.id);await s.commitChanges(null,{world:current});
 for(let i=0;i<7;i++){const out=E.apply(current,E.preview(current,'horse',current.horses[0].id,{name:'编辑'+i}));if(!i){await assert.rejects(s.commitChanges(current,out,{failForTest:true}),/中断/);assert.equal((await s.load(current.id)).horses[0].name,current.horses[0].name);}await s.commitChanges(current,out);current=await s.load(current.id);assert.ok(E.canUndo(current),'reload preserves undo');}
 const points=await s.query('checkpoints',current.id);assert.equal(points.rows.filter(p=>p.kind==='editor').length,5);const save=await s.exportWorld(current.id);assert.equal(save.version,9);assert.equal(s.db.version,9);s.validateSnapshot(save);assert.equal(save.records.editorRecords.length,7);await s.saveSlot(current.id,1);current=await s.loadSlot(1,true);assert.equal(current.horses[0].name,'编辑6');assert.ok(E.canUndo(current));
 const out=E.undo(current);await s.commitChanges(current,out);current=await s.load(current.id);assert.equal(current.horses[0].name,'编辑5');const edit=E.apply(current,E.preview(current,'horse',current.horses[0].id,{name:'历史写入前'}));await s.commitChanges(current,edit);current=edit.world;const history=W.mutate(current,(w,out)=>{out.revisions=[{id:'historical-edit',year:1,turn:0}];});await s.commitChanges(current,history);assert.equal(E.canUndo(await s.load(current.id)),false);
 const old=W.createWorld({blank:true});delete old.editor;delete old.templateOverrides;await s.acquire(old.id);await s.commitChanges(null,{world:old});const migrated=await s.load(old.id);assert.equal(migrated.editor.enabled,false);assert.deepEqual(streams(old),streams(migrated));
 }finally{await s.close();}
});
test('disabled editing with no overrides leaves fixed-seed races and breeding generation unchanged',()=>{
 const {rules:n}=loadChairmanRules(),W=n.ChairmanRules,E=n.ChairmanEditor;const withEditor=W.createWorld({seed:112,horseCount:30});n.ChairmanEditor=null;const withoutEditor=W.createWorld({seed:112,horseCount:30});let a=withEditor,b=withoutEditor;
 for(let i=0;i<8;i++){n.ChairmanEditor=E;const x=W.advanceHalfMonth(a);n.ChairmanEditor=null;const y=W.advanceHalfMonth(b);assert.deepEqual(plain(x.performances),plain(y.performances));assert.equal(x.world.rngState,y.world.rngState);a=x.world;b=y.world;}n.ChairmanEditor=E;
});
test('ten thousand templates edit and query in bounded pages without changing the base library',()=>{
 const {W,E,w}=setup();w.familyTemplates=Array.from({length:10000},(_,i)=>({id:'family-test-'+i,sourceKey:'test:'+i,name:'编辑测试'+i,gender:i%2?'牡马':'牝马',birthYear:1900,core:true,aliases:[],grade:'未公开',status:'template'}));let on=E.toggle(w,true).world;const start=performance.now();on=E.apply(on,E.preview(on,'template','family-test-9999',{name:'末页新名',displayName:'末页新名'})).world;const q=on.familyTemplates[9999];assert.notEqual(q.name,'末页新名');const result=loadChairmanRules().rules.ChairmanBreeding.query(on,{view:'library',source:'imported',search:'末页新名'});assert.equal(result.total,1);assert.equal(result.rows[0].name,'末页新名');console.log('10000 template edit/query ms:',Math.round(performance.now()-start));
});

test('parent correction preserves locked birth evidence and current child statistics across full snapshots',async()=>{
 const {n,W,E,B,w,context}=setup();w.settings.annualNewHorses=3;w.turn=23;w.phase='yearEnd';const born=W.finishYear(w),child=born.world.horses.find(h=>h.sourceKind==='bred');assert.ok(child);
 Object.assign(context.window,{indexedDB:new IDBFactory(),IDBKeyRange,setInterval,clearInterval});vm.runInContext(fs.readFileSync('js/chairman-storage.js','utf8'),context);const s=await n.ChairmanStorage.open();try{
 await s.acquire(w.id);await s.commitChanges(null,born);let current=E.toggle(born.world,true).world;const oldFather=child.fatherId;const alternate=B.seeded(current,()=>B.founder(current,child.homeRegion,'牡马'));const out=E.apply(current,E.preview(current,'horse',child.id,{fatherId:alternate.id}));const fixed=B.get(out.world,child.id);assert.equal(fixed.birthFacts.fatherId,oldFather);assert.equal(fixed.fatherId,alternate.id);assert.equal(fixed.strength,child.strength);await s.commitChanges(born.world,{...out,world:{...out.world,revision:born.world.revision+1}});
 const save=await s.exportWorld(w.id);assert.ok(s.validateSnapshot(save));assert.equal(save.records.breedingEvents.find(e=>e.horseId===child.id).fatherId,oldFather);const restored=await s.importWorld(save);assert.equal(B.get(restored,child.id).fatherId,alternate.id);assert.equal(B.get(restored,child.id).birthFacts.fatherId,oldFather);
 }finally{await s.close();}
});

test('edited native templates share imported ancestors and apply future coat and distance presets',()=>{
 const {n,W,E,B,w}=setup(),P=n.ChairmanPackages;const pkg=P.exportFamily(w,[w.horses[0].id]);let target=W.createWorld({blank:true,seed:52,breeding:true});target=P.apply(target,P.preview(target,pkg),true).world;target=E.toggle(target,true).world;const fid=target.familyTemplates[0].id;
 target=E.apply(target,E.preview(target,'template',fid,{birthYear:1900})).world;target=P.introduce(target,fid,{age:24}).world;const parent=target.horses[0],t=n.ChairmanPedigrees.records.find(t=>t.core&&t.gender==='牡马'&&t.birthYear>1970);
 target=E.apply(target,E.preview(target,'template',t.id,{fatherId:fid,coat:'特别毛',game:{...t.game,distance:800,surface:'泥地'}})).world;
 const introduced=B.edit(target,'introduce',{templateId:t.id,region:'欧洲'}).world,h=B.all(introduced).find(h=>h.templateId===t.id);assert.equal(h.fatherId,parent.id);assert.equal(h.coat,'特别毛');assert.equal(h.distMin,400);assert.equal(h.distType,W.category(800));assert.equal(h.surfaceGrades.dirt,'A');assert.equal(B.all(introduced).filter(h=>h.familyTemplateId===fid).length,1);
 const ui=W.edit(introduced,'ui',{layout:{breedingViews:{candidate:{view:'candidate',sort:'breedingStrength',normalSort:''}}}}).world;assert.equal(E.toggle(ui,false).world.ui.layout.breedingViews.candidate.sort,'');
});
