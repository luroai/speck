---
id: "0702"
title: "Keep Shipped's figure labels whole at middle widths"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: "bug"                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "quick"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-10-keep-shipped-s-figure-labels-whole-at-middle-widths.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T11:55:03.414Z"

---
# 0702 · Keep Shipped's figure labels whole at middle widths

**Status:** 🔨 building

## Problem
Between about 480 and 760 px wide, Shipped's figures switch to four columns that are too narrow for the longer labels ("median review rounds", "median builder tokens"), so they end in an ellipsis. A side-panel column or a small tablet often sits in that range.

## Outcome
Every label in Shipped's figures shows whole at every width.

## Acceptance criteria
1. At every window width from 375 to 800 px, every label in Shipped's figures shows its full text, with no ellipsis.
2. At window widths of 800 px and more, the figures show four columns, as they do today at the full 720 px column.
3. No test that passed before this change fails.

## Out of scope
- The By model table under the figures (0694).

## Notes
- The grid is `.stats` in `templates/panel-cards.css`, switching at 480 px through a clamp rather than a media query; `.stat .label` is `nowrap` with an ellipsis. `test/panel-0606.test.mjs` AC2 requires no media query of its own (0140), so prefer a fix that keeps to that, such as moving the clamp's width or letting labels wrap.
- speck (2026-11-24 12:27 UTC) told you: The build is slow because the machine is overloaded, not because anything is broken. Its change is small and in place, but its test runs keep taking 8 minutes or more, and the tests that start a real panel or browser time out with a different set failing each run. Why: The load average is near 100, and every failure in the log is a panel that didn't start or a browser that didn't answer in time, never a wrong result, and they change from run to run.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
