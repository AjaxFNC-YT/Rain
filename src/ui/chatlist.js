function createChatList(app) {
  let query = "";
  const list = h("ul", { class: "r-chat-list" });
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
    UI.subhead("Chats", () => app.showView("main"), UI.iconButton("plus", "New chat", () => app.newChat(false, true))),
    h("div", { class: "r-search" }, icon("search"), search),
    h("div", { class: "r-scroll", style: "padding:0" }, list),
    h("footer", { class: "r-chats-foot" },
      UI.button("plus", "New chat", () => app.newChat(false, true)),
      UI.button("lock", "Private chat", () => app.newChat(true, true))));

  function item(entry, current, index) {
    const meta = entry.private ? "Private, not saved" : `${entry.site}, ${ago(entry.updated)}`;
    return h("li", {
      class: "r-chat",
      "data-current": String(current),
      tabindex: 0,
      style: `animation-delay:${Math.min(index, 10) * 18}ms`,
      onclick: () => app.openChat(entry.id),
      onkeydown: e => {
        if (e.key === "Enter") app.openChat(entry.id);
      }
    },
      h("span", { class: "r-chat-text" }, h("span", { class: "r-chat-title", text: entry.title }), h("span", { class: "r-chat-meta", text: meta })),
      !entry.private && UI.iconButton("trash", "Delete chat", e => {
        e.stopPropagation();
        app.deleteChat(entry.id);
      }));
  }

  function render() {
    const active = app.chat();
    const entries = Chats.index();
    if (active.log.length && !entries.some(entry => entry.id === active.id)) {
      entries.unshift({ id: active.id, title: active.title, site: active.site, updated: active.updated, count: active.log.filter(e => e.role === "you").length, private: active.private });
    }
    const shown = entries.filter(entry => !query || entry.title.toLowerCase().includes(query) || entry.site.toLowerCase().includes(query));
    list.replaceChildren(...(shown.length
      ? shown.map((entry, i) => item(entry, entry.id === active.id, i))
      : [h("li", { class: "r-chat-empty", text: query ? "No chats match that search." : "No saved chats yet. Ask Rain something and it shows up here." })]));
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
