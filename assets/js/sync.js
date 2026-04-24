window.addEventListener("online",syncPending);

function syncPending(){

getAllPending(rows=>{

rows.forEach(r=>{

fetch(API_URL,{
method:"POST",
body:JSON.stringify(r)
})
.then(x=>x.json())
.then(res=>{
if(res.ok) deletePending(r.record_id);
});

});
});
}
