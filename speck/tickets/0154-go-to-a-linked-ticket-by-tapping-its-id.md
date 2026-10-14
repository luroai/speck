---
id: "0154"
title: "Go to a linked ticket by tapping its id"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-13
started: "2026-10-14T00:10:27.364Z"

---
# 0154 · Go to a linked ticket by tapping its id

**Status:** 🔍 reviewing

## Problem
Hovering over a ticket in Plan or the Build queue highlights the tickets linked to it through `after:` and dims the rest. On a phone there's no hover: a tap sets the highlight off and it stays stuck until the next tap elsewhere, which is confusing and gets in the way of opening tickets.

## Outcome
On touch screens nothing highlights on its own; instead, on every device, the linked ticket ids in a ticket's "waiting on" and "unlocks" notes can be tapped to go to that ticket.

## Acceptance criteria
1. On a device whose main pointer can't hover (`(hover: none)`), touching or tapping a ticket never highlights or dims other tickets. With a mouse, hovering highlights and dims linked tickets as it does today.
2. In Plan and the Build queue, each ticket id in a ticket's "waiting on …" or "unlocks …" note is a button. Activating it, by tap, click, or Enter or Space, scrolls that ticket into view and briefly highlights it (about 1.5 seconds) before the highlight fades by itself; it doesn't open or close any ticket.
3. If the linked ticket isn't on the page (for example it has already shipped, or it's on a Plan tab that isn't showing), its id is shown as plain text, not a button.
4. Each id button has a tap area at least 44 px high at viewports under 700 px, and screen readers announce it as going to that ticket, for example "Go to ticket 0148".
5. No test that passed before this change fails.

## Out of scope
- Changing how chains are worked out, or the chain and padlock icons.
- The Shipped list.

## Notes
- The hover highlight is `hoverable()` and `lightUp()` in `templates/panel.html`, with the `.hl` and `.dim` classes. The "unlocks" note is built in `ticketHead()`; the "waiting on" note appears there and on queued rows.
- Reported 2026-10-13: the highlight is hard to use on a phone.
- Failing before this build: none
- AC1 is met by the pointer a hover comes from rather than by the `(hover: none)` query itself: a tap sends a touch `pointerover` just before its `mouseenter`, so only a mouse lights tickets up. On a `(hover: none)` device every hover comes from a tap, so nothing lights up there. The query alone couldn't be used: headless Chrome reports `(hover: none)` even with a mouse, and can't be told otherwise, so 0041's real-browser hover test would fail. A touch laptop's mouse still lights tickets up.
- When the browser asks for reduced motion, the highlight stays still for its 1.5 seconds rather than fading, as 0055 keeps every animation inside the no-preference block.
- Self-check: no changes

## In plain words
On a phone, tapping a ticket no longer lights up its linked tickets and greys out the rest, so nothing gets stuck highlighted. With a mouse, hovering works as before. In Plan and the Build queue, the ticket numbers in a "waiting on" or "unlocks" note are now links: tap or click one, or press Enter on it, and the page scrolls to that ticket and lights it up for about a second and a half. A number whose ticket isn't on the page, for example one that has already shipped, stays plain text. To see it, open the panel on a phone and tap a number in a "waiting on" note. On a phone the numbers have a bigger tap area, so those notes take a little more room.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none for the inbox.
- Known limit: a pen that can hover, as on some drawing tablets, doesn't light tickets up either, since only a mouse does.
- Known limit: the full ticket pane's own "waiting on" text isn't linked; the ticket covers only Plan and the Build queue.

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
    "reviewed_sha": "bea013e9a7e345438996e9a934b1fa02347f3c41",
    "thread_id": "01a137c9-e8c3-7da1-879c-b9bce97ab8eb",
    "seconds": 26,
    "usage": {
      "input_tokens": 150076,
      "cached_input_tokens": 105984,
      "cache_write_input_tokens": 0,
      "output_tokens": 769,
      "reasoning_output_tokens": 60
    },
    "saved_at": "2026-10-14T00:22:47.661Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: hoverable() gates highlighting on pointer type. Fake-page touch/pen and mouse tests and the real-browser touch/mouse test in test/panel-0154.test.mjs all passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html: idLinks(), gotoButton() and goTo() provide native buttons, stop click propagation, scroll the target and remove its flash after 1500 ms. Passing tests cover navigation, unchanged open state, repeated activation, refresh persistence and real-browser Enter activation. Space uses native button behaviour."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html: render() computes onPage; idLinks() renders absent targets as text. Passing tests cover shipped targets, hidden Plan tickets, tab switching and targets leaving during refresh."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "gotoButton() sets 'Go to ticket <id>' as the accessible name. The under-700px CSS gives .goto a 44px minimum height. The passing browser test measures every button at a 375px viewport."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0154-tests.txt: 1395 tests, 1392 passed, zero failed and three skipped. All 13 ticket-specific tests passed, including the browser tests. Existing tests were not weakened."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Linked ticket ids now navigate to visible tickets and highlight them briefly without opening or closing tickets. Touch taps avoid chain highlighting, while mouse hover still works. Hidden targets remain plain text, and mobile buttons meet the required size. The recorded full suite has no failures; no blocking concerns found."
  }
}
```

</details>
