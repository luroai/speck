---
id: "0392"
title: "Run the Foreman on DeepSeek"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: high               # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-18-use-a-model-provider-through-your-own-api-key.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0391"]                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T08:05:16.858Z"

---
# 0392 · Run the Foreman on DeepSeek

**Status:** 🔨 building

## Problem
The Foreman runs on Claude Code, Codex or Cursor. Someone building with DeepSeek can't run the Foreman on it too.

## Outcome
`foreman: deepseek` runs the Foreman on DeepSeek's models.

## Acceptance criteria
1. With `foreman: deepseek`, speck run starts the Foreman on DeepSeek's model named in foreman_model, or DeepSeek's default model when that's blank. foreman_effort isn't passed. It looks into a stop and takes one action, exactly as the Claude Code Foreman does.
2. It may do only what the Claude Code Foreman may: read files, and run speck's commands and read-only git commands. It gets DeepSeek's address and this machine's DeepSeek key, and nothing else that would let it sign in.
3. With no DeepSeek key set, or Claude Code not installed, the Foreman isn't started, and speck run says why. A blank foreman with `builder: deepseek` uses DeepSeek, as it does for Codex and Cursor builders (0333).
4. Any provider in speck's list runs the Foreman the same way, which a test checks with a provider of its own.
5. No test that passed before this change fails.

## Out of scope
- Settings: 0393.

## Notes
- speck runs a provider's models through Claude Code, pointed at the provider's Anthropic-compatible address with the provider's key. Settings, config, logs and the panel name the provider, such as DeepSeek, never Claude Code. Only `speck doctor` and the README say Claude Code must be installed to run it.
- Checked 2026-10-23: DeepSeek's API accepts Anthropic's message format at `https://api.deepseek.com/anthropic`, with the key in `ANTHROPIC_API_KEY`, and its guide names `deepseek-v4-pro` and `deepseek-v4-flash` (https://api-docs.deepseek.com/guides/anthropic_api).
- Checked 2026-10-23: `claude --help` (2.1.301) says `--bare` takes Anthropic auth strictly from `ANTHROPIC_API_KEY` or an apiKeyHelper, and never reads OAuth or the keychain. It also skips hooks, plugins and CLAUDE.md discovery, but skills still resolve by `/skill-name`.
- Start from `foremanArgv` in `scripts/foreman-agent.mjs`, whose Claude Code command already limits the Foreman to reading and to speck and read-only git commands, adding `--bare`.
- Waits for 0391.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
