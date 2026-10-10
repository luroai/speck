---
id: "0094"
title: "Refuse to start a ticket until what it waits on has shipped"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-10-a-shipping-agent-that-heals-the-build.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T22:40:08.807Z"

---
# 0094 · Refuse to start a ticket until what it waits on has shipped

**Status:** 🔨 building

## Problem
A ticket can wait on others with `after:`. `speck run` holds it until they've shipped, but `speck start`, which `/speck-build` uses, only checks that the ticket is ready. So building a ticket by hand can start it before the work it depends on is in `main`, on a branch that doesn't have that work.

## Outcome
`speck start` refuses a ticket until every ticket in its `after:` has shipped, and says which ones it's still waiting for.

## Acceptance criteria
1. `speck start <id>` refuses when any ticket in its `after:` isn't `done`. The message names each one with its status (for example `0086 (approved)`) and says the ticket can start once they've shipped. Nothing changes: no branch, no worktree, no status change and no commit.
2. A ticket in `after:` that was cancelled, or an id that matches no ticket, also refuses, naming it and saying it must come out of `after:` before the ticket can start.
3. A ticket whose `after:` tickets are all `done`, or that has none, starts exactly as before.
4. `speck run` keeps waiting for the same thing: it launches a ticket only once its `after:` tickets are `done`.

## Out of scope
- Changing what `speck run` or the panel show for waiting tickets.

## Notes
- `speck run` already waits on `done` (`waiting_on` in `statusData`); this brings `speck start` in line.
- Failing before this build: none
- Self-check: no changes. Checked ids written as numbers, repeated ids, `constructor` as an id, and that resuming a started ticket still reports its worktree (the branch check runs before the after: check). AC3 and AC4 tests passed before the change: they guard existing behaviour.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
