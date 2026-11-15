---
id: "0681"
title: "Set several tickets ready with one command"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 4              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
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
after: []                # ticket ids that must be done first
created: 2026-11-15

---
# 0681 · Set several tickets ready with one command

**Status:** 📋 ready

## Problem
Gate 1 takes one command per ticket: `speck set <id> status ready`. After a round of ticket writing leaves several drafts, setting them ready means running it once for each and reading each result.

## Outcome
One command sets several named tickets ready.

## Acceptance criteria
1. `speck set <id> <id>… status ready`, with two or more ids, runs the ready check on each ticket, sets each one that passes ready and commits it as `speck set <id> status ready` does, one commit per ticket, in the order given.
2. A ticket that fails the ready check, or that `speck set <id> status ready` would refuse for any other reason, is left unchanged, and the others are still set ready. The command names each ticket it left, with the reason, and exits with a failing code when it left any.
3. Several ids with any other field or value are refused with the usage line, and nothing changes.
4. `speck help` and the brief's `speck set` row show the form.
5. No test that passed before this change fails.

## Out of scope
- Setting every draft ready without naming them: you still name each ticket.
- The panel.
- Changing other fields on several tickets at once.

## Notes
- `cmdSet` in `scripts/speck.mjs`. Each ticket keeps its own `speck(<id>): ready` commit, which `speck run` and `speck start` look for.
- The ticket skill's rule stands: an agent sets a ticket ready only when you've named that ticket.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
