let photos = [];
let mediaStream = null;
let pendingCapturedDataUrl = null;
let pendingCapturedTimestampFile = null;

const cameraModal = bootstrap.Modal.getOrCreateInstance(document.getElementById("cameraModal"));
const cameraVideo = document.getElementById("cameraVideo");
const cameraPreview = document.getElementById("cameraPreview");
const captureCanvas = document.getElementById("captureCanvas");
const captureBtn = document.getElementById("captureBtn");
const retakeBtn = document.getElementById("retakeBtn");
const usePhotoBtn = document.getElementById("usePhotoBtn");
const addPhotoBtn = document.getElementById("addPhotoBtn");

function safeName(value) {
  return String(value || "")
    .trim()
    .replace(/[^\w.-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 90) || "file";
}

function getLocalDateParts(date = new Date()) {
  const pad = n => String(n).padStart(2, "0");
  return {
    year: date.getFullYear(),
    month: pad(date.getMonth() + 1),
    day: pad(date.getDate()),
    hour: pad(date.getHours()),
    minute: pad(date.getMinutes())
  };
}

function getClientTimestampFile(date = new Date()) {
  const d = getLocalDateParts(date);
  return `${d.year}-${d.month}-${d.day}_${d.hour}-${d.minute}`;
}

function stopCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  cameraVideo.srcObject = null;
}

function resetCameraModalUI() {
  pendingCapturedDataUrl = null;
  pendingCapturedTimestampFile = null;
  cameraPreview.classList.add("d-none");
  cameraVideo.classList.remove("d-none");
  captureBtn.classList.remove("d-none");
  retakeBtn.classList.add("d-none");
  usePhotoBtn.classList.add("d-none");
  captureBtn.disabled = false;
}

async function startCamera() {
  stopCamera();
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Camera is not supported on this browser.");
  }

  mediaStream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { ideal: "environment" },
      width: { ideal: 1280 },
      height: { ideal: 720 }
    },
    audio: false
  });

  cameraVideo.srcObject = mediaStream;
  await cameraVideo.play();
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

async function watermarkImage(dataUrl, username, storeCode, timestampFile) {
  const image = await loadImage(dataUrl);
  const maxWidth = 1280;
  const scale = Math.min(1, maxWidth / image.width);

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);

  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const boxHeight = Math.max(96, Math.round(canvas.height * 0.14));
  const boxY = canvas.height - boxHeight;
  const padding = Math.max(14, Math.round(canvas.width * 0.02));
  const fontSize = Math.max(18, Math.round(canvas.width * 0.025));
  const lineGap = Math.max(6, Math.round(fontSize * 0.32));

  ctx.fillStyle = "rgba(0,0,0,0.58)";
  ctx.fillRect(0, boxY, canvas.width, boxHeight);

  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "top";
  ctx.font = `700 ${fontSize}px Arial, Helvetica, sans-serif`;

  const lines = [
    `User: ${username}`,
    `Time: ${timestampFile.replace("_", " ")}`,
    `Store: ${storeCode}`
  ];

  let y = boxY + padding;
  for (const line of lines) {
    ctx.fillText(line, padding, y);
    y += fontSize + lineGap;
  }

  return canvas.toDataURL("image/jpeg", 0.86);
}

async function captureCurrentFrame() {
  if (!cameraVideo.videoWidth || !cameraVideo.videoHeight) {
    throw new Error("Camera is not ready yet.");
  }

  const canvas = captureCanvas;
  canvas.width = cameraVideo.videoWidth;
  canvas.height = cameraVideo.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);

  const rawDataUrl = canvas.toDataURL("image/jpeg", 0.92);
  pendingCapturedTimestampFile = getClientTimestampFile(new Date());
  pendingCapturedDataUrl = await watermarkImage(
    rawDataUrl,
    currentUser.username,
    document.getElementById("storeCode").value.trim(),
    pendingCapturedTimestampFile
  );

  cameraPreview.src = pendingCapturedDataUrl;
  cameraPreview.classList.remove("d-none");
  cameraVideo.classList.add("d-none");
  captureBtn.classList.add("d-none");
  retakeBtn.classList.remove("d-none");
  usePhotoBtn.classList.remove("d-none");
}

function refreshPhotoActionLabel() {
  const count = photos.length;
  addPhotoBtn.textContent = count > 0 ? "Take Another Photo" : "Add Photo";
  addPhotoBtn.disabled = count >= MAX_PHOTOS;
}

function renderPhotos() {
  const grid = document.getElementById("photoGrid");
  const empty = document.getElementById("photoEmpty");
  const photoCount = document.getElementById("photoCount");

  photoCount.textContent = String(photos.length);
  empty.classList.toggle("d-none", photos.length > 0);
  grid.innerHTML = "";

  photos.forEach((photo, index) => {
    const wrap = document.createElement("div");
    wrap.className = "photo-card";

    const img = document.createElement("img");
    img.src = photo.dataUrl;
    img.alt = "Captured photo";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "photo-remove";
    btn.innerHTML = "&times;";
    btn.title = "Remove photo";
    btn.addEventListener("click", () => {
      photos.splice(index, 1);
      renderPhotos();
      refreshPhotoActionLabel();
      updatePending();
    });

    wrap.appendChild(img);
    wrap.appendChild(btn);
    grid.appendChild(wrap);
  });

  refreshPhotoActionLabel();
}

async function openCamera() {
  if (!currentUser) return;

  const storeCode = document.getElementById("storeCode").value.trim();
  if (!storeCode) {
    Swal.fire({ icon: "warning", title: "Enter Store Code first" });
    return;
  }

  if (photos.length >= MAX_PHOTOS) {
    Swal.fire({ icon: "warning", title: "Photo limit reached", text: "You can attach up to 3 photos only." });
    return;
  }

  resetCameraModalUI();
  cameraModal.show();

  try {
    await startCamera();
  } catch (err) {
    Swal.fire({ icon: "error", title: "Camera error", text: err.message || "Unable to access the camera." });
    cameraModal.hide();
  }
}

async function useCapturedPhoto() {
  if (!pendingCapturedDataUrl) return;

  const storeCode = document.getElementById("storeCode").value.trim();
  const fileName = `${safeName(currentUser.username)}_${safeName(storeCode)}_${pendingCapturedTimestampFile}_${photos.length + 1}.jpg`;

  photos.push({
    id: crypto.randomUUID ? crypto.randomUUID() : `photo_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    dataUrl: pendingCapturedDataUrl,
    timestampFile: pendingCapturedTimestampFile,
    fileName
  });

  renderPhotos();
  cameraModal.hide();
  stopCamera();
  resetCameraModalUI();
  await updatePending();
}

async function retakePhoto() {
  resetCameraModalUI();
  try {
    await startCamera();
  } catch (err) {
    Swal.fire({ icon: "error", title: "Camera error", text: err.message || "Unable to restart camera." });
  }
}

document.getElementById("addPhotoBtn").addEventListener("click", openCamera);
captureBtn.addEventListener("click", async () => {
  captureBtn.disabled = true;
  try {
    await captureCurrentFrame();
  } catch (err) {
    Swal.fire({ icon: "error", title: "Capture failed", text: err.message || "Unable to capture image." });
  } finally {
    captureBtn.disabled = false;
  }
});
retakeBtn.addEventListener("click", retakePhoto);
usePhotoBtn.addEventListener("click", useCapturedPhoto);
document.getElementById("cameraModal").addEventListener("hidden.bs.modal", () => {
  stopCamera();
  resetCameraModalUI();
});

refreshPhotoActionLabel();
