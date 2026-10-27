---
id: "0526"
title: "Show a ticket's total AI spend in the panel"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0525"]                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-27T12:35:45.082Z"
approved: "2026-10-27T12:52:58.518Z"
finished: "2026-10-27T12:56:54.968Z"

---
# 0526 · Show a ticket's total AI spend in the panel

**Status:** ✅ done

## Problem
The panel shows a shipped ticket's builder cost and its reviewer and builder tokens, but not what the ticket cost in all. Reviewer and watch agent spend (0529, 0525) never appear, so the figure you look at understates every ticket.

## Outcome
A shipped ticket in the panel shows its total AI cost: builder, reviewer and watch agent together.

## Acceptance criteria
1. `speck status --json` gives each ticket's `total_cost_usd`, the sum of its known `builder_cost_usd`, `reviewer_cost_usd` and `watch_cost_usd`, or null when none is known, and `total_tokens`, the sum of its builder, reviewer and watch agent tokens.
2. A shipped ticket's facts show `Reviewer cost` and `Total cost` beside `Builder cost`. One with no known cost shows "—".
3. When a ticket's total leaves out a part whose cost is unknown but has tokens, its `Total cost` shows the known sum preceded by "at least", and its tooltip names each part left out (for example "Reviewer cost unknown").
4. A shipped ticket's line shows its total cost where it shows its builder cost today.
5. The stats above Shipped add the total cost of the shipped tickets shown that have a known total, saying how many tickets it covers, beside the median builder cost.

## Out of scope
- A per-model or per-day breakdown: `speck spend` (0527).
- A separate `Watch cost` cell: watch runs are rare, so they count only in the total.

## Notes
- Facts are built in `shippedFacts` in `templates/panel.js`, the line near the `builderCost` use around line 1284, the stats in the Shipped header around line 1328, and the figures in `templates/panel-model.js` and `scripts/board-feed.mjs` (the Shipped cut-down keeps only what those use).
- Keep the panel's phone-width layout: the facts grid gains two cells.
- Failing before this build: none
- Read "the shipped tickets shown" in AC5 as the tickets the Shipped list shows (the latest ten, and any older one not pushed yet), not every shipped ticket: it keeps the figure to recent spend and short enough for the stats line at 420 px. The total joins that line after a comma ("…, $2.20, $4.41 total"), since a " · " separator and "in all" left too little room beside Fewer stats.
- Self-check: the Total cost tooltip with no known part now names the parts alone (it read "—: …"), and Reviewer cost also says "at least" when one of its rounds has tokens but no cost.

## In plain words
A shipped ticket in the panel now shows what it cost in all, not just what the builder cost. Open a shipped ticket and its table has two new boxes, Reviewer cost and Total cost, next to Builder cost. The line under a closed shipped ticket shows the total where it used to show the builder's cost, and the stats above the Shipped list add the total for the tickets that list shows, for example "$2.20, $4.41 total".

When part of a ticket's spend has no known price, such as a review by a model with no rates, the total says "at least $…", and hovering over it names the part left out. Older tickets shipped before costs were recorded show "—".

Worth keeping an eye on: the total above the list covers only the tickets the list shows (the latest ten), not every ticket ever shipped.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 totalSpent derives reviewer tokens from raw input_tokens and output_tokens.; F2 builderSpent and watchSpent sum known costs before totalSpent checks for unknown costs.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 537,081
- Elapsed since build started: 17 min
- Changed lines: 98 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Inbox: speck/ideas/2026-10-27-count-reviewer-tokens-as-each-round-saved-them.md (the existing Reviewer tokens figure reads raw usage, as review round 1's F1 found for the total).
- Known limit: the panel doesn't show `total_tokens` anywhere yet; only `speck status --json` gives it.
- Known limit: the total above Shipped covers the tickets the list shows (the latest ten and any older one not pushed), as the Notes explain; a total over every shipped ticket would need more room on the stats line.

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
    "reviewed_sha": "79ed375ab00015be8e481e4a8ce30e6a16066b15",
    "session": "fresh",
    "thread_id": "01a17d69-2c99-7fa3-b945-555a80a0ee0a",
    "builder_response": "- Tests run: test/total-cost-0526.test.mjs, the existing test files this ticket changed (test/build-log-0291.test.mjs test/panel-0134.test.mjs test/panel-0157.test.mjs test/panel-0178.test.mjs test/panel-0058.test.mjs test/panel-0140.test.mjs test/panel-0162.test.mjs test/panel-0188.test.mjs test/panel-0420.test.mjs test/panel-0246.test.mjs test/panel-0466.test.mjs test/panel-0411.test.mjs test/panel-0442.test.mjs test/panel-0465.test.mjs test/panel-0464.test.mjs test/panel.test.mjs test/spend-0120.test.mjs test/spend-0530.test.mjs test/spend-0523.test.mjs  ) and every related test file `speck test --related` chose.\n- Existing tests changed: the shipped facts table gains two cells (Reviewer cost, Total cost), the shipped line shows the total cost, and the stats line gains the total, so the tests that pinned the old six cells, the old line or the old stats text now include them. The 0464 and 0465 browser layout checks now find each cell's row as i - i % 3, since a shipped table has a third row.\n- AC5 reading: \"the shipped tickets shown\" is taken as the tickets the Shipped list shows (the latest ten, and any older one not pushed yet). See the ticket's Notes.\n- Visual change: four pictures kept with `speck picture` (Shipped lane closed and one card open, light and dark).\n",
    "seconds": 38,
    "usage": {
      "input_tokens": 197893,
      "cached_input_tokens": 142592,
      "cache_write_input_tokens": 0,
      "output_tokens": 1105,
      "reasoning_output_tokens": 61
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 55301,
      "cached": 142592,
      "write": 0,
      "output": 1105
    },
    "cost_usd": 0.1359112,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-27T12:50:44.845Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/spend.mjs totalSpent reads raw reviewer usage instead of the normalised meta.tokens saved by scripts/round-cost.mjs. Resumed Codex rounds are double-counted, Claude cache tokens are omitted, and Cursor tokens are ignored. The passing AC1 tests use only simple synthetic usage."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.js shippedFacts adds both cost cells and dashes; passing 0526 AC2 test exercises the rendered facts."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "The rendering tests pass, but totalSpent cannot detect unknown reviewer costs when usage uses Cursor's camelCase fields. It also loses unknown builder/watch runs when their aggregate already contains a known cost."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "render uses totalShown in the shipped line; passing 0526 AC4 test checks complete, partial and missing totals."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "panelModel sums known totals over shipped; passing AC5 tests verify the latest ten, the sum, coverage tooltip and no-known-total case."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/spend.mjs",
        "issue": "totalSpent derives reviewer tokens from raw input_tokens and output_tokens. Saved rounds already contain normalised meta.tokens, including cache usage and subtraction of previous Codex session usage. Reading raw usage produces incorrect totals and misses the unknown-cost warning for Cursor rounds.",
        "suggested_fix": "Sum the saved normalised reviewer token components, with an appropriate fallback for older rounds. Add tests covering resumed Codex rounds, Claude cache usage and Cursor rounds with unknown cost.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/spend.mjs",
        "issue": "builderSpent and watchSpent sum known costs before totalSpent checks for unknown costs. If one builder build or watch run has a known cost and another has tokens but unknown cost, the aggregate cost is non-null and the panel presents the incomplete total without 'at least' or the omitted-part tooltip.",
        "suggested_fix": "Carry an unknown-cost indicator from individual builder builds and watch runs into totalSpent. Test mixed known and unknown costs within each part.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The panel displays the new costs and recent-spend statistics correctly, but reviewer token totals can be wrong, and some incomplete costs appear complete. Fix the calculations and missing-cost tracking before merge."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "4efc65817d48b1f46d4de2559c045e21e2714daa",
    "session": "continued",
    "thread_id": "01a17d69-2c99-7fa3-b945-555a80a0ee0a",
    "builder_response": "- Tests run: test/build-log-0291.test.mjs test/panel-0134.test.mjs test/panel-0157.test.mjs test/panel-0178.test.mjs test/panel-0058.test.mjs test/panel-0140.test.mjs test/panel-0162.test.mjs test/panel-0188.test.mjs test/panel-0420.test.mjs test/panel-0246.test.mjs test/panel-0466.test.mjs test/panel-0411.test.mjs test/panel-0442.test.mjs test/panel-0465.test.mjs test/panel-0464.test.mjs test/panel.test.mjs test/spend-0120.test.mjs test/spend-0530.test.mjs test/spend-0523.test.mjs test/total-cost-0526.test.mjs  test/watch-spend-0525.test.mjs test/round-cost-0529.test.mjs\n- F1: fixed. scripts/spend.mjs roundSpent: a round's tokens are its saved meta.tokens (input, cached, write, output), so a resumed Codex round counts only its own and a Claude round's cache reads and writes count. A round saved before 0529, or with tokens saved as null, falls back to its usage, as input_tokens/output_tokens or Cursor's inputTokens/outputTokens, so a Cursor round with no cost is now left out and named. Tests: \"0526 AC1: a round's tokens are the ones it saved…\".\n- F2: fixed. totalSpent now takes the runs folder, the ticket id and its rounds, and reads each build (buildsOf: earlier builds and the latest, the same list builderSpent sums) and each watch agent run (watchOf: the same list watchSpent sums) one by one, so one build or run with tokens and no cost marks its part left out even when another's cost is known. builderSpent and watchSpent give the same results as before, now built on those helpers. Test: \"0526 AC1, AC3: a build or watch agent run with tokens but no cost leaves its part out…\".\n- docs/brief.md: says total_tokens counts each round's tokens as it saved them, and that total_cost_unknown names a part with any build, round or run lacking a cost.\n",
    "seconds": 21,
    "usage": {
      "input_tokens": 336228,
      "cached_input_tokens": 264448,
      "cache_write_input_tokens": 0,
      "output_tokens": 1855,
      "reasoning_output_tokens": 61
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 16479,
      "cached": 121856,
      "write": 0,
      "output": 750
    },
    "cost_usd": 0.0526436,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-27T12:52:38.827Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs statusData exposes totalSpent results. scripts/spend.mjs now sums individual builds, saved reviewer token components and individual watch runs. Passing 0526 AC1 tests cover sums, nulls, cached tokens, resumed rounds and status output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.js shippedFacts shows Reviewer cost and Total cost beside Builder cost, with dashes for unknown values. The 0526 AC2 rendering test passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "totalSpent detects unknown costs within individual builds, rounds and watch runs. totalCell displays 'at least' and names omitted parts. Passing AC3 tests cover partial costs and tooltips; the new mixed-run regression test covers F2."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.js render uses totalShown in the shipped line. The passing 0526 AC4 test checks complete, partial and absent totals."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "templates/panel-model.js sums known totals over the shipped list; panel.js places that sum beside median builder cost with coverage in its tooltip. Passing AC5 tests cover the latest ten, sum, coverage and absent totals."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/spend.mjs",
        "issue": "Reviewer token totals previously used raw usage, causing incorrect counts and missed unknown-cost warnings.",
        "suggested_fix": "Implemented: roundSpent uses saved normalised token components, with legacy usage fallback. Regression tests cover resumed Codex, Claude cache tokens and Cursor usage.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/spend.mjs",
        "issue": "Aggregated builder and watch costs previously concealed individual runs with unknown costs.",
        "suggested_fix": "Implemented: totalSpent examines individual builds and watch runs before aggregation. The mixed known/unknown cost regression test passed.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Both calculation problems are fixed. The panel now shows combined AI spend and clearly marks incomplete totals. All five criteria pass, and the reported test run has no failures."
  }
}
```

</details>
