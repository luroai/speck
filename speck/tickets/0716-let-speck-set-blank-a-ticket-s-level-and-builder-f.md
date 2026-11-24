---
id: "0716"
title: "Let speck set blank a ticket's build settings"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "quick"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-12-let-speck-set-blank-a-ticket-s-level.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T14:23:00.891Z"

---
# 0716 · Let speck set blank a ticket's build settings

**Status:** 🔨 building

## Problem
Someone working from the terminal, or an agent, can give a ticket a level or its own builder and model but can't take them off again without editing the file by hand, while the panel can. `speck set` lets only `priority` take an empty value.

## Outcome
`speck set <id> <field> ""` blanks a ticket's level, builder and reviewer fields.

## Acceptance criteria
1. `speck set <id> level ""` writes `level: ""` to the ticket, as the panel's Default choice does, and says the field is now blank.
2. The same works for `builder`, `builder_model`, `builder_effort`, `reviewer`, `reviewer_model` and `reviewer_effort`.
3. Blanking any of these is refused for a ticket being built, as setting any other value is.
4. Fields that can't be blank, such as `title` and `status`, still give the usage message when given "".
5. No test that passed before this change fails.

## Out of scope
- The panel, which already blanks level, builder and model.

## Notes
- `cmdSet` in `scripts/speck.mjs` allows an empty value only for `priority`. `scripts/panel-level.mjs` already blanks a level through the same `checkSetValue`/`checkSetTicket`.
- Failing before this build: none
- Self-check: no changes

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
