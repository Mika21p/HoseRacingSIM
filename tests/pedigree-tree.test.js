const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
test('横向树的路径、布局、重复祖先和安全文本',()=>{
 const dom=new JSDOM('<main></main>',{runScripts:'outside-only'}),w=dom.window;
 w.eval(fs.readFileSync('js/ui/pedigree-tree.js','utf8'));
 const T=w.Keiba.PedigreeTree,host=w.document.querySelector('main');
 const ancestors=[{path:'父',id:'f',name:'Father'},{path:'母',id:'m',name:'Mother'},{path:'父父',id:'a',name:'<script>bad</script>'},{path:'母父',id:'a',name:'<script>bad</script>'}];
 const input=JSON.stringify(ancestors);
 host.innerHTML=T.render({key:'one',root:{id:'h',name:'Child'},ancestors,depth:3});
 assert.equal(host.querySelectorAll('.pt-node').length,15);assert.equal(host.querySelectorAll('svg path').length,14);
 assert.equal(host.querySelectorAll('.is-repeated').length,2);assert.equal(host.querySelectorAll('.is-broodmare-sire').length,1);
 const at=path=>host.querySelector(`[data-path="${path}"]`),x=p=>parseFloat(at(p).style.left),y=p=>Number(at(p).style.top.match(/calc\(([\d.]+)px/)[1]);
 for(const p of ['','父','母','父父','父母','母父','母母']) {assert.ok(x(p+'父')>x(p));assert.ok(y(p+'父')<y(p));assert.ok(y(p+'母')>y(p));assert.equal((y(p+'父')+y(p+'母'))/2,y(p));}
 assert.equal(at('母母').querySelector('strong').textContent,'未知');assert.equal(host.querySelectorAll('script').length,0);
 T.highlight(host,['a']);assert.equal(host.querySelectorAll('.participant').length,2);assert.equal(host.querySelectorAll('.pt-participant-label:not([hidden])').length,2);
 assert.equal(JSON.stringify(ancestors),input);
 host.innerHTML=T.render({key:'one',root:{name:'Child'},ancestors,depth:4});assert.equal(host.querySelectorAll('.pt-node').length,31);assert.equal(host.querySelectorAll('svg path').length,30);
 dom.window.close();
});
