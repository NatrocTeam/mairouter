# AGENTS.md — Web App & API Routes (/src/)

Next.js App Router web app. Covers the dashboard UI + 132 API route files.

## Stack

Next.js 16 (webpack build), React 19.2, Express 5 (custom-server.js), Tailwind CSS 4, Zustand, Recharts, Monaco Editor, @xyflow/react.

## API Routes — `src/app/api/`

### OpenAI-Compatible `/v1/*` (via next.config.mjs rewrites)

| Route                      | Method | Handler                   | File                               |
| -------------------------- | ------ | ------------------------- | ---------------------------------- |
| `/v1/chat/completions`     | POST   | `handleChat()`            | `v1/chat/completions/route.js`     |
| `/v1/messages`             | POST   | `handleChat()` (rewrite)  | → `v1/chat/completions/route.js`   |
| `/v1/responses`            | POST   | `handleChat()`            | `v1/responses/route.js`            |
| `/v1/models`               | GET    | Model list                | `v1/models/route.js`               |
| `/v1/embeddings`           | POST   | `handleEmbeddings()`      | `v1/embeddings/route.js`           |
| `/v1/audio/speech`         | POST   | `handleTts()`             | `v1/audio/speech/route.js`         |
| `/v1/audio/transcriptions` | POST   | `handleStt()` (max 300s)  | `v1/audio/transcriptions/route.js` |
| `/v1/images/generations`   | POST   | `handleImageGeneration()` | `v1/images/generations/route.js`   |
| `/v1/web/fetch`            | POST   | Web fetch handler         | `v1/web/fetch/route.js`            |

### Management `/api/*`

| Domain            | Routes                                              | Purpose                                                               |
| ----------------- | --------------------------------------------------- | --------------------------------------------------------------------- |
| `auth/`           | login, logout, status, reset-password, oidc/*       | Dashboard auth                                                        |
| `providers/`      | CRUD + test, validate, batch-test, suggested-models | Provider connections                                                  |
| `provider-nodes/` | CRUD + validate                                     | Custom compatible nodes                                               |
| `oauth/`          | authorize, exchange, poll, import                   | OAuth flows (Claude, Codex, Kiro, Cursor, Gemini, GitHub, Qwen, etc.) |
| `keys/`           | CRUD                                                | API key management                                                    |
| `models/`         | alias, custom, disabled, availability               | Model management                                                      |
| `combos/`         | CRUD                                                | Combo model chains                                                    |
| `pricing/`        | GET/PATCH                                           | Pricing overrides                                                     |
| `usage/`          | history, stats, chart-data, logs                    | Usage tracking                                                        |
| `settings/`       | GET/PATCH, database, proxy-test, require-login      | Server settings                                                       |
| `cli-tools/`      | 14 tool settings writers                            | Claude Code, Codex, Cline, Copilot, Cursor, etc.                      |
| `tunnel/`         | enable/disable, tailscale-enable/disable            | Cloudflare + Tailscale tunnels                                        |
| `proxy-pools/`    | CRUD + deploy (Cloudflare/Vercel/Deno)              | Proxy relays                                                          |
| `mcp/`            | [plugin]/sse, [plugin]/message                      | MCP bridge                                                            |
| `headroom/`       | start, stop, status                                 | External token compression                                            |
| `health/`         | GET → `{"ok":true}`                                 | Health check                                                          |

## SSE Layer — `src/sse/handlers/`

Each handler follows the same pattern:

1. Parse body → extract API key → validate auth
2. `getModelInfo(model)` → `getProviderCredentials(provider)` → `checkAndRefreshToken()`
3. `handleChatCore()` from `open-sse/`
4. Fallback loop: error → `markAccountUnavailable()` → retry with a different connection

| Handler    | File                  | Auth           | Specifics                                     |
| ---------- | --------------------- | -------------- | --------------------------------------------- |
| Chat       | `chat.js` (388 lines) | API key / none | Combo detect, bypass filter, CC naming filter |
| Embeddings | `embeddings.js`       | API key / none | —                                             |
| Image      | `imageGeneration.js`  | API key / none | —                                             |
| TTS        | `tts.js`              | API key / none | —                                             |
| STT        | `stt.js`              | API key / none | multipart/form-data                           |
| Search     | `search.js`           | API key / none | Web search                                    |
| Fetch      | `fetch.js`            | API key / none | URL → markdown                                |

Services: `src/sse/services/auth.js` (credential select), `model.js` (model resolve + alias), `tokenRefresh.js` (refresh + update).

## Database — `src/lib/db/`

SQLite with 4 adapters (fallback chain):

```
better-sqlite3 (native) → node:sqlite (built-in Node 22.5+) → sql.js (pure JS, fallback)
```

### 11 Repos

| Repo                 | Main Table                   | Key Operations                              |
| -------------------- | ---------------------------- | ------------------------------------------- |
| `connectionsRepo`    | `providerConnections`        | CRUD, dedup by email/name, reorder, cleanup |
| `apiKeysRepo`        | `apiKeys`                    | CRUD, validate                              |
| `combosRepo`         | `combos`                     | CRUD, lookup by name                        |
| `aliasRepo`          | —                            | Model aliases, custom models                |
| `settingsRepo`       | `settings`                   | Get/update, cloud config                    |
| `usageRepo`          | `usageHistory`, `usageDaily` | Stats, chart data, log, export              |
| `nodesRepo`          | `providerNodes`              | Custom provider nodes                       |
| `pricingRepo`        | —                            | Pricing overrides                           |
| `proxyPoolsRepo`     | —                            | Proxy pool CRUD                             |
| `disabledModelsRepo` | —                            | Disabled model list                         |
| `requestDetailsRepo` | —                            | Request detail storage                      |

**File location**: `$DATA_DIR/db/data.sqlite` (or `~/.mairouter/db/data.sqlite`).
**Schema version**: 1 (in `schema.js`). WAL mode, synchronous=NORMAL, cache 64MB.

## OAuth — `src/lib/oauth/`

12+ providers with 4 flow types:

| Flow                      | Providers                                         |
| ------------------------- | ------------------------------------------------- |
| Authorization Code + PKCE | Claude, Codex, Gemini CLI, Antigravity, xAI, Kiro |
| Device Code + PKCE        | GitHub, Qwen, Kiro                                |
| Access Token              | GitLab                                            |
| Cookie-based              | iFlow                                             |

Key files: `providers.js` (registry), `constants/oauth.js` (config), `services/index.js` (service classes).

## MCP Bridge — `src/app/api/mcp/[plugin]`

| Route                       | Method | Purpose                          |
| --------------------------- | ------ | -------------------------------- |
| `[plugin]/sse/route.js`     | GET    | SSE stream → `registerSession()` |
| `[plugin]/message/route.js` | POST   | JSON-RPC → `sendToChild()`       |

Backend: `src/lib/mcp/stdioSseBridge.js` — spawn child process, broadcast stdout to SSE sessions. Only plugins from `LOCAL_STDIO_PLUGINS` are allowed (RCE prevention).

## MITM Proxy — `src/mitm/`

Manager: `mitm/manager.js` (1113 lines). Spawns `server.js` as a child process on port 443.

Pipeline:

1. Check/kill leftover process → 2. Generate Root CA → 3. Install to system trust store (sudo)
2. Spawn server → 5. Set `NODE_EXTRA_CA_CERTS` → 6. Health check → 7. Auto-restart (5 retries)

Tool support: Antigravity, Copilot, Cursor, Kiro — via DNS manipulation in hosts file.

## Auth & Security

| Layer              | Method           | Detail                                                           |
| ------------------ | ---------------- | ---------------------------------------------------------------- |
| Dashboard          | JWT cookie       | `jose` library, secret from `JWT_SECRET`                         |
| API                | Bearer token     | API key format: `sk-{machineId}-{keyId}-{crc8}`                  |
| API Key validation | HMAC-SHA256      | `API_KEY_SECRET` env, fallback `"endpoint-proxy-api-key-secret"` |
| CLI bypass         | `x-9r-cli-token` | HMAC from machine ID + cli-secret                                |
| OIDC (optional)    | External IdP     | Config from dashboard settings                                   |

## Dashboard Pages — `src/app/(dashboard)/dashboard/`

Providers (list + detail + new), API Keys, Combos, Usage (charts + table), Settings, CLI Tools, MITM, Proxy Pools, Quota, Translator, Token Saver, Skills, Endpoint, Console Log, Profile.

Data fetching: Zustand store + SWR pattern. UI components in `src/shared/components/`.

## ⚠️ IMPORTANT RULES

1. **DO NOT** edit `next.config.mjs` without reading `custom-server.js` first — rewrite rules and server config are interdependent
2. **DO NOT** add a new route without registering it in `next.config.mjs` — `/v1/*` and `/v1beta/*` go through rewrites
3. **DB migration** only via `src/lib/db/schema.js` — do not create migrations elsewhere
4. **OAuth flow** must handle 3 states: `needsLogin` (return authUrl), `needsConsent` (return consentUrl), `success`
5. **MITM** requires admin/sudo — don't assume auto-start. Handle `getCachedPassword()` and fallback error
6. **API key** format must not be changed — backward compatible with old format (`sk-...`, 2 parts)
7. **`src/lib/localDb.js`** is a backward-compat shim — do not add new logic, add to `src/lib/db/`
