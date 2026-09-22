const {chromium}=require('playwright'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
(async()=>{
 const root=path.resolve('dist'),server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403).end();return;}const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(target,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[path.extname(target)]||'application/octet-stream');res.end(data);});});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),page=await browser.newPage();
 try{
  await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>window.Keiba?.ChairmanStorage);
  // Reuse the same explicitly synthetic fixture as the independent Node audit.
  const code=fs.readFileSync('scripts/audit-chairman-world-storage.js','utf8'),fixture=code.slice(code.indexOf(' const w='),code.indexOf(' W.validateWorld'));
  const report=await page.evaluate(`(async()=>{const n=window.Keiba,W=n.ChairmanRules,V=n.ChairmanWorld;${fixture}
   V.plan(w);W.validateWorld(w);const s=await n.ChairmanStorage.open();try{await s.acquire(w.id);let t=performance.now();await s.commitChanges(null,{world:w,occurrences,performances});const saveMs=performance.now()-t;
   t=performance.now();const advance=W.advanceHalfMonth(w);const advanceMs=performance.now()-t;t=performance.now();await s.commitChanges(w,advance);const incrementalSaveMs=performance.now()-t;
   t=performance.now();const history=await s.historyPage(w,{},0);const historyQueryMs=performance.now()-t;t=performance.now();const track=await s.historyPage(w,{},0,{trackId:w.tracks[0].id});const trackQueryMs=performance.now()-t;
   t=performance.now();const snapshot=await s.exportWorld(w.id);const exportMs=performance.now()-t;s.validateSnapshot(snapshot);t=performance.now();await s.saveSlot(w.id,1);const backupMs=performance.now()-t;t=performance.now();const restored=await s.loadSlot(1,true);const restoreMs=performance.now()-t;s.validateSnapshot(await s.exportWorld(restored.id));
   return {syntheticHistory:true,storageEngine:'Chrome IndexedDB',description:'组合世界规模与20年合成历史，独立检验本地保存、查询、导出与备份恢复；不作为赛事完成率证据。',horses:w.horses.length,occurrences:occurrences.length,performances:performances.length,saveMs:Math.round(saveMs),advanceMs:Math.round(advanceMs),incrementalSaveMs:Math.round(incrementalSaveMs),incrementalPerformances:advance.performances.length,historyQueryMs:Math.round(historyQueryMs),trackQueryMs:Math.round(trackQueryMs),exportMs:Math.round(exportMs),backupMs:Math.round(backupMs),restoreMs:Math.round(restoreMs),exportMiB:+(new Blob([JSON.stringify(snapshot)]).size/1048576).toFixed(2),resultsReturned:history.rows.length,trackResultsReturned:track.rows.length,restoredVersion:restored.worldSystemVersion};
   }finally{await s.close();}})()`);
  report.browser=browser.version();fs.writeFileSync('artifacts/chairman-world-storage-browser.json',JSON.stringify(report,null,2));console.log(report);
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
