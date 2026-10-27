---
id: "0527"
title: "Add up AI spend across tickets with speck spend"                # one outcome, no "and"
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
after: ["0526"]                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-27T12:57:10.753Z"

---
# 0527 · Add up AI spend across tickets with speck spend

**Status:** 🔍 reviewing

## Problem
There's no way to see what AI work has cost, per ticket or per week or month, without adding up each ticket's figures by hand.

## Outcome
`speck spend` prints what the project's tickets spent on AI, by ticket, model, week or month.

## Acceptance criteria
1. `speck spend` prints one line per ticket with recorded spend, giving its id, title, builder, reviewer and watch agent cost, its total cost and its total tokens, then a line of totals. An unknown cost prints as "unknown", never $0, and the totals line says how many tickets have a part with an unknown cost. With no recorded spend it prints one line saying so.
2. `--by=model` prints one line per model instead, across every build, review round and watch agent run counted: the model, its tokens split into uncached input, cached input, cache writes and output, and its cost, then the totals line. Spend whose model isn't known is grouped under "unknown model".
3. `--by=week` and `--by=month` print one line per week (Monday to Sunday, named by its Monday) or calendar month instead, with its cost and tokens, then the totals line. Each build, review round and watch agent run counts in the week or month it ended, in local time, so a ticket's spend can fall in two.
4. `--since=<YYYY-MM-DD>` and `--until=<YYYY-MM-DD>` count only spend that ended on or after, and on or before, those days, with any view. A date that isn't a real `YYYY-MM-DD` date, or a `--since` after the `--until`, is refused with a message saying why.
5. `--json` prints what the chosen view shows as JSON, every unknown cost as null, with a `totals` object. `docs/brief.md`'s command table lists `speck spend` with `--by`, `--since`, `--until` and `--json`.

## Out of scope
- Recovering spend from before this work: `speck spend --backfill` (0528).
- Spend from sessions speck didn't start, such as capturing ideas or drafting tickets.

## Notes
- Use the same per-ticket figures as `speck status --json` (0526's `total_cost_usd` and `total_tokens`), so the two never disagree.
- `--by=week`, `--by=month`, `--since` and `--until` need the time each part of the spend ended: a build's `exited` in its run record, a round's `saved_at`, and the times 0523, 0525 and 0528 keep.
- Failing before this build: none
- AC1, AC5 reading: a cost none of which is known is "unknown" (null in JSON). One that's partly known, such as a builder with one build priced and one not, shows the known part as "at least $X", as the panel already does (0526), and is a number in JSON with `cost_unknown: true`. So each ticket's total is the same `total_cost_usd` that `speck status --json` gives.
- A part with no end time, such as a build record with no `exited`, counts in the views without dates, falls under "unknown date" in `--by=week` and `--by=month`, and is left out once `--since` or `--until` is given.
- An old review round with no `model` counts under its `reviewer_model` when that names a model, or else under "unknown model".
- `speck.mjs` is at its 600-line limit, so `cmdPrices` and the new `cmdSpend` are imported through `core.mjs`, which frees the line that `speck spend`'s help needs.
- Self-check: no changes

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "3dc50c6a5382d9ffdd88606577a30a6512e90e3f",
    "session": "fresh",
    "thread_id": "01a17d76-5ff9-72f2-bd45-5e422fab06a3",
    "builder_response": "- Tests run: test/spend-0527.test.mjs, with `speck test --related`, which added every existing test file that names a file this branch changed (the commands.checks files run too).\n- Readings, also in the ticket's Notes: a cost none of which is known prints as \"unknown\" (null in JSON). A partly known one prints as \"at least $X\", as the panel's 0526 totals do, so each ticket's total stays the `total_cost_usd` that `speck status --json` gives (both now come from `spendParts` and `sumParts` in scripts/spend.mjs). A part with no end time falls under \"unknown date\" in the week and month views and is left out once a date filter is given.\n- scripts/speck.mjs was at its 600-line limit (test/split-0078), so `cmdPrices` and `cmdSpend` now come through core.mjs's re-exports.\n- No pictures: the change is a CLI command, with nothing new in the panel.\n",
    "seconds": 21,
    "usage": {
      "input_tokens": 140060,
      "cached_input_tokens": 88832,
      "cache_write_input_tokens": 0,
      "output_tokens": 940,
      "reasoning_output_tokens": 116
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 51228,
      "cached": 88832,
      "write": 0,
      "output": 940
    },
    "cost_usd": 0.1207392,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-27T13:04:53.417Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "spendReport and spendLines produce ticket rows and totals using the same sumParts calculation as status. The three AC1 tests passed."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "spendParts discards the available input/output breakdown for older review rounds recorded with meta.usage. The old-round AC2 test checks total tokens but misses the incorrect split columns."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "spendParts retains each part's end time; spendReport groups by local Monday or calendar month. Both AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "spendOptions validates dates and ordering; spendReport applies inclusive local-day filters before grouping. Both AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "cmdSpend serialises the report with null unknown costs and a totals object. The brief command table lists all required flags. Both AC5 tests passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/spend.mjs",
        "issue": "In spendParts, older review rounds with meta.usage but no meta.tokens receive models[0].tokens = null. Consequently, --by=model reports zero in every split column despite having recorded input and output counts. The existing fixture with input_tokens: 40 and output_tokens: 2 displays 42 total tokens but zero input and output. A read-only invocation confirmed that spendParts drops this breakdown.",
        "suggested_fix": "Derive the available token breakdown from legacy meta.usage when meta.tokens is absent, respecting the agent's usage format. Extend the old-round AC2 test to assert the split columns as well as total tokens.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The command covers ticket totals, date grouping, filtering and JSON output, and the reported tests passed. One correction is needed: the model view loses the recorded input/output breakdown for older review rounds, showing misleading zeroes."
  }
}
```

</details>
