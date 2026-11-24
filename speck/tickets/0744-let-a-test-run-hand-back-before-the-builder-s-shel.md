---
id: "0744"
title: "Let a test run hand back before the builder's shell limit while it waits"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
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
source: "speck/ideas/done/2026-11-24-let-a-test-run-outlast-the-builder-s-shell-limit-while-it-waits.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T23:15:21.686Z"
approved: "2026-11-24T23:42:00.630Z"

---
# 0744 · Let a test run hand back before the builder's shell limit while it waits

**Status:** 👍 approved

## Problem
When `speck test` waits for a turn behind other builds' runs (`max_parallel_tests`), it can wait past the builder's 10-minute shell limit and be killed before running a test. In 0711's build a run did exactly that, so a busy machine stops a build partway for no reason of its own.

## Outcome
A `speck test` run that would wait past the shell limit hands back in time and tells the builder how to carry on.

## Acceptance criteria
1. When `speck test` has waited for a turn for 8 minutes without starting, it exits with a distinct exit code and a line saying it gave up its place in the queue and to run the same command again, as `speck review` does at its limit (0384).
2. Run again with the same arguments, it takes its turn as soon as one is free; a run that gets a turn within 8 minutes behaves as today.
3. The speck-build skill tells the builder what that exit code means and to run the command again. (checked by review)
4. No test that passed before this change fails.

## Out of scope
- Changing `max_parallel_tests` or how turns are shared.

## Notes
- From 0711's build: "Waiting for a turn to run the tests: max_parallel_tests is 2, and 2 runs are already going", then killed at 10 minutes.
- `speck review` hands back with exit 12 and `--wait` (0384), which this can follow.
- Failing before this build: none
- Self-check: reset the give-up setting when `speck test` ends, so a later command in the same process (0231) never gives up; a test that waited on a killed but unreaped holder hung, so it now waits for the holder's exit.
- Pictures: none needed, nothing anyone sees in the panel changes.

## In plain words
When several builds are running and one has to queue to run its tests, it no longer waits so long that its agent's ten-minute command limit cuts it off partway. After eight minutes in the queue the test run steps out, says that no tests ran and gives the exact command to run again, and the builder runs it again and carries on. Shipping and the full test suite still wait as long as they need to. You won't normally see this. On a busy machine, a build's log may show a test run giving up its place and starting again, which is expected.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 194,332
- Elapsed since build started: 27 min
- Changed lines: 27 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up (tidy-up, no idea note): the speck-review skill's "Before every round" also tells the builder to run tests in the foreground but doesn't mention exit 19; the speck-build skill's Rules cover it.

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
    "reviewed_sha": "b2eb0b6af44a17ef03a4ecaf022ed6b54f0735ca",
    "session": "fresh",
    "thread_id": "01a20fef-9dc9-74c3-8b2e-855aa1f79bb1",
    "builder_response": "- Tests run: `speck test --related test/turns-0744.test.mjs` (the ticket's own file plus 172 related test files it chose, with commands.checks): 1938 tests, 0 failing.\n- Design: `cmdTest` (only `speck test`, full, --files or --related) sets a wait limit for `inTurn` (8 minutes, or SPECK_TURN_WAIT_MS for speck's own tests) and the command to run again; it's reset in a finally, so a later command in the same process (0231) never gives up. While waiting, holding no turn, `inTurn` throws a SpeckError with exit 19 (no other command uses 19). `speck ship` and the full suite never set it, so they keep waiting (tested).\n- AC3 is in skills/speck-build/SKILL.md's Rules (waiting for commands); the brief's `speck test` row says the same.\n",
    "seconds": 21,
    "usage": {
      "input_tokens": 193745,
      "cached_input_tokens": 139392,
      "cache_write_input_tokens": 0,
      "output_tokens": 587,
      "reasoning_output_tokens": 25
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 54353,
      "cached": 139392,
      "write": 0,
      "output": 587
    },
    "cost_usd": 0.1285152,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T23:41:51.683Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/turns.mjs: cmdTest sets an eight-minute limit; inTurn throws exit 19 after waiting and removes the waiting claim in finally. Passing AC1 tests exercise full and --files runs, checking the retry message, no tests run and queue cleanup."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing AC2 tests in test/turns-0744.test.mjs exercise retrying identical arguments after a turn frees, immediate acquisition and acquisition after a shorter wait. inTurn preserves the existing turn-sharing logic."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md Rules explains exit 19, that no tests ran, and instructs the builder to repeat the printed command in the foreground until another exit code is returned."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0744-tests.txt: 1938 tests, 1935 passed, three skipped and zero failures. The branch change adds tests without weakening existing ones; the whole-suite check remains the shipping gate."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Test runs now give up after waiting eight minutes and tell the builder how to retry. Tests cover timeout, cleanup and successful retries, while shipping continues to wait. The relevant tests pass, and I found no blocking issues."
  }
}
```

</details>
