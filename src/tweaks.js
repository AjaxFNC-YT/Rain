const DARK_PROPS = ["background-color", "color", "border-top-color", "border-right-color", "border-bottom-color", "border-left-color", "outline-color"];
const DARK_SKIP = new Set(["IMG", "VIDEO", "PICTURE", "CANVAS", "IFRAME", "EMBED", "OBJECT", "SCRIPT", "STYLE", "LINK", "META", "HEAD", "TITLE", "BR", "SOURCE", "TRACK"]);

function parseColor(value) {
  const match = /rgba?\(([^)]+)\)/.exec(value || "");
  if (!match) return null;
  const [r, g, b, a = 1] = match[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  return a === 0 ? null : { r, g, b, a };
}

function toHsl({ r, g, b }) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > .5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: h * 60, s, l };
}

function hslString({ h, s, l }, a) {
  return `hsla(${h.toFixed(1)}, ${(s * 100).toFixed(1)}%, ${(l * 100).toFixed(1)}%, ${a})`;
}

const DarkMode = {
  active: false,
  touched: new Map(),
  observer: null,
  queue: new Set(),
  frame: 0,

  base: `
    html { background-color: #17181b !important; color-scheme: dark !important; }
    ::-webkit-scrollbar { background: #1d1f23; }
    ::-webkit-scrollbar-thumb { background: #3a3d44; border-radius: 6px; }
    img, video, picture, canvas, iframe { color-scheme: normal; }
  `,

  map(prop, value) {
    const color = parseColor(value);
    if (!color) return null;
    const hsl = toHsl(color);
    if (prop === "background-color") {
      if (hsl.l <= .42) return null;
      return hslString({ h: hsl.h, s: hsl.s * .55, l: .09 + (1 - hsl.l) * .32 }, color.a);
    }
    if (prop === "color") {
      if (hsl.l >= .58) return null;
      return hslString({ h: hsl.h, s: Math.min(1, hsl.s * .9), l: Math.max(.72, .93 - hsl.l * .45) }, color.a);
    }
    if (hsl.l <= .45) return null;
    return hslString({ h: hsl.h, s: hsl.s * .5, l: .2 + (1 - hsl.l) * .2 }, color.a);
  },

  paint(el) {
    if (el.nodeType !== Node.ELEMENT_NODE || DARK_SKIP.has(el.tagName) || el.id === HOST_ID || el.closest(`#${HOST_ID}`) || el.closest("svg")) return;
    const previous = this.touched.get(el);
    if (previous) this.restore(el, previous);
    const style = getComputedStyle(el);
    const saved = [];
    for (const prop of DARK_PROPS) {
      if (prop.startsWith("border") && !parseFloat(style.getPropertyValue(prop.replace("color", "width")))) continue;
      if (prop === "outline-color" && style.outlineStyle === "none") continue;
      const next = this.map(prop, style.getPropertyValue(prop));
      if (!next) continue;
      saved.push([prop, el.style.getPropertyValue(prop), el.style.getPropertyPriority(prop)]);
      el.style.setProperty(prop, next, "important");
    }
    if (style.backgroundImage.includes("gradient") && !style.backgroundImage.includes("url(")) {
      const stops = style.backgroundImage.match(/rgba?\([^)]+\)/g) || [];
      if (stops.some(stop => (toHsl(parseColor(stop) || { r: 0, g: 0, b: 0 }).l > .6))) {
        saved.push(["background-image", el.style.getPropertyValue("background-image"), el.style.getPropertyPriority("background-image")]);
        el.style.setProperty("background-image", "none", "important");
        if (!saved.some(([prop]) => prop === "background-color")) {
          saved.push(["background-color", el.style.getPropertyValue("background-color"), el.style.getPropertyPriority("background-color")]);
          el.style.setProperty("background-color", "#1d1f23", "important");
        }
      }
    }
    if (saved.length) this.touched.set(el, saved);
    else this.touched.delete(el);
  },

  restore(el, saved) {
    for (const [prop, value, priority] of saved) {
      if (value) el.style.setProperty(prop, value, priority);
      else el.style.removeProperty(prop);
    }
  },

  walk(root) {
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    this.paint(root);
    for (const el of root.querySelectorAll("*")) this.paint(el);
  },

  schedule(node) {
    this.queue.add(node);
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      const nodes = [...this.queue];
      this.queue.clear();
      this.observer?.disconnect();
      for (const node of nodes) if (node.isConnected) this.walk(node);
      this.listen();
    });
  },

  listen() {
    this.observer?.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  },

  start() {
    if (this.active) return;
    this.active = true;
    document.documentElement.append(h("style", { id: "rain-tweak-dark", text: this.base }));
    this.observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === "attributes") this.schedule(record.target);
        else record.addedNodes.forEach(node => node.nodeType === Node.ELEMENT_NODE && this.schedule(node));
      }
    });
    this.walk(document.documentElement);
    this.listen();
  },

  stop() {
    if (!this.active) return;
    this.active = false;
    this.observer?.disconnect();
    this.observer = null;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.queue.clear();
    for (const [el, saved] of this.touched) this.restore(el, saved);
    this.touched.clear();
    document.getElementById("rain-tweak-dark")?.remove();
  }
};

const TWEAKS = [
  {
    id: "dark",
    label: "Dark mode",
    note: "Darkens light backgrounds and lightens dark text. Dark parts, photos and videos stay as they are.",
    on: () => DarkMode.start(),
    off: () => DarkMode.stop()
  }
];

const Tweaks = {
  list: TWEAKS,

  siteKey() {
    const site = Question.site();
    return site.id === "generic" ? location.hostname.replace(/^www\./, "") : site.id;
  },

  enabled(id, settings = Settings.load()) {
    return Boolean(settings.tweaks[this.siteKey()]?.[id]);
  },

  apply(settings = Settings.load()) {
    for (const tweak of TWEAKS) {
      if (this.enabled(tweak.id, settings)) tweak.on();
      else tweak.off();
    }
  },

  set(id, on) {
    const settings = Settings.load();
    const key = this.siteKey();
    const tweaks = { ...settings.tweaks, [key]: { ...settings.tweaks[key], [id]: on } };
    this.apply(Settings.save({ tweaks }));
  },

  clear() {
    for (const tweak of TWEAKS) tweak.off();
  }
};
