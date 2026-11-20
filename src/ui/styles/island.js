const STYLE_ISLAND = `
.r-island {
  --island-bg: var(--glass);
  --island-text: var(--text);
  --island-muted: var(--muted);
  --island-chip: var(--fill-strong);
  --island-ring: 0 0 0 .5px var(--hairline), inset 0 .5px 0 var(--hi);
  position: fixed;
  top: 12px;
  left: 50%;
  z-index: 2147483647;
  box-sizing: border-box;
  width: 40px;
  min-width: 40px;
  height: 40px;
  overflow: hidden;
  border-radius: 20px;
  background: var(--island-bg);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  backdrop-filter: blur(30px) saturate(180%);
  color: var(--island-text);
  box-shadow: 0 12px 32px rgba(0, 0, 0, .22), var(--island-ring);
  font: 560 13px/1 var(--font);
  letter-spacing: -.005em;
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, -16px) scale(.92);
  transition: opacity 200ms var(--ease), transform 300ms cubic-bezier(.3, 1.3, .5, 1), width 340ms cubic-bezier(.3, 1.15, .45, 1);
}
.r-island[data-place="bottom"] { top: auto; bottom: 14px; transform: translate(-50%, 16px) scale(.92); }
.r-island[data-show="true"] { opacity: 1; pointer-events: auto; transform: translate(-50%, 0); }
.r-island[data-click="true"] { cursor: pointer; }

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

.r-island-inner {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  height: 40px;
  padding: 0 15px 0 13px;
  white-space: nowrap;
}
.r-island-glyph { position: relative; flex: none; display: grid; place-items: center; width: 14px; height: 16px; color: var(--accent); }
.r-island[data-style="accent"] .r-island-glyph { color: var(--on-accent); }
.r-island-glyph > * { animation: r-fade var(--fast) var(--ease); }
.r-island-glyph svg { width: 14px; height: 14px; stroke-width: 2.2; }
.r-island[data-tone="ok"] .r-island-glyph { color: var(--ok); }
.r-island[data-tone="error"] .r-island-glyph { color: var(--danger); }
.r-island[data-style="accent"][data-tone] .r-island-glyph { color: var(--on-accent); }
.r-island-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.r-island-drop { width: 14px; height: 14px; animation: r-drop 420ms var(--ease) both; }
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

.r-island-text {
  min-width: 0;
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  animation: r-in 240ms var(--ease) both;
}
.r-island-text b { font-weight: 700; }
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
  height: 26px;
  margin-right: -7px;
  padding: 0 11px;
  border: 0;
  border-radius: 13px;
  background: var(--island-chip);
  color: var(--island-text);
  font: 650 12px var(--font);
  cursor: pointer;
  transition: filter var(--fast) var(--ease);
}
.r-island-action:hover { filter: brightness(1.15); }
.r-island-bar { position: absolute; left: 14px; right: 14px; bottom: 4px; height: 2px; border-radius: 1px; background: var(--island-muted); opacity: .6; transform-origin: left; }
`;
