async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    Swal.fire("Missing fields", "Please enter username and password.", "warning");
    return;
  }

  Swal.fire({
    title: "Logging in…",
    text: "Please wait while we verify your account.",
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: JSON.stringify({
        action: "login",
        username,
        password
      })
    });

    const data = await res.json();
    Swal.close();

    if (!data.ok) {
      Swal.fire("Login failed", data.message || "Invalid username or password.", "error");
      return;
    }

    localStorage.setItem("session", JSON.stringify(data.user));
    showApp();
    await updatePending();
    syncPending();

    Swal.fire({
      icon: "success",
      title: "Logged in",
      text: `Welcome, ${data.user.username}`
    });
  } catch (err) {
    Swal.close();
    Swal.fire("Login error", err.message || "Unable to log in.", "error");
  }
}

function logout() {
  localStorage.removeItem("session");
  location.reload();
}

function showApp() {
  const user = JSON.parse(localStorage.getItem("session"));

  document.getElementById("loginCard").classList.add("d-none");
  document.getElementById("appCard").classList.remove("d-none");
  document.getElementById("whoami").innerText = user.username;
}
