<div align="center">

# Rain

**An AI helper that lives on your school sites.**

It reads the question you're on, explains it, gives hints, checks your work, or answers it for you, typing, clicking and dragging like a student would.

![Version](https://img.shields.io/github/package-json/v/AjaxFNC-YT/Rain?label=version&color=1f6fb2)
[![Userscript](https://img.shields.io/badge/install-userscript-1f6fb2)](https://github.com/AjaxFNC-YT/Rain/raw/main/dist/rain.user.js)
![Providers](https://img.shields.io/badge/models-Claude%20%7C%20OpenAI%20%7C%20Gemini-4d5763)

[Install](#install) · [Features](#features) · [Supported sites](#supported-sites) · [Shortcuts](#shortcuts) · [Building](#building)

</div>

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2. Open **[rain.user.js](https://github.com/AjaxFNC-YT/Rain/raw/main/dist/rain.user.js)** and press Install.
3. Open a supported site. Rain walks you through setup the first time.

Updates install automatically through your userscript manager.

### API keys

Rain uses your own key. Pick one provider:

| Provider | Default model | Get a key |
| --- | --- | --- |
| Claude | Haiku 5.5 | [console.anthropic.com](https://console.anthropic.com) |
| OpenAI, or anything OpenAI compatible | GPT-5 | [platform.openai.com](https://platform.openai.com) |
| Gemini | Gemini 2.5 Flash | [aistudio.google.com](https://aistudio.google.com) |

> [!NOTE]
> Keys stay in your browser and are only sent to the provider you choose. OpenRouter, Groq, LM Studio and Ollama work through the OpenAI option with a custom base URL.

### Console version

No userscript manager? Paste [`dist/rain.console.js`](dist/rain.console.js) into the DevTools console. It lasts until you reload and keeps its own settings.

> [!IMPORTANT]
> The console version uses the page's own network permissions. Sites with a strict Content Security Policy, like IXL, block it from reaching the AI provider. Use the userscript on those sites.

## Features

- **Answer, Explain, Hint, Check** for whatever question is on screen
- **Auto Answer** finds each new question, enters the answer, and can submit and move on
- Fills text boxes, math editors, dropdowns, multiple choice, drag and drop, highlight questions and graphs
- **Answer only** mode skips the explanation, so it's faster and cheaper
- **Accuracy** setting to miss some questions on purpose, by chance or to hold a target score
- Saved chats, private chats, and a whole-chat memory option
- Status pill at the top of the page, with its own style, position and detail settings
- Site tweaks, like dark mode
- Shortcuts that work even while Rain is fully hidden
- Optional sound effects, light and dark themes, and five accent colors

## Supported sites

| Site | What works |
| --- | --- |
| IXL | Text and math editor answers, fractions and exponents, auto submit and Got it |
| DeltaMath | Math boxes, graphs, auto submit, Next Problem and Next Section |
| iCEV | Multiple choice, drag and drop, highlight questions, written answers, auto Next |
| Khan Academy | Text and math answers, multiple choice |
| Quizlet | Reading and answering question cards |

Other sites work too with a generic reader. Press **Area** and click the question if Rain reads the wrong part of the page.

## Shortcuts

| Key | Action |
| --- | --- |
| <kbd>`</kbd> | Show or hide Rain |
| <kbd>Alt</kbd> + <kbd>S</kbd> | Answer this question |
| <kbd>Alt</kbd> + <kbd>A</kbd> | Auto Answer on or off |
| <kbd>Alt</kbd> + <kbd>Q</kbd> | Pick the question area |

Change them in **Settings → Keys**.

> [!TIP]
> Turn off **Show a launcher while hidden** to keep Rain completely out of sight until you press the shortcut.

## Building

Requires [Node.js](https://nodejs.org/).

```sh
node build.js
```

| Path | Contents |
| --- | --- |
| `config.json` | Defaults, providers, models and per-site rules |
| `src/` | Source: providers, page reading, answer entry, UI |
| `src/ui/` | Panel, settings, setup, chats and status pill |
| `dist/` | Built `rain.user.js` and `rain.console.js` |
| `tools/` | Console probes for debugging new question types |

## Note

Use it to learn, not just to get through. Your teachers can usually tell.
