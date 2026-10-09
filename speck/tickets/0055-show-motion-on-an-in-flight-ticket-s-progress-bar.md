---
id: "0055"
title: "Show motion on an in-flight ticket's progress bar"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-09-show-motion-on-queue-progress-bars.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T19:08:34.622Z"

---
# 0055 · Show motion on an in-flight ticket's progress bar

**Status:** 🔨 building

## Problem
The bars in the panel's Queue only change when a ticket moves to another step, which can take many minutes. Meanwhile the panel looks frozen, so the user can't tell a build is still working.

## Outcome
The current step of a ticket that's being built or reviewed shows a moving dot of light, so the queue looks alive while agents work.

## Acceptance criteria
1. A ticket whose status is `building` or `reviewing`, and that isn't red, shows a dot of light moving side to side, without stopping, within its bar's current step only.
2. No other ticket shows it: not `ready` (Queued), `blocked` or `approved` tickets, and not a red `building` or `reviewing` ticket (one with a `build_exit`).
3. When the browser asks for reduced motion (`prefers-reduced-motion: reduce`), no dot moves and the bars look as they do today.
4. The motion doesn't restart or jump on the 2-second refresh while the ticket's data is unchanged, and text selected in the row stays selected as it does today.

## Out of scope
- Real progress: the dot means "in flight", not how far along the step is. Live agent activity is a later idea in `speck/ideas/2026-10-08-speck-board.md`.
- Changing the steps, their labels or colours (0034).
- Motion anywhere outside the queue.

## Notes
- Builds on the five-step bars from 0034 (done); bars are drawn by `queueItem` in `templates/panel.html`.
- Which tickets move, current step only, and reduced motion respected: defaults chosen while ticketing from the idea's open questions, to confirm before ready.
- product.md's Queue description needs updating.
- Checked 2026-10-09: `prefers-reduced-motion: reduce` is the standard CSS media feature for reduced motion (MDN, Media Queries Level 5).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
