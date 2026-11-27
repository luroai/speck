---
id: "0776"
title: "Steady three browser tests on a busy machine"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-11-25-steady-the-0160-ac5-jump-to-ticket-test.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-26
started: "2026-11-27T00:11:41.110Z"

---
# 0776 · Steady three browser tests on a busy machine

**Status:** 🔨 building

## Problem
Three real-browser tests fail now and then on a busy machine: "0160 AC5: in the home-screen app, jumping to a ticket shows it below the header", "0723 AC2: the 0182 AC3 check still fails when Chromium is left running" and "0761 AC2: with something in Plan's list wider than it, a sideways swipe on the list changes lane".

## Outcome
The three tests pass on a busy machine and still catch a real fault.

## Acceptance criteria
1. 0160 AC5 passes 10 runs out of 10 while the machine is under heavy load (as 0689 and 0723 measured it), and still fails if jumping to a ticket leaves it under the header.
2. 0723 AC2 passes 10 runs out of 10 while the machine is under heavy load (as 0689 and 0723 measured it), and still fails when the 0182 AC3 check would let Chromium stay running.
3. 0761 AC2 passes 10 runs out of 10 while the machine is under heavy load (as 0689 and 0723 measured it), and still fails if a swipe on a list with something wider than it doesn't change lane.
4. No test that passed before this change fails.

## Out of scope
- Other browser tests.

## Notes
- From the builds of 0751 and 0769.
- Failing before this build: none
- Causes found (2026-11-27, 16 cores, under 2 to 4 busy loops per core, some from another build's load test):
  - 0160 AC5 read the jumped-to row by its highlight, 600 ms after the jump, and the highlight lasts only 1.5 s: on a busy machine it had gone, so the row wasn't found. It now finds ticket 0001's row by its id and waits, with a time limit, for the row and the header to stay put before comparing them (`jumpedBelowHeader` in `test/support/header-0160.mjs`).
  - 0761 AC2: the panel draws Plan's list again on each 5-second ping, which takes out the test's wide block. A touch keeps to the node it started on, so a swipe that started on the block, taken out partway, never reached the lanes. A slow swipe on a busy machine was more likely to span a ping. The block is now put back as soon as it's taken out (`widenKept` in `test/support/swipe-0761.mjs`).
  - 0723 AC2 failed two ways, both reproduced (3 runs out of 30 at load averages of 110 to 140, 4 busy loops per core, 10 at a time). First: the runner's SIGTERM came while browserPage was starting Chromium, before it had set up its signal handlers, so the file ended at once, logged no pid, and left Chromium running, which failed the check between retries. browserPage now sets up its handlers before it starts Chromium (`test/support/panel.mjs`). Second, the 60 s timeout: a SIGTERM that had come but not yet been handled when the test file removed every handler was lost (Node drops a signal whose last handler has gone), so the file waited for ever. The file now adds its own handler before taking browserPage's away (`DROP_CLEAN_UP` in `test/support/chromium-file.mjs`), and its hanging test has no time limit of its own, so only the runner can end it.
- Before the fixes, the new 0776 tests of them fail: with the old jump check, browserPage's handlers set up after Chromium starts, the old way of dropping the clean-up, and the wide block not kept, the four 0776 tests of the fixes failed; the two that check each named test still catches its fault passed both before and after.
- AC1 to AC3 under load, after the change (2026-11-27): each of the three tests passed 10 runs out of 10, three at a time beside 2 busy loops per core, at load averages of 66 to 90. Then 0723 AC2 passed 30 out of 30, ten at a time beside 4 busy loops per core, at load averages up to about 110, and 0160 AC5 and 0761 AC2 20 out of 20 each, eight at a time, at load averages up to 134.
- AC1 to AC3, still failing on a real fault: the 0776 tests check it. 0160 AC5's check fails when the ticket is left 20 px under the header; 0723 AC2's check still fails as the test file leaves Chromium running (as before); 0761 AC2's check times out when a swipe on the wide block doesn't reach the lanes.
- Self-check: no changes.
- Pictures: none, because nothing anyone sees changes.
- speck (2026-11-27 00:48 UTC) told you: The build is slow because of the work this ticket asks for, not because anything is stuck: to prove three browser tests are now steady on a busy machine, it has run each of them 10 to 30 times under deliberately heavy load (load averages of 66 to 134), and every run passed. It has moved on to the related tests before review. Why: Its log shows the repeated load runs finishing with every run passing, the busy load comes partly from the build's own load generators, and no test has hung or failed.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
