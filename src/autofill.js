const FIELD_SELECTOR = "input:not([type]), input[type='text'], input[type='number'], input[type='search'], input[type='tel'], textarea";
const MATH_FIELD_SELECTOR = ".mq-editable-field, math-field";
const RICH_SELECTOR = "[contenteditable='true'][role='textbox'], [contenteditable='true'][aria-multiline='true'], .lrn_texteditor_editable[contenteditable='true'], .ql-editor[contenteditable='true'], .ProseMirror[contenteditable='true'], [contenteditable='true'].wysihtml-editor";
const GENERIC_LABEL = /enter your (response|answer)|response to the question|type your (answer|response)|^(answer|response)$/i;
const GRAPH_SELECTOR = ".jxgbox, .JXGboard, svg, canvas";
const DRAG_SELECTOR = "[draggable='true'], [class*='drag' i], [class*='tile' i], [class*='token' i], [class*='chip' i], [aria-grabbed]";
const DROP_SELECTOR = "[class*='drop' i], [class*='target' i], [class*='slot' i], [class*='zone' i], [class*='bucket' i], [class*='blank' i], [aria-dropeffect]";
const ZONE_SELECTOR = "[class*='dropzone' i], [class*='drop-zone' i], [class*='drop_zone' i], [class*='droppable' i], [class*='dropTarget' i], [class*='drop-target' i], [class*='bucket' i], [aria-dropeffect]";
const DRAG_ITEM_SELECTOR = "[draggable='true'], [aria-grabbed], [class*='draggable' i], [class*='btn_drag' i], [class*='btn-drag' i], [role='button'], [role='option']";
const EDITOR_SELECTOR = ".yui3-sympadfiwidget, [class*='sympadfi' i]";
const EDITOR_NOISE = [".hidden", ".secret", "#symPadCursor", "[class*='live-region' i]", "[class*='cursor' i]"];
const EDITOR_PART = ".aitContentBox, .aitInput";
const TOOL_SKIP = /^(submit|check|next|skip|help|hint|video|example|show|hide|clear all|reset|undo|redo|close|cancel)\b/i;

const Autofill = {
  choiceSelector: "input[type='radio'], input[type='checkbox'], [role='checkbox'], [class*='SelectableTile'], [role='radio'], [role='option'], select:not([multiple]), button[data-answer-choice], button[data-choice], button[data-option], button[class*='answer-choice'], button[class*='answer-option'], [data-answer-choices] button[type='button'], [role='radiogroup'] button[type='button'], [class*='lrn_token' i], [class*='token' i][role='button'], [class*='token' i][aria-pressed], [class*='token' i][aria-checked], [class*='token' i][aria-selected]",

  available(el) {
    return el.isConnected && el.getClientRects().length &&
      !el.matches(":disabled, [readonly]") && !el.closest("[aria-disabled='true'], [inert], [hidden]") &&
      getComputedStyle(el).visibility === "visible";
  },

  choices(root) {
    const found = [...root.querySelectorAll(this.choiceSelector)].flatMap(el => {
      if (el.closest(`#${HOST_ID}`)) return [];
      if (el.matches("button") && (el.type === "submit" || el.type === "reset") && el.form) return [];
      if (el.tagName === "SELECT") {
        return this.available(el) ? [...el.options]
          .filter(option => clean(option.label || option.textContent) && !option.matches(":disabled, [hidden]"))
          .map(option => ({ el, label: clean(option.label || option.textContent), value: option.value, option })) : [];
      }
      const labels = [...(el.labels || [])];
      const visibleLabel = labels.find(label => this.available(label));
      const click = this.available(el) && !(visibleLabel && hiddenControl(el)) ? el : visibleLabel;
      if (!click || el.matches(":disabled") || el.closest("[aria-disabled='true'], [inert], [hidden]")) return [];
      const referenced = (el.getAttribute("aria-labelledby") || "").split(/\s+/)
        .map(id => el.ownerDocument.getElementById(id)?.textContent || "").join(" ").trim();
      const label = referenced || el.getAttribute("aria-label") ||
        (labels.length ? labels.map(label => spokenText(label)).join(" ") : spokenText(el));
      return label.trim() ? [{ el, click, label: clean(label) }] : [];
    });
    const single = found.filter(choice => choice.option ||
      found.filter(other => other !== choice && !other.option && choice.el.contains(other.el)).length < 2);
    return single.filter(choice => choice.option ||
      !single.some(other => other !== choice && !other.option && other.el.contains(choice.el)));
  },

  fields(root) {
    const math = [...root.querySelectorAll(MATH_FIELD_SELECTOR)]
      .filter(el => !el.parentElement?.closest(MATH_FIELD_SELECTOR) && el.getClientRects().length && !el.closest("[aria-disabled='true'], [inert], [hidden]"))
      .map(el => ({ el, kind: "math" }));
    const plain = [...root.querySelectorAll(FIELD_SELECTOR)]
      .filter(el => !el.closest(MATH_FIELD_SELECTOR) && !el.closest(`#${HOST_ID}`) && this.available(el))
      .map(el => ({ el, kind: el.closest(EDITOR_SELECTOR) ? "editor" : "text" }));
    const rich = [...root.querySelectorAll(RICH_SELECTOR)]
      .filter(el => !el.closest(`#${HOST_ID}`) && !el.parentElement?.closest(RICH_SELECTOR) && el.getClientRects().length && !el.closest("[aria-disabled='true'], [inert], [hidden]"))
      .map(el => ({ el, kind: "rich" }));
    return [...math, ...plain, ...rich]
      .sort((a, b) => a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)
      .map(field => ({ ...field, label: fieldLabel(field.el), value: fieldValue(field) }));
  },

  graphs(root) {
    const boards = jxgBoards();
    return [...root.querySelectorAll(GRAPH_SELECTOR)]
      .filter(el => {
        if (el.closest(`#${HOST_ID}`) || el.closest(MATH_SELECTOR)) return false;
        if (el.matches("svg, canvas") && el.parentElement?.closest(".jxgbox, .JXGboard, svg")) return false;
        const rect = el.getBoundingClientRect();
        return rect.width >= 120 && rect.height >= 120;
      })
      .map(el => graphInfo(el, boards))
      .filter(graph => graph.interactive);
  },

  dropdowns(root) {
    return [...root.querySelectorAll("select:not([multiple])")]
      .filter(el => !el.closest(`#${HOST_ID}`) && this.available(el))
      .map(el => ({
        el,
        current: clean(el.selectedOptions[0]?.label || el.selectedOptions[0]?.textContent),
        options: [...el.options]
          .filter(option => clean(option.label || option.textContent) && !option.matches(":disabled, [hidden]"))
          .map(option => ({ option, label: clean(option.label || option.textContent) }))
      }));
  },

  draggables(root) {
    const found = [...root.querySelectorAll(DRAG_SELECTOR)].filter(el => {
      if (el.closest(`#${HOST_ID}`) || !el.getClientRects().length || el.closest(this.choiceSelector)) return false;
      if (!el.matches("[draggable='true'], [aria-grabbed]") && (el.matches(ZONE_SELECTOR) || el.querySelector(ZONE_SELECTOR))) return false;
      const label = clean(el.innerText || el.textContent);
      if (!label || label.length > 240 || el.querySelector("input, select, textarea")) return false;
      const strong = el.matches("[draggable='true'], [class*='drag' i], [aria-grabbed]");
      return strong || ["grab", "move", "pointer"].includes(getComputedStyle(el).cursor);
    });
    const items = found.filter(el => !found.some(other => other !== el && el.contains(other) && other.matches(DRAG_ITEM_SELECTOR)));
    return outermost(items).map(el => ({ el, label: clean(el.innerText || el.textContent) }));
  },

  dropZones(root) {
    const items = this.draggables(root).map(item => item.el);
    if (!items.length) return [];
    const inside = el => items.filter(item => el.contains(item));
    const usable = el => !el.closest(`#${HOST_ID}`) && el.getClientRects().length && !items.some(item => item === el || item.contains(el)) && inside(el).length <= 1;
    const leftover = el => inside(el).reduce((text, item) => text.replace(clean(item.innerText || item.textContent), ""), clean(el.innerText || el.textContent)).trim();
    const strongZones = [...root.querySelectorAll(ZONE_SELECTOR)].filter(el => usable(el) && boxSize(el));
    let zones = strongZones.length ? strongZones : [...root.querySelectorAll(DROP_SELECTOR)].filter(el => usable(el) && boxSize(el));
    if (!zones.length) {
      zones = [...root.querySelectorAll("div, td, li, span")].filter(el => usable(el) && boxSize(el) &&
        !leftover(el) && !el.querySelector("input, select, textarea, svg, img, canvas") && looksLikeBox(el));
    }
    return innermost(zones).map(el => ({ el, label: zoneLabel(el), content: clean(el.innerText || el.textContent).slice(0, 80) }));
  },

  actionable(root) {
    if (this.draggables(root).length) return true;
    if (this.fields(root).length) return true;
    const choices = this.choices(root);
    if (choices.length >= 2 && !choices.some(isPicked)) return true;
    return this.graphs(root).length > 0;
  },

  snapshot(root) {
    return selectionState(root);
  },

  hasControls(root, generic = false) {
    return (!generic && this.fields(root).length > 0) ||
      this.draggables(root).length > 0 ||
      this.choices(root).length >= 2 ||
      this.graphs(root).length > 0;
  },

  describe(root) {
    const lines = [];
    const groups = questionGroups(root);
    const part = el => groups.length ? ` (part ${groupIndex(el, root, groups)})` : "";
    this.fields(root).forEach((field, i) => {
      const kind = { math: "math box (LaTeX)", editor: "math editor (type LaTeX, fractions and exponents are built for you)", text: "plain text box (no LaTeX, write fractions like 3/5)", rich: "written response box (sentences or paragraphs)" }[field.kind];
      const label = field.label ? ` after "${field.label}"` : "";
      const parts = field.kind === "editor" ? editorParts(field.el) : [];
      const listing = parts.length ? `, parts: ${parts.map((part, n) => `${n + 1} ${partName(part)} (${partText(part) ? `"${partText(part)}"` : "empty"})`).join(", ")}` : "";
      lines.push(`- Field ${i + 1}${part(field.el)}: ${kind}${label}, ${field.value ? `currently "${field.value}"` : "empty"}${listing}`);
    });
    this.dropdowns(root).forEach((dropdown, i) => {
      const options = dropdown.options.map(option => `"${option.label}"`).join(", ");
      lines.push(`- Dropdown ${i + 1}: options ${options}, currently "${dropdown.current}"`);
    });
    const buttons = [...new Set(pageButtons(root).map(button => button.label))];
    if (buttons.length) lines.push(`- Buttons: ${buttons.slice(0, 16).map(text => `"${text}"`).join(", ")}`);
    const items = this.draggables(root);
    const zones = items.length ? this.dropZones(root) : [];
    items.forEach((item, i) => {
      const home = zones.findIndex(zone => zone.el.contains(item.el));
      lines.push(`- Drag item ${i + 1}${part(item.el)}: "${item.label.slice(0, 120)}"${home >= 0 ? ` (now in drop zone ${home + 1})` : ""}`);
    });
    if (items.length) {
      zones.forEach((zone, i) => {
        const where = zone.label ? (zone.label.includes("___") ? ` in "${zone.label}"` : ` next to "${zone.label}"`) : "";
        lines.push(`- Drop zone ${i + 1}${part(zone.el)}${where}, ${zone.content ? `holding "${zone.content}"` : "empty"}`);
      });
    }
    this.graphs(root).forEach((graph, i) => {
      const [x1, y1, x2, y2] = graph.bounds.map(n => Math.round(n * 100) / 100);
      const tools = graph.tools.length ? `, tool buttons: ${graph.tools.map(tool => `"${tool.label}"`).join(", ")}` : "";
      lines.push(`- Graph ${i + 1}: clickable, x from ${x1} to ${x2}, y from ${y2} to ${y1}${tools}`);
    });
    return lines.join("\n");
  },

  submitDelay(settings) {
    return this.delay({
      delayMode: settings.submitDelayMode,
      delayMs: settings.submitDelayMs,
      delayMinMs: settings.submitDelayMinMs,
      delayMaxMs: settings.submitDelayMaxMs
    });
  },

  delay(settings, random = Math.random) {
    const { delayMode, delayMs, delayMinMs, delayMaxMs } = settings;
    return delayMode === "random"
      ? delayMinMs + Math.floor(random() * (delayMaxMs - delayMinMs + 1))
      : delayMs;
  }
};

function questionGroups(root) {
  const selector = Question.site().group;
  if (!selector) return [];
  const groups = [...root.querySelectorAll(selector)].filter(el => el.getClientRects().length);
  return groups.length > 1 ? groups : [];
}

function groupIndex(el, root, groups = questionGroups(root)) {
  if (!groups.length) return 0;
  return groups.findIndex(group => group.contains(el)) + 1;
}

function textBefore(el) {
  for (let node = el, depth = 0; node && node !== document.body && depth < 5; node = node.parentElement, depth++) {
    for (let prev = node.previousSibling; prev; prev = prev.previousSibling) {
      if (prev.nodeType === Node.ELEMENT_NODE && prev.matches(SCREEN_READER_ONLY)) continue;
      const text = clean(prev.nodeType === Node.ELEMENT_NODE ? Capture.text(prev, [SCREEN_READER_ONLY], false) : prev.textContent);
      if (text) return text;
    }
  }
  return "";
}

function plainMath(text) {
  return clean(String(text || "").replace(/\\left|\\right|\\[,;! ]/g, "").replace(/[$\\{}]/g, ""));
}

function texToPlain(value) {
  if (!/[\\{]/.test(value)) return value;
  const wrap = part => /^[\w.]+$/.test(part) ? part : `(${part})`;
  let text = value.replace(/\\left|\\right|\$/g, "");
  for (let i = 0; i < 6; i++) {
    text = text
      .replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, top, bottom) => `${wrap(top)}/${wrap(bottom)}`)
      .replace(/\\sqrt\{([^{}]*)\}/g, (_, inside) => `sqrt(${inside})`)
      .replace(/\^\{([^{}]*)\}/g, (_, power) => `^${wrap(power)}`);
  }
  return text
    .replace(/\\(cdot|times)/g, "*").replace(/\\div/g, "/").replace(/\\pi/g, "π")
    .replace(/\\(leq|le)\b/g, "≤").replace(/\\(geq|ge)\b/g, "≥").replace(/\\(neq|ne)\b/g, "≠")
    .replace(/\\[,;! ]/g, " ").replace(/\\([a-zA-Z]+)/g, "$1").replace(/[{}]/g, "").trim();
}

function withoutPrefix(label, value) {
  const before = plainMath(label);
  if (!/=\s*$/.test(before)) return value;
  const prefix = /([A-Za-z][\w']*(?:\([^)]*\))?)\s*=\s*$/.exec(before);
  const match = /^\s*\$?\s*([A-Za-z][\w']*(?:\([^)]*\))?)\s*=\s*(.+?)\s*\$?\s*$/s.exec(value);
  if (!match || /=/.test(match[2])) return value;
  const same = prefix && match[1].replace(/\s+/g, "").toLowerCase() === prefix[1].replace(/\s+/g, "").toLowerCase();
  return same || match[1].length <= 2 ? match[2].trim() : value;
}

function resolveStep(step, { root, fields, choices, dropdowns, graphs, used }) {
  if (step.fill !== undefined && typeof step.value === "string") {
    const index = step.fill === 0 && fields.length === 1 ? 0 : Number(step.fill) - 1;
    const field = fields[index];
    if (!field || used.has(field.el)) return null;
    used.add(field.el);
    const writer = { math: typeMath, editor: fillEditor, text: typeText, rich: typeRich }[field.kind];
    const before = textBefore(field.kind === "editor" ? editorOf(field.el) : field.el);
    const stripped = field.kind === "rich" ? step.value : withoutPrefix(before, withoutPrefix(field.label, step.value));
    const value = field.kind === "text" ? texToPlain(stripped) : stripped;
    return { el: field.el, pause: 250, run: () => writer(field.el, value) };
  }

  if (typeof step.choose === "string") {
    if (step.dropdown) {
      const dropdown = dropdowns[Number(step.dropdown) - 1];
      const match = dropdown && pickLoose(dropdown.options, step.choose);
      if (!match) return null;
      return { el: dropdown.el, pause: 200, run: () => setSelect(dropdown.el, match.option) };
    }
    const match = pickLoose(choices, step.choose);
    if (!match) return null;
    const { el, click, option } = match;
    return { el, pause: 200, run: () => option ? setSelect(el, option) : isPicked(match) || pickChoice(root, match) };
  }

  if (typeof step.tool === "string") {
    const pool = [...graphs.flatMap(graph => graph.tools), ...pageButtons(root)];
    const tool = pickLoose(pool, step.tool) || pool.find(item => loose(item.label) === loose(step.tool));
    if (!tool) return null;
    return { el: tool.el, pause: 220, run: () => pressElement(tool.el) };
  }

  if (Array.isArray(step.click) && step.click.length === 2) {
    const graph = graphs[(Number(step.graph) || 1) - 1];
    const [x, y] = step.click.map(Number);
    if (!graph?.interactive || !Number.isFinite(x) || !Number.isFinite(y)) return null;
    const [x1, y1, x2, y2] = graph.bounds;
    if (x < Math.min(x1, x2) || x > Math.max(x1, x2) || y < Math.min(y1, y2) || y > Math.max(y1, y2)) return null;
    return { el: graph.el, pause: 320, run: () => clickGraph(graph, x, y) };
  }

  return null;
}

function clippedOut(el) {
  if (el.closest("[aria-hidden='true'], [inert]")) return true;
  const rect = el.getBoundingClientRect();
  for (let node = el.parentElement; node && node !== document.body && node !== document.documentElement; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (style.overflowX === "visible" && style.overflowY === "visible") continue;
    const box = node.getBoundingClientRect();
    if (rect.right <= box.left + 1 || rect.left >= box.right - 1 || rect.bottom <= box.top + 1 || rect.top >= box.bottom - 1) return true;
  }
  return false;
}

const PointerShim = {
  depth: 0,
  saved: null,

  on() {
    if (this.depth++) return;
    try {
      const proto = pageWindow.Element.prototype;
      const saved = { set: proto.setPointerCapture, release: proto.releasePointerCapture, has: proto.hasPointerCapture };
      this.saved = saved;
      proto.setPointerCapture = function (id) {
        try {
          return saved.set.call(this, id);
        } catch {}
      };
      proto.releasePointerCapture = function (id) {
        try {
          return saved.release.call(this, id);
        } catch {}
      };
      proto.hasPointerCapture = function (id) {
        try {
          return saved.has.call(this, id) || id === 1;
        } catch {
          return true;
        }
      };
    } catch {
      this.saved = null;
    }
  },

  off() {
    if (--this.depth || !this.saved) return;
    try {
      const proto = pageWindow.Element.prototype;
      proto.setPointerCapture = this.saved.set;
      proto.releasePointerCapture = this.saved.release;
      proto.hasPointerCapture = this.saved.has;
    } catch {}
    this.saved = null;
  }
};

const SCREEN_READER_ONLY = ".sr-only, [class*='sr-only' i], [class*='visually-hidden' i], [class*='screenreader' i], [class*='accessibility' i]";

function spokenText(el) {
  if (!el.querySelector(SCREEN_READER_ONLY)) return el.innerText || el.textContent;
  const copy = el.cloneNode(true);
  copy.querySelectorAll(SCREEN_READER_ONLY).forEach(node => node.remove());
  return copy.textContent;
}

function hiddenControl(el) {
  const rect = el.getBoundingClientRect();
  return rect.width < 6 || rect.height < 6 || Number(getComputedStyle(el).opacity) === 0 ||
    rect.right < 0 || rect.bottom < 0 || rect.left > innerWidth;
}

async function pickChoice(root, { el, click }) {
  const before = selectionState(root);
  await pressElement(click);
  await sleep(120);
  if (selectionState(root) !== before) return true;
  const content = click.querySelector("[class*='content' i], span, div");
  const others = [content, el, ...(el.labels || [])].filter(target => target && target !== click && target.getClientRects().length);
  for (const target of others) {
    if (target === el) el.click();
    else await pressElement(target);
    await sleep(150);
    if (selectionState(root) !== before) return true;
  }
  el.focus?.({ preventScroll: true });
  await pressKey(el, "Space");
  await sleep(150);
  return true;
}

const PICKED_CLASS = /(^|[-_])(selected|checked|chosen)$/i;

function isPicked({ el, option }) {
  if (option) return option.selected && option.index > 0;
  if (el.checked || el.matches("[aria-checked='true'], [aria-selected='true'], [aria-pressed='true']")) return true;
  for (let node = el, depth = 0; node && depth < 3; node = node.parentElement, depth++) {
    if ([...node.classList].some(name => PICKED_CLASS.test(name))) return true;
  }
  return false;
}

function loose(text) {
  return normalize(text).replace(/[\u2212\u2013\u2014\u2012]/g, "-").replace(/[\u00d7]/g, "x").replace(/\s+/g, "");
}

function pickLoose(list, wanted) {
  const target = loose(wanted);
  const exact = list.filter(item => loose(item.label) === target);
  if (exact.length === 1) return exact[0];
  if (exact.length > 1 || target.length < 3) return null;
  const partial = list.filter(item => loose(item.label).includes(target) || target.includes(loose(item.label)));
  return partial.length === 1 ? partial[0] : null;
}

function setSelect(select, option) {
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
  if (setter) setter.call(select, option.value);
  if (select.selectedIndex !== option.index) select.selectedIndex = option.index;
  if (select.selectedIndex !== option.index) return false;
  for (const type of ["input", "change"]) select.dispatchEvent(new Event(type, { bubbles: true }));
  return true;
}

function clean(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function normalize(text) {
  return clean(text).toLowerCase();
}

function fieldLabel(el) {
  const direct = clean(el.getAttribute("aria-label") || [...(el.labels || [])].map(label => label.textContent).join(" ") ||
    el.getAttribute("placeholder") || el.title);
  if (direct && !GENERIC_LABEL.test(direct)) return direct.slice(0, 60);

  const noise = node => node.nodeType === Node.ELEMENT_NODE &&
    (node.matches("[role='toolbar'], button, [role='button'], .sr-only") || node.querySelector("[role='toolbar']"));
  for (let node = el, depth = 0; node && node !== document.body && depth < 6; node = node.parentElement, depth++) {
    let prev = node.previousSibling;
    while (prev && (!clean(prev.textContent) || noise(prev))) prev = prev.previousSibling;
    if (prev) {
      const text = clean(prev.nodeType === Node.ELEMENT_NODE ? Capture.text(prev) : prev.textContent);
      if (text) return text.slice(-120);
    }
  }
  return direct.slice(0, 60);
}

async function typeRich(el, value) {
  await pressElement(el);
  el.focus({ preventScroll: true });
  const selection = getSelection();
  const range = document.createRange();
  range.selectNodeContents(el);
  selection.removeAllRanges();
  selection.addRange(range);
  const paragraphs = String(value).split(/\n+/).map(part => part.trim()).filter(Boolean);
  try {
    document.execCommand("delete");
    paragraphs.forEach((part, i) => {
      if (i) document.execCommand("insertParagraph");
      document.execCommand("insertText", false, part);
    });
  } catch {}
  const target = loose(paragraphs.join(" ")).slice(0, 40);
  if (!loose(el.innerText).includes(target)) {
    el.replaceChildren(...paragraphs.map(part => {
      const p = document.createElement("p");
      p.textContent = part;
      return p;
    }));
    el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
  }
  keyEvent(el, "keyup", " ");
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.blur();
  await sleep(80);
  return loose(el.innerText).includes(target);
}

function shownText(el) {
  const box = el.getBoundingClientRect();
  if (!box.width || !box.height) return "";
  let scope = null;
  for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
    const rect = node.getBoundingClientRect();
    if (rect.width > box.width + 24 || rect.height > box.height + 24) break;
    scope = node;
  }
  return scope ? clean(Capture.text(scope, [], false)) : "";
}

function editorOf(el) {
  return el.closest(EDITOR_SELECTOR) || el.parentElement;
}

function editorText(el) {
  const widget = editorOf(el);
  const content = widget.querySelector("[class*='widget-content' i]") || widget;
  return clean(Capture.text(content, EDITOR_NOISE, false));
}

function editorParts(el) {
  const widget = editorOf(el);
  return innermost([...widget.querySelectorAll(EDITOR_PART)].filter(part => part.getClientRects().length));
}

function partText(part) {
  return clean(Capture.text(part, EDITOR_NOISE, false));
}

function partName(part) {
  const name = String(part.className?.baseVal ?? part.className);
  if (/numerator/i.test(name)) return "top of fraction";
  if (/denominator/i.test(name)) return "bottom of fraction";
  if (/exponent|superscript|power/i.test(name)) return "exponent";
  if (/radicand/i.test(name)) return "inside root";
  if (/index/i.test(name)) return "root index";
  if (/subscript/i.test(name)) return "subscript";
  return "box";
}

function symbolName(el) {
  const html = el.innerHTML;
  if (/frac|numerator/i.test(html)) return "fraction";
  if (/sqrt|radical|radicand/i.test(html)) return "square root";
  if (/exponent|superscript|power|<sup/i.test(html)) return "exponent";
  if (/abs/i.test(html)) return "absolute value";
  return "";
}

function symbolButton(proxy, name) {
  const widget = editorOf(proxy);
  const scope = widget.closest("[class*='symPad' i]:not([class*='sympadfi' i])") || widget.parentElement?.parentElement?.parentElement || document;
  return [...scope.querySelectorAll("[class*='symPadButton' i], [class*='symbol' i] button, [class*='symbol' i][role='button']")]
    .filter(button => button.getClientRects().length)
    .find(button => normalize(button.getAttribute("aria-label") || button.title || "").includes(name) || symbolName(button) === name);
}

async function focusEditor(proxy) {
  proxy.focus({ preventScroll: true });
  await sleep(40);
}

async function clickPart(part, proxy) {
  await pressElement(part);
  await focusEditor(proxy);
  await sleep(60);
}

async function editorStructure(proxy, name, ...groups) {
  const before = new Set(editorParts(proxy));
  const button = symbolButton(proxy, name);
  if (!button) return false;
  await pressElement(button);
  await focusEditor(proxy);
  await sleep(150);
  const fresh = editorParts(proxy).filter(part => !before.has(part));
  for (let i = 0; i < groups.length; i++) {
    const part = fresh[i];
    if (part) await clickPart(part, proxy);
    await typeEditor(proxy, groups[i]);
  }
  await pressKey(proxy, "Right");
  return true;
}

function readGroup(source, start) {
  if (source[start] !== "{") return [source[start] || "", start + 1];
  let depth = 0;
  for (let i = start; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}" && --depth === 0) return [source.slice(start + 1, i), i + 1];
  }
  return [source.slice(start + 1), source.length];
}

async function typeEditor(proxy, source) {
  const commands = { cdot: "*", times: "*", div: "/", pm: "±", le: "≤", leq: "≤", ge: "≥", geq: "≥", ne: "≠", pi: "π", infty: "∞", theta: "θ" };
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (ch === "\\") {
      const [whole, name] = /^\\([a-zA-Z]+|.)/.exec(source.slice(i)) || ["\\", ""];
      i += whole.length;
      if (name === "frac" || name === "dfrac" || name === "tfrac") {
        const [top, afterTop] = readGroup(source, i);
        const [bottom, afterBottom] = readGroup(source, afterTop);
        i = afterBottom;
        if (!(await editorStructure(proxy, "fraction", top, bottom))) await typeEditor(proxy, `(${top})/(${bottom})`);
      } else if (name === "sqrt") {
        const [inside, after] = readGroup(source, i);
        i = after;
        if (!(await editorStructure(proxy, "square root", inside))) await typeEditor(proxy, `sqrt(${inside})`);
      } else if (name === "left" || name === "right") {
        const delimiter = source[i++];
        if (delimiter && delimiter !== ".") await typeKey(document.activeElement || proxy, delimiter);
      } else if (commands[name]) {
        await typeKey(document.activeElement || proxy, commands[name]);
      } else if (/^[a-z]{2,}$/i.test(name) && !["cdot", "quad", "qquad", "displaystyle", "text", "mathrm"].includes(name)) {
        for (const letter of name) await typeKey(document.activeElement || proxy, letter);
      }
    } else if (ch === "^") {
      const [power, after] = readGroup(source, i + 1);
      i = after;
      if (!(await editorStructure(proxy, "exponent", power))) {
        await typeKey(document.activeElement || proxy, "^");
        await typeEditor(proxy, power);
        await pressKey(document.activeElement || proxy, "Right");
      }
    } else if (ch === "{" || ch === "}") {
      i++;
    } else {
      i++;
      if (ch.trim()) await typeKey(document.activeElement || proxy, ch);
    }
  }
}

async function fillEditor(proxy, value) {
  const widget = editorOf(proxy);
  await pressElement(widget);
  await focusEditor(proxy);
  for (let i = 0; i < 40 && editorText(proxy); i++) await pressKey(proxy, "Backspace");
  await typeEditor(proxy, value);
  await sleep(120);
  return Boolean(editorText(proxy));
}

function fieldValue({ el, kind }) {
  if (kind === "rich") return clean(el.innerText).slice(0, 300);
  if (kind === "editor") return editorText(el);
  if (kind === "text") return el.value.trim() || shownText(el);
  if (el.tagName.toLowerCase() === "math-field") return String(el.value || "").trim();
  try {
    const api = mathQuill(el);
    if (api?.latex) return api.latex().trim();
  } catch {}
  return clean(el.querySelector(".mq-root-block")?.textContent);
}

function mathQuill(el) {
  const MQ = pageWindow.MathQuill?.getInterface?.(2) || pageWindow.MQ;
  if (!MQ) return null;
  return (typeof MQ === "function" && MQ(el)) || MQ.MathField?.(el) || null;
}

function setText(el, value) {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value")?.set;
  if (!setter) return false;
  setter.call(el, value);
  if (el.value !== value) return false;
  for (const type of ["input", "change"]) el.dispatchEvent(new Event(type, { bubbles: true }));
  return true;
}

async function typeText(el, value) {
  const before = shownText(el);
  await pressElement(el);
  const active = document.activeElement;
  const target = active && active !== el && active.matches?.("input, textarea") && el.parentElement?.contains(active) ? active : el;
  const matches = () => loose(target.value) === loose(value) || (!target.value && shownText(el) !== before && Boolean(shownText(el)));
  target.focus({ preventScroll: true });

  target.select?.();
  try {
    document.execCommand("insertText", false, value);
  } catch {}

  if (!matches()) {
    target.select?.();
    try {
      document.execCommand("delete");
    } catch {}
    if (target.value) setText(target, "");
    for (const ch of value) await typeKey(target, ch);
  }

  if (!matches() && !shownText(el)) setText(target, value);
  keyEvent(target, "keyup", value.slice(-1) || "Backspace");
  target.dispatchEvent(new Event("change", { bubbles: true }));
  target.blur();
  await sleep(80);
  return matches();
}

async function typeKey(el, ch) {
  const code = /[a-z]/i.test(ch) ? `Key${ch.toUpperCase()}` : /\d/.test(ch) ? `Digit${ch}` : "";
  const legacy = ch.toUpperCase().charCodeAt(0);
  const typed = ch.charCodeAt(0);
  const make = (type, extra = {}) => {
    const event = new KeyboardEvent(type, { key: ch, code, shiftKey: ch !== ch.toLowerCase(), bubbles: true, cancelable: true, composed: true, ...extra });
    const press = type === "keypress";
    for (const [prop, val] of Object.entries({ keyCode: press ? typed : legacy, which: press ? typed : legacy, charCode: press ? typed : 0 })) {
      Object.defineProperty(event, prop, { get: () => val });
    }
    return event;
  };
  const down = el.dispatchEvent(make("keydown"));
  const press = down && el.dispatchEvent(make("keypress"));
  if (down && press) {
    try {
      document.execCommand("insertText", false, ch);
    } catch {}
  }
  el.dispatchEvent(make("keyup"));
  await sleep(12);
}

async function typeMath(el, value) {
  const area = el.querySelector("textarea");
  await pressElement(el);
  area?.focus({ preventScroll: true });
  const done = setMath(el, value);
  if (area) {
    keyEvent(area, "keyup", value.slice(-1) || "Backspace");
    area.dispatchEvent(new Event("change", { bubbles: true }));
    area.blur();
  }
  el.dispatchEvent(new Event("change", { bubbles: true }));
  await sleep(80);
  return done;
}

const SPECIAL_KEYS = {
  Left: ["ArrowLeft", 37], Right: ["ArrowRight", 39], Up: ["ArrowUp", 38], Down: ["ArrowDown", 40],
  Backspace: ["Backspace", 8], Delete: ["Delete", 46], Tab: ["Tab", 9], Home: ["Home", 36], End: ["End", 35], Space: [" ", 32], Enter: ["Enter", 13]
};

async function pressKey(el, name) {
  const [key, legacy] = SPECIAL_KEYS[name];
  const make = type => {
    const event = new KeyboardEvent(type, { key, code: key === " " ? "Space" : key, bubbles: true, cancelable: true, composed: true });
    for (const prop of ["keyCode", "which"]) Object.defineProperty(event, prop, { get: () => legacy });
    return event;
  };
  const allowed = el.dispatchEvent(make("keydown"));
  if (allowed) {
    if (name === "Backspace" || name === "Delete") {
      try {
        document.execCommand(name === "Backspace" ? "delete" : "forwardDelete");
      } catch {}
    } else if (name === "Enter") {
    } else if (name === "Space") {
      try {
        document.execCommand("insertText", false, " ");
      } catch {}
    } else if (typeof el.selectionStart === "number" && el.setSelectionRange) {
      const length = el.value.length;
      const at = { Left: el.selectionStart - 1, Right: el.selectionEnd + 1, Home: 0, End: length, Up: 0, Down: length }[name];
      if (at !== undefined) {
        try {
          el.setSelectionRange(Math.max(0, Math.min(length, at)), Math.max(0, Math.min(length, at)));
        } catch {}
      }
    }
  }
  el.dispatchEvent(make("keyup"));
  await sleep(25);
}

async function typeKeys(el, keys) {
  const tokens = String(keys).match(/\{(Left|Right|Up|Down|Backspace|Delete|Tab|Home|End|Space)\}|[\s\S]/g) || [];
  for (const token of tokens) {
    const special = /^\{(\w+)\}$/.exec(token);
    const target = document.activeElement && document.activeElement !== document.body ? document.activeElement : el;
    if (special) await pressKey(target, special[1]);
    else await typeKey(target, token);
  }
}

function keyEvent(el, type, key) {
  el.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true, cancelable: true, composed: true }));
}

function setMath(el, value) {
  if (el.tagName.toLowerCase() === "math-field") {
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }
  try {
    const api = mathQuill(el);
    if (api?.latex) {
      enterLatex(api, value);
      api.blur?.();
      return true;
    }
  } catch {}
  const area = el.querySelector("textarea");
  if (!area) return false;
  area.focus();
  const typed = document.execCommand("insertText", false, value);
  area.blur();
  return typed;
}

function enterLatex(api, value) {
  const flat = latex => latex.replace(/\\left|\\right/g, "").replace(/[{}\s]/g, "");
  if (api.typedText && api.cmd && api.keystroke) {
    try {
      api.latex("");
      typeLatex(api, value);
      if (flat(api.latex()) === flat(value)) return;
    } catch {}
  }
  api.latex(pairDelimiters(value));
}

function typeLatex(api, source) {
  let i = 0;
  const group = () => {
    if (source[i] === "{") {
      i++;
      run("}");
      i++;
    } else if (i < source.length) {
      step();
    }
  };
  const run = end => {
    while (i < source.length && source[i] !== end) step();
  };
  const step = () => {
    const ch = source[i];
    if (ch === "\\") {
      const [whole, name] = /^\\([a-zA-Z]+|.)/.exec(source.slice(i));
      i += whole.length;
      if (name === "frac") {
        api.cmd("\\frac");
        group();
        api.keystroke("Right");
        group();
        api.keystroke("Right");
      } else if (name === "sqrt") {
        api.cmd("\\sqrt");
        group();
        api.keystroke("Right");
      } else if (name === "left" || name === "right") {
        const delimiter = source[i++];
        if (delimiter && delimiter !== ".") api.typedText(delimiter);
      } else if (name === " " || name === ",") {
        api.typedText(" ");
      } else {
        api.cmd(`\\${name}`);
      }
    } else if (ch === "^" || ch === "_") {
      i++;
      api.typedText(ch);
      group();
      api.keystroke("Right");
    } else if (ch === "{") {
      i++;
      run("}");
      i++;
    } else {
      i++;
      if (ch.trim()) api.typedText(ch);
    }
  };
  run();
}

function pairDelimiters(value) {
  if (/\\left|\\right/.test(value)) return value;
  const opens = (value.match(/\(/g) || []).length;
  const closes = (value.match(/\)/g) || []).length;
  return opens && opens === closes ? value.replace(/\(/g, "\\left(").replace(/\)/g, "\\right)") : value;
}

const CLICKABLE = "button, a, [role='button'], [role='link'], input[type='button'], [onclick], [tabindex]:not([tabindex='-1'])";

function pageButtons(root) {
  const label = el => clean(el.getAttribute("aria-label") || el.title || el.innerText || el.textContent || el.value) || symbolName(el);
  const short = el => {
    const text = label(el);
    return text && text.length <= 30;
  };
  const direct = [...root.querySelectorAll(CLICKABLE)];
  const symbols = [...root.querySelectorAll("[class*='symPadButton' i]")];
  const pointer = [...root.querySelectorAll("span, div, label, li, p")]
    .filter(el => el.children.length <= 4 && short(el) && getComputedStyle(el).cursor === "pointer");
  const drags = Autofill.draggables(root).map(item => item.el);
  const found = [...new Set([...direct, ...symbols, ...pointer])].filter(el =>
    !el.closest(`#${HOST_ID}`) && Autofill.available(el) && el.type !== "submit" && short(el) &&
    !drags.some(item => item.contains(el) || el.contains(item)) &&
    !el.matches(`${FIELD_SELECTOR}, select, option, ${MATH_FIELD_SELECTOR}`) && !el.closest(MATH_FIELD_SELECTOR) &&
    !el.closest(Autofill.choiceSelector) && !el.querySelector(`${FIELD_SELECTOR}, select, ${MATH_FIELD_SELECTOR}`) &&
    !el.closest("[role='toolbar']")?.parentElement?.parentElement?.querySelector(RICH_SELECTOR));
  return outermost(found)
    .map(el => ({ el, label: label(el) }))
    .filter(tool => !TOOL_SKIP.test(tool.label));
}

function jxgBoards() {
  try {
    return Object.values(pageWindow.JXG?.boards || {}).filter(board => board?.containerObj);
  } catch {
    return [];
  }
}

function graphInfo(el, boards) {
  const board = boards.find(b => el === b.containerObj || el.contains(b.containerObj) || b.containerObj.contains(el));
  const container = board?.containerObj || (el.matches("svg, canvas") ? el.parentElement : el);
  const tools = graphTools(container);

  if (board) {
    return {
      el: board.containerObj,
      board: true,
      interactive: true,
      tools,
      bounds: board.getBoundingBox(),
      toClient(x, y) {
        const rect = board.containerObj.getBoundingClientRect();
        const origin = board.origin.scrCoords;
        return [rect.left + origin[1] + x * board.unitX, rect.top + origin[2] - y * board.unitY];
      }
    };
  }

  const axes = calibrate(el);
  if (!axes) return { el, interactive: false };

  const start = el.getBoundingClientRect();
  const toMath = (px, py) => [(px - axes.x.b) / axes.x.a, (py - axes.y.b) / axes.y.a];
  const [x1, y1] = toMath(start.left, start.top);
  const [x2, y2] = toMath(start.right, start.bottom);
  return {
    el,
    interactive: true,
    tools,
    bounds: [x1, y1, x2, y2],
    toClient(x, y) {
      const rect = el.getBoundingClientRect();
      return [axes.x.a * x + axes.x.b + rect.left - start.left, axes.y.a * y + axes.y.b + rect.top - start.top];
    }
  };
}

function graphTools(container) {
  let scope = container;
  for (let depth = 0; depth < 3 && scope.parentElement; depth++) {
    scope = scope.parentElement;
    const found = pageButtons(scope).filter(tool => !container.contains(tool.el) || container === scope);
    if (found.length) return found.slice(0, 12);
  }
  return [];
}

function calibrate(el) {
  const rect = el.getBoundingClientRect();
  const scope = el.matches("svg, canvas") ? el.parentElement : el;
  const labels = [...scope.querySelectorAll("text, div, span")].flatMap(node => {
    if (node.tagName.toLowerCase() !== "text" && node.children.length) return [];
    const text = node.textContent.replace(/[−–]/g, "-").trim();
    if (!/^-?\d+(\.\d+)?$/.test(text)) return [];
    const box = node.getBoundingClientRect();
    if (!box.width || box.left < rect.left - 30 || box.right > rect.right + 30 || box.top < rect.top - 30 || box.bottom > rect.bottom + 30) return [];
    return [{ v: parseFloat(text), x: box.left + box.width / 2, y: box.top + box.height / 2 }];
  });

  const x = fitAxis(labels, "y", "x");
  const y = fitAxis(labels, "x", "y");
  return x && y && x.a > 0 && y.a < 0 ? { x, y } : null;
}

function fitAxis(labels, rowKey, posKey) {
  const rows = new Map();
  labels.forEach(label => {
    const key = Math.round(label[rowKey] / 6);
    rows.set(key, [...(rows.get(key) || []), label]);
  });

  let best = null;
  for (const row of rows.values()) {
    const unique = [...new Map(row.map(label => [label.v, label])).values()];
    if (unique.length < 3) continue;
    const fit = linearFit(unique.map(label => [label.v, label[posKey]]));
    if (fit && Math.abs(fit.a) > 2 && fit.error < 4 && (!best || unique.length > best.count)) best = { ...fit, count: unique.length };
  }
  return best;
}

function linearFit(points) {
  const n = points.length;
  const mx = points.reduce((sum, [x]) => sum + x, 0) / n;
  const my = points.reduce((sum, [, y]) => sum + y, 0) / n;
  const sxx = points.reduce((sum, [x]) => sum + (x - mx) ** 2, 0);
  if (!sxx) return null;
  const a = points.reduce((sum, [x, y]) => sum + (x - mx) * (y - my), 0) / sxx;
  const b = my - a * mx;
  const error = Math.max(...points.map(([x, y]) => Math.abs(a * x + b - y)));
  return { a, b, error };
}

async function clickGraph(graph, x, y) {
  await reveal(graph.el);
  const [cx, cy] = graph.toClient(x, y);
  await pointerClick(pointTarget(cx, cy, graph.el), cx, cy);
  return true;
}

async function pressElement(el) {
  await reveal(el);
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const hit = pointTarget(cx, cy, el);
  await pointerClick(el.contains(hit) ? hit : el, cx, cy);
  return true;
}

async function reveal(el) {
  const rect = el.getBoundingClientRect();
  if (rect.top >= 0 && rect.bottom <= innerHeight && rect.left >= 0 && rect.right <= innerWidth) return;
  el.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

async function pointerClick(target, cx, cy) {
  const base = { bubbles: true, cancelable: true, composed: true, clientX: cx, clientY: cy, screenX: cx + screenX, screenY: cy + screenY, button: 0 };
  const pointer = { ...base, pointerId: 1, pointerType: "mouse", isPrimary: true, width: 1, height: 1 };

  target.dispatchEvent(new PointerEvent("pointerover", { ...pointer, buttons: 0 }));
  target.dispatchEvent(new MouseEvent("mouseover", { ...base, buttons: 0 }));
  target.dispatchEvent(new PointerEvent("pointermove", { ...pointer, buttons: 0 }));
  target.dispatchEvent(new MouseEvent("mousemove", { ...base, buttons: 0 }));
  target.dispatchEvent(new PointerEvent("pointerdown", { ...pointer, buttons: 1, pressure: .5 }));
  target.dispatchEvent(new MouseEvent("mousedown", { ...base, buttons: 1 }));
  if (target.focus && target.tabIndex >= 0) target.focus({ preventScroll: true });
  await sleep(60);
  target.dispatchEvent(new PointerEvent("pointerup", { ...pointer, buttons: 0, pressure: 0 }));
  target.dispatchEvent(new MouseEvent("mouseup", { ...base, buttons: 0 }));
  target.dispatchEvent(new MouseEvent("click", { ...base, buttons: 0, detail: 1 }));
}

function outermost(list) {
  return list.filter(el => !list.some(other => other !== el && other.contains(el)));
}

function innermost(list) {
  return list.filter(el => !list.some(other => other !== el && el.contains(other)));
}

function boxSize(el) {
  const rect = el.getBoundingClientRect();
  return rect.width >= 30 && rect.height >= 16 && rect.width <= 900 && rect.height <= 500;
}

function looksLikeBox(el) {
  const style = getComputedStyle(el);
  const painted = style.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(style.backgroundColor);
  const bordered = parseFloat(style.borderTopWidth) > 0 && style.borderTopStyle !== "none";
  return painted || bordered;
}

function blankText(node, blank) {
  if (node === blank) return " ___ ";
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue;
  if (node.nodeType !== Node.ELEMENT_NODE || node.matches(SCREEN_READER_ONLY)) return "";
  if (node.matches(ZONE_SELECTOR)) return " __ ";
  return [...node.childNodes].map(child => blankText(child, blank)).join("");
}

function blankContext(el) {
  for (let node = el.parentElement, depth = 0; node && depth < 3; node = node.parentElement, depth++) {
    const text = clean(blankText(node, el));
    if (text.replace(/_+/g, "").trim().length < 4) continue;
    const at = text.indexOf("___");
    const start = Math.max(0, at - 70);
    const end = Math.min(text.length, at + 73);
    return `${start ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
  }
  return "";
}

function zoneLabel(el) {
  const row = el.closest("tr");
  if (row) {
    const text = clean([...row.children].filter(cell => !cell.contains(el)).map(cell => cell.innerText || cell.textContent).join(" "));
    if (text) return text.slice(0, 90);
  }
  const context = blankContext(el);
  if (context) return context;
  for (let node = el, depth = 0; node && depth < 4; node = node.parentElement, depth++) {
    let prev = node.previousElementSibling;
    while (prev && !clean(prev.textContent)) prev = prev.previousElementSibling;
    if (prev) return clean(prev.innerText || prev.textContent).slice(-90);
  }
  return "";
}

function hitAt(x, y, skip) {
  const host = document.getElementById(HOST_ID);
  const previous = host?.style.visibility;
  if (host) host.style.visibility = "hidden";
  const hits = document.elementsFromPoint(x, y);
  if (host) host.style.visibility = previous;
  return hits.find(el => !skip || (!skip.contains(el) && el !== skip)) || hits[0] || document.body;
}

async function dragTo(item, zone) {
  await reveal(zone);
  await reveal(item);
  const a = item.getBoundingClientRect();
  const b = zone.getBoundingClientRect();
  const from = [a.left + a.width / 2, a.top + a.height / 2];
  const to = [b.left + b.width / 2, b.top + b.height / 2];
  const transfer = typeof DataTransfer === "function" ? new DataTransfer() : null;
  const mouse = (type, el, [x, y], buttons) => {
    const base = { bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, screenX: x + screenX, screenY: y + screenY, button: 0, buttons };
    if (type.startsWith("pointer")) el.dispatchEvent(new PointerEvent(type, { ...base, pointerId: 1, pointerType: "mouse", isPrimary: true, pressure: buttons ? .5 : 0 }));
    else if (type.startsWith("drag") || type === "drop") {
      if (transfer) el.dispatchEvent(new DragEvent(type, { ...base, dataTransfer: transfer }));
    } else el.dispatchEvent(new MouseEvent(type, base));
  };

  const start = hitAt(...from);
  const grab = item.contains(start) ? start : item;
  mouse("pointerover", grab, from, 0);
  mouse("mouseover", grab, from, 0);
  mouse("pointerdown", grab, from, 1);
  mouse("mousedown", grab, from, 1);
  if (item.draggable) mouse("dragstart", item, from, 1);
  await sleep(80);

  const steps = 14;
  let over = grab;
  for (let i = 1; i <= steps; i++) {
    const point = [from[0] + (to[0] - from[0]) * i / steps, from[1] + (to[1] - from[1]) * i / steps];
    over = hitAt(...point, item);
    mouse("pointermove", over, point, 1);
    mouse("mousemove", over, point, 1);
    if (item.draggable) {
      mouse("dragenter", over, point, 1);
      mouse("dragover", over, point, 1);
    }
    await sleep(22);
  }

  const end = zone.contains(over) ? over : zone;
  mouse("pointerup", end, to, 0);
  mouse("mouseup", end, to, 0);
  if (item.draggable) {
    mouse("drop", end, to, 0);
    mouse("dragend", item, to, 0);
  }
  await sleep(120);
  return true;
}

function selectionState(root) {
  return [...root.querySelectorAll("*")].slice(0, 4000).map(node =>
    `${node.className?.baseVal ?? node.className}|${node.tagName === "SELECT" ? node.selectedIndex : ""}|${node.getAttribute("aria-checked")}|${node.getAttribute("aria-selected")}|${node.getAttribute("aria-pressed")}|${node.checked}`).join(";");
}

function pointTarget(x, y, graphEl) {
  const host = document.getElementById(HOST_ID);
  const previous = host?.style.visibility;
  if (host) host.style.visibility = "hidden";
  const hit = document.elementFromPoint(x, y);
  if (host) host.style.visibility = previous;
  const scope = graphEl.matches("svg, canvas") ? graphEl.parentElement : graphEl;
  return hit && scope.contains(hit) ? hit : graphEl;
}
