# AGENTS.md — Core Engine (/open-sse/)

Engine routing dan translasi format yang shared antara Next.js server dan CLI.

## Arsitektur Pipeline

`chatCore.js` (12 langkah):

1. **Format detection** — `detectFormat(body)` atau `sourceFormatOverride`
2. **Bypass check** — `handleBypassRequest()` untuk warmup/cc-naming
3. **Target resolution** — `getModelTargetFormat()` atau `resolveTransport()`
4. **Provider thinking injection** — inject thinking/reasoning_effort
5. **Streaming decision** — dari body.stream, provider config, Accept header, clientTool
6. **Native passthrough** — skip semua translasi untuk pair yang native-compatible
7. **Modality stripping** — hapus media yang tidak didukung model target
8. **Request translation** — via translator registry (pivot OpenAI atau direct)
9. **Tool dedup** — built-in vs MCP tools untuk Claude client
10. **Token compression (RTK)** — compressMessages()
11. **Response dispatch** — streaming atau non-streaming dengan translate response

## Format Constants — `open-sse/translator/formats.js`

13 format identifier (single source of truth):

| Constant           | Value                | Digunakan oleh                          |
| ------------------ | -------------------- | --------------------------------------- |
| `OPENAI`           | `"openai"`           | OpenAI, OpenRouter, Groq, Together, dll |
| `OPENAI_RESPONSES` | `"openai-responses"` | OpenAI Responses API                    |
| `CLAUDE`           | `"claude"`           | Anthropic, AWS Bedrock Claude           |
| `GEMINI`           | `"gemini"`           | Google Gemini, Vertex AI                |
| `GEMINI_CLI`       | `"gemini-cli"`       | Gemini CLI                              |
| `VERTEX`           | `"vertex"`           | Google Vertex AI (non-Gemini)           |
| `CODEX`            | `"codex"`            | OpenAI Codex CLI                        |
| `ANTIGRAVITY`      | `"antigravity"`      | Antigravity                             |
| `KIRO`             | `"kiro"`             | Kiro AI                                 |
| `CURSOR`           | `"cursor"`           | Cursor                                  |
| `OLLAMA`           | `"ollama"`           | Ollama                                  |
| `COMMANDCODE`      | `"commandcode"`      | CodeBuddy                               |

Deteksi endpoint via URL path: `/v1/responses` → `OPENAI_RESPONSES`, `/v1/messages` → `CLAUDE`, `/v1/chat/completions` dengan `body.input` → `OPENAI`.

## Translator — `open-sse/translator/`

### Request Translators (12)

Source → Target. Jika tidak ada direct pair, pivot melalui OpenAI:

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

22 specialized + 1 default. Semua extends `BaseExecutor`:

| Key                                                           | Keterangan                                       |
| ------------------------------------------------------------- | ------------------------------------------------ |
| `antigravity`, `azure`, `gemini-cli`, `github`                | OAuth providers                                  |
| `iflow`, `qoder`                                              | Cookie-based auth                                |
| `kiro`, `codex`, `cursor` (alias `cu`), `qwen`                | OAuth + format khusus                            |
| `vertex`, `vertex-partner`                                    | Google Vertex AI                                 |
| `opencode`, `opencode-go`                                     | OpenCode variants                                |
| `grok-web`, `perplexity-web`                                  | Web search specific                              |
| `ollama-local`, `commandcode`                                 | Local / custom format                            |
| `xiaomi-tokenplan`, `mimo-free` (alias `mmf`), `codebuddy-cn` | Regional providers                               |
| DefaultExecutor (sisanya)                                     | OpenAI-compatible / Anthropic-compatible generic |

### BaseExecutor.execute() Pipeline:

1. Iterate fallback URLs (baseUrls array)
2. `transformRequest()` → `buildHeaders()` → `proxyAwareFetch()`
3. Retry logic per status code (DEFAULT_RETRY_CONFIG): 502×3, 503×3, 504×2
4. 429 + fallback URL → `shouldRetry()` → next URL
5. Network error → 502 retry config

## Account Fallback — `open-sse/services/accountFallback.js`

- `checkFallbackError(status, errorText, backoffLevel)` → `{ shouldFallback, cooldownMs, newBackoffLevel }`
- Exponential backoff: `base * 2^(level-1)` capped at 5 menit
- Model-level locks: `modelLock_<model>` field di connection records
- Error rules: text-based ("rate limit", "quota exceeded", "capacity", dll) + status-based (401/403/429)

## Combo Models — `open-sse/services/combo.js`

| Strategy     | Cara Kerja                                                          |
| ------------ | ------------------------------------------------------------------- |
| **Fallback** | Sequential: model[0] → error → model[1] → error → ... → 503         |
| **Fusion**   | Parallel fan-out ke semua panel → judge synthesize → final response |

Fusion config: `minPanel=2`, `stragglerGraceMs=8000`, `panelHardTimeoutMs=90000`.

## RTK (Request Token Kruncher) — `open-sse/rtk/`

`compressMessages(body, enabled)` — kompres tool_result content. 6 message shapes:

1. OpenAI `tool` (string content)
2. OpenAI `tool` (array content)
3. Claude `tool_result` (string content)
4. Claude `tool_result` (array content)
5. OpenAI Responses `function_call_output`
6. Kiro `userInputMessageContext.toolResults`

Fitur: caveman (terse prompt), ponytail (senior-dev prompt), headroom (external proxy), autodetect filter, git-aware compression.

## Provider Registry — `open-sse/providers/registry/`

100+ file definisi provider (auto-generated). Setiap file punya: transport config, model list, OAuth config, capabilities, pricing.

**⚠️ JANGAN edit `registry/index.js` langsung** — dia auto-generated. Edit file individual registry entry.

## Stream Handling — `open-sse/utils/`

| File                | Fungsi                                                                  |
| ------------------- | ----------------------------------------------------------------------- |
| `stream.js`         | `createSSETransformStreamWithLogger()`, SSE parsing                     |
| `streamHandler.js`  | `createStreamController()`, `pipeWithDisconnect()` (stall timeout 360s) |
| `proxyFetch.js`     | `proxyAwareFetch()` — SOCKS5, HTTP proxy, Vercel relay                  |
| `error.js`          | `buildErrorBody()`, `parseUpstreamError()`, `formatProviderError()`     |
| `bypassHandler.js`  | Warmup/skip/cc-filter pattern detection                                 |
| `claudeCloaking.js` | Tool name cloaking (`_cc` suffix) untuk OAuth providers                 |
| `clientDetector.js` | `detectClientTool()`, `isNativePassthrough()`                           |
| `tokenCounter.js`   | Token counting real (tiktoken + anthropic/tokenizer)                    |
| `usageTracking.js`  | Usage extraction, estimation, logging                                   |

## Config — `open-sse/config/`

| File                | Isi                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------- |
| `runtimeConfig.js`  | Timeouts (stream stall 360s, connect 60s), limits (max 128k tokens), retry config     |
| `errorConfig.js`    | ERROR_TYPES, BACKOFF_CONFIG (base 2s, max 5min), COOLDOWN_MS                          |
| `providerModels.js` | `getModelTargetFormat()`, `getModelUpstreamId()`, `getModelType()`, `getModelStrip()` |
| `providers.js`      | Re-export dari registry + OLLAMA_LOCAL_DEFAULT_HOST                                   |

## ⚠️ IMPORTANT RULES

1. **JANGAN** panggil `handleComboChat()`/`handleFusionChat()` dari `chatCore.js` — combo handler memanggil `chatCore.js`, bukan sebaliknya
2. **JANGAN** ubah `registry/index.js` — file auto-generated dari 100+ file individual
3. **Format constants** di `formats.js` adalah single source of truth — jangan hardcode string format di tempat lain
4. **Translasi** selalu dua arah: request (client→upstream) + response (upstream→client)
5. **Streaming** harus handle disconnect (stall timeout 360s, abort controller, client disconnect)
6. **Fallback** account harus pakai `excludeConnectionIds` set, bukan modifikasi global state
