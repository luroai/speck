---
id: "0434"
title: "Show a grid of moving lights while an agent works on a ticket"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0428"] # ticket ids that must be done first
created: 2026-10-23

---
# 0434 · Show a grid of moving lights while an agent works on a ticket

**Status:** 📋 ready

## Problem
A ticket being built is taller than the others. Its details line starts with a stage sentence such as `Writing tests and code`, and on a phone every item in the line is a finger-sized box, so `Writing tests and code · Build · 01:07 · P3 · M · low` wraps over three rows with wide gaps.

## Outcome
While an agent works on a ticket, a small grid of moving lights shows it's working in place of the stage sentence, and the ticket is two rows like the others.

## Acceptance criteria
1. While a ticket's builder or reviewer is at work (writing tests and code, checking its own work, reviewing or fixing a round's findings), its details line starts with a 4 × 4 grid of small dots, no more than 14 px square, with lights moving across it, in place of the stage sentence. The line then reads `<stage> · <timer> · <priority> · <size> · <risk>`, such as `Build · 01:07 · P3 · M · low`, and during review the reviewer's model follows the stage, as in `Review 1 · gpt-6.1-sol · 07:52 · P3 · M · low`.
2. The grid's accessible name, and its tooltip, is the stage sentence it replaces, such as `Writing tests and code`.
3. A ticket no agent is working on (queued, blocked, approved, paused, shipping or stopped) shows no grid and keeps its words as today.
4. With reduced motion on, the grid is still, with some of its dots lit.
5. At 390 px wide, on a touch screen as well as with a mouse, a ticket being built whose title fits on one line is two rows: its title line and its details line. Only the priority in that line is a finger-sized control on a touch screen.

## Out of scope
- speck's screen (0413, 0414).
- Plan and Shipped tickets.

## Notes
- The user asked for this on 2026-10-23, from a phone screenshot of the Build lane: a Cursor-style small grid of lights for "working".
- This replaces 0416's rule that only speck's screen moves, for this grid only. The test for that rule changes to allow it.
- Today: `doing()` gives the stage sentence, and 0419 set out the details line, in `templates/panel.html`.
- Waits for 0428: both change `templates/panel.html`. 0430 waits for it too, as 0430 moves every style.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
