---
id: "0775"
title: "Steady the 0067 panel restart tests"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
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
source: "speck/ideas/done/2026-11-25-steady-the-0067-ac2-restart-token-test.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-26
started: "2026-11-26T23:58:09.774Z"

---
# 0775 · Steady the 0067 panel restart tests

**Status:** 🔨 building

## Problem
"0067 AC2: the token survives a restart" and "0067 AC4: new code that fails to start leaves the old server serving, shows the error and the next change tries again" fail now and then on a busy machine, turning builds' and `main`'s test runs red for no real fault.

## Outcome
The two 0067 restart tests pass on a busy machine and still catch a real fault.

## Acceptance criteria
1. 0067 AC2 passes 10 runs out of 10 while the machine is under heavy load (as 0689 and 0723 measured it), and still fails if the token changes across a restart.
2. 0067 AC4 passes 10 runs out of 10 while the machine is under heavy load (as 0689 and 0723 measured it), and still fails if failing new code stops the old server serving.
3. No test that passed before this change fails.

## Out of scope
- Other panel tests.

## Notes
- From 0751's and 0761's builds. 0689 and 0723 replaced fixed waits with bounds measured in the test.
- Failing before this build: none
- Checked under load before changing anything (2026-11-27, 16 cores): the two tests passed 10 runs out of 10 one at a time beside two busy loops per core (load average up to 64), and 12 out of 12 four at a time beside them (load up to 75). They failed 8 out of 8 four at a time with the tests at nice 10 beside the same loops (load about 81), as a test gets less of the machine in a busy related run: on the shared helper's 10 s limit for the panel to print its URL, and on the 5 s wait for the restart. The panel's own 10 s limit for a new server to be ready could fail them the same way, leaving no restart to wait for.
- What changed: the two tests' bodies moved to `test/support/panel-restart.mjs`, so 0775's tests run the same code, and allow 60 s for the panel to start, for each restart or error to be seen and for a new server to be ready. `startPanel` takes how long to wait as an optional last argument (10 s as before), and the panel reads `SPECK_PANEL_START_MS` for its limit on a new server (10 s as before when it isn't set), as it reads `SPECK_PANEL_PING_MS`. The other 0067 tests share the moved helpers unchanged.
- AC1 and AC2 under load, after the change: 12 runs out of 12 four at a time at nice 10 beside two busy loops per core (load 73 to 81), the conditions the old tests failed 8 of 8 in; the longest test took 45 s. Starved further (nice 19, one at a time, load up to 125 with other builds' tests) the panel didn't start even within 60 s, which no limit in the test fixes.
- Still catch a real fault: 0775's tests run the two tests on code broken on purpose: a new server that makes a fresh token (fails on the token), and a server that stops serving once new code has failed (fails on the old server not answering). They also run them with a new server that takes 6 s to load, past the old 5 s.
- AC3: the related run (488 files, as `test/support/panel.mjs` changed) ran beside other builds at a load average of about 77: 96 tests failed, 92 of them on the shared 10 s panel start, the rest on other timing (socket hang ups, a 5 s wait in the 0067 browser test, a counter at 01:14 for 01:05 to 01:09). Run again, those 36 files with this ticket's two passed: 486 tests, none failing.
- Self-check: no changes (a blank, zero or garbled `SPECK_PANEL_START_MS` falls back to 10 s; no test matched the start error's old wording). Before it, the slow-load stand-in was limited to the server's main thread, as the board reader's worker loaded the same code, and the broken-stop stand-in stops on the next not-found request, as one stopping a second later made the test wait out its 60 s.
- Pictures: none, because nothing anyone sees changes.
- speck (2026-11-27 00:35 UTC) told you: The build is slow because of what the ticket asks for: it ran the two restart tests many times under made-up heavy load to show the old code fails and the new code passes. One of those runs hit the 10-minute shell limit. It has now made the fix, got 12 of 12 passes where the old code failed 8 of 8, and is on its last related-test run before review. Nothing is stuck or broken. Why: The build log shows each step moving on, the long stretches are the load tests the acceptance criteria call for, and the load average of about 75 from other builds slows every run further.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
