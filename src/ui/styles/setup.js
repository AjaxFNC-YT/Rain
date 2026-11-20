const STYLE_SETUP = `
.r-panel[data-setup="true"] .r-head .r-icon-btn:not([title="Hide"]) { display: none; }

.r-setup-scroll { display: flex; flex-direction: column; padding: 0 16px 16px; }
.r-setup-body { flex: 1; display: flex; flex-direction: column; }
.r-setup-page { padding-top: 22px; animation: r-setup-next var(--slow) var(--ease) both; }
.r-setup-body[data-dir="back"] .r-setup-page { animation-name: r-setup-back; }
.r-setup-page > h2 { margin: 0 0 6px 2px; font-size: 21px; font-weight: 720; letter-spacing: -.03em; }
.r-setup-page > p { margin: 0 2px 14px; color: var(--muted); }
.r-setup-page > .r-section:first-of-type { margin-top: 4px; }

.r-setup-fact { align-items: baseline; gap: 14px; }
.r-setup-fact span { flex: none; width: 92px; color: var(--muted); }
.r-setup-fact b { flex: 1; font-weight: 560; }
.r-setup-keys { margin: 0 2px 4px; padding: 12px 14px; border-radius: var(--r); background: var(--group); }

.r-setup-foot {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px 12px;
  border-top: 1px solid var(--line-soft);
}
.r-setup-foot .r-small-btn[hidden] { display: inline-flex !important; visibility: hidden; }
.r-setup-dots { flex: 1; display: flex; justify-content: center; gap: 6px; }
.r-setup-dots i { width: 6px; height: 6px; border-radius: 3px; background: var(--fill-strong); transition: width var(--med) var(--ease), background var(--med) var(--ease); }
.r-setup-dots i[data-on="true"] { width: 16px; background: var(--accent); }
.r-setup-next {
  flex: none;
  height: 34px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: var(--accent);
  color: var(--on-accent);
  font-size: 13px;
  font-weight: 650;
  transition: transform var(--fast) var(--ease), opacity var(--fast) var(--ease);
}
.r-setup-next:active:not(:disabled) { transform: scale(.96); }

@keyframes r-setup-next { from { opacity: 0; transform: translateX(18px); } to { opacity: 1; transform: none; } }
@keyframes r-setup-back { from { opacity: 0; transform: translateX(-18px); } to { opacity: 1; transform: none; } }
`;

const STYLES = [STYLE_TOKENS, STYLE_PANEL, STYLE_VIEWS, STYLE_ISLAND, STYLE_SETUP].join("\n");
