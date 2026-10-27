---
id: "0524"
title: Keep a current price table for AI models                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-27T11:10:34.384Z"

---
# 0524 · Keep a current price table for AI models

**Status:** 🔨 building

## Problem
speck can only put a dollar figure on agents that report one, and only Claude Code does. Codex and Cursor report tokens alone. No speck user should have to look up model rates and type them in, and pricing has to work on a machine that can't reach the internet.

## Outcome
speck prices a model's tokens from a price table that ships with each release.

## Acceptance criteria
1. speck ships a price table taken from LiteLLM's model price list (`https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json`), cut down to the rates pricing uses, with the date it was taken. `npm run prices` replaces it with the current list. speck itself never fetches it.
2. `docs/brief.md`'s Releases section says a release ticket runs `npm run prices`, so each release carries that day's rates.
3. A model's rates are found from its name as the agents give it: `claude-opus-5-5`, `gpt-6.1-sol` and `deepseek-v4-pro` find their own entries; Cursor's `grok-4.7-high` and `grok-4.7-high-fast` find `xai/grok-4.7`, with the effort and speed words dropped and the provider prefix added; `auto` and a name in no entry find none, so their cost is unknown, never $0.
4. Tokens split into uncached input, cached input, cache writes and output cost each count times its rate, added up. With a test table giving a model $2 input, $0.10 cached input, $2.50 cache writes and $10 output per million tokens, 400,000 uncached input, 600,000 cached input, no cache writes and 10,000 output tokens cost $0.96. Tests use tables of their own, never the shipped one.
5. `speck prices <model>` prints the rates speck would use for that model per million tokens, the entry it matched and the date the table was taken, or says no rates were found. `docs/brief.md`'s command table lists `speck prices`.

## Out of scope
- Using the table: review rounds (0529), builds (0530) and the watch agent (0525).
- Fetching rates while speck runs: they change only with a release.
- Tiered rates: see Notes.

## Notes
- A cost is an estimate at list prices, as they were on the day the installed release's table was taken: what the work would have cost on an API key. It's meant to show spend per ticket and over time, not to match a bill.
- `npm run prices` is the only thing that reaches the internet, and only when someone runs it.
- Agents report a session's totals, not each request's, so speck uses each entry's base rates. Entries also give higher rates above a context size (`*_above_272k_tokens`, `*_above_200k_tokens`) and for 1-hour cache writes (`cache_creation_input_token_cost_above_1hr`), so long-context work comes out a little low. Claude Code's own reported cost, used for Claude where it's given, isn't affected.
- The full list is about 3 MB with 4,324 entries; the shipped table needs only each entry's four base rates.
- Checked 2026-10-27: the URL above serves a JSON object of 4,324 entries. Each has `input_cost_per_token`, `output_cost_per_token`, `cache_read_input_token_cost` and, where the model has one, `cache_creation_input_token_cost`, in dollars per token (fetched live).
- Checked 2026-10-27: `claude-opus-5-5` is $4 input, $0.20 cached, $5 cache writes and $20 output per million tokens; `gpt-6.1-sol` is $2, $0.10, $2.50 and $10; `deepseek-v4-pro` is present; there's no bare `grok-4.7`, only `xai/grok-4.7` and other provider-prefixed copies (same fetch).
- Checked 2026-10-27: OpenRouter's `https://openrouter.ai/api/v1/models` has rates too, but with names such as `anthropic/claude-opus-5.5` that don't match what Claude Code and Codex print (fetched live).
- Checked 2026-10-27: `package.json` has only a `test` script, so `prices` is new.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
