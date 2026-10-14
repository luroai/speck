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
On a phone, the "unlocks …" or "waiting on …" note on a Plan card now sits on the same line as "5 criteria" and the lint result, in the same size of text. If it doesn't fit there, it starts on the next line at the left edge. The ticket numbers in it read like ordinary text, "unlocks 0162, 0163", with no wide gaps, and they're still easy to tap: a tap on a number goes to that ticket and briefly highlights it, as before. A card you've tapped no longer stays shaded grey after you let go. With a mouse, cards still shade as you move over them.

To see it, open the panel on a phone and look at a ticket that unlocks or waits on others. Tap one of its numbers, then tap a card to open and close it.

Worth keeping an eye on: on a touchscreen laptop whose main input is the touchscreen, cards no longer shade when you move the mouse over them.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Skipped as a duplicate: the full suite fails one of `0128 AC3` or `0148 AC2` ("speck run has stopped") when the machine is busy, on the base branch too. Matches speck/ideas/2026-10-13-stop-tests-checking-speck-run-stopped-too-soon.md.
- Known limit: card shading on hover now follows the main pointer (`(hover: hover)`), so on a touchscreen laptop whose main pointer is the screen, a mouse over a card doesn't shade it. Headless Chrome always reports `(hover: none)`, so the mouse case is checked by reading the stylesheet rather than in a browser.

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

<details><summary>Round 2 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "12ebd8fd51d7fc86d337225d9ce3c3fea77a262e",
    "thread_id": "01a13b5b-87df-7e71-ace0-92119b7031fd",
    "seconds": 31,
    "usage": {
      "input_tokens": 190469,
      "cached_input_tokens": 142720,
      "cache_write_input_tokens": 0,
      "output_tokens": 1661,
      "reasoning_output_tokens": 172
    },
    "saved_at": "2026-10-14T17:17:06.396Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html retains baseline alignment and flex wrapping in .checks. All five AC1 browser tests passed, covering desktop and phone alignment and a note starting its own line."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The mobile .goto rule preserves running-text layout and 44 px button dimensions. All four AC2 tests passed, checking punctuation, spacing, text alignment and target dimensions."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Card hover shading remains inside @media (hover: hover). Both AC3 tests passed, covering the stylesheet restriction and actual touch opening and closing with the appropriate backgrounds."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "gotoButton() now wraps the id in a raised span, protecting its text from adjacent buttons' padding. The new multiline AC4 browser test checks hit detection around every id and taps each id to verify its own destination highlight. The existing scrolling and temporary-highlight test also passed."
      },
      {
        "id": 5,
        "status": "unclear",
        "evidence": "Verified /tmp/speck-0164-tests.txt: 1621 tests, 1617 passed, one failed and three skipped. The failing 0128 AC3 test previously passed and is not listed as failing before the build. Its immediate process-liveness assertion is consistent with the reported timing flake, and it does not exercise the changed page code, but a passing full-suite result for the current implementation is still missing."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:412",
        "issue": "The earlier multiline-link interception problem is fixed: each id's text and surrounding line band now sit above neighbouring button padding. The new browser test exercises every linked id in a wrapped note and passes.",
        "suggested_fix": "No further change required for this finding.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "/tmp/speck-0164-tests.txt",
        "issue": "Criterion 5 remains unverified because the latest full suite fails 0128 AC3. The evidence supports a timing flake unrelated to this implementation, but the ticket records no pre-existing failures and the current code has no clean full-suite result.",
        "suggested_fix": "Rerun the full suite when machine load is lower and provide a passing result for the current code. Do not change unrelated process-control code or weaken its tests for this ticket.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The alignment, touch shading and wrapped-link behaviour now work, including tapping every id in a multiline note. The remaining hold is verification: the full suite has one apparently unrelated timing failure. Obtain a clean full-suite run before approval."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "12ebd8fd51d7fc86d337225d9ce3c3fea77a262e",
    "thread_id": "01a13b5b-87df-7e71-ace0-92119b7031fd",
    "seconds": 29,
    "usage": {
      "input_tokens": 290562,
      "cached_input_tokens": 238336,
      "cache_write_input_tokens": 0,
      "output_tokens": 2356,
      "reasoning_output_tokens": 172
    },
    "saved_at": "2026-10-14T17:31:13.759Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html .checks uses baseline alignment and flex wrapping. All AC1 browser tests passed, covering desktop and phone text alignment and a wrapped note starting at the left edge."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The mobile .goto styles preserve running-text spacing and expanded button dimensions. All AC2 tests passed, checking commas, spaces, baselines and targets measuring at least 44 px in both directions."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Card hover shading is restricted to @media (hover: hover). Both AC3 tests passed, verifying the stylesheet restriction and touch opening and closing with the appropriate backgrounds."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "gotoButton() protects each id's text with a raised span. Both AC4 browser tests passed, checking hit detection and actual taps for every id in a multiline note, plus scrolling and temporary highlighting."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The current suite has 1617 passes, three skips and one process-liveness failure. Verified that /tmp/speck-0164-main-tests.txt reproduces the same 'speck run has stopped' failure on the base branch. Tests 0128 AC3 and 0148 AC2 directly call the unchanged run API and immediately check process liveness; neither exercises the changed page code. This supports an existing timing failure rather than a regression from this ticket."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:412",
        "issue": "The multiline-link interception problem is fixed. Each id's visible text and surrounding line band take precedence over neighbouring button padding, with passing browser coverage for every linked id.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "/tmp/speck-0164-tests.txt",
        "issue": "Accepted the dispute: the base-branch run independently reproduces the process-liveness failure, and the failing tests do not execute this ticket's changed page code. The remaining failure does not indicate a regression from this change.",
        "suggested_fix": "Track the existing process-liveness timing failure separately; leave unrelated code and tests unchanged in this ticket.",
        "state": "dispute_accepted"
      }
    ],
    "escalation_question": "",
    "summary": "Approved. Dependency notes align and read naturally, tapping wrapped links reaches the correct ticket, and touch cards no longer retain hover shading. All ticket tests pass. The remaining suite failure also occurs on the base branch and concerns unrelated process timing."
  }
}
```

</details>
