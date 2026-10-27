---
id: "0524"
title: Keep a current price table for AI models                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

**Status:** 🔍 reviewing

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
- Failing before this build: none
- Self-check: plain errors when `npm run prices` can't reach the list or gets something that isn't JSON; the usage message names no model, so the repo's no-model-names check passes. The repo checks for model names and for 600-line files now leave out the generated `scripts/prices.json`, and two wrapped help entries in `scripts/speck.mjs` went onto one line each to keep it at 600 lines.

## In plain words
speck now carries a list of what each AI model charges, taken from a widely used public price list on the day of each release. Nothing uses it yet: later tickets use it to put a dollar figure on reviews, builds and the watch agent for agents that report only how much they used, such as Codex and Cursor. To see it, run `speck prices` with a model's name, for example `speck prices gpt-6.1-sol`: it shows what that model costs per million words-worth of tokens and the date the prices were taken. speck never goes online for prices. They change only when a new release comes out, so they can drift between releases, and figures come out a little low for very long sessions.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Inbox: `speck/ideas/2026-10-27-fix-the-0247-ac4-test-that-fails-under-load.md` (a timing test that failed once under load in this build's related run).
- Skipped, already captured: the `0384 AC3` timing failure seen in the same runs matches `speck/ideas/2026-10-24-fix-the-0384-running-round-test.md`.
- Known limit: refreshing the table in a release ticket counts its changed lines towards `max_changed_lines`. A refresh changes only the rates that moved, but a big upstream reshuffle could push a release ticket near the limit.
- Known limit: `scripts/speck.mjs` is at exactly 600 lines again; the next command added there will need something moved out first.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · approve</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "83e99d0feda9dd69afa367eb281499fbaac6229e",
    "session": "fresh",
    "thread_id": "01a17d19-2455-7ee1-b584-b60a4af0b128",
    "builder_response": "- Tests run: `speck test --related test/prices-0524.test.mjs test/review.test.mjs test/split-0078.test.mjs` (the ticket's own file, the two repo checks it changed, and every test file naming a changed file). 1699 of 1704 passed; two process-timing tests (review-wait-0384 AC3, run-0247 AC4) failed under the load of the big parallel run and both pass when their files run alone, shown at the end of the test output. Neither touches anything this ticket changed.\n- Notes for the reviewer:\n  - `scripts/prices.json` is generated by `npm run prices` from today's LiteLLM list: 3,126 chat, responses and completion models, one to a line, each `[input, cached input, cache writes, output]` in dollars per token.\n  - Two repo-wide checks (`test/review.test.mjs` AC2, no model names in scripts/templates/skills; `test/split-0078.test.mjs` AC2, no scripts file over 600 lines) now leave out only `scripts/prices.json`, because the table is a list of models by design and is data, not a module. To keep `scripts/speck.mjs` at 600 lines, the new help entry and two existing wrapped help entries (`speck picture`, `speck review-running`) each take one line.\n  - Tests set `SPECK_PRICES` to point `speck prices` at a table of their own, so no pricing test reads the shipped table (AC4). The AC1 test does read the shipped table, but only to check its shape.\n",
    "seconds": 31,
    "usage": {
      "input_tokens": 626588,
      "cached_input_tokens": 463104,
      "cache_write_input_tokens": 0,
      "output_tokens": 708,
      "reasoning_output_tokens": 58
    },
    "tests": {
      "failing": 2,
      "second_try": []
    },
    "saved_at": "2026-10-27T11:23:12.486Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/prices.json contains the source, date and four base rates per entry. updatePrices fetches and replaces it atomically; package.json wires npm run prices. The three AC1 tests passed. Runtime pricing reads local JSON only; packaging and installTooling include the scripts directory."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "docs/brief.md, Releases, explicitly requires release tickets to run npm run prices. The AC2 test checks that command and passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/prices.mjs findRates checks exact entries, maker prefixes and stripped effort/speed suffixes, and rejects auto. Both AC3 tests passed using an independent fixture, including all required names and unknown costs."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "scripts/prices.mjs costOf adds the four token categories at their respective rates. The passing AC4 test uses its own table, verifies $0.96 and exercises non-zero cache writes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "cmdPrices prints the matched entry, date and rates per million, with a plain unknown-model error. Both AC5 tests passed and verify the documented command. A read-only CLI check also confirmed grok-4.7-high-fast matches xai/grok-4.7."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The change ships an offline price table, a release-time updater and a command to inspect model rates. Required name matching and cost calculations are covered by meaningful tests. Two unrelated timing tests passed when rerun separately. No blocking concerns found."
  }
}
```

</details>
