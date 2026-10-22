---
id: "0376"
title: "Launch a stopped ticket again without restarting speck run"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-19-launch-a-stopped-ticket-again-without-restarting-speck-run.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0375"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T23:50:24.940Z"

---
# 0376 · Launch a stopped ticket again without restarting speck run

**Status:** 🔨 building

## Problem
`speck stop` ends a build, and speck run says to set the ticket ready again and commit it. The speck run that launched it never does: it keeps the ticket on its launched list, so nothing starts until speck run itself is restarted.

## Outcome
The speck run that stopped a build launches that ticket again once it is set ready and that change is committed, without a restart.

## Acceptance criteria
1. When speck run launched a build, `speck stop` ends it, and the ticket is afterwards set ready with that change committed, that same speck run launches the build on its next check.
2. Until that commit, the same speck run does not launch it, and still says to set it ready again and commit it.
3. A build that ended with its ticket still ready, which 0327 launches again once the ticket is committed, still does. A ticket `speck stop` did not end is not launched a second time while the build speck run already launched is the one it has.
4. No test that passed before this change fails.

## Out of scope
- How someone sets the ticket ready again.
- A build that was stopped and whose ticket stays blocked.

## Notes
- Checked 2026-10-22: `ownWait` in `scripts/run.mjs` returns while the ticket is still in `launched`, before `heldByStop`. `readyAgain` in `scripts/build-records.mjs` returns false when `speck stop` ended the build, so the launched list is never cleared for it. `heldByStop` already knows a later commit of the ticket.
- Waits for 0375 so it ships in 0.13.1, not in 0.13.0. It changes `scripts/run.mjs`, not the files the 0.13.0 tickets change.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
