---
id: "0707"
title: "Show the machine-wide test limit in Settings"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
source: "speck/ideas/done/2026-11-15-show-machine-parallel-tests-in-the-settings-view.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0729"]                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T18:49:47.995Z"

---
# 0707 · Show the machine-wide test limit in Settings

**Status:** 🔨 building

## Problem
0678 added `machine_parallel_tests`, a limit on test runs across every project on the machine, but only `speck config set` and `speck config show` reach it. Someone who tunes speck from the panel won't know it exists, or that it's set.

## Outcome
Settings shows `machine_parallel_tests` beside `max_parallel_tests`, and it can be changed there.

## Acceptance criteria
1. Settings shows `machine_parallel_tests` right after `max_parallel_tests`, with its current value from the home folder (blank when it isn't set), and says it applies to every project on this machine, not only this one.
2. Saving a whole number there writes it to the home folder's settings, as `speck config set machine_parallel_tests <n>` does, and changes nothing in the repo: `speck/config.yml` is unchanged and no commit is made.
3. Saving it blank removes it, as `speck config set machine_parallel_tests ""` does.
4. A value `speck config set` refuses, such as 0, is refused in Settings with the same reason, and nothing is saved.
5. No test that passed before this change fails.

## Out of scope
- Other home-folder settings, which don't exist yet.

## Notes
- `addHomeSettingRow` (`scripts/home-settings.mjs`) is called only by `speck config show`, not by `panelSettings` (`scripts/settings.mjs`). `setHomeSetting` prints and throws `SpeckError`, so the panel needs a quiet way to save. The view's "saved for your machine only" wording doesn't fit a setting shared by every project.
- speck (2026-11-24 13:51 UTC) I'll resume 0707 at 14:45 UTC: 0707 has to come after 0729, which is approved but still waiting in speck run's ship queue behind 0704's ship, so starting now would only be refused again; by 14:45 UTC both ships should have finished. Its instruction: Check that 0729 has shipped to main, then start 0707 on top of the latest main and build it; if 0729 still hasn't shipped, stop again without changing anything
- 2026-11-24: its first build stopped before starting, as it began on 0729's approved work while that conflicted with main and the main checkout had been made bare. Set ready again once 0729 shipped.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
