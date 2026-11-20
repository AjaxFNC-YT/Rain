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
  let attachments = [];

  const siteText = h("span", { class: "r-sub-site" });
  const activity = h("span", { class: "r-sub-activity" });
  const privateTag = h("span", { class: "r-tag", text: "Private", title: "This chat is not saved", hidden: true });
  const modelText = h("span");
  const modelButton = h("button", { class: "r-model-btn", type: "button", title: "Switch model", "aria-haspopup": "menu", onclick: () => toggleModelMenu() },
    modelText, icon("down"));
  const chatsButton = UI.iconButton("chats", "Chats", () => showView(view === "chats" ? "main" : "chats"));
  const settingsButton = UI.iconButton("gear", "Settings", () => showView(view === "settings" ? "main" : "settings"));
  const head = h("header", { class: "r-head" },
    h("div", { class: "r-title" },
      h("div", { class: "r-title-row" }, h("b", { text: CONFIG.name }), privateTag),
      h("div", { class: "r-sub" }, siteText, activity)),
    modelButton,
    h("div", { class: "r-head-tools" }, chatsButton, settingsButton, UI.iconButton("hide", "Hide", () => setOpen(false))));

  const autoButton = h("button", { class: "r-chip r-auto", type: "button", "aria-pressed": "false", "data-act": "auto", onclick: () => app.toggleAuto() },
    h("span", { class: "r-mini-switch", "aria-hidden": "true" }), h("span", { text: "Auto" }));
  const autoCount = h("span", { class: "r-count", hidden: true });
  const areaText = h("span", { text: "Area" });
  const areaButton = h("button", { class: "r-chip", type: "button", title: "Pick the part of the page Rain reads", onclick: () => app.pick() }, icon("scope"), areaText);
  const newButton = h("button", { class: "r-chip r-chip-quiet", type: "button", title: "Start a new chat", onclick: () => app.newChat(Settings.load().privateMode) }, icon("plus"), h("span", { text: "New chat" }));
  const toolbar = h("div", { class: "r-bar" }, autoButton, autoCount, areaButton, h("span", { class: "r-bar-gap" }), newButton);

  const log = h("div", { class: "r-log", role: "log", "aria-label": "Conversation" });

  const fileInput = h("input", { type: "file", accept: "image/*", multiple: true, hidden: true, onchange: e => {
    addFiles([...e.target.files]);
    e.target.value = "";
  } });
  const tray = h("div", { class: "r-tray", hidden: true });
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
    oninput: () => autosize(),
    onpaste: e => {
      const files = [...(e.clipboardData?.files || [])].filter(file => file.type.startsWith("image/"));
      if (!files.length) return;
      e.preventDefault();
      addFiles(files);
    }
  });
  const modeChip = h("button", { class: "r-mode", type: "button", hidden: true, title: "Back to chat", onclick: () => setComposeMode("chat") },
    h("span", { text: "Check" }), icon("xmark"));
  const attachButton = h("button", { class: "r-attach", type: "button", title: "Attach an image", "aria-label": "Attach an image", onclick: () => fileInput.click() }, icon("clip"));
  const sendButton = h("button", { class: "r-send", type: "button", title: "Send", "aria-label": "Send", "data-empty": "true", onclick: () => busy ? app.stop() : submit(composeMode) },
    icon("arrowUp"));

  const hintBadge = h("span", { class: "r-badge", hidden: true });
  const actions = [
    h("button", { class: "r-act", type: "button", text: "Explain", "data-act": "explain", onclick: () => submit("explain") }),
    h("button", { class: "r-act", type: "button", "data-act": "hint", onclick: () => submit("hint") }, h("span", { text: "Hint" }), hintBadge),
    h("button", { class: "r-act", type: "button", text: "Check", "data-act": "check", onclick: () => startCheck() }),
    h("button", { class: "r-act r-act-primary", type: "button", text: "Answer", "data-act": "answer", onclick: () => submit("choice") })
  ];
  const actionRow = h("div", { class: "r-actions" }, actions);

  const mainView = h("section", { class: "r-view r-view-main", "data-active": "true" },
    toolbar,
    log,
    h("footer", { class: "r-foot" },
      actionRow,
      tray,
      h("div", { class: "r-compose" }, attachButton, modeChip, input, sendButton, fileInput)));

  const menu = h("div", { class: "r-menu", role: "menu", hidden: true });
  const scrim = h("div", { class: "r-scrim", hidden: true, onclick: () => closeModelMenu() });
  const dropHint = h("div", { class: "r-drop", hidden: true }, icon("image"), h("span", { text: "Drop images to attach" }));

  const views = { main: mainView, chats: chatList.el, settings: settingsView.el, setup: setupView.el };
  const panel = h("div", { class: "r-panel", role: "region", "aria-label": CONFIG.name, "data-open": "false" },
    head,
    h("div", { class: "r-views" }, mainView, chatList.el, settingsView.el, setupView.el),
    scrim, menu, dropHint);
  const launcher = h("button", { class: "r-launcher", type: "button", hidden: true, title: `Open ${CONFIG.name}` }, h("i"), h("span", { text: CONFIG.name }));
  root.append(panel, launcher);

  function autosize() {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 140)}px`;
    sendButton.dataset.empty = String(!input.value.trim() && !attachments.length);
  }

  async function addFiles(files) {
    for (const file of files.filter(file => file.type.startsWith("image/")).slice(0, 4 - attachments.length)) {
      try {
        attachments.push(await imageFromFile(file));
      } catch (err) {
        island.show(err.message || "That image couldn't be read", { tone: "error" });
      }
    }
    renderTray();
    autosize();
    input.focus({ preventScroll: true });
  }

  function renderTray() {
    tray.hidden = !attachments.length;
    tray.replaceChildren(...attachments.map((item, i) => h("div", { class: "r-thumb" },
      h("img", { src: item.thumb, alt: "" }),
      h("button", { type: "button", title: "Remove", "aria-label": "Remove image", onclick: () => {
        attachments.splice(i, 1);
        renderTray();
        autosize();
      } }, icon("xmark")))));
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
    const images = attachments;
    if (mode === "check" && !text) {
      input.focus();
      island.show("Type your answer first");
      return;
    }
    if (mode === "chat" && !text && !images.length) {
      input.focus();
      island.show("Type a question first");
      return;
    }
    input.value = "";
    attachments = [];
    renderTray();
    autosize();
    if (mode === "check") setComposeMode("chat");
    Sounds.play("send");
    app.ask(mode, text, undefined, images);
  }

  function modelRows() {
    const settings = Settings.load();
    const current = Settings.provider(settings);
    return CONFIG.providers.filter(spec => settings.providers[spec.id].apiKey.trim()).map(spec => {
      const own = settings.providers[spec.id];
      const ready = true;
      const ids = [...spec.models.map(model => model.id), own.model, ...settings.recentModels.filter(entry => entry.provider === spec.id).map(entry => entry.model)]
        .map(id => String(id || "").trim()).filter((id, i, all) => id && all.indexOf(id) === i);
      const label = id => spec.models.find(model => model.id === id)?.label || id;
      return h("div", { class: "r-menu-group" },
        h("div", { class: "r-menu-head" }, h("span", { text: spec.id === "openai" ? "OpenAI compatible" : spec.label }), !ready && h("em", { text: "No key" })),
        ids.map(id => h("button", {
          class: "r-menu-item",
          type: "button",
          role: "menuitemradio",
          "aria-checked": String(current.id === spec.id && current.model === id),
          onclick: () => {
            closeModelMenu();
            if (!ready) {
              Settings.save({ provider: spec.id });
              showView("settings", "model");
              island.show(`Add a ${spec.label} key to use ${label(id)}`);
              return;
            }
            app.switchModel(spec.id, id);
          }
        }, h("span", { text: label(id) }), icon("check"))));
    });
  }

  function toggleModelMenu() {
    if (!menu.hidden) return closeModelMenu();
    const settings = Settings.load();
    const provider = Settings.provider(settings);
    menu.replaceChildren(
      h("div", { class: "r-menu-scroll" }, modelRows()),
      provider.spec.efforts && h("div", { class: "r-menu-foot" }, h("span", { text: "Effort" }),
        UI.segmented("Effort", CONFIG.efforts.map(effort => [effort, effort[0].toUpperCase() + effort.slice(1)]), settings.effort, effort => {
          app.settingsChanged(Settings.save({ effort }));
        })),
      h("button", { class: "r-menu-link", type: "button", text: "Model settings", onclick: () => {
        closeModelMenu();
        showView("settings", "model");
      } }));
    menu.hidden = false;
    scrim.hidden = false;
    modelButton.setAttribute("aria-expanded", "true");
  }

  function closeModelMenu() {
    menu.hidden = true;
    scrim.hidden = true;
    modelButton.setAttribute("aria-expanded", "false");
  }

  function showView(name, tab) {
    if (name !== "main" && !isOpen()) setOpen(true);
    if (view === "settings" && name !== "settings") settingsView.close();
    closeModelMenu();
    view = name;
    for (const [id, el] of Object.entries(views)) el.dataset.active = String(id === name);
    panel.dataset.setup = String(name === "setup");
    chatsButton.setAttribute("aria-pressed", String(name === "chats"));
    settingsButton.setAttribute("aria-pressed", String(name === "settings"));
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
    closeModelMenu();
    if (!quiet) Sounds.play(open ? "open" : "close");
    if (open) {
      clampPosition();
      setTimeout(() => input.focus({ preventScroll: true }), 60);
    } else if (!quiet && !Settings.load().stealth) {
      island.show([h("b", { text: CONFIG.name }), " hidden, press ", ...Keys.parts(Settings.load().keys.toggle).map(part => h("kbd", { text: part }))], {
        click: () => setOpen(true),
        duration: 2600
      });
    }
  }

  function updateLauncher() {
    const settings = Settings.load();
    launcher.hidden = isOpen() || !settings.launcher || settings.stealth;
  }

  function scrollDown() {
    log.scrollTop = log.scrollHeight;
  }

  function copyButton(text) {
    const button = h("button", { class: "r-tool", type: "button", title: "Copy", "aria-label": "Copy" }, icon("copy"));
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

  function stamp(at) {
    return Settings.load().look.times ? h("time", { class: "r-time", text: timeLabel(at) }) : null;
  }

  function entryNode({ role, text, at, images }) {
    if (role === "you") {
      return h("div", { class: "r-msg r-you" },
        images?.length ? h("div", { class: "r-you-images" }, images.map(src => h("img", { src, alt: "Attached image" }))) : null,
        text && h("div", { class: "r-bubble" }, h("div", { class: "r-body", text })),
        stamp(at));
    }
    if (role === "rain" || role === "answer") {
      return h("div", { class: `r-msg r-ai${role === "answer" ? " r-ai-answer" : ""}` },
        h("div", { class: "r-bubble" },
          role === "answer" && h("div", { class: "r-answer-label", text: "Answer" }),
          h("div", { class: "r-body" }, renderMarkdown(text))),
        h("div", { class: "r-tools" },
          copyButton(text),
          h("button", { class: "r-tool r-retry", type: "button", title: "Ask again", "aria-label": "Ask again", onclick: () => app.retry() }, icon("refresh")),
          stamp(at)));
    }
    if (role === "action") return h("div", { class: "r-msg r-action" }, icon("check"), h("span", { text }));
    if (role === "error") return h("div", { class: "r-msg r-error" }, icon("warn"), h("div", { text }));
    if (role === "divider") return h("div", { class: "r-msg r-divider" }, h("span", { text }), h("i"), h("time", { text: timeLabel(at) }));
    return h("div", { class: "r-msg r-note", text });
  }

  function markLatest() {
    const replies = log.querySelectorAll(".r-ai");
    replies.forEach((node, i) => { node.dataset.latest = String(i === replies.length - 1); });
  }

  function emptyState() {
    const keys = Settings.load().keys;
    const site = Question.site();
    const row = (combo, text) => combo ? [h("dt", {}, Keys.parts(combo).map(part => h("kbd", { text: part }))), h("dd", { text })] : [];
    return h("div", { class: "r-empty" },
      h("h2", { text: site.id === "generic" ? "Open a question to start" : `Ready on ${site.label}` }),
      h("p", { text: "Press Answer on any question, or ask about it below. Paste or drop a screenshot to ask about an image." }),
      h("dl", { class: "r-keys" },
        row(keys.answer, "answer this question"),
        row(keys.auto, "Auto Answer on or off"),
        row(keys.toggle, "show or hide"),
        row(keys.panic, "panic")));
  }

  function renderChat(chat) {
    log.replaceChildren(...(chat.log.length ? chat.log.map(entryNode) : [emptyState()]));
    for (const node of log.children) node.style.animation = "none";
    if (thinking) log.append(thinking);
    privateTag.hidden = !chat.private;
    markLatest();
    setHints(chat.hints);
    scrollDown();
  }

  function setHints(count) {
    hintBadge.hidden = !count;
    hintBadge.textContent = String(count);
  }

  function applyAppearance(settings = Settings.load()) {
    const accent = CONFIG.ui.accents.find(entry => entry.id === settings.accent) || CONFIG.ui.accents[0];
    const look = settings.look;
    const [width, height] = CONFIG.ui.sizes[look.size] || CONFIG.ui.sizes.regular;
    root.dataset.scheme = scheme(settings);
    root.dataset.density = settings.density;
    root.dataset.solid = String(Boolean(settings.reduceTransparency));
    root.dataset.bubbles = String(look.bubbles);
    root.style.setProperty("--accent-dark", accent.dark);
    root.style.setProperty("--accent-light", accent.light);
    root.style.setProperty("--panel-w", `${width}px`);
    root.style.setProperty("--panel-h", `${height}px`);
    root.style.setProperty("--size", `${look.text}px`);
    root.style.setProperty("--glass-a", String(Math.min(1, Math.max(.5, look.glass / 100))));
    autoButton.hidden = !look.toolbar.auto;
    areaButton.hidden = !look.toolbar.area;
    newButton.hidden = !look.toolbar.newChat;
    modelButton.hidden = !look.toolbar.model;
    toolbar.hidden = !look.toolbar.auto && !look.toolbar.area && !look.toolbar.newChat;
    actionRow.hidden = !look.actions;
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

  function resetPosition() {
    Store.set("position", null);
    Object.assign(panel.style, { left: "", top: "", right: "", bottom: "" });
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
      if (!e.target.closest("button")) resetPosition();
    });
  }

  function watchDrops() {
    let depth = 0;
    const hasImages = e => [...(e.dataTransfer?.items || [])].some(item => item.kind === "file" && item.type.startsWith("image/"));
    panel.addEventListener("dragenter", e => {
      if (!hasImages(e)) return;
      e.preventDefault();
      depth++;
      dropHint.hidden = false;
    });
    panel.addEventListener("dragover", e => {
      if (hasImages(e)) e.preventDefault();
    });
    panel.addEventListener("dragleave", () => {
      depth = Math.max(0, depth - 1);
      if (!depth) dropHint.hidden = true;
    });
    panel.addEventListener("drop", e => {
      if (!hasImages(e)) return;
      e.preventDefault();
      depth = 0;
      dropHint.hidden = true;
      if (view !== "main") showView("main");
      addFiles([...e.dataTransfer.files]);
    });
  }

  const onScheme = () => applyAppearance();
  launcher.addEventListener("click", () => setOpen(true));
  host.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if (!menu.hidden) closeModelMenu();
    else if (view !== "main" && view !== "setup") showView("main");
  });
  window.addEventListener("resize", clampPosition);
  systemDark.addEventListener("change", onScheme);
  makeDraggable();
  watchDrops();
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
    resetPosition,
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
      activity.textContent = enabled ? "Auto Answer on" : "";
    },

    setSite(label, pinned) {
      siteText.textContent = label;
      areaText.textContent = pinned ? "Area set" : "Area";
      areaButton.dataset.active = String(pinned);
    },

    setModel(label) {
      modelText.textContent = label.replace(/^Claude /, "");
      modelButton.title = `Model: ${label}`;
    },

    setPrivate(isPrivate) {
      privateTag.hidden = !isPrivate;
    },

    log(entry) {
      log.querySelector(".r-empty")?.remove();
      log.insertBefore(entryNode(entry), thinking);
      markLatest();
      scrollDown();
    },

    setThinking(text) {
      if (!thinking) return;
      thinking.lastChild.textContent = text;
    },

    setBusy(value, text = "Thinking") {
      busy = value;
      [...actions, autoButton, areaButton, newButton, modelButton].forEach(button => { button.disabled = value; });
      panel.dataset.busy = String(value);
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
