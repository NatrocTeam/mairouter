# AGENTS.md — mairouter Project Map

Mairouter is a **local AI routing gateway** (v1.0.0) — a fork of [9Router](https://github.com/decolua/9router) by [NatrocTeam](https://github.com/NatrocTeam/mairouter).

License: MIT. Stack: Next.js 16 + React 19.2 + Express 5 + SQLite. Port: `12890` (prod), `20127` (dev). Node >= 18.

## Repository Structure

```
mairouter/
├── cli/                  ← CLI package (npm "mairouter") — read cli/AGENTS.md
├── open-sse/             ← Core routing/translation engine — read open-sse/AGENTS.md
├── src/                  ← Next.js web app (dashboard + API routes) — read src/AGENTS.md
├── tests/                ← Vitest test suite — read tests/AGENTS.md
├── skills/               ← Agent skills for AI assistants (8 .md files)
├── docs/                 ← Documentation (includes upstream docs/9router/ archive)
├── scripts/              ← Build/utility scripts (migration, combo test, etc.)
└── .github/workflows/    ← CI: code-quality.yml (ESLint + Prettier), npm.yml (publish)
```

## Quick Reference for AI Agent

### Key Environment Variables

| Variable           | Required? | Default         | Purpose                            |
| ------------------ | --------- | --------------- | ---------------------------------- |
| `JWT_SECRET`       | **Yes**   | —               | Signing cookie session dashboard   |
| `INITIAL_PASSWORD` | Setup     | `123456`        | Initial dashboard password         |
| `DATA_DIR`         | No        | `~/.mairouter/` | Data directory (DB, logs, runtime) |
| `PORT`             | No        | `12890`         | Server port                        |
| `API_KEY_SECRET`   | No        | —               | HMAC secret for API key generation |
| `REQUIRE_API_KEY`  | No        | —               | Require API key for all requests   |
| `NINEROUTER_URL`   | No        | —               | Endpoint URL for agent skills      |
| `NINEROUTER_KEY`   | No        | —               | API key for agent skills           |

### Global Conventions

- **Import pattern**: `src/` uses `@/` alias (e.g. `@/lib/db`), `open-sse/` imports directly (`open-sse/handlers/chatCore`)
- **Error handling**: upstream errors are returned as JSON response, not thrown — except for fatal errors
- **Logging**: `console.log` via logger in `open-sse/utils/debugLog.js` and `src/sse/utils/logger.js`
- **ESLint**: flat config (`eslint.config.mjs`), `no-unused-vars` with `_` prefix, `no-empty` with `allowEmptyCatch`, `eqeqeq: smart`
- **Branch**: `main` — PRs go directly to main. CI: push/PR triggers ESLint + Prettier
- **Code style**: Prettier formatting, `npm run format` for auto-fix

## Sub-AGENTS.md

| When working in…              | Read                                     |
| ----------------------------- | ---------------------------------------- |
| CLI (`cli/`)                  | [cli/AGENTS.md](cli/AGENTS.md)           |
| Core Engine (`open-sse/`)     | [open-sse/AGENTS.md](open-sse/AGENTS.md) |
| Web App / API Routes (`src/`) | [src/AGENTS.md](src/AGENTS.md)           |
| Testing (`tests/`)            | [tests/AGENTS.md](tests/AGENTS.md)       |
