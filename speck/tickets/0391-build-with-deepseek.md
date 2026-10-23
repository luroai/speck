---
id: "0391"
title: "Build with DeepSeek"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high               # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-18-use-a-model-provider-through-your-own-api-key.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0390"]                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T07:46:10.236Z"

---
# 0391 · Build with DeepSeek

**Status:** 🔨 building

## Problem
speck run builds with Claude Code, Codex or Cursor. There's no way to build with a model from a provider you have an API key for, such as DeepSeek.

## Outcome
`builder: deepseek` builds tickets with DeepSeek's models.

## Acceptance criteria
1. With `builder: deepseek`, speck run builds each ticket that uses that builder on DeepSeek's model named in builder_model, or DeepSeek's default model when that's blank. It follows `/speck-build` exactly as a Claude Code build does: stopping, resuming and handing a ticket back all work the same. Its run record and the panel name the builder as DeepSeek.
2. The build gets DeepSeek's address and this machine's DeepSeek key, and nothing else that would let it sign in. It never sends a request to Anthropic, and it can't reach your Claude sign-in or your connectors. It still reads the repo's AGENTS.md and skills, as a Claude Code build does.
3. With no DeepSeek key set, or Claude Code not installed, the ticket isn't started, and the panel and speck run say why and how to fix it. `speck doctor` checks both when DeepSeek builds.
4. Any provider in speck's list builds the same way, which a test checks with a provider of its own.
5. The README names DeepSeek as a tested builder (checked by review). No test that passed before this change fails.

## Out of scope
- The Foreman: 0392. Settings: 0393.

## Notes
- speck runs a provider's models through Claude Code, pointed at the provider's Anthropic-compatible address with the provider's key. Settings, config, logs and the panel name the provider, such as DeepSeek, never Claude Code. Only `speck doctor` and the README say Claude Code must be installed to run it.
- Checked 2026-10-23: DeepSeek's API accepts Anthropic's message format at `https://api.deepseek.com/anthropic`, with the key in `ANTHROPIC_API_KEY`, and its guide names `deepseek-v4-pro` and `deepseek-v4-flash` (https://api-docs.deepseek.com/guides/anthropic_api).
- Checked 2026-10-23: `claude --help` (2.1.301) says `--bare` takes Anthropic auth strictly from `ANTHROPIC_API_KEY` or an apiKeyHelper, and never reads OAuth or the keychain. It also skips hooks, plugins and CLAUDE.md discovery, but skills still resolve by `/skill-name`.
- Start from `DEFAULT_BUILD_COMMAND` in `scripts/build-model.mjs` and the per-builder plans in `scripts/ticket-builder.mjs` (0312), adding `--bare`. `--bare` skips CLAUDE.md discovery, so the build has to be given AGENTS.md (or CLAUDE.md) itself, for example with `--append-system-prompt-file`.
- Waits for 0390.
- Failing before this build: none
- Checked 2026-10-23, correcting the note above: with the real Claude Code 2.1.301 in `-p` mode, `--bare` doesn't expand `/speck-build` (the model got the bare text) and offers only the Bash, Edit and Read tools. So builds don't use `--bare`: they run with `--setting-sources=project --strict-mcp-config`, their own `CLAUDE_CONFIG_DIR` and the provider's key in `ANTHROPIC_API_KEY`. Against a local stand-in for DeepSeek's API, with a logging proxy for everything else: the skill expanded, the tools were the full set, Claude Code reported `apiKeySource: ANTHROPIC_API_KEY`, every request went to the given address with only the key (no Authorization header), nothing went through the proxy, and `--resume` continued the same session. Without `--bare`, Claude Code reads the repo's CLAUDE.md (which speck's install makes import AGENTS.md), so nothing is appended.
- Self-check: the launcher took `claude` as the model when `--model` was missing, and ran with missing arguments; both fixed, with a test.
- Pictures: none, because the only change on screen is the builder's name in one sentence on a card, which a fake-page test checks.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
