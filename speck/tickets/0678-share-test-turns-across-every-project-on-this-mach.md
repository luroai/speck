---
id: "0678"
title: "Share test turns across every project on this machine"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0678 · Share test turns across every project on this machine

**Status:** 🔍 reviewing

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

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
