---
id: "0740"
title: "Keep a ship's tests from turning the main checkout bare"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "deep"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
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
# 0740 · Keep a ship's tests from turning the main checkout bare

**Status:** 📝 draft

## Problem
At 18:02:36 on 2026-11-24, during 0738's ship, `core.bare = true` was written to the main checkout's `.git/config`. Git then refused to work there, so the panel loaded no data, two later ships moved `main` without updating the files on disk, and builds stopped before starting. It can happen again on any ship until the cause is found.

## Outcome
Nothing a ship or its tests run can make the main checkout bare, and a ship refuses to go ahead if it finds it so.

## Acceptance criteria
1. The cause is found and named in the ticket's Notes: which command, run by which test or script, wrote `core.bare = true` to the main checkout. (checked by review)
2. Running the quick tests (`commands.test`) from the main checkout, as `speck ship` does, with `GIT_DIR`, `GIT_WORK_TREE` and `GIT_INDEX_FILE` set to the main checkout's in the environment, leaves its `.git/config` byte for byte as it was.
3. Every test helper that creates a bare repository creates it only in its own temporary folder, whatever git variables the environment holds.
4. When the main checkout isn't a work tree (`core.bare` is true), `speck ship` and speck run's ship queue refuse to ship, change nothing, and say that the main checkout's `core.bare` is set and how to set it back.
5. No test that passed before this change fails.

## Out of scope
- Repairing a checkout that has already fallen behind `main`: done by hand on 2026-11-24.

## Notes
- Evidence: `.git/config` was last written at 18:02:36, the second 0738's merge commit was made (`speck/.cache/runs/0738.ship.log`, whose quick tests ran 3,951 tests just before). The 0739 and 0738 ships then updated `main` without touching the index or files on disk.
- Places that run `git init --bare`: `test/support/ship.mjs`, `test/support/pr.mjs`, `test/support/doc-ship.mjs`, `test/tmp-cleanup.test.mjs`, and others found by `grep -rln -- --bare test/`. `git init` reinitialises the repository `GIT_DIR` names when that is set, so one leaked into a test's git command would make the main repository bare.
- Fixed by hand on 2026-11-24: `git config core.bare false`, then the files changed by the 0739 and 0738 ships restored from `HEAD`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
