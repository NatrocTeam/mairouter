import { describe, expect, it } from "vitest";
import { GithubExecutor } from "../../open-sse/executors/github.js";

describe("GithubExecutor max_completion_tokens handling", () => {
  it("uses max_completion_tokens for bare o-series models", () => {
    const executor = new GithubExecutor();
    const out = executor.transformRequest("o3", { max_tokens: 1024 });

    expect(out.max_tokens).toBeUndefined();
    expect(out.max_completion_tokens).toBe(1024);
  });

  it("uses max_completion_tokens for hyphenated o-series models", () => {
    const executor = new GithubExecutor();
    const out = executor.transformRequest("o4-mini", { max_tokens: 2048 });

    expect(out.max_tokens).toBeUndefined();
    expect(out.max_completion_tokens).toBe(2048);
  });

  it("keeps max_tokens for non-reasoning models", () => {
    const executor = new GithubExecutor();
    const out = executor.transformRequest("gpt-4o", { max_tokens: 512 });

    expect(out.max_tokens).toBe(512);
    expect(out.max_completion_tokens).toBeUndefined();
  });
});
