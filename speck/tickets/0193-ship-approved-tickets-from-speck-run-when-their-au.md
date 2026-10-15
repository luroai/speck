---
id: "0193"
title: "Ship approved tickets from speck run when their auto-ship didn't finish"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T09:41:50.165Z"

---
# 0193 · Ship approved tickets from speck run when their auto-ship didn't finish

**Status:** 🔨 building

## Problem
When a build's auto-ship can't finish (the base branch's tests were failing, the tests stalled, or staged files were in the way), its ticket stays approved until the user runs `/speck-ship`, even after the cause has gone. On 14 October approved tickets sat waiting after `main` was fixed, until they were shipped by hand.

## Outcome
While `speck run` is on, it ships each approved ticket that `auto_ship` covers, one at a time, once whatever stopped its last ship has changed, so no such ticket waits for the user.

## Acceptance criteria
1. While `speck run` is on, an approved ticket that `auto_ship` covers (as `speck ship --auto` decides it) is shipped by `speck run` running `speck ship <id> --auto` for it. It starts no ship while any ship is running in the repo, whoever started it, so at most one ship runs at a time. When more than one ticket is waiting, fix tickets (`type: fix`) go first, then the one approved earliest.
2. `speck run` tries a ticket again only when something has changed since its last try: the base branch or the ticket's branch has a new commit. A ticket whose last try refused, with neither changed, isn't tried again, however long `speck run` keeps running, and the refusal is printed in `speck run`'s output once, not on every check.
3. When a ship that `speck run` started exits 14 (the base branch's own tests are failing), `speck run` starts no other ship until the base branch has a new commit, and says once in its output that shipping is on hold until the base branch passes.
4. `speck run` never ships an approved ticket that `auto_ship` doesn't cover (its risk isn't in `auto_ship_risk`, or `auto_ship` is off), nor a ticket in any other status. Turning `speck run` off doesn't stop a ship it started: the ship carries on to its end, as builds do.
5. No test that passed before this change fails.

## Out of scope
- Builds still run `speck ship <id> --auto` themselves and handle conflicts and a failing base branch as now. Moving every ship to `speck run` is 0194.
- Showing the queue in the panel (0105 was cancelled; the panel's existing "Shipping…" and "Auto-ship didn't finish" states stay as they are).
- Retrying flaky tests (0195).

## Notes
- Asked for 2026-10-15: "those two tickets are essentially creating a separate single shipping process which handles the shipping of all things in its own queue? This was an idea we discussed a few days ago but opted to go with a single WIP limit instead. If this is correct, then start those 2 tickets."
- This revives part of the ship queue cancelled on 11 October (0102 to 0105) when speck moved to one build at a time (0111). The causes given then (leaked processes running the machine out of memory, builds inheriting a broken `main`) have since been fixed by 0175 and 0192. The brief's section 7 is updated in 0194, once builds no longer ship themselves.
- `speck ship` already keeps a record of a ship in progress (`takeShip` in `scripts/ship.mjs`), which the panel reads; "any ship running" in AC1 can use it.
- The builder decides how `speck run` remembers its last try per ticket; it must survive a restart of `speck run` only as far as AC2 needs (a restart may try each waiting ticket once more).
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
