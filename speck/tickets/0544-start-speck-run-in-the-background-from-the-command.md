---
id: "0544"
title: "Start speck run in the background from the command line"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-25-turn-speck-run-on-in-the-background-from-the-command-line.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-28T09:43:27.204Z"

---
# 0544 · Start speck run in the background from the command line

**Status:** 🔍 reviewing

## Problem
There's no command to turn `speck run` on in the background, as the panel's switch does. Setup starts it with a shell line (`nohup … run >> run.log &`) and reads the log a few seconds later to guess whether it started, which depends on the agent's shell and on how long it waits. Other agents and scripts have no plain way to do it either.

## Outcome
`speck run --background` turns `speck run` on in the background, as the panel's switch does, and says whether it's on.

## Acceptance criteria
1. `speck run --background` starts `speck run` in its own process, which keeps running after the shell that started it ends, with its output added to `speck/.cache/runs/run.log`. It returns once `speck run` is watching, printing one line that says it's on and where its log is, and exits 0.
2. With `speck run` already running in this repo, it starts nothing, prints that it's already running, and exits 0.
3. If `speck run` refuses or stops before it's watching (for example off the base branch), it prints `speck run`'s own message, leaves nothing running and exits with a non-zero code.
4. Setup's step that turns `speck run` on (section 8, step 5 of the `speck-setup` skill) runs `speck run --background` and reports from what it prints, with no `nohup` line or reading of the log. The brief and `speck help` list `--background` for `speck run`.
5. No test that passed before this change fails.

## Out of scope
- A `--stop` for `speck run`: the panel's switch and Ctrl+C stop it today.
- Changing what `speck run` does once it's on.

## Notes
- From 0510's build: speck had no command for this, so setup copies what the panel's switch does.
- Today: the panel's switch starts it with `panelRunOn` in `scripts/panel-run.mjs` (detached, output to `run.log`, refusal from its own file, 0220); `speck panel --background` is `scripts/panel-background.mjs` (0509), whose messages this should match in style.
- Failing before this build: none
- Self-check: speck.mjs was over the 600-line limit, so `--background` loads its code only when given; the panel switch's time-out now names the process it started, so `--background` can stop it rather than leave it running. The time-out itself (10 seconds) has no test, to keep the suite quick.
- Changed test: `test/setup-0510.test.mjs` 0510 AC3 checked for setup's `nohup` line, which AC4 here removes; it now checks for `speck run --background`.

## In plain words
There's now a command, `speck run --background`, that turns automatic building on and leaves it running on its own, just like the switch at the top of the panel's Settings. It waits until it's really on, then says so in one line and where its log is. If it's already on, it says that and starts nothing; if it can't start, for example because the project isn't on its main branch, it says why and leaves nothing running. Setting speck up now uses this command instead of a shell trick and a guess from the log. To see it, run it in a project with speck set up, then look at the switch in Settings: it shows on. Worth knowing: to turn it off, use that switch.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - The panel's switch still leaves a speck run that timed out running: speck/ideas/2026-10-28-stop-speck-run-when-the-panel-switch-times-out.md.
  - `speck run --stop` stays out of scope here; the panel's switch and Ctrl+C stop it.
  - test/review-wait-0384.test.mjs "0384 AC3" failed once under the load of a related run and passed on its own: timing-sensitive, unrelated to this change.

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
    "reviewed_sha": "d75360e7bf49c1f4aeb5f77029cd074959fc3c45",
    "session": "fresh",
    "thread_id": "01a181f3-8b9c-7940-9a30-142f72c10c70",
    "builder_response": "- Tests run: `speck test --related test/run-background-0544.test.mjs test/setup-0510.test.mjs test/build-log-0291.test.mjs test/spend-0530.test.mjs test/review-wait-0384.test.mjs test/docs-0267.test.mjs` (the ticket's own file, the changed 0510 test, the files of tests that failed in the previous related run, and every test file naming a changed file).\n- One failure in that run: `0384 AC3: the panel shows the round as running through every exit 12` in test/review-wait-0384.test.mjs. It's timing-sensitive under the load of the related run, touches nothing this ticket changes, and passes when its file is run on its own (`speck test --files test/review-wait-0384.test.mjs`: 122 pass, 0 fail).\n- Changed existing test: test/setup-0510.test.mjs 0510 AC3 asserted setup's `nohup` line, which AC4 of this ticket removes; it now asserts `speck run --background`.\n- `speck run --background` reuses the panel switch's `panelRunOn`; its time-out result now carries the pid it started, so `--background` stops that process group rather than leave it running. speck.mjs is at the 600-line limit, so it loads `scripts/run-background.mjs` only when `--background` is given.\n",
    "seconds": 47,
    "usage": {
      "input_tokens": 159796,
      "cached_input_tokens": 112000,
      "cache_write_input_tokens": 0,
      "output_tokens": 1049,
      "reasoning_output_tokens": 120
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 47796,
      "cached": 112000,
      "write": 0,
      "output": 1049
    },
    "cost_usd": 0.117282,
    "tests": {
      "failing": 1,
      "second_try": []
    },
    "saved_at": "2026-10-28T10:00:31.104Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "runBackground reuses panelRunOn's detached process and append-only run.log. The passing 0544 AC1 AC2 test checks successful output, the watching message, process group and survival after the launching shell exits."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "running() checks the lock and recorded run before spawning. The passing 0544 AC1 AC2 test checks that the second invocation keeps the same process and adds nothing to its log."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "The refusal tests pass, but startBackground's timeout branch sends SIGTERM and immediately exits without confirming termination. No test exercises this cleanup path."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Setup section 8 step 5 now invokes speck run --background and reports its output. The brief and CLI help document the option; both 0544 AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "All ticket tests passed. The reported 0384 failure concerns unchanged review-wait behaviour and reportedly passed when rerun separately; the change provides no apparent regression mechanism for it."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/run-background.mjs",
        "issue": "On startup timeout, startBackground sends SIGTERM and immediately throws; runBackground then calls process.exit. Sending a signal does not establish that the child stopped. A child blocked in synchronous startup work, or a stopped process, can remain alive after the command reports failure, violating the promise to leave nothing running.",
        "suggested_fix": "Wait for the spawned process to terminate before returning failure, with bounded escalation if SIGTERM does not stop it. Add a focused test of timeout cleanup; use an injectable short timeout or equivalent fixture to keep it quick.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Normal background startup, repeat invocation and refusal handling work in the supplied tests, and setup uses the new command. One failure path needs fixing: after a startup timeout, the command can report failure before its background process has actually stopped."
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
    "reviewed_sha": "38df761f26053d9f3fe65639a127ed8c1221b006",
    "session": "continued",
    "thread_id": "01a181f3-8b9c-7940-9a30-142f72c10c70",
    "builder_response": "- Tests run: test/run-background-0544.test.mjs test/setup-0510.test.mjs test/panel-0220.test.mjs test/panel-0128.test.mjs test/review-wait-0384.test.mjs (the ticket's own file, the changed 0510 test, the panel switch tests for panel-run.mjs, and 0384, which failed under load in the last related run).\n- F1: fixed. scripts/run-background.mjs: new `stopStarted(pid, ms)` sends SIGTERM to the process group, waits up to 5 s for it to go, then SIGKILL and waits again; if it's still there it fails saying which process to stop. The time-out branch awaits it before failing. `panelRunOn` in scripts/panel-run.mjs takes an optional `{ ms }` (default unchanged, 10 s) so the time-out can be tested quickly via exported `startBackground(repo, { ms })`. New tests: \"0544 AC3: a speck run that doesn't say it's watching in time has stopped before the command fails\" (real speck run, 1 ms limit) and \"0544 AC3: one that ignores SIGTERM is killed, and the command waits until it has gone\". Both check once that the process has gone, on purpose, since the code under test is what waits; they're written so the repo's 0173 check (which forbids one-off checks after a test stops a process itself) doesn't apply, with a comment saying why.\n",
    "seconds": 25,
    "usage": {
      "input_tokens": 266996,
      "cached_input_tokens": 211200,
      "cache_write_input_tokens": 0,
      "output_tokens": 1678,
      "reasoning_output_tokens": 120
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 8000,
      "cached": 99200,
      "write": 0,
      "output": 629
    },
    "cost_usd": 0.03221,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-28T10:05:31.989Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panelRunOn starts a detached process with output appended to run.log. The passing 0544 AC1 AC2 test checks shell survival, process group, watching output, the single confirmation line and exit code 0."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "startBackground checks running(repo) before spawning. The passing AC1 AC2 test verifies the second invocation reports the existing process, exits 0 and starts nothing."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Refusal tests verify the original message, non-zero exit and absence of a running child. startBackground now awaits stopStarted on timeout; two passing tests verify termination before failure and escalation when SIGTERM is ignored."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Setup section 8 step 5 invokes speck run --background and reports its output without nohup or log reading. The brief and help list the option; both AC4 tests pass."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied round reports 150 passed, 0 failed and 3 skipped, including the previously failing review-wait file and the existing panel switch tests."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/run-background.mjs",
        "issue": "The timeout path previously returned failure without confirming that its child had stopped.",
        "suggested_fix": "Implemented: await termination, escalate to SIGKILL if necessary, and test both timeout cleanup and a process that ignores SIGTERM.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The command starts speck in the background, reports whether it is on, and handles existing runs and startup refusals. Timeout cleanup now waits for the process to stop. All five criteria pass, with no remaining blocking findings."
  }
}
```

</details>
