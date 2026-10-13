---
id: "0150"
title: "Tidy the panel header"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-13
started: "2026-10-13T21:28:21.538Z"

---
# 0150 · Tidy the panel header

**Status:** 🔨 building

## Problem
The panel header looks untidy, worst on a phone: the Auto-build indicator and its Pause or Start button are two separate boxes, the "live · Ns ago" indicator takes room without telling the user anything useful, and the light/dark button sits on a line of its own, at a different height from the rest. The project name sits in the middle.

## Outcome
The header is tidy on phone and desktop: the Auto-build indicator is itself the button, the "live" indicator has gone, the project name is on the right, and the Auto-build and light/dark buttons are the same height and line up.

## Acceptance criteria
1. The header no longer shows the "live · Ns ago", "connecting…" or "disconnected" indicator. When the panel can't reach its server, the banner under the header still says so, as it does today.
2. Auto-build is one button showing its square (green when on, red when off) and "Auto-build on" or "Auto-build off". Clicking it, or pressing Enter or Space on it, pauses or starts speck run exactly as the Pause and Start buttons do today; there is no separate Pause or Start button. It has a tooltip saying what a click will do ("Pause Auto-build: ready tickets wait" or "Start Auto-build: build ready tickets one at a time"), `aria-pressed` matching whether it's on, and while a request is pending it reads "Starting…" or "Pausing…" and can't be clicked. If starting or pausing fails, the reason still shows under the header.
3. At 700 px wide and over, the header is one row with everything centred vertically: "speck control panel" on the left; the project name and base branch, then the Auto-build button, then the light/dark button on the right.
4. At a viewport 375 px wide, the header is two rows: "speck control panel" on the left and the project name and base branch on the right of the first, then the Auto-build button on the left and the light/dark button on the right of the second. Nothing wraps within a label or overflows the screen, and every button is at least 44 px tall.
5. At every width, the Auto-build and light/dark buttons are the same height and their tops line up. No test that passed before this change fails, except checks of the removed live indicator and the separate Pause and Start button, which are changed to check AC1 and AC2.

## Out of scope
- The banners under the header (disconnected, restart error, Auto-build error) beyond keeping them working.
- Colours, other than the Auto-build square's green and red, which stay as they are.
- The "ready tickets wait" small print beside Auto-build: its meaning moves into the button's tooltip.

## Notes
- Header markup is in `templates/panel.html`: `.logo`, `.repo`, `#run`, `#run-switch`, `#pills`; the phone rules are in the `max-width: 699.98px` media query (0140). The disconnected banner is `#offline`, set by `setConnected()`.
- The Auto-build switch requests are the same as today (`POST /api/run/on` and `/off`), with the token and Origin checks unchanged.
- Reported 2026-10-13 from a phone screenshot: the light/dark button sat alone on a second line, taller than Auto-build and lower than it.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
