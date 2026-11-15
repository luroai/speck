---
id: "0683"
title: "Fix the full suite failing on main at 4f384bd"                # one outcome, no "and"
status: blocked            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 0              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: fix                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T13:21:13.432Z"
blocked_at: "2026-11-15T13:23:57.121Z"

---
# 0683 · Fix the full suite failing on main at 4f384bd

**Status:** ⛔ blocked

## Problem
The full suite fails on main at commit 4f384bd (4f384bddf1e74d7dcaa2978a1f1912f7afb664e6). Failing tests:
- 0463 AC1: an open Plan ticket shows the grey track, then the table, under the title, and a queued Build ticket's full view shows its own
- 0463 AC2: the cells are Status, After, Lint, Priority, Level (0662), Size · risk and Type
- 0463 AC3: in a real browser at 320 and 390 px, open Plan tickets show the track and an even table, a long value cut short with …

## Outcome
The full suite passes on main again.

## Acceptance criteria
1. Each of these tests passes on main again: 0463 AC1: an open Plan ticket shows the grey track, then the table, under the title, and a queued Build ticket's full view shows its own, 0463 AC2: the cells are Status, After, Lint, Priority, Level (0662), Size · risk and Type, 0463 AC3: in a real browser at 320 and 390 px, open Plan tickets show the track and an even table, a long value cut short with ….
2. No test that passed before this change fails.

## Out of scope
- Changes the failing tests don't need.

## Notes
<!-- Constraints, links and decisions. Optional. -->
- Failing before this build: 0463 AC1, 0463 AC2 and 0463 AC3 (test/panel-0463.test.mjs), the tests this ticket fixes. The recorded full-suite output is cut short, so these were confirmed by running test/panel-0463.test.mjs, which fails only them.
- Cause: 0669 added a Builder fact to an open Plan ticket's facts, between Level and Size · risk, as its AC1 asks, so the table has eight cells. The 0463 tests still expected seven, with Size · risk and Type one place earlier. The fix updates those tests to the eighth cell; the panel itself is unchanged. No new test file: the ticket's criteria are the 0463 tests passing, and they check it.
- Self-check: no changes. No other test expects the seven-cell table; with eight cells no cell spans a row, and the browser test's spanning check still covers a last cell alone on its row.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
May this fix ticket change the three 0463 tests it names, even though the build rules say a test failing before a build is never fixed in it? The reviewer found the change itself correct (both criteria pass, including the real-browser check), but stopped on that rule. Options: (a) yes, a fix ticket may fix the tests it was made to fix, and the reviewer approves as is; (b) no, leave the tests alone and change the panel instead, dropping the Builder fact from an open Plan ticket's table, which undoes part of 0669. I recommend (a): the ticket exists only to make those tests pass, and the Builder fact is what 0669 asked for.
Recommended: Yes, a fix ticket may fix the tests it names
Other options: No, take the Builder fact out of an open Plan ticket's table instead
Changes what you'd notice: yes
Clear winner: yes

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · escalate</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "76a6ef1cb311da7e33ebdf7e7d92775de4b420cd",
    "session": "fresh",
    "thread_id": "01a1df60-6471-7b52-a368-a09aad798162",
    "builder_response": "- Tests run: test/panel-0463.test.mjs (with --related, which added the files it chose and the commands.checks files)\n- Cause: 0669 (4f384bd) added a Builder fact to an open Plan ticket's facts table, between Level and Size · risk, as 0669 AC1 asks. The table now has eight cells; the 0463 tests still expected seven, with Size · risk at index 5 and Type at index 6.\n- Fix: test/panel-0463.test.mjs only. AC1 expects eight cells; AC2 expects ['Builder', '–'] after Level for each draft (the fake board gives no build_with or builder, so the fact falls back to '–') and reads Type at index 7; the browser AC3 check reads the long risk at index 6. Test titles are unchanged so they match the ticket's AC1. No product code changed.\n- The real-browser 0463 AC3 test ran (Chromium found) and passes at 320 and 390 px, mouse and touch, so the eight-cell table is still even in a real browser.\n- Other tests naming Level/Size facts (0419, 0434, 0462, 0465, 0624) check the full view's facts, which 0669 didn't reorder, and they pass on main.\n",
    "seconds": 29,
    "usage": {
      "input_tokens": 128296,
      "cached_input_tokens": 88960,
      "cache_write_input_tokens": 0,
      "output_tokens": 720,
      "reasoning_output_tokens": 84
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 39336,
      "cached": 88960,
      "write": 0,
      "output": 720
    },
    "cost_usd": 0.094768,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T13:23:47.304Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "escalate",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/panel-0463.test.mjs updates the cell count and indices to match builderFact in templates/panel.js. /tmp/speck-0683-tests.txt records all three named tests passing, including the real-browser test without a skip."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The recorded run has 151 passes, zero failures and three skips. Only the obsolete expectations in panel-0463.test.mjs changed; product code is unchanged. The whole-suite shipping check remains pending."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0683-fix-the-full-suite-failing-on-main-at-4f384bd.md",
        "issue": "The review instructions prohibit fixing any test listed under 'Failing before this build', but this ticket explicitly requires fixing precisely those three listed tests. The change meets the ticket, yet violates that unconditional review rule.",
        "suggested_fix": "Confirm that this fix ticket is exempt from the prohibition on fixing listed pre-existing failures.",
        "state": "open"
      }
    ],
    "escalation_question": "May ticket 0683 fix the three pre-existing failures explicitly named in its acceptance criteria, despite the review rule prohibiting fixes to listed pre-existing failures?",
    "summary": "The test updates correctly account for the Builder field already added to the panel. All three targeted tests pass, including the browser layout check, and no technical defect was found. Approval needs a decision resolving the conflict between this fix ticket and the review scope rule."
  }
}
```

</details>
