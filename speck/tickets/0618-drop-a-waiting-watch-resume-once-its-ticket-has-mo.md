---
id: "0618"
title: "Drop a waiting watch resume once its ticket has moved on"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-09-drop-a-waiting-watch-resume-once-the-ticket-has-moved-on.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T09:57:13.396Z"

---
# 0618 · Drop a waiting watch resume once its ticket has moved on

**Status:** 🔨 building

## Problem
When the watch agent asks for a build to be resumed and speck run has to wait for a free build slot, the resume still runs once a slot frees up, even if the ticket has moved on meanwhile, so it can restart a build you've already carried on, or one on a ticket that has since finished, on an old instruction.

## Outcome
A watch resume that's waiting for a slot is dropped once its ticket has moved on, as a waiting decide is.

## Acceptance criteria
1. A resume the watch agent asked for keeps the ticket's status, its branch's commit and its build's session from when it was asked.
2. If, before a slot frees up, the ticket's status changes, its branch gets a new commit, its session changes or that session is in use, the resume is dropped and `speck run` says so once in its log.
3. Otherwise it runs as it does today.
4. No test that passed before this change fails.

## Out of scope
- `speck watch decide`, which 0567 already handles.

## Notes
- Asked for 2026-11-10 for release 1.0.0: "Create them all, set them all ready", from the follow-ups builders filed during the redesign.
- From round 1 of 0567's review. The check is `movedOn` in `foremanAgentQueue` in `scripts/foreman-agent.mjs`, used today only for `decide`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: a resume on a blocked ticket kept `building`, as a decide does, so it would have been dropped though nothing moved on; it now keeps the ticket's own status.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
