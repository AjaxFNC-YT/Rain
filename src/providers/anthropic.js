const AnthropicProvider = {
  headers(apiKey) {
    return {
      "x-api-key": apiKey,
      "anthropic-version": CONFIG.api.anthropicVersion,
      "anthropic-dangerous-direct-browser-access": "true"
    };
  },

  async send({ provider, system, messages, tools, signal }) {
    const headers = this.headers(provider.apiKey);
    const cache = { type: "ephemeral" };
    const shaped = messages.map(message => ({
      role: message.role,
      content: typeof message.content === "string" ? [{ type: "text", text: message.content }] : message.content.map(publicBlock)
    }));
    const last = shaped.at(-1)?.content.at(-1);
    if (last) shaped.at(-1).content[shaped.at(-1).content.length - 1] = { ...last, cache_control: cache };
    const payload = {
      model: provider.model,
      max_tokens: CONFIG.api.maxTokens,
      system: [{ type: "text", text: system, cache_control: cache }],
      messages: shaped,
      output_config: { effort: provider.effort }
    };
    if (tools?.length) payload.tools = tools.map((tool, i) => i === tools.length - 1 ? { ...tool, cache_control: cache } : tool);
    const fallback = provider.spec.models.find(model => model.id === provider.model)?.fallback;
    if (fallback && provider.baseUrl === provider.spec.baseUrl) {
      headers["anthropic-beta"] = CONFIG.api.fallbackBeta;
      payload.fallbacks = "default";
    }

    const data = await call(`${provider.baseUrl}/v1/messages`, { headers, payload, signal });
    const usage = data.usage || {};
    return {
      content: data.content || [],
      stopReason: data.stop_reason,
      usage: {
        input: (usage.input_tokens || 0) + (usage.cache_read_input_tokens || 0) + (usage.cache_creation_input_tokens || 0),
        output: usage.output_tokens || 0
      }
    };
  },

  async models(provider) {
    const data = await call(`${provider.baseUrl}/v1/models?limit=100`, { method: "GET", headers: this.headers(provider.apiKey) });
    return (data.data || []).map(model => ({ id: model.id, label: model.display_name || model.id }));
  }
};
