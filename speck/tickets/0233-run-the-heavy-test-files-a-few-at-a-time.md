---
id: "0233"
title: "Run the heavy test files a few at a time"                # one outcome, no "and"
status: blocked            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0229"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T21:58:29.681Z"
blocked_at: "2026-10-15T22:12:40.330Z"

---
# 0233 · Run the heavy test files a few at a time

**Status:** ⛔ blocked

## Problem
Test files that start real processes, panels or a browser run alongside everything else, so on a small machine they slow each other down and miss their time limits. On an 8 GB MacBook Air, 26 tests failed on `main` that way, and the machine stayed fully loaded throughout the run.

## Outcome
speck's heavy test files run a few at a time while the light ones run as many at once as today.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. `npm test` runs the test files listed as heavy (those that start real processes, a panel or a browser) at most 2 at a time, and the other files as many at a time as today. The list of heavy files is kept in one place.
2. One `npm test` run still runs every file in `test/` once, its output is read by speck's test summary and retry as today, and it exits with a failure when any test fails.
3. No test that passed before this change fails.

## Out of scope
- Making any single test faster.

## Notes
- 135 of the 181 test files use a support module that starts processes, panels or a browser (`test/support/procs.mjs`, `run.mjs`, `panel.mjs`, `fake-chrome.mjs` and others); not all of them are heavy.
- Builds on the test runner 0229 changes.
- Failing before this build: none
- Measured 2026-10-15 on the build box (16 cores, 14 GB): 88 test files start a real panel, browser or `speck run` (48 of them a browser). The whole suite takes 2 min 47 s today; those 88 files alone, run 2 at a time, take 9 min 21 s, using 7 min of CPU in that time, so they mostly wait rather than work. Built as written, the suite would take over 9 minutes here, every review round of every build.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
Running the 88 heavy test files 2 at a time everywhere makes the whole suite more than 3 times slower on a big machine (2 min 47 s today, over 9 minutes, measured on a 16-core box), so which do you want?
- A: 2 at a time on every machine, as written, accepting the slower suite on big machines.
- B: scale with the machine: at most a quarter of its cores at a time, and never fewer than 2 (2 on an 8-core MacBook Air, 4 on a 16-core box, roughly 5 minutes there).
- C: 2 at a time only on machines with 8 cores or fewer, and as many as today on bigger ones.

I recommend C: it fixes the MacBook Air the ticket is about with the limit the ticket asks for, and costs bigger machines nothing.

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
