const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const files=['js/rules/chairman-world.js','js/rules/chairman.js','js/rules/chairman-breeding.js','js/rules/horse-generator.js','js/data/chairman-venue-records.js','js/data/chairman-venues.js'];
const fingerprint=crypto.createHash('sha256').update(files.map(f=>fs.readFileSync(f,'utf8')).join('')).digest('hex');
const long=JSON.parse(fs.readFileSync('artifacts/chairman-world-long.json')),storage=JSON.parse(fs.readFileSync('artifacts/chairman-world-storage-browser.json')),browser=JSON.parse(fs.readFileSync('artifacts/world-browser.json'));
for(const file of ['.cache/world-quick-tests.txt','.cache/world-unit-tests.txt','.cache/world-legacy-long.txt'])assert.match(fs.readFileSync(file,'utf8'),/ℹ fail 0/,'回归检查尚未全部通过：'+file);
assert.equal(long.runs.length,10);assert.ok(long.runs.every(r=>r.years.length===20&&r.fingerprint===fingerprint),'长期记录必须对应当前规则并完成20年。');assert.ok(long.passed,'仍有地区年度完成率或G1参赛数未达标。');assert.equal(browser.errors.length,0);assert.ok(browser.readOnly&&browser.reload);assert.ok(storage.incrementalPerformances>0,'增量保存须包含实际出赛记录。');
const minimum=a=>Math.min(...a),maximum=a=>Math.max(...a),percent=v=>(v*100).toFixed(2)+'%';
const scenarios=['japan','combined'].map(key=>{const runs=long.runs.filter(r=>(r.regionKeys.length===1?'japan':'combined')===key),years=runs.flatMap(r=>r.years.filter(y=>y.year>=3));return {key,seeds:runs.map(r=>r.seed),initialActive:runs[0].initialActive,minimumOverallCompletion:minimum(years.map(y=>y.regions.reduce((s,r)=>s+r.completed,0)/y.regions.reduce((s,r)=>s+r.scheduled,0))),minimumRegionalCompletion:minimum(years.flatMap(y=>y.regions.map(r=>r.completion))),minimumRegionalG1Average:minimum(years.flatMap(y=>y.regions.filter(r=>r.g1).map(r=>r.g1Average))),halfMonthMedianRange:runs.map(r=>r.halfMonthMs.median),halfMonthP95Range:runs.map(r=>r.halfMonthMs.p95),maximumWorldMiB:maximum(runs.map(r=>r.worldMiB))};});
const regions=[...new Set(long.runs.flatMap(r=>r.years[0].regions.map(r=>r.name)))].map(name=>{const rows=long.runs.flatMap(r=>r.years.filter(y=>y.year>=3).flatMap(y=>y.regions.filter(r=>r.name===name)));return {name,minimumCompletion:minimum(rows.map(r=>r.completion)),minimumG1Average:rows.some(r=>r.g1)?minimum(rows.filter(r=>r.g1).map(r=>r.g1Average)):null};});
const report={generatedAt:new Date().toISOString(),fingerprint,passed:true,totalSimulatedYears:200,scenarios,regions,storage,browser};fs.writeFileSync('artifacts/chairman-world-acceptance.json',JSON.stringify(report,null,2));
const text=`# 主席地区与现实赛历验收记录

验证日期：2026-09-21。交付为本地生产构建，未发布线上。规则说明见[主席地区与现实赛历说明](主席地区与现实赛历说明.md)，完整来源见[526条赛事与60座马场清单](chairman-reference-manifest.json)。

## 完整性与兼容

- 日本187条、美欧339条全部登记；524条可运行，2条待核对保留在资料库，不伪造举办地。
- 美欧待核对项为哥利亚杯锦标与安德烈·巴博安锦标，可在当前世界手动指定场地并保留玩家修改标记。
- 育马者杯14场共用年度举办地，单年指定、跨年准备、连冠冻结、部分成员停办、单场包依赖及重复导入均有针对性验证。
- 完整存档v9、内容包v2。旧世界保持规则身份；普通模式源赛事未改写。普通生成器额外与修改前版本核对1000匹固定种子样本，除时钟生成的身份编号外逐字段一致。
- 常规回归227项通过，新版地区专项17项通过；原有主席、繁殖、系列与荣誉长期回归8项通过。
- 每个地区预设10000匹固定种子样本符合草泥比例±2个百分点，另10000×2样本比较中性与强烈当地倾向；高适性总数及基础能力总和不变。
- 桌面1440×900与手机390×844验证创建、地区编辑、举办组、赛历、普通赛果、重载恢复、空白世界与只读限制；无页面异常、无横向溢出。

## 200年模拟

日本和七地区组合各5种子、每个20年。以下指标按第3～20年计算，既检查整体，也逐地区检查90%完成率与G1场均8匹目标。意大利源库没有G1，G1指标记为不适用。

| 场景 | 初始现役 | 最低年度整体完成率 | 最低地区年度完成率 | 最低地区年度G1场均 | 半月中位数范围 | 半月P95范围 |
|---|---:|---:|---:|---:|---:|---:|
${scenarios.map(s=>`| ${s.key==='japan'?'日本':'日美欧组合'} | ${s.initialActive} | ${percent(s.minimumOverallCompletion)} | ${percent(s.minimumRegionalCompletion)} | ${s.minimumRegionalG1Average.toFixed(2)} | ${minimum(s.halfMonthMedianRange)}～${maximum(s.halfMonthMedianRange)} ms | ${minimum(s.halfMonthP95Range)}～${maximum(s.halfMonthP95Range)} ms |`).join('\n')}

| 地区 | 最低年度完成率 | 最低年度G1场均 |
|---|---:|---:|
${regions.map(r=>`| ${r.name} | ${percent(r.minimumCompletion)} | ${r.minimumG1Average==null?'不适用':r.minimumG1Average.toFixed(2)} |`).join('\n')}

模拟使用4个独立进程并行，耗时受测试机及同时进行的检查影响，不作为所有设备的帧率或响应时间保证。最终记录包含规则指纹，已核对与交付源码一致；早期调试报告不作为最终验收依据。

## 浏览器存储

Chrome ${storage.browser}，${storage.horses}匹组合规模、${storage.occurrences}场赛事和${storage.performances}条合成出赛记录。该历史专用于存储压力验证，不能代替上方真实长期模拟结果。

| 操作 | 实测 |
|---|---:|
| 首次写入全部20年历史 | ${storage.saveMs} ms |
| 一次半月计算 | ${storage.advanceMs} ms |
| 该半月增量保存（${storage.incrementalPerformances}条实际出赛记录） | ${storage.incrementalSaveMs} ms |
| 最新50条历史查询 | ${storage.historyQueryMs} ms |
| 马场历史50条查询 | ${storage.trackQueryMs} ms |
| 完整导出 | ${storage.exportMs} ms／${storage.exportMiB} MiB |
| 手动备份 | ${storage.backupMs} ms |
| 备份复制为新世界 | ${storage.restoreMs} ms |

完整历史首次导入／恢复明显慢于日常增量保存。模拟数据库的压力记录另存于 artifacts/chairman-world-storage.json，其耗时不等同于浏览器原生IndexedDB。

机器验收汇总：artifacts/chairman-world-acceptance.json。完整逐年记录：artifacts/chairman-world-long.json。页面检查：artifacts/world-browser.json。生产构建目录：dist/。
`;
fs.writeFileSync('docs/主席地区与现实赛历验收.md',text);console.log(JSON.stringify({passed:true,scenarios,regions},null,2));
