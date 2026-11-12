---
id: "0663"
title: "Fix the full suite failing on main at 0352dcf"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
created: 2026-11-12
started: "2026-11-12T12:42:26.455Z"
approved: "2026-11-12T12:45:11.149Z"
finished: "2026-11-12T12:51:14.502Z"

---
# 0663 · Fix the full suite failing on main at 0352dcf

**Status:** ✅ done

## Problem
The full suite fails on main at commit 0352dcf (0352dcf8e6951e830369417c1b021781aa9e12ca). Failing tests:
- 0277 AC1–AC5: at every width, info buttons line up, sit clear of the values, match the controls, and names wrap only at _ or .

## Outcome
The full suite passes on main again.

## Acceptance criteria
1. Each of these tests passes on main again: 0277 AC1–AC5: at every width, info buttons line up, sit clear of the values, match the controls, and names wrap only at _ or ..
2. No test that passed before this change fails.

## Out of scope
- Changes the failing tests don't need.

## Notes
<!-- Constraints, links and decisions. Optional. -->
Failing before this build: 0182 AC3: Chromium has closed within 10 s of a test file finishing that ran out of time under --test-timeout; 0277 AC1–AC5 (this ticket's own target, so it is the one fixed here)
Cause: 0661 added the build levels to the team section, which made the Settings view taller than the test's 2400 px window at 320 px. The Shipping group's info buttons then sat below the window, where `elementFromPoint` finds nothing, so the 24 by 24 px target check failed. The layout itself is unchanged and fine; the test now scrolls each row into view before hit-testing it.
Self-check: no changes
Pictures: none, because nothing anyone sees changes (only a test changed)

## In plain words
Nothing changes in the panel. The check that the Settings view's info buttons are easy to tap had started failing, not because the buttons were wrong, but because the view had grown longer than the test's pretend screen, so the test couldn't reach the buttons at the bottom. The test now scrolls to each setting before checking it. One other, unrelated test also failed on main at the same time; it's saved as a separate idea to look into.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 113,839
- Elapsed since build started: 3 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- 0182 AC3 also failed in the same full-suite run on main; it was failing before this build and left alone. Saved to the inbox as speck/ideas/2026-11-12-fix-0182-ac3-failing-in-the-full-suite.md.

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
    "reviewed_sha": "4d10d420937f79880b298dce678e3223791b29eb",
    "session": "fresh",
    "thread_id": "01a1cfc9-ca63-7e50-81bf-06dda6d928a0",
    "builder_response": "- Tests run: test/panel-0277.test.mjs (with `speck test --related`, which added no other files; the `commands.checks` files ran in the same run)\n- Cause: 0661 put the build levels on the team section of Settings, so at 320 px the view is now taller than the test's 2400 px window. The Shipping group's info buttons sat at y ≈ 2535 px, where `document.elementFromPoint` returns null, so the 24 by 24 px target check failed although the layout was fine (every other check on the same rows passed).\n- Fix: the test scrolls each row's info button into view (`scrollIntoView({ block: 'center' })`) before measuring and hit-testing it. No assertion was loosened; horizontal positions are unaffected by vertical scrolling, and each row's measurements are all taken after its own scroll.\n- 0182 AC3 also failed in the recorded full-suite run on main; it's unrelated to this ticket and is listed as failing before this build, so it's left alone.\n",
    "seconds": 26,
    "usage": {
      "input_tokens": 113423,
      "cached_input_tokens": 80128,
      "cache_write_input_tokens": 0,
      "output_tokens": 416,
      "reasoning_output_tokens": 12
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 33295,
      "cached": 80128,
      "write": 0,
      "output": 416
    },
    "cost_usd": 0.0787628,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-12T12:44:56.340Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/panel-0277.test.mjs: MEASURE scrolls each info button into view before measuring and hit-testing. All existing alignment, spacing, target-size and wrapping assertions remain. The recorded output confirms 0277 AC1–AC5 passed without skipping."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The recorded targeted run passed 144 tests with zero failures and three skips. The diff changes only the affected test's measurement preparation and ticket records; production behaviour is unchanged. Whole-suite regression checking remains the ship gate."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The fix brings each settings row into view before checking its button, so rows below the window can be tested correctly. The original checks remain intact and the affected test passes. No blocking concerns found."
  }
}
```

</details>
