---
id: "0678"
title: "Share test turns across every project on this machine"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
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
after: ["0677"]                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T14:40:15.115Z"

---
# 0678 · Share test turns across every project on this machine

**Status:** 🔨 building

## Problem
`max_parallel_tests` limits test runs within one repo, so each project building on a machine runs its tests at the same moment as the others'. Tests that depend on timing then fail by chance: this repo has needed 13 fix tickets for tests that fail only when the machine is busy, and its watch notes record load averages of 25 to 84 on 16 cores.

## Outcome
One setting limits how many test runs go at once across every project on the machine.

## Acceptance criteria
1. `speck config set machine_parallel_tests <n>`, with a whole number of 1 or more, run in any project, saves the limit for every project of yours on this machine, in your home folder's speck settings and not in the repo. `speck config set machine_parallel_tests ""` removes it, and `speck config show` in any project shows it. Without it, nothing changes.
2. With it set to n, no more than n test runs speck starts go at once across all your projects on this machine, the full suite's run included. A run beyond that waits, saying once that it's waiting for a turn on this machine, and starts when one ends.
3. Each project's own `max_parallel_tests` still holds within it, a test run speck starts while it already holds a turn runs in that turn, and a turn held by a process that has died is freed.
4. The brief describes `machine_parallel_tests` in its `speck test` row and in its `speck config set` row.
5. No test that passed before this change fails.

## Out of scope
- Limiting builds or agents across projects.
- One speck service for every project on a machine (`speck/ideas/2026-11-10-run-a-software-factory-from-one-speck-service.md`), where this limit would live later.

## Notes
- Checked 2026-11-15: how much of that load came from other projects' test runs can't be measured after the fact. At 14:40 the load average was 35 on 16 cores and every busy process was this repo's own (its full suite and two builds), so this repo loads the machine by itself. The limit counts the full suite's run for that reason, and helps a single project too.
- Turns are lock files under the main checkout's `speck/.cache/tests` (`turnsDir` and `inTurn` in `scripts/turns.mjs`). `~/.config/speck/` already holds this machine's private words and panels.
- The suite's own tests mustn't read or write the real home folder's settings (as 0654 did for agents).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
