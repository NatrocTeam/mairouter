import { describe, it, expect } from "vitest";
import { openaiToClaudeNonStreaming } from "open-sse/translator/response/openai-to-claude-non-streaming.js";

// Helper: create an OpenAI non-streaming chat completion response
function makeOpenAIResponse({
  content = "",
  reasoningContent = null,
  toolCalls = null,
  finishReason = "stop",
  model = "test-model",
  usage = { prompt_tokens: 10, completion_tokens: 20 },
} = {}) {
  const message = { role: "assistant" };
  if (content) message.content = content;
  if (reasoningContent) message.reasoning_content = reasoningContent;
  if (toolCalls) message.tool_calls = toolCalls;
  return {
    id: "chatcmpl-abc123",
    object: "chat.completion",
    created: 1234567890,
    model,
    choices: [{ index: 0, message, finish_reason: finishReason }],
    usage,
  };
}

describe("openaiToClaudeNonStreaming", () => {
  it("converts reasoning_content to thinking block and content to text block", () => {
    const openai = makeOpenAIResponse({
      content: "The answer is 42.",
      reasoningContent: "Let me calculate: 6 * 7 = 42.",
    });
    const claude = openaiToClaudeNonStreaming(openai);

    expect(claude.type).toBe("message");
    expect(claude.role).toBe("assistant");
    expect(claude.content).toHaveLength(2);
    expect(claude.content[0]).toEqual({
      type: "thinking",
      thinking: "Let me calculate: 6 * 7 = 42.",
    });
    expect(claude.content[1]).toEqual({
      type: "text",
      text: "The answer is 42.",
    });
    expect(claude.stop_reason).toBe("end_turn");
  });

  it("converts response with only reasoning_content to single thinking block", () => {
    const openai = makeOpenAIResponse({
      content: "",
      reasoningContent: "All tokens spent on thinking.",
    });
    const claude = openaiToClaudeNonStreaming(openai);

    expect(claude.content).toHaveLength(1);
    expect(claude.content[0].type).toBe("thinking");
    expect(claude.content[0].thinking).toBe("All tokens spent on thinking.");
  });

  it("converts response with only content to single text block", () => {
    const openai = makeOpenAIResponse({
      content: "Simple answer.",
    });
    const claude = openaiToClaudeNonStreaming(openai);

    expect(claude.content).toHaveLength(1);
    expect(claude.content[0].type).toBe("text");
    expect(claude.content[0].text).toBe("Simple answer.");
  });

  it("converts tool_calls to tool_use blocks", () => {
    const openai = makeOpenAIResponse({
      content: "",
      finishReason: "tool_calls",
      toolCalls: [
        {
          id: "call_abc",
          type: "function",
          function: { name: "get_weather", arguments: '{"city":"NYC"}' },
        },
      ],
    });
    const claude = openaiToClaudeNonStreaming(openai);

    expect(claude.content).toHaveLength(1);
    expect(claude.content[0].type).toBe("tool_use");
    expect(claude.content[0].id).toBe("call_abc");
    expect(claude.content[0].name).toBe("get_weather");
    expect(claude.content[0].input).toEqual({ city: "NYC" });
    expect(claude.stop_reason).toBe("tool_use");
  });

  it("places thinking block before tool_use when both present", () => {
    const openai = makeOpenAIResponse({
      content: "",
      reasoningContent: "I should check the weather.",
      finishReason: "tool_calls",
      toolCalls: [
        {
          id: "call_def",
          type: "function",
          function: { name: "get_weather", arguments: "{}" },
        },
      ],
    });
    const claude = openaiToClaudeNonStreaming(openai);

    expect(claude.content).toHaveLength(2);
    expect(claude.content[0].type).toBe("thinking");
    expect(claude.content[1].type).toBe("tool_use");
  });

  it("maps usage fields correctly", () => {
    const openai = makeOpenAIResponse({
      content: "Hello",
      usage: {
        prompt_tokens: 50,
        completion_tokens: 100,
        total_tokens: 150,
        completion_tokens_details: { reasoning_tokens: 40 },
      },
    });
    const claude = openaiToClaudeNonStreaming(openai);

    expect(claude.usage.input_tokens).toBe(50);
    expect(claude.usage.output_tokens).toBe(100);
  });

  it("maps cache usage fields", () => {
    const openai = makeOpenAIResponse({
      content: "Hello",
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        prompt_tokens_details: {
          cached_tokens: 30,
          cache_creation_tokens: 10,
        },
      },
    });
    const claude = openaiToClaudeNonStreaming(openai);

    expect(claude.usage.cache_read_input_tokens).toBe(30);
    expect(claude.usage.cache_creation_input_tokens).toBe(10);
  });

  it("returns null/undefined input as-is", () => {
    expect(openaiToClaudeNonStreaming(null)).toBeNull();
    expect(openaiToClaudeNonStreaming(undefined)).toBeUndefined();
  });

  it("handles minimal valid response with empty choices", () => {
    const openai = {
      id: "chatcmpl-min",
      object: "chat.completion",
      choices: [],
    };
    const claude = openaiToClaudeNonStreaming(openai);

    expect(claude.type).toBe("message");
    expect(claude.content).toEqual([]);
  });

  it("treats empty string reasoning_content as absent", () => {
    const openai = makeOpenAIResponse({
      content: "Just text.",
      reasoningContent: "",
    });
    const claude = openaiToClaudeNonStreaming(openai);

    expect(claude.content).toHaveLength(1);
    expect(claude.content[0].type).toBe("text");
  });

  it("maps length finish_reason to max_tokens stop_reason", () => {
    const openai = makeOpenAIResponse({
      content: "Partial...",
      finishReason: "length",
    });
    const claude = openaiToClaudeNonStreaming(openai);

    expect(claude.stop_reason).toBe("max_tokens");
  });

  it("maps stop finish_reason to end_turn stop_reason", () => {
    const openai = makeOpenAIResponse({
      content: "Complete.",
      finishReason: "stop",
    });
    const claude = openaiToClaudeNonStreaming(openai);

    expect(claude.stop_reason).toBe("end_turn");
  });
});
