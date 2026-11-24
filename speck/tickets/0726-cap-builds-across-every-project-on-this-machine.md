---
id: "0726"
title: "Cap builds across every project on this machine"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
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
source: "speck/ideas/2026-10-11-show-all-your-projects-in-one-panel.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T15:15:44.235Z"

---
# 0726 · Cap builds across every project on this machine

**Status:** 🔍 reviewing

## Problem
`max_parallel_builds` applies to each project on its own, so several projects' speck runs can start many builds at once; five builds ran this machine out of memory. 0678 capped test runs across projects, but not builds.

## Outcome
A home-folder setting caps how many builds go at once across every project on the machine.

## Acceptance criteria
1. `speck config set machine_parallel_builds <n>` saves a limit in the home folder, as `machine_parallel_tests` is saved, and `speck config show` shows it after `max_parallel_builds`.
2. With it set to n, the speck runs of every project on this machine start no new build while n builds are running across all of them; ready tickets wait and start as builds end.
3. Each project's `max_parallel_builds` still applies within that project.
4. Unset, each project's `max_parallel_builds` alone applies, as today, and values `speck config set` refuses for `machine_parallel_tests` (such as 0) are refused the same way.
5. No test that passed before this change fails.

## Out of scope
- Showing or changing it in the panel's Settings.
- The rest of one panel for every project, which stays in the idea.

## Notes
- Failing before this build: test/tmp-cleanup.test.mjs AC1 (Node 24 no longer emits TAP `# fail 2` for a piped `node --test` child; also breaks several 0676 location parses the same way). Unchanged here. The recorded full-suite result was pass.
- Self-check: no changes (invalid home values refuse; unset leaves projects alone; a freed claim opens a slot again; adopted builds force-claim so they still count)
- Follow 0678's pattern for test turns: `scripts/home-settings.mjs` (`HOME_SETTINGS`) and its machine-wide turn-taking.
- Shares `scripts/home-settings.mjs` with the ticket that shows the machine-wide test limit in Settings; left unchained, as one adds a setting and the other adds the panel's save path.

## In plain words
You can set `machine_parallel_builds` once for the whole machine (in your home folder, same place as the test-run cap). With it set to n, every project's speck run shares that many build slots; ready work waits when the machine is full, and each project's own `max_parallel_builds` still applies inside that project. Leave it unset and nothing changes. Try it with `speck config set machine_parallel_builds 2` in any project, then `speck config show`.

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
    "reviewed_sha": "a58f40f1867f274deb243b8f3addf054444a0c3f",
    "session": "fresh",
    "thread_id": "01a20e4b-6a6f-7f41-9a4a-6b77409bdc89",
    "builder_response": "- Tests run: test/machine-builds-0726.test.mjs test/builder-stand-in-0647.test.mjs test/machine-turns-0678.test.mjs (with commands.checks alongside). All 0726, 0647 and 0678 tests passed. The only failure is test/tmp-cleanup.test.mjs AC1, listed as failing before this build (Node 24 no longer emits TAP `# fail 2` for a piped child).\n- Related run earlier also pulled in docs/brief.md and several scripts; failures there were the same Node 24 TAP/location issue (0676) or already failing on main (0239 AC2 retry), not this change. 0647's source check was updated so it matches `hasBuildRoom` / `room` (0726 machine slots).\n",
    "seconds": 31,
    "usage": {
      "input_tokens": 199036,
      "cached_input_tokens": 140672,
      "cache_write_input_tokens": 0,
      "output_tokens": 1063,
      "reasoning_output_tokens": 102
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 58364,
      "cached": 140672,
      "write": 0,
      "output": 1063
    },
    "cost_usd": 0.1414252,
    "saved_at": "2026-11-24T16:03:03.648Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "home-settings.mjs registers machine_parallel_builds and inserts its display row after max_parallel_builds. The passing 0726 AC1 CLI tests exercise saving, showing and removing it across projects."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The passing 0726 AC2 tests cover ordinary waiting and release, but build-turns.mjs permits concurrent readers to delete claims during writes (F1), and resume paths consume pending work before successfully claiming capacity (F2)."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "hasBuildRoom checks runningSize against projectMax first. The passing 0726 AC3 integration test verifies a project limited to one build waits even when the machine limit is five."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "machineCount and setHomeSetting apply the existing positive-integer validation. Passing 0726 AC4 tests cover invalid values, flags and concurrent projects with the setting unset."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied test output shows the ticket tests and changed 0647 test passing, together with 0678 regression coverage. Its sole failure is the unchanged tmp-cleanup failure recorded before this build."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/build-turns.mjs:38",
        "issue": "Claim cleanup is not synchronised with claim writes. machineBuildWait calls heldClaims without the directory lock, while takeBuildTurn and pointBuildTurn use writeFileSync, which truncates before writing. Another process can read an empty claim, treat its missing pid as dead and delete it. A running build then stops counting, allowing the machine cap to be exceeded. pointBuildTurn also writes outside the directory lock.",
        "suggested_fix": "Synchronise claim reads, cleanup, updates and release under the same lock, and publish claim contents atomically. Add a concurrency regression test that exercises inspection during claim creation and PID replacement.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/run.mjs:339",
        "issue": "Resume paths commit their one-time state before startBuild acquires a machine slot, and ignore its new false return. Another project can claim the last slot after hasBuildRoom succeeds. resumeKilled then records 'resumed' without starting anything, preventing its automatic retry. goWithQueue similarly removes the pending recommendation before the claim succeeds; usage-limit queues also consume pending state before starting.",
        "suggested_fix": "Acquire capacity before consuming resume state, or restore pending state when capacity acquisition fails. Audit every startBuild caller and add a regression test where another project takes the last slot between the preliminary check and the actual claim.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The setting and normal waiting behaviour work in the supplied tests. Two concurrency bugs still need fixing: simultaneous activity can lose a build's slot record and exceed the cap, or leave a resumed build stranded without starting it."
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
    "reviewed_sha": "33bc4be7824515a665c70d3acdcf4e0577a3cd39",
    "session": "continued",
    "thread_id": "01a20e4b-6a6f-7f41-9a4a-6b77409bdc89",
    "builder_response": "- Tests run: test/machine-builds-0726.test.mjs test/builder-stand-in-0647.test.mjs test/machine-turns-0678.test.mjs (with commands.checks alongside). All 0726 tests passed, including new F1/F2 regressions. The only failure is test/tmp-cleanup.test.mjs AC1, listed as failing before this build (Node 24 TAP).\n- F1: fixed. Claim cleanup, waits, take, point and free now all run under the directory lock in `scripts/build-turns.mjs`; claim contents are published with write-temp-then-rename so a reader never sees a truncated file. Regression: `0726 F1` hammers waits and PID updates from eight processes while a live claim is held.\n- F2: fixed. `resumeKilled` claims a machine slot before marking the run record resumed, and drops the claim if the save fails; go-with, hand-back, usage-limit and reviewer-limit restore their pending state when `startBuild` returns false; foreman resume puts the resume back on the queue. Regressions: killed build stays unmarked while the machine is full then resumes once a slot frees; go_with is put back when `startBuild` returns false after the room check.\n",
    "seconds": 24,
    "usage": {
      "input_tokens": 395287,
      "cached_input_tokens": 307072,
      "cache_write_input_tokens": 0,
      "output_tokens": 1988,
      "reasoning_output_tokens": 168
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 29851,
      "cached": 166400,
      "write": 0,
      "output": 925
    },
    "cost_usd": 0.085592,
    "saved_at": "2026-11-24T16:15:48.088Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "home-settings.mjs registers, saves and displays machine_parallel_builds after max_parallel_builds. Passing 0726 AC1 tests exercise persistence, cross-project display and removal."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "Passing AC2 integration tests cover machine limits of one and two. F1 is fixed, but usage-limit and reviewer-limit resumes can still lose their pending retry after a failed slot claim (F2)."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "hasBuildRoom retains the project limit check. The passing 0726 AC3 integration test verifies that max_parallel_builds of one still holds with a machine limit of five."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing 0726 AC4 tests exercise unset behaviour, invalid positive-integer values and refusal of --repo and --machine. Both home limits share validation."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied run passes all 0726, 0647 and 0678 tests and the other executed checks except the unchanged tmp-cleanup failure listed before this build."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/build-turns.mjs",
        "issue": "The original race between truncated claim writes and concurrent cleanup is fixed: claims are published by rename, and inspection and updates use the directory lock. The passing eight-process F1 regression exercises concurrent inspection and updates.",
        "suggested_fix": "No further change required for the original finding.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/usage-limit.mjs:80",
        "issue": "The fix remains incomplete for usage-limit and reviewer-limit resumes. carryOn saves a run record with exited removed before calling startBuild. When startBuild returns false, callers restore their queue entry but leave that run record changed. On the next check, usageLimitQueue treats a record without exited as movedOn and removes the pending entry; reviewerLimitQueue does the same. The build therefore still loses its automatic resume when another project takes the last slot. The new regressions cover killed builds and go_with, but neither affected limit queue.",
        "suggested_fix": "Restore the original run record as well as pending queue state when startBuild returns false, or reserve capacity before changing either. Add regression tests for both limit queues that reject the first start, run another check after capacity becomes available, and verify the build actually starts.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The claim-writing race is fixed, and the normal machine cap works in the supplied tests. One retry bug remains: builds waiting for a builder or reviewer usage limit can still be stranded when another project takes the last available slot."
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
    "reviewed_sha": "2196f75897d72a128e6459f37ae0b1d8084b03bc",
    "session": "continued",
    "thread_id": "01a20e4b-6a6f-7f41-9a4a-6b77409bdc89",
    "builder_response": "- Tests run: test/machine-builds-0726.test.mjs test/builder-stand-in-0647.test.mjs test/machine-turns-0678.test.mjs (with commands.checks alongside). All 0726 tests passed, including the new usage-limit and reviewer-limit F2 regressions. The only failure is test/tmp-cleanup.test.mjs AC1, listed as failing before this build.\n- F2: fixed. `carryOn` in `scripts/usage-limit.mjs` now restores the original run record (with its exit) when `startBuild` returns false, so usage-limit and reviewer-limit queues still see `exited` on the next check and keep the ticket on the wait list. Regressions: builder and reviewer limit waits reject the first start, keep their pending state, then start once `startBuild` succeeds.\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 622874,
      "cached_input_tokens": 519808,
      "cache_write_input_tokens": 0,
      "output_tokens": 2724,
      "reasoning_output_tokens": 168
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 14851,
      "cached": 212736,
      "write": 0,
      "output": 736
    },
    "cost_usd": 0.0583356,
    "saved_at": "2026-11-24T16:19:09.437Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "home-settings.mjs saves machine_parallel_builds in the home settings and displays it after max_parallel_builds. Passing 0726 AC1 CLI tests cover persistence, cross-project display and removal."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "takeBuildTurn enforces capacity under a directory lock. Passing AC2 integration tests exercise limits of one and two across projects and starts after release. F1 and F2 regressions cover concurrent claim updates and retrying resumes after refused claims."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "hasBuildRoom checks the project limit first. The passing 0726 AC3 integration test verifies max_parallel_builds of one still applies with a machine limit of five."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Both home limits share positive-integer validation. Passing 0726 AC4 tests cover invalid values, refused flags and independent project builds when the machine limit is unset."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied run reports 181 passing tests and three skips. Its only failure is the unchanged tmp-cleanup failure recorded before this build. All executed 0726, 0647 and 0678 tests pass."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/build-turns.mjs",
        "issue": "Resolved: atomic claim publication and locked inspection prevent cleanup from observing truncated claims. The concurrent eight-process regression passes.",
        "suggested_fix": "None required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/usage-limit.mjs:80",
        "issue": "Resolved: carryOn restores the original run record when startBuild refuses capacity, while callers restore pending queue state. New builder-limit and reviewer-limit regressions verify a refused attempt retains its exit record and successfully starts on the next check.",
        "suggested_fix": "None required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The home-folder setting now caps builds across projects while preserving each project's own limit. Both concurrency findings are resolved and covered by passing regressions. The only reported test failure predates this change."
  }
}
```

</details>
