---
id: "0071"
title: Toggle a build between paused and playing from its queue row                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0069", "0070"]                # ticket ids that must be done first
created: 2026-10-09

---
# 0071 · Toggle a build between paused and playing from its queue row

**Status:** 📋 ready

## Problem
Pausing and playing a build from the CLI (0070) means leaving the panel, where the user is watching the build, for a terminal.

## Outcome
Each running build in the queue has a pause icon on the left of its row, which turns into a play icon while it's paused.

## Acceptance criteria
1. A `building` or `reviewing` ticket in the queue whose build `speck run` launched and is running shows a pause icon in the space on the left of its top row, and one that's paused shows a play icon there instead. Other queue tickets show no icon there. Each icon's hover text says what it does ("Pause build" or "Play build").
2. Clicking the pause icon pauses the build exactly as `speck pause <id>` does, and clicking the play icon plays it exactly as `speck play <id>` does. Clicking either opens or closes nothing.
3. The server accepts the pause and play requests only with the same `Origin` and `X-Speck-Token` checks as Set ready; anything else gets 403 and changes nothing. When the server refuses, the reason shows under the row's top row until the next click on the icon.
4. A paused ticket's dot of light stops moving and its row shows "Paused" beside the counter, until it's played.

## Out of scope
- The stop button (0073).

## Notes
- After 0069, which changes the same row, and after 0070, which does the pausing and playing.
- The space on the left is the empty `rank` span in `queueItem` in `templates/panel.html`.
- product.md's Queue description needs updating.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
