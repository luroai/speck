---
id: "0671"
title: "Fix the full suite failing on main at 46099bc"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
started: "2026-11-15T12:58:45.154Z"
blocked_at: ""
waited_seconds: 11

---
# 0671 · Fix the full suite failing on main at 46099bc

**Status:** 🔨 building

## Problem
The full suite fails on main at commit 46099bc (46099bc80d7e377f1c975967f91fb669336f41d2). Failing tests:
- 0643 AC1: speck agents opens Cursor with no prompt, shows /usage and closes it, and lists the plan, reset, rows and on-demand

## Outcome
The full suite passes on main again.

## Acceptance criteria
1. Each of these tests passes on main again: 0643 AC1: speck agents opens Cursor with no prompt, shows /usage and closes it, and lists the plan, reset, rows and on-demand.
2. No test that passed before this change fails.

## Out of scope
- Changes the failing tests don't need.

## Notes
<!-- Constraints, links and decisions. Optional. -->
Failing before this build: 0643 AC1: speck agents opens Cursor with no prompt, shows /usage and closes it, and lists the plan, reset, rows and on-demand. This fix ticket exists to make it pass, so it's the one test this build changes.
The cause: the test runs `speck agents` with the real clock, and its stand-in screen said `Resets 12 Nov` with no year. Since 12 November 2026 passed, speck rightly reads that as 2027-11-12. The fix is in the test only: the stand-in screen now shows tomorrow's day, and the test expects that date. No new test file: AC1 is the existing test, and AC2 is the full suite at ship.
Self-check: no changes (checked month names such as `Sept`, and a run crossing midnight).
- Went with the recommendation: yes, fix tickets may fix the tests they name (chosen by speck, as watch is decide, 2026-11-15 13:01 UTC).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
The reviewer found the fix correct (both criteria pass) but stopped on a rule clash: builds may never fix a test listed as failing before the build, yet this fix ticket exists to fix exactly that test. Should this fix ticket be allowed to fix the test it was made for? Options: (a) yes, fix tickets may fix the failing tests they name, so resume and let the reviewer approve; (b) no, leave the test broken and cancel this ticket. I recommend (a): the fix only changes the test's stand-in screen to show tomorrow's reset day instead of 12 November, which has now passed, and the rule is there to stop builds wandering into unrelated failures, not to stop a fix ticket. The builder and review instructions should probably say this, as a follow-up.
Recommended: yes, fix tickets may fix the tests they name
Other options: no, cancel the ticket and leave the test failing
Changes what you'd notice: no
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
    "reviewed_sha": "dddc6d706194fc7773a5119d31ca7cba44d60116",
    "session": "fresh",
    "thread_id": "01a1df4b-503a-76c0-ada0-7a54bf45fd72",
    "builder_response": "- Tests run: test/cursor-usage-0643.test.mjs test/run-cursor-0290.test.mjs (via `speck test --related`, which also ran the repo's checks)\n- Cause: the failing test runs `speck agents` with the real clock, and its stand-in screen said `Resets 12 Nov` with no year. Since 12 November 2026 passed, the parser (correctly, as its own unit test with a fixed clock shows) reads it as 2027-11-12. The fix changes only the test: the stand-in screen shows tomorrow's day (UTC, as the parser uses) and the test expects that date. No production code changed.\n",
    "seconds": 27,
    "usage": {
      "input_tokens": 80973,
      "cached_input_tokens": 48640,
      "cache_write_input_tokens": 0,
      "output_tokens": 673,
      "reasoning_output_tokens": 100
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 32333,
      "cached": 48640,
      "write": 0,
      "output": 673
    },
    "cost_usd": 0.07626,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T13:00:44.087Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "escalate",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/cursor-usage-0643.test.mjs uses tomorrow's UTC date for the screen and expected output, retaining the process and usage assertions. /tmp/speck-0671-tests.txt reports this exact test passing."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The reported run has 170 passes, zero failures and three skips. The diff changes only the affected test and ticket metadata/notes; production code is unchanged. The whole-suite check remains for ship."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0671-fix-the-full-suite-failing-on-main-at-46099bc.md",
        "issue": "The review instructions explicitly prohibit fixing any test listed under 'Failing before this build', while this ticket explicitly requires fixing that listed test. The implementation meets the ticket, but these scope instructions conflict.",
        "suggested_fix": "Confirm that this fix ticket is exempt from the prohibition on fixing listed pre-existing failures.",
        "state": "open"
      }
    ],
    "escalation_question": "May ticket 0671 fix the explicitly listed pre-existing failure, as its acceptance criterion requires, despite the review prompt's prohibition?",
    "summary": "The test now uses tomorrow's date instead of a fixed date that expired. Its original checks remain intact, and the reported tests pass. Approval needs resolution of a conflict between the ticket's purpose and the review scope rule."
  }
}
```

</details>
