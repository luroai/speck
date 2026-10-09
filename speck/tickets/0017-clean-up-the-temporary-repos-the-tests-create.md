---
id: "0017"
title: "Clean up the temporary repos the tests create"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T10:17:17.173Z"

---
# 0017 · Clean up the temporary repos the tests create

**Status:** 🔍 reviewing

## Problem
The test suite makes a temporary repo or folder for almost every test and never deletes it. Over a day of builds they piled up to about 8,600 folders and used every inode in `/tmp`, so the whole suite failed until they were removed by hand. Builds stall on something unrelated to the ticket.

## Outcome
Running the tests leaves nothing behind in the system temporary folder, whether tests pass or fail.

## Acceptance criteria
1. After `npm test` finishes, the system temporary folder holds no new files or folders created by the run (compare a listing taken before and after).
2. A test that fails still removes the temporary repos and folders it made.
3. If the run is killed part-way, it leaves behind at most the temporary folders of the tests that were running at that moment, not one per test run so far.
4. Every existing test still passes, and none is weakened or removed to get there.

## Out of scope
- Cleaning up folders left by earlier runs.
- Changing what any test checks.

## Notes
- Pre-check: no external facts. AC3 reworded so it's clear it's about a run killed mid-way.
- The temporary folders include fake tool folders (`speck-bin-…`, `speck-fake-…`) and bare remotes, not only repos.
- Approach: `test/support/tmp.mjs`, imported first by every test file, gives each test process its own `speck-test-…` folder, points `TMPDIR`/`TMP`/`TEMP` (so `os.tmpdir()` and every child process) at it, empties it after each test, and removes it on exit, SIGINT, SIGTERM and SIGHUP. A SIGKILL leaves that one folder with only the running test's files.
- Checked 2026-10-09: before the change one `npm test` run left 377 new entries in `/tmp`; after it, a before/after `ls -A /tmp` listing shows none.
- Self-check: no changes (checked failing tests, nested test-runner runs, SIGINT/SIGTERM/SIGKILL, and that no test relies on files kept between tests).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
