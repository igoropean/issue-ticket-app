let isSyncing = false;

async function syncPending() {
  if (!navigator.onLine || isSyncing) {
    await updatePending();
    return;
  }

  isSyncing = true;
  const syncLabel = document.getElementById("syncLabel");
  const syncBadge = document.getElementById("syncBadge");
  const onlineDot = document.getElementById("onlineDot");

  try {
    if (syncLabel) syncLabel.textContent = "Syncing pending records…";
    if (syncBadge) {
      syncBadge.className = "badge rounded-pill text-bg-primary";
      syncBadge.textContent = "Syncing";
    }
    if (onlineDot) onlineDot.className = "status-dot syncing";

    const rows = await idbGetAll();
    if (!rows.length) {
      await updatePending();
      return;
    }

    rows.sort((a, b) => String(a.queued_at || "").localeCompare(String(b.queued_at || "")));

    for (const row of rows) {
      try {
        const result = await Bridge.submit(row, { timeout: 45000 });
        if (result.ok) {
          await idbDelete(row.record_id);
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

    const count = await idbCount();
    if (syncLabel) syncLabel.textContent = count === 0 ? "All synced" : "Pending records waiting to sync";
    if (syncBadge) {
      syncBadge.className = count === 0 ? "badge rounded-pill text-bg-success" : "badge rounded-pill text-bg-warning";
      syncBadge.textContent = count === 0 ? "All synced" : "Pending";
    }
    if (onlineDot) onlineDot.className = navigator.onLine ? "status-dot online" : "status-dot offline";
  }
}

window.addEventListener("online", () => {
  const connectionLabel = document.getElementById("connectionLabel");
  const connectionBadge = document.getElementById("connectionBadge");
  const onlineDot = document.getElementById("onlineDot");

  if (connectionLabel) connectionLabel.textContent = "Online";
  if (connectionBadge) {
    connectionBadge.className = "badge rounded-pill text-bg-success";
    connectionBadge.textContent = "Online";
  }
  if (onlineDot) onlineDot.className = "status-dot online";

  syncPending();
  updatePending();
});

window.addEventListener("offline", () => {
  const connectionLabel = document.getElementById("connectionLabel");
  const connectionBadge = document.getElementById("connectionBadge");
  const onlineDot = document.getElementById("onlineDot");

  if (connectionLabel) connectionLabel.textContent = "Offline";
  if (connectionBadge) {
    connectionBadge.className = "badge rounded-pill text-bg-danger";
    connectionBadge.textContent = "Offline";
  }
  if (onlineDot) onlineDot.className = "status-dot offline";
});
