# AGENTS.md — mairouter Project Map

Mairouter adalah **local AI routing gateway** (v1.0.0) — fork dari [9Router](https://github.com/decolua/9router) oleh [NatrocTeam](https://github.com/NatrocTeam/mairouter).

Lisensi: MIT. Stack: Next.js 16 + React 19.2 + Express 5 + SQLite. Port: `12890` (prod), `20127` (dev). Node >= 18.

## Repository Structure

```
mairouter/
├── cli/                  ← CLI package (npm "mairouter") — baca cli/AGENTS.md
├── open-sse/             ← Core routing/translation engine — baca open-sse/AGENTS.md
├── src/                  ← Next.js web app (dashboard + API routes) — baca src/AGENTS.md
├── tests/                ← Vitest test suite — baca tests/AGENTS.md
├── skills/               ← Agent skills untuk AI assistants (8 file .md)
├── docs/                 ← Dokumentasi (termasuk arsip upstream docs/9router/)
├── scripts/              ← Build/utility scripts (migrasi, combo test, dll)
└── .github/workflows/    ← CI: code-quality.yml (ESLint + Prettier), npm.yml (publish)
```

## Quick Reference untuk AI Agent

### Environment Variables Kunci

| Variable           | Wajib? | Default         | Fungsi                               |
| ------------------ | ------ | --------------- | ------------------------------------ |
| `JWT_SECRET`       | **Ya** | —               | Signing cookie session dashboard     |
| `INITIAL_PASSWORD` | Setup  | `123456`        | Password awal dashboard              |
| `DATA_DIR`         | Tidak  | `~/.mairouter/` | Direktori data (DB, logs, runtime)   |
| `PORT`             | Tidak  | `12890`         | Port server                          |
| `API_KEY_SECRET`   | Tidak  | —               | HMAC secret untuk API key generation |
| `REQUIRE_API_KEY`  | Tidak  | —               | Wajibkan API key untuk semua request |
| `NINEROUTER_URL`   | Tidak  | —               | URL endpoint untuk agent skills      |
| `NINEROUTER_KEY`   | Tidak  | —               | API key untuk agent skills           |

### Global Conventions

- **Import pattern**: `src/` menggunakan `@/` alias (misal `@/lib/db`), `open-sse/` import langsung (`open-sse/handlers/chatCore`)
- **Error handling**: error upstream dikembalikan sebagai response JSON, bukan throw — kecuali fatal
- **Logging**: `console.log` via logger di `open-sse/utils/debugLog.js` dan `src/sse/utils/logger.js`
- **ESLint**: flat config (`eslint.config.mjs`), `no-unused-vars` dengan `_` prefix, `no-empty` dengan `allowEmptyCatch`, `eqeqeq: smart`
- **Branch**: `main` — PR langsung ke main. CI: push/PR trigger ESLint + Prettier
- **Code style**: Prettier formatting, `npm run format` untuk auto-fix

## Sub-AGENTS.md

| Untuk kerja di…               | Baca                                     |
| ----------------------------- | ---------------------------------------- |
| CLI (`cli/`)                  | [cli/AGENTS.md](cli/AGENTS.md)           |
| Core Engine (`open-sse/`)     | [open-sse/AGENTS.md](open-sse/AGENTS.md) |
| Web App / API Routes (`src/`) | [src/AGENTS.md](src/AGENTS.md)           |
| Testing (`tests/`)            | [tests/AGENTS.md](tests/AGENTS.md)       |
