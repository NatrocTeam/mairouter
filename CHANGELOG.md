# Changelog

## v1.3.0 2026-07-06 [(e0faefc)](https://github.com/NatrocTeam/mairouter/commit/e0faefc569f7a24170cdc01d1f5a4303582a154c)

### Added

- **Extended usage analytics periods** — ported 90d, 180d, 365d, and all-time usage views from upstream 9router; added shared `USAGE_PERIOD_OPTIONS` and `USAGE_PERIOD_TO_SECONDS` in `src/lib/usagePeriods.js` for consistent handling across dashboard selectors, API validation, and DB aggregation
- **Blackbox multi-protocol transport** — declared three separate transports (OpenAI Chat, Anthropic Messages, OpenAI Responses) with model-aware routing so GPT models are sent to Chat, Claude models to Messages, and Codex models to Responses endpoints
- **Model-aware transport resolution** — `resolveTransport()` now accepts `model` and `upstreamModel` parameters to match transports by `modelPatterns`, preventing endpoint misrouting for multi-protocol providers
- **Default tool_result image splitting for OpenAI targets** — Claude `tool_result` blocks containing images are now automatically split into tool messages and user image messages when translating to OpenAI format, without requiring explicit per-model `translationPolicy` configuration
- **Regression tests** — `provider-transport.test.js` for model-aware Blackbox transport selection; `usage-periods.test.js` for period helpers and extended chart buckets

### Removed

- **Per-model translationPolicy** — removed `translationPolicy` field from model schema and `getModelTranslationPolicy()` helper; image splitting behavior is now determined at runtime by target format, model vision capability, and image strip list

## v1.2.2 2026-07-05 [(5140879)](https://github.com/NatrocTeam/mairouter/commit/5140879ab7f98b2f6d43145f08594992738f05a4)

### Fixed

- **Reasoning token handling across providers** — aligned per-model capability limits and thinking formats for NVIDIA NIM models, including Nemotron reasoning budgets, DeepSeek/GLM output limits, and Qwen's safe native context window
- **Claude adaptive thinking translation** — preserved `display` intent, emitted adaptive thinking blocks for Claude 4.6+ models, and avoided sending invalid `auto` effort in `output_config`
- **Headroom compression with Claude thinking blocks** — skipped OpenAI round-trip compression when Claude `thinking` or `redacted_thinking` blocks are present to avoid losing non-round-trippable reasoning content
- **GitHub o-series max token mapping** — detected bare reasoning model names such as `o3` in addition to hyphenated variants, ensuring `max_tokens` is converted to `max_completion_tokens`

### Added

- **Regression tests** — added and updated coverage for NVIDIA capabilities, Nemotron reasoning budgets, Claude adaptive thinking, Headroom thinking-block safeguards, and GitHub `max_completion_tokens` handling

## v1.2.1 2026-07-04 [(9dca42d)](https://github.com/NatrocTeam/mairouter/commit/9dca42decf7fa7134b4018c906ad2715274b8684)

### Fixed

- **NVIDIA NIM thinking/reasoning for non-OpenAI clients** — corrected response format translation in `translateNonStreamingResponse()` so Anthropic (Claude) clients receive Claude-format JSON with proper `thinking` blocks instead of raw OpenAI-format `choices[]` when requesting non-streaming
- **NVIDIA NIM per-model `reasoning_effort` clamping** — added `effortRemap` capability to map incompatible effort levels (`minimal`, `low`, `xhigh`) to values each model's API actually accepts: `nvidia/nemotron-3-ultra-550b-a55b` (supports `none|medium|high`), `deepseek-ai/deepseek-v4-flash` and `deepseek-ai/deepseek-v4-pro` (supports `none|high|max`)
- **Hardcoded `budget_tokens` in `providerThinking` injection** — removed the pinned `budget_tokens: 10000` so `providerThinking: "on"` lets the model determine its own effort level via `{ mode: "auto" }`

### Added

- **OpenAI-to-Claude non-streaming converter** — `open-sse/translator/response/openai-to-claude-non-streaming.js` converts OpenAI chat completion responses to Claude message format, preserving `reasoning_content` as a `thinking` block
- **Unit tests** — `tests/unit/non-streaming-response-thinking.test.js` with 12 test cases covering the full conversion logic

## v1.2.0 2026-07-03 [(fa700a5)](https://github.com/NatrocTeam/mairouter/commit/fa700a5c2122a2c0c71190745225eafcba111b41)

### Added

- **New model capabilities** — added `claude-fable-5` with vision, reasoning, search, and adaptive thinking support
- **NVIDIA NIM provider** — replaced `minimaxai/minimax-m3` with `nvidia/nemotron-3-ultra-550b-a55b`; added `deepseek-ai/deepseek-v4-flash` and `deepseek-ai/deepseek-v4-pro` models; updated `z-ai/glm4.7` to `z-ai/glm-5.2`; replaced `nv-embedqa-e5-v5` with `nv-embed-v1`; added `stt` (speech-to-text) service kind
- **Anthropic Beta headers** — added `task-budgets-2026-03-13` and synced extended capabilities across both API and CLI spoof headers

## v1.1.0 2026-07-03 [(4beea7e)](https://github.com/NatrocTeam/mairouter/commit/4beea7ea3f53cf68cc45589a2da1fb9400441d5a)

### Added

- **ZCode CLI Tools integration** — new tool card and settings API for ZCode AI Coding IDE on the `/dashboard/cli-tools` page:
  - Guide-based setup with 8-step walkthrough for configuring mairouter as a custom Anthropic-format provider
  - `POST /api/cli-tools/zcode-settings` — writes the mairouter provider entry to `~/.zcode/v2/config.json` with auto-generated UUID (matching ZCode's own `crypto.randomUUID()` pattern)
  - `GET /api/cli-tools/zcode-settings` — detects ZCode installation and checks if mairouter is already configured
  - `DELETE /api/cli-tools/zcode-settings` — removes the mairouter provider entry from ZCode config
  - Registered in the batch all-statuses endpoint for live status display on the CLI Tools grid
  - ZCode provider icon (`/providers/zcode.png`)

### Changed

- **CI workflows**:
  - Added `workflow_dispatch` trigger to both code quality and npm workflows for manual runs
  - Removed redundant build jobs from code-quality and npm workflows
  - Simplified npm workflow dependency installation steps

### Fixed

- **LICENSE**: Updated copyright information in CLI package license

## v1.0.0 2026-07-03

Forked from 9Router v0.5.x. This is the first mairouter release.

### Added

- Fork from 9Router v0.5.x under the mairouter name
- CLI for server management (`mairouter` command) with interactive TUI and system tray
- AI routing engine with automatic format translation across 96+ registered providers
- Web dashboard for provider, API key, combo, usage, and settings management
- OAuth credential management (Claude Code, Codex, Cursor, Kiro, Qwen, xAI, Gemini CLI, GitHub, Antigravity)
- Account fallback with exponential backoff, rate-limit detection, and cooldown
- Combo model strategies (fallback, round-robin, fusion)
- Streaming SSE with format translation across all supported provider pairs
- Thinking/reasoning block translation — renders in Claude's thinking panel from non-Anthropic providers
- RTK Token Saver with tool_result compression, caveman mode (terse style), and pony tail (senior dev style)
- MITM proxy for CLI tools (Antigravity, Copilot, Cursor, Kiro)
- MCP bridge for plugin communication
- Agent skills for AI assistants (chat, image, TTS, STT, embeddings, web search, web fetch)
- Headroom external token compression proxy
- Cloudflare Tunnel and Tailscale support
- Proxy pools (HTTP, Cloudflare Workers, Vercel Edge, Deno Deploy)
- Embeddings via `/v1/embeddings` (OpenAI, Gemini, Mistral, Voyage, NVIDIA, GitHub, Jina, HuggingFace)
- Text-to-speech via `/v1/audio/speech` (OpenAI, ElevenLabs, Deepgram, Edge TTS, Google TTS, Hyperbolic, Inworld)
- Speech-to-text via `/v1/audio/transcriptions` (OpenAI Whisper, Groq, Gemini, Deepgram, AssemblyAI, NVIDIA, HuggingFace)
- Image generation via `/v1/images/generations` (DALL-E, Gemini Imagen, FLUX, MiniMax, Stable Diffusion, ComfyUI, Recraft, RunwayML)
- Web search via `/v1/search` (Tavily, Exa, Brave, Serper, SearXNG, Google PSE, Linkup, SearchAPI, You.com, Perplexity)
- Web fetch via `/v1/web/fetch` (Firecrawl, Jina Reader, Tavily Extract, Exa)
- MySQL-compatible endpoints (`/v1beta/*` for Gemini)
- Real token counting via `/v1/messages/count_tokens`
- Files API proxy via `/v1/files`
- Global i18n and locale switching
- Cloud sync for multi-device state synchronization
- Docker multi-stage build (node:22-alpine, ghcr.io/NatrocTeam/mairouter)
- GitHub CI workflows (ESLint + npm publish)

### Changed

- Branding: 9Router → mairouter
- Default port: 20128 → 12890
- Data directory: `~/.9router/` → `~/.mairouter/` (or `DATA_DIR`)
- npm package: `9router` → `mairouter`
- Docker image: `decolua/9router` → `ghcr.io/NatrocTeam/mairouter`
- Dashboard URL: `9router.com` → `mairouter.com`
- Database: JSON files (`db.json`) → SQLite (`src/lib/db/`)
- Default max tokens: 64000 → 128000
- Output limit: raised to 300000
- Updates to Anthropic Beta headers, ESLint flat config, and various internal improvements

### Fixed

- Streaming thinking blocks rendering as plain text for non-Anthropic providers
- ESLint warnings and errors across the codebase
- Various upstream issues inherited from 9Router v0.5.x
