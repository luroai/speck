---
id: "0393"
title: "Offer DeepSeek in Settings"                # one outcome, no "and"
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
after: ["0392","0387"]                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T08:16:16.005Z"

---
# 0393 · Offer DeepSeek in Settings

**Status:** 🔨 building

## Problem
DeepSeek can be set as builder, reviewer or Foreman from the command line, but Settings doesn't offer it, and there's nowhere in the panel to give its API key.

## Outcome
Settings offers DeepSeek like any other agent, with its models and a field for its key.

## Acceptance criteria
1. The builder, reviewer and Foreman lists in Settings offer DeepSeek, labelled DeepSeek, with no mention of Claude Code. Choosing it lists DeepSeek's models for the model setting.
2. While DeepSeek is chosen for any role, Settings shows whether this machine has a DeepSeek key and has a field to enter or replace it. The field never shows a saved key, and saving a key makes no commit and never sends the key back to the page.
3. Choosing DeepSeek with no key set says the key is needed before it can run, and the panel's checks, like `speck doctor`'s, say when Claude Code isn't installed.
4. Any provider in speck's list appears in Settings the same way, which a test checks with a provider of its own.
5. No test that passed before this change fails.

## Out of scope
- Reading a provider's models from its own API. Settings uses the models in speck's list.

## Notes
- speck runs a provider's models through Claude Code, pointed at the provider's Anthropic-compatible address with the provider's key. Settings, config, logs and the panel name the provider, such as DeepSeek, never Claude Code. Only `speck doctor` and the README say Claude Code must be installed to run it.
- Checked 2026-10-23: DeepSeek's API accepts Anthropic's message format at `https://api.deepseek.com/anthropic`, with the key in `ANTHROPIC_API_KEY`, and its guide names `deepseek-v4-pro` and `deepseek-v4-flash` (https://api-docs.deepseek.com/guides/anthropic_api).
- Checked 2026-10-23: `claude --help` (2.1.301) says `--bare` takes Anthropic auth strictly from `ANTHROPIC_API_KEY` or an apiKeyHelper, and never reads OAuth or the keychain. It also skips hooks, plugins and CLAUDE.md discovery, but skills still resolve by `/skill-name`.
- Builds on 0387's Save for your own settings and 0369's model lists (`agentModels` in `scripts/settings.mjs`).
- Waits for 0392, and for 0387, which also changes Settings in `templates/panel.html`.
- Failing before this build: none
- Self-check: a provider already chosen while Claude Code isn't installed is still offered but now says it can't run; the check uses this machine's own value as the one set now, as Settings shows it; existing tests that pinned the builder, reviewer and Foreman lists (0258, 0287, 0293) now include deepseek.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
