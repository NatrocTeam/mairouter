# AGENTS.md — CLI (/cli/)

CLI package yang di-publish ke npm sebagai `mairouter`. Entry: `cli/cli.js`.

## Entry Point — `cli/cli.js`

Argument parsing manual (tanpa framework CLI). Mengelola lifecycle server:

1. Parse args: `--port` (12890), `--host` (0.0.0.0), `--no-browser`, `--log`, `--tray`, `--skip-update`
2. Runtime self-healing: `ensureSqliteRuntime()` + `ensureTrayRuntime()` (lazy install ke `~/.mairouter/runtime/node_modules/`)
3. Kill stale processes (PID file, port scan via netstat/lsof)
4. Spawn Next.js standalone sebagai child process dengan `PORT` + `HOSTNAME` env
5. Restart logic: max 2 restarts dalam 30 detik, reset MITM config jika crash cascade
6. Tray initialization + interactive menu loop

**Key functions:**

- `getAppDataDir()` — Win: `%APPDATA%/mairouter`, Unix: `~/.mairouter`
- `getLanIp()` — first non-internal IPv4
- `killByPidFile()`, `killAllAppProcesses()` — platform-aware process cleanup
- `checkForUpdate()` — npm registry check with 8s safety timeout
- `startServer()` — spawn + crash log (last 50 lines stderr)
- `showInterfaceMenu()` — menu: update / web / terminal / hide to tray / exit
- `openBrowser()` — platform-aware: open/start/xdg-open

## Runtime Setup — Hooks

### `hooks/sqliteRuntime.js`

- `ensureSqliteRuntime({ silent })` — installs sql.js + better-sqlite3 ke runtime dir
- `buildEnvWithRuntime(baseEnv)` — injects `NODE_PATH` = runtime + bundled node_modules
- `getDataDir()` — DATA_DIR env atau `~/.mairouter`

### `hooks/trayRuntime.js`

- `ensureTrayRuntime({ silent })` — installs systray2@2.1.4 (macOS/Linux only)
- **Windows**: skip — pakai PowerShell NotifyIcon (zero binary)

### `hooks/postinstall.js`

Panggil `ensureSqliteRuntime()` + `ensureTrayRuntime()` saat `npm install -g mairouter`.

## TUI — `cli/src/cli/menus/`

| Menu          | File           | Key Logic                                                                                      |
| ------------- | -------------- | ---------------------------------------------------------------------------------------------- |
| **Providers** | `providers.js` | 8 OAuth providers + 7 API key providers, device code vs auth code flow, custom provider types  |
| **API Keys**  | `apiKeys.js`   | CRUD key, copy to clipboard, masked display                                                    |
| **Combos**    | `combos.js`    | Model chains (fallback), multi-model selection dengan `→` display                              |
| **CLI Tools** | `cliTools.js`  | 6 tools: Claude Code, Codex, Droid, OpenClaw, OpenCode, Hermes — each with quick setup + reset |
| **Settings**  | `settings.js`  | Tunnel ON/OFF, RTK, Headroom, reset password, toggle OIDC                                      |

## API Client — `cli/src/cli/api/client.js`

~30 endpoint yang dipanggil ke server via HTTP. Auth via header `x-9r-cli-token`:

```
SHA256(rawMachineId + "9r-cli-auth" + cliSecret).substring(0, 16)
```

- Token file: `{dataDir}/auth/cli-secret` (32 bytes hex, mode 0o600)
- Config: `{ host: "localhost", port: 12890, protocol: "http:" }`

## System Tray — `cli/src/cli/tray/`

| Platform    | File                      | Implementation                              |
| ----------- | ------------------------- | ------------------------------------------- |
| Windows     | `trayWin.js` + `tray.ps1` | PowerShell NotifyIcon via stdin/stdout JSON |
| macOS/Linux | `tray.js`                 | systray2 (Go binary), graceful quit via IPC |

Autostart via `autostart.js`: launchd (macOS), .vbs Startup folder (Windows), .desktop (Linux).

## Build — `cli/scripts/build-cli.js`

Pipeline: `next build` → `.next-cli-build/standalone/` → copy ke `cli/app/` → `esbuild` bundle CLI.

- Environment: `NEXT_DIST_DIR=.next-cli-build`, `NEXT_TRACING_ROOT_MODE=workspace`
- Excludes: `sharp`, `@img`, `detect-libc`, `.env*`
- Bundles: `custom-server.js`, static assets, MITM server, updater

## File Paths

| Path                               | Fungsi                                          |
| ---------------------------------- | ----------------------------------------------- |
| `~/.mairouter/` atau `$DATA_DIR`   | Root data directory                             |
| `{dataDir}/runtime/node_modules/`  | Runtime deps (sql.js, better-sqlite3, systray2) |
| `{dataDir}/auth/cli-secret`        | CLI auth token (32 bytes hex)                   |
| `{dataDir}/machine-id`             | Machine ID (ditulis oleh server)                |
| `{dataDir}/mitm/.mitm.pid`         | MITM proxy PID                                  |
| `{dataDir}/tunnel/cloudflared.pid` | Cloudflared PID                                 |
| `{dataDir}/tunnel/tailscale.pid`   | Tailscale PID                                   |

## ⚠️ IMPORTANT RULES

1. **JANGAN** bundle `better-sqlite3` — dia di-install ke runtime dir (menghindari EBUSY error di Windows saat update global)
2. **JANGAN** bundle `systray2` di Windows — pakai PowerShell NotifyIcon (zero binary, hindari false positif antivirus)
3. **JANGAN** pakai CLI framework eksternal — argument parsing manual, TUI pakai `enquirer` dan raw-mode stdin
4. **JANGAN** panggil Next.js API langsung — selalu lewat HTTP client di `api/client.js`
5. **PATH** file penting: selalu resolve via `getAppDataDir()` atau `process.env.DATA_DIR`
