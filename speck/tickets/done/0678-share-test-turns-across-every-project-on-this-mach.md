---
id: "0678"
title: "Share test turns across every project on this machine"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0677"]                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T14:40:15.115Z"
approved: "2026-11-15T15:20:12.890Z"
finished: "2026-11-15T15:24:26.005Z"

---
# 0678 · Share test turns across every project on this machine

**Status:** ✅ done

## Problem
`max_parallel_tests` limits test runs within one repo, so each project building on a machine runs its tests at the same moment as the others'. Tests that depend on timing then fail by chance: this repo has needed 13 fix tickets for tests that fail only when the machine is busy, and its watch notes record load averages of 25 to 84 on 16 cores.

## Outcome
One setting limits how many test runs go at once across every project on the machine.

## Acceptance criteria
1. `speck config set machine_parallel_tests <n>`, with a whole number of 1 or more, run in any project, saves the limit for every project of yours on this machine, in your home folder's speck settings and not in the repo. `speck config set machine_parallel_tests ""` removes it, and `speck config show` in any project shows it. Without it, nothing changes.
2. With it set to n, no more than n test runs speck starts go at once across all your projects on this machine, the full suite's run included. A run beyond that waits, saying once that it's waiting for a turn on this machine, and starts when one ends.
3. Each project's own `max_parallel_tests` still holds within it, a test run speck starts while it already holds a turn runs in that turn, and a turn held by a process that has died is freed.
4. The brief describes `machine_parallel_tests` in its `speck test` row and in its `speck config set` row.
5. No test that passed before this change fails.

## Out of scope
- Limiting builds or agents across projects.
- One speck service for every project on a machine (`speck/ideas/2026-11-10-run-a-software-factory-from-one-speck-service.md`), where this limit would live later.

## Notes
- Checked 2026-11-15: how much of that load came from other projects' test runs can't be measured after the fact. At 14:40 the load average was 35 on 16 cores and every busy process was this repo's own (its full suite and two builds), so this repo loads the machine by itself. The limit counts the full suite's run for that reason, and helps a single project too.
- Turns are lock files under the main checkout's `speck/.cache/tests` (`turnsDir` and `inTurn` in `scripts/turns.mjs`). `~/.config/speck/` already holds this machine's private words and panels.
- The suite's own tests mustn't read or write the real home folder's settings (as 0654 did for agents).
- Failing before this build: none
- Self-check: a home settings file that can't be read or saved, and a turns folder that can't be made, now stop with a plain message rather than a stack trace; a dead turn whose project folder has gone is freed rather than failing every waiter. Tests added for each.
- speck (2026-11-15 15:09 UTC) told you: The build was slow but did nothing wrong, and it has now finished with Codex approving it in round 2. The time went on a heavily loaded machine, re-running three tests that failed only because of that load, and a second review round to fix a deadlock the reviewer found. Why: The build log shows each step finishing normally, the three failures passing on a re-run, and the machine's load averaging 29 to 37 over the last 5 to 15 minutes, which is enough on its own to slow every test run.

## In plain words
You can now cap how many test runs go at once across all your projects on this computer, not just within one. Set it once from any project, for example to 2, and it applies to every project: a test run beyond the cap waits, says once that it's waiting for a turn on this machine and which runs it's waiting for, and starts as soon as one ends. The full suite that runs after each ship counts too. Each project's own limit still applies inside it, and nothing changes until you set the cap. To see it, set it, run tests in two projects at once and watch the second one wait; `speck config show` shows it in any project. Worth watching: a lower cap means fewer tests failing by chance on a busy machine, but builds wait longer for their turn.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Repo-first acquisition creates a circular wait.
Round 2 (codex): approve.
Round 3 (codex, merge round): approve.

## Delivery log
- Review rounds: 3, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 536,362
- Elapsed since build started: 40 min
- Changed lines: 184 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - Show and change `machine_parallel_tests` in the panel's Settings view (inbox: `speck/ideas/2026-11-15-show-machine-parallel-tests-in-the-settings-view.md`).
  - Known limit: turns on the machine have no queue order. A waiting run retries every half-second or so, so under heavy contention one run could wait longer than another that started later.
  - Known limit: timing tests failed under a load average of 35 to 43 during this build's related run (0630 AC3, 0657 AC3, 0517 AC3) and passed on re-run; this setting is meant to help with that once it's set.

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
    "reviewed_sha": "18219d32802258b3dfce2ce38b0a9607a95b8202",
    "session": "fresh",
    "thread_id": "01a1dfbd-5808-7010-bde7-9ad34a3a5668",
    "builder_response": "- Tests run: test/machine-turns-0678.test.mjs test/full-suite-0630.test.mjs test/house-rules-full-0657.test.mjs test/panel-0517.test.mjs (with commands.checks alongside).\n- Before this round, `speck test --related test/machine-turns-0678.test.mjs` ran 608 files, as test/support/tmp.mjs changed: 5661 passed, 3 failed (0630 AC3's \"under 900 ms\" check, 0657 AC3 and 0517 AC3's 50 ms frame check), all timing checks at a load average of 35 to 43 on 16 cores. Those files passed on the re-run above, and 0517 passes alone both with and without this change.\n- Design: the setting is saved in ~/.config/speck/config.yml (scripts/home-settings.mjs), never in the repo. inTurn (scripts/turns.mjs) takes its repo turn first, then, when machine_parallel_tests is set, a turn in ~/.config/speck/test-turns using the same claim files, so lanes (the full suite) take one too. A process already holding a machine turn, or running under one (SPECK_MACHINE_TURN names the turns folder in its tests' environment), runs in that turn. test/support/tmp.mjs points SPECK_HOME_SETTINGS_DIR at the run's temporary folder so the suite never reads or writes your real one.\n",
    "seconds": 53,
    "usage": {
      "input_tokens": 163456,
      "cached_input_tokens": 103680,
      "cache_write_input_tokens": 0,
      "output_tokens": 1175,
      "reasoning_output_tokens": 373
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 59776,
      "cached": 103680,
      "write": 0,
      "output": 1175
    },
    "cost_usd": 0.14167,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T15:05:42.971Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/home-settings.mjs implements home-folder storage, validation, removal and display. The AC1 tests exercise these behaviours across two projects and passed."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The AC2 tests passed for ordinary contention and full-suite lanes, but scripts/turns.mjs inTurn can deadlock when a turn holder starts a nested run in another project whose repo turn is held by a machine waiter."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "The AC3 tests cover project limits, isolated nesting and dead holders, but omit nesting while another project is waiting. Taking the repo lock before the machine lock can prevent the nested run from ever starting."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Both required rows in docs/brief.md describe machine_parallel_tests; the AC4 test checks the setting's presence in those rows and passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied final run reports 183 passed, zero failed and three skipped. Previously failing files were included in the successful rerun; whole-suite verification remains the ship gate."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/turns.mjs:181",
        "issue": "Repo-first acquisition creates a circular wait. With machine_parallel_tests=1, project A holds the machine turn. A separate run in project B takes B's repo turn, then waits for A's machine turn. If A's tests synchronously start a speck run in B, that nested run inherits the machine turn but waits for B's repo turn. A cannot finish until the nested run finishes, while B cannot release its repo turn until A finishes. The new nesting test uses an uncontended project, so it misses this case.",
        "suggested_fix": "Change acquisition so a run waiting for a machine turn does not retain a repo turn needed by an existing machine holder's nested run. Update the documented acquisition order if necessary and add a bounded regression test covering this three-process sequence.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The shared setting and ordinary queueing work, and the reported tests pass. However, nested test runs can deadlock when another project is already waiting. Fix that locking interaction before merge."
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
    "reviewed_sha": "05a96cb603f3475768018ce307e2a0d992551b49",
    "session": "continued",
    "thread_id": "01a1dfbd-5808-7010-bde7-9ad34a3a5668",
    "builder_response": "- Tests run: test/machine-turns-0678.test.mjs test/turns-0239.test.mjs test/full-suite-0630.test.mjs (with commands.checks alongside). turns-0239 and full-suite-0630 are the existing tests of the turn code changed.\n- F1: fixed. inTurn (scripts/turns.mjs) now takes the repo turn and the machine turn together: it takes a free repo turn, then tries for a free machine turn, and if there's none it frees the repo turn before sleeping, so it never holds one while it waits for the other. Each waiting message is still said once. A failure while taking them frees the repo turn. The brief's speck test row says so. New test \"0678 AC3: a run waiting for the machine doesn't keep its project's turn from a test run started in the turn it waits for\" runs your three-process sequence (A holds the machine turn with limit 1, a run in B waits for the machine, A's tests then start a run in B) with bounded waits; it fails on the previous commit's turns.mjs (the nested run times out) and passes now.\n",
    "seconds": 29,
    "usage": {
      "input_tokens": 325194,
      "cached_input_tokens": 242048,
      "cache_write_input_tokens": 0,
      "output_tokens": 1814,
      "reasoning_output_tokens": 426
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 23370,
      "cached": 138368,
      "write": 0,
      "output": 639
    },
    "cost_usd": 0.0669668,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T15:08:19.735Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/home-settings.mjs validates, saves, removes and displays the home-folder setting. Passing AC1 tests verify visibility across projects, invalid-input rejection and no repo configuration changes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/turns.mjs inTurn requires both turns before starting and releases the repo turn before waiting for machine capacity. Passing AC2 tests cover limits of one and two, full-suite lanes, waiting once and subsequent progress."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing AC3 tests cover project limits, nested turn reuse, dead processes and deleted project folders. The new three-process regression test exercises F1's circular-wait scenario; inTurn now releases the contested repo turn."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/brief.md describes machine_parallel_tests in both required command rows and reflects the revised acquisition behaviour. The AC4 fact test passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied round-two results show 180 passed, zero failed and three skipped, including existing turn and full-suite tests. Whole-suite verification remains the ship gate."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/turns.mjs",
        "issue": "The previous repo-first acquisition could deadlock a nested run against another project's machine waiter. The revised loop releases its repo claim before sleeping when machine capacity is unavailable.",
        "suggested_fix": "Completed; the added three-process regression test covers the reported sequence and passed.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The shared limit now coordinates test runs across projects while preserving project limits. The deadlock is fixed and covered by a regression test. All criteria pass, with no blocking concerns remaining."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "d37a98449b64fa25fc043d09caf4e82d33c4b846",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1dfbd-5808-7010-bde7-9ad34a3a5668",
    "builder_response": "- Merge round after merging main for the ship queue.\n- docs/brief.md (class logic, 1 conflict): main changed other rows in the same hunk (the `after:`/`built_on:` text, among others). I took main's side of the whole hunk, then added this ticket's sentence about `machine_parallel_tests` to the `speck test` row again, unchanged, after \"A turn held by a process that has died is freed.\". `git diff main -- docs/brief.md` now shows only this ticket's two rows (`speck config set` and `speck test`).\n- No code changed in the merge.\n- Tests run: test/machine-turns-0678.test.mjs (with commands.checks alongside): 157 passed, 0 failed.\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 533961,
      "cached_input_tokens": 428416,
      "cache_write_input_tokens": 0,
      "output_tokens": 2401,
      "reasoning_output_tokens": 426
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 22399,
      "cached": 186368,
      "write": 0,
      "output": 587
    },
    "cost_usd": 0.0693048,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T15:20:10.233Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Home-setting storage, validation, removal and display code is unchanged from the approved commit. All AC1 tests passed after the merge."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/turns.mjs is unchanged from the approved commit. AC2 tests passed for machine limits, waiting messages, release and full-suite lanes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "All AC3 tests passed, covering project limits, nested reuse, dead-holder recovery and F1's three-process regression."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/brief.md retains machine_parallel_tests in both required rows. Against merged main, only those two rows differ; main's speck start documentation is preserved. AC4 passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied post-merge run reports 157 passed, zero failed and three skipped. No implementation or test code changed since approval; whole-suite verification remains the ship gate."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/turns.mjs",
        "issue": "The circular-wait fix remains intact after the merge, and its regression test passed.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The merge preserves the approved behaviour and both sides' documentation changes. All ticket tests passed, and no new blocking concerns were found."
  }
}
```

</details>
