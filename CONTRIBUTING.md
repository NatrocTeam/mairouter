# Contributing to mairouter

Thank you for your interest in contributing! Mairouter is an open-source project — a fork of [9Router](https://github.com/decolua/9router) by decolua.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/NatrocTeam/mairouter.git
cd mairouter

# Install all dependencies (root + CLI + tests)
npm run install:all

# Start dev server (port 20127)
npm run dev
```

## Building

```bash
# Build everything (Next.js web app + CLI)
npm run build:all

# Or individually:
npm run build       # Next.js web app only
npm run build:cli   # CLI bundle only
```

## Testing

```bash
cd tests
npx vitest run
```

## Code Style

- ESLint 9 with flat config (`eslint.config.mjs`)
- Prettier for formatting
- Run `npm run lint` before committing
- Run `npm run format` to auto-format

## PR Process

1. Fork the repository
2. Create a feature branch from the default branch
3. Make your changes
4. Run `npm run lint` and fix any issues
5. Run tests: `cd tests && npx vitest run`
6. Open a Pull Request against the default branch
7. Ensure CI checks pass

## Reporting Issues

- Use [GitHub Issues](https://github.com/NatrocTeam/mairouter/issues) for bug reports and feature requests
- Include steps to reproduce for bugs
- Include relevant logs and environment details

## Attribution

This project is MIT-licensed. By contributing, you agree that your contributions will be licensed under the same license. See [NOTICE.md](NOTICE.md) for 9Router attribution details.
