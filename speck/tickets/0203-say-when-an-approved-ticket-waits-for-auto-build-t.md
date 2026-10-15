---
id: "0203"
title: "Say when an approved ticket waits for Auto-build to ship it"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-15-say-an-auto-ship-ticket-waits-for-speck-run-when-it-s-off.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0201"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T14:44:29.016Z"

---
# 0203 · Say when an approved ticket waits for Auto-build to ship it

**Status:** 🔨 building

## Problem
Since 0194 only `speck run`'s ship queue ships approved tickets that `auto_ship` covers. When `speck run` is off, nothing will ship them, yet the panel says "Approved · waiting to ship" with the builder badge at work, so the user waits for a ship that never starts.

## Outcome
When Auto-build is off, an approved ticket that only `speck run` would ship says it's waiting for Auto-build, in purple, as something waiting for the user.

## Acceptance criteria
1. While `speck run` is off, an approved ticket that `auto_ship` covers, with no ship running, says "Approved · turn on Auto-build to ship it", in purple like other tickets waiting for the user, and its builder badge stands still.
2. Once `speck run` is on again, the same ticket says "Approved · waiting to ship" in the normal text colour, with its badge moving, as 0196 set out.
3. A ticket that's shipping, by anyone, shows as shipping whether `speck run` is on or off.
4. An approved ticket that `auto_ship` doesn't cover looks as it does today.
5. No test that passed before this change fails.

## Out of scope
- Starting `speck run` from the ticket.
- The header button (0199).

## Notes
- Asked for 2026-10-15, for release 0.4.0.
- Failing before this build: none
- Decided 2026-10-15: purple, because the user needs to act (turn Auto-build on). This settles the note's open question.
- `doing()` and `ship_waiting` in `templates/panel.html` (0196); `state.run.on` says whether `speck run` is on.
- Builds after 0201: all three change the Build list's cards in `templates/panel.html`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
