---
id: "0526"
title: "Show a ticket's total AI spend in the panel"                # one outcome, no "and"
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
after: ["0525"]                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-27T12:35:45.082Z"

---
# 0526 · Show a ticket's total AI spend in the panel

**Status:** 🔍 reviewing

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
