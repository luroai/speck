---
id: "0231"
title: "Run the speck CLI inside the test process for output checks"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0230"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T22:13:32.859Z"

---
# 0231 · Run the speck CLI inside the test process for output checks

**Status:** 🔍 reviewing

## Problem
Tests check speck's commands by starting `node scripts/speck.mjs` as a new process, about 800 times across the suite. Each start takes about 0.2 s on an 8 GB MacBook Air before the command does anything, and most of these tests only check what a command prints or changes.

## Outcome
Tests that only check a command's output or changes run it inside the test process.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. `scripts/speck.mjs` exports a function that runs one speck command with given arguments, folder and environment, and returns its exit code and what it printed, without ending the process.
2. `node scripts/speck.mjs <command>` prints, changes and exits exactly as today.
3. The shared test helpers that run a speck command use that function, except for commands that keep running (such as `panel` and `run`) and tests about the command as a process (signals, being killed or its process tree), which still start a process.
4. No test that passed before this change fails.

## Out of scope
- Changing what any command does.

## Notes
- Commands end today by throwing a `SpeckError` with a code, caught at the bottom of `scripts/speck.mjs`, but some may call `process.exit` or change `process.cwd()` or `process.env` themselves; the function must leave those as they were.
- Write the suite's total test time before and after, on the same machine, in the Delivery log.
- Failing before this build: none
- Self-check: no changes. The first whole-suite run found three tests about speck as a process: pause, play and stop leave out speck's own process and its children (a test's stand-in build is one in-process), so the shared helper starts a process for them as for panel and run; the 0196 and 0212 ship tests now start `speck ship` as a process (`speckProcess`), as one finds it by its command line and the other kills it.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Suite time, on the same machine (16 cores, shared with other builds' test runs), from `speck test`'s TAP totals: 113.9 s before (2,015 tests), 108.5 s after (2,024 tests). Summed over every test, 1,433 s before and 1,259 s after, about 12% less. The suite's length is set mostly by the panel, run and browser tests, which still start real processes, so the wall time moved less.

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
    "reviewed_sha": "e375e8f62daf7dec8907adcac9cdd36fb119b206",
    "thread_id": "01a141ad-4cb4-7142-8212-2c9ac2a82f0f",
    "seconds": 42,
    "usage": {
      "input_tokens": 243975,
      "cached_input_tokens": 196224,
      "cache_write_input_tokens": 0,
      "output_tokens": 1587,
      "reasoning_output_tokens": 208
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T22:28:00.629Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "runCommand and the AC1 tests cover output, exit codes and process restoration, but scripts/in-process.mjs:setEnv retains inherited variables when the supplied environment explicitly gives them an undefined value."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/speck.mjs preserves the CLI dispatch and error handling. The AC2 comparison tests exercise output, changes and exit codes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "test/support/cli.mjs routes shared helpers through runCommand, retaining processes for long-running and process-sensitive commands. The AC3 parent-process test exercises this."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Verified full logs: before, 2,029 passed and zero failed; after, 2,038 passed and zero failed, with three skipped in each run."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/in-process.mjs",
        "issue": "setEnv deletes only keys absent from the supplied object, then skips undefined values. Consequently, an inherited variable remains visible when env explicitly sets it to undefined, instead of being omitted as with spawnSync. A read-only reproduction returned 'inherited' for such a variable inside runInProcess.",
        "suggested_fix": "Delete existing variables whose supplied value is undefined as well as those absent from the supplied environment. Add a regression test checking omission inside the command and restoration afterwards.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "minor",
        "file": "speck/tickets/0231-run-the-speck-cli-inside-the-test-process-for-outp.md",
        "issue": "The Delivery log lacks the requested before-and-after suite timings. The available logs show 113.947 seconds before and 108.487 seconds after.",
        "suggested_fix": "Record both timings in the Delivery log and confirm they came from the same machine.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The shared test helpers now run ordinary commands inside the test process, and the full suite passes. One environment-handling edge case needs fixing: a variable explicitly omitted by the caller can still leak into the command. The requested timing record also remains to be filled in."
  }
}
```

</details>
