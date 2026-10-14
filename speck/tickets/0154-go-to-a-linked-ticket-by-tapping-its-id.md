---
id: "0154"
title: "Go to a linked ticket by tapping its id"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

**Status:** 🔨 building

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
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
