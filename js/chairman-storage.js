(function () {
  "use strict";
  const ns = (window.Keiba = window.Keiba || {});
  const ENTITIES = ["horses", "tracks", "races", "pedigrees"];
  const HISTORY = ["occurrences", "performances", "ratings", "awards", "scoreDrafts", "revisions", "breedingEvents", "breedingYears"];
  const DATA = [...ENTITIES, ...HISTORY];
  const DB_NAME = "keiba-chairman-v1";
  const clean = (row) => { if (!row) return row; const value = { ...row }; delete value.worldId; return value; };
  function indexed(key, row) {
    if (key === "occurrences") return { ...row, displayTurn: -row.turn, gradeOrder: ({ g1: 0, g2: 1, g3: 2, op: 3 })[row.raceClass] ?? 4,
      trackId: row.race.trackId, scoring: row.scoring || "none" };
    if (key === "ratings") return { ...row, wtrSort: row.wtr == null ? Number.MAX_VALUE : -row.wtr, prizeSort: -(row.prize || 0), homeRegion: row.homeRegion || "未记录" };
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
      const req = window.indexedDB.open(DB_NAME, 4);
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
      return world;
    }
    async commitChanges(previous, output, options) {
      const opts = options || {};
      const world = output.world;
      if (!this.writable || this.worldId !== world.id) throw new Error("本世界已在其他页面打开。请关闭另一个页面后重新取得编辑权。");
      const mutations = [];
      for (const key of ENTITIES) {
        const old = new Map((previous?.[key] || []).map((item) => [item.id, item]));
        for (const item of world[key] || []) if (!old.has(item.id) || JSON.stringify(old.get(item.id)) !== JSON.stringify(item)) {
          mutations.push({ store: key, row: { ...item, worldId: world.id } });
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
            kind: opts.checkpoint, turn: previous.turn, savedAt: Date.now(), label: opts.checkpoint === "year" ? "结束年度前" : "推进半月前"
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
      for (const kind of ["turn", "year"]) {
        const sorted = checkpoints.filter((c) => c.kind === kind).sort((a, b) => b.revision - a.revision);
        keep.push(...sorted.slice(0, kind === "turn" ? 3 : 1));
        sorted.slice(kind === "turn" ? 3 : 1).forEach((c) => tx.objectStore("checkpoints").delete([worldId, c.id]));
      }
      const earliest = keep.length ? Math.min(...keep.map((c) => c.revision)) : Infinity;
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
      for (const entry of journal.filter((j) => j.revision > point.revision).sort((a, b) => b.revision - a.revision)) {
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
      return { format: "keiba-chairman-save", version: 3, savedAt: new Date().toISOString(), world, records };
    }
    validateSnapshot(snapshot) {
      if (!snapshot || snapshot.format !== "keiba-chairman-save" || ![1, 2, 3].includes(snapshot.version)) throw new Error("不支持的存档格式，原存档未修改。");
      ns.ChairmanRules.validateWorld(snapshot.world);
      const horseIds = new Set(snapshot.world.horses.map((h) => h.id));
      const pedigreeIds = new Set([...snapshot.world.horses, ...(snapshot.world.pedigrees || [])].map((h) => h.id));
      const raceIds = new Set(snapshot.world.races.map((r) => r.id));
      for (const key of HISTORY) {
        const rows = snapshot.records && snapshot.records[key] || (snapshot.version < 3 && ["breedingEvents", "breedingYears"].includes(key) || snapshot.version === 1 && ["scoreDrafts", "revisions"].includes(key) ? [] : null);
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
      const performanceById = new Map(snapshot.records.performances.map((p) => [p.id, p]));
      for (const d of snapshot.records.scoreDrafts || []) {
        if (!occurrences.has(d.id) || !d.values || Array.isArray(d.values) || Object.entries(d.values).some(([id, v]) => {
          const p = performanceById.get(id); return !p || p.occurrenceId !== d.id || p.year !== d.year || p.retired
            || !["string", "number"].includes(typeof v) || v !== "" && !Number.isFinite(Number(v));
        })) throw new Error("评分草稿无效。");
      }
      for (const r of snapshot.records.revisions || []) if (!["annual", "event"].includes(r.kind) || [r.before, r.after].some((v) => v != null && !Number.isFinite(v))) throw new Error("评分修订记录无效。");
      const mothers = new Set(), bornIds = new Set();
      for (const r of snapshot.records.breedingEvents || []) {
        const h = ns.ChairmanBreeding.get(snapshot.world, r.horseId), key = `${r.birthYear}:${r.motherId}`;
        if (!pedigreeIds.has(r.fatherId) || !pedigreeIds.has(r.motherId) || !h || h.fatherId !== r.fatherId || h.motherId !== r.motherId
          || h.birthYear !== r.birthYear || r.birthYear !== r.year + 1 || mothers.has(key) || bornIds.has(r.horseId)
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
      const meta = { id: slot, name: snapshot.world.name, turn: snapshot.world.turn, savedAt: snapshot.savedAt };
      tx.objectStore("slots").put({ ...meta, snapshot });
      tx.objectStore("slotSummaries").put(meta);
      await done;
    }
    async slots() {
      return request(this.db.transaction("slotSummaries").objectStore("slotSummaries").getAll());
    }
    async loadSlot(slot) {
      const row = await request(this.db.transaction("slots").objectStore("slots").get(slot));
      if (!row) throw new Error("此存档槽为空。");
      return this.importWorld(row.snapshot);
    }
    async close() { await this.release(); this.db.close(); }
  }
  ns.ChairmanStorage = { open, Store, DB_NAME, DATA, indexed };
})();
