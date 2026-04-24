let currentUser = null;

function setBusy(isBusy) {
  const ids = ["loginBtn", "submitBtn", "addPhotoBtn", "logoutBtn"];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = isBusy;
  });
}

/**
 * JSONP login transport for Apps Script doGet()
 */
function appsScriptLogin(username, password) {
  return new Promise((resolve, reject) => {
    const callbackName =
      "loginCb_" + Date.now() + "_" + Math.random().toString(36).slice(2);

    const script = document.createElement("script");

    const cleanup = () => {
      try { delete window[callbackName]; } catch (_) {}
      if (script.parentNode) script.parentNode.removeChild(script);
    };

    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Unable to reach server."));
    };

    const url = new URL(API_URL);
    url.searchParams.set("action", "login");
    url.searchParams.set("username", username);
    url.searchParams.set("password", password);
    url.searchParams.set("callback", callbackName);

    script.src = url.toString();
    document.body.appendChild(script);
  });
}

async function login(event) {
  event.preventDefault();

  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!username || !password) {
    Swal.fire("Missing fields", "Please enter username and password.", "warning");
    return;
  }

  setBusy(true);

  Swal.fire({
    title: "Logging in...",
    text: "Please wait while we verify your account.",
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const result = await appsScriptLogin(username, password);

    Swal.close();

    if (!result || !result.ok) {
      Swal.fire(
        "Login Failed",
        (result && result.message) || "Invalid username or password.",
        "error"
      );
      return;
    }

    currentUser = result.user || null;

    localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));

    showApp();

    if (typeof refreshPhotoActionLabel === "function") {
      refreshPhotoActionLabel();
    }

    if (typeof updatePending === "function") {
      await updatePending();
    }

    if (typeof syncPending === "function") {
      syncPending();
    }

    Swal.fire({
      icon: "success",
      title: "Welcome",
      text: currentUser.username
    });

  } catch (err) {
    Swal.close();
    Swal.fire("Login Error", err.message || "Unable to login.", "error");
  } finally {
    setBusy(false);
  }
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  currentUser = null;

  if (typeof photos !== "undefined") photos = [];
  if (typeof renderPhotos === "function") renderPhotos();

  showLogin();

  if (typeof updatePending === "function") updatePending();
}

function showApp() {
  document.getElementById("loginView").classList.add("d-none");
  document.getElementById("appView").classList.remove("d-none");

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.classList.remove("d-none");

  const userLine = document.getElementById("userLine");

  if (userLine && currentUser) {
    userLine.textContent =
      `Signed in as ${currentUser.username} · ` +
      `Role: ${currentUser.role || "-"} · ` +
      `Prefix: ${currentUser.id_prefix || "-"}`;
  }
}

function showLogin() {
  document.getElementById("loginView").classList.remove("d-none");
  document.getElementById("appView").classList.add("d-none");

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.classList.add("d-none");
}
