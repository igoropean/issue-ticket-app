async function submitTicket() {
  const user = JSON.parse(localStorage.getItem("session"));

  if (!user) {
    Swal.fire("Not logged in", "Please log in first.", "warning");
    return;
  }

  const storeCode = document.getElementById("storeCode").value.trim();
  const issueDesc = document.getElementById("issueDesc").value.trim();
  const priority = document.getElementById("priority").value;

  if (!storeCode || !issueDesc) {
    Swal.fire("Missing fields", "Please fill in Store Code and Issue Description.", "warning");
    return;
  }

  const payload = {
    action: "submitTicket",
    record_id: Date.now() + "_" + Math.random().toString(36).slice(2),
    timestamp: new Date().toLocaleString(),
    username: user.username,
    ticket_number: `${user.id_prefix || "TCK"}${Date.now()}`,
    store_code: storeCode,
    issue_description: issueDesc,
    priority: priority,
    image: capturedImage
  };

  if (!capturedImage) {
    Swal.fire("No photo", "Please capture at least one photo before submitting.", "warning");
    return;
  }

  Swal.fire({
    title: "Creating ticket…",
    text: navigator.onLine ? "Uploading to server" : "Saving offline",
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    Swal.close();

    if (data.ok) {
      Swal.fire({
        icon: "success",
        title: "Ticket created",
        text: data.message || "The ticket was saved successfully."
      });
      clearForm();
      await updatePending();
    } else {
      saveOffline(payload);
      Swal.fire("Saved offline", data.message || "Server rejected the request, so it was queued locally.", "info");
      clearForm();
      await updatePending();
    }
  } catch (err) {
    Swal.close();
    saveOffline(payload);
    Swal.fire("Saved offline", "The request failed and was queued locally.", "info");
    clearForm();
    await updatePending();
  }
}

function clearForm() {
  document.getElementById("storeCode").value = "";
  document.getElementById("issueDesc").value = "";
  document.getElementById("priority").value = "Priority 2";
  capturedImage = "";
  document.getElementById("photoPreview").innerHTML = "";
  refreshPhotoButtonLabel();
}
