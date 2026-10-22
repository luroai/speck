---
id: "0365"
title: "Scroll the Foreman's status across a dot-matrix notice board"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-a-scrolling-dot-matrix-notice-board-in-the-header.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0364"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T15:47:19.510Z"

---
# 0365 · Scroll the Foreman's status across a dot-matrix notice board

**Status:** 🔨 building

## Problem
The Foreman's button in the header shows one word, such as "Building 2", so the overview of what speck run is doing is only in its detail. An old-school notice board scrolling words across a dot-matrix screen would give that overview at a glance, in the panel's LCD style.

## Outcome
The Foreman's button is a dot-matrix notice board that scrolls the Foreman's status, and what each ticket in flight is doing, from right to left.

## Acceptance criteria
1. The Foreman's button in the header is a dot-matrix screen, in the style of the panel's other LCD screens and drawn with their 5 × 7 dot font, in capitals. It keeps the button's place in the header, its tooltip, its colour for the Foreman's tone (so "Needs you" still shows in red without reading it) and what pressing it, or pressing Enter or Space on it, does.
2. The board's text is the Foreman's word, then, each after " · ": "<id> building" for each ticket building, "<id> shipping" for the ticket shipping and "<id> blocked" for each blocked ticket. For example "Building 2 · 0362 building · 0363 building · 0358 blocked". With none of those, it's the word alone. While the page is out of date, it's "Reload page", as the button says today.
3. When the text is wider than the board, it scrolls from right to left, about 30 dots a second, and loops round with a gap between its end and its start. Text that fits stays still. With `prefers-reduced-motion: reduce`, it never scrolls and shows the Foreman's word alone.
4. The button's accessible name is the board's whole text, whatever has scrolled into view. A panel refresh with the same text carries on scrolling without a jump; new text starts again from the right-hand edge.
5. At 320 px wide and wider, the board fits the header without overlapping anything, and under 700 px it's at least 44 px tall. No test that passed before this change fails, except checks of the Foreman's button's word as a text label, which are changed to check AC1 and AC2.

## Out of scope
- Opening the Foreman's detail in a pop-up: 0366. Pressing the board opens the detail where it opens today.
- The project and base branch, which stay as fixed text in the header (0364).

## Notes
- Today: the button is `#run`, drawn in `render()` with `foremanOf()`, and its detail in `renderForeman()`, in `templates/panel.html` (0285, 0303, 0317). The Foreman's words come from `scripts/foreman.mjs`.
- `templates/lcd.js` already has the 5 × 7 font (`F5`), with capitals, digits and `:`, and reads `prefers-reduced-motion`. A "·" may need a glyph of its own.
- Waits for 0364, which takes the builder character off this button and sets the header's one-row layout.
- Failing before this build: none
- Self-check: added a test that each tone's colour reads at 4.5:1 on the board's LCD background in both looks (the 0161 check doesn't cover it, the board's colour being inherited); drew the "·" in the panel rather than adding it to lcd.js, which 0308 pins.
- Tests changed under AC5 (checks of the button's word as a text label, now of the board and its text): 0127, 0140, 0144, 0150, 0163, 0285, 0303, 0364. The fake page in test/support/panel.mjs gains createElementNS for the board's SVG.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
