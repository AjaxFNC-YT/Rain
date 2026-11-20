(() => {
  const lines = [];
  const started = performance.now();
  const stamp = () => ((performance.now() - started) / 1000).toFixed(2);
  const push = line => lines.length < 1500 && lines.push(line);
  const visible = el => el.getClientRects().length > 0 && el.getBoundingClientRect().width > 0;

  const name = el => {
    if (!el || el.nodeType !== 1) return String(el);
    const classes = typeof el.className === "string" ? el.className.trim().split(/\s+/).filter(Boolean).join(".") : "";
    const role = el.getAttribute("role");
    return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${classes ? `.${classes}` : ""}${role ? `[role=${role}]` : ""}`;
  };

  const chain = el => {
    const parts = [];
    for (let node = el; node && node.nodeType === 1 && parts.length < 6; node = node.parentElement) parts.push(name(node));
    return parts.join(" < ");
  };

  const ATTRS = ["tabindex", "draggable", "aria-label", "aria-grabbed", "aria-dropeffect", "aria-selected", "aria-pressed", "aria-disabled", "data-response-index", "data-index"];
  const skeleton = (el, depth = 0) => {
    if (depth > 16) return "";
    const attrs = ATTRS.filter(attr => el.hasAttribute(attr)).map(attr => ` ${attr}="${el.getAttribute(attr).slice(0, 40)}"`).join("");
    const own = [...el.childNodes].filter(node => node.nodeType === 3).map(node => node.textContent.trim()).filter(Boolean).join(" ").slice(0, 70);
    const style = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    const size = depth < 12 ? ` {${Math.round(box.width)}x${Math.round(box.height)}${style.cursor !== "auto" ? ` cursor:${style.cursor}` : ""}}` : "";
    return `${"  ".repeat(depth)}<${name(el)}${attrs}>${size}${own ? ` "${own}"` : ""}\n${[...el.children].map(child => skeleton(child, depth + 1)).join("")}`;
  };

  const widgets = [...document.querySelectorAll(".lrn_widget")].filter(visible);
  const widget = widgets.find(el => /drag|drop|assoc|cloze|possib|response/i.test(el.className + el.innerHTML)) || widgets[0];
  push(`[page] ${location.href}`);
  push(`[frames] ${document.querySelectorAll("iframe").length}, visible widgets: ${widgets.length}`);
  push(`[structure]\n${widget ? skeleton(widget) : "no visible .lrn_widget found"}`);

  let clicked = null;
  const record = e => {
    if (e.type === "pointermove" || e.type === "mousemove") return;
    const owner = e.isTrusted && e.type === "pointerdown" && e.target.closest?.(".lrn_widget");
    if (owner && owner !== clicked) {
      clicked = owner;
      push(`[clicked question structure]
${skeleton(owner)}`);
      observer.observe(owner, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "aria-selected", "aria-pressed", "aria-checked", "aria-grabbed", "style", "tabindex"] });
    }
    push(`[${stamp()}] ${e.type}${e.key ? ` key=${e.key}` : ""} trusted=${e.isTrusted} -> ${chain(e.target)}`);
  };
  const types = ["pointerdown", "pointerup", "mousedown", "mouseup", "click", "keydown", "dragstart", "dragenter", "drop", "dragend", "focusin", "touchstart"];
  types.forEach(type => document.addEventListener(type, record, true));

  var observer = new MutationObserver(records => {
    for (const change of records) {
      if (change.type === "attributes") {
        push(`[${stamp()}] attr ${change.attributeName} on ${name(change.target)} = ${String(change.target.getAttribute(change.attributeName)).slice(0, 90)}`);
      } else {
        change.addedNodes.forEach(node => node.nodeType === 1 && push(`[${stamp()}] added ${name(node)} "${node.textContent.trim().slice(0, 50)}" into ${chain(change.target)}`));
        change.removedNodes.forEach(node => node.nodeType === 1 && push(`[${stamp()}] removed ${name(node)} "${node.textContent.trim().slice(0, 50)}" from ${name(change.target)}`));
      }
    }
  });
  if (widget) {
    observer.observe(widget, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "aria-selected", "aria-pressed", "aria-grabbed", "style", "tabindex"] });
  }

  window.__dragProbe = {
    async dump() {
      const text = lines.join("\n");
      try {
        await navigator.clipboard.writeText(text);
        console.log(`Copied ${lines.length} lines. Paste them to Claude.`);
      } catch {
        console.log(text);
        console.log("Couldn't copy automatically, copy the text above.");
      }
    },
    stop() {
      types.forEach(type => document.removeEventListener(type, record, true));
      observer.disconnect();
      console.log("Drag probe stopped.");
    }
  };
  console.log("Probe ready. Answer ONE part of the question yourself (drag one answer, or click one choice). Then run: __dragProbe.dump()");
})();
