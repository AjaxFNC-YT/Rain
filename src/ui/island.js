const ISLAND_TIMES = { short: 2200, normal: 3400, long: 5600 };

function createIsland(root) {
  const glyph = h("span", { class: "r-island-glyph" });
  const text = h("span", { class: "r-island-text" });
  const action = h("button", { class: "r-island-action", type: "button", hidden: true });
  const bar = h("span", { class: "r-island-bar", hidden: true });
  const inner = h("div", { class: "r-island-inner" }, glyph, text, action);
  const el = h("div", { class: "r-island", role: "status", "aria-live": "polite", "data-show": "false", "data-busy": "false" },
    h("span", { class: "r-island-rim", "aria-hidden": "true" }), inner, bar);
  root.append(el);

  let timer = null;
  let onClick = null;
  let state = { key: "", glyph: "", busy: false };
  let lastIdle = "";

  const prefs = () => {
    const settings = Settings.load();
    return { ...CONFIG.defaults.island, ...settings.island, enabled: settings.island.enabled && !settings.stealth };
  };

  const orb = () => h("span", { class: "r-orb" }, h("i"), h("i"), h("i"));
  const drop = () => {
    const svg = icon("drop");
    svg.setAttribute("class", "r-island-drop");
    return [svg, h("span", { class: "r-island-ripple" })];
  };

  const glyphs = {
    busy: () => el.dataset.style === "siri" ? orb() : rainfall(),
    ok: () => icon("check"),
    error: () => icon("warn"),
    drop: () => el.dataset.style === "siri" ? orb() : drop(),
    dot: () => h("span", { class: "r-island-dot" })
  };

  function apply(options = prefs()) {
    el.dataset.style = options.style;
    el.dataset.place = options.position;
  }

  function measure() {
    el.style.width = "auto";
    const natural = Math.ceil(inner.scrollWidth) + 2;
    const limit = Math.min(480, innerWidth - 24);
    return Math.min(natural, limit);
  }

  function resize() {
    const from = el.dataset.show === "true" ? el.getBoundingClientRect().width : 44;
    const to = measure();
    el.style.width = `${from}px`;
    void el.offsetWidth;
    el.style.width = `${to}px`;
  }

  function setBusy(value) {
    state.busy = value;
    el.dataset.busy = String(value);
  }

  function hide() {
    clearTimeout(timer);
    el.dataset.show = "false";
    onClick = null;
    state = { key: "", glyph: "", busy: false };
    el.dataset.busy = "false";
  }

  function show(message, { busy = false, countdown = 0, action: act = null, tone = null, glyph: kind = null, click = null, duration, idle = false, important = false } = {}) {
    const options = prefs();
    apply(options);
    const key = typeof message === "string" ? message : [].concat(message).map(part => part.textContent ?? part).join("");
    if (!options.enabled && !act && tone !== "error") return;
    if (options.detail === "important" && !important && !act && !countdown && !tone && !click) return;
    if (idle) {
      if (key === lastIdle) return;
      lastIdle = key;
    } else {
      lastIdle = "";
    }
    if (!countdown && !act && key === state.key && el.dataset.show === "true") {
      if (!busy) {
        clearTimeout(timer);
        timer = setTimeout(hide, duration ?? ISLAND_TIMES[options.duration]);
      }
      return;
    }

    clearTimeout(timer);
    const glyphKind = kind || (busy || countdown ? "busy" : tone || "dot");
    if (glyphKind !== state.glyph) glyph.replaceChildren(...[].concat(glyphs[glyphKind]()));
    state = { key, glyph: glyphKind, busy: false };
    setBusy(busy || Boolean(countdown));

    el.dataset.tone = tone || "";
    el.title = key;
    text.replaceChildren(...[].concat(message));
    text.style.animation = "none";
    void text.offsetWidth;
    text.style.animation = "";
    action.hidden = !act;
    if (act) {
      action.textContent = act.label;
      action.onclick = e => {
        e.stopPropagation();
        hide();
        act.run();
      };
    }
    bar.hidden = !countdown;
    if (countdown) {
      bar.style.animation = "none";
      void bar.offsetWidth;
      bar.style.animation = `r-drain ${countdown}ms linear forwards`;
    }
    resize();
    el.dataset.show = "true";

    onClick = click;
    el.dataset.click = String(Boolean(click));
    if (!busy && !countdown) timer = setTimeout(hide, duration ?? (act || click ? ISLAND_TIMES.long + 1500 : ISLAND_TIMES[options.duration]));
  }

  function boot(message, options) {
    const settings = prefs();
    apply(settings);
    if (!settings.enabled && !options?.action) return;
    clearTimeout(timer);
    el.style.width = "44px";
    el.dataset.tone = "";
    state = { key: "", glyph: "drop", busy: false };
    setBusy(true);
    glyph.replaceChildren(...[].concat(glyphs.drop()));
    text.replaceChildren();
    action.hidden = true;
    bar.hidden = true;
    el.dataset.show = "true";
    timer = setTimeout(() => show(message, { glyph: "drop", important: true, ...options }), 820);
  }

  function settle() {
    if (!state.busy) return;
    setBusy(false);
    clearTimeout(timer);
    timer = setTimeout(hide, 1400);
  }

  el.addEventListener("click", () => {
    if (!onClick) return;
    const run = onClick;
    hide();
    run();
  });

  apply();
  return { el, show, hide, boot, settle, apply };
}
