---
id: "0309"
title: "Make the header's mark and title larger"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []  # ticket ids that must be done first
created: 2026-10-18

---
# 0309 · Make the header's mark and title larger

**Status:** 📋 ready

## Problem
The header's LCD mark (19 px) and "speck" title (18 px Doto) are small next to the header's 34 px buttons, so the brand reads weakly, especially on a phone.

## Outcome
The header's mark and "speck" title are larger, closer to the landing page's, and the mark's dots stay crisp.

## Acceptance criteria
1. The header's mark is 32 px square, two screen pixels per dot of its 16 × 16 grid, so every dot is the same size.
2. The "speck" title is 26 px Doto at weight 900, sitting on the same line as the mark, vertically centred with it.
3. The header's buttons keep their size, and the header grows no taller than the mark needs.
4. At 320 px wide and wider, the header fits without scrolling sideways or overlapping, in both looks. The "control panel" label and the repo name hide at narrow widths as they do today.

## Out of scope
- The Foreman's button and its builder.

## Notes
- The sizes are `.logo .mark` and `.logo .name` in `templates/panel.html` (0303, 0304). The landing page sets its mark at 26 px and its name at 24 px.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
