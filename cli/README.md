# mairouter CLI

Start and manage the mairouter AI gateway server from the terminal.

## Installation

```bash
npm install -g mairouter
```

Or run directly:

```bash
npx mairouter
```

## Usage

```
mairouter [options]
```

### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--port` | `-p` | Port to run the server | `12890` |
| `--host` | `-H` | Host to bind | `0.0.0.0` |
| `--no-browser` | `-n` | Don't open browser automatically | — |
| `--log` | `-l` | Show server logs (hidden by default) | — |
| `--tray` | `-t` | Run in system tray mode (background) | — |
| `--skip-update` | — | Skip auto-update check | — |
| `--help` | `-h` | Show help message | — |
| `--version` | `-v` | Show version | — |

## Terminal UI

When started without `--tray`, mairouter launches an interactive terminal menu:

```
📡 mairouter Terminal UI
────────────────────────────
Endpoint: http://localhost:12890/v1
Tunnel:   OFF (local only)
Key:      9r-xxxxx

  Providers     — Manage provider connections
  API Keys      — View and manage API keys
  Combos        — Create and manage model combos
  CLI Tools     — Configure CLI tool integrations
  Settings      — Tunnel, RTK, Headroom, password
  Quit
```

## Features

### Server Management

- Starts the Next.js server behind the scenes as a child process
- Auto-kills stale processes from previous sessions
- Graceful shutdown on `Ctrl+C`

### System Tray Mode (`--tray`)

Runs the server in the background with a system tray icon:

- **macOS / Linux**: uses `systray2` (auto-installed on first run)
- **Windows**: uses PowerShell `NotifyIcon` (no binary dependencies)

### Auto-Update

When started without `--skip-update`, mairouter automatically checks npm for a newer version and prompts to upgrade.

### Runtime Dependencies

SQLite dependencies (`sql.js`, `better-sqlite3`) are installed into `~/.mairouter/runtime/node_modules` at startup rather than bundled with the package. This avoids Windows `EBUSY` errors when updating the global CLI.

## What You Can Do From the CLI

| Menu | Actions |
|------|---------|
| **Providers** | List, add, remove, reconnect OAuth providers |
| **API Keys** | View keys, copy to clipboard, generate new keys |
| **Combos** | Create/delete model combos (fallback chains) |
| **CLI Tools** | Configure tool-specific settings (Claude Code, Codex, Cursor, etc.) |
| **Settings** | Toggle tunnel, RTK/Headroom token savers, reset password |

## Attribution

Mairouter is a modified project based on [9Router](https://github.com/decolua/9router), originally created by decolua and contributors.

9Router is licensed under the MIT License.

Original work:
Copyright (c) 2024-2026 decolua and contributors

Mairouter modifications:
Copyright (c) 2026 NatrocTeam and Mairouter contributors
