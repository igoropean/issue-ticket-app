let deferredPrompt = null;

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js");
}

function updateConnectionUI() {
  const connectionLabel = document.getElementById("connectionLabel");
  const connectionBadge = document.getElementById("connectionBadge");
  const onlineDot = document.getElementById("onlineDot");

  if (navigator.onLine) {
    if (connectionLabel) connectionLabel.textContent = "Online";
    if (connectionBadge) {
      connectionBadge.className = "badge rounded-pill text-bg-success";
      connectionBadge.textContent = "Online";
    }
    if (onlineDot) onlineDot.className = "status-dot online";
  } else {
    if (connectionLabel) connectionLabel.textContent = "Offline";
    if (connectionBadge) {
      connectionBadge.className = "badge rounded-pill text-bg-danger";
      connectionBadge.textContent = "Offline";
    }
    if (onlineDot) onlineDot.className = "status-dot offline";
  }
}

function setupInstallPrompt() {
  const installBanner = document.getElementById("installBanner");
  const installBannerBtn = document.getElementById("installBannerBtn");
  const installBannerText = document.getElementById("installBannerText");
  const installBtnTop = document.getElementById("installBtnTop");

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;

  if (!isStandalone) {
    installBanner.classList.remove("d-none");

    if (isIOS) {
      installBannerText.textContent = "On iPhone/iPad: tap Share, then choose Add to Home Screen.";
      installBannerBtn.classList.add("d-none");
      installBtnTop.classList.add("d-none");
    } else {
      installBannerText.textContent = "Install this app for a faster full-screen experience.";
      installBannerBtn.classList.remove("d-none");
      installBtnTop.classList.remove("d-none");
    }
  }

  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferredPrompt = e;

    installBanner.classList.remove("d-none");
    installBannerText.textContent = "Install this app for a faster full-screen experience.";
    installBannerBtn.classList.remove("d-none");
    installBtnTop.classList.remove("d-none");
  });

  async function promptInstall() {
    if (!deferredPrompt) {
      Swal.fire({
        icon: "info",
        title: "Install app",
        text: isIOS
          ? "On iPhone/iPad, tap Share and then Add to Home Screen."
          : "Your browser may show the install prompt automatically when available."
      });
      return;
    }

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBanner.classList.add("d-none");
    installBtnTop.classList.add("d-none");
  }

  installBannerBtn.addEventListener("click", promptInstall);
  installBtnTop.addEventListener("click", promptInstall);
}

window.addEventListener("load", async () => {
  updateConnectionUI();
  setupInstallPrompt();

  const saved = localStorage.getItem(SESSION_KEY);
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      showApp();
      refreshPhotoActionLabel();
      await updatePending();
      syncPending();
    } catch (err) {
      localStorage.removeItem(SESSION_KEY);
      showLogin();
    }
  } else {
    showLogin();
  }

  window.addEventListener("online", () => {
    updateConnectionUI();
    syncPending();
    updatePending();
  });

  window.addEventListener("offline", () => {
    updateConnectionUI();
    updatePending();
  });

  await updatePending();
});

document.getElementById("loginForm").addEventListener("submit", login);
document.getElementById("ticketForm").addEventListener("submit", submitTicket);
document.getElementById("logoutBtn").addEventListener("click", logout);
