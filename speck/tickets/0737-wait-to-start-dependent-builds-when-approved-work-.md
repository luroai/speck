---
id: "0737"
title: "Wait to start dependent builds when approved work conflicts with main"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: "bug"                # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24

---
# 0737 · Wait to start dependent builds when approved work conflicts with main

**Status:** 📝 draft

## Problem
Since 1.4, speck run starts a waiting ticket on the approved work of the ticket it waits for. When that approved work no longer merges cleanly into `main`, the build can't start and stops at once, and speck run then leaves the ticket as "ended without starting" until someone sets it ready again. On 2026-11-24, 0707 and 0730 both stalled this way behind 0729.

## Outcome
A waiting ticket starts on approved work only when that work merges cleanly into `main`, and otherwise waits for it to ship and starts by itself.

## Acceptance criteria
1. speck run doesn't start a ticket on another ticket's approved work when that work doesn't merge cleanly into `main`; it waits until that ticket has shipped, then starts it from `main` as usual.
2. While it waits for this reason, `speck status` and the panel say it is waiting for that ticket to ship because its approved work clashes with `main`, naming the ticket.
3. A ticket whose build stopped before starting for this reason is started again by speck run once it can start, without being set ready again.
4. When the approved work merges cleanly into `main`, the ticket starts on it as today.
5. No test that passed before this change fails.

## Out of scope
- Settling the clash itself: that happens at the approved ticket's ship, as today.

## Notes
- Made by speck's watch agent on 2026-11-24 when 0730 couldn't start; filled in the same day at the user's say-so.
- Starting on approved work is 0674/0675 (`startsOn`, `afterWait` in `scripts/built-on.mjs`); the "ended without starting" hold is `ownWait` in `scripts/run.mjs`, cleared by `readyAgain` in `scripts/build-records.mjs`.
- `speck merge-check` can tell whether a branch merges cleanly into the base branch.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
