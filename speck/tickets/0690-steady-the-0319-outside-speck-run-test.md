---
id: "0690"
title: "Steady the 0319 outside-speck-run test"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-12-steady-the-0319-outside-speck-run-test.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T21:03:25.487Z"
approved: "2026-11-15T21:08:06.258Z"

---
# 0690 · Steady the 0319 outside-speck-run test

**Status:** 👍 approved

## Problem
"0319 AC1–AC4" in `test/seen-builds-0319.test.mjs` once saw speck run call build 0002 "already being built" instead of "being built outside speck run", at a load of about 20, then passed alone. A chance failure like this can fail the full suite on main and hold up every ship.

## Outcome
The test gives the same result every time, whether the cause was in the test or in speck run.

## Acceptance criteria
1. The build finds and writes in Notes which of these it was: the test writing 0002's run record after speck run first reads it, or speck run really labelling the build wrongly in a race.
2. If it was the test, the test waits for speck run to have read the records it wrote before checking the label. If it was speck run, speck run gives a build it didn't start the "being built outside speck run" label whenever the record says so, and a test shows the race no longer changes the label.
3. The test file passes 10 runs out of 10, run on its own with one busy process per core running beside it (a loop that never sleeps), as on a machine running several builds.
4. No test that passed before this change fails.

## Out of scope
- Other tests that fail under load: 0688 and 0689.

## Notes
- Seen in 0670's related run.
- Failing before this build: none
- Cause (AC1): speck run labelling the build wrongly in a race. On starting, speck run prints "watching for ready tickets" and then reads the run records it finds (adoptEarlierBuilds), which said "is already being built" of every running build, ignoring the record's `seen` mark; only later checks (adoptSeen) read it. Under load the test, which writes 0002's record as soon as it sees that line, wrote it before that first read had listed the folder, so 0002 got the start-up label. A build started in a conversation and running when speck run starts got the same wrong label.
- Fix: the start-up read labels a running build by its record (`adoptedAs`), as later checks do. `test/seen-builds-0690.test.mjs` writes the records before speck run starts, so the start-up read always finds them, and fails without the fix.
- AC3 checked by hand: `node --test test/seen-builds-0319.test.mjs` passed 10 runs out of 10 with 16 busy loops on 16 cores (load average about 36). Not a suite test, as it takes minutes.
- Self-check: no changes

## In plain words
When speck run starts while a build you started yourself (for example with /speck-build in a conversation) is already going, it now says that build "is being built outside speck run", as it already did for one it noticed later. Before, it could call it "already being built", as though another speck run had started it. That mix-up also made one of speck's own tests fail now and then on a busy machine, which could hold up shipping. To see it, start a build by hand, then start speck run: its first lines name the build as outside speck run.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 173,290
- Elapsed since build started: 5 min
- Changed lines: 2 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "4089a3110534289637f9047600ea486df0ff570c",
    "session": "fresh",
    "thread_id": "01a1e109-64d8-72b1-a3bd-a635208ebda0",
    "builder_response": "- Tests run: `speck test --related test/seen-builds-0690.test.mjs test/seen-builds-0319.test.mjs` (the ticket's own file, the 0319 file and every test file naming scripts/run.mjs, plus the checks).\n- AC1: the cause was in speck run. adoptEarlierBuilds, the read speck run makes right after printing \"watching for ready tickets\", hard-coded \"is already being built\" for any running build, ignoring `seen`. The 0319 test writes its records as soon as it sees that line, so under load they were sometimes there for that first read. Written in Notes.\n- AC2: adoptEarlierBuilds now labels with adoptedAs(rec), as adoptSeen does. test/seen-builds-0690.test.mjs writes the records before speck run starts (the race's losing order, made certain) and failed before the fix (\"0002 is already being built\").\n- AC3: checked by hand, not a suite test: 10/10 runs of test/seen-builds-0319.test.mjs with 16 busy loops on 16 cores (load ~36). Noted in the ticket.\n- AC4: related run passes, 358 tests, 0 failing.\n",
    "seconds": 27,
    "usage": {
      "input_tokens": 172535,
      "cached_input_tokens": 130560,
      "cache_write_input_tokens": 0,
      "output_tokens": 755,
      "reasoning_output_tokens": 17
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 41975,
      "cached": 130560,
      "write": 0,
      "output": 755
    },
    "cost_usd": 0.104556,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T21:07:58.805Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Ticket Notes identify the startup labelling race. scripts/run.mjs prints its watching message before adoptEarlierBuilds reads records; the previous startup label ignored seen. The 0690 regression test exercises this ordering deterministically."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "adoptEarlierBuilds now uses adoptedAs(rec), matching adoptSeen while preserving the switch label. Passing test '0690 AC2' creates both records before startup and checks that each receives the correct label."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "All ten /tmp/speck-0690-load-*.txt logs show the 0319 file passing seven tests with zero failures. Ticket Notes record 16 busy loops on 16 cores during these runs."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "/tmp/speck-0690-tests.txt reports 358 passes, zero failures and three skips, including the existing 0319 tests and new regression test. The branch's change is limited to the startup label, regression test and ticket."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The fix makes startup consistently identify builds started outside speck run. The new test reliably exercises the previously failing ordering, and all ten recorded load runs passed. No blocking concerns found."
  }
}
```

</details>
