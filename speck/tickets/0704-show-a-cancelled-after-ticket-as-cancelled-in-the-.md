---
id: "0704"
title: "Show a cancelled after: ticket as cancelled in the panel"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: "bug"                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-15-show-a-cancelled-after-ticket-as-cancelled-in-the-panel.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0703"]                # ticket ids that must be done first
created: 2026-11-24
built_on: "0703"
started: "2026-11-24T12:41:02.053Z"

---
# 0704 · Show a cancelled after: ticket as cancelled in the panel

**Status:** 🔨 building

## Problem
speck run and `speck start` say a cancelled ticket must come out of `after:`, but the panel still shows a ticket waiting on it with a lock and "Waiting on <id>", so someone reading only the panel waits for a ticket that will never ship.

## Outcome
The panel says an `after:` ticket was cancelled and should be taken out of `after:`.

## Acceptance criteria
1. A ticket whose `after:` names a cancelled ticket says, on its card and in its full view, that that ticket was cancelled and should be taken out of `after:`, naming it, instead of showing a lock with "Waiting on <id>" or "after <id>".
2. Its chain or Waits on facts show the cancelled ticket as cancelled, not as queued or waiting.
3. A ticket whose `after:` names both a cancelled ticket and an unfinished one still says it waits for the unfinished one.
4. A ticket whose `after:` names no cancelled ticket reads as it does today.
5. No test that passed before this change fails.

## Out of scope
- Changing `after:` for you, or how speck run treats a cancelled `after:` ticket (0686).

## Notes
- 0686 added `after_cancelled` to `speck status --json`; nothing in `templates/` reads it yet. `chainIcon`, `whereLine`, `DEP_WORDS` (`templates/panel.js`) and `depsOf` (`templates/panel-model.js`, which counts a cancelled ticket as queued) are where it shows.
- Waits for the Plan card chain ticket, which changes the same chain and Waits on facts.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
