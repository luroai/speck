---
id: "0246"
title: "Make the 0178 AC3 board test pass whatever second it runs in"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-15-fix-the-0178-ac3-test-that-fails-by-chance.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-16T08:07:26.319Z"
approved: "2026-10-16T08:09:49.191Z"
finished: "2026-10-16T08:11:39.806Z"

---
# 0246 · Make the 0178 AC3 board test pass whatever second it runs in

**Status:** ✅ done

## Problem
"0178 AC3: the panel works out the same queue, Plan, Shipped list and figures from the cut-down board" sometimes fails by chance: it works out the panel's model from two boards one after the other, and a live elapsed-time counter can tick over a second between them (`6013:28` against `6013:29`). Each such failure costs a second test run, shows in the flaky log and can hand an approved ticket back.

## Outcome
The test gives the same result whichever second it runs in.

## Acceptance criteria
1. The test passes even when a second passes between working out its two models: shown by working them out with the page's clock a second apart.
2. It still fails when the cut-down board gives the panel a different queue, Plan, Shipped list or figures than the whole board does: shown by a check that a board cut wrongly (for example with one finished ticket left out) doesn't compare equal.
3. No test that passed before this change fails. No code outside `test/` changes.

## Out of scope
- The other tests that fail by chance (0207 fixed four).
- Any change to the panel or to how the board is cut down.

## Notes
- The test is in `test/panel-0178.test.mjs`; `panelModel()` is in `test/support/panel.mjs`.
- Seen in 0211's whole-suite run on 2026-10-15, passing when run again.
- Relies on nothing outside this repo.
- Failing before this build: none
- AC3 has no test of its own: the diff touches only `test/` (and this ticket), and `speck ship` runs the whole suite.
- Self-check: the 0246 tests use the support module's stopped clock instead of a copy of it.

## In plain words
Nothing changes in the product. One check in speck's own tests sometimes failed by chance, when the clock ticked over a second while it ran; it now compares both views at the same moment, so it gives the same result every time. It still catches a board that leaves out a finished ticket. Keep an eye on the flaky log: this check should stop appearing there.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 85,415
- Elapsed since build started: 2 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups: none.

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
    "reviewed_sha": "deb14f5a3390f408807d4ffb52fa140e1357a14b",
    "thread_id": "01a143c2-175a-7f02-b293-d348349fdd72",
    "seconds": 26,
    "usage": {
      "input_tokens": 84889,
      "cached_input_tokens": 51328,
      "cache_write_input_tokens": 0,
      "output_tokens": 526,
      "reasoning_output_tokens": 17
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-16T08:09:41.549Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/support/panel.mjs modelsAtOneMoment() reads the clock once and freezes Date for both models. The passing 0246 AC1 test demonstrates the original difference with clocks one second apart, then verifies equality using the shared frozen clock."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing 0246 AC2 test removes each of two finished tickets and verifies that the resulting models differ, while a correctly cut board compares equal. The original 0178 AC3 still compares the complete models."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The full supplied test log records all nine tests passing across panel-0178.test.mjs and panel-0246.test.mjs. The verified diff changes only test files and the ticket. Default panelModel() behaviour remains unchanged; the whole-suite check remains speck ship's gate."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The board comparison now uses one fixed moment, preventing elapsed-time counters from causing random failures. It still detects incorrectly cut boards. All nine targeted tests passed, and no production code changed."
  }
}
```

</details>
