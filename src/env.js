class RainError extends Error {}

const HAS_GM_REQUEST = typeof GM_xmlhttpRequest === "function";
const HAS_GM_STORE = typeof GM_getValue === "function" && typeof GM_setValue === "function" && typeof GM_deleteValue === "function";
const HAS_GM_CLIPBOARD = typeof GM_setClipboard === "function";
const pageWindow = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const Store = {
  get(key, fallback) {
    try {
      if (HAS_GM_STORE) return GM_getValue(key, fallback);
      const raw = localStorage.getItem(`${CONFIG.namespace}:${key}`);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    try {
      if (HAS_GM_STORE) GM_setValue(key, value);
      else localStorage.setItem(`${CONFIG.namespace}:${key}`, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove(key) {
    try {
      if (HAS_GM_STORE) GM_deleteValue(key);
      else localStorage.removeItem(`${CONFIG.namespace}:${key}`);
    } catch {}
  },

  legacy(key) {
    try {
      const raw = localStorage.getItem(`${CONFIG.legacyNamespace}:${key}`);
      return raw === null ? null : JSON.parse(raw);
    } catch {
      return null;
    }
  }
};

const Settings = {
  load() {
    const saved = Store.get("settings", null) || Store.legacy("settings") || {};
    const settings = { ...CONFIG.defaults, ...saved };
    settings.keys = { ...CONFIG.defaults.keys, ...saved.keys };
    settings.island = { ...CONFIG.defaults.island, ...saved.island };
    settings.look = { ...CONFIG.defaults.look, ...saved.look, toolbar: { ...CONFIG.defaults.look.toolbar, ...saved.look?.toolbar } };
    settings.recentModels = Array.isArray(saved.recentModels) ? saved.recentModels : [];
    settings.tweaks = { ...saved.tweaks };
    settings.providers = Object.fromEntries(CONFIG.providers.map(provider => [provider.id, {
      apiKey: "",
      baseUrl: "",
      model: provider.model,
      ...saved.providers?.[provider.id]
    }]));
    if (saved.apiKey && !settings.providers.anthropic.apiKey) {
      settings.providers.anthropic.apiKey = saved.apiKey;
      if (saved.model) settings.providers.anthropic.model = saved.model;
    }
    if (!CONFIG.providers.some(provider => provider.id === settings.provider)) settings.provider = CONFIG.defaults.provider;
    delete settings.apiKey;
    delete settings.model;
    return settings;
  },

  save(patch) {
    const next = { ...this.load(), ...patch };
    Store.set("settings", next);
    return next;
  },

  provider(settings = this.load()) {
    const spec = CONFIG.providers.find(provider => provider.id === settings.provider);
    const own = settings.providers[spec.id];
    return {
      spec,
      id: spec.id,
      apiKey: own.apiKey.trim(),
      baseUrl: (own.baseUrl.trim() || spec.baseUrl).replace(/\/+$/, ""),
      model: own.model.trim() || spec.model,
      effort: settings.effort
    };
  },

  ready(settings = this.load()) {
    return Boolean(this.provider(settings).apiKey);
  }
};

const Stats = {
  load() {
    return { calls: 0, input: 0, output: 0, answered: 0, submitted: 0, advanced: 0, ...Store.get("stats", {}) };
  },

  add(usage) {
    const stats = this.load();
    stats.calls += 1;
    stats.input += usage?.input || 0;
    stats.output += usage?.output || 0;
    Store.set("stats", stats);
    return stats;
  },

  bump(name) {
    const stats = this.load();
    stats[name] += 1;
    Store.set("stats", stats);
    return stats;
  },

  reset() {
    Store.set("stats", {});
    return this.load();
  }
};

function headerValue(raw, name) {
  const line = (raw || "").split(/\r?\n/).find(l => l.toLowerCase().startsWith(`${name}:`));
  return line ? line.slice(name.length + 1).trim() : "";
}

async function request({ url, method = "GET", headers = {}, body, binary = false, signal }) {
  const stopped = () => new RainError("Stopped");
  if (signal?.aborted) return Promise.reject(stopped());

  if (HAS_GM_REQUEST) {
    return new Promise((resolve, reject) => {
      const handle = GM_xmlhttpRequest({
        url,
        method,
        headers,
        data: body,
        responseType: binary ? "arraybuffer" : "text",
        timeout: CONFIG.api.timeoutMs,
        onload: res => resolve({
          status: res.status,
          type: headerValue(res.responseHeaders, "content-type"),
          body: binary ? res.response : res.responseText
        }),
        onabort: () => reject(stopped()),
        onerror: () => reject(new RainError("Network error")),
        ontimeout: () => reject(new RainError("Request timed out"))
      });
      signal?.addEventListener("abort", () => {
        handle?.abort?.();
        reject(stopped());
      }, { once: true });
    });
  }

  const destination = new URL(url, document.baseURI);
  let blocked = false;
  const onViolation = event => {
    if (event.disposition !== "enforce" || event.effectiveDirective !== "connect-src") return;
    if ([destination.href, destination.origin, `${destination.origin}/`].includes(event.blockedURI)) blocked = true;
  };
  document.addEventListener("securitypolicyviolation", onViolation);
  try {
    let res;
    try {
      res = await fetch(url, { method, headers, body, signal });
    } catch {
      if (signal?.aborted) throw stopped();
      if (!blocked) await sleep(100);
      if (signal?.aborted) throw stopped();
      if (blocked) {
        throw new RainError(`This page’s Content Security Policy blocks console requests to ${destination.host}. Install rain.user.js in a userscript manager and reload this page.`);
      }
      throw new RainError("Network error. Check the provider URL and your connection. If the site restricts console requests, use rain.user.js.");
    }
    return {
      status: res.status,
      type: res.headers.get("content-type") || "",
      body: binary ? await res.arrayBuffer() : await res.text()
    };
  } finally {
    document.removeEventListener("securitypolicyviolation", onViolation);
  }
}

async function copyText(text) {
  if (HAS_GM_CLIPBOARD) {
    GM_setClipboard(text, "text");
    return;
  }
  await navigator.clipboard.writeText(text);
}

function hashText(text) {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
  return (hash >>> 0).toString(36);
}
