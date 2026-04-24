function submitTicket(){

const user=JSON.parse(localStorage.getItem("session"));

const payload={
record_id:Date.now()+"",
timestamp:new Date().toLocaleString(),
username:user.username,
ticket_number:user.id_prefix+Date.now(),
store_code:storeCode.value,
issue_description:issueDesc.value,
priority:priority.value,
image:capturedImage
};

if(!navigator.onLine){
saveOffline(payload);
Swal.fire("Saved Offline","","info");
return;
}

sendNow(payload);
}

function sendNow(payload){

fetch(API_URL,{
method:"POST",
body:JSON.stringify(payload)
})
.then(r=>r.json())
.then(res=>{

if(res.ok){
Swal.fire("Ticket Created","","success");
clearForm();
}else{
saveOffline(payload);
Swal.fire("Saved Offline","","info");
}

});
}

function clearForm(){
storeCode.value="";
issueDesc.value="";
capturedImage="";
photoPreview.innerHTML="";
}
