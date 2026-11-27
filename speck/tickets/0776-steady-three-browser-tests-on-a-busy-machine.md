---
id: "0776"
title: "Steady three browser tests on a busy machine"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
approved: "2026-11-27T01:12:13.289Z"

---
# 0776 · Steady three browser tests on a busy machine

**Status:** 👍 approved

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
Three of speck's own browser tests sometimes failed when the machine was busy, for example with several builds testing at once. That could stop a finished ticket from shipping and send it back to its build. They now hold up under heavy load. Each still fails if the thing it checks really breaks. Nothing in speck itself looks or behaves differently. You'd notice it as fewer finished tickets sent back because one of these tests failed. Worth watching: another browser test about swiping between lanes failed once in the same busy run, and it's now in the inbox.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 158,942
- Elapsed since build started: 61 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up (inbox): `speck/ideas/2026-11-27-steady-the-0476-ac4-swipe-test-under-heavy-load.md`: 0476 AC4 failed once in this build's related run, with all three of 0738's retries for a dropped touch end used up, and passed when run again.
- Known limit: 0761 AC1 still uses the plain wide block, which the 5-second redraw can take out; it's another browser test, out of this ticket's scope, and hasn't been seen failing.
- Note: the related run needed longer than the builder's 10-minute command limit (about 460 files, as test/support/panel.mjs changed), so it was run detached and waited for.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · approve</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "aee252d4a7530571f662cb898c7491e8019a0e92",
    "session": "fresh",
    "thread_id": "01a21a8e-3a91-7982-b002-1214cc9867fd",
    "builder_response": "- Tests run: `speck test --related test/steady-0776.test.mjs test/panel-0160.test.mjs test/panel-0761.test.mjs test/chromium-0723.test.mjs` (about 460 files, since test/support/panel.mjs changed): 4541 tests, 2 failed. 0234 AC1 failed because of this change (it read only panel-0160.test.mjs for `await sharedPanel()`, which moved to test/support/header-0160.mjs with withPanel, so 0776's tests share it); 0234 AC1 now reads both files. 0476 AC4 failed with \"the browser dropped the end of the touch 3 times in a row\" at a load average around 100, with another build's load test running beside it; it doesn't use the changed helpers apart from importing panel.mjs.\n- The attached output: `speck test --files test/steady-0776.test.mjs test/panel-0160.test.mjs test/panel-0761.test.mjs test/chromium-0723.test.mjs test/panel-0234.test.mjs test/panel-0476.test.mjs`: 189 tests, 186 passed, 0 failed.\n- AC1 to AC3 under load were measured by hand, 10 out of 10 each and more (see the ticket's Notes), with the causes found: the 0160 highlight fading, Plan's list being drawn again on each 5-second ping and taking out 0761's wide block mid-swipe, and for 0723 AC2 a SIGTERM arriving while Chromium was starting before browserPage's handlers were set up, and a SIGTERM lost when the test file removed every handler.\n- The 0776 tests of the fixes were checked to fail with each fix taken out; the two \"still fails\" tests pass both ways, as they check the named tests still catch their fault.\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 158249,
      "cached_input_tokens": 112128,
      "cache_write_input_tokens": 0,
      "output_tokens": 693,
      "reasoning_output_tokens": 31
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 46121,
      "cached": 112128,
      "write": 0,
      "output": 693
    },
    "cost_usd": 0.1103848,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-27T01:11:20.975Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/support/header-0160.mjs: jumpedBelowHeader finds ticket 0001 by id and waits for stable geometry. The passing 0776 AC1 tests cover an expired highlight and rejection of a ticket obscured by the header. Ticket Notes record 10/10 runs under heavy load, followed by 20/20 at higher load."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "test/support/panel.mjs installs signal handlers before spawning Chromium; DROP_CLEAN_UP in chromium-file.mjs replaces handlers without a gap. Passing 0776 AC2 tests exercise both changes, and chromium-0723.test.mjs still verifies that leaked Chromium fails goneWithin10s. Notes record 10/10 load runs and a further 30/30."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "test/support/swipe-0761.mjs: widenKept restores the same wide node after rendering. Passing 0776 AC3 tests force a render during a real touch gesture and verify failure when touch propagation is blocked. Notes record 10/10 load runs and a further 20/20."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "/tmp/speck-0776-tests.txt confirms 186 passes, zero failures and three skips across the selected files, including the previously failing 0476 file. The branch diff is limited to the targeted tests, supporting helpers and the necessary 0234 source-location check adjustment."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The three browser tests now handle the identified timing races while retaining checks that detect real faults. Recorded load runs meet the requested repeat counts, and the final related tests pass. No blocking concerns found."
  }
}
```

</details>
