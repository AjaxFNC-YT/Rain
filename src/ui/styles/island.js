const STYLE_ISLAND = `
.r-island {
  --island-bg: var(--glass);
  --island-text: var(--text);
  --island-muted: var(--muted);
  --island-chip: var(--fill-strong);
  --island-ring: 0 0 0 .5px var(--hairline), inset 0 .5px 0 var(--hi);
  --glow: 0 0 0 transparent;
  position: fixed;
  top: 10px;
  left: 50%;
  z-index: 2147483647;
  isolation: isolate;
  box-sizing: border-box;
  width: 44px;
  min-width: 44px;
  height: 44px;
  overflow: hidden;
  border-radius: 22px;
  background: var(--island-bg);
  -webkit-backdrop-filter: blur(30px) saturate(190%);
  backdrop-filter: blur(30px) saturate(190%);
  color: var(--island-text);
  box-shadow: 0 14px 36px rgba(0, 0, 0, .26), var(--island-ring), var(--glow);
  font: 580 13.5px/1 var(--font);
  letter-spacing: -.008em;
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, -30px) scale(.5);
  transition:
    opacity 220ms var(--ease),
    transform 560ms cubic-bezier(.3, 1.4, .5, 1),
    width 520ms cubic-bezier(.3, 1.2, .45, 1),
    box-shadow 400ms var(--ease);
}
.r-island[data-place="bottom"] { top: auto; bottom: 12px; transform: translate(-50%, 30px) scale(.5); }
.r-island[data-show="true"] { opacity: 1; pointer-events: auto; transform: translate(-50%, 0); }
.r-island[data-click="true"] { cursor: pointer; }

.r-island[data-style="siri"] {
  --island-bg: rgba(12, 13, 17, .74);
  --island-text: #f4f5f7;
  --island-muted: rgba(235, 235, 245, .62);
  --island-chip: rgba(255, 255, 255, .15);
  --island-ring: 0 0 0 .5px rgba(255, 255, 255, .1), inset 0 1px 0 rgba(255, 255, 255, .14), inset 0 -1px 0 rgba(255, 255, 255, .04);
  -webkit-backdrop-filter: blur(26px) saturate(220%) brightness(.9);
  backdrop-filter: blur(26px) saturate(220%) brightness(.9);
}
.r-island[data-style="siri"][data-busy="true"] { --glow: 0 0 26px rgba(120, 170, 255, .28), 0 0 44px rgba(255, 120, 170, .16); }
.r-island[data-style="dark"] {
  --island-bg: rgba(12, 13, 15, .94);
  --island-text: #f1f2f4;
  --island-muted: rgba(235, 235, 245, .6);
  --island-chip: rgba(255, 255, 255, .14);
  --island-ring: 0 0 0 .5px rgba(255, 255, 255, .08);
}
.r-island[data-style="accent"] {
  --island-bg: var(--accent);
  --island-text: var(--on-accent);
  --island-muted: color-mix(in srgb, var(--on-accent) 70%, transparent);
  --island-chip: rgba(255, 255, 255, .22);
  --island-ring: 0 0 0 .5px rgba(0, 0, 0, .1);
}
.r[data-solid="true"] .r-island[data-style="glass"] { -webkit-backdrop-filter: none; backdrop-filter: none; --island-bg: var(--surface); }

.r-island-rim {
  position: absolute;
  inset: 0;
  z-index: -1;
  padding: 1.5px;
  border-radius: inherit;
  overflow: hidden;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
  opacity: 0;
  transition: opacity 400ms var(--ease);
}
.r-island-rim::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 640px;
  height: 640px;
  margin: -320px 0 0 -320px;
  background: conic-gradient(#5ac8fa, #7d8bff, #ff6fa8, #ffb340, #5ee6a0, #5ac8fa);
  animation: r-spin 2.4s linear infinite;
}
.r-island[data-style="siri"][data-busy="true"] .r-island-rim { opacity: 1; }
.r-island[data-style="siri"][data-tone="ok"] .r-island-rim { opacity: .75; }
.r-island[data-style="siri"][data-tone="ok"] .r-island-rim::before { background: #30d158; animation: none; }
.r-island[data-style="siri"][data-tone="error"] .r-island-rim { opacity: .85; }
.r-island[data-style="siri"][data-tone="error"] .r-island-rim::before { background: #ff453a; animation: none; }
@keyframes r-spin { to { transform: rotate(360deg); } }

.r-island-inner {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 44px;
  padding: 0 16px 0 14px;
  white-space: nowrap;
}
.r-island-glyph { position: relative; flex: none; display: grid; place-items: center; width: 16px; height: 16px; color: var(--accent); }
.r-island[data-style="accent"] .r-island-glyph { color: var(--on-accent); }
.r-island[data-style="siri"] .r-island-glyph { color: #9cc7ff; }
.r-island-glyph > * { animation: r-grow 320ms var(--pop) both; }
.r-island-glyph svg { width: 15px; height: 15px; stroke-width: 2.2; }
.r-island[data-tone="ok"] .r-island-glyph { color: var(--ok); }
.r-island[data-tone="error"] .r-island-glyph { color: var(--danger); }
.r-island[data-style="siri"][data-tone="ok"] .r-island-glyph { color: #5ee6a0; }
.r-island[data-style="siri"][data-tone="error"] .r-island-glyph { color: #ff6b5f; }
.r-island[data-style="accent"][data-tone] .r-island-glyph { color: var(--on-accent); }
.r-island-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.r-island-drop { width: 15px; height: 15px; animation: r-drop 420ms var(--ease) both; }
.r-island-drop path { fill: currentColor; stroke: none; }
.r-island-ripple {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 10px;
  height: 10px;
  margin: -5px 0 0 -5px;
  border: 1.5px solid currentColor;
  border-radius: 50%;
  opacity: 0;
  animation: r-ripple 600ms var(--ease) 360ms both;
}

.r-orb { position: relative; width: 18px; height: 18px; border-radius: 50%; filter: saturate(1.3); }
.r-orb i {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  mix-blend-mode: screen;
  animation: r-orb 2.2s ease-in-out infinite;
}
.r-orb i:nth-child(1) { background: radial-gradient(circle at 30% 35%, #5ac8fa, transparent 62%); }
.r-orb i:nth-child(2) { background: radial-gradient(circle at 70% 40%, #ff6fa8, transparent 62%); animation-delay: -.7s; }
.r-orb i:nth-child(3) { background: radial-gradient(circle at 50% 75%, #ffb340, transparent 62%); animation-delay: -1.4s; }
.r-island[data-busy="false"] .r-orb i { animation-duration: 4s; }
@keyframes r-orb {
  0%, 100% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.18); }
}

.r-island-text {
  min-width: 0;
  max-width: 410px;
  overflow: hidden;
  text-overflow: ellipsis;
  animation: r-island-text 360ms var(--spring) both;
}
@keyframes r-island-text { from { opacity: 0; transform: translateY(5px); filter: blur(3px); } to { opacity: 1; transform: none; filter: none; } }
.r-island-text b { font-weight: 720; }
.r-island-text kbd {
  display: inline-block;
  min-width: 18px;
  margin: 0 1px;
  padding: 0 5px;
  border-radius: 5px;
  background: var(--island-chip);
  color: var(--island-text);
  font: 650 11px/18px var(--font);
  text-align: center;
}
.r-island-action {
  flex: none;
  height: 28px;
  margin-right: -8px;
  padding: 0 12px;
  border: 0;
  border-radius: 14px;
  background: var(--island-chip);
  color: var(--island-text);
  font: 650 12px var(--font);
  cursor: pointer;
  animation: r-grow 300ms var(--pop) both;
  transition: filter var(--fast) var(--ease), transform 200ms var(--pop);
}
.r-island-action:hover { filter: brightness(1.2); }
.r-island-action:active { transform: scale(.93); }
.r-island-bar { position: absolute; left: 16px; right: 16px; bottom: 5px; height: 2px; border-radius: 1px; background: var(--island-muted); opacity: .6; transform-origin: left; }
`;
