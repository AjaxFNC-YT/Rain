const STYLE_PANEL = `
.r-panel {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 2147483646;
  width: min(var(--panel-w, 400px), calc(100vw - 24px));
  height: min(var(--panel-h, 640px), calc(100vh - 24px));
  display: flex;
  flex-direction: column;
  overflow: clip;
  background: var(--glass);
  -webkit-backdrop-filter: blur(40px) saturate(190%);
  backdrop-filter: blur(40px) saturate(190%);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow), 0 0 0 .5px var(--hairline), inset 0 .5px 0 var(--hi);
  opacity: 0;
  visibility: hidden;
  transform: translateY(16px) scale(.96);
  transform-origin: 100% 100%;
  transition: opacity 220ms var(--ease), transform var(--sheet) var(--spring), visibility 0s linear var(--sheet), width var(--sheet) var(--spring), height var(--sheet) var(--spring);
}
.r-panel[data-open="true"] {
  opacity: 1;
  visibility: visible;
  transform: none;
  transition: opacity 220ms var(--ease), transform var(--sheet) var(--spring), visibility 0s, width var(--sheet) var(--spring), height var(--sheet) var(--spring);
}
.r-panel[data-dragging="true"] { transition: none; cursor: grabbing; }
.r[data-solid="true"] .r-panel, .r[data-solid="true"] .r-launcher { -webkit-backdrop-filter: none; backdrop-filter: none; }
.r-panel[data-boot="true"] .r-head,
.r-panel[data-boot="true"] .r-bar,
.r-panel[data-boot="true"] .r-log,
.r-panel[data-boot="true"] .r-foot { animation: r-rise 520ms var(--spring) both; }
.r-panel[data-boot="true"] .r-bar { animation-delay: 60ms; }
.r-panel[data-boot="true"] .r-log { animation-delay: 120ms; }
.r-panel[data-boot="true"] .r-foot { animation-delay: 180ms; }

.r-head {
  position: relative;
  z-index: 3;
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 62px;
  padding: 10px 10px 10px 18px;
  border-bottom: .5px solid var(--line);
  cursor: grab;
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
}
.r-title { flex: 1; min-width: 0; }
.r-title-row { display: flex; align-items: center; gap: 8px; }
.r-title-row b { font-size: 19px; font-weight: 750; letter-spacing: -.03em; line-height: 1.15; }
.r-sub { display: flex; gap: 8px; margin-top: 1px; overflow: hidden; color: var(--muted); font-size: 12.5px; white-space: nowrap; }
.r-sub-site { overflow: hidden; text-overflow: ellipsis; }
.r-sub-activity { color: var(--accent); font-weight: 600; animation: r-fade var(--med) var(--ease); }
.r-sub-activity:empty { display: none; }
.r-tag {
  padding: 0 8px;
  border-radius: 999px;
  background: var(--fill);
  color: var(--muted);
  font: 600 11px/20px var(--font);
  animation: r-grow var(--med) var(--pop);
}
.r-head-tools { display: flex; gap: 2px; }
.r-model-btn {
  flex: none;
  max-width: 150px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  padding: 0 8px 0 12px;
  border: 0;
  border-radius: 999px;
  background: var(--fill);
  font-size: 12.5px;
  font-weight: 650;
  white-space: nowrap;
  transition: background var(--fast) var(--ease), transform var(--fast) var(--ease);
}
.r-model-btn span { overflow: hidden; text-overflow: ellipsis; }
.r-model-btn svg { width: 14px; height: 14px; color: var(--muted); transition: transform var(--med) var(--spring); }
.r-model-btn:hover:not(:disabled) { background: var(--fill-strong); }
.r-model-btn:active:not(:disabled) { transform: scale(.96); }
.r-model-btn[aria-expanded="true"] svg { transform: rotate(180deg); }
.r-icon-btn {
  flex: none;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--muted);
  transition: background var(--fast) var(--ease), color var(--fast) var(--ease), transform var(--fast) var(--ease);
}
.r-icon-btn:hover:not(:disabled) { background: var(--hover); color: var(--text); }
.r-icon-btn:active:not(:disabled) { transform: scale(.9); }
.r-icon-btn[aria-pressed="true"] { background: color-mix(in srgb, var(--accent) 16%, transparent); color: var(--accent); }

.r-views { position: relative; flex: 1; min-height: 0; overflow: clip; display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); }
.r-view {
  grid-area: 1 / 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  transition: opacity 260ms var(--ease), transform var(--sheet) var(--spring), visibility 0s;
}
.r-view[data-active="false"] {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateX(var(--shift, 24px)) scale(.985);
  transition: opacity 160ms var(--ease), transform var(--sheet) var(--spring), visibility 0s linear var(--sheet);
}
.r-view-main[data-active="false"] { --shift: -24px; }

.r-bar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
}
.r-bar-gap { flex: 1; }
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
  transition: background var(--fast) var(--ease), color var(--fast) var(--ease), transform var(--fast) var(--ease);
}
.r-chip:hover:not(:disabled) { background: var(--fill-strong); }
.r-chip:active:not(:disabled) { transform: scale(.95); }
.r-chip span { overflow: hidden; text-overflow: ellipsis; }
.r-chip svg { width: 14px; height: 14px; color: var(--muted); }
.r-chip[data-active="true"] { background: color-mix(in srgb, var(--accent) 16%, transparent); color: var(--accent); }
.r-chip[data-active="true"] svg { color: var(--accent); }
.r-chip-quiet { background: none; color: var(--muted); }
.r-chip-quiet:hover:not(:disabled) { color: var(--text); background: var(--fill); }

.r-auto[aria-pressed="true"] { background: color-mix(in srgb, var(--accent) 16%, transparent); color: var(--accent); }
.r-mini-switch {
  position: relative;
  flex: none;
  width: 26px;
  height: 16px;
  border-radius: 8px;
  background: var(--fill-strong);
  transition: background var(--med) var(--ease);
}
.r-mini-switch::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, .3);
  transition: transform 320ms var(--pop);
}
.r-auto[aria-pressed="true"] .r-mini-switch { background: var(--accent); }
.r-auto[aria-pressed="true"] .r-mini-switch::after { transform: translateX(10px); }
.r-count { color: var(--muted); font-size: 12px; font-variant-numeric: tabular-nums; animation: r-fade var(--med) var(--ease); }

.r-log {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--gap);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 10px 14px 18px;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: var(--line) transparent;
}

.r-empty { margin: auto 0; padding: 4px 4px 10px; animation: r-rise 520ms var(--spring) both; }
.r-empty h2 { margin: 0 0 6px; font-size: 22px; font-weight: 750; letter-spacing: -.03em; }
.r-empty p { margin: 0 0 16px; color: var(--muted); }
.r-keys { display: grid; grid-template-columns: auto 1fr; gap: 8px 12px; margin: 0; color: var(--muted); font-size: 12.5px; }
.r-keys dt { justify-self: start; }
.r-keys dd { margin: 0; align-self: center; }

.r-msg { max-width: 100%; overflow-wrap: anywhere; }
.r-body p, .r-body ul, .r-body ol, .r-body pre, .r-body h4 { margin: 0 0 7px; }
.r-body > :last-child { margin-bottom: 0; }
.r-body ul, .r-body ol { padding-left: 18px; }
.r-body li + li { margin-top: 2px; }
.r-body h4 { font-size: 13.5px; font-weight: 650; }
.r-body strong { font-weight: 650; }
.r-body code { padding: 0 5px; border-radius: 5px; background: var(--fill); font: .9em var(--mono); }
.r-body pre { padding: 10px 12px; border-radius: var(--r-sm); background: var(--fill); overflow: auto; }
.r-body pre code { padding: 0; background: none; }

.r-you { align-self: flex-end; max-width: 84%; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; animation: r-from-right 380ms var(--spring) both; }
.r-you .r-bubble { padding: 8px 14px; border-radius: 20px 20px 6px 20px; background: var(--accent); color: var(--on-accent); }
.r-you-images { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }
.r-you-images img { width: 92px; height: 92px; object-fit: cover; border-radius: 14px; box-shadow: 0 0 0 .5px var(--line); animation: r-grow 360ms var(--pop) both; }

.r-ai { align-self: flex-start; max-width: 94%; display: flex; flex-direction: column; gap: 4px; animation: r-from-left 380ms var(--spring) both; }
.r-ai .r-bubble { padding: 10px 14px; border-radius: 20px 20px 20px 6px; background: var(--bubble); box-shadow: inset 0 0 0 .5px var(--line-soft); }
.r-ai-answer .r-bubble { background: color-mix(in srgb, var(--accent) 12%, var(--bubble)); box-shadow: inset 0 0 0 .5px color-mix(in srgb, var(--accent) 38%, transparent); }
.r-answer-label { margin-bottom: 3px; color: var(--accent); font-size: 12px; font-weight: 700; }
.r[data-bubbles="false"] .r-ai { max-width: 100%; }
.r[data-bubbles="false"] .r-ai .r-bubble { padding: 0 2px; background: none; box-shadow: none; }
.r[data-bubbles="false"] .r-ai-answer .r-bubble { padding: 10px 14px; border-radius: 16px; background: color-mix(in srgb, var(--accent) 10%, transparent); }
.r[data-bubbles="false"] .r-you .r-bubble { border-radius: 16px; }
.r-tools { display: flex; align-items: center; gap: 2px; height: 26px; padding-left: 4px; overflow: hidden; opacity: 0; transition: opacity var(--fast) var(--ease), height 260ms var(--spring); }
.r-ai:not([data-latest="true"]) .r-tools { height: 0; }
.r-ai:hover .r-tools, .r-ai[data-latest="true"] .r-tools, .r-tools:focus-within { height: 26px; opacity: 1; }
.r-ai:not([data-latest="true"]) .r-retry { display: none; }
.r-tool { display: grid; place-items: center; width: 26px; height: 26px; padding: 0; border: 0; border-radius: 8px; background: none; color: var(--faint); transition: background var(--fast) var(--ease), color var(--fast) var(--ease); }
.r-tool:hover { background: var(--hover); color: var(--text); }
.r-tool svg { width: 14px; height: 14px; }
.r-tool[data-done="true"] { color: var(--ok); }
.r-time { color: var(--faint); font-size: 11px; font-variant-numeric: tabular-nums; }
.r-you .r-time { padding-right: 4px; }
.r-tools .r-time { margin-left: 4px; }

.r-action { display: flex; align-items: center; gap: 7px; padding-left: 4px; color: var(--muted); font-size: 12.5px; animation: r-fade 300ms var(--ease) both; }
.r-action svg { width: 14px; height: 14px; color: var(--ok); stroke-width: 2.2; animation: r-grow 320ms var(--pop) both; }
.r-note { align-self: center; color: var(--faint); font-size: 12px; text-align: center; animation: r-fade 300ms var(--ease) both; }
.r-divider { display: flex; align-items: center; gap: 10px; margin: 4px 0; color: var(--faint); font-size: 12px; font-weight: 500; white-space: nowrap; animation: r-fade 300ms var(--ease) both; }
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
  animation: r-rise 360ms var(--spring) both;
}
.r-error svg { margin-top: 2px; color: var(--danger); }
.r-thinking { display: flex; align-items: center; gap: 9px; padding-left: 4px; color: var(--accent); font-size: 12.5px; animation: r-from-left 360ms var(--spring) both; }
.r-thinking span { color: var(--muted); }

.r-foot { flex: none; display: grid; gap: 8px; padding: 6px 12px 12px; }
.r-actions { display: grid; grid-template-columns: 1fr 1fr 1fr 1.3fr; gap: 6px; }
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
  transition: background var(--fast) var(--ease), transform 200ms var(--pop);
}
.r-act:hover:not(:disabled) { background: var(--fill-strong); }
.r-act:active:not(:disabled) { transform: scale(.94); }
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
  animation: r-grow 260ms var(--pop) both;
}

.r-tray { display: flex; gap: 8px; padding: 2px 2px 0; }
.r-thumb { position: relative; animation: r-grow 320ms var(--pop) both; }
.r-thumb img { display: block; width: 58px; height: 58px; object-fit: cover; border-radius: 14px; box-shadow: 0 0 0 .5px var(--line); }
.r-thumb button {
  position: absolute;
  top: -6px;
  right: -6px;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--text);
  color: var(--surface);
  box-shadow: 0 2px 6px rgba(0, 0, 0, .25);
}
.r-thumb button svg { width: 11px; height: 11px; stroke-width: 2.6; }

.r-compose {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  padding: 4px;
  border-radius: 22px;
  background: var(--field);
  box-shadow: inset 0 0 0 .5px var(--line);
  transition: box-shadow var(--med) var(--ease);
}
.r-compose:focus-within { box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--accent) 70%, transparent), 0 0 0 4px color-mix(in srgb, var(--accent) 12%, transparent); }
.r-attach { flex: none; display: grid; place-items: center; width: 32px; height: 32px; padding: 0; border: 0; border-radius: 50%; background: none; color: var(--muted); transition: background var(--fast) var(--ease), color var(--fast) var(--ease), transform var(--fast) var(--ease); }
.r-attach:hover { background: var(--hover); color: var(--text); }
.r-attach:active { transform: scale(.9) rotate(-12deg); }
.r-mode {
  align-self: center;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 22px;
  padding: 0 5px 0 9px;
  border: 0;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  color: var(--accent);
  font-size: 12px;
  font-weight: 650;
  animation: r-grow 260ms var(--pop) both;
}
.r-mode svg { width: 12px; height: 12px; stroke-width: 2.2; }
.r-input {
  flex: 1;
  min-width: 0;
  min-height: 32px;
  max-height: 140px;
  padding: 6px 4px;
  border: 0;
  background: none;
  line-height: 20px;
  resize: none;
  scrollbar-width: none;
  transition: height 160ms var(--ease);
}
.r-input::placeholder { color: var(--faint); }
.r-input:focus-visible { outline: none; }
.r-send {
  flex: none;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--accent);
  color: var(--on-accent);
  transition: opacity var(--fast) var(--ease), background var(--fast) var(--ease), transform 260ms var(--pop);
}
.r-send svg { stroke-width: 2.2; }
.r-send:active { transform: scale(.88); }
.r-send[data-empty="true"]:not([data-stop="true"]) { opacity: .4; transform: scale(.92); }
.r-send[data-stop="true"] { background: var(--text); color: var(--surface); }

.r-scrim { position: absolute; inset: 0; z-index: 4; }
.r-menu {
  position: absolute;
  top: 56px;
  right: 12px;
  z-index: 5;
  width: min(270px, calc(100% - 24px));
  max-height: calc(100% - 72px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 18px;
  background: var(--glass);
  -webkit-backdrop-filter: blur(40px) saturate(200%);
  backdrop-filter: blur(40px) saturate(200%);
  box-shadow: 0 18px 50px rgba(0, 0, 0, .3), 0 0 0 .5px var(--hairline), inset 0 .5px 0 var(--hi);
  transform-origin: 85% 0;
  animation: r-pop 300ms var(--pop) both;
}
.r[data-solid="true"] .r-menu { background: var(--surface); }
.r-menu-scroll { overflow-y: auto; padding: 6px; scrollbar-width: thin; }
.r-menu-group + .r-menu-group { margin-top: 4px; padding-top: 4px; border-top: .5px solid var(--line); }
.r-menu-head { display: flex; justify-content: space-between; padding: 6px 10px 4px; color: var(--muted); font-size: 11.5px; font-weight: 650; }
.r-menu-head em { color: var(--faint); font-style: normal; font-weight: 500; }
.r-menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 0 10px;
  border: 0;
  border-radius: 10px;
  background: none;
  text-align: left;
  transition: background var(--fast) var(--ease);
}
.r-menu-item:hover { background: var(--hover); }
.r-menu-item span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.r-menu-item svg { width: 15px; height: 15px; color: var(--accent); stroke-width: 2.2; opacity: 0; transform: scale(.6); transition: opacity var(--fast) var(--ease), transform 260ms var(--pop); }
.r-menu-item[aria-checked="true"] { font-weight: 650; }
.r-menu-item[aria-checked="true"] svg { opacity: 1; transform: none; }
.r-menu-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 12px; border-top: .5px solid var(--line); color: var(--muted); font-size: 12.5px; }
.r-menu-foot .r-seg { min-width: 0; flex: 1; max-width: 180px; }
.r-menu-link { padding: 11px 12px; border: 0; border-top: .5px solid var(--line); background: none; color: var(--accent); font-weight: 600; text-align: left; transition: background var(--fast) var(--ease); }
.r-menu-link:hover { background: var(--hover); }

.r-drop {
  position: absolute;
  inset: 10px;
  z-index: 6;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 8px;
  border: 2px dashed color-mix(in srgb, var(--accent) 70%, transparent);
  border-radius: 20px;
  background: color-mix(in srgb, var(--accent) 12%, var(--glass));
  color: var(--accent);
  font-weight: 650;
  pointer-events: none;
  animation: r-pop 240ms var(--pop) both;
}
.r-drop svg { width: 28px; height: 28px; }

.r-launcher {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 2147483646;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 16px 0 14px;
  border: 0;
  border-radius: 19px;
  background: var(--glass);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  backdrop-filter: blur(30px) saturate(180%);
  box-shadow: var(--shadow), 0 0 0 .5px var(--hairline), inset 0 .5px 0 var(--hi);
  font-weight: 650;
  animation: r-rise 420ms var(--spring) both;
  transition: transform 200ms var(--pop);
}
.r-launcher:hover { transform: translateY(-2px); }
.r-launcher i { width: 7px; height: 7px; border-radius: 50%; background: var(--faint); transition: background var(--med) var(--ease); }
.r-launcher[data-auto="true"] i { background: var(--ok); }

@media (max-width: 460px) {
  .r-panel { right: 8px; bottom: 8px; width: calc(100vw - 16px); height: min(var(--panel-h, 640px), calc(100vh - 16px)); }
}
`;
