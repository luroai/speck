---
id: "0460"
title: "Time each line speck run writes"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T09:21:18.556Z"
approved: "2026-10-24T09:27:32.223Z"

---
# 0460 · Time each line speck run writes

**Status:** 👍 approved

## Problem
speck run's output, which the panel shows as the pipeline log from `speck/.cache/runs/run.log`, has no times, so you can't tell when anything in the pipeline happened.

## Outcome
Each line speck run writes says when it was written.

## Acceptance criteria
1. Each line speck run writes to its output, and so to `run.log` when the panel's switch started it, starts with the local time as `HH:MM:SS` and a space, as a build log's lines do (0422).
2. When one message runs over several lines, only its first line has the time. The lines after it start with nothing added.
3. Lines already in `run.log` stay as they are. No test that passed before this change fails.

## Out of scope
- How the panel shows the log (0459).
- Dates, or times in build or ship logs.

## Notes
- Asked for by the user on 2026-10-24: the pipeline log "with timestamps … just like all the individual ticket build logs."
- `run.log` is speck run's own output, sent to the file by `panelRunOn` in `scripts/panel-run.mjs` (0128), so started from a terminal, speck run's output is timed too.
- The build log's time form is matched by `logParts` in `templates/panel.js`: `^(\d\d:\d\d:\d\d )`.
- Failing before this build: none
- Two existing tests matched `^speck run: watching` in run.log; that line now starts with its time, so both now expect `HH:MM:SS ` before it (`test/flaky-0207.test.mjs`, `test/panel-0220.test.mjs`).
- The timing is switched on in `cmdRun` only when this process is `speck run` itself, as `scripts/speck.mjs` is at its 600-line limit, and so a test running `cmdRun` inside its own process isn't left timed.
- Self-check: no changes (checked console.warn and console.info aren't used, an empty message, the `speck` bin and the worker's own process).

## In plain words
Every line in the panel's pipeline log, and in speck run's output in a terminal, now starts with the time it was written, such as `14:32:05`, just as each ticket's build log does. A message that runs over several lines has the time on its first line only. To see it, turn speck run on in the panel and open the pipeline log. Lines written before this change keep no time, so an older log mixes timed and untimed lines until it moves on.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 175,283
- Elapsed since build started: 6 min
- Changed lines: 28 (limit 5000)
- Follow-ups: none.

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
    "reviewed_sha": "9048c4394816758c3d3c0355bf353e8378528866",
    "session": "fresh",
    "thread_id": "01a16d3c-1048-7940-b174-752fa5bdef0d",
    "builder_response": "- Tests run: `speck test --related test/run-times-0460.test.mjs test/flaky-0207.test.mjs test/panel-0220.test.mjs` (the ticket's own file, the two existing files it changed, and the 18 related files it brought in; with the `commands.checks` files).\n- Earlier, with all 57 test files that start or read speck run, two CPU-time checks failed under that load (`build-log-0176` \"the board stays quick to read\", `quick-waits-0232` AC3); run alone straight after, both passed.\n- `test/flaky-0207.test.mjs` and `test/panel-0220.test.mjs` matched `^speck run: watching` in run.log; that line now starts with its time, so both expect `HH:MM:SS ` before it.\n",
    "seconds": 28,
    "usage": {
      "input_tokens": 174524,
      "cached_input_tokens": 130688,
      "cache_write_input_tokens": 0,
      "output_tokens": 759,
      "reasoning_output_tokens": 59
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T09:27:23.094Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/run-times.mjs timeRunOutput prefixes console.log and console.error using local clock fields. scripts/run.mjs enables it in cmdRun and runWorker. Passing 0460 tests cover formatting and CLI refusals; the changed panel tests verify timed output in run.log."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "timedMessage prefixes the message once, preserving embedded newlines. Passing 0460 AC2 tests exercise multiline console output and an actual two-line CLI refusal."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "No code rewrites existing logs; panelRunOn retains append mode. The passing 0460 AC2 AC3 integration test confirms existing content remains unchanged. The reported test run, verified in /tmp/speck-0460-tests.txt, has 254 passes, three skips and no failures."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "speck run now adds local times to its messages, including errors and output after switching to new code. Multiline messages receive one timestamp, and existing log entries remain unchanged. The relevant tests pass; no blocking concerns found."
  }
}
```

</details>
