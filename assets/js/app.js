if('serviceWorker' in navigator){
navigator.serviceWorker.register('service-worker.js');
}

window.addEventListener("load",()=>{

document.getElementById("netStatus").innerText=
navigator.onLine?"Online":"Offline";

window.addEventListener("online",()=>{
netStatus.innerText="Online";
syncPending();
});

window.addEventListener("offline",()=>{
netStatus.innerText="Offline";
});

if(localStorage.getItem("session")){
showApp();
}

});
