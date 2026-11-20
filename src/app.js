const MODE_LABELS = {
  explain: "Explain this question",
  hint: "Give me a hint",
  answer: "Auto answer this question",
  choice: "Answer this question",
  check: answer => `Check my answer: ${answer}`,
  chat: text => text
};

function createApp() {
  let panel = null;
  let busy = false;
  let picking = false;
  let auto = false;
  let autoKey = null;
  let autoCount = 0;
  let scanning = false;
  let pendingFill = null;
  let controller = null;
  let filledAt = 0;
  let filledPrompt = null;
  let keys = Settings.load().keys;
  let chat = Chats.create(Question.site().label);
  const answered = new Set();

  let lastAsk = null;
  let teardown = () => {};

  const say = (role, text, extra = {}) => {
    const entry = { role, text, at: Date.now(), ...extra };
    chat.log.push(entry);
    panel.log(entry);
  };

  const status = (text, options) => panel.status(text, options);

  function cancelFill() {
    if (!pendingFill) return;
    clearTimeout(pendingFill.timer);
    pendingFill.resolve(false);
    pendingFill = null;
    status("Cancelled");
  }

  function countdown(delay, text, signal) {
    return new Promise(resolve => {
      const job = { resolve };
      pendingFill = job;
      signal.addEventListener("abort", () => {
        if (pendingFill === job) cancelFill();
      }, { once: true });
      if (delay > 0) status(`${text} in ${(delay / 1000).toFixed(1)}s`, { countdown: delay, action: { label: "Cancel", run: cancelFill } });
      job.timer = setTimeout(() => {
        if (pendingFill !== job) return;
        pendingFill = null;
        resolve(true);
      }, delay);
    });
  }

  async function submitAnswer(question, automatic) {
    const settings = Settings.load();
    if (!settings.autoFill || !settings.autoSubmit) return false;
    if (!(await countdown(Autofill.submitDelay(settings), "Submitting", controller.signal))) return false;
    const live = await Question.read(false, true);
    if ((automatic && !auto) || document.hidden || (live?.key !== question.key && live?.prompt !== question.prompt)) {
      status("Question changed, submit skipped");
      return false;
    }

    const forward = Question.advanceButton();
    const submit = forward ? null : Question.submitButton();
    const button = forward || submit;
    if (!button) {
      status("Couldn't find the Submit or Next button", { tone: "error" });
      return false;
    }
    await pressElement(button);
    await settle(300, 2000);
    const confirm = Question.confirmButton();
    if (confirm) {
      await pressElement(confirm);
      await settle(300, 2000);
    }
    Sounds.play("action");
    say("action", submit ? "Submitted the answer" : "Went to the next question");
    Stats.bump(submit ? "submitted" : "advanced");
    if (!submit) {
      Question.advance();
      return true;
    }

    const site = Question.site();
    const next = site.done && Question.findButton(site.done);
    if (next && (await countdown(Autofill.submitDelay(settings), "Next question", controller.signal)) && (!automatic || auto)) {
      const still = Question.findButton(site.done);
      if (still) {
        await pressElement(still);
        Question.advance();
        Stats.bump("advanced");
        say("action", "Went to the next question");
      }
    }
    return true;
  }

  function history() {
    const settings = Settings.load();
    const starts = chat.starts;
    const from = settings.memory === "chat" ? starts[Math.max(0, starts.length - 3)] : starts.at(-1);
    return chat.messages.slice(from ?? 0);
  }

  function startQuestion(question) {
    if (question.key !== chat.questionKey) {
      if (chat.log.length) say("divider", "New question");
      chat.questionKey = question.key;
      chat.hints = 0;
      Chats.name(chat, question.prompt || question.text);
    }
    chat.starts.push(chat.messages.length);
  }

  async function converse({ settings, mode, tools, automatic, question, messages, quiet = false }) {
    const signal = controller.signal;
    const texts = [];
    let cleared = false;
    let acted = false;
    let output = 0;

    for (let round = 0; round < CONFIG.api.maxToolRounds; round++) {
      const reply = await AI.send({
        settings,
        system: Prompts.systemFor(mode, tools, quiet),
        messages,
        tools: tools ? Tools.definitions : null,
        signal
      });
      Stats.add(reply.usage);
      output += reply.usage?.output || 0;
      messages.push({ role: "assistant", content: reply.content });

      if (reply.text && quiet) {
        texts.push(reply.text);
      } else if (reply.text) {
        Sounds.play("reply");
        say(!texts.length && (mode === "answer" || mode === "choice") ? "answer" : "rain", reply.text);
        texts.push(reply.text);
      }
      const calls = reply.content.filter(block => block.type === "tool_use");
      if (reply.stopReason !== "tool_use" && !(reply.stopReason === "max_tokens" && calls.length)) break;

      const results = [];
      let stopped = false;
      let before = null;
      for (const call of calls) {
        if (Tools.acts(call.name) && !cleared) {
          const live = await Question.read(false, true);
          const allowed = (!automatic || auto) && !document.hidden && panel.canAutoAnswer() && live?.key === question.key;
          if (!allowed || !(await countdown(Autofill.delay(Settings.load()), "Entering answer", signal))) {
            stopped = true;
            break;
          }
          if ((automatic && !auto) || (await Question.read(false, true))?.key !== question.key) {
            status("Question changed, autofill skipped");
            stopped = true;
            break;
          }
          cleared = true;
        }
        if (signal.aborted) throw new RainError("Stopped");
        status(Tools.acts(call.name) ? "Working on the page" : "Checking the page", { busy: true });
        panel.setThinking(Tools.acts(call.name) ? "Entering the answer" : "Checking the page");
        if (Tools.acts(call.name) && before === null) before = Tools.controls();
        const { result, summary } = await Tools.run(call);
        if (summary) {
          acted = true;
          Sounds.play("action");
          say("action", summary);
        }
        results.push(result);
      }
      if (stopped) break;
      if (before !== null) Tools.attach(results.at(-1), await Tools.changes(before));
      if (reply.stopReason === "max_tokens") results.push({ type: "text", text: "Your last reply was cut off by the length limit. Keep explanations to one line and continue entering the rest of the answer, using drag_many or fill_many for many blanks." });
      messages.push({ role: "user", content: results });
      status("Thinking", { busy: true });
      panel.setThinking("Thinking");
    }

    if (signal.aborted) throw new RainError("Stopped");
    if (acted) {
      filledAt = Date.now();
      filledPrompt = question.prompt;
    }
    return { text: texts.join("\n\n").trim(), acted, output };
  }

  const label = (mode, input) => {
    const entry = MODE_LABELS[mode];
    return typeof entry === "function" ? entry(input) : entry;
  };

  const refreshSite = () => panel.setSite(Question.site().label, Boolean(Question.pinned?.isConnected));

  function persist() {
    Chats.save(chat);
    panel.refreshChats();
  }

  function needKey() {
    status(`Add your ${Settings.provider().spec.label} API key to start`, { action: { label: "Open", run: () => panel.showView("settings", "model") } });
  }

  const app = {
    recording: false,

    chat: () => chat,

    async ask(mode, input, expectedKey, attachments = []) {
      if (busy || picking) return;
      const automatic = mode === "answer";
      if (!automatic) lastAsk = { mode, input, attachments };
      if (mode === "chat" && !input && attachments.length) input = "Look at the attached image and help me with it.";
      cancelFill();

      const settings = Settings.load();
      if (!Settings.ready(settings)) {
        if (!automatic) panel.showView("settings", "model");
        needKey();
        return;
      }

      busy = true;
      controller = new AbortController();
      const model = AI.label(settings);
      panel.setBusy(true, `Thinking with ${model}`);
      status("Reading the question", { busy: true });

      try {
        const changedBeforeAnswering = () => {
          answered.delete(expectedKey);
          autoKey = null;
          status("Waiting for a question…", { idle: true });
        };
        const tools = settings.autoFill && ["answer", "choice", "chat"].includes(mode);
        const scoped = automatic || (tools && Boolean(Question.root(true)));
        let question = await Question.read(false, scoped);
        if (!question) throw new RainError("Couldn't find the question. Press Area and click it.");
        if (automatic && (question.key !== expectedKey || !question.ready)) return changedBeforeAnswering();

        const current = chat.starts.at(-1);
        const fresh = mode === "choice" || automatic || question.key !== chat.questionKey || current === undefined || chat.messages.length <= current;
        if (fresh) {
          question = await Question.read(true, scoped);
          if (automatic && (question?.key !== expectedKey || (await Question.read(false, true))?.key !== expectedKey)) {
            return changedBeforeAnswering();
          }
          if (!question.text && !question.images.length) throw new RainError("Couldn't find a question on this page. Press Area and click it.");
          startQuestion(question);
        }
        if (mode === "chat") Chats.name(chat, input);

        if (mode === "hint") chat.hints += 1;
        panel.setHints(chat.hints);
        const enter = tools && mode !== "chat" ? "\n\nThen enter the answer on the page with the tools." : "";
        const graded = tools && (mode === "answer" || mode === "choice");
        const miss = graded && Accuracy.decide(settings);
        const quiet = graded && settings.replyStyle === "quiet";
        const turn = quiet
          ? Prompts.quietTurn + (miss ? `\n\n${Prompts.miss}` : "")
          : Prompts.turn(mode, input, chat.hints) + enter + (miss ? `\n\n${Prompts.miss}` : "");
        const attached = attachments.map(item => item.block);
        const note = attached.length ? `\n\nThe student attached ${attached.length} image${attached.length > 1 ? "s" : ""} of their own.` : "";
        const content = fresh
          ? [...question.images, ...attached, { type: "text", text: `${Prompts.context(question)}\n\n---\n\n${turn}${note}` }]
          : [...attached, { type: "text", text: turn + note }];

        if (!quiet) say("you", attachments.length && mode === "chat" && input.startsWith("Look at the attached image") ? "" : label(mode, input), attachments.length ? { images: attachments.map(item => item.thumb) } : {});
        const message = { role: "user", content };
        const messages = [...history(), message];
        status(`Thinking with ${model}`, { busy: true });

        try {
          if (mode === "choice" && auto) answered.add(question.key);
          const result = await converse({ settings, mode, tools: tools && scoped, automatic, question, messages, quiet });
          if (quiet && !result.acted && result.text) say("rain", result.text);
          const reply = result.text || (result.acted ? "Entered the answer on the page." : "");
          if (reply) chat.messages.push(message, { role: "assistant", content: [{ type: "text", text: reply }] });
          if (!result.text && !result.acted) say("note", "No reply text");
          if (result.acted && graded) {
            Accuracy.record(miss);
            if (miss) say("note", "Entered a wrong answer on purpose, from your accuracy setting");
          }
          if (result.acted) {
            Stats.bump("answered");
            if (automatic) panel.setAuto(auto, ++autoCount);
          }
          const images = fresh && question.images.length ? `, ${question.images.length} image${question.images.length > 1 ? "s" : ""}` : "";
          status(result.acted ? "Answer entered" : `${result.output.toLocaleString()} tokens${images}`, { tone: result.acted ? "ok" : null, important: result.acted });
          if (result.acted) Sounds.play("success");
          if (result.acted && mode !== "chat" && await submitAnswer(question, automatic)) status("Submitted", { tone: "ok" });
        } catch (err) {
          if (mode === "hint") chat.hints -= 1;
          throw err;
        }
      } catch (err) {
        if (controller?.signal.aborted) {
          say("note", "Stopped");
          status("Stopped");
        } else {
          const text = err instanceof RainError ? err.message : `Something broke: ${err.message}`;
          say("error", text);
          status(text, { tone: "error" });
          Sounds.play("error");
        }
      } finally {
        busy = false;
        controller = null;
        panel.setBusy(false);
        panel.setHints(chat.hints);
        persist();
      }
    },

    stop() {
      controller?.abort();
    },

    toggleAuto() {
      if (!auto && !Settings.ready()) {
        panel.showView("settings", "model");
        needKey();
        return;
      }
      auto = !auto;
      cancelFill();
      autoKey = null;
      autoCount = 0;
      answered.clear();
      panel.setAuto(auto, 0);
      Sounds.play(auto ? "on" : "off");
      status(auto ? "Auto Answer on, waiting for a question…" : "Auto Answer off", { tone: auto ? "ok" : null });
    },

    async pick() {
      if (busy || picking) return;
      picking = true;
      cancelFill();
      autoKey = null;
      const wasOpen = panel.isOpen();
      status("Click the question on the page");
      let el;
      try {
        el = await pickElement(Question.root()?.el);
      } finally {
        picking = false;
      }

      if (el) {
        Question.pin(el);
        answered.clear();
        chat.questionKey = null;
        status("Question area set for this page", { tone: "ok" });
      } else {
        status("Pick cancelled");
      }
      if (wasOpen && !panel.isOpen()) panel.setOpen(true);
      refreshSite();
    },

    newChat(isPrivate = Settings.load().privateMode, show = false) {
      if (busy) return;
      cancelFill();
      persist();
      chat = Chats.create(Question.site().label, isPrivate);
      panel.renderChat(chat);
      if (show) panel.showView("main");
      status(isPrivate ? "Private chat, nothing is saved" : "New chat");
    },

    openChat(id) {
      if (busy) return;
      if (id === chat.id) {
        panel.showView("main");
        return;
      }
      const loaded = Chats.load(id);
      if (!loaded) {
        status("That chat is gone", { tone: "error" });
        panel.refreshChats();
        return;
      }
      persist();
      chat = loaded;
      panel.renderChat(chat);
      panel.showView("main");
    },

    deleteChat(id) {
      Chats.remove(id);
      if (id === chat.id) {
        chat = Chats.create(Question.site().label);
        panel.renderChat(chat);
      }
      Sounds.play("tick");
      panel.refreshChats();
    },

    clearChats() {
      Chats.clear();
      chat = Chats.create(Question.site().label);
      panel.renderChat(chat);
      status("Deleted every chat");
    },

    async exportChats() {
      try {
        await copyText(Chats.export());
        status(`Copied ${Chats.index().length} chats`, { tone: "ok" });
      } catch {
        status("Couldn't copy on this page", { tone: "error" });
      }
    },

    async testConnection() {
      const settings = Settings.load();
      const provider = Settings.provider(settings);
      if (!provider.apiKey) {
        status("Paste a key first", { tone: "error" });
        return;
      }
      status(`Testing ${provider.spec.label}…`, { busy: true });
      try {
        const reply = await AI.send({ settings, system: "Reply with the single word: ok", messages: [{ role: "user", content: [{ type: "text", text: "ping" }] }] });
        Stats.add(reply.usage);
        status(`${AI.label(settings)} works`, { tone: "ok" });
        Sounds.play("success");
      } catch (err) {
        status(err.message, { tone: "error" });
        Sounds.play("error");
      }
    },

    settingsChanged(settings) {
      keys = settings.keys;
      panel.applyAppearance(settings);
      panel.setModel(AI.label(settings));
      if (!Settings.ready(settings) && auto) app.toggleAuto();
      autoKey = null;
      answered.clear();
    },

    status,

    retry() {
      if (!lastAsk || busy) return;
      app.ask(lastAsk.mode, lastAsk.input, undefined, lastAsk.attachments);
    },

    switchModel(providerId, model, quiet = false) {
      const settings = Settings.load();
      const recent = [{ provider: providerId, model }, ...settings.recentModels.filter(entry => entry.provider !== providerId || entry.model !== model)].slice(0, 8);
      const next = Settings.save({
        provider: providerId,
        providers: { ...settings.providers, [providerId]: { ...settings.providers[providerId], model } },
        recentModels: recent
      });
      app.settingsChanged(next);
      if (!quiet) {
        Sounds.play("tick");
        status(`Switched to ${AI.label(next)}`, { tone: "ok" });
      }
    },

    async checkConnection() {
      const settings = Settings.load();
      try {
        const reply = await AI.send({ settings, system: "Reply with the single word: ok", messages: [{ role: "user", content: [{ type: "text", text: "ping" }] }] });
        Stats.add(reply.usage);
        Sounds.play("success");
        return { ok: true, text: `${AI.label(settings)} is connected.` };
      } catch (err) {
        Sounds.play("error");
        return { ok: false, text: err.message };
      }
    },

    renameChat(id, title) {
      if (id === chat.id) {
        chat.title = title;
        persist();
      }
      Chats.update(id, { title });
      panel.refreshChats();
    },

    pinChat(id, pinned) {
      if (id === chat.id) chat.pinned = pinned;
      Chats.update(id, { pinned });
      Sounds.play("tick");
      panel.refreshChats();
    },

    rerender() {
      panel.renderChat(chat);
    },

    resetPosition() {
      panel.resetPosition();
    },

    resetSettings() {
      const keep = Settings.load().providers;
      Store.set("settings", { providers: keep });
      const fresh = Settings.load();
      app.settingsChanged(fresh);
      Tweaks.apply(fresh);
      panel.showView("settings");
      status("Settings reset", { tone: "ok" });
    },

    applyStealth() {
      const settings = Settings.load();
      panel.updateLauncher();
      if (settings.stealth) panel.island.hide();
    },

    panic() {
      const settings = Settings.load();
      if (auto) app.toggleAuto();
      app.stop();
      cancelFill();
      if (settings.panicAction === "hide") {
        panel.island.hide();
        panel.setOpen(false, true);
        Question.pin(null);
        return;
      }
      teardown();
      window.__rain = undefined;
      if (settings.panicAction === "leave" && /^https?:\/\//i.test(settings.panicUrl || "")) location.replace(settings.panicUrl);
    },

    finishSetup() {
      panel.showView("main");
      const parts = Keys.parts(Settings.load().keys.toggle);
      status([h("b", { text: CONFIG.name }), " is ready", ...(parts.length ? [". Press ", ...parts.map(part => h("kbd", { text: part })), " to show or hide"] : [])], { tone: "ok", important: true });
    },
    previewIsland() {
      panel.island.apply();
      status("This is how Rain's status looks", { important: true });
    },
    cancelFill,
    scheme: () => panel.scheme(),
    showView: (name, tab) => panel.showView(name, tab),

    runKey(action) {
      if (action === "toggle") panel.toggle();
      else if (action === "auto") app.toggleAuto();
      else if (action === "answer") app.ask("choice");
      else if (action === "pick") app.pick();
      else if (action === "panic") app.panic();
    }
  };

  panel = createPanel(app);
  refreshSite();
  panel.setModel(AI.label());
  panel.renderChat(chat);
  Tweaks.apply();

  const settings = Settings.load();
  if (Settings.ready(settings)) Store.set("setup", true);
  const setup = !Store.get("setup", false);
  const open = Store.get("open", settings.openOnStart);
  panel.boot(setup || (settings.openOnStart && open && !settings.stealth));
  if (setup) panel.showView("setup");
  const toggleParts = Keys.parts(settings.keys.toggle);
  if (setup) {
    panel.island.boot([h("b", { text: CONFIG.name }), " is installed. Let's set it up"], { tone: "ok" });
  } else if (!Settings.ready(settings)) {
    panel.island.boot([h("b", { text: CONFIG.name }), ` on ${Question.site().label}. Add an API key to start`], { action: { label: "Open", run: () => panel.showView("settings", "model") } });
  } else {
    panel.island.boot([h("b", { text: CONFIG.name }), ` on ${Question.site().label}`, ...(toggleParts.length ? [". Press ", ...toggleParts.map(part => h("kbd", { text: part })), " to show or hide"] : [])], {
      click: () => panel.setOpen(true),
      duration: 2800
    });
  }

  const onKey = e => {
    if (app.recording || e.repeat) return;
    const action = Keys.action(e, keys);
    if (!action) return;
    e.preventDefault();
    e.stopPropagation();
    app.runKey(action);
  };
  window.addEventListener("keydown", onKey, true);

  const onClick = e => Question.noteClick(e);
  document.addEventListener("click", onClick, true);
  const unwatch = Question.watch();
  const onLeave = () => Chats.save(chat);
  window.addEventListener("pagehide", onLeave);

  let lastPath = location.pathname;
  const timer = setInterval(async () => {
    Question.track();
    if (location.pathname !== lastPath || (Question.pinned && !Question.pinned.isConnected)) {
      cancelFill();
      lastPath = location.pathname;
      Question.pin(null);
      autoKey = null;
      refreshSite();
      Tweaks.apply();
    }
    if (!auto || busy || picking || scanning || document.hidden || !panel.canAutoAnswer()) return;
    if (!Settings.ready()) {
      app.toggleAuto();
      return;
    }
    scanning = true;
    try {
      const question = await Question.read(false, true);
      if (!Question.loads && Date.now() - filledAt < 3500 && question?.prompt === filledPrompt) {
        if (question?.key) answered.add(question.key);
        return;
      }
      const previous = autoKey;
      autoKey = question?.key ?? null;
      if (!question) {
        status(Question.site().requireGroup ? "Waiting for a question…" : "Press Area so Auto Answer knows what to read", { idle: true });
      } else if (!question.ready) {
        status("Waiting for the next question…", { idle: true });
      } else if ((question.text || question.hasMedia) && previous === autoKey && !answered.has(autoKey)) {
        answered.add(autoKey);
        await app.ask("answer", undefined, autoKey);
      }
    } catch (err) {
      status(`Couldn't read the question: ${err.message}`, { tone: "error", idle: true });
    } finally {
      scanning = false;
    }
  }, 850);

  teardown = () => {
    auto = false;
    cancelFill();
    clearInterval(timer);
    Chats.save(chat);
    window.removeEventListener("keydown", onKey, true);
    window.removeEventListener("pagehide", onLeave);
    document.removeEventListener("click", onClick, true);
    unwatch();
    Tweaks.clear();
    panel.remove();
  };

  return {
    version: CONFIG.version,
    show: () => panel.setOpen(true),
    remove: () => teardown()
  };
}
