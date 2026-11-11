---
id: "0630"
title: "Let speck run check the full suite on the base branch after ships"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0629"]                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T10:17:59.098Z"

---
# 0630 · Let speck run check the full suite on the base branch after ships

**Status:** 🔨 building

## Problem
`speck ship` runs the whole of `commands.test` before every merge, so a project with a slow suite, such as speck's own with about 200 real-browser and real-process test files, ships one ticket every four minutes at best, and a flaky slow test refuses ships that broke nothing. A project can't ship on its quick tests today without losing the slow ones altogether.

## Outcome
With `commands.test_full` set, `speck run` runs it on the base branch after ships, and a failure reaches you, so `commands.test` can be the quick tests that ships wait for.

## Acceptance criteria
1. With `commands.test_full` set and `speck run` on, whenever the base branch's newest commit has no recorded `commands.test_full` result and none is running, `speck run` runs `commands.test_full` on that commit, in a checkout of its own rather than the user's or a build's, taking a test turn as `speck test` does, and records its result as `speck test` records one.
2. While the latest recorded full run on the base branch failed, and until a run on a newer commit passes, `speck status` and the panel's black bar count it under Needs you, naming the failing tests when the output is TAP, and `speck run`'s log says so once per failing commit.
3. `speck ship` and builds never run `commands.test_full`, and a failing or running full run doesn't hold up a ship or a build.
4. With `commands.test_full` blank or missing, `speck run` runs no full suite and nothing changes from today.
5. `speck config set commands.test_full "<command>"` sets it, and `speck config show` explains what it does.

## Out of scope
- Raising a fix ticket for a failing full run by itself: it reaches you, and Virgil's own steps for it can come later.
- Changing speck's own `commands.test`: 0631 does that.

## Notes
- From the 2026-11-10 repo analysis: ships take a median of about 220 s, nearly all of it the suite, and about a quarter of tickets needed more than one ship attempt.
- `scripts/results.mjs` (`testRun`, recorded results keyed by code and test command) and the test turns in `scripts/turns.mjs` already exist; a recorded full run on the base branch also gives builds' "Failing before this build" a better baseline.
- `scripts/run.mjs` is at 592 lines against the 600-line limit, so new code needs its own module.
- Failing before this build: none
- Self-check: a full run that can't start called back before its pid was known, which would have thrown; fixed, with a test. A result found recorded for the newest commit wasn't kept as the latest, so the next commit fell back to an older run's; fixed. Tests added for a folder that isn't speck's at the full run's checkout and for the brief's facts.
- Pictures: none, because nothing anyone sees changes shape: the bar already shows Needs you <n>, and speck status gains one line.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
