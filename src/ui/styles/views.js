const STYLE_VIEWS = `
.r-subhead {
  flex: none;
  display: flex;
  align-items: center;
  gap: 4px;
  height: 44px;
  padding: 0 8px 0 4px;
  border-bottom: 1px solid var(--line-soft);
}
.r-subhead h2 { flex: 1; margin: 0; font-size: 14px; font-weight: 650; }
.r-back { display: inline-flex; align-items: center; gap: 2px; height: 30px; padding: 0 10px 0 4px; border: 0; border-radius: 999px; background: none; color: var(--accent); font-weight: 500; }
.r-back:hover { background: var(--hover); }

.r-tabs {
  position: relative;
  flex: none;
  display: flex;
  gap: 2px;
  padding: 6px 10px 0;
  overflow-x: auto;
  border-bottom: 1px solid var(--line-soft);
  scrollbar-width: none;
}
.r-tabs::-webkit-scrollbar { display: none; }
.r-tab {
  flex: none;
  height: 32px;
  padding: 0 10px;
  border: 0;
  background: none;
  color: var(--muted);
  font-size: 12.5px;
  font-weight: 580;
  transition: color var(--fast) var(--ease);
}
.r-tab:hover { color: var(--text); }
.r-tab[aria-selected="true"] { color: var(--text); }
.r-tab-line {
  position: absolute;
  bottom: -1px;
  left: 0;
  height: 2px;
  border-radius: 1px;
  background: var(--accent);
  transition: transform var(--med) var(--ease), width var(--med) var(--ease);
}

.r-scroll { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 4px 14px 20px; scrollbar-width: thin; scrollbar-color: var(--line) transparent; }
.r-page { animation: r-in var(--med) var(--ease) both; }
.r-section { margin-top: 18px; }
.r-section h3 { margin: 0 0 6px 14px; color: var(--muted); font-size: 12.5px; font-weight: 600; }
.r-section > p { margin: 6px 14px 0; color: var(--faint); font-size: 12px; line-height: 1.4; }
.r-group { overflow: hidden; border-radius: var(--r); background: var(--group); }
.r-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 6px 12px 6px 14px;
}
.r-row + .r-row { background: linear-gradient(var(--line), var(--line)) 14px 0 / 100% .5px no-repeat; }
.r-row[data-stack="true"] { flex-direction: column; align-items: stretch; gap: 8px; padding-block: 10px; }
.r-row-label { flex: 1; min-width: 0; }
.r-row-label small { display: block; margin-top: 1px; color: var(--muted); font-size: 12px; line-height: 1.35; }
label.r-row { cursor: pointer; }
button.r-row { width: 100%; border: 0; background: none; text-align: left; transition: background var(--fast) var(--ease); }
button.r-row:hover { background: var(--hover); }
.r-row-action { justify-content: center; color: var(--accent); font-weight: 500; }
.r-row-danger { color: var(--danger); }

.r-field {
  width: 100%;
  min-width: 0;
  height: 32px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--r-sm);
  background: var(--fill);
  transition: box-shadow var(--fast) var(--ease);
}
.r-field:focus { box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 65%, transparent); }
.r-field::placeholder { color: var(--faint); }
.r-field:invalid { box-shadow: 0 0 0 2px color-mix(in srgb, var(--danger) 65%, transparent); }
.r-field-mono { font: 12.5px var(--mono); }
.r-inline { display: flex; align-items: center; gap: 6px; }
.r-inline .r-field { flex: 1; }
.r-number { width: 96px; text-align: right; font-variant-numeric: tabular-nums; -moz-appearance: textfield; }
.r-number::-webkit-inner-spin-button, .r-number::-webkit-outer-spin-button { margin: 0; -webkit-appearance: none; }
.r-unit { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); font-size: 12px; }

.r-small-btn {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: var(--fill);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  transition: background var(--fast) var(--ease);
}
.r-small-btn:hover:not(:disabled) { background: var(--fill-strong); }
.r-small-btn svg { width: 14px; height: 14px; }

.r-switch {
  position: relative;
  flex: none;
  width: 44px;
  height: 26px;
  margin: 0;
  border-radius: 13px;
  background: var(--fill-strong);
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  transition: background var(--med) var(--ease);
}
.r-switch::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, .18), 0 0 0 .5px rgba(0, 0, 0, .06);
  transition: transform var(--med) var(--ease);
}
.r-switch:checked { background: var(--accent); }
.r-switch:checked::after { transform: translateX(18px); }

.r-seg {
  position: relative;
  flex: none;
  display: grid;
  grid-template-columns: repeat(var(--n), minmax(0, 1fr));
  min-width: 170px;
  padding: 2px;
  border-radius: 9px;
  background: var(--fill);
}
.r-seg-wide { width: 100%; }
.r-seg-thumb {
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 2px;
  width: calc((100% - 4px) / var(--n));
  border-radius: 7px;
  background: var(--thumb);
  box-shadow: 0 3px 8px rgba(0, 0, 0, .12), 0 0 0 .5px rgba(0, 0, 0, .04);
  transform: translateX(calc(100% * var(--i, 0)));
  transition: transform var(--med) var(--ease);
}
.r-seg button {
  position: relative;
  z-index: 1;
  height: 26px;
  padding: 0 8px;
  border: 0;
  background: none;
  color: var(--muted);
  font-size: 12.5px;
  font-weight: 600;
  transition: color var(--fast) var(--ease);
}
.r-seg button[aria-checked="true"] { color: var(--text); }

.r-swatches { display: flex; gap: 10px; }
.r-swatch {
  position: relative;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--c);
}
.r-swatch::after {
  content: "";
  position: absolute;
  inset: -4px;
  border: 2px solid var(--c);
  border-radius: 50%;
  opacity: 0;
  transform: scale(.85);
  transition: opacity var(--fast) var(--ease), transform var(--med) var(--ease);
}
.r-swatch[aria-checked="true"]::after { opacity: 1; transform: none; }

.r-range { flex: 1; accent-color: var(--accent); }

.r-key {
  min-width: 92px;
  height: 30px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--r-sm);
  background: var(--fill);
  box-shadow: inset 0 -1.5px 0 var(--line);
  font-size: 12.5px;
  font-weight: 650;
  transition: box-shadow var(--fast) var(--ease), color var(--fast) var(--ease);
}
.r-key[data-recording="true"] { box-shadow: 0 0 0 2px var(--accent); color: var(--accent); }
.r-key[data-empty="true"] { color: var(--faint); }

.r-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.r-stat { padding: 10px 12px; }
.r-stat:nth-child(3n + 2), .r-stat:nth-child(3n + 3) { box-shadow: inset .5px 0 0 var(--line); }
.r-stat:nth-child(n + 4) { border-top: .5px solid var(--line); }
.r-stat b { display: block; font-size: 17px; font-weight: 650; font-variant-numeric: tabular-nums; }
.r-stat span { color: var(--muted); font-size: 11.5px; }

.r-sites { margin: 0; padding: 0; list-style: none; }
.r-sites li { display: flex; align-items: center; gap: 8px; min-height: 40px; padding: 6px 14px; color: var(--muted); }
.r-sites li + li { background: linear-gradient(var(--line), var(--line)) 14px 0 / 100% .5px no-repeat; }
.r-sites li[data-current="true"] { color: var(--text); font-weight: 580; }
.r-sites li svg { width: 14px; height: 14px; color: var(--ok); stroke-width: 2.2; }
.r-sites li span { flex: 1; }
.r-sites li em { color: var(--faint); font-size: 12px; font-style: normal; }

.r-version { margin: 20px 14px 0; color: var(--faint); font-size: 12px; }

.r-search { position: relative; flex: none; padding: 10px 12px 6px; }
.r-search svg { position: absolute; top: 18px; left: 21px; width: 14px; height: 14px; color: var(--faint); }
.r-search .r-field { padding-left: 30px; }
.r-chat-list { margin: 0; padding: 4px 6px 12px; list-style: none; }
.r-chat {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 6px 8px 10px;
  border-radius: var(--r);
  cursor: pointer;
  animation: r-in var(--med) var(--ease) both;
  transition: background var(--fast) var(--ease);
}
.r-chat:hover { background: var(--hover); }
.r-chat[data-current="true"] { background: var(--raised); }
.r-chat-text { flex: 1; min-width: 0; }
.r-chat-title { display: block; overflow: hidden; font-weight: 560; text-overflow: ellipsis; white-space: nowrap; }
.r-chat-meta { display: block; color: var(--faint); font-size: 11.5px; }
.r-chat .r-icon-btn { opacity: 0; }
.r-chat:hover .r-icon-btn, .r-chat .r-icon-btn:focus-visible { opacity: 1; }
.r-chat-empty { padding: 28px 16px; color: var(--faint); text-align: center; }
.r-chats-foot { flex: none; display: flex; gap: 6px; padding: 8px 12px 12px; }
.r-chats-foot .r-small-btn { flex: 1; justify-content: center; }
`;
