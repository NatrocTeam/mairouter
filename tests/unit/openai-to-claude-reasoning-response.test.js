import { describe, expect, it } from "vitest";
import { openaiToClaudeResponse } from "../../open-sse/translator/response/openai-to-claude.js";

describe("OpenAI reasoning → Claude response", () => {
  it("emits unsigned reasoning as labeled text blocks", () => {
    const state = { toolCalls: new Map() };
    const events = openaiToClaudeResponse({
      id: "chatcmpl-reasoning",
      model: "reasoning-model",
      choices: [{
        delta: { reasoning_content: "inspect the inputs" },
        finish_reason: null,
      }],
    }, state);

    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: "content_block_start",
        content_block: { type: "text", text: "" },
      }),
      expect.objectContaining({
        type: "content_block_delta",
        delta: { type: "text_delta", text: "[Reasoning from previous assistant]\n" },
      }),
      expect.objectContaining({
        type: "content_block_delta",
        delta: { type: "text_delta", text: "inspect the inputs" },
      }),
    ]));
    expect(events.some((event) => event.content_block?.type === "thinking")).toBe(false);
    expect(events.some((event) => event.delta?.type === "thinking_delta")).toBe(false);
  });

  it("closes reasoning text before regular answer text", () => {
    const state = { toolCalls: new Map() };
    openaiToClaudeResponse({
      id: "chatcmpl-reasoning",
      model: "reasoning-model",
      choices: [{ delta: { reasoning_content: "reason" }, finish_reason: null }],
    }, state);

    const events = openaiToClaudeResponse({
      id: "chatcmpl-reasoning",
      model: "reasoning-model",
      choices: [{ delta: { content: "answer" }, finish_reason: null }],
    }, state);

    const stopIndex = events.findIndex((event) => event.type === "content_block_stop");
    const answerStartIndex = events.findIndex((event) => event.type === "content_block_start");
    expect(stopIndex).toBeGreaterThanOrEqual(0);
    expect(answerStartIndex).toBeGreaterThan(stopIndex);
    expect(events.at(-1)?.delta).toEqual({ type: "text_delta", text: "answer" });
  });
});
