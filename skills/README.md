# mairouter — Agent Skills

Drop-in skills for any AI agent (Claude, Cursor, ChatGPT, custom SDK). Just **copy a link** below and paste it to your AI — it will fetch the skill and use mairouter for you.

> Tip: start with the **mairouter** entry skill — it covers setup and links to all capability skills.

## Skills

| Capability                     | Copy link below and paste to your AI                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Entry / Setup** (start here) | https://raw.githubusercontent.com/NatrocTeam/mairouter/refs/heads/master/skills/mairouter/SKILL.md            |
| Chat / code-gen                | https://raw.githubusercontent.com/NatrocTeam/mairouter/refs/heads/master/skills/mairouter-chat/SKILL.md       |
| Image generation               | https://raw.githubusercontent.com/NatrocTeam/mairouter/refs/heads/master/skills/mairouter-image/SKILL.md      |
| Text-to-speech                 | https://raw.githubusercontent.com/NatrocTeam/mairouter/refs/heads/master/skills/mairouter-tts/SKILL.md        |
| Speech-to-text                 | https://raw.githubusercontent.com/NatrocTeam/mairouter/refs/heads/master/skills/mairouter-stt/SKILL.md        |
| Embeddings                     | https://raw.githubusercontent.com/NatrocTeam/mairouter/refs/heads/master/skills/mairouter-embeddings/SKILL.md |
| Web search                     | https://raw.githubusercontent.com/NatrocTeam/mairouter/refs/heads/master/skills/mairouter-web-search/SKILL.md |
| Web fetch (URL → markdown)     | https://raw.githubusercontent.com/NatrocTeam/mairouter/refs/heads/master/skills/mairouter-web-fetch/SKILL.md  |

## How to use

Paste to your AI (Claude, Cursor, ChatGPT, …):

```
Read this skill and use it: https://raw.githubusercontent.com/NatrocTeam/mairouter/refs/heads/master/skills/mairouter/SKILL.md
```

Then ask normally — _"generate an image of a cat"_, _"transcribe this URL"_, etc.

## Configure your shell once

```bash
export NINEROUTER_URL="http://localhost:12890"   # local default, or your VPS / tunnel URL
export NINEROUTER_KEY="sk-..."                   # from Dashboard → Keys (only if requireApiKey=true)
```

Verify: `curl $NINEROUTER_URL/api/health` → `{"ok":true}`.

## Links

- Source: https://github.com/NatrocTeam/mairouter
- Dashboard: https://mairouter.com
