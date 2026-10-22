---
id: "0374"
title: "Slow the Foreman's notice board"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0374 · Slow the Foreman's notice board

**Status:** 📋 ready

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

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
