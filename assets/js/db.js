let db = null;
let dbReady = null;

dbReady = new Promise((resolve, reject) => {
  const req = indexedDB.open(DB_NAME, 1);

  req.onupgradeneeded = e => {
    db = e.target.result;
    if (!db.objectStoreNames.contains(DB_STORE)) {
      db.createObjectStore(DB_STORE, { keyPath: "record_id" });
    }
  };

  req.onsuccess = e => {
    db = e.target.result;
    resolve(db);
  };

  req.onerror = () => reject(req.error);
});

async function getDB() {
  if (!db) await dbReady;
  return db;
}

async function idbPut(record) {
  const mydb = await getDB();
  return new Promise((resolve, reject) => {
    const tx = mydb.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).put(record);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGetAll() {
  const mydb = await getDB();
  return new Promise((resolve, reject) => {
    const tx = mydb.transaction(DB_STORE, "readonly");
    const req = tx.objectStore(DB_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(recordId) {
  const mydb = await getDB();
  return new Promise((resolve, reject) => {
    const tx = mydb.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).delete(recordId);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

async function idbCount() {
  const mydb = await getDB();
  return new Promise((resolve) => {
    const tx = mydb.transaction(DB_STORE, "readonly");
    const req = tx.objectStore(DB_STORE).count();
    req.onsuccess = () => resolve(req.result || 0);
    req.onerror = () => resolve(0);
  });
}

async function updatePending() {
  const count = await idbCount();
  const badge = document.getElementById("pendingBadge");
  if (badge) badge.textContent = String(count);
  return count;
}
