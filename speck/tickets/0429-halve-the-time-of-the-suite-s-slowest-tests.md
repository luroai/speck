---
id: "0429"
title: "Halve the time of the suite's slowest tests"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0424"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T18:33:20.667Z"
blocked_at: ""
waited_seconds: 13
approved: "2026-10-23T19:08:11.871Z"

---
# 0429 · Halve the time of the suite's slowest tests

**Status:** 👍 approved

## Problem
Builds that change the panel run its browser tests again and again, 1.5 to 2.5 minutes a time, and every ship runs the whole suite. A few tests take far longer than the rest, so every build and ship waits on them.

## Outcome
The suite's ten slowest tests take half as long, still checking the same things.

## Acceptance criteria
1. In a run of the whole suite with `npm test` on this machine, the ten tests named in Notes take at most 82 seconds together, half the 163 seconds they took in 0418's ship run.
2. Each of the ten still checks everything it checked before: no assertion is removed or loosened. One that checks something only a real browser, panel or process does, such as selecting text or stopping a build, still uses it.
3. No test that passed before this change fails.

## Out of scope
- Tests outside the ten.
- Splitting `templates/panel.html` (0430 to 0433).

## Notes
- The user asked for this on 2026-10-23, after noticing builds that change the panel taking much longer (0410 26 min, 0413 41 min). Builds already run only their own test files, but the panel's browser tests are slow, and the whole suite runs on every ship (about 160 s).
- The ten slowest tests in 0418's ship run (`speck/.cache/runs/0418.ship.log`), with their times: `0050 AC1-AC5: in a real browser, selections and the build message scroll stay through refreshes` (26.4 s, test/panel-0050.test.mjs); `0176: the board stays quick to read however many tickets are built` (23.5 s, test/build-log-0176.test.mjs); `0060 AC1-AC5: in a real browser, the pane holds the page still…` (22.7 s, test/panel-0060.test.mjs); `0267 AC1, AC3: rewording and reordering the README, the brief, the changelog…` (17.9 s, test/docs-0267.test.mjs); `0177 AC3: answers within 1 second while a reading takes 5 seconds` (12.9 s, test/panel-0177.test.mjs); `0257 AC4-AC5: the panel serves the settings afresh on a GET…` (12.4 s, test/panel-0257.test.mjs); `AC1/AC4: a reason reads back exactly as typed…` (12.2 s, test/cancel.test.mjs); `0040 AC1-AC5: in a real browser, selected text stays selected…` (11.8 s, test/panel-0040.test.mjs); `0072: stop a running build from the CLI` (11.7 s, test/stop-0072.test.mjs); `0159 AC3: b.js() and b.until() give up in their time limits…` (11.6 s, test/panel-0159.test.mjs).
- Some time is in the test's own subject (0177 waits on a reading that takes 5 seconds), so not each one can halve: criterion 1 is the ten together.
- Times vary with load, so measure the ten in one full `npm test` run, as ship runs it.
- Waits for 0424, as 0423 and 0424 change the full-ticket pane that `test/panel-0060.test.mjs` checks. Builds alongside 0426 to 0428 (the user, 2026-10-23), which restyle the page and are unlikely to change these ten tests. If one does, the second to ship needs a merge round.
- Failing before this build: none
- Criterion 1 is about a full `npm test` run, which `speck ship` makes, so no test checks it: a test can't time the suite it's part of. Measured during the build instead, on this machine while other builds ran their tests: the ten, each file run on its own, 122.5 s before and 54.0 s after (44%); the ten files and five others run together, 84.3 s, against 163 s for the ten in 0418's whole-suite run. Criterion 2 is checked by `test/slow-tests-0429.test.mjs` and by the ten tests themselves, criterion 3 by the round's test files and the ship's run.
- What changed: the three browser refresh tests ask the panel for a keep-alive, and so a refresh, every half a second (`SPECK_PANEL_PING_MS`); 0159's `b.until()` and `b.loaded()` tests give the helpers a 1-second limit of their own and check they give up within 2.5 s; 0177's AC3 tests slow only their first reading, not also the one after their write; 0257 uses stand-in agents ahead of the installed ones; the cancel test copies one set-up repo for each reason and runs the reasons at once; 0267 runs its two inner test runs at once; 0060's touch swipes are faster, over the same distances.
- Left as they were: 0176's check spacing (halving it would let a check slowed by load count as more than one, loosening the 5% check) and 0072 (four of its tests at once timed out a build's start under load).
- Self-check: reverted two speed-ups that loosened a check or made a test flaky under load (0176's check spacing, 0072 running four tests at once), and checked that 0060's faster swipe sees the same as the old one.
- Pictures: none, because nothing anyone sees changes.
- Went with the recommendation: run the whole suite once to measure (chosen by the Foreman, as foreman_fixing is fix, 2026-10-23 19:01 UTC).
- Measured in one full `npm test` run in this build's worktree (2026-10-23 19:02, 156 s for the suite, the machine also running other builds' tests): the ten took 81.7 s together, against 163 s in 0418's run, so criterion 1's 82 s is met. 0050 4.4, 0176 24.4, 0060 12.7, 0267 13.1, 0177 7.8, 0257 0.8, cancel 1.6, 0040 3.3, 0072 11.6, 0159 2.1. In that run, `0193 AC1 AC4: speck run ships with speck ship --auto…` failed once, reading a ticket file that had just been moved: it passes three runs in a row on its own, and this ticket changes none of its files.
- After that run, for more margin: 0176 AC1 no longer runs `speck status` once before each three it times and throws it away, as the least of the three leaves the slower first run out anyway. It times as many runs as before, with the same 10% check: 7.1 s to 5.5 s on its own, and it's what holds 0176 up under load (19.2 s of its 24.4 s in the full run). Not measured in a second full run: the answer was to run it once.

## In plain words
The tests that held up every build and ship most are quicker now. In a full run of the test suite, the ten slowest took 82 seconds together, half the 163 they took before, and they still check the same things. Most of the time saved was waiting: the browser tests no longer wait 5 seconds for each refresh, and a few tests no longer sit through long time limits or ask the installed agents for their models. Nothing about speck itself changed, only its tests. To see it, look at how long a ship's test run takes. Keep an eye on it: the ten came in just under the target, and the time varies with how busy the machine is.

## Blocked question
Criterion 1 can only be measured in a full run of the test suite, but builds may never run the whole suite (only shipping does), and the reviewer won't pass it on my measurements: the ten tests run on their own took 54 s, down from 122 s, and crowded together with other builds' tests they took 84 s. Should I (a) run the whole suite once in this build to measure the ten, as an exception to the rule, or (b) leave criterion 1 to be checked in the ship's own run, with the reviewer told so? I recommend (a): it's one run of about 3 minutes, and it gives the reviewer the number the criterion asks for. With (b), a ship that comes in over 82 s would go out anyway.
Recommended: run the whole suite once to measure
Changes what you'd notice: no
Clear winner: yes

## Review log
Round 1 (codex): changes requested: F1 The central performance target has not been demonstrated.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 386,349
- Elapsed since build started: 35 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- 0060's touch swipes scroll nothing, even where the pane could scroll, so its touch checks pass whatever the page does: speck/ideas/2026-10-23-make-0060-s-touch-swipes-scroll-something.md.
- `0193 AC1 AC4` failed once in the full run, reading a ticket file just as it moved into done/: speck/ideas/2026-10-23-fix-the-0193-ship-test-that-fails-by-chance.md.
- The ten met the 82-second target only narrowly (81.7 s, before the last change to 0176). The remaining big ones are 0176 (its CPU timings of speck status under load), 0267 (it runs every test file that reads a document, checks-0272 the longest) and 0072 (a 5-second grace period). Known limits, not ideas.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "d154a48281a5a2553f7c9663dff37e02097b2b0e",
    "session": "fresh",
    "thread_id": "01a16a23-0997-7932-b5bf-d7115fa4a2e7",
    "builder_response": "- Tests run: test/panel-0050.test.mjs test/build-log-0176.test.mjs test/panel-0060.test.mjs test/docs-0267.test.mjs test/panel-0177.test.mjs test/panel-0257.test.mjs test/cancel.test.mjs test/panel-0040.test.mjs test/stop-0072.test.mjs test/panel-0159.test.mjs test/slow-tests-0429.test.mjs test/panel-0079.test.mjs test/panel-0206.test.mjs test/panel-0182.test.mjs test/flaky-0207.test.mjs (plus commands.checks, which speck test --files runs). These are the ten slow tests' files, this ticket's own file, and the other files that use the helpers it changed (test/support/panel.mjs, test/support/slow-panel.mjs).\n- AC1 is about a full `npm test` run, which only `speck ship` makes during a build, so no test checks it. My measurements are in the ticket's Notes: the ten, each file run on its own, 122.5 s before and 54.0 s after (44%). In the test run attached, the ten files run together with five others while other builds were testing on this machine, they took 84.3 s, against 163 s in 0418's whole-suite run.\n- AC2: no assertion was removed or loosened. 0159's two until()/loaded() checks now pass a 1-second limit and assert it gives up within 2.5 s, where before they used the 10-second default and allowed 15 or 20 s. The default is kept as UNTIL_MS (10 s) and test/slow-tests-0429.test.mjs checks it. Every browser, panel and process test still uses the real thing.\n- Left alone on purpose: 0176 (half-second check spacing would let a check slowed by load count as two, loosening the 5% check) and 0072 (four of its tests at once timed out a build's start under load). 0177 keeps its 5-second reading. Only the reading after the write, which nothing is asked during, is no longer slowed.\n- No visual change, so there are no pictures.\n",
    "seconds": 31,
    "usage": {
      "input_tokens": 114453,
      "cached_input_tokens": 68480,
      "cache_write_input_tokens": 0,
      "output_tokens": 779,
      "reasoning_output_tokens": 95
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T19:01:14.629Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "unclear",
        "evidence": "The ticket's Notes report 54.0 seconds from separate file runs and 84.3 seconds from a partial-suite run. Neither measures the required full npm test run, and the latter exceeds 82 seconds. The supplied /tmp/speck-0429-tests.txt covers selected files only."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The diff preserves the existing assertions and real browser, panel and process coverage. The refresh tests change keep-alive frequency; cancel preserves every awkward reason in isolated repositories; docs-0267 retains both inner runs; panel-0159 exercises explicit time limits; panel-0177 retains the first five-second reading. The supplied test output confirms these tests pass."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The supplied run reports 227 passes, zero failures and three skips across the selected files and repository checks. The helper defaults preserve existing behaviour for other callers. Whole-suite regression verification remains part of shipping."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0429-halve-the-time-of-the-suite-s-slowest-tests.md",
        "issue": "The central performance target has not been demonstrated. Separate-file measurements cannot establish the combined duration under whole-suite load, and the reported partial-suite measurement is already above the 82-second limit.",
        "suggested_fix": "Obtain the ten named tests' combined duration from an authorised full npm test run on this machine and retain the output and calculation. If it exceeds 82 seconds, optimise further while preserving coverage. Coordinate this verification with the ship workflow, since the review skill prohibits whole-suite runs during the build.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The changes substantially reduce waiting while preserving the checks, and all tests run passed. Approval is held because the required combined time of at most 82 seconds in a whole-suite run has not yet been demonstrated."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "b316682b228b673b021bff4dccf63d37d2c80c60",
    "session": "continued",
    "thread_id": "01a16a23-0997-7932-b5bf-d7115fa4a2e7",
    "builder_response": "- Tests run: test/panel-0050.test.mjs test/build-log-0176.test.mjs test/panel-0060.test.mjs test/docs-0267.test.mjs test/panel-0177.test.mjs test/panel-0257.test.mjs test/cancel.test.mjs test/panel-0040.test.mjs test/stop-0072.test.mjs test/panel-0159.test.mjs test/slow-tests-0429.test.mjs test/panel-0079.test.mjs test/panel-0206.test.mjs test/panel-0182.test.mjs test/flaky-0207.test.mjs (plus commands.checks).\n- F1: fixed. The user's side answered the blocked question (the Foreman, recorded in Notes): run the whole suite once to measure. I ran `npm test` once in this worktree, at commit 9c38bd5e plus the Foreman's Notes commit, so the same test code as round 1. The full TAP output is at /tmp/speck-0429-full-suite.tap. Each test's top-level `duration_ms`, summed: 0050 4.4 + 0176 24.4 + 0060 12.7 + 0267 13.1 + 0177 7.8 + 0257 0.8 + cancel 1.6 + 0040 3.3 + 0072 11.6 + 0159 2.1 = 81.7 s, at or under the 82 s criterion 1 asks for (163 s in 0418's run). The suite took 156 s, with other builds testing on the machine at the same time.\n- That run had one failure, `0193 AC1 AC4: speck run ships with speck ship --auto, and stopping it doesn't stop the ship`. It read a ticket file just after it had been moved (TypeError in test/support/ship.mjs statusIn). It passes three runs in a row on its own, and this ticket changes none of its files (test/run-0193.test.mjs, test/support/ship.mjs, test/support/run.mjs). I'll list it as a follow-up and not fix it here (out of scope: tests outside the ten).\n- For margin after that run: 0176 AC1 no longer runs `speck status` once before each three it times and throws it away. Each timing still keeps the least of three runs, and the least of three leaves the slower first run out anyway. Four alternated rounds, 12 timed runs per size and the `slow < fast * 1.1` assertion are unchanged, and test/slow-tests-0429.test.mjs checks them. AC1 alone: 7.1 s → 5.5 s. That AC1 was 19.2 s of 0176's 24.4 s in the full run. I didn't measure it in a second full run, since the answer was to run the suite once.\n",
    "seconds": 29,
    "usage": {
      "input_tokens": 269421,
      "cached_input_tokens": 216064,
      "cache_write_input_tokens": 0,
      "output_tokens": 1696,
      "reasoning_output_tokens": 135
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T19:07:43.722Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Verified the ten named top-level durations in /tmp/speck-0429-full-suite.tap: they total 81,700.916313 ms, below 82 seconds. The subsequent 0176 change removes only discarded warm-up runs."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The ten retain their assertions and required real browsers, panels and processes. In test/build-log-0176.test.mjs, statusMs still takes the minimum of three measurements across four alternating rounds and retains slow < fast * 1.1. The current selected-file run passes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The current review run reports 228 passes and zero failures. The full run's 0193 failure comes from the unchanged statusIn helper looking for a ticket during its move; inspection of test/support/ship.mjs and test/run-0193.test.mjs supports the reported unrelated race. Whole-suite verification remains a shipping check."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0429-halve-the-time-of-the-suite-s-slowest-tests.md",
        "issue": "The required whole-suite timing evidence was previously missing.",
        "suggested_fix": "Completed: the retained full-run output demonstrates a combined duration of 81.701 seconds.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The ten slowest tests meet the target at 81.7 seconds while preserving their checks. The current review tests pass. One unrelated ticket-moving race appeared in the full run; the timing target has little margin."
  }
}
```

</details>
