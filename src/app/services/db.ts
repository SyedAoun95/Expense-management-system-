// src/app/services/db.ts
export const initDB = async () => {
  if (typeof window === "undefined") return null; // only run in browser

  const PouchDB = (await import("pouchdb-browser")).default;
  const PouchDBFind = (await import("pouchdb-find")).default;

  PouchDB.plugin(PouchDBFind);

  const localDB = new PouchDB("crud-database");
  const remoteDB = new PouchDB(
    "http://admin:syedaoun12345@127.0.0.1:5984/db_fcn"
  );

  // ---------------------------
  // LIVE TWO-WAY SYNC
  // ---------------------------
  const syncDB = () => {
    localDB
      .sync(remoteDB, { live: true, retry: true })
      .on("change", (info) => console.log("DB Change:", info))
      .on("paused", () => console.log("Sync paused"))
      .on("active", () => console.log("Sync active"))
      .on("error", (err) => console.error("Sync error:", err));
  };

  // ---------------------------
  // REAL-TIME CHANGES LISTENER
  // ---------------------------
  const listenChanges = (onChange: (doc: any) => void) => {
    const changes = localDB
      .changes({
        since: "now",
        live: true,
        include_docs: true,
      })
      .on("change", (change) => {
        if (change.deleted) {
          onChange({ ...change.doc, _deleted: true });
        } else {
          onChange(change.doc);
        }
      });

    return changes;
  };

  // ---------------------------
  // AREA CRUD
  // ---------------------------
  const createArea = async (name: string) => {
    if (!name.trim()) throw new Error("Area name cannot be empty");

    const doc = {
      _id: `area_${name.toLowerCase()}_${Date.now()}`,
      type: "area",
      name,
      createdAt: new Date().toISOString(),
    };

    return localDB.put(doc);
  };

  const getAreas = async () => {
    await localDB.createIndex({ index: { fields: ["type"] } });
    const res = await localDB.find({ selector: { type: "area" } });
    return res.docs;
  };

  const deleteArea = async (area: any) => {
    return localDB.remove(area);
  };

  // ---------------------------
  // PERSON CRUD
  // ---------------------------
  const createPerson = async (
    name: string,
    number: number,
    areaId: string
  ) => {
    if (!name.trim() || !number || !areaId)
      throw new Error("Invalid input");

    const doc = {
      _id: `person_${areaId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: "person",
      name,
      number,
      areaId,
      createdAt: new Date().toISOString(),
    };

    return localDB.put(doc);
  };

  const getPersonsByArea = async (areaId: string) => {
    await localDB.createIndex({
      index: { fields: ["type", "areaId"] },
    });

    const res = await localDB.find({
      selector: { type: "person", areaId },
    });

    return res.docs;
  };

  const updatePerson = async (person: any, updates: any) => {
    if (!person._id || !person._rev)
      throw new Error("_id and _rev required");
    return localDB.put({ ...person, ...updates });
  };

  const deletePerson = async (person: any) => {
    return localDB.remove(person);
  };

  // ---------------------------
  // REAL-TIME SEARCH (NAME OR NUMBER)
  // ---------------------------
  const searchPersons = async (query: string) => {
    if (!query.trim()) return [];

    const q = query.toLowerCase();

    await localDB.createIndex({
      index: { fields: ["type", "name", "number"] },
    });

    const result = await localDB.find({
      selector: {
        type: "person",
        $or: [
          { name: { $regex: new RegExp(q, "i") } },
          { number: { $regex: new RegExp(q, "i") } },
        ],
      },
    });

    return result.docs;
  };

  // ---------------------------
  // AGGREGATION HELPERS
  // ---------------------------
  const totalConnections = async () => {
    // Count only valid person docs (those with `name` and `areaId` present)
    await localDB.createIndex({ index: { fields: ['type', 'name', 'areaId'] } });
    const res = await localDB.find({
      selector: {
        type: 'person',
        name: { $exists: true },
        areaId: { $exists: true }
      }
    });
    return res.docs.length;
  };

  // Debug helper: return all person docs (useful to inspect bogus/sample docs)
  const getAllPersons = async () => {
    await localDB.createIndex({ index: { fields: ['type', 'name', 'areaId', 'amount', 'createdAt'] } });
    const res = await localDB.find({ selector: { type: 'person' } });
    return res.docs;
  };

  const grandTotalRevenue = async () => {
    await localDB.createIndex({ index: { fields: ['type', 'amount'] } });
    const res = await localDB.find({ selector: { type: 'person' } });
    return res.docs.reduce((sum: number, d: any) => sum + (Number(d.amount) || 0), 0);
  };

  const monthlyRevenue = async (year: number, month: number) => {
    await localDB.createIndex({ index: { fields: ['type', 'createdAt', 'amount'] } });
    const res = await localDB.find({ selector: { type: 'person' } });
    const total = res.docs.reduce((sum: number, d: any) => {
      if (!d.createdAt) return sum;
      const dt = new Date(d.createdAt);
      if (dt.getFullYear() === year && dt.getMonth() + 1 === month) {
        return sum + (Number(d.amount) || 0);
      }
      return sum;
    }, 0);
    return total;
  };

  const monthlyRevenueHistory = async (monthsBack = 12) => {
    await localDB.createIndex({ index: { fields: ['type', 'createdAt', 'amount'] } });
    const res = await localDB.find({ selector: { type: 'person' } });

    const map: Record<string, number> = {};
    const now = new Date();

    for (let i = 0; i < monthsBack; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = 0;
    }

    res.docs.forEach((d: any) => {
      if (!d.createdAt) return;
      const dt = new Date(d.createdAt);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      if (map[key] !== undefined) {
        map[key] += (Number(d.amount) || 0);
      }
    });

    return Object.keys(map).map((k) => ({ month: k, total: map[k] }));
  };

  // ---------------------------
  // AUTOMATIC SYNC ON INIT
  // ---------------------------
  syncDB();

  return {
    localDB,
    remoteDB,
    syncDB,
    listenChanges,
    createArea,
    getAreas,
    deleteArea,
    createPerson,
    getPersonsByArea,
    updatePerson,
    deletePerson,
    searchPersons,
    totalConnections,
    grandTotalRevenue,
    monthlyRevenue,
    monthlyRevenueHistory,
    getAllPersons,
  };
};
