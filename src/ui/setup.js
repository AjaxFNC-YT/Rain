const KEY_PAGES = {
  anthropic: "console.anthropic.com",
  openai: "platform.openai.com",
  gemini: "aistudio.google.com"
};

const SETUP_PRESETS = [
  { id: "tutor", title: "Tutor", note: "Explains and hints in the chat. Never touches the page.", patch: { autoFill: false, autoSubmit: false, replyStyle: "explain" } },
  { id: "helper", title: "Helper", note: "Explains, then enters the answer for you to check and submit.", patch: { autoFill: true, autoSubmit: false, replyStyle: "explain" } },
  { id: "autopilot", title: "Autopilot", note: "Enters the answer, submits and moves on. No explanations.", patch: { autoFill: true, autoSubmit: true, replyStyle: "quiet" } }
];

function createSetup(app) {
  const steps = ["welcome", "connect", "style", "look", "keys"];
  let step = 0;
  let tested = null;

  const body = h("div", { class: "r-setup-body" });
  const progress = h("div", { class: "r-setup-progress", "aria-hidden": "true" }, h("i"));
  const back = h("button", { class: "r-small-btn", type: "button", text: "Back", onclick: () => go(step - 1) });
  const next = h("button", { class: "r-setup-next", type: "button", onclick: () => advance() });
  const counter = h("span", { class: "r-setup-count" });
  const el = h("section", { class: "r-view r-view-setup", "data-active": "false", "aria-label": "Setup" },
    progress,
    h("div", { class: "r-scroll r-setup-scroll" }, body),
    h("footer", { class: "r-setup-foot" }, back, counter, next));

  function save(patch) {
    const settings = Settings.save(patch);
    app.settingsChanged(settings);
    return settings;
  }

  function saveProvider(patch) {
    const settings = Settings.load();
    return save({ providers: { ...settings.providers, [settings.provider]: { ...settings.providers[settings.provider], ...patch } } });
  }

  function choice(name, options, current, onpick) {
    return h("div", { class: "r-choices", role: "radiogroup", "aria-label": name }, options.map(option => h("button", {
      class: "r-choice",
      type: "button",
      role: "radio",
      "aria-checked": String(option.id === current),
      onclick: () => {
        Sounds.play("tick");
        onpick(option.id);
      }
    }, h("span", { class: "r-choice-dot" }), h("span", { class: "r-choice-text" }, h("b", { text: option.title }), h("small", { text: option.note })))));
  }

  const pages = {
    welcome() {
      const fact = (label, value) => h("div", { class: "r-row r-setup-fact" }, h("span", { text: label }), h("b", {}, value));
      return [
        h("h2", { text: "Let's set up Rain" }),
        h("p", { text: "It reads the question you're on and helps with it, or answers it for you. Five quick steps." }),
        UI.section(null, "Everything here can be changed later in Settings.",
          fact("Works on", CONFIG.sites.map(site => site.label).join(", ")),
          fact("You need", "An API key from Claude, OpenAI or Gemini"),
          fact("Your key", "Stays in this browser"))
      ];
    },

    connect() {
      const settings = Settings.load();
      const provider = Settings.provider(settings);
      const own = settings.providers[provider.id];
      const result = h("p", { class: "r-setup-result", "data-tone": tested?.ok ? "ok" : tested ? "error" : "", text: tested?.text || "" });
      const key = UI.field({
        class: "r-field r-field-mono",
        type: "password",
        value: own.apiKey,
        placeholder: provider.spec.keyHint,
        "aria-label": "API key",
        oninput: e => {
          saveProvider({ apiKey: e.target.value });
          tested = null;
          result.textContent = "";
          refreshNext();
        }
      });
      const models = provider.spec.models;
      const test = h("button", { class: "r-row r-row-action", type: "button", text: "Test connection", onclick: async () => {
        test.disabled = true;
        result.dataset.tone = "";
        result.textContent = "Testing…";
        tested = await app.checkConnection();
        result.dataset.tone = tested.ok ? "ok" : "error";
        result.textContent = tested.text;
        test.disabled = false;
      } });
      return [
        h("h2", { text: "Connect a model" }),
        h("p", { text: `Paste a key from ${KEY_PAGES[provider.id] || "your provider"}.` }),
        UI.section(null, null,
          h("div", { class: "r-row" }, UI.segmented("Provider", CONFIG.providers.map(spec => [spec.id, spec.id === "openai" ? "OpenAI" : spec.label]), provider.id, id => {
            save({ provider: id });
            tested = null;
            go(step);
          }, true)),
          UI.stack("API key", key),
          models.length
            ? UI.stack("Model", UI.segmented("Model", models.map(model => [model.id, model.label.replace(/^Claude /, "")]), provider.model, model => saveProvider({ model }), true), "Haiku is quick and cheap. Sonnet and Opus think harder on tough questions.")
            : UI.stack("Model", UI.field({ class: "r-field r-field-mono", value: own.model, placeholder: provider.spec.model, oninput: e => saveProvider({ model: e.target.value }) })),
          test),
        result
      ];
    },

    style() {
      const settings = Settings.load();
      const current = SETUP_PRESETS.find(preset => Object.entries(preset.patch).every(([key, value]) => settings[key] === value))?.id;
      return [
        h("h2", { text: "How should it help?" }),
        h("p", { text: "Pick a starting point. Each part can be changed on its own later." }),
        choice("Style", SETUP_PRESETS, current, id => {
          save(SETUP_PRESETS.find(preset => preset.id === id).patch);
          go(step);
        }),
        settings.autoFill && UI.section("Wrong answers on purpose", null,
          h("div", { class: "r-row" }, UI.segmented("Accuracy", ACCURACY_MODES, settings.accuracyMode, accuracyMode => save({ accuracyMode }), true)))
      ];
    },

    look() {
      const settings = Settings.load();
      const swatches = CONFIG.ui.accents.map(accent => h("button", {
        class: "r-swatch",
        type: "button",
        role: "radio",
        "aria-label": accent.id,
        "aria-checked": String(settings.accent === accent.id),
        style: `--c:${app.scheme() === "dark" ? accent.dark : accent.light}`,
        onclick: e => {
          swatches.forEach(swatch => swatch.setAttribute("aria-checked", String(swatch === e.currentTarget)));
          Sounds.play("tick");
          save({ accent: accent.id });
        }
      }));
      const look = settings.look;
      return [
        h("h2", { text: "Make it yours" }),
        h("p", { text: "Changes show right away." }),
        UI.section(null, null,
          h("div", { class: "r-row" }, UI.segmented("Theme", [["light", "Light"], ["dark", "Dark"], ["system", "Match system"]], settings.theme, theme => save({ theme }), true)),
          UI.stack("Accent", h("div", { class: "r-swatches", role: "radiogroup", "aria-label": "Accent" }, swatches)),
          UI.line("Panel size", UI.segmented("Panel size", [["compact", "S"], ["regular", "M"], ["large", "L"]], look.size, size => save({ look: { ...Settings.load().look, size } }))),
          UI.row("Sounds", UI.switch("Sounds", settings.sounds, value => save({ sounds: value }))))
      ];
    },

    keys() {
      const settings = Settings.load();
      const row = (combo, text) => combo ? [h("dt", {}, Keys.parts(combo).map(part => h("kbd", { text: part }))), h("dd", { text })] : [];
      return [
        h("h2", { text: "Shortcuts and panic" }),
        h("p", { text: "These work anywhere on the page, even while Rain is hidden." }),
        h("dl", { class: "r-keys r-setup-keys" },
          row(settings.keys.toggle, "show or hide Rain"),
          row(settings.keys.answer, "answer this question"),
          row(settings.keys.auto, "Auto Answer on or off"),
          row(settings.keys.panic, "panic")),
        UI.section("When you press panic", null,
          h("div", { class: "r-row" }, UI.segmented("Panic action", [["hide", "Hide"], ["unload", "Unload"], ["leave", "Leave page"]], settings.panicAction, panicAction => save({ panicAction }), true)),
          UI.row("Stealth mode", UI.switch("Stealth mode", settings.stealth, value => save({ stealth: value })), "No pill, no launcher, starts hidden"))
      ];
    }
  };

  function refreshNext() {
    const last = step === steps.length - 1;
    next.textContent = step === 0 ? "Get started" : last ? "Start using Rain" : "Continue";
    next.disabled = steps[step] === "connect" && !Settings.ready();
  }

  function go(index) {
    const forward = index >= step;
    step = Math.max(0, Math.min(steps.length - 1, index));
    body.dataset.dir = forward ? "next" : "back";
    body.replaceChildren(h("div", { class: "r-setup-page" }, pages[steps[step]]()));
    back.hidden = step === 0;
    counter.textContent = `${step + 1} of ${steps.length}`;
    progress.style.setProperty("--p", String((step + 1) / steps.length));
    refreshNext();
  }

  function advance() {
    if (step < steps.length - 1) {
      Sounds.play("tick");
      go(step + 1);
      return;
    }
    Store.set("setup", true);
    Sounds.play("success");
    app.finishSetup();
  }

  return {
    el,
    open() {
      tested = null;
      go(0);
    }
  };
}
