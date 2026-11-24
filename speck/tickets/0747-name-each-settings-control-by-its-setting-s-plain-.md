---
id: "0747"
title: "Name each Settings control by its setting's plain name"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
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
source: "speck/ideas/done/2026-11-24-name-each-settings-control-by-its-setting-s-plain-name.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0746"]                # ticket ids that must be done first
created: 2026-11-24

---
# 0747 · Name each Settings control by its setting's plain name

**Status:** 📋 ready

## Problem
Since 0729, Settings shows each setting by a plain name, but its list, box or switch is still labelled with the key. A screen reader reads the Name box out as "speck_name", and voice control can't find a control by the name on screen.

## Outcome
Every Settings control's accessible name is its setting's plain name.

## Acceptance criteria
1. Each list, box and switch in Settings has its setting's plain name, as shown on its row, as its accessible name, such as "Name" or "Watch", not its key.
2. Where one row has two controls (such as an agent and its effort), each has a name saying which it is, such as "Builder" and "Builder effort".
3. No test that passed before this change fails, except tests that find a control by its key's label, which are changed to find it another way.

## Out of scope
- The rows' look.

## Notes
- From 0729's own note: tests find controls by their key labels; a data attribute holding the key would keep them findable.
- Waits for the machine-wide build limit ticket, which adds a Settings row.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
