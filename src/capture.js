const MATH_SELECTOR = ".katex, mjx-container, .MathJax, .MathJax_Display, .MathJax_SVG, math";
const BLOCK_TAGS = new Set(["P", "DIV", "LI", "TR", "H1", "H2", "H3", "H4", "H5", "H6", "SECTION", "ARTICLE", "TABLE", "UL", "OL", "FIGURE", "BLOCKQUOTE", "PRE", "LABEL", "FIELDSET"]);
const SKIP_TAGS = new Set(["STYLE", "NOSCRIPT", "TEMPLATE", "IFRAME", "CANVAS", "VIDEO", "AUDIO", "OBJECT", "LINK", "META"]);
const SVG_STYLE_PROPS = ["fill", "stroke", "stroke-width", "stroke-dasharray", "opacity", "font-size", "font-family", "font-weight", "text-anchor"];
const BLOCK_DISPLAY = /^(block|flex|grid|table|list-item|table-row|flow-root)$/;
const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);

async function imageFromFile(file) {
  const bitmap = await createImageBitmap(file);
  const draw = (side, type, quality) => {
    const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL(type, quality);
  };
  const lossless = file.type === "image/png" && file.size < 1_500_000;
  const block = blockFromDataUrl(draw(CONFIG.capture.maxImageSide, lossless ? "image/png" : "image/jpeg", .9));
  const thumb = draw(240, "image/jpeg", .72);
  bitmap.close?.();
  if (!block) throw new RainError("That image couldn't be read");
  return { block, thumb };
}

const Capture = {
  text(root, strip = [], includeAnswers = true, bare = false, skip = []) {
    const stripped = new Set([...(strip.length ? root.querySelectorAll(strip.join(",")) : []), ...skip]);
    const raw = readNode(root, stripped, includeAnswers, bare);
    return raw
      .replace(/[ \t ]+/g, " ")
      .replace(/ *\n */g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  },

  async images(root) {
    const { maxImages, minImageSize } = CONFIG.capture;
    const found = [];

    for (const el of root.querySelectorAll("svg, img, canvas")) {
      if (found.length >= maxImages) break;
      if (el.closest(MATH_SELECTOR) || el.closest(`#${HOST_ID}`) || el.closest(".mq-math-mode, .mq-editable-field")) continue;
      if (el.tagName.toLowerCase() === "svg" && el.parentElement?.closest("svg")) continue;

      const rect = el.getBoundingClientRect();
      if (rect.width < minImageSize || rect.height < minImageSize) continue;

      try {
        const block = await imageBlock(el, rect);
        if (block) found.push(block);
      } catch {}
    }
    return found;
  }
};

function readNode(node, stripped, includeAnswers, bare = false) {
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue;
  if (node.nodeType !== Node.ELEMENT_NODE || stripped.has(node) || node.id === HOST_ID) return "";
  if (bare && (node.matches(`${MATH_SELECTOR}, .mq-math-mode, .mq-editable-field, math-field, .jxgbox, .JXGboard, svg, canvas, input, select, textarea, script, style`) || isHidden(node))) return " ";

  if (node.matches(".mq-editable-field, math-field")) {
    const value = includeAnswers ? fieldValue({ el: node, kind: "math" }) : "";
    return value ? ` [math answer box: ${value}] ` : " [math answer box] ";
  }
  if (node.matches(".jxgbox, .JXGboard")) return " [interactive graph, see attached image] ";

  const fraction = readFraction(node, stripped, includeAnswers, bare);
  if (fraction !== null) return fraction;

  const math = readMath(node);
  if (math !== null) return math ? ` ${math} ` : "";

  const tag = node.tagName.toUpperCase();
  if (tag === "SVG") return readSvgLabels(node);
  if (SKIP_TAGS.has(tag) || tag === "SCRIPT") return "";
  if (tag === "BR") return "\n";
  if (tag === "IMG") return node.alt ? ` [image: ${node.alt}] ` : "";
  if (tag === "INPUT") return includeAnswers ? readInput(node) : "";
  if (tag === "TEXTAREA") return includeAnswers && node.value ? ` [answer box: ${node.value}] ` : " [answer box] ";
  if (tag === "SELECT") {
    const options = [...node.options].map(o => o.textContent.trim()).filter(Boolean);
    return ` [dropdown: ${options.join(" / ")}] `;
  }
  if (node.hidden) return "";
  const style = getComputedStyle(node);
  if (style.display === "none" || style.visibility === "hidden") return "";

  const inner = [...node.childNodes].map(child => readNode(child, stripped, includeAnswers, bare)).join("");
  if (tag === "TD" || tag === "TH") return ` ${inner} |`;
  const name = String(node.className?.baseVal ?? node.className ?? "");
  const raised = tag === "SUP" || style.verticalAlign === "super" || /(^|[-_\s])(sup|superscript|exponent|power)([-_\s]|$)/i.test(name);
  const shift = !raised && inner.trim().length <= 6 && /^inline/.test(style.display) && !/^(BUTTON|A|LABEL)$/.test(tag) ? scriptShift(node, style) : 0;
  const lowered = tag === "SUB" || style.verticalAlign === "sub" || /(^|[-_\s])(sub|subscript)([-_\s]|$)/i.test(name);
  if ((raised || shift > 0 || lowered) && inner.trim()) return `${raised || shift > 0 ? "^" : "_"}(${inner.trim()}) `;
  return BLOCK_TAGS.has(tag) || BLOCK_DISPLAY.test(style.display) ? `\n${inner}\n` : inner;
}

function scriptShift(node, style) {
  const parent = node.parentElement;
  if (!parent || node.children.length > 2) return 0;
  const size = parseFloat(style.fontSize);
  const base = parseFloat(getComputedStyle(parent).fontSize);
  if (!(size < base * .9)) return 0;
  const box = node.getBoundingClientRect();
  const line = parent.getBoundingClientRect();
  if (!box.height || !line.height) return 0;
  const middle = (box.top + box.bottom) / 2;
  const center = (line.top + line.bottom) / 2;
  return middle < center - base * .15 ? 1 : 0;
}

function readFraction(node, stripped, includeAnswers, bare) {
  if (!/frac/i.test(node.className?.baseVal ?? node.className ?? "")) return null;
  const top = node.querySelector(":scope > [class*='num' i], :scope > * > [class*='num' i], :scope > [class*='top' i]");
  const bottom = node.querySelector(":scope > [class*='den' i], :scope > * > [class*='den' i], :scope > [class*='bottom' i]");
  if (!top || !bottom || top.contains(bottom) || bottom.contains(top)) return null;
  if (node.closest("button, [role='button']") && !node.closest(`${FIELD_SELECTOR}, ${MATH_FIELD_SELECTOR}`)) return "";
  const numerator = clean(readNode(top, stripped, includeAnswers, bare));
  const denominator = clean(readNode(bottom, stripped, includeAnswers, bare));
  if (!numerator && !denominator) return "";
  return ` (${numerator || "_"})/(${denominator || "_"}) `;
}

function readMath(el) {
  const tag = el.tagName.toUpperCase();

  if (tag === "SCRIPT") {
    const type = el.getAttribute("type") || "";
    return type.startsWith("math/tex") ? `$${el.textContent.trim()}$` : null;
  }
  if (el.classList.contains("MathJax_Preview")) return "";
  if (el.classList.contains("mq-math-mode")) {
    try {
      const tex = mathQuill(el)?.latex?.();
      if (tex) return `$${tex}$`;
    } catch {}
    return (el.querySelector(".mq-root-block") || el).textContent.replace(/\s+/g, " ").trim();
  }
  if (el.classList.contains("MathJax") ||el.classList.contains("MathJax_Display") || el.classList.contains("MathJax_SVG")) {
    return el.nextElementSibling?.matches("script[type^='math/tex']") ? "" : el.getAttribute("aria-label") || el.textContent.trim();
  }
  if (el.classList.contains("katex") || tag === "MJX-CONTAINER" || tag === "MATH") {
    const tex = el.querySelector("annotation[encoding*='tex']")?.textContent.trim();
    if (tex) return `$${tex}$`;
    const label = el.getAttribute("aria-label");
    if (label) return label;
    const mml = el.querySelector("mjx-assistive-mml, .katex-mathml, math");
    return (mml || el).textContent.replace(/\s+/g, " ").trim();
  }
  return null;
}

function readSvgLabels(svg) {
  const labels = [...svg.querySelectorAll("text")].map(t => t.textContent.trim()).filter(Boolean);
  return labels.length ? ` [diagram labels: ${labels.join(", ")}] ` : "";
}

function readInput(input) {
  const type = (input.type || "text").toLowerCase();
  if (["hidden", "submit", "button", "image", "reset", "file"].includes(type)) return "";
  if (type === "radio" || type === "checkbox") return input.checked ? " (selected) " : "";
  return input.value ? ` [answer box: ${input.value}] ` : " [answer box] ";
}

function isHidden(el) {
  if (el.hidden) return true;
  const style = getComputedStyle(el);
  return style.display === "none" || style.visibility === "hidden";
}

async function imageBlock(el, rect) {
  const tag = el.tagName.toLowerCase();
  if (tag === "canvas") return blockFromDataUrl(el.toDataURL("image/png"));
  if (tag === "svg") return blockFromDataUrl(await rasterize(await loadImage(svgDataUrl(el, rect)), rect.width, rect.height, overlayLabels(el, rect)));

  const src = el.currentSrc || el.src;
  if (!src) return null;
  try {
    return blockFromDataUrl(await rasterize(el, el.naturalWidth, el.naturalHeight));
  } catch {
    return fetchImage(src);
  }
}

function svgDataUrl(svg, rect) {
  const clone = svg.cloneNode(true);
  const sourceNodes = [svg, ...svg.querySelectorAll("*")];
  const cloneNodes = [clone, ...clone.querySelectorAll("*")];

  sourceNodes.forEach((source, i) => {
    const style = getComputedStyle(source);
    const inline = SVG_STYLE_PROPS.map(prop => `${prop}:${style.getPropertyValue(prop)}`).join(";");
    cloneNodes[i].setAttribute("style", `${inline};${cloneNodes[i].getAttribute("style") || ""}`);
  });

  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", Math.round(rect.width));
  clone.setAttribute("height", Math.round(rect.height));
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new RainError("Image failed to load"));
    img.src = src;
  });
}

function overlayLabels(svg, rect) {
  const scope = svg.parentElement;
  if (!scope) return [];
  return [...scope.querySelectorAll("div, span")].flatMap(node => {
    if (node.children.length || svg.contains(node)) return [];
    const text = node.textContent.trim();
    if (!text || text.length > 40) return [];
    const box = node.getBoundingClientRect();
    if (!box.width || box.left < rect.left || box.top < rect.top || box.right > rect.right + 20 || box.bottom > rect.bottom + 20) return [];
    const style = getComputedStyle(node);
    if (style.visibility === "hidden" || style.display === "none") return [];
    return [{ text, x: box.left - rect.left, y: box.top - rect.top + box.height * .8, size: parseFloat(style.fontSize) || 12, color: style.color }];
  });
}

function rasterize(source, width, height, labels = []) {
  const scale = Math.min(1, CONFIG.capture.maxImageSide / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  labels.forEach(label => {
    ctx.font = `${label.size * scale}px sans-serif`;
    ctx.fillStyle = label.color;
    ctx.fillText(label.text, label.x * scale, label.y * scale);
  });
  return canvas.toDataURL("image/png");
}

function blockFromDataUrl(dataUrl) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match || !IMAGE_TYPES.has(match[1]) || match[2].length < 200) return null;
  return { type: "image", source: { type: "base64", media_type: match[1], data: match[2] } };
}

async function fetchImage(url) {
  const res = await request({ url, binary: true });
  const type = res.type.split(";")[0].trim().toLowerCase();
  if (res.status >= 400 || !IMAGE_TYPES.has(type) || res.body.byteLength > 4_000_000) return null;

  const bytes = new Uint8Array(res.body);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return { type: "image", source: { type: "base64", media_type: type, data: btoa(binary) } };
}
