let db;

const req = indexedDB.open("IssueDB", 1);

req.onupgradeneeded = e => {
  db = e.target.result;
  if (!db.objectStoreNames.contains("pending")) {
    db.createObjectStore("pending", { keyPath: "record_id" });
  }
};

req.onsuccess = e => {
  db = e.target.result;
  updatePending();
  syncPending();
};

function saveOffline(data) {
  const tx = db.transaction("pending", "readwrite");
  tx.objectStore("pending").put(data);
  tx.oncomplete = () => updatePending();
}

function getAllPending(cb) {
  const tx = db.transaction("pending", "readonly");
  const req = tx.objectStore("pending").getAll();
  req.onsuccess = () => cb(req.result || []);
  req.onerror = () => cb([]);
}

function deletePending(id) {
  return new Promise(resolve => {
    const tx = db.transaction("pending", "readwrite");
    tx.objectStore("pending").delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

function countPending() {
  return new Promise(resolve => {
    const tx = db.transaction("pending", "readonly");
    const req = tx.objectStore("pending").count();
    req.onsuccess = () => resolve(req.result || 0);
    req.onerror = () => resolve(0);
  });
}

async function updatePending() {
  const count = await countPending();
  document.getElementById("pendingCount").innerText = count;
}
