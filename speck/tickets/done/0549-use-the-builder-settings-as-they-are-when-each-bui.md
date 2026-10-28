---
id: "0549"
title: "Use the builder settings as they are when each build starts"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-28T09:44:54.157Z"
approved: "2026-10-28T10:21:02.210Z"
finished: "2026-10-28T10:36:16.473Z"

---
# 0549 · Use the builder settings as they are when each build starts

**Status:** ✅ done

## Problem
`speck run` reads the settings once, when it starts, and builds every launch command from that reading. A change made while it's on, in the panel's Settings view or with `speck config set`, doesn't reach the builds it starts until it's restarted. The user lowered `builder_effort` from `high` to `medium`, and later builds still ran at `high`, which cost real money. Nothing said the change hadn't taken effect.

## Outcome
Every build `speck run` starts or resumes uses the builder settings as they are at that moment, so a change applies to the next build without restarting `speck run`.

## Acceptance criteria
1. With `speck run` on, after `builder_effort` or `builder_model` is changed (in the Settings view or with `speck config set`, for the project or for this machine only), the next build `speck run` starts runs with the new value, without restarting `speck run`. Setting it blank starts the next build without it.
2. The same holds for every build it resumes or starts again: a stopped build it resumes, a ticket handed back to its build, a build carried on with a recommendation (Go with the recommendation, or speck's watch), and a build speck's watch agent starts again. Each uses the settings as they are when it starts.
3. Changes to `builder`, `build_command` and `resume_command` also apply from the next build without a restart. If the changed settings can't start a build (such as no build command for the builder, or a quote not closed), `speck run` keeps running, says why in its log once, starts no build until they can, and starts builds again once they're fixed.
4. A change to `max_parallel_builds` applies from `speck run`'s next check: it starts builds up to the new limit and, when lowered, starts no more until fewer are running, without stopping any build already running.
5. A build already running carries on with the settings it started with. No test that passed before this change fails.

## Out of scope
- Changing the settings of a build that's already running.
- The reviewer's settings: each review round reads them when it starts.
- Telling the user in the Settings view when a change applies.

## Notes
- Reported by the user 2026-10-27: "I set the builder effort to medium from high but high remained because I hadn't restarted speck run. This cost me real money." They asked for it to be set ready and included in the 0.21.0 release (0539).
- Checked 2026-10-27: `runOn` in `scripts/run.mjs` calls `loadConfig(repo)` once and builds `words` (with `withBuilderModel`, which adds `--model` and `--effort`, 0279 and 0402) and `max` (`maxParallelBuilds`) from it; `handBackQueue`, `goWithQueue` and `foremanAgentQueue` are given that `cfg` and `words`. Codex builds take the effort from `codexStartWords` (`scripts/codex-build.mjs`). Machine settings are applied by `loadConfig` (`applyMachineConfig`).
- The sleep queue and the watch fixes already read the settings each time (`readConfig: () => loadConfig(repo)`).
- Failing before this build: none
- Self-check: a killed build already resumed once was reported with the current settings, which are missing while they can't start a build; it now uses the last settings that could. The builder mismatch message no longer says "speck run won't start" when speck run is already running.
- `0232 AC3: 0176 AC3's check fails for a speck run whose checks cost more than 5% of one core…` is flaky under load: on main it failed 2 of 4 runs beside `run-0110` and `run-0047` alone (0.31 s a check against a 0.25 s floor when run by itself). It fails in this build's `--related` runs for the same reason, not because of this change.

## In plain words
Changing the builder's settings while speck run is on now takes effect from the next build, with no restart. That covers the builder, its model and effort, the build and resume commands, and how many builds run at once. Builds it carries on also pick up the change: a stopped build it resumes, a ticket handed back after a ship, and one carried on with a recommendation. To see it, lower the builder's effort in Settings while speck run is on, then set a ticket ready: its build starts with the new effort. If a change leaves speck run unable to start a build, such as a build command with a missing quote, its log says why once and it waits, then carries on once the setting is fixed. Builds already running keep the settings they started with. One thing to know: a Cursor build that's resumed keeps the model its chat started on, as before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Cursor resumes ignore the latest builder_model.; F2 AC3's live resume_command changes and successful builder changes are untested.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 781,891
- Elapsed since build started: 36 min
- Changed lines: 140 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - The flaky timing check `0232 AC3` (0176 AC3's CPU cost check) failed in some of this build's `--related` runs and on main beside other `speck run` tests. Skipped as a duplicate of `speck/ideas/2026-10-28-steady-the-0232-ac3-cpu-cost-test-under-load.md`.
  - Known limit: a resumed Cursor build keeps its chat's model (0290), so a builder_model change reaches only new Cursor builds.
  - Known limit: speck run's starting notes (builder_model ignored, builders ignored by build_command) are still said only when it starts, not when the settings change.

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
    "reviewed_sha": "790cbc79c0706fbb2f6dae98fed6954ec02ebace",
    "session": "fresh",
    "thread_id": "01a18201-e906-7263-8cc5-d05608917d5f",
    "builder_response": "- Tests run: `speck test --related test/run-settings-0549.test.mjs` (the ticket's own file, plus every existing test file naming a changed file, and the checks).\n- Approach: a new `scripts/run-settings.mjs` holds what `runOn` used to work out once at start (`builderSettings`), and `liveSettings` reads the config afresh on each of speck run's checks. `runOn` keeps the result in `now` (null while the settings can't start a build) and passes `settings: () => now` to the hand-back, go-with and Foreman agent queues, which now take `{ cfg, words, max }` from it each time they start a build. Their old `cfg`/`words`/`max` parameters stay as the default, so existing callers and tests are unchanged.\n- No picture: nothing anyone sees changes.\n- The one failing test, `0232 AC3: 0176 AC3's check fails…`, is flaky under load and fails on main too: 2 of 4 runs beside only `run-0110` and `run-0047`. It busy-loops 400 ms of wall-clock time per check and needs more than 0.25 s of CPU a check. Run alone it measures about 0.31 s a check on both main and this branch, so a loaded machine drops it below the floor. It isn't caused by this change. It's noted in the ticket's Notes and will be a follow-up.\n",
    "seconds": 55,
    "usage": {
      "input_tokens": 323930,
      "cached_input_tokens": 262400,
      "cache_write_input_tokens": 0,
      "output_tokens": 1208,
      "reasoning_output_tokens": 96
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 61530,
      "cached": 262400,
      "write": 0,
      "output": 1208
    },
    "cost_usd": 0.16138,
    "tests": {
      "failing": 1,
      "second_try": []
    },
    "saved_at": "2026-10-28T10:16:20.471Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "run.mjs tick refreshes loadConfig through liveSettings before launching. Passing AC1 tests exercise live effort changes, clearing effort, and model argument construction."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The queues receive current settings, and the four AC2 tests pass for Claude-style builds. However, hand-back.mjs resumeFor discards cfg for Cursor sessions, so changed builder_model never reaches their resume commands."
      },
      {
        "id": 3,
        "status": "unclear",
        "evidence": "Passing AC3 integration coverage verifies invalid build_command logging, waiting and recovery. No test exercises a live resume_command change or a successful builder switch."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The passing AC4 integration test raises and lowers max_parallel_builds, verifies new launches respect it, and checks existing processes remain alive."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "AC1/AC3/AC5 and AC4 tests verify existing builds continue unchanged. Recorded results show 501 passes and one timing-test failure; its load-sensitive CPU assertion and unchanged implementation support the builder's explanation."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/hand-back.mjs",
        "issue": "Cursor resumes ignore the latest builder_model. resumeFor calls cursorResumeArgv without settings, and that function emits no --model argument. A direct check with builder_model set to new-model produced a resume command without it. Cursor chats retain their previous model, so resumed builds can continue using the expensive old model.",
        "suggested_fix": "Pass the applicable current model into Cursor resume commands, including the supported blank/default behaviour. Add a regression test that changes the model before resuming an existing Cursor session.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/run-settings-0549.test.mjs",
        "issue": "AC3's live resume_command changes and successful builder changes are untested. The existing builder edit only creates a mismatch, while resume tests change effort or model.",
        "suggested_fix": "Add tests exercising a successful live builder switch and the intended effect of changing resume_command while speck run remains on. Verify the resulting command or hint actually uses the new setting.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change refreshes settings for new builds and updates concurrency limits correctly. Approval is held because resumed Cursor builds still ignore a changed model, and two promised settings changes lack test coverage."
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
    "reviewed_sha": "a37843565666fc9afb61760c8a77dc4f37650dcd",
    "session": "continued",
    "thread_id": "01a18201-e906-7263-8cc5-d05608917d5f",
    "builder_response": "- Tests run: `speck test --related test/run-settings-0549.test.mjs` (the ticket's own file, every existing test file naming a changed file, and the checks). All passed this time, including the flaky `0232 AC3` timing check.\n- F1: disputed. Not passing builder_model on a Cursor resume is a deliberate earlier decision, not something this change left out. `test/run-cursor-0290.test.mjs:110` asserts that `resumeFor([], { ...CURSOR, builder_model: 'gpt-5' }, …)` gives `[cursorCli(), ...HEADLESS, '--resume', 'chat-7', message]`, with the message 'a chat keeps the model it started on'. Adding `--model` would fail that passing test, which AC5 forbids. Each resume does take the settings as they are now: `resumeFor` gets `s.cfg`/`s.words` from `settings()` at that moment. Cursor's resume command just reads no model from them, by design, and the same holds when speck run starts fresh. Changing that would be a product change to 0290, outside this ticket.\n- F2: fixed. Added three tests to `test/run-settings-0549.test.mjs`:\n  - A live builder switch in a real `speck run`: with builder_effort set to medium, switching `builder` to cursor (build_command stays the fake) starts the next build without `--effort`, which only Claude Code gets.\n  - A unit check that `liveSettings` follows builder claude → codex (blank build_command, Codex's own command) → claude.\n  - A live `resume_command` change: a go-with queue built while `resume_command` was `first-resume {session}`, then changed to `second-resume {session}`, says `second-resume sess-1` when it can't resume the build itself. With the old fixed `cfg`, neither would appear.\n",
    "seconds": 24,
    "usage": {
      "input_tokens": 454962,
      "cached_input_tokens": 387584,
      "cache_write_input_tokens": 0,
      "output_tokens": 1791,
      "reasoning_output_tokens": 106
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 5848,
      "cached": 125184,
      "write": 0,
      "output": 583
    },
    "cost_usd": 0.0300444,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-28T10:20:43.585Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "run.mjs tick reloads settings before launching builds. Passing AC1 tests cover refreshed model/effort arguments, live machine settings changes and clearing effort."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "resumeKilled and the hand-back, go-with and Foreman queues receive refreshed settings. Four passing AC2 tests exercise these paths. Existing test '0290 AC2: a killed or handed-back Cursor build carries on its chat' explicitly preserves Cursor's session model; this change maintains that contract."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing AC3 tests now cover live builder changes, switching command construction between Claude and Codex, refreshed resume_command hints, invalid command logging once, continued operation and recovery."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 integration test raises and lowers max_parallel_builds, verifies launches respect the updated limit and confirms existing processes remain alive."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Integration tests verify existing builds retain their starting arguments and continue running. Related test results report 504 passed, zero failed and three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/hand-back.mjs",
        "issue": "Previously flagged Cursor resumes retaining their session model. The existing 0290 test explicitly requires this behaviour, so changing it would alter the established contract rather than fix stale settings in this ticket.",
        "suggested_fix": "No change required within this ticket.",
        "state": "dispute_accepted"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/run-settings-0549.test.mjs",
        "issue": "Previously missing coverage for successful live builder changes and refreshed resume_command behaviour is now present and exercises the relevant command construction and resume hint paths.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Approved. New and resumed builds receive refreshed settings, invalid settings pause launches until corrected, and concurrency changes leave running builds alone. The added tests close the coverage gaps, and all related tests pass. Cursor retains its established session-model behaviour."
  }
}
```

</details>
