const KEY_PAGES = {
  anthropic: "console.anthropic.com",
  openai: "platform.openai.com",
  gemini: "aistudio.google.com"
};

function createSetup(app) {
  const steps = ["welcome", "provider", "answering", "keys"];
  let step = 0;

  const body = h("div", { class: "r-setup-body" });
  const dots = h("div", { class: "r-setup-dots", "aria-hidden": "true" }, steps.map(() => h("i")));
  const back = h("button", { class: "r-small-btn", type: "button", text: "Back", onclick: () => go(step - 1) });
  const next = h("button", { class: "r-setup-next", type: "button", onclick: () => advance() });
  const el = h("section", { class: "r-view r-view-setup", "data-active": "false", "aria-label": "Setup" },
    h("div", { class: "r-scroll r-setup-scroll" }, body),
    h("footer", { class: "r-setup-foot" }, back, dots, next));

  function save(patch) {
    const settings = Settings.save(patch);
    app.settingsChanged(settings);
    return settings;
  }

  function saveProvider(patch) {
    const settings = Settings.load();
    return save({ providers: { ...settings.providers, [settings.provider]: { ...settings.providers[settings.provider], ...patch } } });
  }

  const pages = {
    welcome() {
      const fact = (label, value) => h("div", { class: "r-row r-setup-fact" }, h("span", { text: label }), h("b", { text: value }));
      return [
        h("h2", { text: "Let's set up Rain" }),
        h("p", { text: "It reads the question you're on and helps with it, or answers it for you. Takes about a minute." }),
        UI.section(null, "Everything here can be changed later in Settings.",
          fact("Works on", CONFIG.sites.map(site => site.label).join(", ")),
          fact("You need", "An API key from Claude, OpenAI or Gemini"),
          h("div", { class: "r-row r-setup-fact" }, h("span", { text: "Show or hide" }), h("b", {}, Keys.parts(Settings.load().keys.toggle).map(part => h("kbd", { text: part })))))
      ];
    },

    provider() {
      const settings = Settings.load();
      const provider = Settings.provider(settings);
      const own = settings.providers[provider.id];
      const key = UI.field({
        class: "r-field r-field-mono",
        type: "password",
        value: own.apiKey,
        placeholder: provider.spec.keyHint,
        "aria-label": "API key",
        oninput: e => {
          saveProvider({ apiKey: e.target.value });
          refreshNext();
        }
      });
      const models = provider.spec.models;
      return [
        h("h2", { text: "Connect a model" }),
        h("p", { text: `Paste an API key. Get one at ${KEY_PAGES[provider.id] || "your provider"}. It stays in this browser.` }),
        UI.section(null, null,
          h("div", { class: "r-row" }, UI.segmented("Provider", CONFIG.providers.map(spec => [spec.id, spec.id === "openai" ? "OpenAI" : spec.label]), provider.id, id => {
            save({ provider: id });
            go(step);
          }, true)),
          UI.stack("API key", key),
          models.length
            ? UI.stack("Model", UI.segmented("Model", models.map(model => [model.id, model.label.replace(/^Claude /, "")]), provider.model, model => saveProvider({ model }), true), "Haiku is fast and cheap. Sonnet and Opus think harder on tough questions.")
            : UI.stack("Model", UI.field({ class: "r-field r-field-mono", value: own.model, placeholder: provider.spec.model, oninput: e => saveProvider({ model: e.target.value }) })),
          h("button", { class: "r-row r-row-action", type: "button", text: "Test connection", onclick: () => app.testConnection() }))
      ];
    },

    answering() {
      const settings = Settings.load();
      return [
        h("h2", { text: "How should it answer?" }),
        h("p", { text: "Pick how hands-on Rain is. Off means it only explains in the chat." }),
        UI.section(null, null,
          UI.row("Enter answers on the page", UI.switch("Enter answers", settings.autoFill, value => {
            save({ autoFill: value, ...(value ? {} : { autoSubmit: false }) });
            go(step);
          }), "Types, clicks and drags the answer in for you"),
          settings.autoFill && UI.row("Submit automatically", UI.switch("Submit automatically", settings.autoSubmit, value => save({ autoSubmit: value })), "Presses Submit or Next once the answer is in"),
          settings.autoFill && UI.stack("Replies", UI.segmented("Replies", [["explain", "Explain"], ["quiet", "Answer only"]], settings.replyStyle, replyStyle => save({ replyStyle }), true)))
      ];
    },

    keys() {
      const settings = Settings.load();
      const row = (combo, text) => combo ? [h("dt", {}, Keys.parts(combo).map(part => h("kbd", { text: part }))), h("dd", { text })] : [];
      return [
        h("h2", { text: "You're set" }),
        h("p", { text: "Open a question and press Answer, or turn on Auto in the top bar. These shortcuts work anywhere on the page, even while Rain is hidden." }),
        h("dl", { class: "r-keys r-setup-keys" },
          row(settings.keys.toggle, "show or hide Rain"),
          row(settings.keys.answer, "answer this question"),
          row(settings.keys.auto, "Auto Answer on or off"),
          row(settings.keys.pick, "pick the question area")),
        UI.section(null, "Change shortcuts any time in Settings, Keys.",
          UI.row("Open Rain when a page loads", UI.switch("Open on load", settings.openOnStart, value => save({ openOnStart: value }))))
      ];
    }
  };

  function refreshNext() {
    const last = step === steps.length - 1;
    next.textContent = step === 0 ? "Get started" : last ? "Start using Rain" : "Continue";
    next.disabled = steps[step] === "provider" && !Settings.ready();
  }

  function go(index) {
    const forward = index >= step;
    step = Math.max(0, Math.min(steps.length - 1, index));
    body.dataset.dir = forward ? "next" : "back";
    body.replaceChildren(h("div", { class: "r-setup-page" }, pages[steps[step]]()));
    back.hidden = step === 0;
    [...dots.children].forEach((dot, i) => dot.dataset.on = String(i <= step));
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
      go(0);
    }
  };
}
