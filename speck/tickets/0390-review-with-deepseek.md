---
id: "0390"
title: "Review with DeepSeek"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0389","0388"]                # ticket ids that must be done first
created: 2026-10-23

---
# 0390 · Review with DeepSeek

**Status:** 📋 ready

## Problem
speck's reviewers are Codex, Claude Code and Cursor. There's no way to review with a model from a provider you have an API key for, such as DeepSeek, which may be cheaper or quicker.

## Outcome
`reviewer: deepseek` reviews tickets with DeepSeek's models.

## Acceptance criteria
1. With `reviewer: deepseek`, `speck review` runs the round on DeepSeek's model named in reviewer_model, or DeepSeek's default model when that's blank. It's read-only, as the Claude reviewer is, and records the round like any other, as reviewer `deepseek`. Later rounds continue the same session. reviewer_effort isn't passed.
2. The reviewer gets DeepSeek's address and this machine's DeepSeek key, and nothing else that would let it sign in. It never sends a request to Anthropic, and it can't reach your Claude sign-in, your Claude Code settings or your connectors.
3. With no DeepSeek key set, the round fails before it starts, saying how to set one. If Claude Code isn't installed, it fails saying DeepSeek reviews need Claude Code installed. Either way, nothing is recorded. `speck doctor` checks both when DeepSeek reviews.
4. The same-model check treats DeepSeek as a family of its own, so any builder may be reviewed by it. Any provider in speck's list reviews the same way, which a test checks with a provider of its own.
5. The brief's table of reviewers has a row for provider reviewers, and the README names DeepSeek as tested (checked by review). No test that passed before this change fails.

## Out of scope
- Building or the Foreman on DeepSeek: 0391 and 0392. Settings: 0393.

## Notes
- speck runs a provider's models through Claude Code, pointed at the provider's Anthropic-compatible address with the provider's key. Settings, config, logs and the panel name the provider, such as DeepSeek, never Claude Code. Only `speck doctor` and the README say Claude Code must be installed to run it.
- Checked 2026-10-23: DeepSeek's API accepts Anthropic's message format at `https://api.deepseek.com/anthropic`, with the key in `ANTHROPIC_API_KEY`, and its guide names `deepseek-v4-pro` and `deepseek-v4-flash` (https://api-docs.deepseek.com/guides/anthropic_api).
- Checked 2026-10-23: `claude --help` (2.1.301) says `--bare` takes Anthropic auth strictly from `ANTHROPIC_API_KEY` or an apiKeyHelper, and never reads OAuth or the keychain. It also skips hooks, plugins and CLAUDE.md discovery, but skills still resolve by `/skill-name`.
- Start from the Claude reviewer's command, `CLAUDE_ARGS` in `scripts/reviewers.mjs`, adding `--bare`. The key goes into the reviewer's own environment only.
- Unverified: whether DeepSeek's endpoint keeps a Claude Code session for `--resume`, which is local to Claude Code, so it should. If not, later rounds send the full history as command reviewers do.
- Waits for 0389 for the key, and for 0388, which changes how a ticket's reviewer is chosen (`scripts/review.mjs`, `scripts/same-model.mjs`).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
