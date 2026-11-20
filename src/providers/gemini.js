const GeminiProvider = {
  headers(apiKey) {
    return { "x-goog-api-key": apiKey };
  },

  schema(input) {
    if (!input || typeof input !== "object") return input;
    if (Array.isArray(input)) return input.map(item => this.schema(item));
    const out = {};
    for (const [key, value] of Object.entries(input)) {
      if (["additionalProperties", "$schema", "default"].includes(key)) continue;
      out[key] = key === "properties"
        ? Object.fromEntries(Object.entries(value).map(([name, prop]) => [name, this.schema(prop)]))
        : this.schema(value);
    }
    return out;
  },

  declaration(tool) {
    const params = tool.input_schema;
    const empty = !params?.properties || !Object.keys(params.properties).length;
    return { name: tool.name, description: tool.description, ...(empty ? {} : { parameters: this.schema(params) }) };
  },

  inline(image) {
    return { inlineData: { mimeType: image.source.media_type, data: image.source.data } };
  },

  convert(messages) {
    const names = new Map();
    return messages.map(message => {
      const blocks = typeof message.content === "string" ? [{ type: "text", text: message.content }] : message.content;
      const parts = [];
      for (const block of blocks) {
        const signature = block._sig ? { thoughtSignature: block._sig } : {};
        if (block.type === "text" && (block.text || block._sig)) {
          parts.push({ text: block.text, ...signature });
        } else if (block.type === "image") {
          parts.push(this.inline(block));
        } else if (block.type === "tool_use") {
          names.set(block.id, block.name);
          parts.push({ functionCall: { name: block.name, args: block.input || {} }, ...signature });
        } else if (block.type === "tool_result") {
          const { text, images } = resultParts(block);
          const key = block.is_error ? "error" : "result";
          parts.push({ functionResponse: { name: names.get(block.tool_use_id) || "tool", response: { [key]: text } } });
          parts.push(...images.map(image => this.inline(image)));
        }
      }
      return { role: message.role === "assistant" ? "model" : "user", parts: parts.length ? parts : [{ text: " " }] };
    });
  },

  async send({ provider, system, messages, tools, signal }) {
    const payload = {
      systemInstruction: { parts: [{ text: system }] },
      contents: this.convert(messages)
    };
    if (tools?.length) payload.tools = [{ functionDeclarations: tools.map(tool => this.declaration(tool)) }];

    const model = encodeURIComponent(provider.model.replace(/^models\//, ""));
    const data = await call(`${provider.baseUrl}/v1beta/models/${model}:generateContent`, {
      headers: this.headers(provider.apiKey),
      payload,
      signal
    });
    const candidate = data.candidates?.[0];
    if (!candidate) {
      if (data.promptFeedback?.blockReason) return { content: [], stopReason: "refusal", usage: {} };
      throw new RainError("Gemini returned no reply");
    }

    const content = [];
    for (const part of candidate.content?.parts || []) {
      if (part.thought) continue;
      const signature = part.thoughtSignature ? { _sig: part.thoughtSignature } : {};
      if (part.functionCall) {
        content.push({ type: "tool_use", id: part.functionCall.id || toolCallId(), name: part.functionCall.name, input: part.functionCall.args || {}, ...signature });
      } else if (typeof part.text === "string" && (part.text || signature._sig)) {
        content.push({ type: "text", text: part.text, ...signature });
      }
    }

    const reason = candidate.finishReason;
    const stopReason = content.some(block => block.type === "tool_use") ? "tool_use"
      : reason === "MAX_TOKENS" ? "max_tokens"
      : ["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "RECITATION"].includes(reason) ? "refusal"
      : "end_turn";
    const usage = data.usageMetadata || {};
    return {
      content,
      stopReason,
      usage: { input: usage.promptTokenCount || 0, output: (usage.candidatesTokenCount || 0) + (usage.thoughtsTokenCount || 0) }
    };
  },

  async models(provider) {
    const data = await call(`${provider.baseUrl}/v1beta/models?pageSize=200`, { method: "GET", headers: this.headers(provider.apiKey) });
    return (data.models || [])
      .filter(model => model.supportedGenerationMethods?.includes("generateContent"))
      .map(model => ({ id: model.name.replace(/^models\//, ""), label: model.displayName || model.name }));
  }
};
