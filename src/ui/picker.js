function pickElement() {
  return new Promise(resolve => {
    const box = document.createElement("div");
    Object.assign(box.style, {
      position: "fixed",
      zIndex: "2147483646",
      pointerEvents: "none",
      border: "2px solid #5aa9e6",
      borderRadius: "8px",
      background: "rgba(90, 169, 230, .08)",
      boxShadow: "0 0 0 9999px rgba(0, 0, 0, .3)",
      transition: "all 140ms cubic-bezier(.2, .7, .2, 1)",
      opacity: "0"
    });

    const tip = document.createElement("div");
    Object.assign(tip.style, {
      position: "fixed",
      top: "10px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: "2147483647",
      pointerEvents: "none",
      padding: "9px 16px",
      borderRadius: "999px",
      background: "#0b0c0e",
      color: "#f1f2f3",
      font: "500 13px -apple-system, BlinkMacSystemFont, 'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif",
      boxShadow: "0 10px 30px rgba(0, 0, 0, .32)",
      whiteSpace: "nowrap"
    });
    tip.textContent = "Click the question. Up arrow widens, down narrows, Esc cancels";
    document.documentElement.append(box, tip);

    let current = null;
    const trail = [];

    const outline = el => {
      current = el;
      const rect = el.getBoundingClientRect();
      Object.assign(box.style, {
        opacity: "1",
        left: `${rect.left - 4}px`,
        top: `${rect.top - 4}px`,
        width: `${rect.width + 8}px`,
        height: `${rect.height + 8}px`
      });
    };

    const onMove = e => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (el && el.id !== HOST_ID && el !== current && el !== tip) {
        trail.length = 0;
        outline(el);
      }
    };

    const onClick = e => {
      e.preventDefault();
      e.stopPropagation();
      finish(current);
    };

    const onKey = e => {
      if (e.key === "Escape") {
        e.preventDefault();
        finish(null);
      } else if (e.key === "ArrowUp" && current?.parentElement && current.parentElement !== document.documentElement) {
        e.preventDefault();
        trail.push(current);
        outline(current.parentElement);
      } else if (e.key === "ArrowDown" && trail.length) {
        e.preventDefault();
        outline(trail.pop());
      } else if (e.key === "Enter" && current) {
        e.preventDefault();
        finish(current);
      }
    };

    const finish = el => {
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKey, true);
      box.remove();
      tip.remove();
      resolve(el);
    };

    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey, true);
  });
}
