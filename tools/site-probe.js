(() => {
  if (window.__probe) window.__probe.stop();

  const started = performance.now();
  const timeline = [];
  const STATIC = /\.(js|css|png|jpe?g|gif|svg|webp|woff2?|ttf|ico|map)(\?|$)/i;
  const visible = el => el.isConnected && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
  const text = el => (el.matches?.("input, textarea, select") ? el.value : el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
  const stamp = () => `${((performance.now() - started) / 1000).toFixed(2)}s`;

  const path = el => {
    const parts = [];
    for (let node = el; node && node !== document.body && parts.length < 7; node = node.parentElement) {
      const id = node.id ? `#${node.id}` : "";
      const cls = [...node.classList].slice(0, 3).map(c => `.${c}`).join("");
      parts.unshift(`${node.tagName.toLowerCase()}${id}${cls}`);
    }
    return parts.join(" > ");
  };

  const snapshot = () => {
    const buttons = [...document.querySelectorAll("button, a, [role='button'], input[type='button'], input[type='submit']")]
      .filter(visible)
      .map(el => ({ text: text(el), disabled: el.matches(":disabled, [aria-disabled='true']"), path: path(el) }))
      .filter(b => b.text && b.text.length <= 40);

    const headings = [...document.querySelectorAll("h1, h2, h3, h4, h5, h6, b, strong, [class*='title' i], [class*='header' i]")]
      .filter(visible).map(text).filter(t => t && t.length <= 60);

    const dialogs = [...document.querySelectorAll("[role='dialog'], [aria-modal='true'], .modal, [class*='modal' i], [class*='dialog' i], [class*='popup' i]")]
      .filter(visible).map(el => ({ text: text(el).slice(0, 160), path: path(el) }));

    const fields = [...document.querySelectorAll("input:not([type='hidden']), textarea, select, .mq-editable-field, math-field")]
      .filter(el => visible(el) && !el.closest(".mq-editable-field textarea"))
      .map(el => ({
        tag: el.tagName.toLowerCase(),
        type: el.type || "",
        value: el.matches(".mq-editable-field") ? text(el) : el.value ?? "",
        disabled: el.matches(":disabled, [readonly]"),
        path: path(el)
      }));

    const math = [...document.querySelectorAll(".katex annotation, script[type^='math/tex'], .mq-math-mode:not(.mq-editable-field)")]
      .filter(el => el.tagName === "SCRIPT" || visible(el.closest(".katex, .mq-math-mode") || el))
      .map(el => text(el)).filter(Boolean).slice(0, 12);

    const graphs = [...document.querySelectorAll(".jxgbox, .JXGboard, svg, canvas")]
      .filter(el => visible(el) && el.getBoundingClientRect().width >= 150 && !el.parentElement?.closest("svg"))
      .map(el => ({ tag: el.tagName.toLowerCase(), id: el.id, children: el.querySelectorAll("*").length, path: path(el) }));

    const frames = [...document.querySelectorAll("iframe")].filter(visible).map(frame => {
      let sameOrigin = false;
      try {
        sameOrigin = Boolean(frame.contentDocument);
      } catch {}
      const rect = frame.getBoundingClientRect();
      return { src: frame.src.slice(0, 200), size: `${Math.round(rect.width)}x${Math.round(rect.height)}`, sameOrigin, path: path(frame) };
    });
    const choices = [...document.querySelectorAll("input[type='radio'], input[type='checkbox'], [role='radio'], [role='checkbox'], [role='option']")]
      .filter(visible).slice(0, 12)
      .map(el => ({ label: text(el.closest("label") || el.parentElement || el).slice(0, 80), checked: el.checked || el.getAttribute("aria-checked") === "true", path: path(el) }));
    const boards = Object.keys(window.JXG?.boards || {});
    const prompt = text(document.querySelector("main") || document.body).slice(0, 500);

    return { url: location.href, frame: window !== window.top, buttons, headings, dialogs, fields, choices, frames, math, graphs, boards, prompt };
  };

  const guess = snap => {
    const has = (list, pattern) => list.some(item => pattern.test(typeof item === "string" ? item : item.text));
    if (snap.dialogs.length) return has(snap.dialogs, /example/i) ? "examples-dialog" : "dialog";
    if (has(snap.buttons, /^(next problem|next question|got it|continue|next)$/i) || has(snap.headings, /^(solution|correct!?|sorry,? incorrect.*|explanation)$/i)) return "solution";
    if (snap.fields.some(f => !f.disabled) || snap.choices.length || snap.graphs.length) return "question";
    return "unknown";
  };

  const summary = snap => ({
    state: guess(snap),
    buttons: snap.buttons.map(b => b.disabled ? `${b.text} (disabled)` : b.text),
    headings: [...new Set(snap.headings)].slice(0, 12),
    dialogs: snap.dialogs.map(d => d.text),
    fields: snap.fields.map(f => `${f.tag}${f.type ? `[${f.type}]` : ""}=${JSON.stringify(f.value)}${f.disabled ? " (disabled)" : ""}`),
    math: snap.math,
    graphs: snap.graphs.map(g => `${g.tag}${g.id ? `#${g.id}` : ""} (${g.children} nodes)`),
    choices: snap.choices.map(c => `${c.checked ? "[x]" : "[ ]"} ${c.label}`),
    frames: snap.frames.map(f => `${f.size} ${f.sameOrigin ? "same-origin" : "cross-origin"} ${f.src}`),
    boards: snap.boards
  });

  const record = (kind, data) => {
    const entry = { t: stamp(), kind, ...data };
    timeline.push(entry);
    const colors = { state: "#0a84ff", change: "#8e8e93", network: "#30d158", click: "#ff9f0a", nav: "#bf5af2", typing: "#ff375f", mousedown: "#64d2ff", mouseup: "#64d2ff", dragstart: "#64d2ff", drop: "#64d2ff" };
    console.log(`%c[probe ${entry.t}] ${kind}`, `color:${colors[kind] || "#999"};font-weight:600`, data);
  };

  let last = summary(snapshot());
  record("state", { ...last, full: snapshot() });

  const diff = (before, after) => {
    const changed = {};
    for (const key of Object.keys(after)) {
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) changed[key] = { from: before[key], to: after[key] };
    }
    return changed;
  };

  let timer = null;
  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const snap = snapshot();
      const next = summary(snap);
      const changed = diff(last, next);
      if (!Object.keys(changed).length) return;
      if (changed.state) record("state", { from: last.state, to: next.state, changed, full: snap });
      else record("change", changed);
      last = next;
    }, 250);
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });

  const onClick = e => {
    if (e.target.id === "sch-buddy-host") return;
    const target = e.target.closest?.("button, a, [role='button'], input, select, .mq-editable-field, svg, canvas") || e.target;
    record("click", { text: text(target).slice(0, 60), path: path(target), trusted: e.isTrusted });
  };
  document.addEventListener("click", onClick, true);

  const onPress = e => {
    if (e.target.id === "sch-buddy-host" || e.target.closest?.("#sch-buddy-host")) return;
    const hit = e.type === "mouseup" ? document.elementFromPoint(e.clientX, e.clientY) || e.target : e.target;
    const chain = [];
    for (let node = hit, depth = 0; node && node !== document.body && depth < 5; node = node.parentElement, depth++) {
      chain.push(`${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ""} class="${node.className?.baseVal ?? node.className}" draggable=${node.getAttribute("draggable")} cursor=${getComputedStyle(node).cursor}`);
    }
    record(e.type, { x: e.clientX, y: e.clientY, text: text(hit).slice(0, 60), chain, html: hit.outerHTML.slice(0, 500) });
  };
  document.addEventListener("mousedown", onPress, true);
  document.addEventListener("mouseup", onPress, true);
  document.addEventListener("dragstart", onPress, true);
  document.addEventListener("drop", onPress, true);

  let lastTyping = 0;
  const onTyping = e => {
    if (e.target.closest?.("#sch-buddy-host") || e.target.id === "sch-buddy-host" || performance.now() - lastTyping < 1500) return;
    lastTyping = performance.now();
    const el = document.activeElement || e.target;
    record("typing", {
      event: e.type,
      key: e.key,
      tag: el?.tagName?.toLowerCase(),
      contentEditable: el?.isContentEditable || false,
      value: el ? text(el).slice(0, 80) : "",
      path: el ? path(el) : "",
      parentHtml: el?.parentElement?.outerHTML.slice(0, 600) || ""
    });
  };
  document.addEventListener("keydown", onTyping, true);
  document.addEventListener("input", onTyping, true);

  const nativeFetch = window.fetch;
  window.fetch = async function (input, init) {
    const url = typeof input === "string" ? input : input?.url;
    const method = init?.method || input?.method || "GET";
    const response = await nativeFetch.apply(this, arguments);
    if (url && !STATIC.test(url)) {
      let body = "";
      try { body = (await response.clone().text()).slice(0, 300); } catch {}
      record("network", { via: "fetch", method, url, status: response.status, body });
    }
    return response;
  };

  const nativeOpen = XMLHttpRequest.prototype.open;
  const nativeSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__probe = { method, url: String(url) };
    return nativeOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function (body) {
    const info = this.__probe;
    if (info && !STATIC.test(info.url)) {
      this.addEventListener("loadend", () => {
        let response = "";
        try { response = String(this.responseText || "").slice(0, 300); } catch {}
        record("network", { via: "xhr", method: info.method, url: info.url, status: this.status, sent: typeof body === "string" ? body.slice(0, 300) : "", body: response });
      });
    }
    return nativeSend.apply(this, arguments);
  };

  let lastUrl = location.href;
  const urlTimer = setInterval(() => {
    if (location.href === lastUrl) return;
    record("nav", { from: lastUrl, to: location.href });
    lastUrl = location.href;
  }, 300);

  window.__probe = {
    timeline,
    now: () => summary(snapshot()),
    dump() {
      const json = JSON.stringify(timeline, null, 1);
      try {
        copy(json);
      } catch {
        navigator.clipboard?.writeText(json);
      }
      console.log(`%c[probe] copied ${timeline.length} events (${(json.length / 1024).toFixed(1)} KB) to the clipboard`, "color:#0a84ff;font-weight:600");
      return timeline.length;
    },
    stop() {
      observer.disconnect();
      clearInterval(urlTimer);
      document.removeEventListener("click", onClick, true);
      ["mousedown", "mouseup", "dragstart", "drop"].forEach(type => document.removeEventListener(type, onPress, true));
      document.removeEventListener("keydown", onTyping, true);
      document.removeEventListener("input", onTyping, true);
      window.fetch = nativeFetch;
      XMLHttpRequest.prototype.open = nativeOpen;
      XMLHttpRequest.prototype.send = nativeSend;
      delete window.__probe;
      console.log("%c[probe] stopped", "color:#8e8e93");
    }
  };

  console.log("%c[probe] running. Use the site normally, then run __probe.dump() and paste the result.", "color:#0a84ff;font-weight:600");
})();
