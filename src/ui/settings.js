const SETTINGS_PAGES = [
  { id: "model", title: "Model and key", icon: "cpu", tint: "#0a84ff", group: 0, words: "provider claude openai gemini api key base url effort test" },
  { id: "answering", title: "Answering", icon: "pencil", tint: "#30a46c", group: 0, words: "enter submit delay timing replies answer only memory auto" },
  { id: "accuracy", title: "Accuracy", icon: "target", tint: "#e5484d", group: 0, words: "wrong mistakes score chance target" },
  { id: "look", title: "Appearance", icon: "palette", tint: "#f76b15", group: 1, words: "theme dark light accent color glass transparency text size sound volume" },
  { id: "panel", title: "Panel and chat", icon: "layout", tint: "#0090ff", group: 1, words: "size width bubbles timestamps toolbar header buttons position" },
  { id: "pill", title: "Status pill", icon: "pill", tint: "#6e7781", group: 1, words: "island toast notifications status position" },
  { id: "keys", title: "Shortcuts", icon: "keyboard", tint: "#8d8d8d", group: 2, words: "keys hotkey bind toggle panic" },
  { id: "hiding", title: "Hiding and panic", icon: "shield", tint: "#d6409f", group: 2, words: "stealth hide panic unload launcher private" },
  { id: "site", title: "This site", icon: "globe", tint: "#12a594", group: 3, words: "tweaks dark mode supported sites" },
  { id: "data", title: "Chats and usage", icon: "archive", tint: "#ad7f58", group: 3, words: "export delete stats tokens usage reset" },
  { id: "about", title: "About", icon: "info", tint: "#6e7781", group: 3, words: "version github setup" }
];

function createSettings(app) {
  const compact = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });
  const capitalize = text => text[0].toUpperCase() + text.slice(1);
  let stack = ["root"];
  let query = "";

  const backButton = h("button", { class: "r-back", type: "button", onclick: () => back() }, icon("back"), h("span"));
  const titleText = h("h2");
  const scroll = h("div", { class: "r-scroll" });
  const el = h("section", { class: "r-view r-view-settings", "data-active": "false", "aria-label": "Settings" },
    h("header", { class: "r-subhead" }, backButton, titleText, h("span", { class: "r-subhead-gap" })),
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

  function saveLook(patch) {
    const look = Settings.load().look;
    return save({ look: { ...look, ...patch, toolbar: { ...look.toolbar, ...patch.toolbar } } });
  }

  function render(direction = "") {
    const page = stack.at(-1);
    const spec = SETTINGS_PAGES.find(entry => entry.id === page);
    titleText.textContent = spec ? spec.title : "Settings";
    backButton.lastChild.textContent = stack.length > 1 ? "Settings" : "Back";
    scroll.replaceChildren(h("div", { class: "r-page", "data-dir": direction }, page === "root" ? rootPage() : pages[page]()));
    if (direction) scroll.scrollTop = 0;
  }

  function go(id) {
    stack = [...stack, id];
    Sounds.play("tick");
    render("in");
  }

  function back() {
    if (stack.length > 1) {
      stack = stack.slice(0, -1);
      render("out");
    } else {
      app.showView("main");
    }
  }

  function summary(id, settings) {
    const provider = Settings.provider(settings);
    switch (id) {
      case "model": return provider.apiKey ? AI.label(settings).replace(/^Claude /, "") : "No key";
      case "answering": return !settings.autoFill ? "Chat only" : settings.autoSubmit ? "Enter and submit" : "Enter answers";
      case "accuracy": return Object.fromEntries(ACCURACY_MODES)[settings.accuracyMode];
      case "look": return capitalize(settings.theme === "system" ? "auto" : settings.theme);
      case "panel": return capitalize(settings.look.size);
      case "pill": return settings.island.enabled ? { siri: "Glow", glass: "Glass", dark: "Dark", accent: "Accent" }[settings.island.style] : "Off";
      case "hiding": return settings.stealth ? "Stealth" : "";
      case "site": return Question.site().label;
      default: return "";
    }
  }

  function navRow(spec, settings) {
    return h("button", { class: "r-row r-nav", type: "button", onclick: () => go(spec.id) },
      h("span", { class: "r-nav-icon", style: `--tint:${spec.tint}` }, icon(spec.icon)),
      h("span", { class: "r-row-label", text: spec.title }),
      h("span", { class: "r-nav-detail", text: summary(spec.id, settings) }),
      icon("chevron"));
  }

  function rootPage() {
    const settings = Settings.load();
    const search = UI.field({
      type: "search",
      placeholder: "Search settings",
      "aria-label": "Search settings",
      value: query,
      oninput: e => {
        query = e.target.value.trim().toLowerCase();
        results.replaceChildren(...listing(Settings.load()));
      }
    });
    const results = h("div", {}, listing(settings));
    requestAnimationFrame(() => query && search.focus({ preventScroll: true }));
    return [h("div", { class: "r-search r-search-settings" }, icon("search"), search), results];
  }

  function listing(settings) {
    if (query) {
      const found = SETTINGS_PAGES.filter(spec => `${spec.title} ${spec.words}`.toLowerCase().includes(query));
      return found.length
        ? [h("section", { class: "r-section" }, h("div", { class: "r-group" }, found.map(spec => navRow(spec, settings))))]
        : [h("p", { class: "r-none", text: `Nothing matches "${query}".` })];
    }
    return [0, 1, 2, 3].map(group => h("section", { class: "r-section" },
      h("div", { class: "r-group" }, SETTINGS_PAGES.filter(spec => spec.group === group).map(spec => navRow(spec, settings)))));
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
        render();
      })),
      random
        ? [UI.row("Shortest", UI.ms("Shortest delay", settings[keys.min], checked(keys.min, keys.max, true))),
          UI.row("Longest", UI.ms("Longest delay", settings[keys.max], checked(keys.max, keys.min, false)))]
        : UI.row(prefix ? "Wait before submitting" : "Wait before entering", UI.ms("Delay", settings[keys.ms], value => save({ [keys.ms]: value })))
    ];
  };

  const percent = (settings, label, key) => h("span", { class: "r-unit" }, h("input", {
    class: "r-field r-number",
    type: "number",
    min: 0,
    max: 100,
    step: 1,
    value: settings[key],
    "aria-label": label,
    onchange: e => e.target.validity.valid && e.target.value !== "" && save({ [key]: e.target.valueAsNumber })
  }), "%");

  const pages = {
    model() {
      const settings = Settings.load();
      const provider = Settings.provider(settings);
      const own = settings.providers[provider.id];
      const listId = "r-model-list";
      const list = h("datalist", { id: listId }, provider.spec.models.map(model => h("option", { value: model.id, label: model.label })));
      const modelInput = UI.field({ class: "r-field r-field-mono", value: own.model, placeholder: provider.spec.model, list: listId, onchange: e => app.switchModel(provider.id, e.target.value.trim() || provider.spec.model, true) });
      const picker = h("select", {
        class: "r-field",
        "aria-label": "Available models",
        onchange: e => {
          modelInput.value = e.target.value;
          app.switchModel(provider.id, e.target.value, true);
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
        UI.section("Provider", provider.id === "openai" ? "Works with OpenAI and anything that speaks the OpenAI chat format, such as OpenRouter, Groq, LM Studio or Ollama. Point the base URL at it." : null,
          h("div", { class: "r-row" }, UI.segmented("Provider", CONFIG.providers.map(spec => [spec.id, spec.id === "openai" ? "OpenAI" : spec.label]), provider.id, id => {
            save({ provider: id });
            render();
          }, true))),
        UI.section(provider.spec.label, "Keys stay in this browser and only go to the address below.",
          UI.stack("API key", h("div", { class: "r-inline" }, keyInput, reveal)),
          UI.stack("Model", h("div", { class: "r-inline" }, modelInput, load)),
          pickerRow,
          UI.stack("Base URL", UI.field({ class: "r-field r-field-mono", value: own.baseUrl, placeholder: provider.spec.baseUrl, oninput: e => saveProvider({ baseUrl: e.target.value }) }), "Leave empty for the default"),
          provider.spec.efforts && UI.line("Effort", UI.segmented("Effort", CONFIG.efforts.map(effort => [effort, capitalize(effort)]), settings.effort, effort => save({ effort }))),
          h("button", { class: "r-row r-row-action", type: "button", text: "Test connection", onclick: () => app.testConnection() })),
        settings.recentModels.length ? UI.section("Recent models", "These show up in the model switcher at the top of the panel.",
          h("button", { class: "r-row r-row-action", type: "button", text: "Clear recent models", onclick: () => {
            save({ recentModels: [] });
            render();
          } })) : null,
        list
      ];
    },

    answering() {
      const settings = Settings.load();
      const on = settings.autoFill;
      return [
        UI.section(null, "Answer and Auto Answer type, click and drag the answer into the page after the wait.",
          UI.row("Enter answers on the page", UI.switch("Enter answers", on, value => {
            save({ autoFill: value });
            render();
          })),
          on && delayRows(false, settings)),
        on && UI.section("Submitting", "Presses Submit, or Next on sites like iCEV, once the answer is in. On DeltaMath and IXL it also moves on to the next problem.",
          UI.row("Submit automatically", UI.switch("Submit automatically", settings.autoSubmit, value => {
            save({ autoSubmit: value });
            render();
          })),
          settings.autoSubmit && delayRows(true, settings)),
        on && UI.section("Replies", settings.replyStyle === "quiet"
          ? "Skips the explanation and only enters the answer. Faster and cheaper. Rain still explains when something goes wrong."
          : "Rain explains each answer before entering it.",
          h("div", { class: "r-row" }, UI.segmented("Replies", [["explain", "Explain"], ["quiet", "Answer only"]], settings.replyStyle, replyStyle => {
            save({ replyStyle });
            render();
          }, true))),
        UI.section("Chat memory", settings.memory === "chat" ? "Rain sees the last few questions in this chat. Uses more tokens." : "Rain only sees the current question and your messages about it.",
          h("div", { class: "r-row" }, UI.segmented("Memory", [["question", "Current question"], ["chat", "Whole chat"]], settings.memory, memory => {
            save({ memory });
            render();
          }, true)))
      ];
    },

    accuracy() {
      const settings = Settings.load();
      const mode = settings.accuracyMode;
      const record = Accuracy.load();
      const score = Accuracy.score(record);
      const notes = {
        off: "Every answer Rain enters aims to be correct.",
        chance: "Each answer has this chance of being a believable mistake. Never two misses in a row.",
        target: "Rain keeps your running score close to this, missing on purpose only when you're above it."
      };
      return [
        UI.section(null, notes[mode],
          h("div", { class: "r-row" }, UI.segmented("Accuracy", ACCURACY_MODES, mode, value => {
            save({ accuracyMode: value });
            render();
          }, true)),
          mode === "chance" && UI.row("Chance of a wrong answer", percent(settings, "Chance of a wrong answer", "missChance")),
          mode === "target" && UI.row("Target score", percent(settings, "Target score", "targetScore"))),
        mode !== "off" && UI.section("So far", null,
          UI.line(score === null ? "No answers counted yet" : `${record.total - record.wrong} of ${record.total} right, ${score}%`,
            UI.button(null, "Reset", () => {
              Accuracy.reset();
              render();
            })))
      ];
    },

    look() {
      const settings = Settings.load();
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
      const glass = h("input", {
        class: "r-range",
        type: "range",
        min: 55,
        max: 100,
        step: 1,
        value: settings.look.glass,
        "aria-label": "Panel opacity",
        oninput: e => saveLook({ glass: Number(e.target.value) })
      });
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
        UI.section("Theme", null,
          h("div", { class: "r-row" }, UI.segmented("Theme", [["light", "Light"], ["dark", "Dark"], ["system", "Match system"]], settings.theme, theme => save({ theme }), true)),
          UI.stack("Accent", h("div", { class: "r-swatches", role: "radiogroup", "aria-label": "Accent" }, swatches))),
        UI.section("Glass", "Lower opacity lets more of the page show through.",
          UI.row("Solid panel", UI.switch("Solid panel", settings.reduceTransparency, value => {
            save({ reduceTransparency: value });
            render();
          })),
          !settings.reduceTransparency && UI.line("Opacity", h("div", { class: "r-inline r-slider" }, glass))),
        UI.section("Text", null,
          UI.line("Size", UI.segmented("Text size", [["13", "S"], ["14", "M"], ["15", "L"], ["16", "XL"]], String(settings.look.text), text => saveLook({ text: Number(text) }))),
          UI.line("Spacing", UI.segmented("Density", [["comfortable", "Roomy"], ["compact", "Tight"]], settings.density, density => save({ density })))),
        UI.section("Sound", "Short synthesized sounds for replies, actions and errors.",
          UI.row("Play sounds", UI.switch("Sounds", settings.sounds, value => save({ sounds: value }))),
          UI.line("Volume", h("div", { class: "r-inline r-slider" }, volume, UI.iconButton("play", "Play a sample", () => Sounds.play("success", true)))))
      ];
    },

    panel() {
      const settings = Settings.load();
      const look = settings.look;
      const toggle = (label, key) => UI.row(label, UI.switch(label, look.toolbar[key], value => saveLook({ toolbar: { [key]: value } })));
      return [
        UI.section("Size", null,
          h("div", { class: "r-row" }, UI.segmented("Panel size", [["compact", "Compact"], ["regular", "Regular"], ["large", "Large"]], look.size, size => saveLook({ size }), true)),
          h("button", { class: "r-row r-row-action", type: "button", text: "Move back to the corner", onclick: () => app.resetPosition() })),
        UI.section("Messages", null,
          UI.line("Style", UI.segmented("Message style", [["true", "Bubbles"], ["false", "Plain"]], String(look.bubbles), value => {
            saveLook({ bubbles: value === "true" });
            app.rerender();
          })),
          UI.row("Show times", UI.switch("Show times", look.times, value => {
            saveLook({ times: value });
            app.rerender();
          }))),
        UI.section("Top of the panel", "Turn off what you don't use to keep the panel quiet.",
          toggle("Model switcher", "model"),
          toggle("Auto button", "auto"),
          toggle("Area button", "area"),
          toggle("New chat button", "newChat"),
          UI.row("Explain, Hint, Check, Answer", UI.switch("Action buttons", look.actions, value => saveLook({ actions: value })))),
        UI.section("Opening", null,
          UI.row("Open Rain when a page loads", UI.switch("Open on load", settings.openOnStart, value => save({ openOnStart: value }))))
      ];
    },

    pill() {
      const settings = Settings.load();
      const island = settings.island;
      const setIsland = (patch, rerender = false) => {
        save({ island: { ...Settings.load().island, ...patch } });
        app.previewIsland();
        if (rerender) render();
      };
      return [
        UI.section(null, "The pill at the edge of the page that shows what Rain is doing.",
          UI.row("Show status pill", UI.switch("Status pill", island.enabled, value => setIsland({ enabled: value }, true)), "Errors and Cancel buttons still show when this is off")),
        island.enabled && UI.section("Look", null,
          UI.line("Style", UI.segmented("Pill style", [["siri", "Glow"], ["glass", "Glass"], ["dark", "Dark"], ["accent", "Accent"]], island.style, style => setIsland({ style }))),
          UI.line("Position", UI.segmented("Pill position", [["top", "Top"], ["bottom", "Bottom"]], island.position, position => setIsland({ position })))),
        island.enabled && UI.section("Behavior", null,
          UI.line("Shows", UI.segmented("Pill detail", [["all", "Everything"], ["important", "Results"]], island.detail, detail => setIsland({ detail }))),
          UI.line("Stays for", UI.segmented("Pill duration", [["short", "Short"], ["normal", "Normal"], ["long", "Long"]], island.duration, duration => setIsland({ duration }))))
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
      return [UI.section(null, "Click a shortcut, then press the new keys. Backspace clears it, Esc cancels. Single keys are ignored while you type in a box.", rows)];
    },

    hiding() {
      const settings = Settings.load();
      const actions = [["hide", "Hide"], ["unload", "Unload"], ["leave", "Leave page"]];
      const notes = {
        hide: "Hides the panel and the status pill and stops Auto Answer. Press the show shortcut to bring Rain back.",
        unload: "Removes Rain from this tab completely, including site tweaks. It comes back when the page reloads.",
        leave: "Removes Rain and opens the page below in this tab."
      };
      return [
        UI.section("Stealth", "No status pill, no launcher, no sounds, and Rain starts hidden. Open it with the show shortcut.",
          UI.row("Stealth mode", UI.switch("Stealth mode", settings.stealth, value => {
            save({ stealth: value });
            app.applyStealth();
          }))),
        UI.section("Panic", notes[settings.panicAction],
          h("div", { class: "r-row" }, UI.segmented("Panic action", actions, settings.panicAction, panicAction => {
            save({ panicAction });
            render();
          }, true)),
          settings.panicAction === "leave" && UI.stack("Page to open", UI.field({ class: "r-field r-field-mono", type: "url", value: settings.panicUrl, placeholder: "https://", onchange: e => save({ panicUrl: e.target.value.trim() }) })),
          UI.line("Panic shortcut", h("span", { class: "r-keycaps" }, Keys.parts(settings.keys.panic).map(part => h("kbd", { text: part })), !settings.keys.panic && "Not set"))),
        UI.section("While hidden", null,
          UI.row("Show a launcher button", UI.switch("Launcher", settings.launcher, value => save({ launcher: value })), "A small button in the corner that opens Rain")),
        UI.section("Chats", null,
          UI.row("Private mode", UI.switch("Private mode", settings.privateMode, value => {
            save({ privateMode: value });
            app.newChat(value);
          }), "New chats are not saved"))
      ];
    },

    site() {
      const site = Question.site();
      const settings = Settings.load();
      const current = site.id === "generic" ? null : site.id;
      return [
        UI.section(`Tweaks for ${site.label}`, "Saved per site and applied as soon as the page loads.",
          Tweaks.list.map(tweak => UI.row(tweak.label, UI.switch(tweak.label, Tweaks.enabled(tweak.id, settings), value => Tweaks.set(tweak.id, value)), tweak.note))),
        h("section", { class: "r-section" },
          h("h3", { text: "Supported sites" }),
          h("div", { class: "r-group" }, h("ul", { class: "r-sites" }, CONFIG.sites.map(entry => h("li", { "data-current": String(entry.id === current) },
            entry.id === current ? icon("check") : null,
            h("span", { text: entry.label }),
            h("em", { text: entry.hosts[0] }))))),
          h("p", { text: "Other sites work too with a generic reader. Press Area and click the question if Rain reads the wrong part." }))
      ];
    },

    data() {
      const stats = Stats.load();
      const cell = (value, label) => h("div", { class: "r-stat" }, h("b", { text: compact.format(value), title: value.toLocaleString() }), h("span", { text: label }));
      const confirm = (text, again, run) => h("button", { class: "r-row r-row-action r-row-danger", type: "button", text, onclick: e => {
        if (e.currentTarget.dataset.confirm !== "true") {
          e.currentTarget.dataset.confirm = "true";
          e.currentTarget.textContent = again;
          return;
        }
        run();
      } });
      return [
        UI.section("Usage", null,
          h("div", { class: "r-stats" },
            cell(stats.answered, "Answered"), cell(stats.submitted, "Submitted"), cell(stats.advanced, "Next pressed"),
            cell(stats.calls, "Requests"), cell(stats.input, "Tokens in"), cell(stats.output, "Tokens out")),
          h("button", { class: "r-row r-row-action", type: "button", text: "Reset usage", onclick: () => {
            Stats.reset();
            render();
          } })),
        UI.section("Chats", `The last ${CONFIG.ui.maxChats} chats are kept in this browser.`,
          h("button", { class: "r-row r-row-action", type: "button", text: "Copy all chats as JSON", onclick: () => app.exportChats() }),
          confirm("Delete all chats", "Press again to delete every chat", () => {
            app.clearChats();
            render();
          })),
        UI.section("Reset", "Your API keys are kept.",
          confirm("Reset all settings", "Press again to reset everything", () => app.resetSettings()))
      ];
    },

    about() {
      return [
        h("div", { class: "r-about" },
          h("b", { text: CONFIG.name }),
          h("span", { text: `Version ${CONFIG.version}` })),
        UI.section(null, null,
          h("button", { class: "r-row r-row-action", type: "button", text: "Run setup again", onclick: () => app.showView("setup") }),
          CONFIG.repo && h("a", { class: "r-row r-row-action", href: `https://github.com/${CONFIG.repo}`, target: "_blank", rel: "noopener", text: "Open on GitHub" }))
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
    if (refresh) render();
  }

  return {
    el,
    open(page) {
      query = "";
      stack = page && pages[page] ? ["root", page] : ["root"];
      render("in");
    },
    close() {
      stopRecording();
    },
    refresh() {
      if (el.dataset.active === "true") render();
    }
  };
}
