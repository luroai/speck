---
id: "0735"
title: "Fix the full suite failing on main at 38407ee"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
created: 2026-11-24
started: "2026-11-24T14:04:35.663Z"
approved: "2026-11-24T14:22:08.662Z"

---
# 0735 · Fix the full suite failing on main at 38407ee

**Status:** 👍 approved

## Problem
The full suite fails on main at commit 38407ee (38407eea5126d9502f5230cf95f96f320efed8c7). Failing tests:
- 0469 AC1, AC2: at 390 px, the header, tabs and every card and row, closed and open, are laid out the same with a mouse as on a touch screen, in the same font sizes
- 0469 AC1, AC2: at 600 px, the header, tabs and every card and row, closed and open, are laid out the same with a mouse as on a touch screen, in the same font sizes

## Outcome
The full suite passes on main again.

## Acceptance criteria
1. Each of these tests passes on main again: 0469 AC1, AC2: at 390 px, the header, tabs and every card and row, closed and open, are laid out the same with a mouse as on a touch screen, in the same font sizes, 0469 AC1, AC2: at 600 px, the header, tabs and every card and row, closed and open, are laid out the same with a mouse as on a touch screen, in the same font sizes.
2. No test that passed before this change fails.

## Out of scope
- Changes the failing tests don't need.

## Notes
<!-- Constraints, links and decisions. Optional. -->
- Failing before this build: none (the recorded result is the quick suite's, which passed; the full suite's failures are the two 0469 AC1, AC2 tests this ticket names)

## In plain words
The full test suite passes on main again. The ticket numbers in a Plan card's chain now take up the same room with a mouse as on a touch screen, so the card looks the same either way; with a mouse they sit slightly further apart than before. Open a Plan card that waits on another ticket to see it.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 128,763
- Elapsed since build started: 18 min
- Changed lines: 1 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (Delivery log only): `speck test --related` on a change to a panel stylesheet picks nearly every test file through test/support/panel.mjs and can't finish within a 10-minute shell limit; house-rules-full-0657 AC3 timed out starting a panel under load in a 25-file run and passed alone. No inbox note: the --related one matches speck/ideas/done/2026-10-23-keep-related-tests-from-picking-the-whole-suite.md, and the timeout under load matches speck/ideas/done/2026-10-26-steady-two-browser-tests-under-a-busy-run.md.

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
    "reviewed_sha": "7b5189477a3306054363c4af00352b4c0eefd157",
    "session": "fresh",
    "thread_id": "01a20def-0b46-75b2-a5a5-025f535d44c8",
    "builder_response": "Round 1, type: fix ticket.\n- Tests run: test/house-rules-full-0657.test.mjs test/panel-0041.test.mjs test/panel-0154.test.mjs test/panel-0417.test.mjs test/panel-0420.test.mjs test/panel-0455.test.mjs test/panel-0454.test.mjs test/panel-0463.test.mjs test/panel-0421.test.mjs test/panel-0469.test.mjs test/panel-0467.test.mjs test/panel-0434.test.mjs test/panel-0468.test.mjs test/panel-0472.test.mjs test/panel-0494.test.mjs test/panel-0480.test.mjs test/panel-0613.test.mjs test/panel-0435.test.mjs test/panel-0624.test.mjs test/panel-0703.test.mjs test/panel-0603.test.mjs test/panel-0701.test.mjs test/panel-0615.test.mjs test/pipeline-0459.test.mjs test/panel-0419.test.mjs (then test/house-rules-full-0657.test.mjs alone)\n\nCause: 0703 (d8b9774c) changed the touch-screen rule in templates/panel-popups.css from `#full-ticket .chain-facts button.chain-id` to `.chain-facts button.chain-id { min-width: 44px; min-height: 44px; }`, so on a Plan card in the lanes a chain id is 44 px wide on a touch screen but only its text width (28 px) with a mouse. 0469's browser tests require the cards to lay out the same with both pointers, so they failed at 390 and 600 px.\n\nFix (one line, templates/panel-cards.css): `.chain-facts button.chain-id { min-width: 44px; }` in the cards' rules for every pointer, as 0469 does for the other controls there (0417: every control at least 44 px each way). Kept as its own rule so 0154's exact match on the min-height rule is unchanged.\n\nNo new test: AC1's tests are the two 0469 browser tests themselves; they now pass.\n\nTests run: `speck test --files` with the 25 test files that mention chain-id, chain-facts, min-width, pointer: coarse or panel-cards (list at the top of the output): 321 pass, 1 fail, 3 skipped/todo. The one failure, house-rules-full-0657 AC3, runs a whole quick suite inside a copy and failed under load in that combined run (an extra test in its inner run failed); run alone with `speck test --files test/house-rules-full-0657.test.mjs` it passes (144 pass, 0 fail). `--related` was tried first but chose nearly every test file through test/support/panel.mjs and didn't finish within the shell's 10-minute limit.\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 128217,
      "cached_input_tokens": 103552,
      "cache_write_input_tokens": 0,
      "output_tokens": 546,
      "reasoning_output_tokens": 14
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 24665,
      "cached": 103552,
      "write": 0,
      "output": 546
    },
    "cost_usd": 0.0651452,
    "tests": {
      "failing": 1,
      "second_try": []
    },
    "saved_at": "2026-11-24T14:22:00.796Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-cards.css:448 gives chain-id buttons the same 44 px minimum width for both pointers. The unchanged browser tests in test/panel-0469.test.mjs compare actual element geometry and font styles; both 390 px and 600 px cases passed in /tmp/speck-0735-tests.txt."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The selected regression run passed 321 tests. Its sole failure was a panel-start timeout inside house-rules-full-0657; that file passed when rerun alone (144 passed, zero failed). No tests were changed. The one-line CSS correction matches the existing touch rule; the whole-suite check remains enforced at ship."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Chain links on Plan cards now have the same width with a mouse as on a touch screen. Both failing layout tests pass, and no tests were weakened. One timeout in the broader test run cleared on rerun. The change is ready for merge consideration."
  }
}
```

</details>
