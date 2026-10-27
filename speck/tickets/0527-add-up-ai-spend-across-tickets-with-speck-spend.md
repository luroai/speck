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
There's a new command, `speck spend`, that adds up what your tickets have cost in AI. By default it lists each ticket that spent anything, with what its builder, reviewer and watch agent cost, its total and its tokens, then a line of totals. You can ask for the same spend by model, by week or by month instead, narrow it to a range of days, or get it as JSON.

To see it, run `speck spend` in a project that has built a few tickets, then try `speck spend --by=week`. A cost speck couldn't price shows as "unknown" rather than $0. A total that leaves some of it out says "at least", as the panel does.

Worth keeping an eye on: older tickets built before speck recorded models show under "unknown model". For older review rounds, the totals now count their cached tokens too, so a few older tickets' token totals in the panel are a little higher than before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none sent to the inbox.
- Known limit: a build record from before 0530 kept no models, so its tokens count under "unknown model" in `--by=model`'s Tokens column, with nothing in the four split columns. Recovering older spend is 0528's `--backfill`.
- Behaviour change from review round 2: a review round saved before 0529 now counts its usage's cache reads and cache writes in `total_tokens` too, in `speck status --json` as well as `speck spend`, so the two agree.

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

<details><summary>Round 2 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "62557dedbdceebc17506443ee53780fc39964cdf",
    "session": "continued",
    "thread_id": "01a17d76-5ff9-72f2-bd45-5e422fab06a3",
    "builder_response": "- Tests run: test/spend-0527.test.mjs test/total-cost-0526.test.mjs (the commands.checks files run too).\n- F1: fixed. `usageSplit` in scripts/spend.mjs splits an older round's `meta.usage` when it has no `meta.tokens`. Codex's `input_tokens` and Cursor's `inputTokens` include the cached input, so that comes out of them as cached input. Claude Code's `input_tokens` leave the cache out. Either way the split adds up to the input plus output that `roundSpent` counts, so `speck status` and `speck spend` still agree. The old-round AC2 test now checks the split columns, and a new AC2 test covers each reviewer's usage shape and the totals agreeing.\n",
    "seconds": 14,
    "usage": {
      "input_tokens": 252675,
      "cached_input_tokens": 194176,
      "cache_write_input_tokens": 0,
      "output_tokens": 1663,
      "reasoning_output_tokens": 190
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 7271,
      "cached": 105344,
      "write": 0,
      "output": 723
    },
    "cost_usd": 0.0323064,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-27T13:05:51.394Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "spendReport and spendLines produce ticket costs, tokens and totals through the shared spendParts/sumParts calculation. All three AC1 tests passed."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "usageSplit now preserves legacy input/output and inclusive cached input, but drops Claude's cache_read_input_tokens and every agent's cache writes. The new AC2 test explicitly expects zero cached tokens despite recording 4,000."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "spendParts retains individual end times and spendReport groups them by local Monday or calendar month. Both AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "spendOptions validates real dates and their ordering; spendReport filters inclusively before grouping. Both AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "cmdSpend serialises the selected report with null unknown costs and totals. The brief command table includes all required flags. Both AC5 tests passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/spend.mjs",
        "issue": "The legacy token breakdown fix remains incomplete. usageSplit ignores Claude's cache_read_input_tokens and hard-codes write: 0 for every agent. Recorded cache reads and writes therefore appear as zero in --by=model. The new test enshrines this error: its Claude fixture records 4,000 cached tokens but expects cached: 0. Preserving the previous legacy total calculation does not satisfy AC2's required breakdown.",
        "suggested_fix": "Preserve all available legacy token categories using the agent's usage shape, including Claude cache reads and each agent's cache writes. Update the shared legacy total calculation consistently so status and spend still agree. Correct the Claude assertion and add non-zero cache-write fixtures.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Ticket totals, date grouping, filtering and JSON output remain covered by passing tests. The model breakdown still hides recorded cache usage in older review rounds, so the previous finding needs another fix."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "79df99a8d0ba97d688834f087d83e89a3ffbdd49",
    "session": "continued",
    "thread_id": "01a17d76-5ff9-72f2-bd45-5e422fab06a3",
    "builder_response": "- Tests run: test/spend-0527.test.mjs test/total-cost-0526.test.mjs (the commands.checks files run too).\n- F1: fixed. `roundSplit` in scripts/spend.mjs splits an older round's `meta.usage` with `roundTokens` (round-cost.mjs), shaped by its reviewer: Codex (its `reviewer` is codex, or its usage has `cached_input_tokens`), Cursor or Claude Code. Cache reads and cache writes are both kept. A usage it can't split, such as cached input larger than the input, falls back to input and output. `roundSpent`, which `speck status`'s `total_tokens` uses, now counts the same split, so the two still agree. The AC2 test now has non-zero cache writes for all three shapes and Claude's 4,000 cache reads. It also checks that `speck status --json`'s `total_tokens` equals `speck spend`'s.\n",
    "seconds": 10,
    "usage": {
      "input_tokens": 378546,
      "cached_input_tokens": 314112,
      "cache_write_input_tokens": 0,
      "output_tokens": 2235,
      "reasoning_output_tokens": 190
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 5935,
      "cached": 119936,
      "write": 0,
      "output": 572
    },
    "cost_usd": 0.0295836,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-27T13:07:01.773Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "spendReport and spendLines provide ticket rows, component costs, tokens and totals, including unknown costs and the empty state. The AC1 tests passed; status and spend share spendParts/sumParts."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Model grouping sums split tokens and costs across spend parts. roundSplit now uses roundTokens to retain legacy cache reads and writes. Passing AC2 tests cover all three agent usage shapes, unknown models and legacy reviewer_model fallback."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "spendParts preserves individual end times; spendReport groups by local Monday or calendar month. Both AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "spendOptions validates dates and ordering; spendReport applies inclusive day filters before grouping. Both AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "cmdSpend serialises the selected report with null unknown costs and a totals object. The brief command table lists all required flags. Both AC5 tests passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/spend.mjs",
        "issue": "Legacy review rounds previously lost their recorded token breakdown, including cache reads and writes. The current roundSplit implementation preserves these categories and roundSpent uses the same calculation.",
        "suggested_fix": "Completed. Regression tests now assert non-zero cache writes for all three agent formats, Claude cache reads, and agreement with status totals.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The command reports AI spend by ticket, model, week or month, with date filters and JSON output. The legacy token breakdown issue is fixed, all criteria pass, and no blocking concerns remain."
  }
}
```

</details>
