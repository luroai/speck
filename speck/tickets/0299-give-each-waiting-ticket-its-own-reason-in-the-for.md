---
id: "0299"
title: "Give each waiting ticket its own reason in the Foreman's detail"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0294"]  # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T14:08:11.858Z"

---
# 0299 · Give each waiting ticket its own reason in the Foreman's detail

**Status:** 🔨 building

## Problem
While speck run waits to switch to new code, the Foreman's detail gives that as the reason for every ready ticket, though most are waiting for other tickets in their `after:` list, and its Shipping section says "Nothing is waiting to ship" while an approved ticket shows "Approved · waiting to ship" on the board. Seen on 2026-10-18: 0295, 0296 and 0298 all said "speck run is switching to new code once the build of 0287 ends", while 0295 was waiting for 0294 and 0287, and 0294 was approved and held.

## Outcome
The Foreman's detail gives each waiting ticket its own reason, says once what is holding everything up, and lists every approved ticket waiting to ship with why it isn't shipping yet.

## Acceptance criteria
1. A ready ticket that is waiting for tickets in its `after:` list shows that reason, naming the tickets not yet done, whatever else is going on, such as speck run switching to new code or all build slots being in use.
2. When something holds up all builds or ships (speck run switching to new code, or shipping on hold for a failing base branch), the detail says so once, above its sections, and a ticket's line gives that reason only when nothing of its own holds it up.
3. Every approved ticket that `auto_ship` covers and isn't shipping now is listed under Shipping, with why it's waiting: another ship is running, shipping is on hold, speck run is switching to new code, its last ship was refused (with the message), or it's next.
4. "Nothing is waiting to ship" shows only when no approved ticket that `auto_ship` covers is waiting.
5. `speck status` gives the same reasons as the panel's detail.

## Out of scope
- Showing tickets' titles in the detail: the user wants the ids only.

## Notes
- The reasons are recorded by speck run (`run.foreman.json`) and read by `foremanView` in `scripts/foreman.mjs`. The detail is drawn in `templates/panel.html` (search for "Ready, not building").
- Failing before this build: none
- Self-check: no changes. Reordered speck run's own-reason checks (after, unstarted, stopped, uncommitted) ahead of the build-slots check, so a ticket's own reason wins over all slots in use too. Changed two 0285 tests for the new behaviour: the ship state now also has `waiting`, and `speck status` gives the hold once, first.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
