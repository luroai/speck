---
id: "0513"
title: "Grey the dot by speck's name while Auto-build is off"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-26
started: "2026-10-26T10:30:39.377Z"

---
# 0513 · Grey the dot by speck's name while Auto-build is off

**Status:** 🔨 building

## Problem
The dot before "speck" in the header is speck's red whether or not `speck run` is on, so it looks live even when Auto-build is off and nothing will build. A red light that's always on says nothing.

## Outcome
The dot by speck's name is red while Auto-build is on and grey while it's off, like a power light.

## Acceptance criteria
1. While `speck run` is off (the screen's word is `Off`), the dot before "speck" in the header is grey, in the frame's muted colour (`--bezel-muted`), in the light and dark looks. While it's on, whatever the screen's word, the dot is red as today.
2. The dot changes within one refresh of the panel when Auto-build is turned on or off, from the Settings switch or from a terminal, without a reload. Checked in a real browser.
3. The dot's size and place, the needs-you edge on the frame (0413) and speck's red eye on the screen don't change. No test that passed before this change fails.

## Out of scope
- The browser tab's icon and the app icon.
- What the screen shows while Auto-build is off.

## Notes
- Asked for by the user on 2026-10-26: "When auto build is off, the red dot next to the speck title should be off too, maybe grey instead of red."
- Today: `.bezel .name::before` in `templates/panel-header.css` is `var(--lcd-red)` (0438). `drawHeader` in `templates/panel-header.js` sets the frame's class from the Foreman's word (`bezel needs`), which an off state can follow.
- Unchained from 0512, which changes the watching beats in `templates/panel-header.js`, not `drawHeader`.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
