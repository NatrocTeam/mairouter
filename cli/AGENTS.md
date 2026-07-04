# AGENTS.md — CLI (/cli/)

CLI package published to npm as `mairouter`. Entry: `cli/cli.js`.

## Entry Point — `cli/cli.js`

Manual argument parsing (no CLI framework). Manages the server lifecycle:

1. Parse args: `--port` (12890), `--host` (0.0.0.0), `--no-browser`, `--log`, `--tray`, `--skip-update`
2. Runtime self-healing: `ensureSqliteRuntime()` + `ensureTrayRuntime()` (lazy install to `~/.mairouter/runtime/node_modules/`)
3. Kill stale processes (PID file, port scan via netstat/lsof)
4. Spawn Next.js standalone as child process with `PORT` + `HOSTNAME` env
5. Restart logic: max 2 restarts within 30 seconds, reset MITM config on cascade crash
6. Tray initialization + interactive menu loop

**Key functions:**

- `getAppDataDir()` — Win: `%APPDATA%/mairouter`, Unix: `~/.mairouter`
- `getLanIp()` — first non-internal IPv4
- `killByPidFile()`, `killAllAppProcesses()` — platform-aware process cleanup
- `checkForUpdate()` — npm registry check with 8s safety timeout
- `startServer()` — spawn + crash log (last 50 lines of stderr)
- `showInterfaceMenu()` — menu: update / web / terminal / hide to tray / exit
- `openBrowser()` — platform-aware: open/start/xdg-open

## Runtime Setup — Hooks

### `hooks/sqliteRuntime.js`

- `ensureSqliteRuntime({ silent })` — installs sql.js + better-sqlite3 to runtime dir
- `buildEnvWithRuntime(baseEnv)` — injects `NODE_PATH` = runtime + bundled node_modules
- `getDataDir()` — DATA_DIR env or `~/.mairouter`

### `hooks/trayRuntime.js`

- `ensureTrayRuntime({ silent })` — installs systray2@2.1.4 (macOS/Linux only)
- **Windows**: skip — uses PowerShell NotifyIcon (zero binary)

### `hooks/postinstall.js`

Calls `ensureSqliteRuntime()` + `ensureTrayRuntime()` on `npm install -g mairouter`.

## TUI — `cli/src/cli/menus/`

| Menu          | File           | Key Logic                                                                                      |
| ------------- | -------------- | ---------------------------------------------------------------------------------------------- |
| **Providers** | `providers.js` | 8 OAuth providers + 7 API key providers, device code vs auth code flow, custom provider types  |
| **API Keys**  | `apiKeys.js`   | CRUD key, copy to clipboard, masked display                                                    |
| **Combos**    | `combos.js`    | Model chains (fallback), multi-model selection with `→` display                                |
| **CLI Tools** | `cliTools.js`  | 6 tools: Claude Code, Codex, Droid, OpenClaw, OpenCode, Hermes — each with quick setup + reset |
| **Settings**  | `settings.js`  | Tunnel ON/OFF, RTK, Headroom, reset password, toggle OIDC                                      |

## API Client — `cli/src/cli/api/client.js`

~30 endpoints called to the server via HTTP. Auth via `x-9r-cli-token` header:

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

Pipeline: `next build` → `.next-cli-build/standalone/` → copy to `cli/app/` → `esbuild` bundle CLI.

- Environment: `NEXT_DIST_DIR=.next-cli-build`, `NEXT_TRACING_ROOT_MODE=workspace`
- Excludes: `sharp`, `@img`, `detect-libc`, `.env*`
- Bundles: `custom-server.js`, static assets, MITM server, updater

## File Paths

| Path                               | Purpose                                         |
| ---------------------------------- | ----------------------------------------------- |
| `~/.mairouter/` or `$DATA_DIR`     | Root data directory                             |
| `{dataDir}/runtime/node_modules/`  | Runtime deps (sql.js, better-sqlite3, systray2) |
| `{dataDir}/auth/cli-secret`        | CLI auth token (32 bytes hex)                   |
| `{dataDir}/machine-id`             | Machine ID (written by server)                  |
| `{dataDir}/mitm/.mitm.pid`         | MITM proxy PID                                  |
| `{dataDir}/tunnel/cloudflared.pid` | Cloudflared PID                                 |
| `{dataDir}/tunnel/tailscale.pid`   | Tailscale PID                                   |

## ⚠️ IMPORTANT RULES

1. **DO NOT** bundle `better-sqlite3` — it's installed to the runtime dir (avoids EBUSY errors on Windows during global update)
2. **DO NOT** bundle `systray2` on Windows — use PowerShell NotifyIcon (zero binary, avoids antivirus false positives)
3. **DO NOT** use external CLI frameworks — manual argument parsing, TUI uses `enquirer` and raw-mode stdin
4. **DO NOT** call Next.js API directly — always go through the HTTP client in `api/client.js`
5. **PATH** of important files: always resolve via `getAppDataDir()` or `process.env.DATA_DIR`
