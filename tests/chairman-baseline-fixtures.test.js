const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');
// 冻结基准的 SHA256 与阶段9/10实验文档登记值一致；阶段11审计沿用阶段10同一份规则。
const expected={
 'chairman-stage9-baseline-world.js':'cdd3ebdbc358a3e39275c2ddd2f731fffd9a84c2d8c08ee437157d7da5bf394e',
 'chairman-stage10-baseline-world.js':'60d53804d126836f1e472ce267c99c2acfeb54c8035e5b9847be8cdcda708ace',
 'chairman-stage11-baseline-world.js':'60d53804d126836f1e472ce267c99c2acfeb54c8035e5b9847be8cdcda708ace'
};
test('frozen chairman baseline fixtures match documented hashes',()=>{
 for(const [name,hash] of Object.entries(expected))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'fixtures/chairman',name))).digest('hex'),hash,name);
});
