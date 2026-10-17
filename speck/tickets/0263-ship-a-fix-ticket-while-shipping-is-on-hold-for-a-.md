---
id: "0263"
title: "Ship a fix ticket while shipping is on hold for a failing base branch"                # one outcome, no "and"
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
created: 2026-10-17
started: "2026-10-17T08:53:19.305Z"

---
# 0263 · Ship a fix ticket while shipping is on hold for a failing base branch

**Status:** 🔨 building

## Problem
When a ship finds the base branch's own tests failing, `speck run`'s ship queue holds every ship until the base branch has a new commit. The fix ticket that would give it that commit waits behind the hold too, so nothing ships until someone ships the fix by hand. This happened with 0262 on 2026-10-17: it was approved and covered by `auto_ship`, but it sat unshipped.

## Outcome
While shipping is on hold for a failing base branch, speck run still ships an approved fix ticket that `auto_ship` covers, so a broken base branch is mended without anyone stepping in.

## Acceptance criteria
1. While the ship queue is on hold for the base branch's commit, an approved ticket with `type: fix` that `auto_ship` covers is shipped on the queue's next check, without the base branch getting a new commit first.
2. While the hold is on, approved tickets of any other type still aren't shipped until the base branch has a new commit, as today.
3. When the fix ticket's own ship ends without shipping, the hold stays on, and that fix ticket isn't tried again until the base branch or its branch has a new commit.
4. When speck run ships a fix ticket during a hold, it prints a line saying it's shipping that fix ticket despite the hold.

## Out of scope
- Which tests a refusal blames on the base branch: 0264.
- Making fix tickets automatically. The build's "Base branch failing" steps already do that.

## Notes
- The hold is in `scripts/ship-queue.mjs` (`hold`, set on exit 14 in `ended`, checked first in `check`). `shipOrder` already puts fix tickets first.
- Seen on 2026-10-17: 0257's ship exited 14, the hold went on, and 0262 (type fix) was approved at 07:09 but not shipped.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
