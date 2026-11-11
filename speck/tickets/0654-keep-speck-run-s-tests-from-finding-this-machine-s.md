---
id: "0654"
title: "Keep speck run's tests from finding this machine's agents"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 0              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: fix                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T15:39:35.306Z"
approved: "2026-11-11T15:50:29.573Z"

---
# 0654 · Keep speck run's tests from finding this machine's agents

**Status:** 👍 approved

## Problem
The full suite fails on `main` from `fc53908` (0647) on: `0622 AC1 AC2 AC3: a build that hit the limit while speck run was off is waited out when it starts, and holds new work too`. The tests start a real `speck run` with this machine's own PATH and home folder, so it finds the real Cursor CLI installed and signed in, takes it as the builder's bench (0647) and starts the second ticket on it instead of holding it. The result depends on which agents the machine running the tests has.

## Outcome
Tests that start a real `speck run` see only the agents they fake, so they give the same result on any machine, and the 0622 test passes again.

## Acceptance criteria
1. A test that starts `speck run` through `test/support/run.mjs` finds no Claude Code, Codex or Cursor CLI, and none of this machine's agent settings, sign-ins or session files, except those the test puts there itself.
2. `test/usage-limit-0622.test.mjs` passes on a machine with Cursor's CLI installed and signed in, with its new work still held while Claude is limited, as no other agent is ready in the test.
3. A test shows that, with a second faked agent ready on the builder's bench, new work starts on it while Claude is limited, as 0647 intends.
4. No test that passed before this change fails.

## Out of scope
- Changing 0647's behaviour.

## Notes
- Found 2026-11-11: the full run at `fc53908` failed on it, and it fails alone every time on this machine; its log says "new builds start on Cursor, the first agent on builder_bench that's ready and free".
- `test/support/run.mjs` passes `{ ...process.env, … }` to `speck run`, so PATH and HOME are the machine's.
- The full suite failing on `main` counts under Needs you until a run on a newer commit passes (0630).
- Failing before this build: none (the recorded result, from f6827fa, passed; the 0622 test is the one this ticket fixes)
- Self-check: no changes. The related run also failed `test/foreman-0285.test.mjs`'s two 0285 AC3 tests, which fail the same way without this change (a panel test, not speck run's), and once `0549 AC4`, which passes alone each time: neither is changed here.

## In plain words
Nothing changes in speck itself. speck's own tests of Auto-build now run as if on a computer with no coding agents installed or signed in, apart from the pretend ones each test sets up, so they give the same result on any computer. The test that failed on this computer because it found Cursor installed passes again, and a new test checks that, while Claude is at its usage limit, new work does move to another ready agent. Worth a look: two older panel tests about the Auto-build switch in Settings also fail at the moment, for an unrelated reason, so the full test run won't go green until they're fixed (saved as an idea).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 153,437
- Elapsed since build started: 11 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- `test/foreman-0285.test.mjs`'s two 0285 AC3 tests fail on the base code too: saved as speck/ideas/2026-11-11-fix-the-0285-auto-build-switch-panel-tests.md.
- `0549 AC4` failed once under the load of the 83-file related run and passes alone: skipped, matches speck/ideas/2026-11-08-steady-six-speck-run-timing-tests-under-load.md and speck/ideas/2026-11-10-steady-the-0622-and-0549-ac1-run-tests-under-load.md.

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
    "reviewed_sha": "1d6637b214c39327742a3ffa130474b4ce8ee34c",
    "session": "fresh",
    "thread_id": "01a1cb4c-d223-7402-9466-93097dd51d05",
    "builder_response": "- Tests run: `speck test --related test/run-agents-0654.test.mjs test/usage-limit-0622.test.mjs`, which brought in the 83 test files that name test/support/run.mjs (and the checks).\n- The 0622 test the ticket names passes on this machine, which has Claude Code, Codex and Cursor's CLI installed and signed in in ~/.local/bin.\n- Three failures in that run aren't from this change: `foreman-0285.test.mjs`'s two 0285 AC3 tests fail the same way with test/support/run.mjs put back as it was (they're panel page tests using fakePage, which don't use run.mjs's env), and `0549 AC4` failed once under the load of the 83-file run and passes alone each time (run twice).\n",
    "seconds": 35,
    "usage": {
      "input_tokens": 152615,
      "cached_input_tokens": 114560,
      "cache_write_input_tokens": 0,
      "output_tokens": 822,
      "reasoning_output_tokens": 69
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 38055,
      "cached": 114560,
      "write": 0,
      "output": 822
    },
    "cost_usd": 0.095786,
    "tests": {
      "failing": 3,
      "second_try": []
    },
    "saved_at": "2026-11-11T15:50:06.856Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/support/run.mjs filters machine agent CLIs from PATH, supplies an empty HOME and removes agent and XDG environment settings. startRun and runOnce use runEnv. Four passing 0654 AC1 tests cover isolation, discovery and explicit test overrides."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "/tmp/speck-0654-tests.txt confirms the named 0622 integration test passes; its assertions require both the resumed build and new work to start after Claude's reset time."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0654 AC3 integration test supplies a fake signed-in Cursor CLI and verifies ticket 0002 starts on Cursor before Claude's limit resets, with its builder choice committed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The related run passed 948 tests. The two reported 0285 failures exercise unchanged panel behaviour independent of run.mjs's environment; the 0549 failure checks that four-second fake processes remain alive under load and reportedly passed twice alone. No regression attributable to this change was found."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The test helper now hides the machine's installed agents and personal settings while preserving agents supplied by tests. The original usage-limit test passes, and a new integration test confirms fallback to another ready agent still works. The reported failures do not indicate a regression from this change."
  }
}
```

</details>
