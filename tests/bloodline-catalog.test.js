'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),files=['js/ui/pedigree-tree.js','js/utils/random.js','js/rules/horse-generator.js','js/rules/bloodline-system.js','js/data/bloodline-lab-fixtures.js','js/data/chairman-pedigrees.js','js/data/bloodline-pilot.js','js/data/bloodline-catalog.js'];
const plain=x=>JSON.parse(JSON.stringify(x));
function load(context=vm.createContext({window:{Keiba:{}}})){for(const f of files)vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),context);return context.window.Keiba;}
test('完整赋值层覆盖247匹核心马，JSON与浏览器数据一致且保留身份系谱',()=>{
 const n=load(),d=n.BloodlineCatalog,original=JSON.parse(fs.readFileSync(path.join(root,'js/data/chairman-pedigrees.json'),'utf8'));
 assert.equal(d.roots.length,247);assert.equal(new Set(d.roots).size,247);assert.equal(d.assignments.length,382);
 assert.deepEqual(plain(n.ChairmanPedigrees.records),original.records);
 assert.deepEqual(plain(d.assignments),JSON.parse(fs.readFileSync(path.join(root,'js/data/bloodline-catalog.json'),'utf8')).assignments);
 for(const r of d.records){const old=original.records.find(o=>o.id===r.id);assert.deepEqual(plain(Object.fromEntries(Object.entries(r).filter(([k])=>k!=='genetics'))),old);}
 const lib=n.BloodlineSystem.createLibrary(d.records,d.nicks),core=d.roots.map(id=>lib.get(id));
 for(const r of core){assert.ok(r.core);assert.ok([50,65,75,85,95].includes(r.genetics.quality));assert.ok([35,60,80].includes(r.genetics.stability));assert.ok(r.genetics.factors.length>=1&&r.genetics.factors.length<=2);assert.ok(r.genetics.distance);assert.ok(r.genetics.surfaceGrades);}
 assert.equal(core.filter(r=>r.gender==='牡马').length,93);assert.equal(core.filter(r=>r.gender==='牝马').length,154);
 for(const [region,count] of [['日本',87],['欧洲',80],['美国',80]])assert.equal(core.filter(r=>r.region===region).length,count);
 for(const [id,name,gender] of [
  ['jbis-0000430846','风中秀发','牝马'],['jbis-0001104811','黄金船','牡马'],
  ['jbis-0000801136','伏特加','牝马'],['jbis-0000286632','目白多伯','牝马'],
  ['jbis-0000324971','曼城茶座','牡马'],['jbis-0001044299','真机伶','牝马'],
  ['jbis-0000302080','好歌剧','牡马'],['jbis-0000196381','第一红宝石','牝马']
 ]){const r=lib.get(id);assert.ok(d.roots.includes(id));assert.equal(r.displayName,name);assert.equal(r.gender,gender);assert.ok(r.fatherId&&r.motherId);}
 assert.ok(lib.get('jbis-0000324971').aliases.includes('曼哈顿咖啡'));
 assert.deepEqual(plain(lib.get('jbis-0000302080').genetics.trackAptitudes),{burst:'○',sustained:'○',attrition:'△'});
 assert.equal(core.filter(r=>Object.values(r.genetics.trackAptitudes).every(v=>v==='○')).length,4);
 assert.equal(core.filter(r=>Object.values(r.genetics.trackAptitudes).filter(v=>v==='◎').length>1).length,0);
});
test('未知父链不编造血系，关键祖先不伪造整套能力；母父相性引用已有血系',()=>{
 const n=load(),d=n.BloodlineCatalog,anchors=new Map(d.lines.map(l=>[l.ancestorId,l.id])),rows=new Map(d.records.map(r=>[r.id,r]));
 for(const r of d.records){let node=r,seen=new Set(),expected=null;while(node&&!seen.has(node.id)){seen.add(node.id);if(anchors.has(node.id)){expected=anchors.get(node.id);break;}node=rows.get(node.fatherId);}assert.equal(r.genetics.lineId,expected);}
 for(const r of d.assignments.filter(r=>r.role==='关键祖先')){assert.ok(r.usage>=4||anchors.has(r.id));assert.equal(r.genetics.quality,undefined);assert.equal(r.genetics.trackAptitudes,undefined);}
 const lines=new Set(d.lines.map(l=>l.id));for(const nick of d.nicks){assert.ok(lines.has(nick.sireLine));assert.ok(lines.has(nick.broodmareSireLine));}
});
test('完整库中的每匹核心马均有合法配合，后代符合新规则',()=>{
 const n=load(),d=n.BloodlineCatalog,B=n.BloodlineSystem,lib=B.createLibrary(d.records,d.nicks),core=d.roots.map(id=>lib.get(id));let seed=0;
 for(const parent of core){let pair;for(const other of core.filter(r=>r.gender!==parent.gender)){const p=B.createPair(lib,parent.gender==='牡马'?parent.id:other.id,parent.gender==='牝马'?parent.id:other.id);if(p.preview.legal){pair=p;break;}}
  assert.ok(pair,parent.id);const h=pair.generate({seed:seed++});assert.ok(h.strength>=pair.preview.ability.finalMinimum&&h.strength<=100);assert.ok(pair.preview.trackPlan.excellentChance<=.2);assert.equal(Object.values(h.trackAptitudes).sort().join(''),[...h.breedingOutcome.pattern].sort().join(''));
 }
});
test('验证台默认完整库，93父马154母马，可生成并切回旧试验组',()=>{
 const dom=new JSDOM('<main id="bloodlineLab"></main>',{runScripts:'outside-only',url:'https://bloodline.test/'});load(dom.getInternalVMContext());vm.runInContext(fs.readFileSync(path.join(root,'js/bloodline-lab.js'),'utf8'),dom.getInternalVMContext());
 const doc=dom.window.document,change=(name,value)=>{const el=doc.querySelector(`[name="${name}"]`);el.value=value;el.dispatchEvent(new dom.window.Event('change',{bubbles:true}));};
 assert.equal(doc.querySelector('[name=dataset]').value,'catalog');assert.equal(doc.querySelectorAll('[name=father] option').length,93);assert.equal(doc.querySelectorAll('[name=mother] option').length,154);assert.match(doc.querySelector('#assignments').textContent,/382匹赋值/);assert.ok(!doc.querySelector('a[href="undefined"]'));
 change('scenario','0');doc.querySelector('[data-action=generate]').click();assert.match(doc.querySelector('#offspring').textContent,/后代结果/);assert.equal(doc.querySelector('#labError').textContent,'');
 change('dataset','pilot');assert.equal(doc.querySelectorAll('[name=father] option').length,6);assert.match(doc.querySelector('#assignments').textContent,/26匹赋值/);assert.equal(dom.window.localStorage.length,0);dom.window.close();
});
