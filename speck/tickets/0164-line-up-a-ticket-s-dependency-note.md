---
id: "0164"
title: "Line up a ticket's dependency note"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0164 · Line up a ticket's dependency note

**Status:** 📋 ready

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

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
