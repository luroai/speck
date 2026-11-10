---
id: "0607"
title: "Space the Settings button evenly in the black bar"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T09:51:32.944Z"
approved: "2026-11-10T09:55:11.401Z"
finished: "2026-11-10T10:00:04.899Z"

---
# 0607 · Space the Settings button evenly in the black bar

**Status:** ✅ done

## Problem
Since the black bar grew taller (0604), the Settings button sits tight against the bar's right edge, with only a few pixels of black beside it, while it has plenty above and below. The face on the left has more room on its side. The bar looks lopsided.

## Outcome
The Settings button, and speck's face, sit in the black bar with the same space on every side.

## Acceptance criteria
1. The space between the Settings button and the bar's right edge equals the space above and below the button, to within 1 px, at 320 px and 1280 px wide.
2. The space between speck's face and the bar's left edge equals the space above and below the face, to within 1 px, at the same widths.
3. The button stays at least 44 px square, the face 56 px, and the bar's text keeps its three lines, without the bar growing taller.
4. A test checks both spacings in a real browser; no other test that passed before this change fails.

## Out of scope
- The bar's content and colours.

## Notes
- Asked for 2026-11-10: "the larger panel at the top has now meant that the border between the settings button and the right-hand side of the black panel is really thin. Can you just make it more equal?"
- Today in `templates/panel-header.css`: `.bezel` has `padding: 4px` and a 2 px border in the bar's colour, and `.bezel .settings-open` is 44 px with `margin: 0 -2px 0 0` (about line 64), so the button sits about 4 px from the right edge while the 56 px face makes the bar about 68 px tall, leaving about 12 px above and below the button.
- Relies on nothing outside this repo.
- Failing before this build: none
- 0604's real-browser test checked Settings sat within 4 px of the bar's old right edge less its 2 px border, the spacing this ticket changes: its assertion now checks Settings is as far from the right edge as from the top.
- Self-check: no changes

## In plain words
The Settings button in the black bar at the top of the panel now has the same room on its right as above and below it, instead of sitting tight against the bar's edge. speck's face on the left already had even room, and still does. Open the panel at any width to see it. The bar is no taller, and the status and project lines have a few pixels less width beside them, which still fits a 20-character project name on a phone.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 87,701
- Elapsed since build started: 4 min
- Changed lines: 5 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "36fb3fa7abe42ac1ab01b11c2e122b62c4ad09ed",
    "session": "fresh",
    "thread_id": "01a1c4e1-6b2c-7c11-8e1f-b288242ed81b",
    "builder_response": "- Tests run: `speck test --related test/panel-0607.test.mjs test/panel-0604.test.mjs` (the ticket's own file, 0604's file, which this change edits, and the three related files it brought in, with the checks).\n- The fix is one value: Settings' right margin goes from -2px to 6px, so it sits 12 px from the bar's right edge, the same as the 12 px above and below it. speck's face was already 6 px from the left, top and bottom (4 px padding plus the 2 px border), so AC2 needed no change; the new test checks both.\n- 0604's real-browser test asserted Settings sat within 4 px of the old position (bar.right - 2), the spacing this ticket changes on purpose. That one assertion now checks Settings is as far from the right edge as from the top; its other checks (20-character names in full at 320 px, status on one line, etc.) are unchanged and still pass with the 8 px narrower text column.\n- Pictures: the bar at 320 px, light and dark.\n",
    "seconds": 36,
    "usage": {
      "input_tokens": 87018,
      "cached_input_tokens": 64640,
      "cache_write_input_tokens": 0,
      "output_tokens": 683,
      "reasoning_output_tokens": 14
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 22378,
      "cached": 64640,
      "write": 0,
      "output": 683
    },
    "cost_usd": 0.05805,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T09:55:05.373Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-header.css sets Settings' right margin to 6px. The passing real-browser test in test/panel-0607.test.mjs compares right, top and bottom gaps within 1px at 320px and 1280px."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The same browser test measures the face's left, top and bottom gaps within 1px at both required widths."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "test/panel-0607.test.mjs checks Settings is at least 44px square, the face is 56px square, the bar remains at most 68px tall, and its three text lines remain separate. The existing 0604 browser test also passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "/tmp/speck-0607-tests.txt confirms the real-browser spacing test passed without being skipped: 137 tests passed, zero failed and three skipped. The updated 0604 assertion reflects the spacing intentionally changed by this ticket."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Settings now has equal space to its right, above and below. The face retains its equal spacing, and the bar keeps its height, button sizes and three text lines. Browser checks passed at both required widths, with no failures in the tests run. No blocking concerns found."
  }
}
```

</details>
