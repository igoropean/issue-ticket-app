let db;
let dbReady;

dbReady = new Promise((resolve, reject) => {

  const req = indexedDB.open("IssueDB", 1);

  req.onupgradeneeded = e => {
    db = e.target.result;

    if (!db.objectStoreNames.contains("pending")) {
      db.createObjectStore("pending", { keyPath: "record_id" });
    }
  };

  req.onsuccess = e => {
    db = e.target.result;
    resolve(db);
  };

  req.onerror = e => reject(e);
});

async function getDB() {
  if (!db) await dbReady;
  return db;
}

async function saveOffline(data) {
  const mydb = await getDB();

  const tx = mydb.transaction("pending", "readwrite");
  tx.objectStore("pending").put(data);

  tx.oncomplete = updatePending;
}

async function getAllPending() {
  const mydb = await getDB();

  return new Promise(resolve => {
    const tx = mydb.transaction("pending", "readonly");
    const req = tx.objectStore("pending").getAll();

    req.onsuccess = () => resolve(req.result || []);
  });
}

async function deletePending(id) {
  const mydb = await getDB();

  return new Promise(resolve => {
    const tx = mydb.transaction("pending", "readwrite");
    tx.objectStore("pending").delete(id);

    tx.oncomplete = resolve;
  });
}

async function updatePending() {
  const rows = await getAllPending();
  const count = rows.length;
  const badge = document.getElementById("pendingSyncCount");
  if (badge) {
    badge.innerText = `Pending Sync: ${count}`;
    // Optional: Hide badge if count is 0
    badge.style.display = count > 0 ? "block" : "none";
  }
}

