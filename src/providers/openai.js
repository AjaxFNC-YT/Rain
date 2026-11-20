const OpenAIProvider = {
  headers(apiKey) {
    return { authorization: `Bearer ${apiKey}` };
  },

  convert(system, messages) {
    const out = [{ role: "system", content: system }];
    for (const message of messages) {
      const blocks = typeof message.content === "string" ? [{ type: "text", text: message.content }] : message.content;
      if (message.role === "assistant") {
        const text = blocks.filter(block => block.type === "text").map(block => block.text).join("\n");
        const calls = blocks.filter(block => block.type === "tool_use").map(block => ({
          id: block.id,
          type: "function",
          function: { name: block.name, arguments: JSON.stringify(block.input || {}) }
        }));
        out.push({ role: "assistant", content: text || null, ...(calls.length ? { tool_calls: calls } : {}) });
        continue;
      }

      const images = [];
      for (const block of blocks.filter(block => block.type === "tool_result")) {
        const { text, images: attached } = resultParts(block);
        out.push({ role: "tool", tool_call_id: block.tool_use_id, content: text });
        images.push(...attached);
      }
      const parts = [
        ...[...images, ...blocks.filter(block => block.type === "image")].map(image => ({
          type: "image_url",
          image_url: { url: `data:${image.source.media_type};base64,${image.source.data}` }
        })),
        ...blocks.filter(block => block.type === "text").map(block => ({ type: "text", text: block.text }))
      ];
      if (parts.length) out.push({ role: "user", content: parts });
    }
    return out;
  },

  async send({ provider, system, messages, tools, signal }) {
    const payload = { model: provider.model, messages: this.convert(system, messages) };
    if (tools?.length) {
      payload.tools = tools.map(tool => ({
        type: "function",
        function: { name: tool.name, description: tool.description, parameters: tool.input_schema }
      }));
    }

    const data = await call(`${provider.baseUrl}/chat/completions`, { headers: this.headers(provider.apiKey), payload, signal });
    const choice = data.choices?.[0];
    if (!choice) throw new RainError("The provider returned no reply");

    const message = choice.message || {};
    const content = [];
    if (message.content) content.push({ type: "text", text: String(message.content) });
    for (const toolCall of message.tool_calls || []) {
      let input = {};
      try {
        input = JSON.parse(toolCall.function?.arguments || "{}");
      } catch {}
      content.push({ type: "tool_use", id: toolCall.id || toolCallId(), name: toolCall.function?.name, input });
    }

    const stopReason = content.some(block => block.type === "tool_use") ? "tool_use"
      : choice.finish_reason === "length" ? "max_tokens"
      : choice.finish_reason === "content_filter" ? "refusal"
      : "end_turn";
    return {
      content,
      stopReason,
      usage: { input: data.usage?.prompt_tokens || 0, output: data.usage?.completion_tokens || 0 }
    };
  },

  async models(provider) {
    const data = await call(`${provider.baseUrl}/models`, { method: "GET", headers: this.headers(provider.apiKey) });
    return (data.data || []).map(model => ({ id: model.id, label: model.id })).sort((a, b) => a.id.localeCompare(b.id));
  }
};
