# Rain

An AI helper that lives on your school sites. It reads the question you're on, explains it, gives hints, checks your work, or answers it for you, typing, clicking, dragging and submitting like a student would.

Works on **IXL**, **DeltaMath**, **iCEV**, **Khan Academy** and **Quizlet**, and reads most other pages too.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2. Open **[rain.user.js](https://github.com/AjaxFNC-YT/Rain/raw/main/dist/rain.user.js)** and press Install.
3. Open a supported site. Rain walks you through setup the first time.

You need your own API key from one of these:

| Provider | Get a key |
| --- | --- |
| Claude (default, Haiku 5.5) | [console.anthropic.com](https://console.anthropic.com) |
| OpenAI or anything OpenAI compatible | [platform.openai.com](https://platform.openai.com) |
| Gemini | [aistudio.google.com](https://aistudio.google.com) |

Keys are stored in your browser and only sent to the provider you pick. OpenRouter, Groq, LM Studio and Ollama work through the OpenAI option with a custom base URL.

No userscript manager? Paste [`dist/rain.console.js`](dist/rain.console.js) into the DevTools console instead. It lasts until you reload.

## What it does

- **Answer, Explain, Hint, Check** for whatever question is on screen
- **Auto Answer** finds each new question, enters the answer and can submit and move on
- Fills text boxes, math editors, dropdowns, multiple choice, drag and drop, highlight questions and graphs
- **Accuracy** setting to miss some questions on purpose, by chance or to hold a target score
- **Answer only** mode skips the explanation, so it's faster and cheaper
- Saved chats, private chats, and a whole-chat memory option
- Site tweaks like dark mode for iCEV and the rest
- Shortcuts that work even while Rain is hidden

## Shortcuts

| Key | Action |
| --- | --- |
| `` ` `` | Show or hide Rain |
| `Alt` `S` | Answer this question |
| `Alt` `A` | Auto Answer on or off |
| `Alt` `Q` | Pick the question area |

Change them in Settings, Keys.

## Building

```
node build.js
```

The source lives in `src/` and the site rules and defaults live in `config.json`. The build bundles everything into `dist/rain.user.js` and `dist/rain.console.js`.

## Note

Use it to learn, not just to get through. Your teachers can usually tell.
