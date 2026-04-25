let isSyncing = false;

async function syncPending() {
  if (!navigator.onLine || isSyncing) {
    await updatePending();
    return;
  }

  isSyncing = true;

  try {
    const rows = await idbGetAll();
    if (!rows.length) {
      await updatePending();
      return;
    }

    rows.sort((a, b) => String(a.queued_at || "").localeCompare(String(b.queued_at || "")));

    for (const row of rows) {
      try {
        await sendDirect(row);
        await idbDelete(row.record_id);
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
  updatePending();
  syncPending();
});

window.addEventListener("offline", () => {
  updatePending();
});
