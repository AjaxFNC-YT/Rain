const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SRC = path.join(ROOT, "src");
const DIST = path.join(ROOT, "dist");

const ORDER = [
  "env.js",
  "providers/shared.js",
  "providers/anthropic.js",
  "providers/openai.js",
  "providers/gemini.js",
  "providers/index.js",
  "prompts.js",
  "capture.js",
  "sites.js",
  "autofill.js",
  "tools.js",
  "chats.js",
  "sounds.js",
  "keys.js",
  "tweaks.js",
  "accuracy.js",
  "ui/dom.js",
  "ui/markdown.js",
  "ui/styles/tokens.js",
  "ui/styles/panel.js",
  "ui/styles/views.js",
  "ui/styles/island.js",
  "ui/styles/setup.js",
  "ui/controls.js",
  "ui/island.js",
  "ui/picker.js",
  "ui/settings.js",
  "ui/chatlist.js",
  "ui/setup.js",
  "ui/panel.js",
  "app.js",
  "main.js"
];

const config = JSON.parse(fs.readFileSync(path.join(ROOT, "config.json"), "utf8"));

function bundle() {
  const runtime = {
    name: config.name,
    namespace: config.namespace,
    version: config.version,
    api: config.api,
    defaults: config.defaults,
    legacyNamespace: config.legacyNamespace,
    providers: config.providers,
    efforts: config.efforts,
    capture: config.capture,
    ui: config.ui,
    sites: config.sites.map(({ match, ...site }) => site)
  };

  const body = ORDER.map(file => fs.readFileSync(path.join(SRC, file), "utf8").trim()).join("\n\n");
  return `(() => {\n"use strict";\n\nconst CONFIG = ${JSON.stringify(runtime, null, 2)};\n\n${body}\n})();\n`;
}

function userscriptHeader() {
  const rows = [
    ["name", config.name],
    ["namespace", config.namespace],
    ["version", config.version],
    ["description", config.description],
    ["author", config.author],
    ["homepageURL", `https://github.com/${config.repo}`],
    ["downloadURL", `https://github.com/${config.repo}/raw/main/dist/${config.namespace}.user.js`],
    ["updateURL", `https://github.com/${config.repo}/raw/main/dist/${config.namespace}.user.js`],
    ...config.sites.flatMap(site => site.match.map(m => ["match", m])),
    ["grant", "GM_xmlhttpRequest"],
    ["grant", "GM_getValue"],
    ["grant", "GM_setValue"],
    ["grant", "GM_deleteValue"],
    ["grant", "GM_setClipboard"],
    ["grant", "unsafeWindow"],
    ["connect", "api.anthropic.com"],
    ["connect", "api.openai.com"],
    ["connect", "generativelanguage.googleapis.com"],
    ["connect", "*"],
    ["run-at", "document-idle"],
    ["noframes", ""]
  ];
  const width = Math.max(...rows.map(([key]) => key.length)) + 2;
  const lines = rows.map(([key, value]) => `// @${key.padEnd(width)}${value}`.trimEnd());
  return ["// ==UserScript==", ...lines, "// ==/UserScript==", ""].join("\n");
}

const code = bundle();
fs.mkdirSync(DIST, { recursive: true });
const base = config.namespace;
fs.writeFileSync(path.join(DIST, `${base}.user.js`), `${userscriptHeader()}
${code}`);
fs.writeFileSync(path.join(DIST, `${base}.console.js`), code);

console.log(`Built ${config.name} v${config.version} -> dist/${base}.user.js, dist/${base}.console.js`);
