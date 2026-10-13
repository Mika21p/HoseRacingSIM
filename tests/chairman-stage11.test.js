const test=require('node:test'),assert=require('node:assert/strict');
const {match}=require('../scripts/lib/chairman-stage11-capacity');
test('capacity bound cannot count one horse twice across simultaneous races',()=>{
 assert.equal(match([['a','b'],['a','b']],[2,2]).missing,2);
});
test('capacity bound reallocates flexible horses to preserve restricted fields',()=>{
 const result=match([['a','b'],['a']],[1,1]);assert.equal(result.missing,0);assert.deepEqual(result.counts,[1,1]);
});
test('capacity bound separates total headcount from incompatible supply',()=>{
 const result=match([['a'],['b','c','d','e','f']],[2,2]);assert.equal(result.required,4);assert.equal(result.filled,3);assert.equal(result.missing,1);
});
test('new Japan and US defaults reproduce the attendance-tested explicit population',()=>{
 const {loadChairmanRules}=require('./helpers/project-loader'),fs=require('fs'),vm=require('vm');const current=loadChairmanRules(),old=loadChairmanRules();vm.runInContext(fs.readFileSync(require('path').join(__dirname,'fixtures/chairman/chairman-stage11-baseline-world.js'),'utf8'),old.context);
 const opts={id:'stage11-default-proof',worldType:'reference',regionKeys:['japan','usa'],seed:123,foundation:false,breeding:false};
 const a=current.rules.ChairmanRules.createWorld(opts),b=old.rules.ChairmanRules.createWorld({...opts,population:{japan:2000,usa:1504},annualTargets:{japan:500,usa:376}});
 assert.equal(JSON.stringify(a),JSON.stringify(b));assert.equal(JSON.stringify(current.rules.ChairmanRules.advanceHalfMonth(a)),JSON.stringify(old.rules.ChairmanRules.advanceHalfMonth(b)));
});
test('provisional population defaults double all regions and honor explicit zero settings',()=>{
 const n=require('./helpers/project-loader').loadChairmanRules().rules,V=n.ChairmanWorld;
 assert.equal(V.defaultPopulation('britain',68),680);assert.equal(V.defaultPopulation('france',60),600);
 assert.equal(V.defaultPopulation('ireland',39),392);assert.equal(V.defaultPopulation('germany',0),200);assert.equal(V.defaultPopulation('italy',0),200);
 const w=V.create({id:'zero-explicit',worldType:'reference',regionKeys:['usa'],population:{usa:0},annualTargets:{usa:0},seed:123,foundation:false,breeding:false});assert.equal(w.horses.length,0);assert.equal(w.regions[0].annualTarget,0);
});
