(() => {
  const existing = window.__rain;
  if (existing && document.getElementById(HOST_ID)) {
    if (existing.version === CONFIG.version) {
      existing.show();
      return;
    }
    existing.remove();
  }
  const start = () => { window.__rain = createApp(); };
  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start, { once: true });
})();
