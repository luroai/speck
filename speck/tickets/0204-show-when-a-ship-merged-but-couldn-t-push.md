---
id: "0204"
title: "Show when a ship merged but couldn't push"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-14-show-when-a-ship-merged-but-couldn-t-push.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0203"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T14:57:48.916Z"

---
# 0204 · Show when a ship merged but couldn't push

**Status:** 🔨 building

## Problem
`speck ship` sets a ticket done before it pushes the base branch. If the push fails, the panel moves the ticket to Shipped as if all went well. Now that `speck run`'s queue ships with nobody watching, nobody learns that the remote is behind.

## Outcome
A ticket whose ship merged but couldn't push says so in the panel, with what to do, until the base branch has been pushed.

## Acceptance criteria
1. When a ship, started by anyone, merges a ticket but the push of the base branch fails, the panel shows that ticket in Shipped with "Merged, but not pushed" and `speck ship`'s message saying how to fix it.
2. The message stays until the base branch's commit with that ticket has reached the remote; then the ticket shows as plainly shipped.
3. `speck status --json` gives the same: each such ticket with the failed push's message.
4. A ship that pushes, or a repo with no remote, shows as it does today.
5. No test that passed before this change fails.

## Out of scope
- Retrying the push.
- Ships that refuse before merging.

## Notes
- Asked for 2026-10-15, for release 0.4.0.
- Decided 2026-10-15: it covers ships the user starts too, not only auto-ships.
- The push and its error are near the end of `scripts/ship.mjs`. The ship record (`takeShip`/`endShip`) keeps an auto-ship's failure message; the panel shows it only on an approved ticket, and this one is done.
- Builds after 0203: both change how the panel shows a ship's result in `templates/panel.html`.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
