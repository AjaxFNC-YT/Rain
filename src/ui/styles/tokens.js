const STYLE_TOKENS = `
:host { all: initial; }
*, *::before, *::after { box-sizing: border-box; }
[hidden] { display: none !important; }

.r {
  --fast: 140ms;
  --med: 220ms;
  --slow: 320ms;
  --ease: cubic-bezier(.2, .7, .2, 1);
  --r-sm: 8px;
  --r: 12px;
  --r-lg: 24px;
  --font: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif;
  --mono: ui-monospace, "SF Mono", "Cascadia Mono", Consolas, monospace;
  --size: 14px;
  --gap: 12px;
  color: var(--text);
  font: var(--size)/1.45 var(--font);
  letter-spacing: -.006em;
  -webkit-font-smoothing: antialiased;
}
.r[data-density="compact"] { --size: 13px; --gap: 8px; }

.r[data-scheme="dark"] {
  color-scheme: dark;
  --accent: var(--accent-dark);
  --on-accent: #fff;
  --glass: rgba(28, 29, 33, .88);
  --surface: #1c1d21;
  --group: rgba(255, 255, 255, .06);
  --fill: rgba(255, 255, 255, .08);
  --fill-strong: rgba(255, 255, 255, .16);
  --thumb: rgba(255, 255, 255, .22);
  --field: rgba(0, 0, 0, .24);
  --bubble: rgba(255, 255, 255, .07);
  --hover: rgba(255, 255, 255, .07);
  --line: rgba(255, 255, 255, .1);
  --line-soft: rgba(255, 255, 255, .065);
  --hairline: rgba(0, 0, 0, .55);
  --hi: rgba(255, 255, 255, .16);
  --text: #f2f2f4;
  --muted: rgba(235, 235, 245, .62);
  --faint: rgba(235, 235, 245, .36);
  --ok: #34c759;
  --danger: #ff6159;
  --shadow: 0 24px 60px rgba(0, 0, 0, .45), 0 4px 14px rgba(0, 0, 0, .25);
}

.r[data-scheme="light"] {
  color-scheme: light;
  --accent: var(--accent-light);
  --on-accent: #fff;
  --glass: rgba(247, 247, 249, .8);
  --surface: #f2f2f6;
  --group: rgba(255, 255, 255, .72);
  --fill: rgba(118, 118, 128, .12);
  --fill-strong: rgba(118, 118, 128, .2);
  --thumb: #fff;
  --field: rgba(255, 255, 255, .7);
  --bubble: rgba(255, 255, 255, .78);
  --hover: rgba(118, 118, 128, .1);
  --line: rgba(60, 60, 67, .16);
  --line-soft: rgba(60, 60, 67, .09);
  --hairline: rgba(0, 0, 0, .1);
  --hi: rgba(255, 255, 255, .85);
  --text: #1c1c1e;
  --muted: rgba(60, 60, 67, .7);
  --faint: rgba(60, 60, 67, .42);
  --ok: #248a3d;
  --danger: #d70015;
  --shadow: 0 24px 60px rgba(20, 24, 32, .18), 0 4px 14px rgba(20, 24, 32, .08);
}

.r[data-solid="true"] { --glass: var(--surface); }
.r[data-solid="true"][data-scheme="light"] { --group: #fff; --bubble: #fff; }
.r[data-solid="true"][data-scheme="dark"] { --group: #2a2b30; --bubble: #2a2b30; }

:where(.r) :where(button, input, textarea, select) { font: inherit; color: inherit; letter-spacing: inherit; }
.r button { cursor: pointer; -webkit-user-select: none; user-select: none; }
.r button:disabled { opacity: .45; cursor: default; }
.r :focus { outline: none; }
.r :focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.r svg {
  flex: none;
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.r svg[data-icon="stop"] path, .r svg[data-icon="play"] path { fill: currentColor; }

.r kbd {
  display: inline-block;
  min-width: 22px;
  padding: 0 6px;
  border-radius: 6px;
  background: var(--fill);
  box-shadow: inset 0 -1px 0 var(--line);
  color: var(--text);
  font: 600 11.5px/20px var(--font);
  text-align: center;
}

.r-rainfall { display: inline-flex; gap: 3px; height: 16px; overflow: hidden; }
.r-rainfall i {
  width: 2px;
  height: 7px;
  border-radius: 1px;
  background: currentColor;
  animation: r-fall 900ms linear infinite;
}
.r-rainfall i:nth-child(2) { animation-delay: 300ms; }
.r-rainfall i:nth-child(3) { animation-delay: 600ms; }

@keyframes r-fall {
  0% { transform: translateY(-8px); opacity: 0; }
  25% { opacity: 1; }
  100% { transform: translateY(16px); opacity: 0; }
}
@keyframes r-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@keyframes r-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes r-drain { from { transform: scaleX(1); } to { transform: scaleX(0); } }
@keyframes r-drop {
  0% { transform: translateY(-18px) scale(.7); opacity: 0; }
  60% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}
@keyframes r-ripple {
  from { transform: scale(.3); opacity: .9; }
  to { transform: scale(2.4); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .r *, .r *::before, .r *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; transition-duration: 1ms !important; }
}
`;
