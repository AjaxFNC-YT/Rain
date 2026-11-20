function pickElement(current) {
  const settings = Settings.load();
  const accent = (CONFIG.ui.accents.find(entry => entry.id === settings.accent) || CONFIG.ui.accents[0]).dark;
  const font = "-apple-system, BlinkMacSystemFont, 'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif";

  return new Promise(resolve => {
    const layer = document.createElement("div");
    Object.assign(layer.style, { position: "fixed", inset: "0", zIndex: "2147483646", pointerEvents: "none" });

    const shade = document.createElement("div");
    Object.assign(shade.style, { position: "fixed", inset: "0", background: "rgba(10, 12, 16, .28)", opacity: "0", transition: "opacity 160ms ease-out" });

    const was = document.createElement("div");
    Object.assign(was.style, { position: "fixed", border: "1.5px dashed rgba(255, 255, 255, .55)", borderRadius: "10px", display: "none" });

    const box = document.createElement("div");
    Object.assign(box.style, {
      position: "fixed",
      border: `2px solid ${accent}`,
      borderRadius: "10px",
      background: `${accent}1f`,
      boxShadow: "0 0 0 9999px rgba(10, 12, 16, .32)",
      opacity: "0",
      transition: "left 120ms ease-out, top 120ms ease-out, width 120ms ease-out, height 120ms ease-out, opacity 120ms ease-out"
    });

    const tag = document.createElement("div");
    Object.assign(tag.style, {
      position: "fixed",
      padding: "3px 8px",
      borderRadius: "6px",
      background: accent,
      color: "#fff",
      font: `600 11.5px/16px ${font}`,
      whiteSpace: "nowrap",
      opacity: "0",
      transition: "opacity 120ms ease-out"
    });

    const bar = document.createElement("div");
    Object.assign(bar.style, {
      position: "fixed",
      left: "50%",
      bottom: "18px",
      transform: "translate(-50%, 12px)",
      display: "flex",
      gap: "14px",
      alignItems: "center",
      padding: "10px 16px",
      borderRadius: "14px",
      background: "rgba(22, 23, 27, .9)",
      backdropFilter: "blur(24px) saturate(180%)",
      webkitBackdropFilter: "blur(24px) saturate(180%)",
      color: "#f1f2f4",
      font: `500 13px ${font}`,
      boxShadow: "0 14px 34px rgba(0, 0, 0, .35), 0 0 0 .5px rgba(255, 255, 255, .08)",
      opacity: "0",
      transition: "opacity 180ms ease-out, transform 220ms ease-out",
      whiteSpace: "nowrap"
    });
    const key = text => `<span style="display:inline-block;min-width:20px;padding:0 6px;margin-right:6px;border-radius:5px;background:rgba(255,255,255,.14);font:600 11px/19px ${font};text-align:center">${text}</span>`;
    bar.innerHTML = `<span><b>Pick the question</b></span><span>${key("Click")}select</span><span>${key("Scroll")}${key("↑")}${key("↓")}size</span><span>${key("Esc")}cancel</span>`;

    layer.append(shade, was, box, tag);
    document.documentElement.append(layer, bar);
    requestAnimationFrame(() => {
      shade.style.opacity = "1";
      bar.style.opacity = "1";
      bar.style.transform = "translate(-50%, 0)";
    });

    if (current?.isConnected) {
      const rect = current.getBoundingClientRect();
      Object.assign(was.style, { display: "block", left: `${rect.left - 4}px`, top: `${rect.top - 4}px`, width: `${rect.width + 8}px`, height: `${rect.height + 8}px` });
    }

    let target = null;
    const trail = [];

    const describe = el => {
      const name = el.tagName.toLowerCase();
      const cls = String(el.className?.baseVal ?? el.className ?? "").split(/\s+/).filter(Boolean)[0];
      const length = clean(el.innerText || el.textContent).length;
      return `${name}${cls ? `.${cls.slice(0, 28)}` : ""}  ${length.toLocaleString()} chars`;
    };

    const outline = el => {
      target = el;
      const rect = el.getBoundingClientRect();
      Object.assign(box.style, { opacity: "1", left: `${rect.left - 4}px`, top: `${rect.top - 4}px`, width: `${rect.width + 8}px`, height: `${rect.height + 8}px` });
      tag.textContent = describe(el);
      const above = rect.top - 28 > 4;
      Object.assign(tag.style, { opacity: "1", left: `${Math.max(6, Math.min(rect.left - 4, innerWidth - 260))}px`, top: `${above ? rect.top - 28 : rect.bottom + 8}px` });
    };

    const widen = () => {
      if (target?.parentElement && target.parentElement !== document.documentElement) {
        trail.push(target);
        outline(target.parentElement);
      }
    };
    const narrow = () => {
      if (trail.length) outline(trail.pop());
    };

    const onMove = e => {
      const host = document.getElementById(HOST_ID);
      const el = document.elementsFromPoint(e.clientX, e.clientY).find(node => node !== host && !layer.contains(node) && node !== bar && !bar.contains(node));
      if (el && el !== target && !trail.length) outline(el);
      else if (el && trail.length && !trail[0].contains(el) && !el.contains(trail[0])) {
        trail.length = 0;
        outline(el);
      }
    };

    const onWheel = e => {
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.deltaY < 0) widen();
      else narrow();
    };

    const onClick = e => {
      e.preventDefault();
      e.stopPropagation();
      finish(target);
    };

    const block = e => {
      e.preventDefault();
      e.stopPropagation();
    };

    const onKey = e => {
      if (e.key === "Escape") {
        block(e);
        finish(null);
      } else if (e.key === "ArrowUp") {
        block(e);
        widen();
      } else if (e.key === "ArrowDown") {
        block(e);
        narrow();
      } else if (e.key === "Enter" && target) {
        block(e);
        finish(target);
      }
    };

    const finish = el => {
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("mousedown", block, true);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("wheel", onWheel, { capture: true });
      shade.style.opacity = "0";
      box.style.opacity = "0";
      tag.style.opacity = "0";
      bar.style.opacity = "0";
      bar.style.transform = "translate(-50%, 12px)";
      setTimeout(() => {
        layer.remove();
        bar.remove();
      }, 200);
      resolve(el);
    };

    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("mousedown", block, true);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("wheel", onWheel, { capture: true, passive: false });
  });
}
