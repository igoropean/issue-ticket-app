let currentUser = null;

function setBusy(isBusy) {
  const loginBtn = document.getElementById("loginBtn");
  const submitBtn = document.getElementById("submitBtn");
  const addPhotoBtn = document.getElementById("addPhotoBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (loginBtn) loginBtn.disabled = isBusy;
  if (submitBtn) submitBtn.disabled = isBusy;
  if (addPhotoBtn) addPhotoBtn.disabled = isBusy;
  if (logoutBtn) logoutBtn.disabled = isBusy;
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
    title: "Logging in…",
    text: "Please wait while we verify your account.",
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const result = await Bridge.submit({
      action: "login",
      username,
      password
    }, { timeout: 25000 });

    Swal.close();

    if (!result.ok) {
      Swal.fire("Login failed", result.message || "Invalid username or password.", "error");
      return;
    }

    currentUser = result.user;
    localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
    showApp();
    refreshPhotoActionLabel();
    await updatePending();
    syncPending();

    Swal.fire({
      icon: "success",
      title: "Logged in",
      text: `Welcome, ${currentUser.username}`
    });
  } catch (err) {
    Swal.close();
    Swal.fire("Login error", err.message || "Unable to log in.", "error");
  } finally {
    setBusy(false);
  }
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  currentUser = null;
  photos = [];
  renderPhotos();
  showLogin();
  updatePending();
}

function showApp() {
  document.getElementById("loginView").classList.add("d-none");
  document.getElementById("appView").classList.remove("d-none");
  document.getElementById("logoutBtn").classList.remove("d-none");

  const userLine = document.getElementById("userLine");
  if (userLine && currentUser) {
    userLine.textContent = `Signed in as ${currentUser.username} · Role: ${currentUser.role || "—"} · Prefix: ${currentUser.id_prefix || "—"}`;
  }
}

function showLogin() {
  document.getElementById("loginView").classList.remove("d-none");
  document.getElementById("appView").classList.add("d-none");
  document.getElementById("logoutBtn").classList.add("d-none");
}
