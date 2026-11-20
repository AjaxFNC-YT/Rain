const STYLE_SETUP = `
.r-panel[data-setup="true"] .r-head-tools .r-icon-btn:not([title="Hide"]),
.r-panel[data-setup="true"] .r-model-btn { display: none; }

.r-setup-progress { flex: none; height: 3px; margin: 0 18px; border-radius: 2px; background: var(--fill); overflow: hidden; }
.r-setup-progress i { display: block; height: 100%; border-radius: 2px; background: var(--accent); transform: scaleX(var(--p, .2)); transform-origin: left; transition: transform 520ms var(--spring); }

.r-setup-scroll { display: flex; flex-direction: column; padding: 0 16px 16px; }
.r-setup-body { flex: 1; display: flex; flex-direction: column; }
.r-setup-page { padding-top: 22px; animation: r-push-in var(--sheet) var(--spring) both; }
.r-setup-body[data-dir="back"] .r-setup-page { animation-name: r-push-out; }
.r-setup-page > h2 { margin: 0 0 6px 2px; font-size: 24px; font-weight: 750; letter-spacing: -.035em; }
.r-setup-page > p { margin: 0 2px 16px; color: var(--muted); }
.r-setup-page > .r-section:first-of-type { margin-top: 4px; }

.r-setup-fact { align-items: baseline; gap: 14px; }
.r-setup-fact span { flex: none; width: 82px; color: var(--muted); }
.r-setup-fact b { flex: 1; font-weight: 560; }
.r-setup-keys { margin: 0 2px 4px; padding: 14px 16px; border-radius: 14px; background: var(--group); box-shadow: inset 0 0 0 .5px var(--line-soft); }
.r-setup-result { min-height: 18px; margin: 8px 16px 0; color: var(--muted); font-size: 12.5px; }
.r-setup-result[data-tone="ok"] { color: var(--ok); animation: r-fade var(--med) var(--ease); }
.r-setup-result[data-tone="error"] { color: var(--danger); animation: r-fade var(--med) var(--ease); }

.r-choices { display: grid; gap: 8px; }
.r-choice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 13px 14px;
  border: 0;
  border-radius: 14px;
  background: var(--group);
  box-shadow: inset 0 0 0 .5px var(--line-soft);
  text-align: left;
  animation: r-rise 420ms var(--spring) both;
  transition: box-shadow var(--med) var(--ease), background var(--med) var(--ease), transform 200ms var(--pop);
}
.r-choice:nth-child(2) { animation-delay: 50ms; }
.r-choice:nth-child(3) { animation-delay: 100ms; }
.r-choice:active { transform: scale(.98); }
.r-choice[aria-checked="true"] { background: color-mix(in srgb, var(--accent) 12%, var(--group)); box-shadow: inset 0 0 0 1.5px var(--accent); }
.r-choice-dot { position: relative; flex: none; width: 20px; height: 20px; margin-top: 1px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px var(--faint); transition: box-shadow var(--med) var(--ease); }
.r-choice-dot::after { content: ""; position: absolute; inset: 5px; border-radius: 50%; background: var(--accent); transform: scale(0); transition: transform 320ms var(--pop); }
.r-choice[aria-checked="true"] .r-choice-dot { box-shadow: inset 0 0 0 1.5px var(--accent); }
.r-choice[aria-checked="true"] .r-choice-dot::after { transform: none; }
.r-choice-text b { display: block; font-size: 14.5px; font-weight: 650; }
.r-choice-text small { display: block; margin-top: 2px; color: var(--muted); font-size: 12.5px; line-height: 1.35; }

.r-setup-foot {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px 12px;
  border-top: .5px solid var(--line);
}
.r-setup-foot .r-small-btn[hidden] { display: inline-flex !important; visibility: hidden; }
.r-setup-count { flex: 1; color: var(--faint); font-size: 12px; text-align: center; font-variant-numeric: tabular-nums; }
.r-setup-next {
  flex: none;
  height: 36px;
  padding: 0 18px;
  border: 0;
  border-radius: 999px;
  background: var(--accent);
  color: var(--on-accent);
  font-size: 13.5px;
  font-weight: 650;
  transition: transform 220ms var(--pop), opacity var(--fast) var(--ease), filter var(--fast) var(--ease);
}
.r-setup-next:hover:not(:disabled) { filter: brightness(1.08); }
.r-setup-next:active:not(:disabled) { transform: scale(.94); }
`;

const STYLES = [STYLE_TOKENS, STYLE_PANEL, STYLE_VIEWS, STYLE_ISLAND, STYLE_SETUP].join("\n");
