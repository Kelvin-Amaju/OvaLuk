(function (w, d) {
  var script = d.currentScript,
    api = (script.dataset.api || "").replace(/\/$/, ""),
    key = script.dataset.key;
  if (!api || !key) return;
  var storageKey = "OvaLuk_visitor",
    visitor = localStorage.getItem(storageKey);
  if (!visitor) {
    visitor = crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2);
    localStorage.setItem(storageKey, visitor);
  }
  var session = sessionStorage.getItem("OvaLuk_session");
  if (!session) {
    session = Date.now().toString(36) + Math.random().toString(36).slice(2);
    sessionStorage.setItem("OvaLuk_session", session);
  }
  function track(event, properties) {
    fetch(api + "/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-App-Key": key },
      keepalive: true,
      body: JSON.stringify({
        event: event,
        visitor_id: visitor,
        session_id: session,
        user_id: w.OvaLukUserId || null,
        page_url: location.href,
        referrer: d.referrer || null,
        properties: properties || {},
      }),
    }).catch(function () {});
  }
  w.OvaLuk = {
    track: track,
    identify: function (id) {
      w.OvaLukUserId = String(id);
      track("user_identified");
    },
  };
  track("page_view", { title: d.title });
})(window, document);
