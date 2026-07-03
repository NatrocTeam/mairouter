# Changelog

## v1.0.0 (2026-07-03)

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
