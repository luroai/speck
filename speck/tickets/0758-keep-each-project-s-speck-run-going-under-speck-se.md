---
id: "0758"
title: "Keep each project's speck run going under speck serve"                # one outcome, no "and"
status: blocked            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
source: "speck/ideas/2026-11-10-run-a-software-factory-from-one-speck-service.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0756"]                # ticket ids that must be done first
created: 2026-11-25
built_on: "0756"
started: "2026-11-26T10:17:16.586Z"
blocked_at: "2026-11-26T10:49:26.420Z"
waited_seconds: 370

---
# 0758 · Keep each project's speck run going under speck serve

**Status:** ⛔ blocked

## Problem
Each project's `speck run` is started by hand or by its panel's Auto-build switch, and stays off after the machine restarts until someone turns it on again. Under one service, work in every project should carry on by itself.

## Outcome
`speck serve` starts each project's `speck run` that was on, and keeps it on.

## Acceptance criteria
1. When `speck serve` starts, it starts `speck run` for each listed project whose run was on when `speck serve` last stopped, or that its Auto-build switch was last turned on in, and leaves the others off.
2. Turning a project's Auto-build off in its panel keeps it off under `speck serve`, including after `speck serve` restarts.
3. A `speck run` that `speck serve` started and that exits without being turned off is started again within 30 seconds, at most 3 times an hour, and the panel's Pipeline log says so.
4. `speck serve --stop` leaves each project's `speck run` running, as the Auto-build switch does today, and says which are still on.
5. No test that passed before this change fails.

## Out of scope
- Changing how `speck run` itself works.

## Notes
- Step 1 of the factory (see the source idea): one speck service per machine runs every project behind one address, so the user can sign in from any device and see every project, instead of starting a panel and a `speck run` in each project.
- Failing before this build: not checked
- Self-check: a project taken off the list and put back is looked at afresh (no stale restart count); the brief's serve row now says what it keeps on and where, with a test for the file names.
- Pictures: none, because nothing anyone sees in the panel changes: speck serve is a command, and its only panel effect is lines in the Pipeline log.
- `panelRunOn` and `runState` (`scripts/panel-run.mjs`, `scripts/run-switch.mjs`) start a run and tell whether one is on; the run lock is `speck/.cache/runs/run.lock`.
- Went with the recommendation: (a) start it after a restart when it stopped within 10 seconds of speck serve (chosen by speck, as watch is decide, 2026-11-26 10:41 UTC).
- Went with the recommendation: allow 2 more review rounds (chosen by the user in the panel, 2026-11-26 10:48 UTC).
- Review limit: you allowed 2 more review rounds (2026-11-26 10:48 UTC).
- Went with the recommendation: fix speck first in its own ticket, then resume this one (chosen by speck, as watch is decide, 2026-11-26 10:49 UTC).
- Waiting for: a ticket that lets an answered escalation be reviewed again, which the user makes (2026-11-26).
- Answer (2026-11-26): 0763 has shipped on main, so an answered escalation at the review limit now gets the review rounds it allowed. Carry on with the review round.

## In plain words
speck serve now keeps each project's automatic building going. When it starts, for example after the machine restarts, it turns Auto-build back on in every project that had it on, and leaves the rest off. If a project's Auto-build stops without anyone turning it off, speck serve starts it again within a few seconds, up to 3 times an hour, and the project's Pipeline log says so each time. Turning Auto-build off in a project's panel keeps it off, even after speck serve restarts. Stopping speck serve leaves Auto-build running in every project and tells you which ones are still on. To see it, turn Auto-build on in a project, stop and start speck serve, and look at that project's Pipeline log.

Worth keeping an eye on: projects still on an older speck can't record their switch. For those, speck serve goes by what the run writes in its log. A run turned off within 10 seconds of stopping speck serve, followed by a machine restart, is turned back on. Updating speck in that project removes this. If you installed speck serve as a service before this change, run `speck serve --install` again, or stopping the service will still stop every project's Auto-build.

## Blocked question
This ticket waits for a separate ticket that fixes speck so a ticket whose last review round was an escalation you've answered can be reviewed again (speck stops at the escalation in scripts/review-limit.mjs before it looks at rounds you allowed). That ticket doesn't exist yet, and a build can't make one on the base branch: make it with /speck-ticket and set it ready. Once it has shipped, answer this question saying so, and the build carries on with the review round.

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
- Follow-ups:
  - To the inbox: speck/ideas/2026-11-26-update-speck-serve-services-installed-before-0758.md (units installed before this keep KillMode=mixed).
  - Skipped: test/usage-limit-0622.test.mjs's "0622 AC1 AC2 AC3: a build that hit the limit while speck run was off ..." failed once in the related run of about 500 files and passed on its own; already named in speck/ideas/done/2026-11-10-steady-the-0622-and-0549-ac1-run-tests-under-load.md.
  - Known limit: a project's run turned on with its panel's switch while a serve-started start-up is in flight could start twice; the second refuses on the lock.
  - Known limit: a serve-started run that a user stops from a terminal with kill (not the switch) is taken as a crash and started again while Auto-build is on.
  - Merge of main (0757, 0759, 0763) changed the --install unit to KillMode=process, as AC4 needs runs to outlive speck serve under the service.

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
    "reviewed_sha": "cf40a1eb05523ccb073b557ab9db0c7eea5fbd80",
    "session": "fresh",
    "thread_id": "01a2176a-0afa-76b1-bc66-ef6eed17c472",
    "builder_response": "- Tests run: test/serve-0758.test.mjs test/usage-limit-0622.test.mjs test/serve-0756.test.mjs (after one `--related` run, whose only other failure was test/support/stand-in-panel.mjs, a support file I wrongly passed as a test file, and 0622's usage-limit resume test, which passes on its own and touches nothing this ticket changes)\n- Design: the panel's Auto-build switch (panelRunOn on success, panelRunOff first thing) records how it was last turned in speck/.cache/runs/auto-build.json. speck serve records which listed projects' runs it last saw on, with when each took its lock, in ~/.config/speck/serve-runs.json, kept after it stops. At its first look at a project it starts the run when the switch was last turned on, or the run was on when it last stopped and the switch wasn't turned off after that run took its lock (AC1, AC2). Starting one records the switch on, so serve keeps it going. Later, a run that's off while the switch is on is started again, at most 3 times in a rolling hour, each time and the hold said in the project's run.log, which the Pipeline log shows (AC3). serve never stops a run; --stop and Ctrl+C name the listed projects whose run is still on (AC4).\n- Projects on an older speck have panels that don't record the switch, so for them serve goes by whether the run was on.\n",
    "seconds": 32,
    "usage": {
      "input_tokens": 137252,
      "cached_input_tokens": 85632,
      "cache_write_input_tokens": 0,
      "output_tokens": 1157,
      "reasoning_output_tokens": 211
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 51620,
      "cached": 85632,
      "write": 0,
      "output": 1157
    },
    "cost_usd": 0.1233732,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-26T10:33:07.162Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "runKeeper.check and wantedAtStart implement startup selection. The two AC1 tests cover switch state, saved runs and projects left off; the integration test covers actual process startup."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "panelRunOff records off, but runKeeper.launch does not check for an off request during startup. Older supported project panels do not write this record at all."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "runKeeper.check limits retries within its rolling hour and writes run.log messages. AC3 tests cover the limit and log; the integration test checks restart within 30 seconds."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "serve shutdown leaves runs untouched. The AC4 integration test confirms --stop reports alpha and leaves its run alive."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reported targeted run: 203 passed, zero failed, three skipped. No existing tests were weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/serve-runs.mjs",
        "issue": "Supported projects using an older copy of speck cannot reliably turn Auto-build off. serve starts their run and writes auto-build.json as on, but their existing panelRunOff does not update that file. Once their panel stops the run, serve sees the saved on value and starts it again. serve deliberately launches each project's own installed copy, so changing this repository's panel handler does not fix those panels.",
        "suggested_fix": "Provide a compatible way to recognise explicit stops in supported project versions, or explicitly detect and handle versions without persistent switch support. Add coverage using a project panel that does not write auto-build.json.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/serve-runs.mjs",
        "issue": "Turning Auto-build off during a serve-initiated startup can leave the run on. launch writes on and starts asynchronously. If panelRunOff runs before the child takes its lock, it records off and returns 'off already'. The child then takes its lock; launch accepts it without rechecking the switch, and subsequent checks leave every live run alone. The existing AC2 test only exercises an idle keeper.",
        "suggested_fix": "Coordinate startup with explicit off requests so a run still starting is cancelled or stopped when a newer off request arrives. Add a delayed-start test that turns the switch off before lock acquisition and verifies the run remains off, including after restarting serve.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Startup, crash recovery and leaving runs running after stopping the service are covered by passing tests. However, Auto-build can turn itself back on for projects using older panels, and an off request during startup can be ignored. Both need fixing before merge."
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
    "reviewed_sha": "6bc3be222a48a96433eb4133f44453ccd5cb0211",
    "session": "continued",
    "thread_id": "01a2176a-0afa-76b1-bc66-ef6eed17c472",
    "builder_response": "- Tests run: test/serve-0758.test.mjs test/serve-0756.test.mjs test/usage-limit-0622.test.mjs\n- F1: fixed. runKeeper now checks whether the project's own speck records the switch (recordsSwitch: its .speck/scripts/serve-runs.mjs, the module its panel's switch writes with). For an older speck it reads no switch record and writes none, starts the run as serve starts only when the run was on when serve last stopped, and never starts it again once it stops, saying so once in the Pipeline log and serve's output. Test: \"a project on an older speck, whose panel doesn't record its switch, ...\". The brief's serve row says this.\n- F2: fixed. launch() is given the switch as check() read it. It doesn't start when the switch has since been turned off, and once the run has taken its lock it reads the switch again: if it was turned off meanwhile, it stops the run as the switch does (stopRun: SIGINT, then SIGKILL to its group), saying so in the Pipeline log. serve no longer rewrites a switch already on, so it can't overwrite a newer off. Test: \"Auto-build turned off while speck serve is starting the run stops it ...\", which turns it off with panelRunOff during the start and checks it stays off after a new keeper (a serve restart).\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 272581,
      "cached_input_tokens": 203136,
      "cache_write_input_tokens": 0,
      "output_tokens": 1995,
      "reasoning_output_tokens": 292
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 17825,
      "cached": 117504,
      "write": 0,
      "output": 838
    },
    "cost_usd": 0.0557804,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-26T10:35:24.747Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "runKeeper.check and wantedAtStart select previously running projects and recorded on switches. Passing AC1 unit tests and the process integration test exercise startup selection."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The new delayed-start test covers off requests during startup. However, older panels record no off request, so a stale serve-runs.json entry can still cause startup after an explicit off."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "runKeeper.check now unconditionally skips recovery when recordsSwitch is false, including runs serve itself started. The new older-project test explicitly asserts this exception, which the criterion does not allow."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The passing process integration test verifies --stop leaves the run alive and names its project. The stop implementation remains unchanged this round."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reported targeted tests: 205 passed, zero failed, three skipped. Existing tests were not weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/serve-runs.mjs",
        "issue": "The older-version fallback avoids immediate resurrection by disabling crash recovery, but does not fulfil the ticket. A run serve started in an older project is never restarted after a crash, contrary to AC3. It also cannot honour an off request across restart when the older panel stops the run after serve's last observation and serve stops before its next check: the saved on entry remains and starts it again. Documenting these exceptions does not change the acceptance criteria.",
        "suggested_fix": "Provide compatible switch tracking and recovery for supported projects, with tests for both a serve-started run crashing and an explicit off immediately before serve stops. If older projects must be excluded from these guarantees, obtain an explicit scope decision and update the ticket before approval.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/serve-runs.mjs",
        "issue": "The startup race identified in round 1 is addressed: launch rechecks for an off request after startup and stops the newly started run.",
        "suggested_fix": "No further change required for this finding. The passing delayed-start test exercises panelRunOff during startup and verifies it stays off after a keeper restart.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The startup race is fixed and all reported tests pass. Older projects now lose automatic crash recovery, and an off request just before service shutdown can still be forgotten. Those compatibility gaps remain outside the ticket's promised behaviour."
  }
}
```

</details>

<details><summary>Round 3 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "14a25ab01956413ae85b024c623beee82053a1f0",
    "session": "continued",
    "thread_id": "01a2176a-0afa-76b1-bc66-ef6eed17c472",
    "builder_response": "- Tests run: test/serve-0758.test.mjs test/serve-0756.test.mjs test/usage-limit-0622.test.mjs\n- F1: fixed, without excluding older projects. Every speck run since before 1.5.0 (the oldest speck serve supports) prints \"speck run stopped.\" when Ctrl+C, the Auto-build switch (SIGINT) or SIGTERM stops it, and a run that ends any other way doesn't (checked in v1.5.0 and v1.6.0's scripts/run.mjs). So for a project whose speck doesn't record the switch, the keeper keeps its run going once it has seen it on: serve-runs.json keeps the project, with how long its run.log was when that run was first seen on (or before serve started it). When the run is off, stoppedAsTold reads run.log from there: a stop line means it was turned off, so it's dropped from the record and never started again; no stop line means it ended by itself, so it's started again under the same 3-an-hour limit, saying so in the Pipeline log. At speck serve's start the same check runs on the record it left, so an off just before serve stopped is honoured, and a crash meanwhile is started. Because a machine shutting down SIGTERMs runs (which also prints the stop line), the record carries a boot mark (Linux boot_id, else boot time from os.uptime): after the machine has started again, a run the record has is started regardless. Tests: \"on an older speck ... a run turned off stays off and one that ends by itself is started again\" (crash restart, panel off, next serve) and \"on an older speck, a run turned off just before speck serve stopped stays off ... and one that ended by itself, or that the machine stopping stopped, is started\". The serve's own Pipeline lines now say \"ended\" rather than \"stopped\", and the stop-line match is anchored to the start of a line, so they can't be read as a run's own stop.\n- F2: resolved in round 2; unchanged except that the turned-off recheck applies to projects that record the switch.\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 445695,
      "cached_input_tokens": 358016,
      "cache_write_input_tokens": 0,
      "output_tokens": 2799,
      "reasoning_output_tokens": 322
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 18234,
      "cached": 154880,
      "write": 0,
      "output": 804
    },
    "cost_usd": 0.059996,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-26T10:39:19.106Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "runKeeper.check implements startup selection for recorded switches and older projects. Passing AC1 tests cover saved runs, switch selection and machine restart."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "For older projects, runKeeper.check uses (restarted || !told), so a machine restart overrides even an explicit off recorded in run.log while serve was stopped."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Older projects now use stoppedAsTold to distinguish crashes from requested stops and share the rolling restart limit. Passing tests cover older-project recovery, restart limits, Pipeline messages and process recovery within 30 seconds."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The passing process integration test verifies --stop leaves the run alive and names its project."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reported targeted tests: 206 passed, zero failed, three skipped. No existing tests were weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/serve-runs.mjs",
        "issue": "Older-project crash recovery is fixed, but off persistence still fails across a machine restart. Reproduction: serve observes an older project's run on; stop serve, which leaves the run running; turn Auto-build off in that project's panel; reboot; start serve. The saved entry remains, and (restarted || !told) starts the run despite its explicit stop line. The new test treats every stop followed by a boot change as machine shutdown, so it misses this distinction.",
        "suggested_fix": "Distinguish an explicit off before machine shutdown from a run stopped by shutdown, and preserve that off state across reboot. Add the reproduction above as a regression test. If supported older versions cannot provide that distinction, obtain a product decision about the compatibility guarantee.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/serve-runs.mjs",
        "issue": "The startup race remains fixed for projects that record the switch: launch rechecks off requests after startup and stops the newly started run.",
        "suggested_fix": "No further change required for this finding; the delayed-start regression test passes.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Crash recovery now works for older projects, and all reported tests pass. One compatibility gap remains: turning Auto-build off while the service is stopped can be forgotten after a reboot, causing work to start again against the user's choice."
  }
}
```

</details>

<details><summary>Round 4 · codex · escalate · extra round</summary>

```json
{
  "meta": {
    "round": 4,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "01698019a0bb87a6158a12322bb711995e1e7ce2",
    "extra": true,
    "session": "continued",
    "thread_id": "01a2176a-0afa-76b1-bc66-ef6eed17c472",
    "builder_response": "- Tests run: test/serve-0758.test.mjs test/serve-0756.test.mjs test/usage-limit-0622.test.mjs\n- F1: fixed. A stop line in an older project's run.log now always means turned off, unless it was the machine shutting down: speck serve records the time it was told to stop (runKeeper.stopping(), called first thing in serve's shutdown, for SIGTERM, SIGINT or SIGHUP, so also when the machine shuts down), and after a restart of the machine a run whose run.log was last written within 10 seconds of that time is taken as stopped by the shutdown, which SIGTERMs both at once, and started. Your reproduction (serve stopped, then the run turned off in its panel, then a reboot) leaves it off: its stop line comes later than serve's stop, and is a regression case in \"on an older speck, a run turned off before speck serve starts again stays off ...\", alongside a serve killed without recording a stop (stays off), a crash (started) and a shutdown (started). The one case it can't tell apart is a run turned off in its panel within 10 seconds of `speck serve --stop`, followed by a reboot before serve starts again; older speck writes the same line either way, so nothing in an older project can tell those apart. The brief's serve row says how older projects are handled.\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 646953,
      "cached_input_tokens": 545152,
      "cache_write_input_tokens": 0,
      "output_tokens": 3564,
      "reasoning_output_tokens": 336
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 14122,
      "cached": 187136,
      "write": 0,
      "output": 765
    },
    "cost_usd": 0.0546076,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-26T10:41:19.498Z"
  },
  "verdict": {
    "round": 4,
    "verdict": "escalate",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "runKeeper.check implements startup selection. Passing AC1 tests cover saved runs, recorded switches and simulated machine shutdown."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "serve-runs.mjs byShutdown treats any log write within 10 seconds of serve stopping as machine shutdown after a reboot. An explicit panel off in that interval is therefore overridden."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing tests exercise older-project crash recovery, the rolling three-restart limit and Pipeline messages. The process integration test verifies recovery within 30 seconds."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The passing process integration test verifies --stop leaves the run alive and names its project."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reported targeted run: 206 passed, zero failed, three skipped. No existing tests were weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/serve-runs.mjs",
        "issue": "The timing heuristic narrows the compatibility gap but still violates AC2. Stop serve, turn an older project's Auto-build off within 10 seconds, then reboot before starting serve again: byShutdown overrides the explicit off and starts the run. The regression test moves the log timestamp five minutes forward, covering only stops outside this interval. The builder acknowledges that older versions cannot distinguish these cases.",
        "suggested_fix": "Obtain an explicit product decision about older-version guarantees. Either require switch-recording support for guaranteed reboot recovery, or approve and document a specific exception to the ticket's off-persistence requirement. Add coverage for the chosen behaviour within the 10-second interval.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/serve-runs.mjs",
        "issue": "The startup race remains resolved for projects that record the switch.",
        "suggested_fix": "No further change required; the delayed-start regression test passes.",
        "state": "resolved"
      }
    ],
    "escalation_question": "For older project versions that cannot reliably distinguish Auto-build off from machine shutdown, should reboot recovery require upgrading the project's speck, or may an explicit off within 10 seconds of stopping serve be overridden after reboot?",
    "summary": "Startup, crash recovery and stopping the service pass the reported tests. Older projects still have one acknowledged ambiguity: an explicit Auto-build off can be mistaken for machine shutdown and undone after reboot. Accepting that exception requires the product owner's decision."
  }
}
```

</details>

<details><summary>Round 5 · codex · approve</summary>

```json
{
  "meta": {
    "round": 5,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "f0259134cf4c90c0c248165a9d8136aaacee7150",
    "allowed": true,
    "session": "continued",
    "thread_id": "01a2176a-0afa-76b1-bc66-ef6eed17c472",
    "builder_response": "- Tests run: test/serve-0758.test.mjs test/serve-0756.test.mjs test/serve-0756-old.test.mjs test/serve-0757.test.mjs test/serve-front-0757.test.mjs test/serve-install-0759.test.mjs test/review-limit-0763.test.mjs test/usage-limit-0622.test.mjs\n- F1 (escalation): the user's decision is recorded in the ticket's Notes: option (a), an older project's run that said it stopped within 10 seconds of speck serve stopping is started after a machine restart. Coverage within the 10-second interval is the case \"turned off within 10 seconds of speck serve stopping, then the machine restarted\" (expects it started), beside the cases outside it, which stay off. The brief's serve row documents the exception and that updating speck in that project removes it.\n- Since your last round, main was merged in (0757's one address, 0759's --install, 0763's review-limit fix), as speck's review of an answered escalation needs 0763's code on this branch. Conflicts, all class logic, resolved keeping both sides:\n  - scripts/serve.mjs: header comments, imports, USAGE (0757/0759's text, plus \"and their speck runs\" and \"leaving each speck run on\"), the keeper beside 0757's `front` variable, and shutdown calling keeper.stopping() then 0757's front.close().\n  - docs/brief.md: main's serve row, with this ticket's --stop clause and sentences after the --stop sentence, before --install's.\n  - test/support/stand-in-panel.mjs: main's version (0757's extra routes) with this ticket's `run` command added again and the panel moved into startPanel().\n- One change beyond the conflicts, needed for AC4 now that 0759 has shipped: the systemd unit `speck serve --install` writes had KillMode=mixed, which SIGKILLs everything left in the service once speck serve exits, so every speck run serve started (and their builds) died on `speck serve --stop` or any restart of the service. It's now KillMode=process: systemd stops only speck serve, which stops its panels itself, and runs keep going. Test: \"0758 AC4: the service speck serve --install writes stops only speck serve ...\". The brief says so. (A Mac's launchd agent already only stops serve's own process group; runs start in their own.) Units installed before this keep mixed until `speck serve --install` is run again.\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 905977,
      "cached_input_tokens": 774400,
      "cache_write_input_tokens": 0,
      "output_tokens": 4267,
      "reasoning_output_tokens": 336
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 29776,
      "cached": 229248,
      "write": 0,
      "output": 703
    },
    "cost_usd": 0.0895068,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-26T11:48:19.432Z"
  },
  "verdict": {
    "round": 5,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "runKeeper.check and wantedAtStart select saved runs and recorded on switches. Passing AC1 tests cover startup selection, persisted state and older-project reboot recovery."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing AC2 tests cover persistent off requests and off during startup. The older-version 10-second exception is explicitly accepted in the ticket's Notes, documented in the brief and exercised by a regression case."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing tests cover crash recovery for current and older projects, three retries per rolling hour and Pipeline messages. The process integration test checks recovery within 30 seconds."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The process integration test confirms --stop reports and preserves running projects. serve-install now generates KillMode=process, covered by the added unit-generation test."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reported targeted run: 256 passed, zero failed, three skipped, including the merged address, installation and review-limit tests. Merge resolutions preserve front-server startup and shutdown alongside the keeper."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/serve-runs.mjs",
        "issue": "The older-version reboot ambiguity has an explicitly accepted exception recorded in the ticket: a stop within 10 seconds of serve stopping may be restarted after reboot.",
        "suggested_fix": "No further change required. The accepted behaviour is documented and tested; upgrading the project's speck removes this exception.",
        "state": "dispute_accepted"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/serve-runs.mjs",
        "issue": "The startup race is fixed by rechecking the recorded switch after startup and stopping the new run when an off request arrived.",
        "suggested_fix": "No further change required; the delayed-start regression test passes.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Approved with the recorded older-version exception. The service restores enabled runs, recovers crashes within the retry limit, and leaves runs running when stopped. All reported tests pass, including checks for the merged service features."
  }
}
```

</details>
