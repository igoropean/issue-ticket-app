let db;

const req=indexedDB.open("IssueDB",1);

req.onupgradeneeded=e=>{
db=e.target.result;
db.createObjectStore("pending",{keyPath:"record_id"});
};

req.onsuccess=e=>{
db=e.target.result;
updatePending();
syncPending();
};

function saveOffline(data){
const tx=db.transaction("pending","readwrite");
tx.objectStore("pending").put(data);
updatePending();
}

function getAllPending(cb){
const tx=db.transaction("pending","readonly");
const req=tx.objectStore("pending").getAll();
req.onsuccess=()=>cb(req.result);
}

function deletePending(id){
const tx=db.transaction("pending","readwrite");
tx.objectStore("pending").delete(id);
updatePending();
}

function updatePending(){
getAllPending(rows=>{
document.getElementById("pendingCount").innerText=rows.length;
});
}
