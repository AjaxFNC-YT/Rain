function createChatList(app) {
  let query = "";
  const list = h("div", { class: "r-chat-list" });
  const search = UI.field({
    type: "search",
    placeholder: "Search chats",
    "aria-label": "Search chats",
    oninput: e => {
      query = e.target.value.trim().toLowerCase();
      render();
    }
  });
  const el = h("section", { class: "r-view r-view-chats", "data-active": "false", "aria-label": "Chats" },
    UI.subhead("Chats", () => app.showView("main")),
    h("div", { class: "r-search" }, icon("search"), search),
    h("div", { class: "r-scroll r-chat-scroll" }, list),
    h("footer", { class: "r-chats-foot" },
      UI.button("plus", "New chat", () => app.newChat(false, true)),
      UI.button("lock", "Private chat", () => app.newChat(true, true))));

  function day(at) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    if (at >= start.getTime()) return "Today";
    if (at >= start.getTime() - 86400000) return "Yesterday";
    if (at >= start.getTime() - 6 * 86400000) return "This week";
    return "Earlier";
  }

  function rename(entry, title) {
    const input = UI.field({ class: "r-field r-rename", value: entry.title, "aria-label": "Chat name" });
    const finish = commit => {
      if (commit && input.value.trim()) app.renameChat(entry.id, input.value.trim().slice(0, 80));
      render();
    };
    input.addEventListener("keydown", e => {
      e.stopPropagation();
      if (e.key === "Enter") finish(true);
      if (e.key === "Escape") finish(false);
    });
    input.addEventListener("blur", () => finish(true));
    input.addEventListener("click", e => e.stopPropagation());
    title.replaceWith(input);
    input.focus();
    input.select();
  }

  function item(entry, current, index) {
    const meta = entry.private ? "Private, not saved" : `${entry.site}, ${ago(entry.updated)}`;
    const title = h("span", { class: "r-chat-title", text: entry.title });
    return h("div", {
      class: "r-chat",
      role: "button",
      "data-current": String(current),
      tabindex: 0,
      style: `animation-delay:${Math.min(index, 12) * 16}ms`,
      onclick: () => app.openChat(entry.id),
      onkeydown: e => {
        if (e.key === "Enter") app.openChat(entry.id);
      }
    },
      h("span", { class: "r-chat-text" }, title, h("span", { class: "r-chat-meta", text: meta })),
      !entry.private && h("span", { class: "r-chat-tools" },
        UI.iconButton("pin", entry.pinned ? "Unpin" : "Pin", e => {
          e.stopPropagation();
          app.pinChat(entry.id, !entry.pinned);
        }, { "aria-pressed": String(Boolean(entry.pinned)) }),
        UI.iconButton("pencil", "Rename", e => {
          e.stopPropagation();
          rename(entry, title);
        }),
        UI.iconButton("trash", "Delete chat", e => {
          e.stopPropagation();
          app.deleteChat(entry.id);
        })));
  }

  function render() {
    const active = app.chat();
    const entries = Chats.index();
    if (active.log.length && !entries.some(entry => entry.id === active.id)) {
      entries.unshift({ id: active.id, title: active.title, site: active.site, updated: active.updated, pinned: active.pinned, private: active.private });
    }
    const shown = entries.filter(entry => !query || entry.title.toLowerCase().includes(query) || entry.site.toLowerCase().includes(query));
    if (!shown.length) {
      list.replaceChildren(h("p", { class: "r-chat-empty", text: query ? "No chats match that search." : "No saved chats yet. Ask Rain something and it shows up here." }));
      return;
    }
    const groups = new Map();
    for (const entry of shown) {
      const name = entry.pinned ? "Pinned" : day(entry.updated);
      groups.set(name, [...(groups.get(name) || []), entry]);
    }
    let index = 0;
    list.replaceChildren(...["Pinned", "Today", "Yesterday", "This week", "Earlier"].filter(name => groups.has(name)).map(name =>
      h("section", { class: "r-chat-group" },
        h("h3", { text: name }),
        groups.get(name).map(entry => item(entry, entry.id === active.id, index++)))));
  }

  return {
    el,
    render,
    focus() {
      search.value = "";
      query = "";
      render();
    }
  };
}
