const UI = {
  label(text, note) {
    return h("span", { class: "r-row-label" }, text, note && h("small", { text: note }));
  },

  row(text, control, note) {
    return h("label", { class: "r-row" }, this.label(text, note), control);
  },

  line(text, control, note) {
    return h("div", { class: "r-row" }, this.label(text, note), control);
  },

  stack(text, control, note) {
    return h("div", { class: "r-row", "data-stack": "true" }, this.label(text, note), control);
  },

  section(title, note, ...rows) {
    return h("section", { class: "r-section" },
      title && h("h3", { text: title }),
      h("div", { class: "r-group" }, rows),
      note && h("p", { text: note }));
  },

  switch(label, checked, onchange) {
    return h("input", {
      class: "r-switch",
      type: "checkbox",
      role: "switch",
      "aria-label": label,
      checked,
      onchange: e => {
        Sounds.play(e.target.checked ? "on" : "off");
        onchange(e.target.checked);
      }
    });
  },

  number(label, value, onchange) {
    return h("input", {
      class: "r-field r-number",
      type: "number",
      min: 0,
      max: 600000,
      step: 1,
      inputmode: "numeric",
      "aria-label": label,
      value,
      onchange: e => e.target.validity.valid && e.target.value !== "" && onchange(e.target.valueAsNumber, e.target)
    });
  },

  ms(label, value, onchange) {
    return h("span", { class: "r-unit" }, this.number(label, value, onchange), "ms");
  },

  field(props) {
    return h("input", { class: "r-field", spellcheck: "false", autocomplete: "off", ...props });
  },

  button(name, text, onclick, extra = {}) {
    return h("button", { class: "r-small-btn", type: "button", onclick, ...extra }, name && icon(name), text && h("span", { text }));
  },

  iconButton(name, title, onclick, extra = {}) {
    return h("button", { class: "r-icon-btn", type: "button", title, "aria-label": title, onclick, ...extra }, icon(name));
  },

  segmented(label, options, value, onchange, wide = false) {
    let current = value;
    const buttons = options.map(([id, text]) => h("button", {
      type: "button",
      role: "radio",
      text,
      onclick: () => {
        if (current === id) return;
        set(id);
        Sounds.play("tick");
        onchange(id);
      }
    }));
    const el = h("div", { class: `r-seg${wide ? " r-seg-wide" : ""}`, role: "radiogroup", "aria-label": label, style: `--n:${options.length}` },
      h("span", { class: "r-seg-thumb", "aria-hidden": "true" }), buttons);

    function set(id) {
      current = id;
      const index = Math.max(0, options.findIndex(([option]) => option === id));
      el.style.setProperty("--i", index);
      buttons.forEach((button, i) => button.setAttribute("aria-checked", String(i === index)));
    }

    set(value);
    return el;
  },

  subhead(title, onBack, ...extra) {
    return h("header", { class: "r-subhead" },
      h("button", { class: "r-back", type: "button", onclick: onBack }, icon("back"), h("span", { text: "Back" })),
      h("h2", { text: title }),
      extra);
  }
};
