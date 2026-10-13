---
id: "0144"
title: "Colour speck run's state like a traffic light"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0144 · Colour speck run's state like a traffic light

**Status:** 📝 draft

## Problem
The panel header's speck run indicator shows a blue square when speck run is on and a grey one when it's off. Grey reads as faded rather than off, so the user can't tell the state at a glance.

## Outcome
The speck run indicator's square is green when speck run is on and red when it's off.

## Acceptance criteria
1. While speck run is on, the square in the header's "speck run on" indicator is the panel's green (the colour used for "lint passes"), in light and dark mode.
2. While speck run is off, the square in the "speck run off" indicator is the panel's red (the colour used for a blocked ticket), in light and dark mode.
3. The connection indicator next to it ("live · Ns ago" and "disconnected") keeps its colours as today.
4. The indicator's text, the on/off button beside it and what they do are unchanged.
5. No test that passed before this change fails, except checks of the speck run square's blue or grey colour, which are changed to check green and red.

## Out of scope
- The connection indicator's colours.
- Any other colour in the panel.

## Notes
- The speck run square and the connection square share the `.live` class (`templates/panel.html`): `.live` is `--run` (blue) and `.live.idle` is `--faint` (grey). The panel's green is `--ok` and its red is `--bad`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
