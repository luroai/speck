---
id: "0138"
title: "Show a ticket waiting to ship in purple, not red"                # one outcome, no "and"
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
created: 2026-10-12
started: "2026-10-12T21:31:42.291Z"

---
# 0138 · Show a ticket waiting to ship in purple, not red

**Status:** 🔨 building

## Problem
When an approved ticket's build has finished and the ticket is waiting for the user to ship it, the panel's queue shows its row in red, the colour it uses for blocked and broken builds. Nothing is wrong: the ticket is just waiting for the user's shipping decision, so the red sends a false alarm.

## Outcome
In the queue, an approved ticket waiting to ship is highlighted in purple, and red is kept for tickets that are blocked or whose build stopped before finishing.

## Acceptance criteria
1. In the queue, an approved ticket whose build has exited is shown in purple everywhere it is red today: the row's left border, the open row's background tint, the current step in its progress bar and its "Build finished without shipping" line. None of these is red.
2. The purple reads clearly against the background in both light and dark mode, and is visibly different from the panel's red and from its amber warning colour.
3. A blocked ticket, a ticket whose build stopped before finishing and a ticket whose build stopped unexpectedly look exactly as they do today, in red.
4. An approved ticket's Full ticket and Review pack buttons, and the Ship button in its review pack, work as before.
5. No test that passed before this change fails, except checks that an approved ticket with an exited build is shown in red, which are changed to check for purple.

## Out of scope
- Changing the "Build finished without shipping" wording.
- Colours anywhere other than the queue row of an approved ticket waiting to ship.
- How or when a ticket ships.

## Notes
- Today the red comes from `red: t.status === 'blocked' || exit_label !== null` in `templates/panel.html`, which includes an approved ticket's "Build finished without shipping".
- The panel already uses a purple for ideas (`--idea`). Reusing it or picking a new purple is the builder's call, as long as criterion 2 holds.
- Failing before this build: none
- Reuses the ideas purple (`--idea`, `--idea-bg` for the open tint), so no new colours.
- Self-check: no changes

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
