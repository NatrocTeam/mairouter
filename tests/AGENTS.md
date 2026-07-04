# AGENTS.md — Testing (/tests/)

Test suite using [Vitest](https://vitest.dev/). Configuration in `tests/vitest.config.js`.

## How to Run

```bash
cd tests
npx vitest run           # All tests
npx vitest run --reporter=verbose  # Verbose output
npx vitest               # Watch mode
```

## Test Structure

```
tests/
├── vitest.config.js         — Vitest configuration
├── unit/                    — Unit tests
│   ├── model-routing.test.js
│   ├── kiro-model-slots.test.js
│   ├── hf-model-routing.test.js
│   ├── provider-thinking-config.test.js
│   ├── antigravity-cache.test.js
│   ├── db-benchmark.test.js
│   ├── db-concurrent.test.js
│   ├── db-driver-chain.test.js
│   ├── db-migration-chain.test.js
│   ├── compatible-provider-connections.test.js
│   ├── kiro-external-idp.test.js
│   ├── rtk.multi-provider.e2e.test.js
│   └── dashboard-guard.test.js
├── translator/              — Translator integration tests
│   ├── registerAll.js       — Register all translators
│   ├── real/                — Real provider tests (calls actual API)
│   │   ├── all-formats.real.test.js
│   │   ├── thinking.real.test.js
│   │   ├── vision-capability-survey.real.test.js
│   │   ├── file-base64-survey.real.test.js
│   │   └── antigravity-models.real.test.js
└── __baseline__/            — Baseline fixtures for structural validation
    ├── alias-baseline.json
    ├── oauth-urls-baseline.json
    ├── providers-baseline.json
    ├── baseline-results.json
    └── current.json
```

## Key Test Files

| File                                    | What is Tested                                                 |
| --------------------------------------- | -------------------------------------------------------------- |
| `model-routing.test.js`                 | Built-in provider aliases vs compatible node prefixes          |
| `provider-thinking-config.test.js`      | Provider-level thinking config per-model                       |
| `db-benchmark.test.js`                  | Database performance benchmark                                 |
| `db-driver-chain.test.js`               | Adapter fallback chain (better-sqlite3 → node:sqlite → sql.js) |
| `dashboard-guard.test.js`               | Dashboard auth guard logic                                     |
| `rtk.multi-provider.e2e.test.js`        | RTK multi-provider end-to-end                                  |
| `kiro-external-idp.test.js`             | Kiro external identity provider                                |
| `thinking.real.test.js`                 | Thinking block translation with real providers                 |
| `vision-capability-survey.real.test.js` | Vision capability across providers                             |

## Pattern

- **Unit tests**: import from `open-sse/` directly, set env vars via `process.env` or vitest config
- **Real tests**: call the actual API — requires configured credentials. Skipped if unavailable.
- **Baseline**: use `__baseline__/` JSON for structural validation, not hardcoded assertions

## ⚠️ IMPORTANT RULES

1. **Real provider tests** call the actual API (need credentials) — don't assume all tests can run without config
2. **DO NOT** mock every provider — use baseline fixtures for structural validation
3. **Translator tests** need `registerAll.js` to register all translators before tests run
4. **Runtime dir** should not be tested — `~/.mairouter/runtime/` is created by hooks, tests should run without it
5. **DB tests** use in-memory SQLite — do not write to the file system
