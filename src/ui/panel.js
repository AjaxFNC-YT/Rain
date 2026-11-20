function createPanel(app) {
  const host = h("div", { id: HOST_ID });
  const shadow = host.attachShadow({ mode: "open" });
  applyStyles(shadow, STYLES);
  ["keydown", "keyup", "keypress"].forEach(type => host.addEventListener(type, e => e.stopPropagation()));

  const systemDark = matchMedia("(prefers-color-scheme: dark)");
  const root = h("div", { class: "r" });
  shadow.append(root);
  document.documentElement.append(host);

  const island = createIsland(root);
  const settingsView = createSettings(app);
  const chatList = createChatList(app);
  const setupView = createSetup(app);

  let busy = false;
  let composeMode = "chat";
  let view = "main";
  let thinking = null;

  const siteText = h("span", { class: "r-brand-site" });
  const privateTag = h("span", { class: "r-tag", text: "Private", title: "This chat is not saved", hidden: true });
  const head = h("header", { class: "r-head" },
    h("div", { class: "r-brand" }, h("b", { text: CONFIG.name }), h("span", { class: "r-brand-sep", text: "|" }), siteText),
    privateTag,
    UI.iconButton("chats", "Chats", () => showView(view === "chats" ? "main" : "chats")),
    UI.iconButton("gear", "Settings", () => showView(view === "settings" ? "main" : "settings")),
    UI.iconButton("hide", "Hide", () => setOpen(false)));

  const autoButton = h("button", { class: "r-chip r-auto", type: "button", "aria-pressed": "false", "data-act": "auto", onclick: () => app.toggleAuto() },
    h("span", { class: "r-mini-switch", "aria-hidden": "true" }), h("span", { text: "Auto" }));
  const autoCount = h("span", { class: "r-count", hidden: true });
  const areaText = h("span", { text: "Area" });
  const areaButton = h("button", { class: "r-chip", type: "button", title: "Pick the part of the page Rain reads", onclick: () => app.pick() }, icon("scope"), areaText);
  const modelText = h("span");
  const modelButton = h("button", { class: "r-chip r-chip-model", type: "button", title: "Change the model", onclick: () => showView("settings", "model") }, modelText);

  const log = h("div", { class: "r-log", role: "log", "aria-label": "Conversation" });

  const input = h("textarea", {
    class: "r-input",
    rows: 1,
    placeholder: "Ask about this question…",
    "aria-label": "Message",
    onkeydown: e => {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        submit(composeMode);
      } else if (e.key === "Escape" && composeMode === "check") {
        e.preventDefault();
        setComposeMode("chat");
      }
    },
    oninput: () => autosize()
  });
  const modeChip = h("button", { class: "r-mode", type: "button", hidden: true, title: "Back to chat", onclick: () => setComposeMode("chat") },
    h("span", { text: "Check" }), icon("xmark"));
  const sendButton = h("button", { class: "r-send", type: "button", title: "Send", "aria-label": "Send", "data-empty": "true", onclick: () => busy ? app.stop() : submit(composeMode) },
    icon("arrowUp"));

  const hintBadge = h("span", { class: "r-badge", hidden: true });
  const hintButton = h("button", { class: "r-act", type: "button", "data-act": "hint", onclick: () => submit("hint") }, h("span", { text: "Hint" }), hintBadge);
  const actions = [
    h("button", { class: "r-act", type: "button", text: "Explain", "data-act": "explain", onclick: () => submit("explain") }),
    hintButton,
    h("button", { class: "r-act", type: "button", text: "Check", "data-act": "check", onclick: () => startCheck() }),
    h("button", { class: "r-act r-act-primary", type: "button", text: "Answer", "data-act": "answer", onclick: () => submit("choice") })
  ];

  const mainView = h("section", { class: "r-view r-view-main", "data-active": "true" },
    h("div", { class: "r-bar" }, autoButton, areaButton, autoCount, modelButton),
    log,
    h("footer", { class: "r-foot" },
      h("div", { class: "r-actions" }, actions),
      h("div", { class: "r-compose" }, modeChip, input, sendButton)));

  const views = { main: mainView, chats: chatList.el, settings: settingsView.el, setup: setupView.el };
  const panel = h("div", { class: "r-panel", role: "region", "aria-label": CONFIG.name, "data-open": "false" },
    head,
    h("div", { class: "r-views" }, mainView, chatList.el, settingsView.el, setupView.el));
  const launcher = h("button", { class: "r-launcher", type: "button", hidden: true, title: `Open ${CONFIG.name}` }, h("i"), h("span", { text: CONFIG.name }));
  root.append(panel, launcher);

  function autosize() {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
    sendButton.dataset.empty = String(!input.value.trim());
  }

  function setComposeMode(mode) {
    composeMode = mode;
    modeChip.hidden = mode !== "check";
    input.placeholder = mode === "check" ? "Type your answer to check it…" : "Ask about this question…";
    input.focus({ preventScroll: true });
  }

  function startCheck() {
    if (input.value.trim()) submit("check");
    else setComposeMode("check");
  }

  function submit(mode) {
    if (busy) return;
    const text = input.value.trim();
    if ((mode === "chat" || mode === "check") && !text) {
      input.focus();
      island.show(mode === "check" ? "Type your answer first" : "Type a question first");
      return;
    }
    if (mode === "chat" || mode === "check") {
      input.value = "";
      autosize();
      if (mode === "check") setComposeMode("chat");
    }
    Sounds.play("send");
    app.ask(mode, text);
  }

  function showView(name, tab) {
    if (name !== "main" && !isOpen()) setOpen(true);
    if (view === "settings" && name !== "settings") settingsView.close();
    view = name;
    for (const [id, el] of Object.entries(views)) el.dataset.active = String(id === name);
    panel.dataset.setup = String(name === "setup");
    if (name === "setup") {
      app.cancelFill();
      setupView.open();
    } else if (name === "settings") {
      app.cancelFill();
      settingsView.open(tab);
    } else if (name === "chats") {
      chatList.focus();
    } else {
      input.focus({ preventScroll: true });
    }
  }

  function isOpen() {
    return panel.dataset.open === "true";
  }

  function setOpen(open, quiet = false) {
    if (open === isOpen()) return;
    panel.dataset.open = String(open);
    Store.set("open", open);
    updateLauncher();
    if (!quiet) Sounds.play(open ? "open" : "close");
    if (open) {
      clampPosition();
      setTimeout(() => input.focus({ preventScroll: true }), 60);
    } else if (!quiet) {
      island.show([h("b", { text: CONFIG.name }), " hidden, press ", ...Keys.parts(Settings.load().keys.toggle).map(part => h("kbd", { text: part }))], {
        click: () => setOpen(true),
        duration: 2600
      });
    }
  }

  function updateLauncher() {
    launcher.hidden = isOpen() || !Settings.load().launcher;
  }

  function scrollDown() {
    log.scrollTop = log.scrollHeight;
  }

  function copyButton(text, className = "r-icon-btn r-msg-copy") {
    const button = h("button", { class: className, type: "button", title: "Copy", "aria-label": "Copy" }, icon("copy"));
    button.addEventListener("click", async () => {
      try {
        await copyText(text);
        button.dataset.done = "true";
        button.replaceChildren(icon("check"));
        Sounds.play("tick");
        setTimeout(() => {
          delete button.dataset.done;
          button.replaceChildren(icon("copy"));
        }, 1400);
      } catch {
        island.show("Couldn't copy on this page", { tone: "error" });
      }
    });
    return button;
  }

  function entryNode({ role, text, at }) {
    if (role === "you") return h("div", { class: "r-msg r-you" }, h("div", { class: "r-body", text }));
    if (role === "rain") return h("div", { class: "r-msg r-rain" }, h("div", { class: "r-body" }, renderMarkdown(text)), copyButton(text));
    if (role === "answer") {
      return h("div", { class: "r-msg r-answer" },
        h("div", { class: "r-answer-head" }, h("span", { text: "Answer" }), copyButton(text, "r-icon-btn")),
        h("div", { class: "r-body" }, renderMarkdown(text)));
    }
    if (role === "action") return h("div", { class: "r-msg r-action" }, icon("check"), h("span", { text }));
    if (role === "error") return h("div", { class: "r-msg r-error" }, icon("warn"), h("div", { text }));
    if (role === "divider") return h("div", { class: "r-msg r-divider" }, h("span", { text }), h("i"), h("time", { text: timeLabel(at) }));
    return h("div", { class: "r-msg r-note", text });
  }

  function emptyState() {
    const keys = Settings.load().keys;
    const row = (combo, text) => combo ? [h("dt", {}, Keys.parts(combo).map(part => h("kbd", { text: part }))), h("dd", { text })] : [];
    return h("div", { class: "r-empty" },
      h("h2", { text: "Open a question, then press Answer" }),
      h("p", { text: "Rain reads the question area of the page. If it reads the wrong part, press Area and click the question." }),
      h("dl", { class: "r-keys" },
        row(keys.toggle, "show or hide"),
        row(keys.answer, "answer this question"),
        row(keys.auto, "Auto Answer on or off")));
  }

  function renderChat(chat) {
    log.replaceChildren(...(chat.log.length ? chat.log.map(entryNode) : [emptyState()]));
    for (const node of log.children) node.style.animation = "none";
    if (thinking) log.append(thinking);
    privateTag.hidden = !chat.private;
    setHints(chat.hints);
    scrollDown();
  }

  function setHints(count) {
    hintBadge.hidden = !count;
    hintBadge.textContent = String(count);
  }

  function applyAppearance(settings = Settings.load()) {
    const accent = CONFIG.ui.accents.find(entry => entry.id === settings.accent) || CONFIG.ui.accents[0];
    root.dataset.scheme = scheme(settings);
    root.dataset.density = settings.density;
    root.dataset.solid = String(Boolean(settings.reduceTransparency));
    root.style.setProperty("--accent-dark", accent.dark);
    root.style.setProperty("--accent-light", accent.light);
    updateLauncher();
  }

  function scheme(settings = Settings.load()) {
    return settings.theme === "system" ? (systemDark.matches ? "dark" : "light") : settings.theme;
  }

  function place(left, top) {
    const rect = panel.getBoundingClientRect();
    panel.style.left = `${Math.max(8, Math.min(left, innerWidth - rect.width - 8))}px`;
    panel.style.top = `${Math.max(8, Math.min(top, innerHeight - rect.height - 8))}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
  }

  function clampPosition() {
    const saved = Store.get("position", null);
    if (saved) place(saved.left, saved.top);
  }

  function makeDraggable() {
    let start = null;
    head.addEventListener("pointerdown", e => {
      if (e.button !== 0 || e.target.closest("button")) return;
      const rect = panel.getBoundingClientRect();
      start = { x: e.clientX, y: e.clientY, dx: e.clientX - rect.left, dy: e.clientY - rect.top, moved: false };
      head.setPointerCapture(e.pointerId);
    });
    head.addEventListener("pointermove", e => {
      if (!start) return;
      if (!start.moved && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 4) return;
      start.moved = true;
      panel.dataset.dragging = "true";
      place(e.clientX - start.dx, e.clientY - start.dy);
    });
    const end = () => {
      if (!start) return;
      const moved = start.moved;
      start = null;
      delete panel.dataset.dragging;
      if (!moved) return;
      const rect = panel.getBoundingClientRect();
      Store.set("position", { left: rect.left, top: rect.top });
    };
    head.addEventListener("pointerup", end);
    head.addEventListener("pointercancel", end);
    head.addEventListener("dblclick", e => {
      if (e.target.closest("button")) return;
      Store.set("position", null);
      Object.assign(panel.style, { left: "", top: "", right: "", bottom: "" });
    });
  }

  const onScheme = () => applyAppearance();
  launcher.addEventListener("click", () => setOpen(true));
  host.addEventListener("keydown", e => {
    if (e.key === "Escape" && view !== "main") showView("main");
  });
  window.addEventListener("resize", clampPosition);
  systemDark.addEventListener("change", onScheme);
  makeDraggable();
  applyAppearance();

  return {
    host,
    island,

    status(text, options) {
      island.show(text, options);
    },

    boot(open) {
      if (open) {
        panel.dataset.boot = "true";
        requestAnimationFrame(() => setOpen(true, true));
        setTimeout(() => delete panel.dataset.boot, 900);
      } else {
        updateLauncher();
      }
    },

    remove() {
      window.removeEventListener("resize", clampPosition);
      systemDark.removeEventListener("change", onScheme);
      host.remove();
    },

    isOpen,
    setOpen,
    toggle() {
      setOpen(!isOpen());
    },
    showView,
    view: () => view,
    scheme,
    applyAppearance,
    renderChat,
    setHints,
    refreshChats() {
      if (view === "chats") chatList.render();
    },
    refreshSettings() {
      settingsView.refresh();
    },
    updateLauncher,
    canAutoAnswer: () => view !== "setup" && (view !== "settings" || !isOpen()),

    setAuto(enabled, count) {
      autoButton.setAttribute("aria-pressed", String(enabled));
      launcher.dataset.auto = String(enabled);
      autoCount.hidden = !enabled || !count;
      autoCount.textContent = `${count} done`;
    },

    setSite(label, pinned) {
      siteText.textContent = label;
      areaText.textContent = pinned ? "Area set" : "Area";
      areaButton.dataset.active = String(pinned);
    },

    setModel(label) {
      modelText.textContent = label;
    },

    setPrivate(isPrivate) {
      privateTag.hidden = !isPrivate;
    },

    log(entry) {
      log.querySelector(".r-empty")?.remove();
      log.insertBefore(entryNode(entry), thinking);
      scrollDown();
    },

    setThinking(text) {
      if (!thinking) return;
      thinking.lastChild.textContent = text;
    },

    setBusy(value, text = "Thinking") {
      busy = value;
      [...actions, autoButton, areaButton].forEach(button => { button.disabled = value; });
      sendButton.dataset.stop = String(value);
      sendButton.title = value ? "Stop" : "Send";
      sendButton.setAttribute("aria-label", sendButton.title);
      sendButton.replaceChildren(icon(value ? "stop" : "arrowUp"));
      thinking?.remove();
      thinking = value ? h("div", { class: "r-thinking", "aria-label": "Thinking" }, rainfall(), h("span", { text })) : null;
      if (thinking) {
        log.append(thinking);
        scrollDown();
      } else {
        island.settle();
      }
    }
  };
}
