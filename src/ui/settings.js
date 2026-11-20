const SETTINGS_TABS = [
  ["model", "Model"],
  ["answering", "Answering"],
  ["keys", "Keys"],
  ["look", "Look"],
  ["site", "Site"],
  ["data", "Data"]
];

function createSettings(app) {
  const compact = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });
  const capitalize = text => text[0].toUpperCase() + text.slice(1);
  let current = "model";

  const tabButtons = SETTINGS_TABS.map(([id, text]) => h("button", {
    class: "r-tab",
    type: "button",
    role: "tab",
    text,
    "data-tab": id,
    onclick: () => select(id)
  }));
  const tabLine = h("span", { class: "r-tab-line", "aria-hidden": "true" });
  const scroll = h("div", { class: "r-scroll" });
  const el = h("section", { class: "r-view r-view-settings", "data-active": "false", "aria-label": "Settings" },
    UI.subhead("Settings", () => app.showView("main")),
    h("div", { class: "r-tabs", role: "tablist" }, tabButtons, tabLine),
    scroll);

  function save(patch) {
    const settings = Settings.save(patch);
    app.settingsChanged(settings);
    return settings;
  }

  function saveProvider(patch) {
    const settings = Settings.load();
    return save({ providers: { ...settings.providers, [settings.provider]: { ...settings.providers[settings.provider], ...patch } } });
  }

  function moveLine() {
    const tab = tabButtons.find(button => button.dataset.tab === current);
    if (!tab || !tab.offsetWidth) return;
    tabLine.style.width = `${tab.offsetWidth - 16}px`;
    tabLine.style.transform = `translateX(${tab.offsetLeft + 8}px)`;
  }

  function select(id) {
    current = id;
    tabButtons.forEach(button => button.setAttribute("aria-selected", String(button.dataset.tab === id)));
    scroll.replaceChildren(h("div", { class: "r-page" }, pages[id]()));
    scroll.scrollTop = 0;
    requestAnimationFrame(moveLine);
  }

  const delayRows = (prefix, settings) => {
    const keys = prefix ? { mode: "submitDelayMode", ms: "submitDelayMs", min: "submitDelayMinMs", max: "submitDelayMaxMs" } : { mode: "delayMode", ms: "delayMs", min: "delayMinMs", max: "delayMaxMs" };
    const random = settings[keys.mode] === "random";
    const checked = (key, other, isMin) => (value, input) => {
      const pair = Settings.load()[other];
      if (isMin ? value > pair : value < pair) {
        input.value = Settings.load()[key];
        app.status("Maximum delay must be at least the minimum", { tone: "error" });
        return;
      }
      save({ [key]: value });
    };
    return [
      UI.line(prefix ? "Submit timing" : "Timing", UI.segmented("Timing", [["fixed", "Fixed"], ["random", "Random"]], settings[keys.mode], mode => {
        save({ [keys.mode]: mode });
        select("answering");
      })),
      random
        ? [UI.row("Shortest", UI.ms("Shortest delay", settings[keys.min], checked(keys.min, keys.max, true))),
          UI.row("Longest", UI.ms("Longest delay", settings[keys.max], checked(keys.max, keys.min, false)))]
        : UI.row(prefix ? "Wait before submitting" : "Wait before entering", UI.ms("Delay", settings[keys.ms], value => save({ [keys.ms]: value })))
    ];
  };

  const accuracySection = settings => {
    const mode = settings.accuracyMode;
    const record = Accuracy.load();
    const score = Accuracy.score(record);
    const notes = {
      off: "Every answer Rain enters aims to be correct.",
      chance: "Each answer has this chance of being a believable mistake. Never two misses in a row.",
      target: "Rain keeps your running score close to this, missing on purpose only when you're above it."
    };
    const percent = (label, key) => h("span", { class: "r-unit" }, h("input", {
      class: "r-field r-number",
      type: "number",
      min: 0,
      max: 100,
      step: 1,
      value: settings[key],
      "aria-label": label,
      onchange: e => e.target.validity.valid && e.target.value !== "" && save({ [key]: e.target.valueAsNumber })
    }), "%");
    return UI.section("Accuracy", notes[mode],
      h("div", { class: "r-row" }, UI.segmented("Accuracy", ACCURACY_MODES, mode, value => {
        save({ accuracyMode: value });
        select("answering");
      }, true)),
      mode === "chance" && UI.row("Chance of a wrong answer", percent("Chance of a wrong answer", "missChance")),
      mode === "target" && UI.row("Target score", percent("Target score", "targetScore")),
      mode !== "off" && UI.line(score === null ? "No answers counted yet" : `${record.total - record.wrong} of ${record.total} right, ${score}%`,
        UI.button(null, "Reset", () => {
          Accuracy.reset();
          select("answering");
        })));
  };

  const pages = {
    model() {
      const settings = Settings.load();
      const provider = Settings.provider(settings);
      const own = settings.providers[provider.id];
      const listId = "r-model-list";
      const list = h("datalist", { id: listId }, provider.spec.models.map(model => h("option", { value: model.id, label: model.label })));
      const modelInput = UI.field({ class: "r-field r-field-mono", value: own.model, placeholder: provider.spec.model, list: listId, oninput: e => saveProvider({ model: e.target.value }) });
      const picker = h("select", {
        class: "r-field",
        "aria-label": "Available models",
        onchange: e => {
          modelInput.value = e.target.value;
          saveProvider({ model: e.target.value });
        }
      });
      const keyInput = UI.field({ class: "r-field r-field-mono", type: "password", value: own.apiKey, placeholder: provider.spec.keyHint, "aria-label": "API key", oninput: e => saveProvider({ apiKey: e.target.value }) });
      const pickerRow = h("div", { class: "r-row", hidden: true }, picker);
      const reveal = UI.iconButton("eye", "Show key", () => {
        const visible = keyInput.type === "password";
        keyInput.type = visible ? "text" : "password";
        reveal.replaceChildren(icon(visible ? "eyeOff" : "eye"));
      });

      const load = UI.button("refresh", "Load", async () => {
        load.disabled = true;
        try {
          const models = await AI.models(Settings.load());
          picker.replaceChildren(h("option", { value: "", text: `${models.length} models`, disabled: true, selected: true }),
            models.map(model => h("option", { value: model.id, text: model.label === model.id ? model.id : `${model.label} (${model.id})` })));
          list.replaceChildren(...models.map(model => h("option", { value: model.id })));
          pickerRow.hidden = false;
          app.status(`Loaded ${models.length} models`, { tone: "ok" });
        } catch (err) {
          app.status(err.message, { tone: "error" });
        } finally {
          load.disabled = false;
        }
      });

      return [
        UI.section("Provider", provider.id === "openai" ? "Works with OpenAI and any API that speaks the OpenAI chat format, such as OpenRouter, Groq, LM Studio or Ollama. Change the base URL to point at it." : null,
          h("div", { class: "r-row" }, UI.segmented("Provider", CONFIG.providers.map(spec => [spec.id, spec.id === "openai" ? "OpenAI" : spec.label]), provider.id, id => {
            save({ provider: id });
            select("model");
          }, true))),
        UI.section(provider.spec.label, "Keys stay in this browser and are only sent to the provider's address below.",
          UI.stack("API key", h("div", { class: "r-inline" }, keyInput, reveal)),
          UI.stack("Model", h("div", { class: "r-inline" }, modelInput, load)),
          pickerRow,
          UI.stack("Base URL", UI.field({ class: "r-field r-field-mono", value: own.baseUrl, placeholder: provider.spec.baseUrl, oninput: e => saveProvider({ baseUrl: e.target.value }) }), "Leave empty for the default"),
          provider.spec.efforts && UI.line("Effort", UI.segmented("Effort", CONFIG.efforts.map(effort => [effort, capitalize(effort)]), settings.effort, effort => save({ effort }))),
          h("button", { class: "r-row r-row-action", type: "button", text: "Test connection", onclick: () => app.testConnection() })),
        list
      ];
    },

    answering() {
      const settings = Settings.load();
      const on = settings.autoFill;
      return [
        UI.section("Entering answers", "Answer and Auto Answer type, click and drag the answer into the page after the wait.",
          UI.row("Enter answers on the page", UI.switch("Enter answers", on, value => {
            save({ autoFill: value });
            select("answering");
          })),
          on && delayRows(false, settings)),
        on && UI.section("Submitting", "Presses Submit, or Next on sites like iCEV, after the answer is in. On DeltaMath and IXL it also moves on to the next problem.",
          UI.row("Submit automatically", UI.switch("Submit automatically", settings.autoSubmit, value => {
            save({ autoSubmit: value });
            select("answering");
          })),
          settings.autoSubmit && delayRows(true, settings)),
        on && accuracySection(settings),
        on && UI.section("Replies", settings.replyStyle === "quiet"
          ? "Answer and Auto Answer skip the explanation and only enter the answer. Faster and cheaper. Rain still explains if something goes wrong."
          : "Rain explains each answer before entering it.",
          h("div", { class: "r-row" }, UI.segmented("Replies", [["explain", "Explain"], ["quiet", "Answer only"]], settings.replyStyle, replyStyle => {
            save({ replyStyle });
            select("answering");
          }, true))),
        UI.section("Chat memory", settings.memory === "chat" ? "Rain sees the last few questions in this chat. Uses more tokens." : "Rain only sees the current question and your messages about it.",
          h("div", { class: "r-row" }, UI.segmented("Memory", [["question", "Current question"], ["chat", "Whole chat"]], settings.memory, memory => {
            save({ memory });
            select("answering");
          }, true)))
      ];
    },

    keys() {
      const settings = Settings.load();
      const rows = KEY_ACTIONS.map(action => {
        const combo = settings.keys[action.id];
        const button = h("button", {
          class: "r-key",
          type: "button",
          text: Keys.label(combo),
          "data-empty": String(!combo),
          onclick: () => record(button, action.id)
        });
        return UI.line(action.label, button, action.note);
      });
      return [
        UI.section("Shortcuts", "Click a shortcut, then press the new keys. Backspace clears it, Esc cancels. Single keys are ignored while you type in a box.", rows),
        UI.section("Visibility", null,
          UI.row("Open Rain when a page loads", UI.switch("Open on load", settings.openOnStart, value => save({ openOnStart: value }))),
          UI.row("Show a launcher while hidden", UI.switch("Launcher", settings.launcher, value => save({ launcher: value })), "Off means Rain is fully hidden until you press the shortcut"))
      ];
    },

    look() {
      const settings = Settings.load();
      const island = settings.island;
      const setIsland = (patch, rerender = false) => {
        save({ island: { ...Settings.load().island, ...patch } });
        app.previewIsland();
        if (rerender) select("look");
      };
      const swatches = CONFIG.ui.accents.map(accent => h("button", {
        class: "r-swatch",
        type: "button",
        role: "radio",
        title: capitalize(accent.id),
        "aria-label": capitalize(accent.id),
        "aria-checked": String(settings.accent === accent.id),
        style: `--c:${app.scheme() === "dark" ? accent.dark : accent.light}`,
        onclick: e => {
          swatches.forEach(swatch => swatch.setAttribute("aria-checked", String(swatch === e.currentTarget)));
          Sounds.play("tick");
          save({ accent: accent.id });
        }
      }));
      const volume = h("input", {
        class: "r-range",
        type: "range",
        min: 0,
        max: 1,
        step: .05,
        value: settings.volume,
        "aria-label": "Volume",
        onchange: e => {
          save({ volume: Number(e.target.value) });
          Sounds.play("reply", true);
        }
      });
      return [
        UI.section("Appearance", null,
          UI.line("Theme", UI.segmented("Theme", [["light", "Light"], ["dark", "Dark"], ["system", "Auto"]], settings.theme, theme => save({ theme }))),
          UI.stack("Accent", h("div", { class: "r-swatches", role: "radiogroup", "aria-label": "Accent" }, swatches)),
          UI.line("Density", UI.segmented("Density", [["comfortable", "Roomy"], ["compact", "Compact"]], settings.density, density => save({ density }))),
          UI.row("Reduce transparency", UI.switch("Reduce transparency", settings.reduceTransparency, value => save({ reduceTransparency: value })), "Solid panel instead of glass")),
        UI.section("Status pill", "The pill at the edge of the page that shows what Rain is doing.",
          UI.row("Show status pill", UI.switch("Status pill", island.enabled, value => setIsland({ enabled: value }, true)), "Errors and buttons like Cancel still show when this is off"),
          island.enabled && [
            UI.line("Style", UI.segmented("Pill style", [["glass", "Glass"], ["dark", "Dark"], ["accent", "Accent"]], island.style, style => setIsland({ style }))),
            UI.line("Position", UI.segmented("Pill position", [["top", "Top"], ["bottom", "Bottom"]], island.position, position => setIsland({ position }))),
            UI.line("Shows", UI.segmented("Pill detail", [["all", "Everything"], ["important", "Results only"]], island.detail, detail => setIsland({ detail }))),
            UI.line("Stays for", UI.segmented("Pill duration", [["short", "Short"], ["normal", "Normal"], ["long", "Long"]], island.duration, duration => setIsland({ duration })))
          ]),
        UI.section("Sound", "Short synthesized sounds for replies, actions and errors.",
          UI.row("Play sounds", UI.switch("Sounds", settings.sounds, value => save({ sounds: value }))),
          UI.line("Volume", h("div", { class: "r-inline", style: "flex:1;max-width:190px" }, volume, UI.iconButton("play", "Play a sample", () => Sounds.play("success", true)))))
      ];
    },

    site() {
      const site = Question.site();
      const settings = Settings.load();
      const current = site.id === "generic" ? null : site.id;
      return [
        UI.section(`Tweaks for ${site.label}`, "Tweaks are saved per site and apply as soon as the page loads.",
          Tweaks.list.map(tweak => UI.row(tweak.label, UI.switch(tweak.label, Tweaks.enabled(tweak.id, settings), value => Tweaks.set(tweak.id, value)), tweak.note))),
        h("section", { class: "r-section" },
          h("h3", { text: "Supported sites" }),
          h("div", { class: "r-group" }, h("ul", { class: "r-sites" }, CONFIG.sites.map(entry => h("li", { "data-current": String(entry.id === current) },
            entry.id === current ? icon("check") : null,
            h("span", { text: entry.label }),
            h("em", { text: entry.hosts[0] }))))),
          h("p", { text: "Other sites work too through the userscript's match list or the console version, with a generic reader." }))
      ];
    },

    data() {
      const settings = Settings.load();
      const stats = Stats.load();
      const cell = (value, label) => h("div", { class: "r-stat" }, h("b", { text: compact.format(value), title: value.toLocaleString() }), h("span", { text: label }));
      return [
        UI.section("Privacy", settings.privateMode ? "New chats are kept in memory only and disappear when you leave the page." : "Chats are saved in this browser. The last " + CONFIG.ui.maxChats + " are kept.",
          UI.row("Private mode", UI.switch("Private mode", settings.privateMode, value => {
            save({ privateMode: value });
            app.newChat(value);
            select("data");
          }), "Don't save new chats")),
        UI.section("Usage", null,
          h("div", { class: "r-stats" },
            cell(stats.answered, "Answered"), cell(stats.submitted, "Submitted"), cell(stats.advanced, "Next pressed"),
            cell(stats.calls, "Requests"), cell(stats.input, "Tokens in"), cell(stats.output, "Tokens out")),
          h("button", { class: "r-row r-row-action", type: "button", text: "Reset usage", onclick: () => {
            Stats.reset();
            select("data");
          } })),
        UI.section("Chats", null,
          h("button", { class: "r-row r-row-action", type: "button", text: "Copy all chats as JSON", onclick: () => app.exportChats() }),
          h("button", { class: "r-row r-row-action r-row-danger", type: "button", text: "Delete all chats", onclick: e => {
            if (e.currentTarget.dataset.confirm !== "true") {
              e.currentTarget.dataset.confirm = "true";
              e.currentTarget.textContent = "Press again to delete every chat";
              return;
            }
            app.clearChats();
            select("data");
          } })),
        h("p", { class: "r-version", text: `${CONFIG.name} ${CONFIG.version}` })
      ];
    }
  };

  let recording = null;
  function record(button, id) {
    stopRecording();
    button.dataset.recording = "true";
    button.textContent = "Press keys…";
    const onKey = e => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (e.key === "Escape") return stopRecording(true);
      const clear = (e.key === "Backspace" || e.key === "Delete") && !e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey;
      const combo = clear ? "" : Keys.combo(e);
      if (combo === null) return;
      const keys = { ...Settings.load().keys };
      for (const other of Object.keys(keys)) if (combo && keys[other] === combo) keys[other] = "";
      keys[id] = combo;
      save({ keys });
      Sounds.play("tick");
      stopRecording(true);
    };
    window.addEventListener("keydown", onKey, true);
    app.recording = true;
    recording = { button, onKey };
  }

  function stopRecording(refresh = false) {
    if (!recording) return;
    window.removeEventListener("keydown", recording.onKey, true);
    recording = null;
    setTimeout(() => { app.recording = false; }, 0);
    if (refresh) select("keys");
  }

  return {
    el,
    open(tab = current) {
      select(tab);
    },
    close() {
      stopRecording();
    },
    refresh() {
      if (el.dataset.active === "true") select(current);
    }
  };
}
