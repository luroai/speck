---
id: "0327"
title: "Launch a ticket again once it's set ready after its build never started"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
created: 2026-10-19

---
# 0327 · Launch a ticket again once it's set ready after its build never started

**Status:** 📋 ready

## Problem
When a build ends without starting its ticket (it stopped to ask about the ticket before changing anything), speck run won't launch that ticket again until speck run itself restarts, even after the ticket is fixed and set ready again. On 2026-10-19, 0322's criterion was corrected and the ticket set ready again, but it only built after speck run was restarted by hand.

## Outcome
A ticket whose build never started is launched again as soon as it's set ready again and that's committed on the base branch, with no restart.

## Acceptance criteria
1. After a ticket's build ends with the ticket still ready, speck run doesn't launch it again while nothing about it changes, as today.
2. Once the ticket is set ready again, from the panel or with `speck set <id> status ready`, and committed on the base branch, speck run launches it on its next check, without restarting.
3. A change committed to the ticket with its status still ready, such as an edited criterion, counts as setting it ready again.
4. The Foreman's detail stops saying the ticket won't be launched again once it qualifies to be launched.
5. A ticket ended by `speck stop` is launched again only once it's set ready again and committed, as today.

## Out of scope
- Tickets whose build did start.

## Notes
- speck run keeps the tickets it has launched in `launched` in `scripts/run.mjs`, and a ticket whose build ended without starting stays there (search for "the build never started it"). Tickets ended by `speck stop` already wait for the ticket to be set ready again and committed (search for "set ready again and committed"); the same check can apply here.
- `speck set <id> status ready` on a ticket that's already ready leaves the file unchanged, so criterion 3 is what makes a fixed ticket count.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
