---
id: "0686"
title: "Bring a ticket cancelled during its build onto the base branch"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15

---
# 0686 · Bring a ticket cancelled during its build onto the base branch

**Status:** 📋 ready

## Problem
A ticket can be cancelled on its own branch while it's being built, for example when speck takes a blocked question's recommendation to cancel it. The cancel is committed only on the branch, so the base branch still says `ready`. Once the branch's worktree is gone, every ticket with it in `after:` waits for it to ship for ever, and nothing says why: release 0684 waited this way for 0664 on 15 November.

## Outcome
A ticket cancelled on its branch is cancelled on the base branch too, so nothing waits for it.

## Acceptance criteria
1. When a build ends with its ticket `cancelled` on its branch, speck run, at the check that takes up the build's end, cancels the ticket on the base branch with the same `cancel_reason` and `cancelled` date, moves it to `speck/tickets/done/` and commits only that ticket there, as `speck cancel` does.
2. After that, a ready ticket with the cancelled one in `after:` is reported with the message speck already gives for a cancelled ticket in `after:` (that it was cancelled and should be taken out of `after:`), not as waiting for it.
3. A ticket on the base branch that's already `done` or `cancelled` is left as it is, and a build that ends with its ticket in any status other than `cancelled` is taken up as today.
4. When the base branch's copy can't be changed, for example because the main checkout has uncommitted changes to that ticket, speck run says so once in its log, naming the ticket, and tries again at its next check.

## Out of scope
- A ticket built on a cancelled ticket's approved work (`built_on:`): its ship refusal is a separate inbox note.
- Taking a cancelled ticket out of other tickets' `after:` lists by itself.

## Notes
- Found 2026-11-15: 0664's cancel commit (0c473b3f) is only on its branch; `startWaits` in `scripts/built-on.mjs` saw it as ready.
- `speck cancel` refuses while a ticket is being built (`checkNotBeingBuilt`), so this runs once the build has ended. Committing only the ticket on the base branch: `commitTicketOnly` in `scripts/close.mjs`, as the builder stand-in does.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
