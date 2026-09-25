const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const { JSDOM } = require('jsdom');
const files = ['js/ui/pedigree-tree.js', 'js/utils/random.js', 'js/rules/horse-generator.js', 'js/rules/bloodline-system.js', 'js/data/chairman-pedigrees.js', 'js/data/bloodline-catalog.js', 'js/rules/career-bloodline.js', 'js/ui/career-bloodline.js'];
function load() {
  const dom = new JSDOM('<main></main>', {runScripts:'outside-only'});
  dom.window.Keiba = {};
  for (const f of files) vm.runInContext(fs.readFileSync(f,'utf8'),dom.getInternalVMContext());
  return {dom,n:dom.window.Keiba};
}
test('常规与传奇能力规则、快照和纯展示不改变随机状态', () => {
  const {dom,n} = load(), B=n.CareerBloodline;
  assert.equal(B.parents('牡马').length,93); assert.equal(B.parents('牝马').length,154);
  const f=B.parents('牡马').find(r=>r.originalName==='Sunday Silence'),m=B.parents('牝马').find(r=>r.originalName==='Air Groove');
  for(const mode of ['normal','legend']) {
    const p=B.pair(f.id,m.id,mode).preview;
    assert.ok(p.legal); assert.ok(p.ability.theoryBonus>0);
    for(let seed=0;seed<100;seed++) {
      const h=B.generate({sireId:f.id,damId:m.id,gameMode:mode,seed});
      const o=h.breedingOutcome, raw=o.rawStrength;
      assert.equal(h.gameMode,mode); assert.ok(h.id); assert.ok(raw>=(mode==='legend'?81:62)&&raw<=100);
      assert.equal(h.strength,Math.min(100,Math.round(raw+Math.max(0,o.floor-raw)*.5)+o.bonus));
      if(mode==='legend')assert.equal(o.protectionGain,0);
      assert.equal(h.pedigree.ancestors.length,30);
      assert.ok(h.pedigree.ancestors.every(a=>a.lineLabel&&Array.isArray(a.factors)));
      assert.equal(Object.values(h.trackAptitudes).sort().join(''),[...o.pattern].sort().join(''));
    }
  }
  const horse=B.generate({sireId:f.id,damId:m.id,seed:55});
  const saved=JSON.stringify(horse),panel=dom.window.document.querySelector('main');
  const restored=JSON.parse(saved);
  n.Random.withSource(()=>{throw Error('展示不能抽取随机数');},()=>{
    n.CareerBloodlineUI.render(panel,{horse:restored});
    B.pair(f.id,m.id).preview;
  });
  const html=panel.innerHTML;
  n.BloodlineCatalog.records.find(r=>r.id===f.id).displayName='后续改名';
  n.CareerBloodlineUI.render(panel,{horse:restored});
  assert.equal(panel.innerHTML,html);assert.equal(JSON.stringify(restored),saved);
  assert.doesNotMatch(panel.textContent,/个百分点|2d20|1d20|贡献权重|\d+%/);
  assert.equal(panel.querySelectorAll('.bloodline-node').length,15);
  panel.querySelector('[data-tree-depth="4"]').click();assert.equal(panel.querySelectorAll('.bloodline-node').length,31);
  assert.equal(panel.querySelectorAll('.is-broodmare-sire').length,1);
  n.CareerBloodlineUI.render(panel,{horse:{name:'旧马',strength:88,sireName:'旧父系'}});
  assert.match(panel.textContent,/旧版血系记录/);
  dom.window.close();
});
test('父母筛选、空结果、近亲禁配与随机配合',()=>{
  const {dom,n}=load(),doc=dom.window.document;
  doc.body.innerHTML=n.CareerBloodlineUI.setupHtml()+'<select id="gameModeSelect"><option>normal</option></select><button id="generateBtn"></button>';
  n.CareerBloodlineUI.bindSetup();
  assert.equal(doc.querySelectorAll('#sireSelect option').length,93);assert.equal(doc.querySelectorAll('#damSelect option').length,154);
  const change=(id,value,type='change')=>{const el=doc.getElementById(id);el.value=value;el.dispatchEvent(new dom.window.Event(type));};
  change('sireSearch','黄金船','input');assert.match(doc.getElementById('sireSelect').textContent,/黄金船/);
  change('sireSearch','','input');change('damSearch','风中秀发','input');assert.match(doc.getElementById('damSelect').textContent,/风中秀发/);
  change('damSearch','','input');
  change('sireSearch','乐购','input');assert.equal(doc.querySelectorAll('#sireSelect option').length,1);assert.match(doc.getElementById('sireSelect').textContent,/乐购男孩/);
  change('sireSearch','不存在123','input');assert.ok(doc.getElementById('generateBtn').disabled);
  doc.getElementById('randomParentsBtn').click();assert.ok(!doc.getElementById('generateBtn').disabled);
  const B=n.CareerBloodline,f=B.parents('牡马').find(r=>r.originalName==='Deep Impact'),m=B.parents('牝马').find(r=>r.originalName==='Gentildonna');
  change('sireSelect',f.id);change('damSelect',m.id);assert.ok(doc.getElementById('generateBtn').disabled);assert.match(doc.getElementById('pairBrief').textContent,/不能/);
  for(let i=0;i<25;i++){const ids=B.randomPair();assert.ok(B.pair(...ids).preview.legal);}
  dom.window.close();
});

test('退役简表保持六个祖先位置、出生快照和旧存档记录',()=>{
 const {dom,n}=load(),panel=dom.window.document.querySelector('main');
 const horse={sireName:'后续父名',damName:'后续母名',pedigree:{ancestors:[{path:'父',id:'same',name:'父马 <快照>',lineLabel:'北地舞人'},{path:'父父',id:'same',name:'重复祖先',lineLabel:'北地舞人'},{path:'母',name:'Long Thoroughbred Name Without Truncation',lineLabel:'未知'},{path:'母父',name:'母父快照',lineLabel:'架空家系'}]}};
 const before=JSON.stringify(horse);n.Random.withSource(()=>{throw Error('简表不得抽取随机数');},()=>{panel.innerHTML=n.CareerBloodlineUI.retirementTable(horse);});
 assert.equal(panel.querySelectorAll('td').length,6);assert.equal(panel.querySelectorAll('tr').length,4);assert.equal(panel.querySelector('[data-path="父"]').rowSpan,2);assert.equal(panel.querySelector('[data-path="母"]').rowSpan,2);
 assert.equal(panel.querySelectorAll('.retirement-pedigree-male').length,3);assert.equal(panel.querySelectorAll('.retirement-pedigree-female').length,3);
 assert.match(panel.querySelector('[data-path="父"]').textContent,/父马 <快照>/);assert.equal(panel.querySelector('[data-path="父母"] strong').textContent,'未知');assert.equal(panel.querySelector('[data-path="母"] span').textContent,'血系未知');assert.equal(panel.querySelector('[data-path="母父"] span').textContent,'架空家系');
 const html=panel.innerHTML;panel.innerHTML=n.CareerBloodlineUI.retirementTable(JSON.parse(before));assert.equal(panel.innerHTML,html);assert.equal(JSON.stringify(horse),before);assert.equal(panel.querySelectorAll('button,a').length,0);
 panel.innerHTML=n.CareerBloodlineUI.retirementTable({sireName:'旧父系',damName:'旧母系'});assert.match(panel.textContent,/旧父系/);assert.match(panel.textContent,/旧母系/);assert.match(panel.textContent,/旧版血系记录，暂无完整祖先资料/);assert.equal(panel.querySelectorAll('td strong').length,6);dom.window.close();
});
