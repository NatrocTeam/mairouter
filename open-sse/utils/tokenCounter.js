// Token counters for each supported format — used by /v1/messages/count_tokens
// NOTE: For accurate counts in production, install tiktoken (OpenAI) and @anthropic-ai/tokenizer.
// These are best-effort estimators when the real tokenizer packages are unavailable.

/**
 * Try to load tiktoken for OpenAI tokenization.
 * Falls back to estimator if unavailable.
 */
let tiktoken;
try {
  tiktoken = require("tiktoken");
} catch {
  // tiktoken not installed — will use estimator
}

/**
 * Try to load Anthropic tokenizer.
 * Falls back to estimator if unavailable.
 */
let anthropicTokenizer;
try {
  anthropicTokenizer = require("@anthropic-ai/tokenizer");
} catch {
  // @anthropic-ai/tokenizer not installed — will use estimator
}

// Rough estimator: ~4 characters per token (best-effort when no real tokenizer)
function estimateTokens(text) {
  if (!text || typeof text !== "string") return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Count tokens in a single string for the given format.
 * @param {string} text - Text to count
 * @param {string} [format="claude"] - Target format (claude, openai, gemini, etc.)
 * @returns {number} Token count
 */
export function countStringTokens(text, format = "claude") {
  if (!text) return 0;

  if (format === "openai" && tiktoken) {
    try {
      const enc = tiktoken.get_encoding("cl100k_base");
      const tokens = enc.encode(text);
      enc.free();
      return tokens.length;
    } catch {
      return estimateTokens(text);
    }
  }

  if (format === "claude" && anthropicTokenizer) {
    try {
      return anthropicTokenizer.countTokens(text);
    } catch {
      return estimateTokens(text);
    }
  }

  // Fallback: character-based estimate
  // Gemini ~4 chars/token, Kiro ~4 chars/token, others similar
  return estimateTokens(text);
}

/**
 * Count tokens in a Claude-format message.
 * @param {object} msg - Message with content (string or array of blocks)
 * @returns {number} Token count
 */
export function countClaudeMessageTokens(msg) {
  if (!msg) return 0;
  let total = 0;

  // Role overhead (~1 token for role label)
  total += countStringTokens(msg.role || "user", "claude");

  if (typeof msg.content === "string") {
    total += countStringTokens(msg.content, "claude");
  } else if (Array.isArray(msg.content)) {
    for (const block of msg.content) {
      switch (block.type) {
        case "text":
          total += countStringTokens(block.text, "claude");
          break;
        case "thinking":
        case "redacted_thinking":
          total += countStringTokens(
            block.thinking || block.data || "",
            "claude",
          );
          break;
        case "image":
          // Rough estimate: base64 image ~1000 tokens per image
          total += 1000;
          break;
        case "document":
          // Rough estimate: document ~1000 tokens
          total += 1000;
          break;
        case "tool_use":
          total += countStringTokens(block.name, "claude");
          total += countStringTokens(
            JSON.stringify(block.input || {}),
            "claude",
          );
          break;
        case "tool_result":
          if (typeof block.content === "string") {
            total += countStringTokens(block.content, "claude");
          } else if (Array.isArray(block.content)) {
            for (const c of block.content) {
              if (c.type === "text")
                total += countStringTokens(c.text, "claude");
            }
          }
          break;
      }
    }
  }

  return total;
}

/**
 * Count tokens in an OpenAI-format message.
 * @param {object} msg - Message with content (string or array)
 * @returns {number} Token count
 */
export function countOpenAIMessageTokens(msg) {
  if (!msg) return 0;
  let total = 0;

  total += countStringTokens(msg.role || "user", "openai");

  if (typeof msg.content === "string") {
    total += countStringTokens(msg.content, "openai");
  } else if (Array.isArray(msg.content)) {
    for (const part of msg.content) {
      if (part.type === "text" && part.text) {
        total += countStringTokens(part.text, "openai");
      } else if (part.type === "image_url") {
        total += 1000; // rough estimate
      }
    }
  }

  // Tool calls
  if (msg.tool_calls) {
    for (const tc of msg.tool_calls) {
      total += countStringTokens(tc.function?.name || "", "openai");
      total += countStringTokens(tc.function?.arguments || "", "openai");
    }
  }

  return total;
}

/**
 * Detect format from body shape and count tokens accordingly.
 * @param {object} body - Request body
 * @returns {{ input_tokens: number, detected_format: string }}
 */
export function countInputTokens(body) {
  if (!body) return { input_tokens: 0, detected_format: "unknown" };

  let total = 0;
  let detectedFormat = "claude";

  // Claude format: has messages[] with content blocks
  if (body.messages) {
    // Check for OpenAI chat format (choices[], messages[].role)
    const hasOpenAIRoles = body.messages.some((m) =>
      ["system", "user", "assistant", "tool"].includes(m.role),
    );
    if (hasOpenAIRoles) {
      detectedFormat = "openai";
      for (const msg of body.messages) {
        total += countOpenAIMessageTokens(msg);
      }
    } else {
      detectedFormat = "claude";
      for (const msg of body.messages) {
        total += countClaudeMessageTokens(msg);
      }
    }
  }

  // System prompt
  if (body.system) {
    if (typeof body.system === "string") {
      total += countStringTokens(body.system, detectedFormat);
    } else if (Array.isArray(body.system)) {
      for (const block of body.system) {
        if (block.type === "text")
          total += countStringTokens(block.text, detectedFormat);
      }
    }
  }

  // Tool definitions
  if (Array.isArray(body.tools)) {
    for (const tool of body.tools) {
      total += countStringTokens(
        tool.function?.name || tool.name || "",
        detectedFormat,
      );
      total += countStringTokens(
        JSON.stringify(tool.function?.parameters || tool.input_schema || {}),
        detectedFormat,
      );
      total += countStringTokens(
        tool.function?.description || tool.description || "",
        detectedFormat,
      );
    }
  }

  return { input_tokens: total, detected_format: detectedFormat };
}
