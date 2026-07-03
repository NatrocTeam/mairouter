<div align="center">

# mairouter

**Local AI Routing Gateway** — one endpoint, 96+ providers, automatic format translation.

Route any AI client (Claude Code, Codex, Cursor, Cline, any OpenAI SDK) to any upstream provider with streaming, fallback, token savings, and a web dashboard.

[![npm](https://img.shields.io/npm/v/mairouter)](https://www.npmjs.com/package/mairouter)
[![GitHub](https://img.shields.io/github/license/NatrocTeam/mairouter)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-ghcr.io%2FNatrocTeam%2Fmairouter-blue?logo=docker)](https://github.com/NatrocTeam/mairouter/pkgs/container/mairouter)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

[Quick Start](#quick-start) • [Features](#features) • [CLI Reference](cli/README.md) • [Agent Skills](skills/README.md) • [Architecture](docs/ARCHITECTURE.md)

</div>

---

## What is mairouter?

Mairouter is a **local AI traffic gateway** that runs on your machine. Point any OpenAI-compatible client to `http://localhost:12890/v1` and mairouter automatically:

- **Routes** to the best upstream provider (Anthropic, OpenAI, Gemini, DeepSeek, Qwen, Kiro, Ollama, and 90+ more)
- **Translates** request/response formats on the fly (Claude ↔ OpenAI ↔ Gemini ↔ Kiro ↔ Cursor ↔ Ollama)
- **Falls back** across accounts and model combos when rate limits or errors occur
- **Saves tokens** with RTK compression (caveman mode, pony tail, filter-based)
- **Streams** thinking/reasoning blocks from non-Anthropic providers into Claude's thinking panel

```
┌──────────────┐     ┌──────────────────────────────────────────────┐     ┌──────────────────┐
│  Your Tool   │     │             mairouter (port 12890)           │     │   AI Providers   │
│              │     │                                              │     │                  │
│  Claude Code │────▶│  /v1/*  →  Format Detect  →  Translate      │────▶│  Anthropic       │
│  Codex CLI   │     │              ↓                               │     │  OpenAI          │
│  Cursor      │     │         Executor (SSE/REST)                  │     │  Gemini          │
│  Cline       │     │         Account Fallback                     │     │  DeepSeek        │
│  OpenAI SDK  │     │         Combo Router                         │     │  Kiro            │
│  OpenClaw    │     │         RTK Compression                      │     │  Ollama          │
│              │     │                                              │     │  ... 96+ more    │
└──────────────┘     └──────────────────────────────────────────────┘     └──────────────────┘
```

---

## Quick Start

### 1. Install

```bash
npm install -g mairouter
```

Or run directly without installing:

```bash
npx mairouter
```

### 2. Start

```bash
mairouter
```

This starts the server on `http://localhost:12890` and opens the dashboard in your browser.

### 3. Connect a provider

- **OAuth providers** (Claude Code, Codex, Kiro, Cursor, Qwen, xAI, Gemini CLI, GitHub): click "Add Provider" in the dashboard and follow the OAuth flow.
- **API key providers** (OpenAI, Anthropic, DeepSeek, OpenRouter, etc.): enter your API key in the dashboard.

### 4. Use it

**With Claude Code:**

```bash
export ANTHROPIC_BASE_URL=http://localhost:12890
```

**With any OpenAI SDK:**

```js
import OpenAI from "openai";
const client = new OpenAI({
  baseURL: "http://localhost:12890/v1",
  apiKey: "sk-...", // from Dashboard → Keys
});
```

**With cURL:**

```bash
curl http://localhost:12890/v1/chat/completions \
  -H "Authorization: Bearer sk-..." \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/gpt-4o","messages":[{"role":"user","content":"Hello"}]}'
```

---

## Features

| Feature                    | Description                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| **Multi-Provider Routing** | Route to 96+ providers from a single OpenAI-compatible endpoint                                     |
| **Format Translation**     | Automatic conversion between Claude, OpenAI, Gemini, Kiro, Cursor, Ollama formats                   |
| **Combo Models**           | Fallback, round-robin, and fusion strategies across multiple models                                 |
| **Account Fallback**       | Multi-account per provider with automatic failover on rate limits and errors                        |
| **OAuth Support**          | Claude Code, Codex, Cursor, Kiro, Qwen, xAI, Gemini CLI, GitHub, Antigravity                        |
| **Streaming Thinking**     | Thinking/reasoning blocks from non-Anthropic providers render in Claude's thinking panel            |
| **RTK Token Saver**        | Auto-compress tool_result content; caveman mode for terse responses; pony tail for senior-dev style |
| **Web Dashboard**          | Manage providers, API keys, combos, usage tracking, settings, proxy pools                           |
| **CLI + Tray**             | Terminal UI menu and system tray mode (Windows PowerShell NotifyIcon, macOS/Linux systray2)         |
| **MITM Proxy**             | TLS-intercepting proxy for Antigravity, Copilot, Cursor, Kiro CLI tools                             |
| **MCP Bridge**             | SSE bridge for MCP plugins                                                                          |
| **Tunnels**                | Cloudflare Tunnel and Tailscale support                                                             |
| **Proxy Pools**            | HTTP proxy, Cloudflare Workers, Vercel Edge, Deno Deploy relays                                     |
| **Embeddings**             | OpenAI-compatible `/v1/embeddings` for RAG and semantic search                                      |
| **TTS / STT**              | Text-to-speech and speech-to-text via OpenAI, ElevenLabs, Deepgram, Edge TTS, Groq, AssemblyAI      |
| **Image Generation**       | DALL-E, Gemini Imagen, FLUX, MiniMax, Stable Diffusion, ComfyUI                                     |
| **Web Search & Fetch**     | Tavily, Firecrawl, Jina Reader, Exa, Brave, Serper, SearXNG, Google PSE                             |
| **Headroom**               | External proxy-based token compression                                                              |
| **Cloud Sync**             | Optional multi-device state synchronization                                                         |
| **Prompt Caching**         | Automatic Claude header caching                                                                     |
| **OIDC Auth**              | External OIDC provider for dashboard login                                                          |
| **Docker**                 | Multi-stage build, `ghcr.io/NatrocTeam/mairouter`                                                   |

---

## Docker

```bash
docker pull ghcr.io/NatrocTeam/mairouter:latest
docker run -p 12890:12890 ghcr.io/NatrocTeam/mairouter:latest
```

---

## Documentation

- [**CLI Manual**](cli/README.md) — Full CLI reference with options, TUI menu, and system tray
- [**Agent Skills**](skills/README.md) — Drop-in skills for AI assistants (chat, image, TTS, embeddings, search)
- [**Architecture**](docs/ARCHITECTURE.md) — System design and internal architecture
- [**Upstream 9Router Docs**](docs/9router/) — Reference copies of original 9Router documentation (archival)

---

## Environment Variables

| Variable               | Required        | Purpose                                            |
| ---------------------- | --------------- | -------------------------------------------------- |
| `JWT_SECRET`           | **Yes**         | Dashboard session cookie signing                   |
| `INITIAL_PASSWORD`     | **Yes (setup)** | Default dashboard password (change on first login) |
| `DATA_DIR`             | No              | Data directory (default: `~/.mairouter/`)          |
| `PORT`                 | No              | Server port (default: `12890`)                     |
| `API_KEY_SECRET`       | No              | HMAC secret for API key generation                 |
| `MACHINE_ID_SALT`      | No              | Salt for machine ID hashing                        |
| `REQUIRE_API_KEY`      | No              | Require API key for all requests                   |
| `HTTP_PROXY`           | No              | Outbound HTTP proxy for upstream calls             |
| `HTTPS_PROXY`          | No              | Outbound HTTPS proxy                               |
| `NEXT_PUBLIC_BASE_URL` | No              | Public URL for cloud sync                          |

See [`.env.example`](.env.example) for the full list.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, build instructions, and PR guidelines.

---

## License

Mairouter is MIT licensed. It is a fork of [9Router](https://github.com/decolua/9router) by decolua. See [NOTICE.md](NOTICE.md) for attribution and [LICENSE](LICENSE) for the full license text.
