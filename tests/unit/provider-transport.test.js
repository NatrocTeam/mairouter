import { describe, expect, it } from "vitest";
import { resolveTransport } from "../../open-sse/services/provider.js";
import { FORMATS } from "../../open-sse/translator/formats.js";

describe("provider transport resolution", () => {
  it("selects Blackbox OpenAI Chat transport for OpenAI-format requests", () => {
    const transport = resolveTransport(
      "blackbox",
      FORMATS.OPENAI,
      "gpt-5.5",
      "blackboxai/openai/gpt-5.5",
    );

    expect(transport).toEqual(
      expect.objectContaining({
        format: FORMATS.OPENAI,
        baseUrl: "https://api.blackbox.ai/chat/completions",
      }),
    );
  });

  it("selects Blackbox Anthropic transport only for Anthropic upstream models", () => {
    const claudeTransport = resolveTransport(
      "blackbox",
      FORMATS.CLAUDE,
      "claude-opus-4.8",
      "blackboxai/anthropic/claude-opus-4.8",
    );
    const gptTransport = resolveTransport(
      "blackbox",
      FORMATS.CLAUDE,
      "gpt-5.5",
      "blackboxai/openai/gpt-5.5",
    );

    expect(claudeTransport).toEqual(
      expect.objectContaining({
        format: FORMATS.CLAUDE,
        baseUrl: "https://api.blackbox.ai/v1/messages",
      }),
    );
    expect(gptTransport).toBeNull();
  });

  it("selects Blackbox Responses transport only for Codex upstream models", () => {
    const codexTransport = resolveTransport(
      "blackbox",
      FORMATS.OPENAI_RESPONSES,
      "gpt-5.3-codex",
      "blackboxai/openai/gpt-5.3-codex",
    );
    const gptTransport = resolveTransport(
      "blackbox",
      FORMATS.OPENAI_RESPONSES,
      "gpt-5.5",
      "blackboxai/openai/gpt-5.5",
    );

    expect(codexTransport).toEqual(
      expect.objectContaining({
        format: FORMATS.OPENAI_RESPONSES,
        baseUrl: "https://api.blackbox.ai/v1/responses",
      }),
    );
    expect(gptTransport).toBeNull();
  });
});
