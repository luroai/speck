---
id: "0374"
title: "Slow the Foreman's notice board"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: cursor
reviewer_model: grok-4.7-high       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-give-the-header-s-notice-board-more-room.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T19:40:00.584Z"
approved: "2026-10-22T20:00:16.945Z"

---
# 0374 · Slow the Foreman's notice board

**Status:** 👍 approved

## Problem
When the Foreman's notice board has more text than fits, it scrolls at about 30 dots a second. That is too fast to read.

## Outcome
Text that doesn't fit the board scrolls slowly enough to read.

## Acceptance criteria
1. When the board's text is wider than the board, it scrolls from right to left at about 10 dots a second, a third of the 30 it uses today. It still loops, with the same gap between its end and its start.
2. Text that fits stays still. With `prefers-reduced-motion: reduce`, it never scrolls and shows the Foreman's word alone. A refresh with the same text carries on without a jump, and new text starts again from the right-hand edge.
3. The board's words, its colour, its tooltip, what pressing it does and its accessible name are unchanged.
4. No test that passed before this change fails, except the check that the board scrolls at 30 dots a second, which is changed to check criterion 1.

## Out of scope
- What the board says, and opening the Foreman's detail: 0365 and 0366.
- The header's title and the light/dark button: 0373 and 0372.

## Notes
- Checked 2026-10-22: `BOARD.speed` in `templates/panel.html` is 30, and 0365's criterion 3 says about 30 dots a second. `test/panel-0365.test.mjs` asserts 30 dots in a second.
- 10 dots a second is the slower pace asked for as "slower".
- It does not wait on the Settings or header tickets. 0375 still waits for it, so 0.13.0 includes the slower board.
- Failing before this build: none
- 0365's speed check now checks 10 dots a second. Its narrow-screen and refresh tests wait three times as long between frames, so the dots they count stay as they were. The board's test helpers moved to `test/support/board.mjs`, shared by both files.
- Self-check: no changes
- Pictures: none, because the board looks the same; only how fast it moves changes.

## In plain words
The Foreman's notice board at the top of the panel now scrolls at a third of its old speed, so a long message can be read as it goes past. Nothing else about the board changes: the same words, colours and tooltip, and pressing it still opens the Foreman's detail. To see it, have `speck run` building two or more tickets so the board's message is too long to fit, and watch it scroll. With reduced motion turned on, it still stays still. One thing to watch: a long message now takes about three times as long to go all the way round.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (cursor): approve.

## Delivery log
- Review rounds: 1
- Reviewer: cursor, model grok-4.7-high, effort default
- Reviewer tokens: 0
- Elapsed since build started: 20 min
- Changed lines: 6 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- `speck review` with the Cursor reviewer failed three times: the reviewer wrote a line of prose before its JSON verdict, which speck can't read. Round 1 was recorded with `speck record --reviewer=cursor`, from the Cursor reviewer's own reply to the saved round-1 prompt (same model, read-only), with the prose before the JSON removed.
- Follow-ups:
  - Read a reviewer's verdict after a line of prose: `speck/ideas/2026-10-22-read-a-reviewer-s-verdict-after-a-line-of-prose.md`.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · cursor · approve</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "cursor",
    "reviewer_model": "grok-4.7-high",
    "reviewer_effort": "default",
    "reviewed_sha": "a58a5b3487073bdeb17a645eac62e371cbba2e00",
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T19:59:59.069Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html BOARD.speed is 10, and boardFrame() still moves by Math.floor((now - t0) * BOARD.speed / 1000) with the same BOARD.gap of 16 and the same wrap. test/panel-0374.test.mjs \"0374 AC1\" (passed) checks 10 dots in one second, 30 dots in three seconds, one-dot steps, the 16-dot copy, and the loop."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "drawBoard() still sets still from reducedMotion() and shows the word alone; text that fits leaves x at 1 and requests no copy. Passed tests: \"0374 AC2\" (fits, and reduced motion with no frames and only \"Building 2\") and \"0374 AC2\" refresh (same text stays at 90-20, then carries on; new text restarts at 90 and moves 10 dots in the next second)."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The only product change is BOARD.speed. Words still come from boardText(), colour from run-state fm-ok, the tooltip and aria-label are set in the run-button render, and a press still opens the Foreman. Passed test \"0374 AC3\" checks the lit dots, fm-ok, the tooltip, the accessible name, and that a press expands the Foreman, after the board has scrolled."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The old 30-dots-a-second assertion in test/panel-0365.test.mjs now expects 10, which criterion 4 allows, and that test passed. Its narrow-screen and refresh checks wait three times as long and still expect the same distances (20-30, 90-60, 90-90, 90-30); those passed, as did the real-browser board tests. The run reported 131 passed, 0 failed, 3 skipped (pre-existing skips, not this change)."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The Foreman's notice board now scrolls at 10 dots a second instead of 30, so a message that does not fit can be read. It still loops, with the same gap between the end and the start. A message that fits stays put. If the person has asked for reduced motion, the board does not scroll and shows only the Foreman's word. Refreshing with the same message continues from where it was, and a new message starts again from the right. The words, colour, tooltip, what a press does, and the name read out to someone using a screen reader are the same. The new checks and the older board checks passed, including a real browser run that still sees the board move."
  }
}
```

</details>
