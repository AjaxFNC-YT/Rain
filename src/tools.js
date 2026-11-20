const DragMemory = {
  key: () => `${location.hostname}`,
  get() {
    return this.saved?.[this.key()] ?? 0;
  },
  set(index) {
    this.saved = { ...this.saved, [this.key()]: index };
  },
  saved: null
};

const Tools = {
  definitions: [
    {
      name: "fill_field",
      description: "Set an answer field from the detected controls list, replacing anything already in it, including placeholder defaults like 0. Math boxes take LaTeX such as \\frac{3}{4}, x^{2}, \\sqrt{5} or -2x+3. Text boxes take plain text.",
      input_schema: {
        type: "object",
        properties: {
          field: { type: "integer", minimum: 1, description: "Field number from the controls list" },
          value: { type: "string", description: "Exact value to enter" }
        },
        required: ["field", "value"]
      }
    },
    {
      name: "choose_option",
      description: "Select an answer choice, radio button, checkbox, choice tile or dropdown option by its visible text. For select-all-that-apply questions call it once per correct option. For dropdowns, pass the dropdown number from the controls list. Choosing the option that is already selected is fine.",
      input_schema: {
        type: "object",
        properties: {
          option: { type: "string", description: "Option text as shown" },
          dropdown: { type: "integer", minimum: 1, description: "Dropdown number from the controls list, when choosing in a dropdown" }
        },
        required: ["option"]
      }
    },
    {
      name: "press_button",
      description: "Press a button or link on the page by its text, for example Add value, a graph tool such as Line, Point, Parabola, Dashed or Shade, or a symbol button. Use times to press it repeatedly, for example to add the right number of answer boxes. Submit-style buttons are not allowed.",
      input_schema: {
        type: "object",
        properties: {
          label: { type: "string", description: "Button text as shown" },
          times: { type: "integer", minimum: 1, maximum: 20, description: "How many times to press it, default 1" }
        },
        required: ["label"]
      }
    },
    {
      name: "click_graph",
      description: "Click one or more points on an interactive graph, in math coordinates, in order. A line, ray or segment takes two points on it. A point takes one. A parabola takes the vertex then one more point. A circle takes the center then a point on it. Clicking an existing object usually deletes it, so never repeat a point or click on something already drawn.",
      input_schema: {
        type: "object",
        properties: {
          graph: { type: "integer", minimum: 1, description: "Graph number from the controls list" },
          points: {
            type: "array",
            minItems: 1,
            maxItems: 12,
            items: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 },
            description: "Points as [x, y] pairs"
          }
        },
        required: ["graph", "points"]
      }
    },
    {
      name: "drag_item",
      description: "Drag a drag item onto a drop zone from the controls list. Use it for matching, sorting and ordering questions. Name the item by its exact text, since item numbers shift as items move. Drop zone numbers stay fixed.",
      input_schema: {
        type: "object",
        properties: {
          item_text: { type: "string", description: "Exact text of the drag item" },
          item: { type: "integer", minimum: 1, description: "Drag item number, only if the text is ambiguous" },
          zone: { type: "integer", minimum: 1, description: "Drop zone number" }
        },
        required: ["zone"]
      }
    },
    {
      name: "drag_many",
      description: "Move several drag items into drop zones in one call. Use this instead of many drag_item calls when a page has several blanks. Items only fit drop zones in the same part.",
      input_schema: {
        type: "object",
        properties: {
          moves: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              properties: {
                item_text: { type: "string", description: "Exact text of the drag item" },
                zone: { type: "integer", minimum: 1, description: "Drop zone number" }
              },
              required: ["item_text", "zone"]
            }
          }
        },
        required: ["moves"]
      }
    },
    {
      name: "fill_many",
      description: "Fill several answer fields in one call. Use this instead of many fill_field calls when a page has several boxes.",
      input_schema: {
        type: "object",
        properties: {
          entries: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              properties: {
                field: { type: "integer", minimum: 1, description: "Field number from the controls list" },
                value: { type: "string", description: "Exact value to enter" }
              },
              required: ["field", "value"]
            }
          }
        },
        required: ["entries"]
      }
    },
    {
      name: "type_keys",
      description: "Type keystrokes into an answer field like a person, for custom math editors where fill_field does not work. Special keys in braces: {Left} {Right} {Up} {Down} {Backspace} {Delete} {Tab} {Home} {End} {Space}. In math editors, press the structure button first (such as fraction or exponent) or type / and ^, then use arrow keys to move between parts, for example \"-v{Down}xw\" after pressing the fraction button. The result shows what the field displays.",
      input_schema: {
        type: "object",
        properties: {
          field: { type: "integer", minimum: 1, description: "Field number to click first. Omit to keep typing where the cursor already is." },
          part: { type: "integer", minimum: 1, description: "Part number inside a math editor field, from its parts list, to click before typing" },
          keys: { type: "string", description: "Characters and {Special} keys to type" },
          clear: { type: "boolean", description: "Clear the field first with select all and delete" }
        },
        required: ["keys"]
      }
    },
    {
      name: "read_page",
      description: "Read the question area again: current text, answer controls with their values, and fresh images of any graphs. Use it to check your work after interacting.",
      input_schema: { type: "object", properties: {} }
    }
  ],

  acts(name) {
    return name !== "read_page";
  },

  async run(call) {
    const reply = (content, isError = false) => ({ type: "tool_result", tool_use_id: call.id, content, ...(isError ? { is_error: true } : {}) });
    const root = Question.root(true)?.el;
    if (!root) return { result: reply("The question area could not be found on the page.", true), summary: null };

    try {
      const acting = this.acts(call.name);
      if (acting) PointerShim.on();
      let outcome;
      try {
        outcome = await this[call.name]?.(root, call.input || {});
      } finally {
        if (acting) PointerShim.off();
      }
      if (!outcome) return { result: reply(`Unknown tool ${call.name}`, true), summary: null };
      if (acting) await settle(150, 900);
      return { result: reply(outcome.content, !outcome.ok), summary: outcome.ok ? outcome.summary : null };
    } catch (err) {
      return { result: reply(`Failed: ${err.message}`, true), summary: null };
    }
  },

  controls() {
    const root = Question.root(true)?.el;
    return root ? Autofill.describe(root) : "";
  },

  async changes(before) {
    await settle(250, 1500);
    const after = this.controls();
    return after === before ? "" : `The page updated. Answer controls now:\n${after || "(none detected)"}`;
  },

  attach(result, text) {
    if (!result || !text) return;
    if (Array.isArray(result.content)) result.content.push({ type: "text", text });
    else result.content = `${result.content}\n\n${text}`;
  },

  async fill_many(root, { entries = [] }) {
    const lines = [];
    let done = 0;
    for (const entry of entries) {
      const outcome = await this.fill_field(Question.root(true)?.el || root, entry);
      if (outcome.ok) done++;
      lines.push(`${outcome.ok ? "OK" : "FAILED"} field ${entry.field}: ${outcome.content}`);
      await sleep(60);
    }
    return { ok: done > 0, content: `Filled ${done} of ${entries.length}.\n${lines.join("\n")}`, summary: done ? `Filled ${done} field${done === 1 ? "" : "s"}` : null };
  },

  async drag_many(root, { moves = [] }) {
    const lines = [];
    let done = 0;
    for (const move of moves) {
      const outcome = await this.drag_item(Question.root(true)?.el || root, move);
      if (outcome.ok) done++;
      lines.push(`${outcome.ok ? "OK" : "FAILED"} "${move.item_text}" to zone ${move.zone}${outcome.ok ? "" : `: ${outcome.content.split("\n")[0]}`}`);
    }
    return { ok: done > 0, content: `Placed ${done} of ${moves.length}.\n${lines.join("\n")}`, summary: done ? `Placed ${done} item${done === 1 ? "" : "s"}` : null };
  },

  async perform(root, step) {
    const context = {
      root,
      fields: Autofill.fields(root),
      choices: Autofill.choices(root),
      dropdowns: Autofill.dropdowns(root),
      graphs: Autofill.graphs(root),
      used: new Set()
    };
    const action = resolveStep(step, context);
    if (!action) return { ok: false, context };
    const ok = await action.run();
    await sleep(action.pause);
    return { ok, context };
  },

  async fill_field(root, { field, value }) {
    const previous = Autofill.fields(root)[field - 1]?.value;
    const { ok, context } = await this.perform(root, { fill: field, value: String(value ?? "") });
    if (!ok) {
      const reason = context.fields[field - 1] ? `Field ${field} could not be filled.` : `There is no Field ${field}. Fields available: ${context.fields.length}.`;
      return { ok: false, content: reason };
    }
    const now = Autofill.fields(root)[field - 1];
    const from = previous ? ` (was "${previous}")` : "";
    return { ok: true, content: `Field ${field} now shows "${now?.value ?? value}"${from}.`, summary: `Entered ${value} in field ${field}` };
  },

  async choose_option(root, { option, dropdown }) {
    const before = Autofill.snapshot(root);
    const { ok, context } = await this.perform(root, { choose: String(option ?? ""), dropdown });
    if (!ok) {
      const menus = context.dropdowns.map((menu, i) => `Dropdown ${i + 1}: ${menu.options.map(item => `"${item.label}"`).join(", ")}`);
      const labels = context.choices.filter(choice => !choice.option).map(choice => `"${choice.label}"`);
      const listing = [labels.length ? `Choices: ${labels.join(", ")}` : null, ...menus].filter(Boolean).join(". ");
      const hint = !dropdown && context.dropdowns.length ? " Pass the dropdown number to choose inside a dropdown." : "";
      return { ok: false, content: `No single option matched "${option}". ${listing || "No options found."}${hint}` };
    }
    const already = dropdown
      ? context.dropdowns[dropdown - 1]?.current === pickLoose(context.dropdowns[dropdown - 1].options, option)?.label
      : false;
    await sleep(200);
    if (Autofill.snapshot(root) === before && !already) {
      return { ok: true, content: `Clicked "${option}" but the page shows no visible change. Call read_page to check before trying again; clicking twice may unselect it.`, summary: null };
    }
    return { ok: true, content: `Selected "${option}".`, summary: `Chose ${option}` };
  },

  async press_button(root, { label, times = 1 }) {
    const count = Math.max(1, Math.min(20, Number(times) || 1));
    for (let i = 0; i < count; i++) {
      const { ok, context } = await this.perform(Question.root(true)?.el || root, { tool: String(label ?? "") });
      if (!ok) {
        const labels = [...context.graphs.flatMap(graph => graph.tools), ...pageButtons(root)].map(tool => `"${tool.label}"`);
        const done = i ? `Pressed ${i} time(s), then it stopped matching. ` : "";
        return { ok: false, content: `${done}No button matched "${label}". Buttons available: ${[...new Set(labels)].join(", ") || "none"}.` };
      }
      if (count > 1) await settle(250, 1500);
    }
    const suffix = count > 1 ? ` ${count} times` : "";
    return { ok: true, content: `Pressed "${label}"${suffix}.`, summary: `Pressed ${label}${suffix}` };
  },

  async click_graph(root, { graph = 1, points = [] }) {
    const done = [];
    for (const point of points) {
      const { ok } = await this.perform(root, { click: point, graph });
      if (!ok) {
        const info = Autofill.graphs(root)[graph - 1];
        const range = info ? ` The visible range is x ${info.bounds[0].toFixed(1)} to ${info.bounds[2].toFixed(1)}, y ${info.bounds[3].toFixed(1)} to ${info.bounds[1].toFixed(1)}.` : ` There is no Graph ${graph}.`;
        return { ok: false, content: `Clicked ${done.length} point(s), then (${point.join(", ")}) failed.${range}` };
      }
      done.push(`(${point.join(", ")})`);
    }
    return { ok: true, content: `Clicked ${done.join(", ")} on Graph ${graph}. Use read_page to see the result.`, summary: `Plotted ${done.join(", ")}` };
  },

  async drag_item(root, { item, item_text: itemText, zone }) {
    const items = Autofill.draggables(root);
    const zones = Autofill.dropZones(root);
    const target = zones[zone - 1];
    const part = el => groupIndex(el, root);
    const sameText = itemText ? items.filter(entry => loose(entry.label) === loose(itemText) && !(target && target.el.contains(entry.el))) : [];
    const source = itemText
      ? sameText.find(entry => target && part(entry.el) === part(target.el)) || sameText[0] || pickLoose(items, itemText)
      : items[item - 1];
    if (source && target && part(source.el) !== part(target.el)) {
      return { ok: false, content: `"${source.label}" is in the word bank for part ${part(source.el)}, but drop zone ${zone} is in part ${part(target.el)}. Pick a zone from the same part.` };
    }
    if (!source || !target) {
      const listing = [
        ...items.map((entry, i) => `Drag item ${i + 1}: "${entry.label.slice(0, 60)}"`),
        ...zones.map((entry, i) => `Drop zone ${i + 1}${entry.label ? ` next to "${entry.label.slice(-50)}"` : ""}${entry.content ? ` holding "${entry.content.slice(0, 40)}"` : ""}`)
      ].join("\n");
      const missing = !source ? `No drag item matched "${itemText ?? item}".` : `There is no drop zone ${zone}.`;
      return { ok: false, content: `${missing} Current drag items and drop zones:\n${listing || "(none detected)"}` };
    }
    const wanted = loose(source.label);
    const placed = () => {
      const zoneNow = Autofill.dropZones(Question.root(true)?.el || root)[zone - 1]?.el || target.el;
      return zoneNow.isConnected && loose(zoneNow.textContent).includes(wanted);
    };
    const findSource = () => pickLoose(Autofill.draggables(Question.root(true)?.el || root).filter(entry => !target.el.contains(entry.el)), source.label)?.el || source.el;
    const findZone = () => Autofill.dropZones(Question.root(true)?.el || root)[zone - 1]?.el || target.el;
    const attempts = [
      async () => {
        await pressElement(findSource());
        await sleep(90);
        await pressElement(findZone());
      },
      async () => dragTo(findSource(), findZone()),
      ...["Enter", "Space"].map(key => async () => {
        const item = findSource();
        item.focus?.({ preventScroll: true });
        await pressKey(item, key);
        await sleep(150);
        const spot = findZone();
        spot.focus?.({ preventScroll: true });
        await pressKey(spot, key);
      })
    ];
    const first = DragMemory.get();
    const order = [first, ...attempts.keys()].filter((index, i, list) => list.indexOf(index) === i);
    for (const index of order) {
      if (placed()) break;
      await attempts[index]();
      await settle(120, 700);
      if (placed()) DragMemory.set(index);
    }
    if (!placed()) {
      return { ok: false, content: `Tried to move "${source.label.slice(0, 60)}" into drop zone ${zone}, but the zone still does not show it. Call read_page to see where things are now.` };
    }
    return { ok: true, content: `Dragged "${source.label.slice(0, 60)}" to drop zone ${zone}.`, summary: `Dragged ${source.label.slice(0, 40)} to zone ${zone}` };
  },

  async type_keys(root, { field, part, keys, clear }) {
    const fields = Autofill.fields(root);
    const target = field ? fields[field - 1] : null;
    if (field && !target) return { ok: false, content: `There is no Field ${field}. Fields available: ${fields.length}.` };
    if (target?.kind === "editor") {
      const parts = editorParts(target.el);
      if (part && !parts[part - 1]) return { ok: false, content: `Field ${field} has ${parts.length} part(s).` };
      if (part) await clickPart(parts[part - 1], target.el);
      else {
        await pressElement(editorOf(target.el));
        await focusEditor(target.el);
      }
    } else if (target) {
      await pressElement(target.el);
      await sleep(80);
    }
    const focused = document.activeElement && document.activeElement !== document.body && !document.activeElement.closest?.(`#${HOST_ID}`)
      ? document.activeElement : target?.el;
    if (!focused) return { ok: false, content: "Nothing on the page has focus. Pass a field number." };
    if (clear) {
      focused.select?.();
      for (let i = 0; i < 40; i++) await pressKey(focused, "Backspace");
    }
    await typeKeys(focused, keys);
    await sleep(120);
    const now = Autofill.fields(Question.root(true)?.el || root);
    const index = target ? fields.indexOf(target) : now.findIndex(item => item.el === focused || item.el.contains(focused) || focused.contains(item.el));
    const shown = index >= 0 ? now[index]?.value : "";
    const where = index >= 0 ? `Field ${index + 1} now shows "${shown}".` : "Typed into the focused element.";
    return { ok: true, content: `Typed "${keys}". ${where}`, summary: `Typed ${keys}${index >= 0 ? ` in field ${index + 1}` : ""}` };
  },

  async read_page(root) {
    const site = Question.site();
    const text = Capture.text(root, Question.pinned ? [] : site.strip).slice(0, CONFIG.capture.maxTextLength);
    const controls = Autofill.describe(root);
    const images = await Capture.images(root);
    return {
      ok: true,
      content: [
        ...images,
        { type: "text", text: `Question area text:\n${text || "(none)"}\n\nAnswer controls:\n${controls || "(none detected)"}` }
      ]
    };
  }
};

function settle(quiet = 350, limit = 2500) {
  return new Promise(resolve => {
    let timer = null;
    let cap = null;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(done, quiet);
    });
    const done = () => {
      observer.disconnect();
      clearTimeout(timer);
      clearTimeout(cap);
      resolve();
    };
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
    timer = setTimeout(done, quiet);
    cap = setTimeout(done, limit);
  });
}
