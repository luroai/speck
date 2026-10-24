---
id: "0494"
title: "Line up a shipped ticket's title with Build and Plan on a phone"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
created: 2026-10-24
started: "2026-10-24T20:47:56.137Z"
blocked_at: ""
waited_seconds: 826

---
# 0494 · Line up a shipped ticket's title with Build and Plan on a phone

**Status:** 🔨 building

## Problem
On a phone, a collapsed shipped ticket's title sits lower in its card than a Build or Plan ticket's. The title is a link to the full ticket, and on a touch screen it's a 44 px tall target with its text centred in it, so the text starts about 11 px further down. With a mouse, the three line up.

## Outcome
A collapsed shipped ticket's title starts as far from the top of its card as a Build or Plan ticket's, on a phone as well as with a mouse.

## Acceptance criteria
1. On a touch screen at 390 px wide, and with a mouse at 390 px and 1280 px, the top of a collapsed shipped ticket's title text is the same distance from the top of its card as a collapsed Build or Plan ticket's, to within 2 px, measured in a real browser.
2. On a touch screen, the title is still a target at least 44 px tall that opens the full ticket, as today, without adding space above the title's text.
3. A collapsed shipped ticket is no taller than it was before this change.

## Out of scope
- The second line and the Details button (0453, 0420).

## Notes
- From the user's phone screenshot on 2026-10-24. Measured on the live panel with a touch screen at 390 px: the shipped title's box is 44 px tall, with its text centred in it.
- Shipped cards are styled by `#shipped tr` and `#shipped .line .title` in `templates/panel-cards.css`.
- Waits for nothing: no open ticket changes that file. 0452 waits for this one.
- Failing before this build: none
- Measured before the change: with a mouse too, the shipped title's text started 19 px down its card, against 8 px for Build and 7 px for Plan, as 0469 gave a mouse the touch screen's 44 px title line.
- Self-check: the title's 44 px box is now drawn on top of the details line it reaches over, so a tap there still reaches the title; 0420's "details under the title" check now measures the title's text rather than its padded tap box. Known limit: its keyboard focus ring is 44 px tall around that box, as before, but now reaches about 6 px above the card's top edge.
- Went with the recommendation: keep opening the card where it is (chosen by the user in the panel, 2026-10-24 21:09 UTC).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
Criterion 2 says tapping a shipped ticket's title opens the full ticket "as today", but today (since 0466) it opens the card where it is, with Full ticket inside it. Should the title keep opening the card where it is, so criterion 2 is reworded to say that, or should it open the full ticket instead? I recommend keeping it as it is: the build already does that and changes nothing about what a tap does.
Recommended: keep opening the card where it is
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
    "reviewed_sha": "79cf93d20f9aef01c5d5344e23955ab528367dda",
    "session": "fresh",
    "thread_id": "01a16fb1-a333-7fd3-b12e-3b0c1842533f",
    "builder_response": "- Tests run: test/panel-0494.test.mjs test/panel-0420.test.mjs test/panel-0157.test.mjs test/panel-0137.test.mjs test/panel-0141.test.mjs test/panel-0453.test.mjs test/panel-0472.test.mjs test/panel-0167.test.mjs test/panel-0464.test.mjs test/panel-0427.test.mjs test/panel-0417.test.mjs test/panel-0469.test.mjs test/panel-0434.test.mjs test/panel-0466.test.mjs, with --related (plus the checks files).\n- The change: a closed shipped title is a 22 px line with 11 px padding above and below (its 44 px box, which 0141 and 0417 measure as its tap area) and -11 px margins that give that back, so its text starts where Build's and Plan's do and the card shrinks from 76 to 54 px. position: relative puts the box above the details line it reaches over, so a tap anywhere in it reaches the title.\n- Before the change, measured in Chromium: the shipped text started 19 px down its card with a mouse as well as on touch (0469 gave a mouse the 44 px line); Build 8 px, Plan 7 px. After: 8 px in all three setups.\n- Existing test changed: 0420's \"details under the title\" now compares with the title's text box rather than its padded tap box, which now reaches over the details line by design. The check on what you see is unchanged.\n- Known limit, logged in Notes: the focus ring around the 44 px box now reaches about 6 px above the card's top edge.\n",
    "seconds": 31,
    "usage": {
      "input_tokens": 192845,
      "cached_input_tokens": 156416,
      "cache_write_input_tokens": 0,
      "output_tokens": 1053,
      "reasoning_output_tokens": 129
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T20:55:06.204Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "escalate",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/panel-0494.test.mjs measures title text with browser Ranges at all three required viewport/input combinations and compares against both Build and Plan within 2 px. Both new tests passed in /tmp/speck-0494-tests.txt."
      },
      {
        "id": 2,
        "status": "unclear",
        "evidence": "The AC2 browser test verifies a contiguous target of at least 44 px, no added space above the text, and opening the card in place. It does not verify opening the full ticket. templates/panel.js renders the title through shippedTitle and handles the click with toggleShipped; existing panel-0466 tests explicitly require opening in place. This conflicts with the criterion's description of today's behaviour."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The AC1/AC3 browser test checks the collapsed card height against the recorded pre-change 76 px at all three required configurations and passed. The negative vertical margins in templates/panel-cards.css remove the added padding from layout."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0494-line-up-a-shipped-ticket-s-title-with-build-and-pl.md",
        "issue": "Criterion 2 says the title opens the full ticket 'as today', but the existing behaviour and the new test open the card in place. The intended interaction needs clarification before this criterion can pass.",
        "suggested_fix": "Confirm that opening the card in place is intended and correct criterion 2 accordingly, or explicitly authorise and test changing the title to open the full ticket.",
        "state": "open"
      }
    ],
    "escalation_question": "Should tapping the shipped title keep opening the card in place, as the current implementation does, or open the full ticket pane as criterion 2 states?",
    "summary": "The title alignment and card height checks pass, and the title retains its 44 px touch target. Approval needs one clarification: the ticket says tapping the title opens the full ticket, while the existing behaviour and new test open the card in place."
  }
}
```

</details>
