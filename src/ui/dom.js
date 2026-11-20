const HOST_ID = "rain-host";
const SVG_NS = "http://www.w3.org/2000/svg";

const ICONS = {
  drop: "M12 3.5C8.8 7.6 6.5 10.7 6.5 14.2a5.5 5.5 0 0 0 11 0c0-3.5-2.3-6.6-5.5-10.7z",
  chats: "M4.5 6.5h15M4.5 12h15M4.5 17.5h9",
  plus: "M12 5.5v13M5.5 12h13",
  gear: "M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33a1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  hide: "M6 12h12",
  copy: "M8.5 8.5V6A1.5 1.5 0 0 1 10 4.5h8A1.5 1.5 0 0 1 19.5 6v8a1.5 1.5 0 0 1-1.5 1.5h-2.5M6 8.5h8A1.5 1.5 0 0 1 15.5 10v8a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18v-8A1.5 1.5 0 0 1 6 8.5z",
  check: "M5.5 12.5l4 4l9-9.5",
  xmark: "M7 7l10 10M17 7L7 17",
  warn: "M12 4.5L3 19.5h18zM12 10v4.5M12 17v.01",
  scope: "M12 5a7 7 0 1 0 0 14a7 7 0 1 0 0-14M12 10a2 2 0 1 0 0 4a2 2 0 1 0 0-4M12 2v3M12 19v3M2 12h3M19 12h3",
  arrowUp: "M12 18.5V6M7 11l5-5l5 5",
  stop: "M8.5 8.5h7v7h-7z",
  eye: "M2.5 12S6 5.5 12 5.5S21.5 12 21.5 12S18 18.5 12 18.5S2.5 12 2.5 12zM12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6",
  eyeOff: "M3 3l18 18M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.4M6.3 6.9A16.6 16.6 0 0 0 2.5 12s3.5 6.5 9.5 6.5a9 9 0 0 0 4.4-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2",
  lock: "M7.5 10.5V8a4.5 4.5 0 0 1 9 0v2.5M6 10.5h12v9H6z",
  search: "M10.5 4.5a6 6 0 1 0 0 12a6 6 0 1 0 0-12M19.5 19.5l-4.6-4.6",
  trash: "M5 7h14M10 7V5h4v2M7 7l.9 12h8.2L17 7",
  back: "M14.5 5.5L8 12l6.5 6.5",
  refresh: "M18.5 12a6.5 6.5 0 1 1-1.9-4.6M18.5 5v3.5H15",
  play: "M8.5 6.5l9 5.5l-9 5.5z"
};

function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === "class") el.className = value;
    else if (key === "text") el.textContent = value;
    else if (key === "value") el.value = value;
    else if (key === "style" && typeof value === "object") Object.assign(el.style, value);
    else if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? "" : value);
  }

  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : String(child));
  }
  return el;
}

function icon(name) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.dataset.icon = name;

  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", ICONS[name]);
  svg.append(path);
  return svg;
}

function rainfall(count = 3) {
  return h("span", { class: "r-rainfall", "aria-hidden": "true" }, Array.from({ length: count }, () => h("i")));
}

function applyStyles(shadow, css) {
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    shadow.adoptedStyleSheets = [sheet];
  } catch {
    shadow.append(h("style", { text: css }));
  }
}

function timeLabel(at) {
  return new Date(at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function ago(at) {
  const minutes = Math.round((Date.now() - at) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days < 7 ? `${days}d ago` : new Date(at).toLocaleDateString([], { month: "short", day: "numeric" });
}
