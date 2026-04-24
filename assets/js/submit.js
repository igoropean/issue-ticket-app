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

function getClientTimestampDisplay(date = new Date()) {
  const d = getLocalDateParts(date);
  return `${d.year}-${d.month}-${d.day} ${d.hour}:${d.minute}`;
}

function buildRecordId(prefix = "REC") {
  const d = getLocalDateParts(new Date());
  const random = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(16).slice(2);
  return `${String(prefix || "REC").replace(/[^\w-]+/g, "_")}_${d.year}${d.month}${d.day}_${Date.now()}_${random}`;
}

function buildClientTicketNumber(prefix = "TCK") {
  const d = getLocalDateParts(new Date());
  const storageKey = `ticket_counter_${prefix}_${d.year}${d.month}${d.day}`;
  const current = Number(localStorage.getItem(storageKey) || "0") + 1;
  localStorage.setItem(storageKey, String(current));
  return `${String(prefix || "TCK").replace(/[^\w-]+/g, "_")}${d.year}${d.month}${d.day}${String(current).padStart(4, "0")}`;
}

async function queuePendingRecord(payload) {
  await idbPut({
    ...payload,
    queued_at: getClientTimestampDisplay(new Date())
  });
  await updatePending();
}

async function submitTicket(event) {
  event.preventDefault();

  if (!currentUser) {
    Swal.fire("Not logged in", "Please log in first.", "warning");
    return;
  }

  const storeCode = document.getElementById("storeCode").value.trim();
  const issueDescription = document.getElementById("issueDescription").value.trim();
  const priority = document.getElementById("priority").value;

  if (!storeCode || !issueDescription || !priority) {
    Swal.fire("Missing fields", "Please complete the required fields.", "warning");
    return;
  }

  if (!photos.length) {
    Swal.fire("No photo", "Please capture at least one photo.", "warning");
    return;
  }

  const recordId = buildRecordId(currentUser.id_prefix || "REC");
  const ticketNumber = buildClientTicketNumber(currentUser.id_prefix || "TCK");
  const timestamp = getClientTimestampDisplay(new Date());
  const clientTimestampFile = getLocalDateParts(new Date());
  const timestampFile = `${clientTimestampFile.year}-${clientTimestampFile.month}-${clientTimestampFile.day}_${clientTimestampFile.hour}-${clientTimestampFile.minute}`;

  const payload = {
    action: "submitTicket",
    record_id: recordId,
    timestamp,
    clientTimestampFile: timestampFile,
    username: currentUser.username,
    ticket_number: ticketNumber,
    store_code: storeCode,
    issue_description: issueDescription,
    priority,
    image: photos[0]?.dataUrl || "",
    images: photos.map(p => ({
      dataUrl: p.dataUrl,
      timestampFile: p.timestampFile,
      fileName: p.fileName
    })),
    id_prefix: currentUser.id_prefix || "",
    role: currentUser.role || ""
  };

  setBusy(true);
  Swal.fire({
    title: navigator.onLine ? "Creating ticket…" : "Saving offline…",
    text: navigator.onLine ? "Uploading to the server" : "No internet connection",
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    if (!navigator.onLine) {
      await queuePendingRecord(payload);
      Swal.close();
      Swal.fire("Saved offline", "The ticket will sync automatically when the connection returns.", "info");
      clearForm();
      return;
    }

    const result = await Bridge.submit(payload, { timeout: 45000 });
    Swal.close();

    if (result.ok) {
      Swal.fire({
        icon: "success",
        title: "Ticket created",
        html: `Ticket Number: <strong>${result.ticket_number || ticketNumber}</strong>`
      });
      clearForm();
      await updatePending();
      return;
    }

    await queuePendingRecord(payload);
    Swal.fire("Saved offline", result.message || "The server could not complete the request, so it was queued locally.", "info");
    clearForm();
  } catch (err) {
    Swal.close();
    try {
      await queuePendingRecord(payload);
      Swal.fire("Saved offline", "The request failed and was queued locally.", "info");
      clearForm();
    } catch (queueErr) {
      Swal.fire("Submission failed", err.message || "Unable to submit the ticket.", "error");
    }
  } finally {
    setBusy(false);
    await updatePending();
  }
}

function clearForm() {
  document.getElementById("storeCode").value = "";
  document.getElementById("issueDescription").value = "";
  document.getElementById("priority").value = "Priority 2";
  photos = [];
  renderPhotos();
  refreshPhotoActionLabel();
  document.getElementById("photoGrid").innerHTML = "";
  document.getElementById("photoEmpty").classList.remove("d-none");
}

document.getElementById("ticketForm").addEventListener("submit", submitTicket);
