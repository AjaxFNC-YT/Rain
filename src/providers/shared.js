const STATUS_MESSAGES = {
  400: "Request rejected",
  401: "Invalid API key",
  403: "This API key can't use that model",
  404: "Model or endpoint not found",
  413: "Question is too large to send",
  429: "Rate limited, wait a moment and try again",
  500: "Provider server error, try again",
  503: "Provider is unavailable, try again shortly",
  529: "The model is overloaded, try again shortly"
};

function parseResponse(res) {
  let data = null;
  try {
    data = JSON.parse(res.body);
  } catch {}

  if (res.status >= 400 || !data) {
    const base = STATUS_MESSAGES[res.status] || `HTTP ${res.status}`;
    const error = Array.isArray(data) ? data[0]?.error : data?.error;
    const detail = typeof error === "string" ? error : error?.message;
    throw new RainError(detail ? `${base}: ${detail}` : base);
  }
  return data;
}

async function call(url, { method = "POST", headers, payload, signal }) {
  return parseResponse(await request({
    url,
    method,
    headers: payload ? { "content-type": "application/json", ...headers } : headers,
    body: payload ? JSON.stringify(payload) : undefined,
    signal
  }));
}

function publicBlock(block) {
  return Object.fromEntries(Object.entries(block).filter(([key]) => !key.startsWith("_")));
}

function resultParts(result) {
  const content = Array.isArray(result.content) ? result.content : [{ type: "text", text: String(result.content ?? "") }];
  return {
    text: content.filter(part => part.type === "text").map(part => part.text).join("\n") || (result.is_error ? "Error" : "Done"),
    images: content.filter(part => part.type === "image")
  };
}

function toolCallId() {
  return `call_${Math.random().toString(36).slice(2, 12)}`;
}

function finishText(blocks, stopReason) {
  const text = blocks.filter(block => block.type === "text").map(block => block.text).join("\n").trim();
  return stopReason === "max_tokens" ? `${text}\n\n*(cut off, ask me to continue)*` : text;
}
