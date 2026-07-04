# AGENTS.md — Core Engine (/open-sse/)

Routing and format translation engine shared between the Next.js server and CLI.

## Pipeline Architecture

`chatCore.js` (12 steps):

1. **Format detection** — `detectFormat(body)` or `sourceFormatOverride`
2. **Bypass check** — `handleBypassRequest()` for warmup/cc-naming
3. **Target resolution** — `getModelTargetFormat()` or `resolveTransport()`
4. **Provider thinking injection** — inject thinking/reasoning_effort
5. **Streaming decision** — from body.stream, provider config, Accept header, clientTool
6. **Native passthrough** — skip all translation for natively compatible pairs
7. **Modality stripping** — remove unsupported media from the target model
8. **Request translation** — via translator registry (pivot through OpenAI or direct)
9. **Tool dedup** — built-in vs MCP tools for Claude client
10. **Token compression (RTK)** — `compressMessages()`
11. **Response dispatch** — streaming or non-streaming with response translation

## Format Constants — `open-sse/translator/formats.js`

13 format identifiers (single source of truth):

| Constant           | Value                | Used by                                  |
| ------------------ | -------------------- | ---------------------------------------- |
| `OPENAI`           | `"openai"`           | OpenAI, OpenRouter, Groq, Together, etc. |
| `OPENAI_RESPONSES` | `"openai-responses"` | OpenAI Responses API                     |
| `CLAUDE`           | `"claude"`           | Anthropic, AWS Bedrock Claude            |
| `GEMINI`           | `"gemini"`           | Google Gemini, Vertex AI                 |
| `GEMINI_CLI`       | `"gemini-cli"`       | Gemini CLI                               |
| `VERTEX`           | `"vertex"`           | Google Vertex AI (non-Gemini)            |
| `CODEX`            | `"codex"`            | OpenAI Codex CLI                         |
| `ANTIGRAVITY`      | `"antigravity"`      | Antigravity                              |
| `KIRO`             | `"kiro"`             | Kiro AI                                  |
| `CURSOR`           | `"cursor"`           | Cursor                                   |
| `OLLAMA`           | `"ollama"`           | Ollama                                   |
| `COMMANDCODE`      | `"commandcode"`      | CodeBuddy                                |

Endpoint detection via URL path: `/v1/responses` → `OPENAI_RESPONSES`, `/v1/messages` → `CLAUDE`, `/v1/chat/completions` with `body.input` → `OPENAI`.

## Translator — `open-sse/translator/`

### Request Translators (12)

Source → Target. If no direct pair exists, pivot through OpenAI:

- `claude-to-openai.js`, `openai-to-claude.js`
- `gemini-to-openai.js`, `openai-to-gemini.js`
- `openai-to-vertex.js`
- `antigravity-to-openai.js`
- `openai-responses.js` (two-way)
- `openai-to-kiro.js`, `claude-to-kiro.js`
- `openai-to-cursor.js`
- `openai-to-ollama.js`
- `openai-to-commandcode.js`

### Response Translators (10)

Target → Source (streaming chunks):

- `claude-to-openai.js`, `openai-to-claude.js`
- `gemini-to-openai.js`
- `openai-to-antigravity.js`
- `openai-responses.js` (two-way)
- `kiro-to-openai.js`, `kiro-to-claude.js`
- `cursor-to-openai.js`
- `ollama-to-openai.js`
- `commandcode-to-openai.js`

## Executors — `open-sse/executors/`

22 specialized + 1 default. All extend `BaseExecutor`:

| Key                                                           | Description                                      |
| ------------------------------------------------------------- | ------------------------------------------------ |
| `antigravity`, `azure`, `gemini-cli`, `github`                | OAuth providers                                  |
| `iflow`, `qoder`                                              | Cookie-based auth                                |
| `kiro`, `codex`, `cursor` (alias `cu`), `qwen`                | OAuth + custom format                            |
| `vertex`, `vertex-partner`                                    | Google Vertex AI                                 |
| `opencode`, `opencode-go`                                     | OpenCode variants                                |
| `grok-web`, `perplexity-web`                                  | Web search specific                              |
| `ollama-local`, `commandcode`                                 | Local / custom format                            |
| `xiaomi-tokenplan`, `mimo-free` (alias `mmf`), `codebuddy-cn` | Regional providers                               |
| DefaultExecutor (remaining)                                   | OpenAI-compatible / Anthropic-compatible generic |

### BaseExecutor.execute() Pipeline:

1. Iterate fallback URLs (baseUrls array)
2. `transformRequest()` → `buildHeaders()` → `proxyAwareFetch()`
3. Retry logic per status code (DEFAULT_RETRY_CONFIG): 502×3, 503×3, 504×2
4. 429 + fallback URL → `shouldRetry()` → next URL
5. Network error → 502 retry config

## Account Fallback — `open-sse/services/accountFallback.js`

- `checkFallbackError(status, errorText, backoffLevel)` → `{ shouldFallback, cooldownMs, newBackoffLevel }`
- Exponential backoff: `base * 2^(level-1)` capped at 5 minutes
- Model-level locks: `modelLock_<model>` field in connection records
- Error rules: text-based ("rate limit", "quota exceeded", "capacity", etc.) + status-based (401/403/429)

## Combo Models — `open-sse/services/combo.js`

| Strategy     | How It Works                                                       |
| ------------ | ------------------------------------------------------------------ |
| **Fallback** | Sequential: model[0] → error → model[1] → error → ... → 503        |
| **Fusion**   | Parallel fan-out to all panels → judge synthesize → final response |

Fusion config: `minPanel=2`, `stragglerGraceMs=8000`, `panelHardTimeoutMs=90000`.

## RTK (Request Token Kruncher) — `open-sse/rtk/`

`compressMessages(body, enabled)` — compresses tool_result content. 6 message shapes:

1. OpenAI `tool` (string content)
2. OpenAI `tool` (array content)
3. Claude `tool_result` (string content)
4. Claude `tool_result` (array content)
5. OpenAI Responses `function_call_output`
6. Kiro `userInputMessageContext.toolResults`

Features: caveman (terse prompt), ponytail (senior-dev prompt), headroom (external proxy), autodetect filter, git-aware compression.

## Provider Registry — `open-sse/providers/registry/`

100+ provider definition files (auto-generated). Each file has: transport config, model list, OAuth config, capabilities, pricing.

**⚠️ DO NOT edit `registry/index.js` directly** — it's auto-generated. Edit individual registry entry files.

## Stream Handling — `open-sse/utils/`

| File                | Purpose                                                                 |
| ------------------- | ----------------------------------------------------------------------- |
| `stream.js`         | `createSSETransformStreamWithLogger()`, SSE parsing                     |
| `streamHandler.js`  | `createStreamController()`, `pipeWithDisconnect()` (stall timeout 360s) |
| `proxyFetch.js`     | `proxyAwareFetch()` — SOCKS5, HTTP proxy, Vercel relay                  |
| `error.js`          | `buildErrorBody()`, `parseUpstreamError()`, `formatProviderError()`     |
| `bypassHandler.js`  | Warmup/skip/cc-filter pattern detection                                 |
| `claudeCloaking.js` | Tool name cloaking (`_cc` suffix) for OAuth providers                   |
| `clientDetector.js` | `detectClientTool()`, `isNativePassthrough()`                           |
| `tokenCounter.js`   | Real token counting (tiktoken + anthropic/tokenizer)                    |
| `usageTracking.js`  | Usage extraction, estimation, logging                                   |

## Config — `open-sse/config/`

| File                | Content                                                                               |
| ------------------- | ------------------------------------------------------------------------------------- |
| `runtimeConfig.js`  | Timeouts (stream stall 360s, connect 60s), limits (max 128k tokens), retry config     |
| `errorConfig.js`    | ERROR_TYPES, BACKOFF_CONFIG (base 2s, max 5min), COOLDOWN_MS                          |
| `providerModels.js` | `getModelTargetFormat()`, `getModelUpstreamId()`, `getModelType()`, `getModelStrip()` |
| `providers.js`      | Re-export from registry + OLLAMA_LOCAL_DEFAULT_HOST                                   |

## ⚠️ IMPORTANT RULES

1. **DO NOT** call `handleComboChat()`/`handleFusionChat()` from `chatCore.js` — combo handler calls `chatCore.js`, not the other way around
2. **DO NOT** modify `registry/index.js` — it's auto-generated from 100+ individual files
3. **Format constants** in `formats.js` are the single source of truth — do not hardcode format strings elsewhere
4. **Translation** is always bidirectional: request (client→upstream) + response (upstream→client)
5. **Streaming** must handle disconnect (stall timeout 360s, abort controller, client disconnect)
6. **Account fallback** must use `excludeConnectionIds` set, not global state modification
