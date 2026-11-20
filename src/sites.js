const GENERIC_SITE = {
  id: "generic",
  label: "Any site",
  hosts: [],
  roots: ["main", "[role='main']", "article", "body"],
  strip: ["nav", "header", "footer", "aside"]
};

const DEFAULT_SUBMIT = "^(submit|submit answer|check|check answer)$";
const CONFIRM = /^(yes|ok|okay|confirm|submit|submit answer)$/i;
const DIALOG = "[role='dialog'], [aria-modal='true'], dialog, [class*='modal' i], [id*='dialog' i]";

const EDITABLE = "[contenteditable]:not([contenteditable='false']), [role='textbox'], [class*='input' i], [class*='answer' i], [class*='field' i], [class*='editor' i], [class*='blank' i]";
const FEEDBACK_LINE =/\b(correct|incorrect|try again|you may now|must answer|press submit|attempts?\b.*\d|out of \d+|score|penalty|well done|not quite|good job|next problem|show examples|stuck)/i;

function answerSlot(field, root) {
  let slot = field;
  for (let node = field.parentElement; node && node !== root; node = node.parentElement) {
    const extra = clean(node.textContent).length - clean(slot.textContent).length;
    if (extra > 25 || node.querySelectorAll(`${FIELD_SELECTOR}, ${MATH_FIELD_SELECTOR}`).length > 1) break;
    slot = node;
  }
  return slot;
}

const CONTROL_IDS = new WeakMap();
let controlCount = 0;

const controlId = el => {
  if (!CONTROL_IDS.has(el)) CONTROL_IDS.set(el, ++controlCount);
  return CONTROL_IDS.get(el);
};

const Question = {
  pinned: null,
  generation: 0,
  doneShown: null,
  loads: 0,
  submitted: false,

  watch() {
    const network = this.site().network;
    if (!network || typeof PerformanceObserver !== "function") return () => {};
    const problem = new RegExp(network.problem);
    const submit = new RegExp(network.submit);
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (problem.test(entry.name)) {
          this.loads += 1;
          this.submitted = false;
        } else if (submit.test(entry.name)) {
          this.submitted = true;
        }
      }
    });
    try {
      observer.observe({ type: "resource", buffered: true });
    } catch {
      return () => {};
    }
    return () => observer.disconnect();
  },

  site() {
    const host = location.hostname.toLowerCase();
    const match = CONFIG.sites.find(site => site.hosts.some(h => host === h || host.endsWith(`.${h}`)));
    return match || { ...GENERIC_SITE, label: host.replace(/^www\./, "") || GENERIC_SITE.label };
  },

  pin(el) {
    this.pinned = el;
  },

  root(automatic = false) {
    if (this.pinned?.isConnected) return { el: this.pinned, pinned: true };

    const laidOut = this.site().group ? [...document.querySelectorAll(this.site().group)].filter(el => {
      if (el.closest(`#${HOST_ID}`)) return false;
      const rect = el.getBoundingClientRect();
      const shown = el.checkVisibility ? el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) : true;
      return shown && rect.height > 0 && rect.width > 0;
    }) : [];
    const onScreen = laidOut.filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.right > 0 && rect.left < innerWidth && !clippedOut(el);
    });
    const grouped = onScreen.length ? onScreen : laidOut;
    if (grouped?.length) {
      let common = grouped[0];
      while (common.parentElement && !grouped.every(el => common.contains(el))) common = common.parentElement;
      return { el: common, pinned: false };
    }
    if (automatic && this.site().requireGroup) return null;

    const selection = automatic ? null : window.getSelection();
    if (selection && !selection.isCollapsed && selection.toString().trim().length > 20) {
      const node = selection.getRangeAt(0).commonAncestorContainer;
      return { el: node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement, pinned: false, selection: selection.toString() };
    }

    const site = this.site();
    const visibleRoots = site.roots.flatMap(selector => {
      if (automatic && site.id === "generic" && !["main", "[role='main']", "article"].includes(selector)) return [];
      return [...document.querySelectorAll(selector)]
        .filter(candidate => candidate.getBoundingClientRect().height > 0)
        .map(el => ({ el, fallback: site.id === "generic" || selector === "main" }));
    });
    if (automatic) {
      const generic = site.id === "generic";
      const preferred = visibleRoots.map(({ el, fallback }) => ({ el: this.expand(el, site), fallback }))
        .find(({ el }) => Autofill.hasControls(el, generic)) || visibleRoots.find(candidate => !candidate.fallback);
      return preferred ? { el: this.expand(preferred.el, site), pinned: false } : null;
    }
    if (visibleRoots.length) return { el: this.expand(visibleRoots[0].el, site), pinned: false };
    return { el: document.body, pinned: false };
  },

  expand(el, site) {
    if (!site.expand) return el;
    const answerable = node => Autofill.fields(node).length > 0 || Autofill.choices(node).length >= 2;
    const climb = test => {
      for (let node = el; node && node !== document.body; node = node.parentElement) if (test(node)) return node;
      return null;
    };
    return climb(answerable) || climb(node => Autofill.hasControls(node)) || el;
  },

  buttonVisible(source) {
    const pattern = new RegExp(source, "i");
    const buttons = document.querySelectorAll("button, a, input[type='submit'], input[type='button'], [role='button']");
    return [...buttons].some(button => !button.closest(`#${HOST_ID}`) && button.getClientRects().length &&
      getComputedStyle(button).visibility === "visible" && pattern.test(clean(button.matches("input") ? button.value : button.textContent)));
  },

  submitButton() {
    return this.findButton(this.site().submit || DEFAULT_SUBMIT);
  },

  advanceButton() {
    const site = this.site();
    return site.advance ? this.findButton(site.advance) : null;
  },

  findButton(source) {
    const pattern = new RegExp(source, "i");
    return [...document.querySelectorAll("button, input[type='submit'], input[type='button'], [role='button'], a")]
      .find(el => !el.closest(`#${HOST_ID}`) && !el.closest(DIALOG) && Autofill.available(el) &&
        pattern.test(clean(el.matches("input") ? el.value : el.textContent)));
  },

  confirmButton() {
    return [...document.querySelectorAll(DIALOG)]
      .filter(dialog => !dialog.closest(`#${HOST_ID}`) && dialog.getClientRects().length)
      .flatMap(dialog => [...dialog.querySelectorAll("button, [role='button'], input[type='button'], input[type='submit']")])
      .find(el => Autofill.available(el) && CONFIRM.test(clean(el.matches("input") ? el.value : el.textContent)));
  },

  noteClick(e) {
    const site = this.site();
    if (!site.next || !e.isTrusted || e.target.closest?.(`#${HOST_ID}`)) return;
    const pattern = new RegExp(site.next, "i");
    for (let node = e.target, depth = 0; node && node !== document.body && depth < 5; node = node.parentElement, depth++) {
      const text = clean(node.matches?.("input") ? node.value : node.textContent);
      if (text.length > 40) return;
      if (pattern.test(text)) {
        this.advance();
        return;
      }
    }
  },

  advance() {
    this.generation += 1;
    this.submitted = false;
  },

  boards(el) {
    return jxgBoards().filter(board => el.contains(board.containerObj)).map(board => board.id || controlId(board.containerObj));
  },

  track() {
    const site = this.site();
    if (!site.done) return;
    const shown = this.buttonVisible(site.done);
    if (!shown && this.doneShown === true) this.advance();
    this.doneShown = shown;
  },

  ready(el) {
    const site = this.site();
    if (site.network && this.loads) return !this.submitted && !(site.done && this.buttonVisible(site.done)) && Autofill.actionable(el);
    if (site.done && this.buttonVisible(site.done)) return false;
    return Autofill.actionable(el);
  },

  stableText(el, strip) {
    const editable = [...el.querySelectorAll(EDITABLE)].filter(node => clean(node.textContent).length < 200);
    const slots = Autofill.fields(el).map(field => answerSlot(field.el, el));
    const moved = [...Autofill.draggables(el), ...Autofill.dropZones(el), ...Autofill.orderLists(el)].map(entry => entry.el);
    return Capture.text(el, strip, false, true, [...editable, ...slots, ...moved]).split("\n").map(clean)
      .filter(line => line && !FEEDBACK_LINE.test(line)).join("\n");
  },

  signature(el, strip) {
    const controls = [
      Autofill.fields(el).length,
      Autofill.dropdowns(el).map(dropdown => dropdown.options.length),
      Autofill.choices(el).filter(choice => !choice.option).map(choice => choice.label),
      Autofill.draggables(el).map(item => item.label).sort(),
      Autofill.orderLists(el).map(list => list.items.map(item => item.label).sort())
    ];
    return [this.stableText(el, strip), controls];
  },

  async read(withImages, automatic = false) {
    this.track();
    const site = this.site();
    const root = this.root(automatic);
    if (!root) return null;
    const strip = root.pinned ? [] : site.strip;
    const full = root.selection ? root.selection.trim() : Capture.text(root.el, strip);
    const choices = root.selection ? [] : Autofill.choices(root.el).map(choice => choice.label);
    const limit = CONFIG.capture.maxTextLength;
    const media = root.selection ? [] : [...root.el.querySelectorAll("img")].filter(img => {
      const { width, height } = img.getBoundingClientRect();
      return width >= CONFIG.capture.minImageSize && height >= CONFIG.capture.minImageSize;
    }).slice(0, CONFIG.capture.maxImages).map(img => img.currentSrc || img.src);

    return {
      site: site.label,
      title: document.title,
      text: full.slice(0, limit),
      trimmed: full.length > limit,
      choices,
      controls: root.selection ? "" : Autofill.describe(root.el),
      prompt: root.selection ? full : this.stableText(root.el, strip),
      ready: !automatic || this.ready(root.el),
      key: hashText(JSON.stringify(site.network && this.loads && !root.selection
        ? [location.pathname, "load", this.loads, this.generation]
        : site.done && !root.selection
        ? [location.pathname, this.generation, this.boards(root.el), this.stableText(root.el, strip)]
        : [location.pathname, this.generation, root.selection ? full : this.signature(root.el, strip), media])),
      hasMedia: media.some(Boolean),
      images: withImages && !root.selection ? await Capture.images(root.el) : []
    };
  }
};
