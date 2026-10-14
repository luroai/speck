---
id: "0164"
title: "Line up a ticket's dependency note"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0161"]                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-14T16:47:54.656Z"

---
# 0164 · Line up a ticket's dependency note

**Status:** 🔍 reviewing

## Problem
On a phone, a Plan card's "unlocks 0162, 0163" or "waiting on 0161" note sits lower and further right than the "5 criteria · lint passes" beside it, with wide gaps around each id and the comma: each id is a 44 px button centred on its own, so it pushes the line out of line. Separately, a card the user has tapped stays shaded grey, because its hover background sticks on touch screens.

## Outcome
A ticket's dependency note lines up with the rest of its details row and reads as normal text with linked ids, and a tapped card doesn't stay shaded.

## Acceptance criteria
1. At every width, the "unlocks …" or "waiting on …" note shares the baseline and text size of "5 criteria" and the lint result. If there isn't room on the same line, it starts its own line at the card's left edge, aligned with "5 criteria", not indented.
2. The ids in the note read as normal running text: "unlocks 0162, 0163", with the comma straight after each id and one space before the next. Each id keeps a tap area at least 44 px high under 700 px wide, without moving the text out of line (for example by extending the tap area invisibly around it).
3. On a device whose main pointer can't hover (`(hover: none)`), a card's background doesn't change when it's tapped and stays as it was afterwards. With a mouse, hovering shades it as today. An opened card keeps its opened colour.
4. Tapping an id still scrolls to that ticket and briefly highlights it, as 0154 does.
5. No test that passed before this change fails.

## Out of scope
- What the note says, or which tickets it links.
- The chain and padlock icons in the tags row.

## Notes
- The ids are `.goto` buttons (`gotoButton()` in `templates/panel.html`); under 700 px they're `display: inline-flex; min-width: 44px; min-height: 44px; vertical-align: middle`, which causes the offset. The note is built in `ticketHead()` with `idLinks()`.
- The sticky shading is `.item.ticket:hover, .item.idea:hover, .item.inbox:hover { background: var(--raise) }`, which iOS keeps after a tap.
- Builds after 0161, which changes the same styles.
- Reported 2026-10-14 from a phone screenshot.
- Failing before this build: none
- Self-check: the full suite showed 0140's 44 by 44 px rule for buttons, so each id's tap area now reaches 8 px past its text on each side too, given back by negative margins; 0164 AC2 checks both directions. Headless Chrome always reports `(hover: none)`, so the mouse case of AC3 is checked by reading the stylesheet (the card shading sits in `@media (hover: hover)`).

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
    "reviewed_sha": "9fd464e37e45e95d6702bfaad29060995832f665",
    "thread_id": "01a13b5b-87df-7e71-ace0-92119b7031fd",
    "seconds": 44,
    "usage": {
      "input_tokens": 98863,
      "cached_input_tokens": 57728,
      "cache_write_input_tokens": 0,
      "output_tokens": 925,
      "reasoning_output_tokens": 172
    },
    "saved_at": "2026-10-14T17:01:00.444Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: .checks uses align-items: baseline and wrapping. The AC1 browser tests in test/panel-0164.test.mjs passed at 1280 and 375 px, checking text alignment and left alignment after wrapping."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The AC2 tests passed, checking running text, comma spacing, baseline alignment and button rectangles of at least 44 px on a phone."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The hover background is restricted to @media (hover: hover). AC3 stylesheet and browser tests passed, including touch opening and closing while retaining the appropriate background."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "The AC4 test passed for one id, but the mobile .goto rule creates overlapping hit areas when the note itself wraps across lines. Later buttons can intercept taps on earlier ids."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0164-tests.txt: 1620 tests, 1617 passed, zero failed and three skipped. Existing tests were not changed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:412",
        "issue": "The 44 px buttons have negative vertical margins that reduce their contribution to line height to 16 px. When a long dependency note wraps internally, successive lines remain roughly 18 px apart while their button hit areas are 44 px high. Those areas overlap substantially, so a later line's button can intercept a tap on an earlier line's visible id and navigate to the wrong ticket. The current interaction test taps only 0007 and does not check every link in a note spanning multiple lines.",
        "suggested_fix": "Ensure ids on different lines cannot intercept one another's visible text or intended tap areas, while preserving the required baseline and target height. Add a browser test with a dependency note spanning several lines that taps every visible id and checks the destination, including taps in the expanded areas.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The dependency text lines up correctly, and touch cards no longer retain hover shading. The suite passes. However, long notes can have overlapping link tap areas across lines, causing a tap to open the wrong ticket. Fix that interaction before merging."
  }
}
```

</details>
