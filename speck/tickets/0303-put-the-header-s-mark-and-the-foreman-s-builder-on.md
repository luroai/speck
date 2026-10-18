---
id: "0303"
title: "Put the header's mark and the Foreman's builder on the LCD screen"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0302"]  # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T21:51:29.988Z"

---
# 0303 · Put the header's mark and the Foreman's builder on the LCD screen

**Status:** 🔨 building

## Problem
After 0302, the badges are drawn on the LCD screen, but the header's mark and the Foreman's button still use the old drawing. The design (`docs/design/lcd/panel-mock.html`) puts both on the same screen.

## Outcome
The header's mark and the builder on the Foreman's button are drawn on the LCD screen, as the design shows them.

## Acceptance criteria
1. The header's mark is drawn with the renderer's `tile(canvas, PANEL, 'still', { cols: 16, rows: 16, k: .3, ox: 8, oy: 15, still: true })` at 19 px, with the screen and unlit dots transparent, the ink the page's text colour and the speck the panel's `--dot`, as in `docs/design/lcd/panel-mock.html`.
2. The Foreman's button shows the renderer's `mini(canvas)` builder at 28 px before its status. It hops while builds are running and is still otherwise, through the mini builder's own `set(true)` and `set(false)`.
3. Both follow the panel's light and dark looks.
4. Nothing else in the header changes. (checked by review)

## Out of scope
- The badges: 0302.

## Notes
- See 0302's Notes for where the design and its renderer are.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
