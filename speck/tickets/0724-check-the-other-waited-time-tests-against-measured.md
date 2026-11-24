---
id: "0724"
title: "Check the other waited-time tests against measured bounds"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: cursor              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-15-check-the-other-waited-time-tests-against-measured-bounds.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T15:02:01.273Z"

---
# 0724 · Check the other waited-time tests against measured bounds

**Status:** 🔍 reviewing

## Problem
The 0166 AC1 tests and the 0217 AC2 test check a waited time against a fixed ±5 s tolerance. Each runs a speck command in between that can take over 5 s on a very busy machine, so a build could see a failure that isn't real.

## Outcome
These tests check waited times against bounds measured in the test.

## Acceptance criteria
1. The 0166 AC1 tests and the 0217 AC2 test check waited times against bounds measured in the test, as the 0166 AC2 and 0217 AC3 tests do, with no fixed ±5 s tolerance and no fixed 10 s limit left.
2. Each still fails when speck counts a wrong wait, such as one a minute out.
3. Each passes when a speck command it runs takes more than 5 s.
4. No test that passed before this change fails.

## Out of scope
- The 0182 AC3 Chromium test, which has a ticket of its own.

## Notes
- `near` is in `test/waiting-0166.test.mjs` and `test/stopped-wait-0217.test.mjs`; `assertCounted` and `assertWrittenSince` are in `test/support/timing.mjs`. 0217 AC2 reads back a backdated time, so an exact check or `assertWrittenSince`-style bounds may fit better than `assertCounted`.
- Failing before this build: none
- Self-check: no changes
- Note: `test/tmp-cleanup.test.mjs` AC1 AC2 fails on this Node (v24) because the runner prints `ℹ fail 2` rather than `# fail 2`; it fails the same way without this ticket's changes, so it isn't fixed here.

## In plain words
Some of speck's own tests of how long a ticket spent waiting used a fixed five-second slack. On a busy machine a speck command in the middle of the test can take longer than that, so the suite could go red for no real fault. Those tests now judge the waited time against how long the test itself took, the same way their neighbours already do. Nothing changes in speck for someone using it: you'd notice it only as fewer false failures in the suite. Worth watching: a separate check about cleaning up temporary folders still fails on Node 24 for an unrelated reason (follow-up in the inbox).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up (inbox): `speck/ideas/2026-11-24-accept-node-s-fail-count-line-in-tmp-cleanup.md`: tmp-cleanup expects `# fail 2` but Node v24 prints `ℹ fail 2`.

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
    "reviewed_sha": "97c35d8033c62aadd407d0e16fc8fb50da4dadcf",
    "session": "fresh",
    "thread_id": "01a20e1c-8d2f-7791-a8db-f64fd575e5c0",
    "builder_response": "- Tests run: speck test --related test/waiting-0724.test.mjs test/waiting-0166.test.mjs test/stopped-wait-0217.test.mjs\n- All 0724, 0166 and 0217 tests in that run passed. The only failure was test/tmp-cleanup.test.mjs AC1 AC2 (expects `# fail 2`, Node v24 prints `ℹ fail 2`), which fails the same way without this ticket's changes and is noted in the ticket Notes.\n",
    "seconds": 28,
    "usage": {
      "input_tokens": 161037,
      "cached_input_tokens": 113920,
      "cache_write_input_tokens": 0,
      "output_tokens": 802,
      "reasoning_output_tokens": 15
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 47117,
      "cached": 113920,
      "write": 0,
      "output": 802
    },
    "cost_usd": 0.113646,
    "saved_at": "2026-11-24T15:11:49.183Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The three changed 0166 AC1 tests use assertCounted. Both affected 0217 AC2 tests use assertWrittenSince, and the saved backdated mark is checked with assert.equal. The fixed tolerances are removed; the supplied run passes these tests."
      },
      {
        "id": 2,
        "status": "unclear",
        "evidence": "test/waiting-0724.test.mjs:46–62 checks helper rejection of invented incorrect values and inspects test source. It does not exercise each affected test against an incorrect wait produced by speck."
      },
      {
        "id": 3,
        "status": "unclear",
        "evidence": "test/waiting-0724.test.mjs:67–76 supplies invented timestamps directly to helpers. No affected test is exercised with a command taking more than five seconds."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The supplied run passes all affected 0166, 0217 and 0724 tests. The only failure is the documented pre-existing tmp-cleanup reporter-format mismatch; that test is unchanged."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/waiting-0724.test.mjs",
        "issue": "The AC2 and AC3 checks test the timing helpers in isolation rather than each changed test's behaviour. Source-pattern checks cannot establish that the actual assertions reject incorrect speck results or survive slow commands.",
        "suggested_fix": "Exercise each affected test with a deliberately incorrect wait or stop timestamp and with a command delayed beyond five seconds. Verify rejection in the former case and success in the latter. A controlled clock or isolated test harness is suitable if it exercises the actual test bodies and command boundaries.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The fixed timing tolerances have been replaced appropriately, and the affected tests pass normally. Before approval, the tests need to demonstrate that each changed check still catches incorrect waits and passes when commands run slowly."
  }
}
```

</details>

<details><summary>Round 2 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "2f28116b8c11115e53581faf50fa2957214c9154",
    "session": "continued",
    "thread_id": "01a20e1c-8d2f-7791-a8db-f64fd575e5c0",
    "builder_response": "- Tests run: test/waiting-0724.test.mjs test/waiting-0166.test.mjs test/stopped-wait-0217.test.mjs\n- F1: fixed. Replaced the helper-only AC2/AC3 checks in test/waiting-0724.test.mjs with flows that exercise each affected 0166 AC1 and 0217 AC2 check: a broken CLI that under-counts waited stretches by a minute (or skews stopped_at) so assertCounted / assertWrittenSince / assert.equal reject, and a CLI that delays the same commands by over 5 s so those checks still pass. All 0724/0166/0217 tests in the run passed; the only failure remains the pre-existing tmp-cleanup reporter-format mismatch.\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 284880,
      "cached_input_tokens": 219648,
      "cache_write_input_tokens": 0,
      "output_tokens": 1518,
      "reasoning_output_tokens": 56
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 18115,
      "cached": 105728,
      "write": 0,
      "output": 716
    },
    "cost_usd": 0.0539628,
    "saved_at": "2026-11-24T15:18:46.977Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The affected tests in waiting-0166.test.mjs use assertCounted; stopped-wait-0217.test.mjs uses assertWrittenSince and exact equality for the saved mark. The fixed tolerances are removed, and the supplied run passes these tests."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The new 0724 AC2 tests run modified CLI copies that under-count blocked stretches or skew stop timestamps. They verify rejection by the corresponding timing assertions or inequality with the exact saved mark. All pass in the supplied output."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "The new command-delay tests pass in the supplied run, but '0724 AC3: 0166 AC1 passes when the second leave-blocked takes more than 5 s' starts its measured bound after the first stretch has already been counted. Its upper bound therefore excludes elapsed time included in the total being checked."
      },
      {
        "id": 4,
        "status": "unclear",
        "evidence": "All affected tests pass in the supplied run, with only the documented pre-existing tmp-cleanup failure. However, the new two-stretch slow-command test introduces a timing-dependent failure on a busy machine (F2)."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/waiting-0724.test.mjs",
        "issue": "The previous helper-only checks have been replaced with command-based flows that produce incorrect waits and delayed results.",
        "suggested_fix": "No further change required for this finding.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/waiting-0724.test.mjs",
        "issue": "The two-stretch AC3 test records since only before backdating the second stretch, but checks the combined waited_seconds against 500. If the first leave-blocked command spends substantial time before calculating its wait, that extra time is counted correctly but excluded from the measured upper bound. The new regression test can consequently fail for the busy-machine condition this ticket addresses.",
        "suggested_fix": "Record since before backdating the first stretch, as the original two-stretch test does. Use a separate timestamp immediately before the delayed second command to verify that command takes more than five seconds.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The new tests now exercise real commands with incorrect waits and deliberate delays, resolving the previous finding. One new test measures only the second of two waiting stretches while checking their total, so it can still fail on a busy machine. Correct that measurement before approval."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "46009de9bb02c110ae99639e824fe0ab59c10674",
    "session": "continued",
    "thread_id": "01a20e1c-8d2f-7791-a8db-f64fd575e5c0",
    "builder_response": "- Tests run: test/waiting-0724.test.mjs test/waiting-0166.test.mjs test/stopped-wait-0217.test.mjs\n- F2: fixed. The two-stretch AC3 test now records `since` before backdating the first stretch (as the original 0166 AC1 two-stretch test does), and uses a separate `slow` timestamp immediately before the delayed second leave to verify that command took more than 5 s.\n",
    "seconds": 20,
    "usage": {
      "input_tokens": 432343,
      "cached_input_tokens": 357376,
      "cache_write_input_tokens": 0,
      "output_tokens": 2068,
      "reasoning_output_tokens": 56
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 9735,
      "cached": 137728,
      "write": 0,
      "output": 550
    },
    "cost_usd": 0.0387428,
    "saved_at": "2026-11-24T15:20:23.791Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The affected 0166 AC1 tests use assertCounted; the affected 0217 AC2 tests use assertWrittenSince and exact equality for the backdated mark. The fixed ±5 s and 10 s checks are removed. The 0724 AC1 checks and affected original tests pass."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The 0724 AC2 tests exercise CLI copies that under-count waited stretches or skew stop timestamps, verifying that the timing checks reject those results. All pass in the supplied run."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The 0724 AC3 tests exercise commands deliberately delayed beyond five seconds and pass. The two-stretch test now records since before the first backdate and separately measures the delayed second command, resolving F2."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "All affected 0166, 0217 and 0724 tests pass in the supplied run. The only failure remains the documented pre-existing tmp-cleanup reporter-format mismatch; that test is unchanged. No regression is evident from the scoped changes."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/waiting-0724.test.mjs",
        "issue": "The original helper-only checks did not exercise incorrect waits and slow commands through speck. Command-based checks now cover those behaviours.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/waiting-0724.test.mjs",
        "issue": "The two-stretch slow-command test previously excluded the first stretch's elapsed time from its measured upper bound. Its measurement now starts before the first backdate.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The tests now use measured timing bounds, catch incorrect waits and pass with deliberately slow commands. Both review findings are resolved. The only reported test failure is an unchanged, pre-existing reporter-format issue. Approved for the owner's merge decision."
  }
}
```

</details>
