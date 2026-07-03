# AGENTS.md — Testing (/tests/)

Test suite menggunakan [Vitest](https://vitest.dev/). Konfigurasi di `tests/vitest.config.js`.

## Cara Menjalankan

```bash
cd tests
npx vitest run           # All tests
npx vitest run --reporter=verbose  # Verbose output
npx vitest               # Watch mode
```

## Struktur Test

```
tests/
├── vitest.config.js         — Konfigurasi Vitest
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
│   ├── registerAll.js       — Registrasi semua translator
│   ├── real/                — Real provider tests (panggil API beneran)
│   │   ├── all-formats.real.test.js
│   │   ├── thinking.real.test.js
│   │   ├── vision-capability-survey.real.test.js
│   │   ├── file-base64-survey.real.test.js
│   │   └── antigravity-models.real.test.js
└── __baseline__/            — Baseline fixtures untuk structural validation
    ├── alias-baseline.json
    ├── oauth-urls-baseline.json
    ├── providers-baseline.json
    ├── baseline-results.json
    └── current.json
```

## Key Test Files

| File                                    | Apa yang Di-test                                               |
| --------------------------------------- | -------------------------------------------------------------- |
| `model-routing.test.js`                 | Built-in provider aliases vs compatible node prefixes          |
| `provider-thinking-config.test.js`      | Provider-level thinking config per-model                       |
| `db-benchmark.test.js`                  | Database performance benchmark                                 |
| `db-driver-chain.test.js`               | Adapter fallback chain (better-sqlite3 → node:sqlite → sql.js) |
| `dashboard-guard.test.js`               | Dashboard auth guard logic                                     |
| `rtk.multi-provider.e2e.test.js`        | RTK multi-provider end-to-end                                  |
| `kiro-external-idp.test.js`             | Kiro external identity provider                                |
| `thinking.real.test.js`                 | Thinking block translation dengan real providers               |
| `vision-capability-survey.real.test.js` | Vision capability across providers                             |

## Pattern

- **Unit tests**: import dari `open-sse/` langsung, set env vars via `process.env` atau vitest config
- **Real tests**: panggil API beneran — butuh credentials terkonfigurasi. Skip jika tidak ada.
- **Baseline**: gunakan `__baseline__/` JSON untuk structural validation, bukan hardcode assertion

## ⚠️ IMPORTANT RULES

1. **Real provider tests** panggil API beneran (butuh credentials) — jangan asumsi semua test bisa jalan tanpa config
2. **JANGAN** mock tiap provider — gunakan baseline fixtures untuk structural validation
3. **Translator test** butuh `registerAll.js` untuk registrasi semua translator sebelum test jalan
4. **Runtime dir** jangan di-test — `~/.mairouter/runtime/` dibuat oleh hooks, test harus jalan tanpa itu
5. **DB test** pakai in-memory SQLite — jangan tulis ke file sistem
