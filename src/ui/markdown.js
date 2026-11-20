function renderMarkdown(text) {
  const frag = document.createDocumentFragment();
  let paragraph = [];
  let list = null;
  let code = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const p = h("p");
    paragraph.forEach((line, i) => {
      if (i) p.append(h("br"));
      p.append(...renderInline(line));
    });
    frag.append(p);
    paragraph = [];
  };

  const flushList = () => {
    if (list) frag.append(list);
    list = null;
  };

  for (const line of text.replace(/\r/g, "").split("\n")) {
    if (code) {
      if (line.startsWith("```")) {
        frag.append(h("pre", {}, h("code", { text: code.join("\n") })));
        code = null;
      } else {
        code.push(line);
      }
      continue;
    }

    const heading = /^#{1,4}\s+(.*)$/.exec(line);
    const bullet = /^\s*(?:[-*•]|(\d+)[.)])\s+(.*)$/.exec(line);

    if (line.startsWith("```")) {
      flushParagraph();
      flushList();
      code = [];
    } else if (!line.trim()) {
      flushParagraph();
      flushList();
    } else if (heading) {
      flushParagraph();
      flushList();
      frag.append(h("h4", {}, renderInline(heading[1])));
    } else if (bullet) {
      flushParagraph();
      const tag = bullet[1] ? "ol" : "ul";
      if (!list || list.tagName.toLowerCase() !== tag) {
        flushList();
        list = h(tag);
      }
      list.append(h("li", {}, renderInline(bullet[2])));
    } else {
      flushList();
      paragraph.push(line.trim());
    }
  }

  if (code) frag.append(h("pre", {}, h("code", { text: code.join("\n") })));
  flushParagraph();
  flushList();
  return frag;
}

function renderInline(text) {
  return text
    .split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/)
    .filter(Boolean)
    .map(part => {
      if (/^`[^`]+`$/.test(part)) return h("code", { text: part.slice(1, -1) });
      if (/^\*\*[^*]+\*\*$/.test(part)) return h("strong", { text: part.slice(2, -2) });
      if (/^\*[^*\s][^*]*\*$/.test(part)) return h("em", { text: part.slice(1, -1) });
      return part;
    });
}
