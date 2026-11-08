---
id: "0572"
title: "Give tests session names no other run shares"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-29-give-tests-session-names-no-other-run-shares.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-08
started: "2026-11-08T23:15:19.379Z"
approved: "2026-11-08T23:34:09.997Z"

---
# 0572 · Give tests session names no other run shares

**Status:** 👍 approved

## Problem
speck finds a resumed build by looking for its session name across every process on the machine. Tests that start a stand-in agent with a fixed session name, such as `hand-0001` in `test/seen-builds-0300.test.mjs`, can find another test run's copy when the same file runs twice at once, and fail by chance: `0300 AC2` did so beside the suite in 0559's runs.

## Outcome
Tests that are found through the process table give their stand-in agents session names unique to the test run, as 0559 did for `resumed-0002`.

## Acceptance criteria
1. Every test that starts a stand-in agent process with a session name that speck finds through the process table uses a name unique to its test run, and the Delivery log lists the tests changed.
2. Two copies of each changed test file, run at the same time, both pass, five times in a row, recorded in the Delivery log.
3. Each changed test still fails if speck stops finding the build by its session name: the Delivery log says how this was checked.
4. No test that passed before this change fails.

## Out of scope
- How speck finds a resumed build.

## Notes
- Asked for 2026-11-08 for release 0.22.0, alongside 0563 to 0568 (speck decides and tells you): "Agree to all of that including 4. Set it all ready and get a release out".
- From 0559's own runs. 0559 made `resumed-0002` unique with the test process's pid (`test/seen-builds-0300.test.mjs`, around line 172).
- Relies on nothing outside this repo.
- Failing before this build: none
- AC2, AC3 and AC4 are checked by runs recorded in the Delivery log, not by tests in the suite: two copies run five times over, or a broken lookup, would cost every later ticket's ship. AC3's check is also in the code: `assertFoundBySession` runs in each changed test.
- Self-check: a lookup added to tests whose stand-in lived only 3 seconds could have flaked under load, so those stand-ins now live 30 seconds (speck run doesn't wait for them, and the tests kill them).

## In plain words
Nothing changes for anyone using speck: this only touches its own tests. Some tests pretended to be a running build under a fixed name, so two copies of a test running at once could mistake each other's build for their own and fail by chance. Each now uses a name no other run has. To see it, run two copies of the same test file at once: they pass every time now, where one of them used to fail now and then. Nothing to keep an eye on.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 180,698
- Elapsed since build started: 19 min
- Changed lines: 0 (limit 5000)
Tests changed (AC1): each now gives its stand-in a session name with the test run's pid in it (`ownSession`).
- `test/seen-builds-0300.test.mjs`, all through `agentBuilding` (was `hand-<id>`): the 0300 tests "keeps its own process", "a command that names no ticket", "stops counting once its ticket is approved", "doesn't hold up switching to new code", and "counts a build started outside it".
- `test/run-codex-0289.test.mjs`: 0289 AC3 "resumes a killed Codex build" (was `thread-k`, and `u-1` in its environment).
- `test/run-cursor-0290.test.mjs`: 0290 AC1 "makes a chat" (was `chat-0290`) and 0290 AC2 "resumes a killed Cursor build" (was `chat-k`).

How the set was found: read every place in the tests that starts a process with a session, and listed every session name in the process table every 20 ms while the 60 test files that start real builds ran. Left as they are, as speck never looks them up: reviewer sessions (`S1`, `C1`, `DS1`, `S7`, `chat-7`, `T1`), which no build's run record names, and the short wrapper calls in `run-provider-0391` (`s1`, `s2`, `s3`, `sa`, `sess-a`), which have no run record. Run records with fixed sessions and no stand-in naming them (such as `sess-1`, `old-0001`) start no process with that name. Tests already using generated UUIDs or 0559's pid name are unchanged.

Two copies at the same time (AC2), each changed file, on the final code: `seen-builds-0300` 5/5 rounds both passed, `run-codex-0289` 5/5, `run-cursor-0290` 5/5. The same runs on the old versions of the files: `seen-builds-0300` failed in 2 of 5 rounds, on "counts a build started outside it", which is the clash this ticket fixes; the 0289 and 0290 files happened not to clash in 5 rounds.

Still fails if speck stops finding the build by its session name (AC3): `assertFoundBySession` in each changed test (through `agentBuilding` for 0300) asserts both of speck's lookups. Checked by making `sessionProcess` return null, then separately making `sessionInUse` return false, and running the three files: all 8 changed tests failed each time, and the scripts were put back.

No test that passed before now fails (AC4): `speck test --related` on this ticket's files ran 823 tests, 820 passed, 3 skipped, none failed. `speck ship` runs the whole suite.

Follow-ups: `sessionProcess` takes speck's `codex-times` wrapper for the agent, since its script's name starts with `codex`, so a resumed Codex build is found as the wrapper rather than Codex itself. It's harmless today and out of this ticket's scope.

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
    "reviewed_sha": "3f3daa282eb1c672a9fac757b1763bcfc5685031",
    "session": "fresh",
    "thread_id": "01a1bd82-95d5-7ce3-b070-59e76ef2fac5",
    "builder_response": "- Tests run: `speck test --related test/session-names-0572.test.mjs test/seen-builds-0300.test.mjs test/run-codex-0289.test.mjs test/run-cursor-0290.test.mjs` (the ticket's own file, the changed test files, and every test file naming a changed file).\n- No production code changes: only tests and `test/support/run.mjs`.\n- AC2 and AC3 are recorded in the Delivery log. AC3 is also enforced in the code by `assertFoundBySession`, which runs in each changed test.\n- Note for the scope of AC1: the Delivery log explains how the set of tests was found (reading the spawn sites and sampling the process table during the 60 test files that start real builds), and which fixed names were left alone and why.\n",
    "seconds": 26,
    "usage": {
      "input_tokens": 179925,
      "cached_input_tokens": 121728,
      "cache_write_input_tokens": 0,
      "output_tokens": 773,
      "reasoning_output_tokens": 91
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 58197,
      "cached": 121728,
      "write": 0,
      "output": 773
    },
    "cost_usd": 0.1362968,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-08T23:34:00.472Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/support/run.mjs ownSession appends process.pid. The affected stand-ins in seen-builds-0300, run-codex-0289 and run-cursor-0290 use it consistently in commands, records and assertions. The Delivery log lists the eight affected tests. The four 0572 tests passed, including a real process lookup."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The Delivery log records five consecutive simultaneous paired runs passing for each of the three affected existing test files. It also records reproducing the original collision with the old seen-builds-0300 tests."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Each affected test calls assertFoundBySession, directly or through agentBuilding. This asserts sessionProcess returns the expected PID and sessionInUse returns true. The Delivery log records all eight tests failing with each lookup separately disabled."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The full recorded output in /tmp/speck-0572-tests.txt confirms 823 tests: 820 passed, three skipped and none failed. The ticket's change is confined to test files, their support helper and its delivery record; production lookup behaviour is unchanged."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The affected tests now use session names unique to their running process, preventing simultaneous runs from finding each other's stand-in agents. The recorded repeated runs pass, and explicit checks ensure the tests still detect broken session lookup. No blocking concerns found."
  }
}
```

</details>
