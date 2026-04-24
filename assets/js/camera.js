let capturedImage="";

function capturePhoto(){

navigator.mediaDevices.getUserMedia({
video:{facingMode:"environment"}
})
.then(stream=>{

const video=document.createElement("video");
video.srcObject=stream;
video.play();

Swal.fire({
html:video,
showConfirmButton:true,
confirmButtonText:"Capture"
}).then(()=>{

const canvas=document.createElement("canvas");
canvas.width=video.videoWidth;
canvas.height=video.videoHeight;

canvas.getContext("2d").drawImage(video,0,0);

capturedImage=canvas.toDataURL("image/jpeg",0.8);

stream.getTracks().forEach(t=>t.stop());

document.getElementById("photoPreview").innerHTML=
`<img src="${capturedImage}" class="preview">`;

});
});
}
