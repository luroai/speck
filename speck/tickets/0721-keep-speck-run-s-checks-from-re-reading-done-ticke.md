---
id: "0721"
title: "Keep speck run's checks from re-reading done tickets' logs"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: cursor              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-15-keep-speck-run-s-checks-from-re-reading-build-logs.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T14:39:13.738Z"
--note: "Failing before this build: none"

---
# 0721 · Keep speck run's checks from re-reading done tickets' logs

**Status:** 🔨 building

## Problem
An idle speck run still spends about 1.7 s of processor time per check on this repo, mostly reading every ticket's build log and run records and running git, done tickets included. The cost grows with the project's history, on a machine where tests already fail under load.

## Outcome
An idle check costs about the same however many done tickets there are.

## Acceptance criteria
1. A second board check with nothing changed since the first reads no done or cancelled ticket's build log and starts no git process for any done or cancelled ticket.
2. Each spend record file (watch spend and delegated spend) is read at most once per check, however many tickets there are.
3. When a ticket's build log or run record changes, the next check reads it again.
4. `speck status --json` gives the same output on the same repo before and after this change.
5. No test that passed before this change fails.

## Out of scope
- Tickets still in progress, which may need reading on every check.

## Notes
- `statusData` (`scripts/speck.mjs`) works out, for every ticket: spend (`earlierBuilds` in `scripts/spend.mjs` reads the whole log when the run record has no `builder`; `watchSpent`/`delegatedSpent` read jsonl files per ticket) and `shipState`, `prShown`, `buildSession`, `handedBack`. `logTail` is already cached by stat.
- Test by counting file reads and process starts, not by timing, as `test/run-reads-0682.test.mjs` does.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
