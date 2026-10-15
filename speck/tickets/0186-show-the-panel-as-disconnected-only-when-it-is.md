---
id: "0186"
title: "Show the panel as disconnected only when it is"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-15T12:11:30.695Z"

---
# 0186 · Show the panel as disconnected only when it is

**Status:** 🔨 building

## Problem
Every now and then the panel shows "Disconnected: can't reach speck panel" across the top, and it goes again a moment later. The page treats any answer to its 2-second request for the board that hasn't come back in time as a lost connection, but the panel is only slow: on 2026-10-14 each answer took 0.5 to 0.9 seconds with one build running, and longer during test runs or with a phone and a laptop both open.

## Outcome
The panel shows "Disconnected" only when it really can't reach the panel, never because an answer was slow.

## Acceptance criteria
1. An answer to the page's request for the board that takes longer than 2 seconds isn't treated as a disconnection: the page waits for it, for up to 15 seconds, and sends no other request for the board while one is waiting.
2. The "Disconnected" notice shows only once the page has had no answer from the panel for 10 seconds, and goes as soon as an answer arrives.
3. One failed reading of the board ("couldn't read the tickets") shows no notice. The notice shows only when readings have failed for 10 seconds in a row.
4. No test that passed before this change fails, except checks of the old rule (the notice shows when a request is still waiting after 2 seconds), which change to check criteria 1 to 3.

## Out of scope
- Replacing the 2-second polling with updates pushed from the panel (0187).
- How long the panel takes to answer (0176, 0177).

## Notes
- `poll()` in `templates/panel.html` aborts a request still waiting when the next is due and calls `setConnected(false)`, which shows the notice.
- Reported on 2026-10-14: the notice flashes up and goes "because of the 2 second load".
- 0187 replaces the polling this changes, so keep this small: it's the fix for now.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
