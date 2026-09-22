(function () {
  "use strict";
  const ns = (window.Keiba = window.Keiba || {});
  const ENTITIES = ["horses", "tracks", "races", "pedigrees", "councilTypes", "honorProfiles", "series", "familyTemplates", "sourceMappings", "templateOverrides"];
  const HONOR_HISTORY = ["councilRounds", "councilVotes", "hallEvents", "honorYears"];
  const HISTORY = ["occurrences", "performances", "ratings", "awards", "scoreDrafts", "revisions", "breedingEvents", "breedingYears", ...HONOR_HISTORY, "seriesYears", "seriesRewards", "editorRecords"];
  const DATA = [...ENTITIES, ...HISTORY];
  const DB_NAME = "keiba-chairman-v1";
  const clean = (row) => { if (!row) return row; const value = { ...row }; delete value.worldId; return value; };
  function indexed(key, row) {
    if (key === "occurrences") return { ...row, displayTurn: -row.turn, gradeOrder: ({ g1: 0, g2: 1, g3: 2, op: 3 })[row.raceClass] ?? 4,
      visibleGrade: ["g1","g2","g3"].includes(row.raceClass) ? 1 : 0, trackId: row.race.trackId, scoring: row.scoring || "none" };
    if (key === "ratings") return { ...row, wtrSort: row.wtr == null ? Number.MAX_VALUE : -row.wtr, tfSort: row.tf == null ? Number.MAX_VALUE : -row.tf, legacySort: row.legacyAutomatic == null ? Number.MAX_VALUE : -row.legacyAutomatic, prizeSort: -(row.prize || 0), homeRegion: row.homeRegion || "未记录" };
    if (key === "performances") return { ...row, finishOrder: row.rank ?? Number.MAX_SAFE_INTEGER };
    return row;
  }
  function request(req) { return new Promise((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); }
  function complete(tx) { return new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onabort = () => reject(tx.error || new Error("保存已中止，上一份进度仍然保留。")); tx.onerror = () => {}; }); }
  function metadata(world) {
    const copy = { ...world };
    ENTITIES.forEach((key) => { delete copy[key]; });
    return copy;
  }
  function open() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) { reject(new Error("当前浏览器无法使用本地数据库，未保存的世界不会被静默丢弃。请启用站点存储。")); return; }
      const req = window.indexedDB.open(DB_NAME, 9);
      req.onupgradeneeded = (event) => {
        const db = req.result;
        if (event.oldVersion < 1) {
        db.createObjectStore("worlds", { keyPath: "id" });
        for (const key of [...DATA, "journal", "checkpoints"]) {
          const store = db.createObjectStore(key, { keyPath: ["worldId", "id"] });
          store.createIndex("byWorld", "worldId");
          store.createIndex("byYear", ["worldId", "year"]);
          store.createIndex("byTurn", ["worldId", "turn"]);
          if (key === "performances" || key === "ratings" || key === "awards") {
            store.createIndex("byHorse", ["worldId", "horseId"]);
            store.createIndex("byHorseYear", ["worldId", "horseId", "year"]);
          }
          if (key === "journal") store.createIndex("byRevision", ["worldId", "revision"]);
        }
        db.createObjectStore("slots", { keyPath: "id" });
        db.createObjectStore("leases", { keyPath: "id" });
        }
        if (event.oldVersion < 2) {
          req.transaction.objectStore("performances").createIndex("byHorseTurn", ["worldId", "horseId", "turn"]);
          req.transaction.objectStore("performances").createIndex("byOccurrence", ["worldId", "occurrenceId", "finishOrder"]);
          const cursor = req.transaction.objectStore("performances").openCursor();
          cursor.onsuccess = () => { const item = cursor.result; if (item) { item.update({ ...item.value, finishOrder: item.value.rank ?? Number.MAX_SAFE_INTEGER }); item.continue(); } };
          const summaries = db.createObjectStore("slotSummaries", { keyPath: "id" });
          const slots = req.transaction.objectStore("slots").openCursor();
          slots.onsuccess = () => { const item = slots.result; if (item) { const { snapshot, ...meta } = item.value; summaries.put(meta); item.continue(); } };
        }
        if (event.oldVersion < 3) {
          for (const key of ["scoreDrafts", "revisions"]) {
            if (!db.objectStoreNames.contains(key)) {
              const s = db.createObjectStore(key, { keyPath: ["worldId", "id"] });
              s.createIndex("byWorld", "worldId"); s.createIndex("byYear", ["worldId", "year"]); s.createIndex("byTurn", ["worldId", "turn"]);
            }
          }
          const ratings = req.transaction.objectStore("ratings"), occurrences = req.transaction.objectStore("occurrences");
          ratings.createIndex("byWtr", ["worldId", "wtrSort", "prizeSort", "id"]);
          occurrences.createIndex("byDisplay", ["worldId", "displayTurn", "gradeOrder", "name", "id"]);
          occurrences.createIndex("byRace", ["worldId", "raceId", "turn"]);
          occurrences.createIndex("byTrack", ["worldId", "trackId", "turn"]);
          const regions = new Map(), scoring = new Map();
          const p = req.transaction.objectStore("performances").openCursor();
          p.onsuccess = () => {
            const c = p.result;
            if (c) {
              const r = c.value, key = JSON.stringify([r.worldId, r.horseId, r.year]);
              if (r.homeRegion && (!regions.has(key) || r.turn > regions.get(key).turn)) regions.set(key, r);
              const sk = JSON.stringify([r.worldId, r.occurrenceId]), counts = scoring.get(sk) || [0, 0];
              if (!r.retired) { counts[0]++; if (r.manualRating != null) counts[1]++; } scoring.set(sk, counts); c.continue();
            } else for (const key of ["ratings", "occurrences"]) {
              const scan = req.transaction.objectStore(key).openCursor();
              scan.onsuccess = () => {
                const item = scan.result; if (!item) return; const row = item.value;
                if (key === "ratings") row.homeRegion = row.homeRegion || (regions.get(JSON.stringify([row.worldId, row.horseId, row.year])) || {}).homeRegion || "未记录";
                else { const n = scoring.get(JSON.stringify([row.worldId, row.id])) || [0, 0]; row.scoring = !n[1] ? "none" : n[0] === n[1] ? "all" : "partial"; }
                item.update(indexed(key, row)); item.continue();
              };
            }
          };
        }
      };
      const originalUpgrade = req.onupgradeneeded;
      req.onupgradeneeded = (event) => {
        originalUpgrade(event);
        if(event.oldVersion<8)for(const key of ['templateOverrides','editorRecords']){const db=req.result,store=db.objectStoreNames.contains(key)?req.transaction.objectStore(key):db.createObjectStore(key,{keyPath:['worldId','id']});for(const [name,path]of [['byWorld','worldId'],['byYear',['worldId','year']],['byTarget',['worldId','targetId','turn']],['byTurn',['worldId','turn']]])if(!store.indexNames.contains(name))store.createIndex(name,path);}
        if(event.oldVersion<7)for(const key of ['series','familyTemplates','sourceMappings','seriesYears','seriesRewards']){
          const db=req.result,s=db.objectStoreNames.contains(key)?req.transaction.objectStore(key):db.createObjectStore(key,{keyPath:['worldId','id']});
          for(const [name,path] of [['byWorld','worldId'],['byYear',['worldId','year']],['byHorse',['worldId','horseId']],['bySeries',['worldId','seriesId','year']],['byTurn',['worldId','turn']]])if(!s.indexNames.contains(name))s.createIndex(name,path);
        }
        if (event.oldVersion < 6) for (const key of ['councilTypes', 'honorProfiles', ...HONOR_HISTORY]) {
          const db = req.result, s = db.objectStoreNames.contains(key) ? req.transaction.objectStore(key) : db.createObjectStore(key, { keyPath: ['worldId', 'id'] });
          for (const [name, path] of [['byWorld', 'worldId'], ['byYear', ['worldId', 'year']], ['byTurn', ['worldId', 'turn']], ['byHorse', ['worldId', 'horseId']], ['byRound', ['worldId', 'roundId']], ['byScopeYear', ['worldId', 'scope', 'year']]])
            if (!s.indexNames.contains(name)) s.createIndex(name, path);
        }
        if (event.oldVersion < 5) {
          const occurrences = req.transaction.objectStore('occurrences'), ratings = req.transaction.objectStore('ratings');
          occurrences.createIndex('byGradedDisplay', ['worldId', 'visibleGrade', 'displayTurn', 'gradeOrder', 'name', 'id']);
          ratings.createIndex('byTf', ['worldId', 'tfSort', 'prizeSort', 'id']);
          ratings.createIndex('byLegacy', ['worldId', 'legacySort', 'prizeSort', 'id']);
          for (const [key, store] of [['occurrences', occurrences], ['ratings', ratings]]) {
            const scan = store.openCursor(); scan.onsuccess = () => { const c=scan.result; if(c){c.update(indexed(key,c.value));c.continue();} };
          }
        }
        if (event.oldVersion < 4) for (const key of ["pedigrees", "breedingEvents", "breedingYears"]) {
          const db = req.result;
          const s = db.objectStoreNames.contains(key) ? req.transaction.objectStore(key) : db.createObjectStore(key, { keyPath: ["worldId", "id"] });
          for (const [name, path] of [["byWorld", "worldId"], ["byYear", ["worldId", "year"]], ["byHorse", ["worldId", "horseId"]],
            ["byFather", ["worldId", "fatherId"]], ["byMother", ["worldId", "motherId"]], ["byTemplate", ["worldId", "templateId"]]])
            if (!s.indexNames.contains(name)) s.createIndex(name, path);
        }
      };
      req.onsuccess = () => { const db = req.result; db.onversionchange = () => db.close(); resolve(new Store(db)); };
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error("数据库升级被其他页面阻止，请关闭其他游戏页面后重试。"));
    });
  }
  class Store {
    constructor(db) {
      this.db = db;
      this.owner = window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      this.worldId = null;
      this.writable = false;
      this.timer = null;
      this.onLeaseLost = null;
    }
    async acquire(worldId) {
      await this.release();
      // Browser-owned locks disappear on refresh/crash; the database lease remains the fallback.
      const locks = window.navigator && window.navigator.locks;
      let browserLock = false;
      if (locks) {
        browserLock = await new Promise((resolve, reject) => {
          locks.request(`keiba-chairman:${worldId}`, { ifAvailable: true }, (lock) => {
            if (!lock) { resolve(false); return; }
            return new Promise((release) => { this.browserLockRelease = release; resolve(true); });
          }).catch(reject);
        });
        if (!browserLock) { this.worldId = worldId; this.writable = false; return false; }
      }
      const tx = this.db.transaction("leases", "readwrite"); const done = complete(tx);
      const store = tx.objectStore("leases");
      const existing = await request(store.get(worldId));
      const allowed = browserLock || !existing || existing.expires <= Date.now() || existing.owner === this.owner;
      if (allowed) store.put({ id: worldId, owner: this.owner, expires: Date.now() + 15000 });
      await done;
      this.worldId = worldId; this.writable = allowed;
      if (allowed) this.timer = window.setInterval(() => this.renew().catch(() => this.loseLease()), 4000);
      return allowed;
    }
    loseLease() {
      this.writable = false;
      if (this.timer) window.clearInterval(this.timer);
      this.timer = null;
      if (this.browserLockRelease) this.browserLockRelease();
      this.browserLockRelease = null;
      if (this.onLeaseLost) this.onLeaseLost();
    }
    async renew() {
      if (!this.worldId || !this.writable) return;
      const tx = this.db.transaction("leases", "readwrite"); const done = complete(tx);
      const store = tx.objectStore("leases"); const lease = await request(store.get(this.worldId));
      if (!lease || lease.owner !== this.owner) { await done; this.loseLease(); return; }
      store.put({ ...lease, expires: Date.now() + 15000 });
      await done;
    }
    async release() {
      if (this.timer) window.clearInterval(this.timer);
      this.timer = null;
      if (this.worldId && this.writable) {
        const tx = this.db.transaction("leases", "readwrite"); const done = complete(tx);
        const store = tx.objectStore("leases"); const lease = await request(store.get(this.worldId));
        if (lease && lease.owner === this.owner) store.delete(this.worldId);
        await done;
      }
      this.writable = false; this.worldId = null;
      if (this.browserLockRelease) this.browserLockRelease();
      this.browserLockRelease = null;
    }
    async listWorlds() { return request(this.db.transaction("worlds").objectStore("worlds").getAll()); }
    async load(worldId) {
      const tx = this.db.transaction(["worlds", ...ENTITIES]);
      const rows = await Promise.all([request(tx.objectStore("worlds").get(worldId)),
        ...ENTITIES.map((key) => request(tx.objectStore(key).index("byWorld").getAll(worldId)))]);
      if (!rows[0]) throw new Error("未找到该世界，其他存档未受影响。");
      const world = { ...rows[0] };
      ENTITIES.forEach((key, i) => { world[key] = rows[i + 1].map(clean); });
      ns.ChairmanRules.validateWorld(world);
      const missing = new Set(world.horses.filter((h) => !h.annual.runs).map((h) => h.id));
      if (missing.size) {
        const rows = await this.query("performances", worldId, { year: ns.ChairmanRules.date(world.turn).year, limit: Number.MAX_SAFE_INTEGER });
        const horses = new Map(world.horses.map((h) => [h.id, h]));
        missing.forEach((id) => { horses.get(id).annual.runs = []; });
        rows.rows.forEach((p) => { if (missing.has(p.horseId)) horses.get(p.horseId).annual.runs.push({ id: p.occurrenceId, name: p.raceName, turn: p.turn,
          raceClass: p.raceClass, surface: p.surface, distance: p.distance, rank: p.rank }); });
      }
      if (world.ratingVersion < 2 && this.writable && this.worldId === world.id) {
        const [performances, ratings, awards] = await Promise.all(['performances','ratings','awards'].map(key => this.query(key, world.id, { limit: Number.MAX_SAFE_INTEGER })));
        const out = ns.ChairmanRatings.migrate(world, performances.rows, ratings.rows);
        if (!out.world.honors && ns.ChairmanHonors) {
          out.world = ns.ChairmanHonors.migrate(out.world, performances.rows, out.ratings, awards.rows).world;
          out.world.revision = world.revision + 1;
        }
        await this.commitChanges(world, out, { checkpoint: 'migration' });
        return this.load(worldId);
      }
      if (!world.honors && ns.ChairmanHonors && this.writable && this.worldId === world.id) {
        const records = await Promise.all(['performances', 'ratings', 'awards'].map(key => this.query(key, worldId, { limit: Number.MAX_SAFE_INTEGER })));
        const out = ns.ChairmanHonors.migrate(world, ...records.map(r => r.rows));
        await this.commitChanges(world, out, { checkpoint: 'migration' }); return this.load(worldId);
      }
      if (!world.ratingPrecisionVersion && this.writable && this.worldId === world.id) {
        const snapshot = await this.exportWorld(worldId);
        const out = ns.ChairmanRatings.integerMigration(world, snapshot.records);
        await this.commitChanges(world, out, { checkpoint: 'precision' }); return this.load(worldId);
      }
      if(!world.seriesState && ns.ChairmanSeries && this.writable && this.worldId===world.id){
        const out=ns.ChairmanRules.mutate(world,w=>ns.ChairmanSeries.initialize(w));
        await this.commitChanges(world,out,{checkpoint:'content'});return this.load(worldId);
      }
      if(!world.editor&&ns.ChairmanEditor&&this.writable&&this.worldId===world.id){const out=ns.ChairmanRules.mutate(world,w=>ns.ChairmanEditor.initialize(w));await this.commitChanges(world,out);return out.world;}
      return world;
    }
    async commitChanges(previous, output, options) {
      const opts = {...(options || {})};if(output.editorCheckpoint)opts.checkpoint="editor";
      const world = output.world;
      if (!this.writable || this.worldId !== world.id) throw new Error("本世界已在其他页面打开。请关闭另一个页面后重新取得编辑权。");
      // History-only changes (for example editing an old score) are also undo barriers.
      // UI preferences and editor-toggle changes have no such records.
      if (previous && !output.editorCheckpoint && world.editor?.undo &&
          (HISTORY.some(key => key !== 'editorRecords' && output[key]?.length) || output.deletes?.length)) world.editor.undo = null;
      const migrationSnapshot = ["migration", "precision", "content"].includes(opts.checkpoint) ? await this.exportWorld(world.id) : null;
      const mutations = [];
      for (const key of ENTITIES) {
        const old = new Map((previous?.[key] || []).map((item) => [item.id, item]));
        for (const item of world[key] || []) if (!old.has(item.id) || JSON.stringify(old.get(item.id)) !== JSON.stringify(item)) {
          mutations.push({ store: key, row: { ...item, worldId: world.id } });
        }
        if (['councilTypes','templateOverrides'].includes(key)) {
          const remaining = new Set((world[key] || []).map(item => item.id));
          for (const id of old.keys()) if (!remaining.has(id)) mutations.push({ store: key, row: { id, worldId: world.id }, remove: true });
        }
      }
      for (const key of HISTORY) for (const row of output[key] || []) mutations.push({ store: key, row: { ...indexed(key, row), worldId: world.id } });
      for (const change of output.deletes || []) {
        if (!["scoreDrafts"].includes(change.store)) throw new Error("不允许删除正式历史记录。");
        mutations.push({ store: change.store, row: { worldId: world.id, id: change.id }, remove: true });
      }
      const tx = this.db.transaction(["worlds", ...DATA, "leases", "journal", "checkpoints"], "readwrite");
      const done = complete(tx);
      done.catch(() => {});
      let failure = null;
      const abort = (message) => { failure = new Error(message); tx.abort(); };
      try {
      const heads = await Promise.all([request(tx.objectStore("worlds").get(world.id)), request(tx.objectStore("leases").get(world.id))]);
      if (!heads[1] || heads[1].owner !== this.owner || heads[1].expires <= Date.now() && !this.browserLockRelease) abort("编辑权已失效，进度没有写入；请重新取得编辑权。");
      else if (previous ? !heads[0] || heads[0].revision !== previous.revision : !!heads[0]) abort("世界已被更新，请重新读取以免覆盖新进度。");
      else {
        const before = [];
        await Promise.all(mutations.map(async (change) => {
          const store = tx.objectStore(change.store);
          if (previous) {
            const row = await request(store.get([world.id, change.row.id]));
            before.push({ store: change.store, id: change.row.id, row: row || null });
          }
          if (change.remove) store.delete([world.id, change.row.id]); else store.put(change.row);
        }));
        if (opts.failForTest) abort("测试：事务中断。");
        else {
          world.savedAt = Date.now();
          world.officeVersion = 2;
          tx.objectStore("worlds").put(metadata(world));
          if (previous) tx.objectStore("journal").put({ worldId: world.id, id: world.revision, revision: world.revision, before, metadata: heads[0] });
          if (previous && opts.checkpoint) tx.objectStore("checkpoints").put({
            worldId: world.id, id: `${opts.checkpoint}:${previous.revision}`, revision: previous.revision,
            kind: opts.checkpoint, ...(migrationSnapshot ? { snapshot: migrationSnapshot } : {}), turn: previous.turn, savedAt: Date.now(), label: opts.checkpoint === "editor" ? "世界编辑前" : opts.checkpoint === "content" ? "系列与分享升级前" : opts.checkpoint === "precision" ? "整数评分转换前" : opts.checkpoint === "migration" ? "规则升级前" : opts.checkpoint === "year" ? "结束年度前" : "推进半月前"
          });
          tx.objectStore("leases").put({ ...heads[1], expires: Date.now() + 15000 });
        }
      }
        await done;
      } catch (error) {
        try { tx.abort(); } catch (_) { /* Already completed or aborted. */ }
        try { await done; } catch (_) { /* Preserve the original failure. */ }
        throw failure || error;
      }
      // Housekeeping cannot turn an already committed turn into a reported failure.
      try { await this.prune(world.id); } catch (error) { console.warn("Chairman recovery cleanup deferred", error); }
    }
    async prune(worldId) {
      const tx = this.db.transaction(["checkpoints", "journal"], "readwrite"); const done = complete(tx);
      const checkpoints = await request(tx.objectStore("checkpoints").index("byWorld").getAll(worldId));
      const keep = [];
      for (const kind of ["turn", "year", "migration", "precision", "backup", "content", "editor"]) {
        const sorted = checkpoints.filter((c) => c.kind === kind).sort((a, b) => b.revision - a.revision);
        keep.push(...sorted.slice(0, kind === "editor" ? 5 : kind === "turn" ? 3 : 1));
        sorted.slice(kind === "editor" ? 5 : kind === "turn" ? 3 : 1).forEach((c) => tx.objectStore("checkpoints").delete([worldId, c.id]));
      }
      const journalPoints = keep.filter(c=>!c.snapshot);
      const earliest = journalPoints.length ? Math.min(...journalPoints.map((c) => c.revision)) : Infinity;
      const req = tx.objectStore("journal").index("byWorld").openCursor(worldId);
      req.onsuccess = () => { const cursor = req.result; if (!cursor) return; if (cursor.value.revision <= earliest) cursor.delete(); cursor.continue(); };
      await done;
    }
    async query(storeName, worldId, options) {
      if (![...DATA, "checkpoints"].includes(storeName)) throw new Error("查询类型无效。");
      const opts = options || {};
      const store = this.db.transaction(storeName).objectStore(storeName);
      let index = "byWorld", key = worldId;
      if (opts.occurrenceId) { index = "byOccurrence"; key = window.IDBKeyRange.bound([worldId, opts.occurrenceId, 0], [worldId, opts.occurrenceId, Number.MAX_SAFE_INTEGER]); }
      else if (opts.horseId && opts.year != null) { index = "byHorseYear"; key = [worldId, opts.horseId, opts.year]; }
      else if (opts.horseId) { index = storeName === "performances" ? "byHorseTurn" : "byHorseYear"; key = window.IDBKeyRange.bound([worldId, opts.horseId, 0], [worldId, opts.horseId, Number.MAX_SAFE_INTEGER]); }
      else if (opts.turn != null) { index = "byTurn"; key = [worldId, opts.turn]; }
      else if (opts.year != null) { index = "byYear"; key = [worldId, opts.year]; }
      else if (["occurrences", "performances"].includes(storeName)) { index = "byTurn"; key = window.IDBKeyRange.bound([worldId, 0], [worldId, Number.MAX_SAFE_INTEGER]); }
      else if (["ratings", "awards"].includes(storeName)) { index = "byYear"; key = window.IDBKeyRange.bound([worldId, 1], [worldId, Number.MAX_SAFE_INTEGER]); }
      const limit = opts.limit == null ? 50 : opts.limit;
      const offset = opts.offset || 0;
      return new Promise((resolve, reject) => {
        const rows = []; let skipped = 0, more = false;
        const req = store.index(index).openCursor(key, opts.reverse ? "prev" : "next");
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const cursor = req.result;
          if (!cursor) { resolve({ rows, more }); return; }
          const row = clean(cursor.value);
          if (opts.filter && !opts.filter(row)) { cursor.continue(); return; }
          if (skipped++ < offset) { cursor.continue(); return; }
          if (rows.length >= limit) { more = true; resolve({ rows, more }); return; }
          rows.push(row); cursor.continue();
        };
      });
    }
    async get(store, worldId, id) { return clean(await request(this.db.transaction(store).objectStore(store).get([worldId, id]))); }
    async restore(world, checkpointId) {
      if (!this.writable) throw new Error("当前页面只读。");
      const tx = this.db.transaction(["worlds", ...DATA, "journal", "checkpoints", "leases"], "readwrite"); const done = complete(tx);
      const [head, point, lease, journal] = await Promise.all([
        request(tx.objectStore("worlds").get(world.id)), request(tx.objectStore("checkpoints").get([world.id, checkpointId])),
        request(tx.objectStore("leases").get(world.id)), request(tx.objectStore("journal").index("byWorld").getAll(world.id))
      ]);
      if (!point || !lease || lease.owner !== this.owner || lease.expires <= Date.now() || head.revision !== world.revision) {
        tx.abort(); try { await done; } catch (_) {} throw new Error("恢复点或编辑权失效，请重新读取。");
      }
      let restored = head;
      if (point.snapshot) {
        restored = metadata(point.snapshot.world);
        await Promise.all(DATA.map(key => new Promise((resolve,reject) => {
          const store=tx.objectStore(key), scan=store.index('byWorld').openCursor(world.id);
          scan.onerror=()=>reject(scan.error);scan.onsuccess=()=>{const c=scan.result;if(c){c.delete();c.continue();}else{
            for(const row of (ENTITIES.includes(key)?point.snapshot.world[key]:point.snapshot.records[key])||[])store.put({...indexed(key,row),worldId:world.id});resolve();
          }};
        })));
      }
      for (const entry of journal.filter((j) => !point.snapshot && j.revision > point.revision).sort((a, b) => b.revision - a.revision)) {
        for (const change of entry.before) {
          const store = tx.objectStore(change.store);
          if (change.row) store.put(indexed(change.store, change.row)); else store.delete([world.id, change.id]);
        }
        restored = entry.metadata;
      }
      tx.objectStore("worlds").put({ ...restored, revision: head.revision + 1 });
      for (const key of ["journal", "checkpoints"]) {
        const req = tx.objectStore(key).index("byWorld").openCursor(world.id);
        req.onsuccess = () => { const cursor = req.result; if (cursor) { cursor.delete(); cursor.continue(); } };
      }
      await done;
      return this.load(world.id);
    }
    async exportWorld(worldId) {
      const tx = this.db.transaction(["worlds", ...DATA]);
      const [meta, ...all] = await Promise.all([request(tx.objectStore("worlds").get(worldId)),
        ...DATA.map((key) => request(tx.objectStore(key).index("byWorld").getAll(worldId)))]);
      if (!meta) throw new Error("世界不存在。");
      const world = { ...meta }; const records = {};
      DATA.forEach((key, i) => { if (ENTITIES.includes(key)) world[key] = all[i].map(clean); else records[key] = all[i].map(clean); });
      return { format: "keiba-chairman-save", version: 9, savedAt: new Date().toISOString(), world, records };
    }
    validateSnapshot(snapshot) {
      if (!snapshot || snapshot.format !== "keiba-chairman-save" || ![1, 2, 3, 4, 5, 6, 7, 8, 9].includes(snapshot.version)) throw new Error("不支持的存档格式，原存档未修改。");
      ns.ChairmanRules.validateWorld(snapshot.world);
      if (snapshot.world.ratingPrecisionVersion === 1) {
        const check = values => { if (values.some(v => v != null && v !== '' && !Number.isSafeInteger(Number(v)))) throw new Error('评分须为整数，存档未修改。'); };
        for (const h of snapshot.world.horses) check([h.annual.tf, h.annual.manual, h.annual.suggested, h.lastTf, h.lastEventRating, h.previousTf, h.previousWtr]);
        for (const r of snapshot.records?.performances || []) check([r.tf, r.manualRating, r.priorTf, r.priorEventRating]);
        for (const r of snapshot.records?.ratings || []) check([r.tf, r.wtr, r.manual, r.suggested, r.legacyAutomatic]);
        for (const r of snapshot.records?.occurrences || []) check([r.wtrBenchmark?.score]);
        for (const d of snapshot.records?.scoreDrafts || []) check([d.benchmarkScore, ...Object.values(d.values || {}), ...Object.values(d.recommendations || {})]);
      }
      const horseIds = new Set(snapshot.world.horses.map((h) => h.id));
      const pedigreeIds = new Set([...snapshot.world.horses, ...(snapshot.world.pedigrees || [])].map((h) => h.id));
      const raceIds = new Set(snapshot.world.races.map((r) => r.id));
      for (const key of HISTORY) {
        const rows = snapshot.records && snapshot.records[key] || (snapshot.version < 7 && key === "editorRecords" || snapshot.version < 6 && ["seriesYears","seriesRewards"].includes(key) || snapshot.version < 5 && HONOR_HISTORY.includes(key) || snapshot.version < 3 && ["breedingEvents", "breedingYears"].includes(key) || snapshot.version === 1 && ["scoreDrafts", "revisions"].includes(key) ? [] : null);
        if (!Array.isArray(rows) || new Set(rows.map((r) => r.id)).size !== rows.length) throw new Error("历史记录缺失或编号重复。");
        for (const row of rows) {
          if (!row || typeof row.id !== "string" || !Number.isInteger(row.year)) throw new Error("历史记录格式无效。");
          if (row.horseId && !(key === "breedingYears" ? pedigreeIds : horseIds).has(row.horseId)) throw new Error("历史记录引用不存在的马匹。");
          if (row.raceId && !raceIds.has(row.raceId)) throw new Error("历史记录引用不存在的赛事。");
        }
      }
      const occurrences = new Set(snapshot.records.occurrences.map((r) => r.id));
      for (const row of snapshot.records.occurrences) {
        if (!row.race || !raceIds.has(row.raceId) || !["completed", "cancelled"].includes(row.status)
          || !Number.isInteger(row.turn) || row.turn < 0 || ns.ChairmanRules.date(row.turn).year !== row.year
          || !Number.isInteger(row.count) || row.count < 0) throw new Error("赛事届次内容无效。");
      }
      for (const row of snapshot.records.occurrences) if (row.scaleOffset != null && ![4,5,6].includes(row.scaleOffset)) throw new Error("评级尺度差无效。");
      for (const row of snapshot.records.performances) {
        if (!occurrences.has(row.occurrenceId) || !horseIds.has(row.horseId) || !raceIds.has(row.raceId)
          || !Number.isInteger(row.turn) || ns.ChairmanRules.date(row.turn).year !== row.year
          || !Number.isFinite(row.prize) || row.prize < 0 || row.tf != null && !Number.isFinite(row.tf)
          || row.manualRating != null && !Number.isFinite(row.manualRating)) throw new Error("出赛记录的关联或评分无效。");
      }
      for (const row of snapshot.records.ratings) {
        if (!horseIds.has(row.horseId) || [row.wtr, row.tf, row.manual, row.suggested].some((v) => v != null && !Number.isFinite(v))) throw new Error("年度评分无效。");
      }
      for (const row of snapshot.records.awards) if (!horseIds.has(row.horseId) || !ns.ChairmanRules.AWARDS.some((a) => a.id === row.awardId)) throw new Error("年度奖项无效。");
      if (snapshot.world.honors) ns.ChairmanHonors.validateHistory(snapshot.world, snapshot.records);
      const performanceById = new Map(snapshot.records.performances.map((p) => [p.id, p]));
      for (const d of snapshot.records.scoreDrafts || []) {
        if (d.benchmarkId && ![...performanceById.values()].some(p=>p.occurrenceId===d.id && p.horseId===d.benchmarkId && !p.retired)
          || d.benchmarkScore != null && !Number.isFinite(d.benchmarkScore)
          || d.scaleOffset != null && ![4,5,6].includes(d.scaleOffset)) throw new Error('评分基准无效。');
        for (const [id,n] of Object.entries(d.recommendations||{})) if (!performanceById.has(id) || performanceById.get(id).occurrenceId!==d.id || !Number.isFinite(n)) throw new Error('推荐分无效。');
        if (!occurrences.has(d.id) || !d.values || Array.isArray(d.values) || Object.entries(d.values).some(([id, v]) => {
          const p = performanceById.get(id); return !p || p.occurrenceId !== d.id || p.year !== d.year || p.retired
            || !["string", "number"].includes(typeof v) || v !== "" && !Number.isFinite(Number(v));
        })) throw new Error("评分草稿无效。");
      }
      for (const r of snapshot.records.revisions || []) if (!["annual", "event"].includes(r.kind) || [r.before, r.after].some((v) => v != null && !Number.isFinite(v))) throw new Error("评分修订记录无效。");
      ns.ChairmanPackages?.validateWorld(snapshot.world);
      ns.ChairmanSeries?.validateHistory(snapshot.world,snapshot.records);
      const mothers = new Set(), bornIds = new Set();
      for (const r of snapshot.records.breedingEvents || []) {
        const h = ns.ChairmanBreeding.get(snapshot.world, r.horseId), key = `${r.birthYear}:${r.motherId}`;
        if (!pedigreeIds.has(r.fatherId) || !pedigreeIds.has(r.motherId) || !h || (h.birthFacts||h).fatherId !== r.fatherId || (h.birthFacts||h).motherId !== r.motherId
          || (h.birthFacts||h).birthYear !== r.birthYear || r.birthYear !== r.year + 1 || mothers.has(key) || bornIds.has(r.horseId)
          || r.fatherSnapshot?.id !== r.fatherId || r.motherSnapshot?.id !== r.motherId) throw new Error("配种与出生记录关联无效。");
        mothers.add(key); bornIds.add(r.horseId);
      }
      if (snapshot.world.breeding && snapshot.world.horses.some((h) => h.sourceKind === "bred" && !bornIds.has(h.id))) throw new Error("繁殖后代缺少出生记录。");
      for (const r of snapshot.records.breedingYears || []) if (!Number.isFinite(r.prize) || r.prize < 0 || typeof r.champion !== "boolean") throw new Error("繁殖年度统计无效。");
      return true;
    }
    async importWorld(snapshot) {
      this.validateSnapshot(snapshot);
      const copy = ns.ChairmanRules.clone(snapshot);
      copy.world.id = `world-${Date.now()}-${Math.floor(Math.random() * 0xffffffff)}`;
      copy.world.revision = 0;
      if (!await this.acquire(copy.world.id)) throw new Error("无法取得新世界的编辑权。");
      await this.commitChanges(null, { world: copy.world, ...copy.records });
      return this.load(copy.world.id);
    }
    async saveSlot(worldId, slot) {
      if (!Number.isInteger(slot) || slot < 1 || slot > 10) throw new Error("存档槽必须为1至10。");
      const snapshot = await this.exportWorld(worldId);
      const tx = this.db.transaction(["slots", "slotSummaries"], "readwrite"); const done = complete(tx);
      const meta = { id: slot, name: snapshot.world.name, sourceWorldId: worldId, turn: snapshot.world.turn, savedAt: snapshot.savedAt };
      tx.objectStore("slots").put({ ...meta, snapshot });
      tx.objectStore("slotSummaries").put(meta);
      await done;
    }
    async slots() {
      return request(this.db.transaction("slotSummaries").objectStore("slotSummaries").getAll());
    }
    async backupInfo(slot) {
      const row = await request(this.db.transaction('slots').objectStore('slots').get(Number(slot)));
      if (!row) throw new Error('此手动备份为空。');
      return row;
    }
    async deleteSlot(slot, savedAt) {
      const tx=this.db.transaction(['slots','slotSummaries'],'readwrite'), done=complete(tx); done.catch(()=>{});
      const row=await request(tx.objectStore('slots').get(Number(slot)));
      if(!row || savedAt && row.savedAt!==savedAt){tx.abort();try{await done;}catch(_){}throw new Error('备份已改变，请重新查看。');}
      tx.objectStore('slots').delete(Number(slot));tx.objectStore('slotSummaries').delete(Number(slot));await done;
    }
    async deleteWorld(id, revision, options={}) {
      if(this.worldId!==id || !this.writable) if(!await this.acquire(id))throw new Error('另一页面正在操作此游戏，不能删除。');
      const tx=this.db.transaction(['worlds',...DATA,'journal','checkpoints','leases'],'readwrite'),done=complete(tx);done.catch(()=>{});
      try {
        const head=await request(tx.objectStore('worlds').get(id)),lease=await request(tx.objectStore('leases').get(id));
        if(!head || head.revision!==revision || lease?.owner!==this.owner || lease.expires<=Date.now())throw new Error('游戏或编辑权已改变，请重新查看。');
        await Promise.all([...DATA,'journal','checkpoints'].map(key=>this.clearWorldStore(tx,key,id)));
        tx.objectStore('worlds').delete(id);tx.objectStore('leases').delete(id);
        if(options.failForTest)throw new Error('测试：事务中断。'); await done;
      } catch(e){try{tx.abort();}catch(_){}try{await done;}catch(_){}throw e;}
      await this.release();
    }
    clearWorldStore(tx,key,id) {
      return new Promise((resolve,reject)=>{const req=tx.objectStore(key).index('byWorld').openCursor(id);req.onerror=()=>reject(req.error);req.onsuccess=()=>{const c=req.result;if(c){c.delete();c.continue();}else resolve();};});
    }
    async loadSlot(slot, asNew=false, expectedSavedAt, options={}) {
      const row=await this.backupInfo(slot);
      if(expectedSavedAt && row.savedAt!==expectedSavedAt)throw new Error('备份已改变，请重新确认。');
      this.validateSnapshot(row.snapshot);
      const id=row.snapshot.world.id, exists=await request(this.db.transaction('worlds').objectStore('worlds').get(id));
      if(asNew || !exists)return this.importWorld(row.snapshot);
      if(this.worldId!==id || !this.writable)if(!await this.acquire(id))throw new Error('来源游戏正在另一页面使用，不能恢复。');
      const before=await this.exportWorld(id), copy=ns.ChairmanRules.clone(row.snapshot);
      const tx=this.db.transaction(['worlds',...DATA,'journal','checkpoints','leases','slots'],'readwrite'),done=complete(tx);done.catch(()=>{});
      try {
        const head=await request(tx.objectStore('worlds').get(id)), lease=await request(tx.objectStore('leases').get(id)), currentSlot=await request(tx.objectStore('slots').get(Number(slot)));
        if(!head || head.revision!==before.world.revision || lease?.owner!==this.owner || lease.expires<=Date.now() || currentSlot?.savedAt!==row.savedAt)throw new Error('游戏或备份已更新，恢复没有执行。');
        await Promise.all([...DATA,'journal','checkpoints'].map(key=>this.clearWorldStore(tx,key,id)));
        for(const key of DATA)for(const record of (ENTITIES.includes(key)?copy.world[key]:copy.records[key])||[])tx.objectStore(key).put({...indexed(key,record),worldId:id});
        tx.objectStore('worlds').put({...metadata(copy.world),id,revision:head.revision+1,savedAt:Date.now()});
        tx.objectStore('checkpoints').put({worldId:id,id:'backup:'+head.revision,revision:head.revision,kind:'backup',turn:head.turn,label:'恢复手动备份前',savedAt:Date.now(),snapshot:before});
        if(options.failForTest)throw new Error('测试：事务中断。');await done;
      }catch(e){try{tx.abort();}catch(_){}try{await done;}catch(_){}throw e;}
      return this.load(id);
    }
    async close() { await this.release(); this.db.close(); }
  }
  ns.ChairmanStorage = { open, Store, DB_NAME, DATA, indexed };
})();
