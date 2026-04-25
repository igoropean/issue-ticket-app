async function submitTicket(event) {
  event.preventDefault();

  if (!currentUser) {
    Swal.fire("Session Expired", "Please login again.", "warning");
    return;
  }

  const storeCode = document.getElementById("storeCode").value.trim();
  const issueDescription = document.getElementById("issueDescription").value.trim();
  const priority = document.getElementById("priority").value;

  if (!storeCode || !issueDescription || !priority) {
    Swal.fire("Missing Fields", "Please complete all required fields.", "warning");
    return;
  }

  const recordId = generateRecordId(currentUser.id_prefix || "TK");
  const ticketNumber = generateTicketNumber(currentUser.id_prefix || "TK");
  const timestamp = getLocalTimestamp();

  const payload = {
    action: "submit",
    record_id: recordId,
    timestamp: timestamp,
    username: currentUser.username,
    ticket_number: ticketNumber,
    store_code: storeCode,
    issue_description: issueDescription,
    priority: priority,
    image: (typeof photos !== "undefined" && photos[0]) ? photos[0] : ""
  };

  setBusy(true);

  Swal.fire({
    title: "Creating Ticket...",
    text: "Please wait.",
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    if (!navigator.onLine) {
      await savePending(payload);
      Swal.close();

      Swal.fire(
        "Saved Offline",
        "Ticket saved locally and will sync automatically.",
        "info"
      );

      resetTicketForm();
      await updatePending();
      return;
    }

    await sendDirect(payload);

    Swal.close();

    Swal.fire(
      "Success",
      "Ticket created successfully.",
      "success"
    );

    resetTicketForm();
    await updatePending();

  } catch (err) {
    await savePending(payload);

    Swal.close();

    Swal.fire(
      "Saved Offline",
      "Server unreachable. Ticket saved locally and will sync later.",
      "info"
    );

    resetTicketForm();
    await updatePending();
  } finally {
    setBusy(false);
  }
}

function sendDirect(payload) {
  return new Promise((resolve, reject) => {
    const iframeName = "submitFrame_" + Date.now();
    const iframe = document.createElement("iframe");
    iframe.name = iframeName;
    iframe.style.display = "none";

    const form = document.createElement("form");
    form.method = "POST";
    form.action = API_URL;
    form.target = iframeName;
    form.style.display = "none";

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "payload";
    input.value = JSON.stringify(payload);

    form.appendChild(input);
    document.body.appendChild(iframe);
    document.body.appendChild(form);

    iframe.onload = () => {
      setTimeout(() => {
        form.remove();
        iframe.remove();
        resolve(true);
      }, 800);
    };

    iframe.onerror = () => {
      form.remove();
      iframe.remove();
      reject(new Error("Submit failed"));
    };

    form.submit();
  });
}

function resetTicketForm() {
  document.getElementById("storeCode").value = "";
  document.getElementById("issueDescription").value = "";
  document.getElementById("priority").selectedIndex = 0;

  if (typeof photos !== "undefined") photos = [];
  if (typeof renderPhotos === "function") renderPhotos();

  if (typeof refreshPhotoActionLabel === "function") {
    refreshPhotoActionLabel();
  }
}

function generateRecordId(prefix) {
  return prefix + "_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}

function generateTicketNumber(prefix) {
  const d = new Date();

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");

  return `${prefix}${yyyy}${mm}${dd}${hh}${mi}`;
}

function getLocalTimestamp() {
  const d = new Date();

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}
