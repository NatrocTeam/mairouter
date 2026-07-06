// Expose bugs caused by OpenAI being the intermediate format: data lost/wrong on source → openai → target.
// Each test describes the EXPECTED-correct behavior. A FAIL is evidence of the bug (with source file:line).
import { describe, it, expect } from "vitest";
import "./registerAll.js";
import { translateRequest } from "../../open-sse/translator/index.js";
import { FORMATS } from "../../open-sse/translator/formats.js";

const T = (src, tgt, body, { provider = null, translationPolicy = {} } = {}) =>
  translateRequest(
    src,
    tgt,
    "m",
    body,
    true,
    null,
    provider,
    null,
    [],
    null,
    null,
    translationPolicy,
  );

describe("bug: Claude → OpenAI bridge data loss", () => {
  it("image with source.type=url is preserved (NOT dropped)", () => {
    const out = T(FORMATS.CLAUDE, FORMATS.OPENAI, {
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "look" },
            {
              type: "image",
              source: { type: "url", url: "https://x.com/a.png" },
            },
          ],
        },
      ],
    });
    const json = JSON.stringify(out);
    expect(json, "remote image url silently dropped").toContain("a.png");
  });

  it("signed thinking is converted to text instead of being silently dropped", () => {
    const out = T(FORMATS.CLAUDE, FORMATS.OPENAI, {
      messages: [
        {
          role: "assistant",
          content: [
            {
              type: "thinking",
              thinking: "secret reasoning",
              signature: "sig",
            },
            { type: "text", text: "answer" },
          ],
        },
        { role: "user", content: "go" },
      ],
    });

    const json = JSON.stringify(out);
    expect(json).toContain("secret reasoning");
    expect(json).toContain("answer");
    expect(json).not.toContain("sig");
  });

  it("tool_result image is split into a following user image message for OpenAI targets", () => {
    const out = T(FORMATS.CLAUDE, FORMATS.OPENAI, {
      messages: [
        {
          role: "assistant",
          content: [
            { type: "tool_use", id: "call_1", name: "shot", input: {} },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: "call_1",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: "image/png",
                    data: "ZZZ",
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    expect(out.messages[0].tool_calls[0].id).toBe("call_1");
    expect(out.messages[1]).toEqual(
      expect.objectContaining({ role: "tool", tool_call_id: "call_1" }),
    );
    expect(out.messages[1].content).toContain("forwarded");
    expect(out.messages[2]).toEqual(
      expect.objectContaining({
        role: "user",
        content: expect.arrayContaining([
          expect.objectContaining({ text: expect.stringContaining("call_1") }),
          expect.objectContaining({
            type: "image_url",
            image_url: { url: "data:image/png;base64,ZZZ" },
          }),
        ]),
      }),
    );
    expect(out.messages[1].content).not.toContain("source");
    expect(out.messages[1].content).not.toContain("[object Object]");
  });

  it("mixed text and image tool_result keeps text in tool message and forwards image", () => {
    const out = T(FORMATS.CLAUDE, FORMATS.OPENAI, {
      messages: [
        {
          role: "assistant",
          content: [
            { type: "tool_use", id: "call_1", name: "shot", input: {} },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: "call_1",
              content: [
                { type: "text", text: "screenshot captured" },
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: "image/png",
                    data: "ZZZ",
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    expect(out.messages[1].role).toBe("tool");
    expect(out.messages[1].content).toContain("screenshot captured");
    expect(out.messages[1].content).toContain("forwarded");
    expect(JSON.stringify(out.messages[2])).toContain(
      "data:image/png;base64,ZZZ",
    );
  });

  it("tool_result is_error is marked in tool content instead of becoming success", () => {
    const out = T(FORMATS.CLAUDE, FORMATS.OPENAI, {
      messages: [
        {
          role: "assistant",
          content: [{ type: "tool_use", id: "call_1", name: "f", input: {} }],
        },
        {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: "call_1",
              is_error: true,
              content: "boom",
            },
          ],
        },
      ],
    });

    const tool = out.messages.find((m) => m.role === "tool");
    expect(tool.content).toContain("[Tool Error]\nboom");
  });

  // claude-to-openai.js:24-27 — system array only takes .text, drops cache_control/non-text
  it("system array non-text parts are not silently dropped", () => {
    const out = T(FORMATS.CLAUDE, FORMATS.OPENAI, {
      system: [
        { type: "text", text: "rule1", cache_control: { type: "ephemeral" } },
        { type: "text", text: "rule2" },
      ],
      messages: [{ role: "user", content: "hi" }],
    });
    const sys = out.messages.find((m) => m.role === "system");
    expect(sys?.content).toContain("rule1");
    expect(sys?.content).toContain("rule2");
  });
});

describe("bug: tool_call id stability across bridge", () => {
  // toolCallHelper.js:29-31 — sanitize changes tc.id but tool_call_id in another message may drift
  it("sanitized tool id stays matched between call and result", () => {
    const out = T(FORMATS.OPENAI, FORMATS.OPENAI, {
      messages: [
        {
          role: "assistant",
          tool_calls: [
            {
              id: "call/with:bad*chars",
              type: "function",
              function: { name: "f", arguments: "{}" },
            },
          ],
        },
        { role: "tool", tool_call_id: "call/with:bad*chars", content: "ok" },
      ],
    });
    const asst = out.messages.find((m) => m.role === "assistant");
    const tool = out.messages.find((m) => m.role === "tool");
    expect(tool.tool_call_id, "id mismatch after sanitize").toBe(
      asst.tool_calls[0].id,
    );
  });
});

describe("bug: empty content message handling", () => {
  // openaiHelper.js:49-51,66-71 — empty content → {text:""} then filtered out
  it("assistant message with only tool_calls is not dropped", () => {
    const out = T(FORMATS.OPENAI, FORMATS.OPENAI, {
      messages: [
        { role: "user", content: "do it" },
        {
          role: "assistant",
          content: "",
          tool_calls: [
            {
              id: "call_1",
              type: "function",
              function: { name: "f", arguments: "{}" },
            },
          ],
        },
        { role: "tool", tool_call_id: "call_1", content: "done" },
      ],
    });
    const asst = out.messages.find(
      (m) => m.role === "assistant" && m.tool_calls,
    );
    expect(asst, "assistant tool_calls message dropped").toBeTruthy();
  });
});
