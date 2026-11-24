---
id: "0723"
title: "Steady the 0182 AC3 Chromium test under load"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: "bug"                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-12-fix-0182-ac3-failing-in-the-full-suite.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T11:55:06.030Z"

---
# 0723 · Steady the 0182 AC3 Chromium test under load

**Status:** 🔨 building

## Problem
The 0182 AC3 test ("Chromium has closed within 10 s of a test file finishing that ran out of time") fails now and then in the full suite on a busy machine, then passes on retry. Each failure turns main red, so speck run raises fix tickets and builds can't trust the baseline.

## Outcome
The 0182 AC3 test passes on a busy machine and still catches Chromium left running.

## Acceptance criteria
1. The 0182 AC3 test passes 10 runs out of 10 while the machine is under the load speck's own steadying tests use (as in 0689).
2. It still fails when Chromium really is left running after a test file runs out of time.
3. No test that passed before this change fails.

## Out of scope
- Other timing tests.

## Notes
- The test is `test/panel-0182.test.mjs`. Seen failing in full-suite records from 2026-10-23 to 2026-11-11, and twice in `speck/.cache/flaky/flaky.log` (2026-11-12 and 2026-11-15); the latest full suite on main (2c2af9f) passed. The failure is "Chromium still running 10 s after the test file finished": the cleanup is late, not missing. 0689 replaced fixed bounds with ones measured in the test.
- Failing before this build: none
- Checked under load before changing anything (2026-11-24, 16 cores): the four 0182 AC3 tests passed 10 runs out of 10 with one busy loop per core beside them (load average up to 37), and 54 runs of the timed-out case alone, six to eight at a time and starved with `nice` under two busy loops per core (load up to 65), all had Chromium gone by the time the file finished. The failure didn't reproduce here, so the change takes out the two ways it can happen rather than one seen cause.
- Cause found: the test runner stops a file that runs out of time with SIGTERM and doesn't wait for it. browserPage's clean-up then ended Chromium from the process's exit handler, which can't wait, so a Chromium slow to die (as under heavy load or swapping) could outlive the file. And the 10 s check could fail on a single `ps` listing that began before the 10 s were up: under load one listing took up to 7 s here.
- What changed: a file stopped with a signal now ends its Chromium and waits for it to have exited, up to 5 s, before it exits (`test/support/panel.mjs`); the 10 s check fails only on a listing that began once the 10 s were up. The 0182 helpers moved to `test/support/chromium-file.mjs` so the 0723 tests share them.
- AC1 under load, after the change (2026-11-24): the four 0182 AC3 tests passed 10 runs out of 10 with two busy loops per core beside them, at load averages of 55 to 88; the 0723 tests passed 3 runs out of 3 at 94 to 97.
- AC2 checked by breaking it: with browserPage's clean-up not ending Chromium, the 0182 AC3 --test-timeout test fails with "Chromium still running 10 s after the test file finished". The 0723 AC2 test checks the same with a file that drops the clean-up.
- Self-check: no changes (a second signal during the wait only skips the wait, as Chromium has already been sent SIGKILL; files that import tmp.mjs exit through its handler first, as before).
- Pictures: none, because nothing anyone sees changes.
- speck (2026-11-24 12:26 UTC) told you: The build is slow because of its own checks, not a fault: it ran the Chromium test ten times with busy loops on every core, as its first criterion asks, then ran about 2,800 related tests on a machine with a load average above 100. That related run hit the builder's 10-minute command limit, so it has started it again in the background and is waiting for it; the test output shows it still passing. Why: The log shows the 0182 test passing 10 of 10 under load and the work since then spent on the timed-out related run, the newest test output has no failures, and load averages of about 60 to 160 explain the slowness without anything broken on main.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
