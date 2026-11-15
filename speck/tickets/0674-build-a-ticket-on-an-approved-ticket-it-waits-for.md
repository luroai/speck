---
id: "0674"
title: "Build a ticket on an approved ticket it waits for"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 4              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0673", "0679"]                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T14:29:51.279Z"

---
# 0674 · Build a ticket on an approved ticket it waits for

**Status:** 🔨 building

## Problem
A ticket with `after:` can't start until every ticket it names has shipped, even when the one it waits for is approved and only waiting to ship. Where you ship by hand, that wait lasts until you next look.

## Outcome
A ticket can be started on the approved work of the one ticket it still waits for, and ships after it.

## Acceptance criteria
1. `speck start <id>` starts a ticket whose `after:` tickets are all done except one that's approved. Its branch starts from that ticket's branch, so the work it needs is there. With an `after:` ticket in any other state, or more than one not done, it refuses as today.
2. While the ticket it was built on hasn't shipped, each review round's diff and `speck diffstat` count only this ticket's own change, not that ticket's.
3. `speck ship <id>` refuses while the ticket it was built on isn't done, naming it, whether or not the `after:` link is still in the ticket. Auto-ship leaves such a ticket approved, giving that as its reason, without spending a hand-back. Once that ticket is done, it ships as any other.
4. `docs/brief.md` says, where it says each build starts from the latest base branch and where it describes `after:`, that a ticket can start from an approved ticket it waits for.
5. No test that passed before this change fails.

## Out of scope
- `speck run` starting such a ticket by itself: 0675.
- Starting on a ticket that's still building or reviewing: its code changes with each round.
- A ticket waiting on two or more tickets that haven't shipped.

## Notes
- 0094 made `speck start` refuse until every `after:` ticket has shipped. This relaxes it for one approved ticket.
- `speck ship` lands a branch with `git merge --no-ff`, so once the first ticket ships its commits are in the base branch and the second merges without repeating them.
- If the first ticket gets a merge round after the second has started, the second meets that at ship as any conflict.
- Measured 2026-11-15: in this repo, with auto-ship on, a ticket goes from approved to shipped in a median 4 minutes, so the gain here is small. It's larger where approved tickets wait for you to ship them.
- `cmdStart` in `scripts/speck.mjs` makes the branch, `reviewSince` in `scripts/review.mjs` and `scripts/diffstat.mjs` measure the change, and `autoShipWhyNot` in `scripts/ship.mjs` gives auto-ship's reasons.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
