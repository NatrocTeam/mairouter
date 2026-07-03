# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in mairouter, please report it through [GitHub Private Vulnerability Reporting](https://github.com/NatrocTeam/mairouter/security/advisories/new).

Please **do not** open a public issue for security vulnerabilities.

## Response

We will acknowledge receipt within 48 hours and provide an estimated timeline for a fix. Security patches are prioritized and released as soon as they are verified.

## Scope

Security-relevant areas of mairouter include:

- **JWT_SECRET** — dashboard session cookie signing; must use a strong random value
- **INITIAL_PASSWORD** — the default password (`123456`) must be changed on first login
- **API_KEY_SECRET** — HMAC secret for local API key generation
- **MACHINE_ID_SALT** — salt for machine identification
- **Provider credentials** — API keys and OAuth tokens stored in the local SQLite database
- **Cloud sync** — data transmitted between local instance and cloud endpoint

## No Bug Bounty

This is an MIT-licensed open-source project with no bug bounty program. We appreciate responsible disclosure and will give credit to reporters in release notes.

## Best Practices for Deployment

1. Always set a strong `JWT_SECRET` via environment variable
2. Change `INITIAL_PASSWORD` on first login
3. Set `API_KEY_SECRET` to a random string if enabling API key authentication
4. Restrict filesystem access to the data directory (`DATA_DIR`)
5. Use environment variables rather than `.env` files in production
6. Consider running behind a reverse proxy (Nginx, Caddy) with HTTPS
