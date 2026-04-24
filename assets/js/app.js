let deferredPrompt = null;

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}

window.addEventListener("load", async () => {
  document.getElementById("netStatus").innerText = navigator.onLine ? "Online" : "Offline";

  if (localStorage.getItem("session")) {
    showApp();
    refreshPhotoButtonLabel();
  }

  await updatePending();

  window.addEventListener("online", () => {
    document.getElementById("netStatus").innerText = "Online";
    syncPending();
    updatePending();
  });

  window.addEventListener("offline", () => {
    document.getElementById("netStatus").innerText = "Offline";
  });

  const installBanner = document.getElementById("installBanner");
  const installBtn = document.getElementById("installBtn");
  const installBannerText = document.getElementById("installBannerText");

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;

  if (!isStandalone) {
    installBanner.classList.remove("d-none");

    if (isIOS) {
      installBannerText.innerText = "On iPhone/iPad: tap Share, then choose Add to Home Screen.";
      installBtn.classList.add("d-none");
    } else {
      installBannerText.innerText = "Install this app for a faster full-screen experience.";
      installBtn.classList.remove("d-none");
    }
  }

  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferredPrompt = e;
    installBanner.classList.remove("d-none");
    installBannerText.innerText = "Install this app for a faster full-screen experience.";
    installBtn.classList.remove("d-none");
  });

  installBtn?.addEventListener("click", async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      installBanner.classList.add("d-none");
    }
  });
});

function refreshPhotoButtonLabel() {
  const btn = document.getElementById("addPhotoBtn");
  if (!btn) return;

  btn.textContent = capturedImage ? "Retake Photo" : "Add Photo";
}
