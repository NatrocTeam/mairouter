import { describe, expect, it } from "vitest";
import { getCapabilitiesForModel } from "../../open-sse/providers/capabilities.js";

describe("getCapabilitiesForModel", () => {
  it("resolves NVIDIA MiniMax-M3 through MiniMax pattern", () => {
    const caps = getCapabilitiesForModel("nvidia", "minimaxai/minimax-m3");
    expect(caps.reasoning).toBe(true);
    expect(caps.vision).toBe(true);
    expect(caps.thinkingFormat).toBe("minimax");
    expect(caps.contextWindow).toBe(1048576);
  });

  it("resolves NVIDIA MiniMax-M2.7 to OpenAI thinking format", () => {
    const caps = getCapabilitiesForModel("nvidia", "minimaxai/minimax-m2.7");
    expect(caps.reasoning).toBe(true);
    expect(caps.thinkingFormat).toBe("openai");
    expect(caps.thinkingCanDisable).toBe(false);
    expect(caps.maxOutput).toBe(16384);
  });

  it("resolves NVIDIA GLM 5.2 to documented context/output caps", () => {
    const caps = getCapabilitiesForModel("nvidia", "z-ai/glm-5.2");
    expect(caps.reasoning).toBe(true);
    expect(caps.thinkingFormat).toBe("openai");
    expect(caps.thinkingCanDisable).toBe(true);
    expect(caps.contextWindow).toBe(1000000);
    expect(caps.maxOutput).toBe(32768);
  });

  it("resolves NVIDIA GLM 4.7 through Z.ai pattern", () => {
    const caps = getCapabilitiesForModel("nvidia", "z-ai/glm4.7");
    expect(caps.reasoning).toBe(true);
    expect(caps.thinkingFormat).toBe("zai");
  });

  it("resolves NVIDIA DeepSeek V4 Pro provider override", () => {
    const caps = getCapabilitiesForModel(
      "nvidia",
      "deepseek-ai/deepseek-v4-pro",
    );
    expect(caps.reasoning).toBe(true);
    expect(caps.thinkingFormat).toBe("openai");
    expect(caps.thinkingCanDisable).toBe(true);
    expect(caps.maxOutput).toBe(16384);
  });

  it("resolves NVIDIA DeepSeek V4 Flash provider override", () => {
    const caps = getCapabilitiesForModel(
      "nvidia",
      "deepseek-ai/deepseek-v4-flash",
    );
    expect(caps.reasoning).toBe(true);
    expect(caps.thinkingFormat).toBe("openai");
    expect(caps.thinkingCanDisable).toBe(true);
    expect(caps.maxOutput).toBe(16384);
  });

  it("resolves NVIDIA Nemotron reasoning budget capability", () => {
    const caps = getCapabilitiesForModel(
      "nvidia",
      "nvidia/nemotron-3-ultra-550b-a55b",
    );
    expect(caps.reasoning).toBe(true);
    expect(caps.thinkingFormat).toBe("nemotron");
    expect(caps.thinkingCanDisable).toBe(true);
    expect(caps.thinkingRange).toEqual({ min: -1, max: 32768 });
    expect(caps.contextWindow).toBe(1048576);
    expect(caps.maxOutput).toBe(32768);
  });

  it("resolves NVIDIA Qwen3.5 safe native context", () => {
    const caps = getCapabilitiesForModel("nvidia", "qwen/qwen3.5-397b-a17b");
    expect(caps.reasoning).toBe(true);
    expect(caps.thinkingFormat).toBe("openai");
    expect(caps.thinkingCanDisable).toBe(false);
    expect(caps.contextWindow).toBe(262144);
    expect(caps.maxOutput).toBe(32768);
  });

  it("reports Kiro Claude Opus 4.8 as a 1M context model", () => {
    expect(
      getCapabilitiesForModel("kiro", "claude-opus-4.8").contextWindow,
    ).toBe(1000000);
    expect(
      getCapabilitiesForModel("kiro", "anthropic/claude-opus-4.8")
        .contextWindow,
    ).toBe(1000000);
    expect(
      getCapabilitiesForModel("kiro", "claude-opus-4-8").contextWindow,
    ).toBe(1000000);
    expect(
      getCapabilitiesForModel("kiro", "claude-opus-4.8-thinking").contextWindow,
    ).toBe(1000000);
    expect(
      getCapabilitiesForModel("kiro", "claude-opus-4-8-thinking").contextWindow,
    ).toBe(1000000);
  });
});
