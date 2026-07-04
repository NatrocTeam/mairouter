// Non-streaming OpenAI → Claude response converter.
// Converts an OpenAI chat completion response body to Claude message format,
// preserving reasoning_content as a thinking block. Follows the exact pattern
// of kiroToClaudeNonStreaming() in kiro-to-claude.js.

import { CLAUDE_BLOCK } from "../schema/index.js";
import { fromOpenAIFinish } from "../concerns/finishReason.js";

const convertFinishReason = (reason) => fromOpenAIFinish(reason, "claude");

/**
 * Convert a non-streaming OpenAI chat completion response to Claude message format.
 *
 * @param {object} data - OpenAI chat completion response body
 * @returns {object} Claude-format message response, or the input as-is if null/undefined
 */
export function openaiToClaudeNonStreaming(data) {
  if (!data) return data;

  const content = [];
  const choice = data?.choices?.[0];
  const message = choice?.message || {};

  // 1. Reasoning content → thinking block (unsigned, no signature)
  const reasoning = message.reasoning_content;
  if (reasoning && typeof reasoning === "string") {
    content.push({ type: CLAUDE_BLOCK.THINKING, thinking: reasoning });
  }

  // 2. Text content → text block
  if (message.content && typeof message.content === "string") {
    content.push({ type: CLAUDE_BLOCK.TEXT, text: message.content });
  }

  // 3. Tool calls → tool_use blocks
  if (Array.isArray(message.tool_calls)) {
    for (const tc of message.tool_calls) {
      let input = {};
      try {
        input =
          typeof tc.function?.arguments === "string"
            ? JSON.parse(tc.function.arguments)
            : tc.function?.arguments || {};
      } catch {
        input = {};
      }
      content.push({
        type: CLAUDE_BLOCK.TOOL_USE,
        id: tc.id || `toolu_${Date.now()}`,
        name: tc.function?.name || "",
        input,
      });
    }
  }

  // 4. Map usage: OpenAI → Claude field names
  const usage = data?.usage || {};
  const mappedUsage = {
    input_tokens: usage.prompt_tokens || 0,
    output_tokens: usage.completion_tokens || 0,
  };
  // Map cache fields if present
  const promptDetails = usage.prompt_tokens_details;
  if (promptDetails) {
    if (typeof promptDetails.cached_tokens === "number") {
      mappedUsage.cache_read_input_tokens = promptDetails.cached_tokens;
    }
    if (typeof promptDetails.cache_creation_tokens === "number") {
      mappedUsage.cache_creation_input_tokens =
        promptDetails.cache_creation_tokens;
    }
  }

  // 5. Build the Claude-format response
  return {
    id: data.id
      ? `msg_${data.id.replace("chatcmpl-", "")}`
      : `msg_${Date.now()}`,
    type: "message",
    role: "assistant",
    content,
    model: data?.model || "unknown",
    stop_reason: convertFinishReason(choice?.finish_reason || "stop"),
    stop_sequence: null,
    usage: mappedUsage,
  };
}
