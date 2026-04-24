let isSyncing = false;

async function syncPending() {
  if (!navigator.onLine || isSyncing || !db) return;

  isSyncing = true;

  try {
    const rows = await new Promise(resolve => {
      getAllPending(resolve);
    });

    if (!rows.length) {
      await updatePending();
      return;
    }

    for (const row of rows) {
      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json;charset=utf-8" },
          body: JSON.stringify(row)
        });

        const data = await res.json();

        if (data.ok) {
          await deletePending(row.record_id);
        } else {
          break;
        }
      } catch (err) {
        break;
      }
    }

    await updatePending();
  } finally {
    isSyncing = false;
    await updatePending();
  }
}

window.addEventListener("online", () => {
  document.getElementById("netStatus").innerText = "Online";
  syncPending();
  updatePending();
});

window.addEventListener("offline", () => {
  document.getElementById("netStatus").innerText = "Offline";
});
