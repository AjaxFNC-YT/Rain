const PROVIDERS = {
  anthropic: AnthropicProvider,
  openai: OpenAIProvider,
  gemini: GeminiProvider
};

const AI = {
  async send({ settings, system, messages, tools, signal }) {
    const provider = Settings.provider(settings);
    if (!provider.apiKey) throw new RainError(`Add your ${provider.spec.label} API key in Settings`);
    const reply = await PROVIDERS[provider.id].send({ provider, system, messages, tools, signal });
    if (reply.stopReason === "refusal" && !reply.content.some(block => block.type === "text" && block.text.trim())) {
      throw new RainError("The model declined this one. Try rephrasing or pick a smaller area of the page.");
    }
    return { ...reply, text: finishText(reply.content, reply.stopReason) };
  },

  async models(settings) {
    const provider = Settings.provider(settings);
    if (!provider.apiKey) throw new RainError("Paste a key first");
    const found = await PROVIDERS[provider.id].models(provider);
    return found.length ? found : provider.spec.models;
  },

  label(settings = Settings.load()) {
    const provider = Settings.provider(settings);
    return provider.spec.models.find(model => model.id === provider.model)?.label || provider.model;
  }
};
