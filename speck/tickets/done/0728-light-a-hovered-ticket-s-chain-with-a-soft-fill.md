---
id: "0728"
title: "Light a hovered ticket's chain with a soft fill"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: cursor              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0701"]                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T15:21:58.663Z"
approved: "2026-11-24T16:11:38.552Z"
finished: "2026-11-24T16:54:50.865Z"

---
# 0728 · Light a hovered ticket's chain with a soft fill

**Status:** ✅ done

## Problem
Hovering a ticket lights it and every ticket chained to it with a ring and border in the text colour, which reads as a stack of heavy black boxes. It looks out of place in Cursor's browser pane, whose own lists show hover with a soft fill.

## Outcome
A hovered ticket and the tickets chained to it are lit with the same soft raised fill a hovered row has, with no dark ring or border.

## Acceptance criteria
1. On a device with hover, when a ticket in Plan or Build is hovered, it and every ticket linked to it show the raised fill a hovered row has (`--raise`), reaching 12 px past their text as an open row's fill does, and none gets a border or ring in the text colour.
2. Lit rows don't move or change size, and keep their text colours, and a row with a state colour (in trouble, waiting to ship, being worked on) keeps its border and fill as today.
3. When a tapped ticket id scrolls its ticket into view and lights it for 1.5 seconds, it is lit with the same fill, fading out, rather than a dark ring; with reduced motion it shows the fill without the fade.
4. An open row, already filled, looks as it does today when lit, with no ring.
5. No test that passed before this change fails, except tests that check for the ring (from 0185, 0154 and 0614), which are changed to check the fill.

## Out of scope
- Which tickets count as linked.
- Touch screens, where nothing is lit on hover.

## Notes
- Raised by the user on 2026-11-24 from a screenshot of the panel in Cursor's browser pane: three chained drafts lit as black boxes. It must keep looking like part of Cursor.
- The ring is `.item.hl, .q.hl` and `.item.row.open.hl::after` in `templates/panel-cards.css`, set by `lightUp` in `templates/panel.js`; the tap flash is `.item.flash`, `.q.flash` and `@keyframes flash`, with reduced-motion rules near the end of the file.
- Waits for 0701, which gives a hovered closed row its 12 px of fill.
- Failing before this build: none
- Self-check: put the lit-chain fill inside (hover: hover), so phones keep a closed card's background (0164)

## In plain words
Hovering a ticket no longer draws a heavy dark ring round it and every ticket linked to it. Instead, the whole chain gets the same soft raised fill a normal hovered row has, stretching a little past the text. Tapping a linked id lights that ticket the same way for a moment and then fades. Open rows, already filled, look unchanged when lit.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 157,657
- Elapsed since build started: 50 min
- Changed lines: 37 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none

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
    "reviewed_sha": "96b456f221740b849f677405d0807ed27c216b45",
    "session": "fresh",
    "thread_id": "01a20e53-26bf-7810-8ae2-14c84e8bd837",
    "builder_response": "- Tests run: test/panel-0728.test.mjs test/panel-0185.test.mjs test/panel-0154.test.mjs test/panel-0614.test.mjs test/panel-0701.test.mjs test/panel-0167.test.mjs test/panel-0416.test.mjs test/panel-0164.test.mjs\n- Change: a hovered ticket's chain and a tapped id's flash use the raised fill (`--raise`), reaching 12 px past closed rows, with no text-colour ring. The lit-chain fill is inside `@media (hover: hover)` so phones keep a closed card's background (0164). Open rows already filled get no ring. Ring-checking tests from 0185, 0154, 0614, 0701, 0167 and 0416 now check the fill.\n- Pictures: Plan with a hovered chain, light and dark looks.\n",
    "seconds": 26,
    "usage": {
      "input_tokens": 156884,
      "cached_input_tokens": 119552,
      "cache_write_input_tokens": 0,
      "output_tokens": 773,
      "reasoning_output_tokens": 66
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 37332,
      "cached": 119552,
      "write": 0,
      "output": 773
    },
    "cost_usd": 0.0943492,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T16:11:25.163Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-cards.css limits .hl fills to hover devices and adds 12 px side shadows without a text-colour border or ring. Passing tests in panel-0728 and panel-0185 cover styling and linked-ticket marking."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The highlight rules change only background and box-shadow. panel-0728 AC2 checks layout and text declarations; panel-0167 checks state dots and colours. Current rows have no state-specific border or fill to preserve."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panel.js goTo retains its 1.5-second flash timer. CSS flash and flash-row animate the raised fill to transparent; reduced-motion rules apply a stationary fill. Passing panel-0154 and panel-0728 tests cover these paths."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The open-row side fill remains unchanged, its ring pseudo-element is removed, and .item.row.open.flash disables animation. Passing panel-0614 and panel-0728 tests check preservation of the open fill and absence of rings."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified the supplied test log: 196 passed, zero failed, three skipped. Changes to existing tests replace obsolete ring expectations or account for the new fill animation; no unrelated implementation changes were found."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Hovered ticket chains now use a soft fill extending beyond the text, without dark rings. Tapped links use the same fill, with reduced-motion support. Open rows and state colours remain intact. The reported checks pass, and the change is ready for the owner's merge decision."
  }
}
```

</details>
