const STYLE_PANEL = `
.r-panel {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 2147483646;
  width: min(392px, calc(100vw - 24px));
  height: min(640px, calc(100vh - 24px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--glass);
  -webkit-backdrop-filter: blur(36px) saturate(180%);
  backdrop-filter: blur(36px) saturate(180%);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow), 0 0 0 .5px var(--hairline), inset 0 .5px 0 var(--hi);
  opacity: 0;
  visibility: hidden;
  transform: translateY(10px) scale(.985);
  transform-origin: 100% 100%;
  transition: opacity var(--med) var(--ease), transform var(--med) var(--ease), visibility 0s linear var(--med);
}
.r-panel[data-open="true"] {
  opacity: 1;
  visibility: visible;
  transform: none;
  transition: opacity var(--med) var(--ease), transform var(--med) var(--ease), visibility 0s;
}
.r-panel[data-dragging="true"] { transition: none; cursor: grabbing; }
.r[data-solid="true"] .r-panel, .r[data-solid="true"] .r-launcher { -webkit-backdrop-filter: none; backdrop-filter: none; }
.r-panel[data-boot="true"] .r-head,
.r-panel[data-boot="true"] .r-bar,
.r-panel[data-boot="true"] .r-log,
.r-panel[data-boot="true"] .r-foot { animation: r-in var(--slow) var(--ease) both; }
.r-panel[data-boot="true"] .r-bar { animation-delay: 50ms; }
.r-panel[data-boot="true"] .r-log { animation-delay: 100ms; }
.r-panel[data-boot="true"] .r-foot { animation-delay: 150ms; }

.r-head {
  flex: none;
  display: flex;
  align-items: center;
  gap: 4px;
  height: 50px;
  padding: 0 10px 0 18px;
  border-bottom: 1px solid var(--line-soft);
  cursor: grab;
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
}
.r-brand { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: 7px; overflow: hidden; white-space: nowrap; }
.r-brand b { font-size: 16px; font-weight: 700; letter-spacing: -.02em; }
.r-brand-sep { color: var(--faint); }
.r-brand-site { overflow: hidden; color: var(--muted); font-weight: 520; text-overflow: ellipsis; }
.r-tag {
  align-self: center;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--fill);
  color: var(--muted);
  font: 600 11px/20px var(--font);
  animation: r-fade var(--med) var(--ease);
}
.r-icon-btn {
  flex: none;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--muted);
  transition: background var(--fast) var(--ease), color var(--fast) var(--ease);
}
.r-icon-btn:hover:not(:disabled) { background: var(--hover); color: var(--text); }
.r-icon-btn[aria-pressed="true"] { color: var(--accent); }

.r-views { position: relative; flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); }
.r-view {
  grid-area: 1 / 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  transition: opacity var(--med) var(--ease), transform var(--med) var(--ease), visibility 0s;
}
.r-view[data-active="false"] {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateX(var(--shift, 14px));
  transition: opacity var(--fast) var(--ease), transform var(--med) var(--ease), visibility 0s linear var(--med);
}
.r-view-main[data-active="false"] { --shift: -14px; }

.r-bar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--line-soft);
}
.r-chip {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 30px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: var(--fill);
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
  transition: border-color var(--fast) var(--ease), background var(--fast) var(--ease), color var(--fast) var(--ease);
}
.r-chip:hover:not(:disabled) { background: var(--fill-strong); }
.r-chip span { overflow: hidden; text-overflow: ellipsis; }
.r-chip svg { width: 14px; height: 14px; color: var(--muted); }
.r-chip[data-active="true"] { background: color-mix(in srgb, var(--accent) 16%, transparent); color: var(--accent); }
.r-chip[data-active="true"] svg { color: var(--accent); }
.r-chip-model { flex: 1; justify-content: flex-end; background: none; color: var(--muted); font-weight: 500; }
.r-chip-model:hover:not(:disabled) { background: var(--fill); color: var(--text); }

.r-auto[aria-pressed="true"] { background: color-mix(in srgb, var(--accent) 16%, transparent); }
.r-mini-switch {
  position: relative;
  flex: none;
  width: 24px;
  height: 14px;
  border-radius: 7px;
  background: var(--fill-strong);
  transition: background var(--med) var(--ease);
}
.r-mini-switch::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, .25);
  transition: transform var(--med) var(--ease);
}
.r-auto[aria-pressed="true"] .r-mini-switch { background: var(--accent); }
.r-auto[aria-pressed="true"] .r-mini-switch::after { transform: translateX(10px); }
.r-count { color: var(--muted); font-size: 12px; font-variant-numeric: tabular-nums; }

.r-log {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--gap);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 14px 16px 18px;
  scrollbar-width: thin;
  scrollbar-color: var(--line) transparent;
}

.r-empty { margin: auto 0; padding: 4px 2px; animation: r-in var(--slow) var(--ease) both; }
.r-empty h2 { margin: 0 0 4px; font-size: 18px; font-weight: 700; letter-spacing: -.025em; }
.r-empty p { margin: 0 0 14px; color: var(--muted); }
.r-keys { display: grid; grid-template-columns: auto 1fr; gap: 6px 12px; margin: 0; color: var(--muted); font-size: 12.5px; }
.r-keys dt { justify-self: start; }
.r-keys dd { margin: 0; }

.r-msg { max-width: 100%; overflow-wrap: anywhere; animation: r-in var(--med) var(--ease) both; }
.r-body p, .r-body ul, .r-body ol, .r-body pre, .r-body h4 { margin: 0 0 7px; }
.r-body > :last-child { margin-bottom: 0; }
.r-body ul, .r-body ol { padding-left: 18px; }
.r-body li + li { margin-top: 2px; }
.r-body h4 { font-size: 13.5px; font-weight: 650; }
.r-body strong { font-weight: 650; }
.r-body code { padding: 0 5px; border-radius: 5px; background: var(--fill); font: 12.5px var(--mono); }
.r-body pre { padding: 10px 12px; border-radius: var(--r-sm); background: var(--fill); overflow: auto; }
.r-body pre code { padding: 0; background: none; }

.r-you {
  align-self: flex-end;
  max-width: 82%;
  padding: 7px 13px;
  border-radius: 18px 18px 5px 18px;
  background: var(--accent);
  color: var(--on-accent);
}
.r-rain { position: relative; padding-right: 26px; }
.r-msg-copy {
  position: absolute;
  top: -2px;
  right: -4px;
  opacity: 0;
  width: 26px;
  height: 26px;
}
.r-rain:hover .r-msg-copy, .r-msg-copy:focus-visible { opacity: 1; }
.r-msg-copy[data-done="true"] { opacity: 1; color: var(--ok); }

.r-answer {
  padding: 10px 14px 12px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--accent) 13%, var(--bubble));
  box-shadow: inset 0 0 0 .5px color-mix(in srgb, var(--accent) 45%, transparent);
}
.r-answer-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px; color: var(--accent); font-size: 12px; font-weight: 650; }
.r-answer-head .r-icon-btn { width: 24px; height: 24px; margin-right: -6px; color: var(--accent); }
.r-answer-head .r-icon-btn[data-done="true"] { color: var(--ok); }

.r-action { display: flex; align-items: center; gap: 7px; color: var(--muted); font-size: 12.5px; }
.r-action svg { width: 14px; height: 14px; color: var(--ok); stroke-width: 2.2; }
.r-note { align-self: center; color: var(--faint); font-size: 12px; text-align: center; }
.r-divider { display: flex; align-items: center; gap: 10px; margin: 4px 0; color: var(--faint); font-size: 12px; font-weight: 500; white-space: nowrap; }
.r-divider i { flex: 1; height: .5px; background: var(--line); }
.r-divider time { font-variant-numeric: tabular-nums; }
.r-error {
  display: flex;
  gap: 8px;
  padding: 10px 13px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--danger) 13%, var(--bubble));
  box-shadow: inset 0 0 0 .5px color-mix(in srgb, var(--danger) 40%, transparent);
  font-size: 13px;
}
.r-error svg { margin-top: 2px; color: var(--danger); }
.r-thinking { display: flex; align-items: center; gap: 9px; color: var(--accent); font-size: 12.5px; animation: r-fade var(--med) var(--ease); }
.r-thinking span { color: var(--muted); }

.r-foot { flex: none; display: grid; gap: 8px; padding: 8px 12px 12px; }
.r-actions { display: grid; grid-template-columns: 1fr 1fr 1fr 1.3fr; gap: 5px; }
.r-act {
  position: relative;
  height: 34px;
  padding: 0 6px;
  border: 0;
  border-radius: 999px;
  background: var(--fill);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  transition: border-color var(--fast) var(--ease), background var(--fast) var(--ease), transform var(--fast) var(--ease);
}
.r-act:hover:not(:disabled) { background: var(--fill-strong); }
.r-act:active:not(:disabled) { transform: scale(.96); }
.r-act-primary { background: var(--accent); color: var(--on-accent); }
.r-act-primary:hover:not(:disabled) { background: color-mix(in srgb, var(--accent) 86%, #fff); }
.r-badge {
  position: absolute;
  top: -6px;
  right: -4px;
  min-width: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--accent);
  color: var(--on-accent);
  font: 700 10.5px/16px var(--font);
  animation: r-in var(--fast) var(--ease);
}

.r-compose {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  padding: 4px 4px 4px 14px;
  border-radius: 21px;
  background: var(--field);
  box-shadow: inset 0 0 0 .5px var(--line);
  transition: box-shadow var(--fast) var(--ease);
}
.r-compose:focus-within { box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--accent) 70%, transparent); }
.r-mode {
  align-self: center;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 22px;
  margin-left: -8px;
  padding: 0 5px 0 9px;
  border: 0;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  color: var(--accent);
  font-size: 12px;
  font-weight: 650;
  animation: r-in var(--fast) var(--ease);
}
.r-mode svg { width: 12px; height: 12px; stroke-width: 2.2; }
.r-input {
  flex: 1;
  min-width: 0;
  min-height: 30px;
  max-height: 120px;
  padding: 5px 0;
  border: 0;
  background: none;
  line-height: 20px;
  resize: none;
  scrollbar-width: none;
}
.r-input::placeholder { color: var(--faint); }
.r-input:focus-visible { outline: none; }
.r-send {
  flex: none;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--accent);
  color: var(--on-accent);
  transition: opacity var(--fast) var(--ease), background var(--fast) var(--ease);
}
.r-send svg { stroke-width: 2.2; }
.r-send[data-empty="true"]:not([data-stop="true"]) { opacity: .4; }
.r-send[data-stop="true"] { background: var(--text); color: var(--surface); }

.r-launcher {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 2147483646;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 16px 0 14px;
  border: 0;
  border-radius: 18px;
  background: var(--glass);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  backdrop-filter: blur(30px) saturate(180%);
  box-shadow: var(--shadow), 0 0 0 .5px var(--hairline), inset 0 .5px 0 var(--hi);
  font-weight: 650;
  animation: r-in var(--med) var(--ease);
}
.r-launcher i { width: 7px; height: 7px; border-radius: 50%; background: var(--faint); transition: background var(--med) var(--ease); }
.r-launcher[data-auto="true"] i { background: var(--ok); }

@media (max-width: 460px) {
  .r-panel { right: 8px; bottom: 8px; width: calc(100vw - 16px); height: min(640px, calc(100vh - 16px)); }
}
`;
