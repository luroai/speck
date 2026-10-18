---
id: "0305"
title: "Make the app icon the speck on the LCD screen"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0303"]  # ticket ids that must be done first
created: 2026-10-18

---
# 0305 · Make the app icon the speck on the LCD screen

**Status:** 📝 draft

## Problem
The panel's app icon, which a phone shows when the panel is added to its home screen and a browser shows in its tab, is today's line drawing of speck. The LCD design puts speck on a dot-matrix screen everywhere.

## Outcome
The panel's app icon is speck drawn on the LCD screen, as the design draws its mark.

## Acceptance criteria
1. `templates/icons/icon.svg`, `icon-192.png`, `icon-512.png` and `apple-touch-icon.png` show the design's still mark, the same dots as the header's mark (0303) from the renderer's `tile(…, PANEL, 'still', { cols: 16, rows: 16, k: .3, ox: 8, oy: 15, still: true })`, as square dots in the light look's screen ink (`#20241d`) with the speck in its red (`#d63f28`), on the light look's screen colour (`#c3c9b1`).
2. The mark fills the icon with the same margin on every side, so a phone's rounded corners don't cut into it.
3. The PNGs are 192, 512 and 180 pixels square, as today, with sharp dot edges.
4. The manifest and the page's icon links are unchanged, apart from anything the new icons need.

## Out of scope
- The header's mark: 0303.

## Notes
- The icons are served from `templates/icons/` by `scripts/panel.mjs` (0149). The design's renderer is `docs/design/lcd/lcd.js`; the dots can be read from it once and written into the SVG, so the icon doesn't run any script.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
