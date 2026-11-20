const UNTITLED = "New chat";

function stripImages(message) {
  if (typeof message.content === "string") return message;
  const content = message.content.flatMap(block => {
    if (block.type === "image") return [{ type: "text", text: "[image of the question]" }];
    if (block.type === "tool_result" && Array.isArray(block.content)) {
      return [{ ...block, content: block.content.filter(part => part.type !== "image") }];
    }
    return [block];
  });
  return { ...message, content };
}

const Chats = {
  index() {
    return Store.get("chats", []);
  },

  create(site, isPrivate = Settings.load().privateMode) {
    const now = Date.now();
    return {
      id: `${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      title: UNTITLED,
      site,
      created: now,
      updated: now,
      log: [],
      messages: [],
      starts: [],
      questionKey: null,
      hints: 0,
      private: isPrivate
    };
  },

  load(id) {
    const chat = Store.get(`chat:${id}`, null);
    return chat ? { ...chat, private: false } : null;
  },

  name(chat, text) {
    if (chat.title !== UNTITLED) return;
    const line = String(text || "").split("\n").map(clean).find(part => part.length > 3);
    if (line) chat.title = line.length > 70 ? `${line.slice(0, 68)}…` : line;
  },

  save(chat) {
    if (chat.private || !chat.log.length) return;
    chat.updated = Date.now();
    Store.set(`chat:${chat.id}`, { ...chat, messages: chat.messages.map(stripImages) });

    const index = this.index().filter(entry => entry.id !== chat.id);
    index.unshift({
      id: chat.id,
      title: chat.title,
      site: chat.site,
      updated: chat.updated,
      pinned: Boolean(chat.pinned),
      count: chat.log.filter(entry => entry.role === "you").length
    });
    for (const old of index.splice(CONFIG.ui.maxChats)) Store.remove(`chat:${old.id}`);
    Store.set("chats", index);
  },

  update(id, patch) {
    const stored = Store.get(`chat:${id}`, null);
    if (stored) Store.set(`chat:${id}`, { ...stored, ...patch });
    Store.set("chats", this.index().map(entry => entry.id === id ? { ...entry, ...patch } : entry));
  },

  remove(id) {
    Store.remove(`chat:${id}`);
    Store.set("chats", this.index().filter(entry => entry.id !== id));
  },

  clear() {
    for (const entry of this.index()) Store.remove(`chat:${entry.id}`);
    Store.set("chats", []);
  },

  export() {
    const chats = this.index().map(entry => this.load(entry.id)).filter(Boolean).map(chat => ({
      title: chat.title,
      site: chat.site,
      created: new Date(chat.created).toISOString(),
      messages: chat.log.filter(entry => ["you", "rain", "answer"].includes(entry.role)).map(entry => ({ role: entry.role, text: entry.text }))
    }));
    return JSON.stringify(chats, null, 2);
  }
};
