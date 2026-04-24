function login(){

const username=document.getElementById("username").value.trim();
const password=document.getElementById("password").value.trim();

fetch(API_URL,{
method:"POST",
body:JSON.stringify({
action:"login",
username,password
})
})
.then(r=>r.json())
.then(res=>{

if(!res.ok){
Swal.fire("Invalid Login","","error");
return;
}

localStorage.setItem("session",JSON.stringify(res.user));
showApp();

});
}

function logout(){
localStorage.removeItem("session");
location.reload();
}

function showApp(){

const user=JSON.parse(localStorage.getItem("session"));

document.getElementById("loginCard").classList.add("d-none");
document.getElementById("appCard").classList.remove("d-none");
document.getElementById("whoami").innerText=user.username;
}
