---
id: "0746"
title: "Show the machine-wide build limit in Settings"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-11-24-show-the-machine-wide-build-limit-in-settings.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T23:18:34.320Z"

---
# 0746 · Show the machine-wide build limit in Settings

**Status:** 🔨 building

## Problem
0726 added `machine_parallel_builds`, a limit on builds across every project on the machine, but only `speck config set` and `speck config show` reach it. Someone who tunes speck from the panel won't know it exists or that it's set.

## Outcome
Settings shows `machine_parallel_builds` after Builds at once, and it can be changed there.

## Acceptance criteria
1. Settings shows the machine-wide build limit right after Builds at once, with its value from the home folder (blank when unset), saying it applies to every project on this machine.
2. Changing it saves it straight away to the home folder's settings, as `speck config set machine_parallel_builds <n>` does, changing nothing in the repo; blank removes it.
3. A value `speck config set` refuses, such as 0, is refused with the same reason, and the row goes back to the saved value.
4. No test that passed before this change fails.

## Out of scope
- Other settings.

## Notes
Failing before this build: none
- 0707 did the same for `machine_parallel_tests`: add it to `PANEL_HOME_SETTINGS` and give it a row like `homeRow`'s.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
