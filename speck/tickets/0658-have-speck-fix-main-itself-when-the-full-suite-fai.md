---
id: "0658"
title: "Have speck fix main itself when the full suite fails"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0657"]                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T17:59:16.015Z"

---
# 0658 · Have speck fix main itself when the full suite fails

**Status:** 🔍 reviewing

## Problem
When the full suite fails on the base branch, speck counts it under Needs you with a row that reads "Full suite fails on main · a95b3c3 · 4 tests fail". You don't read code, so there's nothing you can do with it, and the fix is always the same: a fix ticket for the failing tests. On 2026-11-11 it sat under Needs you for over an hour, and the fix ticket speck did make stayed a draft.

## Outcome
With `watch: fix` or `decide`, speck raises and readies a fix ticket itself when the full suite fails on the base branch, and tells you in plain words; it reaches Needs you only when it can't.

## Acceptance criteria
1. With `watch: fix` or `decide`, when a full run on the base branch fails and no open fix ticket covers it, `speck run` makes one priority-0 fix ticket naming the failing tests and the commit, sets it ready and commits it, as a build does for a broken base branch.
2. While that fix ticket is open, the failing full suite doesn't count under Needs you, and Build's row for it reads in plain words, such as "Some of speck's own checks broke on main. I'm fixing it in <fix ticket>", with the ticket's id.
3. When the fix ticket is blocked or cancelled, or a fix has shipped and the next full run still fails, it counts under Needs you again, as today.
4. With `watch: tell` or `off`, nothing changes from today.
5. No test that passed before this change fails.

## Out of scope
- Fixing the tests without a ticket.

## Notes
- Asked for 2026-11-11, from the screenshot of the row: "No idea what this even means".
- A build that finds the base branch broken already makes a fix ticket and sets it ready (`/speck-build`, exit 14); the watch agent's `speck watch fix` makes only a draft.
- Full runs: `scripts/full-suite.mjs` (0630); the row: 0655.
- Failing before this build: none
- Self-check: no changes. Then, from the pictures, moved "I'm fixing it in <id>" onto the row's second line, as the title cut the id off at phone width.

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
    "reviewed_sha": "4438be5b7c59c798a57120f10d5d0d94cdb181f3",
    "session": "fresh",
    "thread_id": "01a1cbcb-5c7f-7990-b245-1ff670baa940",
    "builder_response": "- Tests run: `speck test --related test/full-fix-0658.test.mjs test/full-suite-0630.test.mjs` (the ticket's own test file, the existing 0630 file that brought a failure in on an earlier run, and every test file naming a changed file, with the commands.checks files): 1830 pass, 0 fail.\n- Notes for the reviewer:\n  - New module scripts/full-fix.mjs (fullFixQueue), called from fullSuiteQueue.check in scripts/full-suite.mjs. It keeps the fix ticket for the current failure in speck/.cache/full/fix.json until a full run passes, so it makes at most one per failure and doesn't make another once that one is blocked, cancelled or shipped without fixing it (AC3).\n  - It has its own small replaceSection and commits with plain git, as importing close.mjs loops back to full-suite.mjs through install.mjs.\n  - The ticket's wording avoids the string `test_full`: test/full-suite-0630.test.mjs checks that only full-suite.mjs, config.mjs and settings.mjs mention it.\n  - Panel: while the fix ticket is on its way, the row moves from Needs you to Building, with \"Some of the tests broke on main\" and \"I'm fixing it in <id> · <commit> · N tests fail\". The pictures (speck pack) show both looks.\n",
    "seconds": 40,
    "usage": {
      "input_tokens": 129948,
      "cached_input_tokens": 81280,
      "cache_write_input_tokens": 0,
      "output_tokens": 794,
      "reasoning_output_tokens": 148
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 48668,
      "cached": 81280,
      "write": 0,
      "output": 794
    },
    "cost_usd": 0.113404,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T18:08:24.449Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/full-fix.mjs: covers() accepts a ticket mentioning only one failing test. fullFixQueue.check() then makes no ticket for the remaining failures. The AC1 reuse test explicitly accepts this partial coverage."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "foremanView() excludes failures with fixing from Needs you; fullSuiteRow() and render() show the ticket id under Building. Both behaviours have passing AC2 tests."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "fullFixQueue.check() restores Needs you for blocked/cancelled tickets and failed runs containing the shipped fix. Passing AC3 tests exercise these transitions."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "fixActs() limits automation to fix/decide. The passing AC4 test exercises tell, off and unset."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reported relevant test run: 1830 passed, zero failed, three skipped. No unrelated changes or weakened existing tests found."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/full-fix.mjs",
        "issue": "covers() uses some(), so an existing fix ticket for widgets alone is treated as covering a full run where both widgets and gadgets fail. No ticket addresses gadgets, yet the entire failure disappears from Needs you. The reuse test currently endorses this behaviour by mentioning only TESTS[0].",
        "suggested_fix": "Require coverage of all failing tests before treating an existing ticket as covering the failure, or explicitly arrange coverage for the remaining failures. Update the reuse test and add a partial-coverage regression case.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The automatic fix ticket and status display work in the tested lifecycle. However, speck can hide failures that its chosen ticket does not cover. Fix the coverage check before merging."
  }
}
```

</details>
