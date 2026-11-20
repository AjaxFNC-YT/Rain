const STYLE_VIEWS = `
.r-subhead {
  flex: none;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  height: 46px;
  padding: 0 8px 0 4px;
}
.r-subhead h2 { margin: 0; font-size: 15px; font-weight: 650; text-align: center; animation: r-fade var(--med) var(--ease); }
.r-subhead-gap { justify-self: end; }
.r-back { justify-self: start; display: inline-flex; align-items: center; gap: 2px; height: 32px; padding: 0 10px 0 4px; border: 0; border-radius: 999px; background: none; color: var(--accent); font-weight: 500; transition: background var(--fast) var(--ease), transform var(--fast) var(--ease); }
.r-back:hover { background: var(--hover); }
.r-back:active { transform: scale(.95); }
.r-back svg { width: 18px; height: 18px; stroke-width: 2.2; }

.r-scroll { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 2px 14px 22px; scrollbar-width: thin; scrollbar-color: var(--line) transparent; }
.r-page { animation: r-rise 360ms var(--spring) both; }
.r-page[data-dir="in"] { animation: r-push-in var(--sheet) var(--spring) both; }
.r-page[data-dir="out"] { animation: r-push-out var(--sheet) var(--spring) both; }
.r-section { margin-top: 20px; }
.r-section:first-child { margin-top: 8px; }
.r-section h3 { margin: 0 0 6px 16px; color: var(--muted); font-size: 12.5px; font-weight: 600; }
.r-section > p { margin: 7px 16px 0; color: var(--faint); font-size: 12px; line-height: 1.4; }
.r-group { overflow: hidden; border-radius: 14px; background: var(--group); box-shadow: inset 0 0 0 .5px var(--line-soft); }
.r-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 46px;
  padding: 6px 12px 6px 16px;
}
.r-row + .r-row { background: linear-gradient(var(--line), var(--line)) 16px 0 / 100% .5px no-repeat; }
.r-nav + .r-nav { background: linear-gradient(var(--line), var(--line)) 54px 0 / 100% .5px no-repeat; }
.r-row[data-stack="true"] { flex-direction: column; align-items: stretch; gap: 8px; padding-block: 10px; }
.r-row-label { flex: 1; min-width: 0; }
.r-row-label small { display: block; margin-top: 1px; color: var(--muted); font-size: 12px; line-height: 1.35; }
label.r-row { cursor: pointer; }
button.r-row, a.r-row { width: 100%; border: 0; background-color: transparent; color: inherit; text-align: left; text-decoration: none; transition: background-color var(--fast) var(--ease); }
button.r-row:hover, a.r-row:hover { background-color: var(--hover); }
button.r-row:active, a.r-row:active { background-color: var(--fill-strong); }
.r-row-action { justify-content: center; color: var(--accent) !important; font-weight: 500; }
.r-row-danger { color: var(--danger) !important; }

.r-nav { gap: 12px; padding-left: 12px; }
.r-nav-icon { flex: none; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 8px; background: var(--tint); color: #fff; box-shadow: inset 0 .5px 0 rgba(255, 255, 255, .25); }
.r-nav-icon svg { width: 17px; height: 17px; stroke-width: 1.9; }
.r-nav-detail { overflow: hidden; max-width: 46%; color: var(--muted); font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.r-nav > svg:last-child { width: 15px; height: 15px; color: var(--faint); stroke-width: 2.2; transition: transform var(--fast) var(--ease); }
.r-nav:hover > svg:last-child { transform: translateX(2px); }

.r-field {
  width: 100%;
  min-width: 0;
  height: 34px;
  padding: 0 11px;
  border: 0;
  border-radius: 10px;
  background: var(--fill);
  transition: box-shadow var(--med) var(--ease), background var(--fast) var(--ease);
}
.r-field:focus { box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 65%, transparent), 0 0 0 5px color-mix(in srgb, var(--accent) 14%, transparent); }
.r-field::placeholder { color: var(--faint); }
.r-field:invalid { box-shadow: 0 0 0 2px color-mix(in srgb, var(--danger) 65%, transparent); }
.r-field-mono { font: 12.5px var(--mono); }
.r-inline { display: flex; align-items: center; gap: 6px; }
.r-inline .r-field { flex: 1; }
.r-slider { flex: 1; max-width: 200px; }
.r-number { width: 96px; text-align: right; font-variant-numeric: tabular-nums; -moz-appearance: textfield; }
.r-number::-webkit-inner-spin-button, .r-number::-webkit-outer-spin-button { margin: 0; -webkit-appearance: none; }
.r-unit { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); font-size: 12px; }
.r-keycaps { display: inline-flex; gap: 3px; color: var(--faint); font-size: 12.5px; }

.r-small-btn {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 13px;
  border: 0;
  border-radius: 999px;
  background: var(--fill);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  transition: background var(--fast) var(--ease), transform 200ms var(--pop);
}
.r-small-btn:hover:not(:disabled) { background: var(--fill-strong); }
.r-small-btn:active:not(:disabled) { transform: scale(.95); }
.r-small-btn svg { width: 14px; height: 14px; }

.r-switch {
  position: relative;
  flex: none;
  width: 50px;
  height: 30px;
  margin: 0;
  border-radius: 15px;
  background: var(--fill-strong);
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  transition: background 260ms var(--ease);
}
.r-switch::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 26px;
  height: 26px;
  border-radius: 13px;
  background: #fff;
  box-shadow: 0 3px 8px rgba(0, 0, 0, .15), 0 1px 1px rgba(0, 0, 0, .16), 0 0 0 .5px rgba(0, 0, 0, .04);
  transition: transform 360ms var(--pop), width 180ms var(--ease);
}
.r-switch:active::after { width: 32px; }
.r-switch:checked { background: var(--ok); }
.r-switch:checked::after { transform: translateX(20px); }
.r-switch:checked:active::after { transform: translateX(14px); }

.r-seg {
  position: relative;
  flex: none;
  display: grid;
  grid-template-columns: repeat(var(--n), minmax(0, 1fr));
  min-width: 170px;
  padding: 2px;
  border-radius: 10px;
  background: var(--fill);
}
.r-seg-wide { width: 100%; }
.r-seg-thumb {
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 2px;
  width: calc((100% - 4px) / var(--n));
  border-radius: 8px;
  background: var(--thumb);
  box-shadow: 0 3px 8px rgba(0, 0, 0, .12), 0 0 0 .5px rgba(0, 0, 0, .04);
  transform: translateX(calc(100% * var(--i, 0)));
  transition: transform 380ms var(--spring);
}
.r-seg button {
  position: relative;
  z-index: 1;
  height: 28px;
  padding: 0 8px;
  border: 0;
  background: none;
  color: var(--muted);
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
  transition: color var(--fast) var(--ease);
}
.r-seg button[aria-checked="true"] { color: var(--text); }

.r-swatches { display: flex; gap: 12px; }
.r-swatch { position: relative; width: 26px; height: 26px; padding: 0; border: 0; border-radius: 50%; background: var(--c); transition: transform 240ms var(--pop); }
.r-swatch:hover { transform: scale(1.08); }
.r-swatch::after {
  content: "";
  position: absolute;
  inset: -4px;
  border: 2px solid var(--c);
  border-radius: 50%;
  opacity: 0;
  transform: scale(.8);
  transition: opacity var(--fast) var(--ease), transform 320ms var(--pop);
}
.r-swatch[aria-checked="true"]::after { opacity: 1; transform: none; }

.r-range { flex: 1; min-width: 0; accent-color: var(--accent); }

.r-key {
  min-width: 92px;
  height: 30px;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  background: var(--fill);
  box-shadow: inset 0 -1.5px 0 var(--line);
  font-size: 12.5px;
  font-weight: 650;
  transition: box-shadow var(--fast) var(--ease), color var(--fast) var(--ease);
}
.r-key[data-recording="true"] { box-shadow: 0 0 0 2px var(--accent); color: var(--accent); animation: r-breathe 1.2s var(--ease) infinite; }
.r-key[data-empty="true"] { color: var(--faint); }
@keyframes r-breathe { 50% { box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 30%, transparent); } }

.r-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.r-stat { padding: 10px 14px; }
.r-stat:nth-child(3n + 2), .r-stat:nth-child(3n + 3) { box-shadow: inset .5px 0 0 var(--line); }
.r-stat:nth-child(n + 4) { border-top: .5px solid var(--line); }
.r-stat b { display: block; font-size: 18px; font-weight: 700; font-variant-numeric: tabular-nums; }
.r-stat span { color: var(--muted); font-size: 11.5px; }

.r-sites { margin: 0; padding: 0; list-style: none; }
.r-sites li { display: flex; align-items: center; gap: 8px; min-height: 42px; padding: 6px 16px; color: var(--muted); }
.r-sites li + li { background: linear-gradient(var(--line), var(--line)) 16px 0 / 100% .5px no-repeat; }
.r-sites li[data-current="true"] { color: var(--text); font-weight: 600; }
.r-sites li svg { width: 14px; height: 14px; color: var(--ok); stroke-width: 2.2; }
.r-sites li span { flex: 1; }
.r-sites li em { color: var(--faint); font-size: 12px; font-style: normal; }

.r-about { display: grid; justify-items: center; gap: 2px; padding: 26px 0 6px; }
.r-about b { font-size: 26px; font-weight: 750; letter-spacing: -.035em; }
.r-about span { color: var(--muted); font-size: 13px; }
.r-none { margin: 30px 16px; color: var(--faint); text-align: center; }

.r-search { position: relative; flex: none; padding: 4px 14px 8px; }
.r-search svg { position: absolute; top: 13px; left: 25px; width: 15px; height: 15px; color: var(--faint); }
.r-search .r-field { padding-left: 32px; border-radius: 11px; }
.r-search-settings { padding: 6px 0 0; }
.r-search-settings svg { top: 15px; left: 11px; }

.r-chat-scroll { padding: 0 8px 14px; }
.r-chat-group h3 { margin: 14px 10px 4px; color: var(--muted); font-size: 12px; font-weight: 650; }
.r-chat {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 6px 9px 12px;
  border-radius: 12px;
  cursor: pointer;
  animation: r-rise 380ms var(--spring) both;
  transition: background var(--fast) var(--ease);
}
.r-chat:hover { background: var(--hover); }
.r-chat[data-current="true"] { background: color-mix(in srgb, var(--accent) 13%, transparent); }
.r-chat-text { flex: 1; min-width: 0; }
.r-chat-title { display: block; overflow: hidden; font-weight: 580; text-overflow: ellipsis; white-space: nowrap; }
.r-chat-meta { display: block; color: var(--faint); font-size: 11.5px; }
.r-chat-tools { display: flex; opacity: 0; transform: translateX(6px); transition: opacity var(--fast) var(--ease), transform 260ms var(--spring); }
.r-chat:hover .r-chat-tools, .r-chat-tools:focus-within { opacity: 1; transform: none; }
.r-chat-tools .r-icon-btn { width: 28px; height: 28px; }
.r-chat-tools .r-icon-btn svg { width: 15px; height: 15px; }
.r-chat-tools .r-icon-btn[aria-pressed="true"] { color: var(--accent); background: none; }
.r-rename { height: 30px; }
.r-chat-empty { padding: 30px 16px; color: var(--faint); text-align: center; }
.r-chats-foot { flex: none; display: flex; gap: 6px; padding: 8px 12px 12px; }
.r-chats-foot .r-small-btn { flex: 1; justify-content: center; }
`;
