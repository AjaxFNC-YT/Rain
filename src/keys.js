const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "Meta", "AltGraph", "CapsLock"]);
const KEY_NAMES = {
  Backquote: "`",
  Minus: "-",
  Equal: "=",
  BracketLeft: "[",
  BracketRight: "]",
  Backslash: "\\",
  Semicolon: ";",
  Quote: "'",
  Comma: ",",
  Period: ".",
  Slash: "/",
  Space: "Space",
  Enter: "Enter",
  Escape: "Esc",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→"
};

const KEY_ACTIONS = [
  { id: "toggle", label: "Show or hide Rain", note: "Works while Rain is fully hidden" },
  { id: "answer", label: "Answer this question" },
  { id: "auto", label: "Turn Auto Answer on or off" },
  { id: "pick", label: "Pick the question area" },
  { id: "panic", label: "Panic", note: "Runs the panic action from Hiding and panic" }
];

const Keys = {
  combo(e) {
    if (MODIFIER_KEYS.has(e.key) || !e.code) return null;
    const mods = [e.ctrlKey && "Ctrl", e.altKey && "Alt", e.shiftKey && "Shift", e.metaKey && "Meta"].filter(Boolean);
    return [...mods, e.code].join("+");
  },

  label(combo) {
    if (!combo) return "Not set";
    return combo.split("+").map(part => KEY_NAMES[part] || part.replace(/^Key|^Digit|^Numpad/, "")).join(" + ");
  },

  parts(combo) {
    return combo ? this.label(combo).split(" + ") : [];
  },

  typing(e) {
    const target = e.composedPath?.()[0] || e.target;
    return Boolean(target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName || ""));
  },

  plain(combo) {
    return !/(^|\+)(Ctrl|Alt|Meta)\+/.test(combo);
  },

  action(e, keys) {
    const combo = this.combo(e);
    if (!combo) return null;
    const match = KEY_ACTIONS.find(action => keys[action.id] === combo);
    if (!match || (this.plain(combo) && this.typing(e))) return null;
    return match.id;
  }
};
