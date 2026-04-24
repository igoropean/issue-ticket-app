const Bridge = (() => {
  const pending = new Map();
  let listenerInstalled = false;

  function installListener() {
    if (listenerInstalled) return;
    listenerInstalled = true;

    window.addEventListener("message", event => {
      const data = event.data;
      if (!data || data.source !== "issue_ticket_app_bridge") return;

      const requestId = data.request_id;
      if (!requestId || !pending.has(requestId)) return;

      const entry = pending.get(requestId);
      pending.delete(requestId);
      entry.cleanup();
      entry.resolve(data);
    });
  }

  function submit(payload, { timeout = 30000 } = {}) {
    installListener();

    return new Promise((resolve, reject) => {
      const requestId = payload.request_id || (crypto.randomUUID ? crypto.randomUUID() : `req_${Date.now()}_${Math.random().toString(16).slice(2)}`);
      payload.request_id = requestId;

      const iframeName = `gs_bridge_${requestId.replace(/[^a-zA-Z0-9_]/g, "")}`;
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
      input.name = "payload_json";
      input.value = JSON.stringify(payload);
      form.appendChild(input);

      let timer = null;

      const cleanup = () => {
        if (timer) clearTimeout(timer);
        window.removeEventListener("beforeunload", unloadHandler);
        if (form.parentNode) form.parentNode.removeChild(form);
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      };

      const unloadHandler = () => cleanup();

      timer = setTimeout(() => {
        pending.delete(requestId);
        cleanup();
        reject(new Error("Request timed out."));
      }, timeout);

      pending.set(requestId, { resolve, reject, cleanup });

      document.body.appendChild(iframe);
      document.body.appendChild(form);

      window.addEventListener("beforeunload", unloadHandler, { once: true });

      try {
        form.submit();
      } catch (err) {
        pending.delete(requestId);
        cleanup();
        reject(err);
      }
    });
  }

  return { submit };
})();
