<div align="center">
  <h1>mairouter</h1>
  <p><strong>AI Gateway & Smart Router — Next.js 16 + React 19</strong></p>
  <p>OpenAI-compatible proxy for 40+ AI providers with 3-tier fallback, token compression, format translation, and a web dashboard.</p>

  <p>
    <a href="#-features">Features</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-architecture">Architecture</a> •
    <a href="#-api-endpoints">API</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-documentation">Documentation</a> •
    <a href="#attribution">Attribution</a>
  </p>
</div>

---

## 🚀 Features

| Feature                   | Description                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| **Smart 3-Tier Fallback** | Auto-routing: Subscription → Cheap → Free. Zero downtime.                                 |
| **RTK Token Saver**       | Compress tool_result output (git diff, grep, ls, tree) — save **20-40% input tokens**.    |
| **Format Translation**    | OpenAI ↔ Claude ↔ Gemini ↔ Kiro ↔ Cursor ↔ Vertex. One format in, auto-converted.         |
| **40+ Providers**         | Claude Code, Codex, Copilot, Cursor, OpenRouter, GLM, MiniMax, Kiro AI, Vertex, and more. |
| **Multi-Account**         | Multiple accounts per provider with round-robin load balancing.                           |
| **Quota Tracking**        | Real-time token count + reset countdown per provider.                                     |
| **Caveman Mode**          | Save up to **65% output tokens** via caveman-speak prompt injection.                      |
| **Ponytail Mode**         | YAGNI-first "lazy senior dev" code generation.                                            |
| **Auto OAuth Refresh**    | OAuth tokens refresh automatically — no manual re-login.                                  |
| **MITM Proxy**            | Intercept Antigravity, Copilot, and Cursor traffic.                                       |
| **CLI Tool**              | Terminal-based dashboard and server management.                                           |
| **Web Dashboard**         | Full UI for managing providers, combos, keys, and usage analytics.                        |

---

## 🔄 How It Works

```
┌─────────────────┐
│  Your CLI Tool  │  (Claude Code, Codex, Cursor, Cline, OpenClaw...)
└────────┬────────┘
         │ http://localhost:<port>/v1
         ▼
┌─────────────────────────────────────────────┐
│               mairouter                      │
│  • RTK Token Saver                          │
│  • Format Translation                       │
│  • Quota Tracking                           │
│  • Auto Token Refresh                       │
└──────┬──────────────────────────────────────┘
       │
       ├──→ Tier 1: SUBSCRIPTION (Claude Code, Codex, Copilot)
       │       ↓ quota exhausted
       ├──→ Tier 2: CHEAP (GLM $0.6/1M, MiniMax $0.2/1M)
       │       ↓ budget limit
       └──→ Tier 3: FREE (Kiro AI, Vertex $300 credits)
```

---

## ⚡ Quick Start

### Prerequisites

- Node.js 20+
- npm

### Installation & Run

```bash
# Clone the repo
git clone https://github.com/NatrocTeam/mairouter.git
cd mairouter

# Copy environment file
cp .env.example .env

# Install dependencies
npm install
npm run install:all

# Development mode
PORT=20128 NEXT_PUBLIC_BASE_URL=http://localhost:20128 npm run dev
```

### Build & Production

```bash
npm run build
PORT=20128 HOSTNAME=0.0.0.0 NEXT_PUBLIC_BASE_URL=http://localhost:20128 npm run start
```

### Access

| Service      | URL                                 |
| ------------ | ----------------------------------- |
| Dashboard    | `http://localhost:20128/dashboard`  |
| API Endpoint | `http://localhost:20128/v1`         |
| Health Check | `http://localhost:20128/api/health` |

---

## 🏗️ Architecture

```
mairouter/
├── src/                    # Next.js 16 App (dashboard + API routes)
│   ├── app/                # Pages & API routes (App Router)
│   │   ├── api/v1/         # OpenAI-compatible API endpoints
│   │   └── dashboard/      # Web UI pages
│   ├── lib/                # Database, auth, OAuth, tunnel, MITM
│   ├── sse/                # SSE handlers (chat, embeddings, etc.)
│   ├── shared/             # Shared components, constants, hooks
│   └── mitm/               # MITM proxy handlers
├── open-sse/               # Core engine
│   ├── executors/          # Provider executors (kiro, codex, vertex...)
│   ├── translator/         # Format translation (OpenAI ↔ Claude ↔ Gemini)
│   ├── providers/          # Provider registry (80+ provider definitions)
│   ├── rtk/                # Token saver (RTK filters, Caveman, Ponytail)
│   └── handlers/           # Chat, embeddings, TTS, image generation
├── cli/                    # CLI package (npm global install)
├── tests/                  # Test suite (vitest)
│   ├── unit/               # Unit tests (97 files)
│   ├── translator/         # Format translation tests
│   └── __baseline__/       # Regression baseline tests
├── skills/                 # Claude Code skill definitions
└── docs/                   # Documentation
    ├── ARCHITECTURE.md
    ├── BUG-ANTHROPIC.md
    └── Anthropic/           # Anthropic API reference docs
```

---

## 📡 API Endpoints

### Chat & Completion

```bash
# OpenAI Chat Completions
POST http://localhost:20128/v1/chat/completions
Authorization: Bearer <api-key>
Content-Type: application/json

{
  "model": "openai/gpt-5",
  "messages": [{"role": "user", "content": "Hello!"}],
  "stream": true
}
```

### Available Endpoints

| Endpoint                         | Purpose                      |
| -------------------------------- | ---------------------------- |
| `GET /v1/models`                 | List all models + combos     |
| `POST /v1/chat/completions`      | OpenAI Chat Completions      |
| `POST /v1/messages`              | Claude Messages API          |
| `POST /v1/responses`             | OpenAI Responses API         |
| `POST /v1/images/generations`    | Image generation             |
| `POST /v1/audio/speech`          | Text-to-Speech               |
| `POST /v1/audio/transcriptions`  | Speech-to-Text               |
| `POST /v1/embeddings`            | Embeddings                   |
| `GET /v1/models/image`           | List image generation models |
| `GET /v1/models/tts`             | List TTS models              |
| `GET /v1/models/embedding`       | List embedding models        |
| `GET /v1/models/web`             | List web search/fetch models |
| `GET /v1/models/stt`             | List speech-to-text models   |
| `POST /v1/web/fetch`             | Fetch web page as markdown   |
| `POST /v1/search`                | Web search                   |
| `POST /v1/messages/count_tokens` | Count tokens in a message    |

Request format is auto-detected and translated to the provider's native format.

---

## 🛠️ Tech Stack

| Layer           | Technology                                     |
| --------------- | ---------------------------------------------- |
| **Runtime**     | Node.js 20+                                    |
| **Framework**   | Next.js 16 (standalone output)                 |
| **UI**          | React 19 + Tailwind CSS 4                      |
| **Database**    | SQLite (better-sqlite3 / sql.js / node:sqlite) |
| **Streaming**   | Server-Sent Events (SSE)                       |
| **Auth**        | OAuth 2.0 (PKCE) + JWT + API Keys              |
| **Charts**      | Recharts                                       |
| **Flow Editor** | @xyflow/react                                  |
| **Testing**     | Vitest                                         |

---

## 📖 Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Anthropic Client Bug Audit](docs/BUG-ANTHROPIC.md)
- [Anthropic API Reference](docs/Anthropic/) — offline Anthropic API docs (Messages, Completions, Managed Agents, Models, Beta)

---

## 🧪 Testing

```bash
cd tests
npm install
npm test
```

The test suite covers:

- **Unit tests** — 97 files covering executors, translators, capabilities, etc.
- **Translator tests** — format conversion validation between OpenAI, Claude, Gemini, Kiro, etc.
- **Baseline tests** — snapshot regression testing
- **Real integration tests** — end-to-end with actual providers

---

## 🔧 Environment Configuration

See [.env.example](.env.example) for the full list of environment variables.

Key variables:

| Variable              | Default                  | Description                        |
| --------------------- | ------------------------ | ---------------------------------- |
| `PORT`                | `20128`                  | Service port                       |
| `HOSTNAME`            | `0.0.0.0`                | Bind address                       |
| `DATA_DIR`            | `~/.mairouter`           | Data directory (SQLite DB)         |
| `INITIAL_PASSWORD`    | `123456`                 | First login password               |
| `JWT_SECRET`          | auto-generated           | JWT signing secret                 |
| `REQUIRE_API_KEY`     | `false`                  | Require API key for `/v1/*` routes |
| `ENABLE_REQUEST_LOGS` | `false`                  | Enable request/response logging    |
| `BASE_URL`            | `http://localhost:20128` | Server-side internal base URL      |
| `CLOUD_URL`           | `https://mairouter.com`  | Cloud sync endpoint base URL       |

---

## 📦 Deployment

### Docker

```bash
docker run -d \
  --name mairouter \
  -p 20128:20128 \
  -v "$HOME/.mairouter:/app/data" \
  -e DATA_DIR=/app/data \
  ghcr.io/NatrocTeam/mairouter:latest
```

### VPS / Cloud

```bash
git clone https://github.com/NatrocTeam/mairouter.git
cd mairouter
npm install && npm run build
export PORT=20128 HOSTNAME=0.0.0.0 NODE_ENV=production
npm run start
# or via PM2
pm2 start npm --name mairouter -- start
```

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

---

## Attribution

Mairouter is a modified project based on [9Router](https://github.com/decolua/9router), originally created by decolua and contributors.

9Router is licensed under the MIT License.

Original work:
Copyright (c) 2024-2026 decolua and contributors

Mairouter modifications:
Copyright (c) 2026 NatrocTeam and Mairouter contributors

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
