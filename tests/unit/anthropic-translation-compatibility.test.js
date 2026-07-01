import { describe, expect, it } from "vitest";
import { FORMATS } from "../../open-sse/translator/formats.js";
import {
  assertClaudeTranslationIsLossless,
  assertClaudeModalitiesSupported,
  TranslationCompatibilityError,
} from "../../open-sse/translator/concerns/translationCompatibility.js";
import { claudeToOpenAIRequest } from "../../open-sse/translator/request/claude-to-openai.js";

describe("Anthropic cross-provider translation compatibility", () => {
  it("allows text, tool calls, text tool results, and URL/base64 user images", () => {
    const body = {
      messages: [
        { role: "user", content: [
          { type: "text", text: "look" },
          { type: "image", source: { type: "url", url: "https://example.com/a.png" } },
          { type: "image", source: { type: "base64", media_type: "image/png", data: "AAAA" } },
        ] },
        { role: "assistant", content: [
          { type: "tool_use", id: "toolu_1", name: "read", input: {} },
        ] },
        { role: "user", content: [
          { type: "tool_result", tool_use_id: "toolu_1", content: [{ type: "text", text: "ok" }] },
        ] },
      ],
    };

    expect(() => assertClaudeTranslationIsLossless(body, FORMATS.OPENAI)).not.toThrow();
    const translated = claudeToOpenAIRequest("test-model", body, false);
    expect(JSON.stringify(translated)).toContain("https://example.com/a.png");
    expect(JSON.stringify(translated)).toContain("data:image/png;base64,AAAA");
  });

  it.each([
    ["document", { type: "document", source: { type: "base64", media_type: "application/pdf", data: "PDF" } }],
    ["server_tool_use", { type: "server_tool_use", id: "srv_1", name: "web_search", input: {} }],
  ])("rejects unsupported %s blocks with a typed error", (type, block) => {
    const body = { messages: [{ role: "assistant", content: [block] }] };

    expect(() => assertClaudeTranslationIsLossless(body, FORMATS.OPENAI)).toThrowError(
      expect.objectContaining({
        name: "TranslationCompatibilityError",
        code: "translation_not_lossless",
        status: 400,
        blockType: expect.stringContaining(type),
      }),
    );
  });

  it("allows tool results with is_error flag (translator now prefixes with [Tool Error])", () => {
    const secretContent = "sensitive tool output";
    const body = { messages: [{ role: "user", content: [{
      type: "tool_result",
      tool_use_id: "toolu_1",
      is_error: true,
      content: secretContent,
    }] }] };

    expect(() => assertClaudeTranslationIsLossless(body, FORMATS.OPENAI)).not.toThrow();

    // Also verify the translator prefixes the content
    const translated = claudeToOpenAIRequest("test-model", body, false);
    expect(translated.messages[0].content).toContain("[Tool Error]\n" + secretContent);
  });

  it.each(["image", "document", "search_result"])(
    "rejects %s nested inside tool_result",
    (type) => {
      const nested = type === "image"
        ? { type, source: { type: "base64", media_type: "image/png", data: "AAAA" } }
        : type === "document"
          ? { type, source: { type: "base64", media_type: "application/pdf", data: "PDF" } }
          : { type, source: "https://example.com", title: "result", content: [{ type: "text", text: "x" }] };
      const body = { messages: [{ role: "user", content: [{
        type: "tool_result",
        tool_use_id: "toolu_1",
        content: [nested],
      }] }] };

      expect(() => assertClaudeTranslationIsLossless(body, FORMATS.OPENAI))
        .toThrowError(new RegExp(`${type} tool_result block.*not supported`));
    },
  );

  it("does not restrict native Claude passthrough", () => {
    const body = { messages: [{ role: "assistant", content: [
      { type: "redacted_thinking", data: "opaque" },
    ] }] };

    expect(() => assertClaudeTranslationIsLossless(body, FORMATS.CLAUDE)).not.toThrow();
  });

  it("fails before model capability filtering can replace media with placeholders", () => {
    const body = { messages: [{ role: "user", content: [
      { type: "image", source: { type: "base64", media_type: "image/png", data: "AAAA" } },
      { type: "document", source: { type: "base64", media_type: "application/pdf", data: "PDF" } },
    ] }] };

    expect(() => assertClaudeModalitiesSupported(
      body,
      { vision: false, pdf: true },
      FORMATS.OPENAI,
    )).toThrowError(/image block.*not supported by the selected model/);
    expect(() => assertClaudeModalitiesSupported(
      body,
      { vision: true, pdf: false },
      FORMATS.OPENAI,
    )).toThrowError(/document block.*not supported by the selected model/);
  });

  it("fails before an explicit model strip policy can remove Claude images", () => {
    const body = { messages: [{ role: "user", content: [
      { type: "image", source: { type: "base64", media_type: "image/png", data: "AAAA" } },
    ] }] };

    expect(() => assertClaudeTranslationIsLossless(
      body,
      FORMATS.OPENAI,
      { stripList: ["image"] },
    )).toThrowError(/image block.*removed by the selected model translation policy/);
  });

  it.each([
    [{ type: "base64", media_type: "image/png", data: "" }, /malformed base64 image source/],
    [{ type: "url", url: "relative/image.png" }, /malformed URL image source/],
  ])("rejects malformed image sources", (source, expected) => {
    const body = { messages: [{ role: "user", content: [
      { type: "image", source },
    ] }] };

    expect(() => assertClaudeTranslationIsLossless(body, FORMATS.OPENAI)).toThrowError(expected);
  });

  it("allows thinking blocks in history (translator converts to text)", () => {
    const body = { messages: [
      { role: "assistant", content: [
        { type: "text", text: "I'll think about it" },
        { type: "thinking", thinking: "let me reason step by step...", signature: "opaque-sig" },
      ]},
    ]};

    expect(() => assertClaudeTranslationIsLossless(body, FORMATS.OPENAI)).not.toThrow();

    const translated = claudeToOpenAIRequest("test-model", body, false);
    expect(translated.messages[0].content).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ text: expect.stringContaining("let me reason step by step...") }),
      ]),
    );
  });

  it("allows redacted_thinking blocks in history (translator converts to placeholder text)", () => {
    const body = { messages: [
      { role: "assistant", content: [
        { type: "text", text: "conclusion" },
        { type: "redacted_thinking", data: "redacted-data" },
      ]},
    ]};

    expect(() => assertClaudeTranslationIsLossless(body, FORMATS.OPENAI)).not.toThrow();

    const translated = claudeToOpenAIRequest("test-model", body, false);
    expect(translated.messages[0].content).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ text: "[Redacted thinking block]" }),
      ]),
    );
  });

  it("still rejects other unsupported blocks (document, server_tool_use)", () => {
    const documentBody = { messages: [{ role: "assistant", content: [
      { type: "document", source: { type: "base64", media_type: "application/pdf", data: "PDF" } },
    ] }] };
    const serverToolBody = { messages: [{ role: "assistant", content: [
      { type: "server_tool_use", id: "srv_1", name: "web_search", input: {} },
    ] }] };

    expect(() => assertClaudeTranslationIsLossless(documentBody, FORMATS.OPENAI)).toThrowError(
      expect.objectContaining({ name: "TranslationCompatibilityError" }),
    );
    expect(() => assertClaudeTranslationIsLossless(serverToolBody, FORMATS.OPENAI)).toThrowError(
      expect.objectContaining({ name: "TranslationCompatibilityError" }),
    );
  });
});
