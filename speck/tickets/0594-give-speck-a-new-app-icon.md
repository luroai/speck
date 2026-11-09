---
id: "0594"
title: "Give speck a new app icon"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0578"]                # ticket ids that must be done first
created: 2026-11-09

---
# 0594 · Give speck a new app icon

**Status:** 📋 ready

## Problem
The panel's app icon and favicon are the LCD-era mark. In the redesign, speck itself is the mark: the Premium screen on the black slab.

## Outcome
The app icon and favicon are speck as the Premium screen on the black slab.

## Acceptance criteria
1. `templates/icons/icon.svg` and the PNGs (192 and 512 px, and the Apple touch icon) show speck as the Premium screen, watching, on the black bar's colour with rounded corners.
2. At 16 and 32 px the favicon shows the plain visor, without the reflection or glow.
3. The web app manifest's theme and background colours are the black bar's.
4. The page's tab and the phone's home-screen icon use the new icons.
5. Tests that checked the old look of what this changes are updated to the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- The landing page, which lives in its own repo.

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Today: `templates/icons/` (`icon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `manifest.webmanifest`), served by `scripts/panel.mjs`; `test/icons-0305.test.mjs` and `test/logo-0320.test.mjs` check them.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
