---
id: "0145"
title: Remove the build pause icon from the panel                # one outcome, no "and"
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
started: "2026-10-13T08:23:28.509Z"

---
# 0145 · Remove the build pause icon from the panel

**Status:** 🔨 building

## Problem
Each running build in the panel's Build queue has its own pause and play icon. With the Auto-build switch in the header, the user doesn't need to hold individual builds from the panel, and the icon adds clutter to every row and can be confused with the header switch.

## Outcome
Build queue rows no longer have a pause or play icon; the Stop build button and the `speck pause` and `speck play` commands stay.

## Acceptance criteria
1. No row in the Build queue shows a pause or play icon, whether its build is running, paused or neither.
2. A build that's paused (for example with `speck pause <id>`) still shows "Paused" on its row, with the command that carries it on: `speck play <id>`.
3. An opened building or reviewing row still has its Stop build button, which works as before.
4. The panel server no longer accepts `POST /api/tickets/<id>/pause` or `/play`: it answers 404 and changes nothing. `speck pause <id>` and `speck play <id>` work as before.
5. No test that passed before this change fails, except tests of the panel's pause and play icon and its pause and play requests, which are removed or changed to check AC1, AC2 and AC4.

## Out of scope
- Removing the `speck pause` and `speck play` commands.
- The header's Auto-build switch (0144).
- Stop build.

## Notes
- The icon is `toggleIcon()` in `templates/panel.html`, and its requests are handled by `panelPausePlay()` in `scripts/panel.mjs`.
- The README's panel section and `docs/brief.md`'s `speck panel` row mention pausing and playing from the panel; they need updating to match, in British English.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
