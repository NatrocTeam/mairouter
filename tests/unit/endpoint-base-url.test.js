import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

import {
  toAnthropicBaseUrl,
  toOpenAIBaseUrl,
} from "../../src/shared/utils/endpointBaseUrl.js";

const require = createRequire(import.meta.url);
const { formatEndpoint } = require("../../cli/src/cli/utils/endpoint.js");

describe("endpoint base URL normalization", () => {
  it.each([undefined, null, "", "   ", 42])(
    "returns an empty string for %p",
    (value) => {
      expect(toOpenAIBaseUrl(value)).toBe("");
      expect(toAnthropicBaseUrl(value)).toBe("");
      expect(formatEndpoint(value)).toBe("");
    },
  );

  it.each([
    ["http://localhost:20127", "http://localhost:20127/v1"],
    ["http://localhost:20127/", "http://localhost:20127/v1"],
    ["https://tunnel.example.com/v1", "https://tunnel.example.com/v1"],
    ["https://tailnet.example.com/api", "https://tailnet.example.com/api/v1"],
    ["https://gateway.example.com/api/v1/", "https://gateway.example.com/api/v1"],
  ])("builds an OpenAI-compatible URL from %s", (input, expected) => {
    expect(toOpenAIBaseUrl(input)).toBe(expected);
    expect(formatEndpoint(input)).toBe(expected);
  });

  it.each([
    ["http://localhost:20127", "http://localhost:20127"],
    ["http://localhost:20127/", "http://localhost:20127"],
    ["https://tunnel.example.com/v1", "https://tunnel.example.com"],
    ["https://tailnet.example.com/", "https://tailnet.example.com"],
    ["https://gateway.example.com/api/v1/", "https://gateway.example.com/api"],
  ])("builds an Anthropic gateway root from %s", (input, expected) => {
    expect(toAnthropicBaseUrl(input)).toBe(expected);
    expect(formatEndpoint(input, { withV1: false })).toBe(expected);
  });

  it("derives both protocols for every dashboard transport", () => {
    const roots = [
      "http://localhost:20127",
      "https://tunnel.example.com",
      "https://tailnet.example.com",
    ];

    expect(
      roots.flatMap((root) => [
        toOpenAIBaseUrl(root),
        toAnthropicBaseUrl(root),
      ]),
    ).toEqual([
      "http://localhost:20127/v1",
      "http://localhost:20127",
      "https://tunnel.example.com/v1",
      "https://tunnel.example.com",
      "https://tailnet.example.com/v1",
      "https://tailnet.example.com",
    ]);
  });

  it("prevents a double /v1 Claude Code request path", () => {
    const root = toAnthropicBaseUrl("https://gateway.example.com/v1");
    expect(`${root}/v1/messages`).toBe(
      "https://gateway.example.com/v1/messages",
    );
  });
});
