---
id: "0619"
title: "Let a build stop only the panels it started"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-11-09-stop-builds-killing-panels-they-didnt-start.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T09:57:14.735Z"
approved: "2026-11-10T10:13:45.227Z"
finished: "2026-11-10T10:32:39.080Z"

---
# 0619 · Let a build stop only the panels it started

**Status:** ✅ done

## Problem
On 2026-11-09, while clearing up after a screenshot script that hung, 0583's build stopped every speck panel on the machine. A panel running as a service restarted itself, but one started by hand didn't, and the project menu disappeared. The same evening 0565's build left a demo panel running in the user's project menu after it ended. Builds should touch only the panels they start.

## Outcome
A build's panels stay out of your project menu, and a build only ever stops the panels it started.

## Acceptance criteria
1. The build skill's step on pictures says to start a panel with `speck panel --port <a free port> --background` and stop it with `speck panel --stop --port <that port>`, and never to stop processes by name or pattern, such as with `pkill` or `killall`.
2. A panel started from inside a build that `speck run` launched keeps its record out of the user's project menu, as the tests' panels do with `SPECK_PANELS_DIR`.
3. When a build ends, `speck run` stops any panel that build started and left running, and no other.
4. A panel the user started, from the command line or as a service, is never stopped by a build's clean-up.
5. No test that passed before this change fails.

## Out of scope
- Panels started by hand outside builds.

## Notes
- Asked for 2026-11-10 for release 1.0.0: "Create them all, set them all ready", from the follow-ups builders filed during the redesign.
- Decided: both a rule in the skill and speck enforcing what it can.
- `speck run` gives each build `SPECK_BUILD_SESSION` (`scripts/build-env.mjs`); panels record themselves in `~/.config/speck/panels/` (`registerPanel` in `scripts/panel-projects.mjs`). The skill's step is section 2's step 6, "Pictures of a visual change", in `skills/speck-build/SKILL.md`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: no changes

## In plain words
A panel that a build starts, for example to take pictures of a change, no longer shows up in your project menu. When that build ends, speck run stops any panel it left running, and only those: your own panels, whether you started them yourself or they run as a service, are never touched. If a build ends while speck run is off, its panels are stopped the next time speck run starts. The build instructions now also tell builders to stop a panel by its port and never to stop programs by name.

To see it, let speck run build a ticket that changes how the panel looks: its panel won't appear in your project menu while it takes pictures, and it's gone once the build ends. Builds you run by hand, outside speck run, still put their panels in your menu as before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 A build can finish while speck run is stopped: stopping the runner deliberately leaves builds running.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 242,984
- Elapsed since build started: 17 min
- Changed lines: 79 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Known limit: a build's panel folder under `~/.config/speck/build-panels/` is only removed when speck run sees that build end. A build whose run record is lost keeps an empty or stale folder there; it's harmless (dead pids are skipped), but nothing tidies it.
- Known limit: builds started by hand with `/speck-build`, outside speck run, have no build session, so their panels still join your project menu (the skill's rule still applies to them).
- Skipped (duplicate): the 0517 AC3 frame-time test failed once under load in the `--related` run and passed alone: already captured as speck/ideas/2026-11-08-steady-the-0517-ac3-frame-time-test-under-load.md.

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
    "reviewed_sha": "fbdbe94da1dd62518c62156d84f2015f5d824754",
    "session": "fresh",
    "thread_id": "01a1c4ef-3a0b-7bf2-9606-5453cd5fc1cb",
    "builder_response": "- Tests run: `speck test --related test/build-panels-0619.test.mjs` (the ticket's own file, plus every test file naming a file this branch changed, and the commands.checks files).\n- One failure in that run, 0517 AC3 (\"a slide's first frame comes within 50 ms\"), is a real-browser timing test that missed by 21 ms under the load of ~4,900 tests; it passes when run on its own (`node --test --test-name-pattern=\"0517 AC3\" test/panel-0517.test.mjs`: 4/4 pass). It touches nothing this ticket changes.\n- Design: a panel whose environment holds SPECK_BUILD_SESSION (set by speck run for each build) records itself in `~/.config/speck/build-panels/<session>/` instead of `~/.config/speck/panels/` (SPECK_PANELS_DIR, the tests' override, still comes first). When a build ends (endOf, and checkAdopted for builds speck run adopted), speck run reads that folder and SIGTERMs (then SIGKILLs after 3 s) only those recorded pids whose environment still holds that same session, then deletes the folder. A user's panel has no session in its environment and is never in a build's folder, and the env check means a reused pid or a copied record can't be stopped either.\n- Pictures: none needed, nothing anyone sees changes.\n",
    "seconds": 45,
    "usage": {
      "input_tokens": 145052,
      "cached_input_tokens": 101888,
      "cache_write_input_tokens": 0,
      "output_tokens": 1085,
      "reasoning_output_tokens": 161
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 43164,
      "cached": 101888,
      "write": 0,
      "output": 1085
    },
    "cost_usd": 0.1073668,
    "tests": {
      "failing": 1,
      "second_try": []
    },
    "saved_at": "2026-11-10T10:10:19.376Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md step 6 gives both required commands and prohibits stopping processes by name or pattern. The passing 0619 AC1 test checks these command facts."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panel-projects.mjs panelsDir routes build sessions to buildPanelsDir. Passing 0619 AC2 exercises registration in a separate process and exclusion from the user's menu."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "Passing AC3 tests cover direct cleanup and a live runner observing completion. However, run.mjs adoptEarlierBuilds records an already-ended build's exit without calling stopPanelsOfRun, leaving its panels running permanently."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "stopBuildPanels requires both a panel record and a matching process environment session. Passing AC3 and AC4 tests verify that user processes, other builds and a copied user-panel record are left alone."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reported related tests passed apart from the unrelated 0517 browser timing check, which passed in isolation. The changes provide no apparent causal connection to that timing failure."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/run.mjs:229",
        "issue": "A build can finish while speck run is stopped: stopping the runner deliberately leaves builds running. On restart, adoptEarlierBuilds sees the dead build process and records its exit without cleaning up its panels. The exited record is subsequently skipped, so those panels remain running indefinitely.",
        "suggested_fix": "Clean up the ended build's panels in the startup recovery path before retiring its run record. Add a regression test that stops the runner, lets its build finish leaving a panel, restarts the runner, and verifies that only that build's panel stops.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Build panels are hidden from the project menu, and normal cleanup protects the user's panels. One recovery case needs fixing: a build that finishes while the runner is stopped leaves its panels running even after the runner restarts."
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
    "reviewed_sha": "da073189a29c7a5d1def1ecda66ee00455cba055",
    "session": "continued",
    "thread_id": "01a1c4ef-3a0b-7bf2-9606-5453cd5fc1cb",
    "builder_response": "- Tests run: test/build-panels-0619.test.mjs (with the commands.checks files `speck test --files` adds).\n- F1: fixed. `adoptEarlierBuilds` in scripts/run.mjs now calls `stopPanelsOfRun(id, file)` for a build whose process has gone before it records its exit (and also when it's left for resuming, since the gone build can't use its panel). New test \"0619 AC3: a build that ended while speck run was off has its panel stopped when speck run starts again\" leaves an earlier run's build record with a session, starts a panel under that session, another build's panel and a user panel, ends the build, then starts speck run: only the ended build's panel stops. Checked it fails with the call removed.\n",
    "seconds": 26,
    "usage": {
      "input_tokens": 241239,
      "cached_input_tokens": 190336,
      "cache_write_input_tokens": 0,
      "output_tokens": 1745,
      "reasoning_output_tokens": 161
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 7739,
      "cached": 88448,
      "write": 0,
      "output": 660
    },
    "cost_usd": 0.0309228,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T10:13:29.679Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md step 6 specifies the required start and stop commands and prohibits process-name or pattern cleanup. The AC1 command-fact test passes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panel-projects.mjs panelsDir routes build-session records into buildPanelsDir. Passing AC2 exercises registration in a separate process and verifies exclusion from the user's menu."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "run.mjs calls stopPanelsOfRun on normal completion, adopted-build completion and startup recovery. Passing AC3 tests exercise selective cleanup, live-runner completion and completion while the runner was off."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "build-panels.mjs stopBuildPanels requires both a recorded PID and a matching build session in its environment. Passing AC3 and AC4 tests preserve user panels, another build's panel and a user process whose record was copied."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The current test output reports 114 passed, 3 skipped and no failures. Earlier related-test coverage showed only an unrelated browser timing failure that passed in isolation; no regression attributable to this change was found."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/run.mjs:229",
        "issue": "Startup recovery previously retired an ended build's record without stopping its leftover panels.",
        "suggested_fix": "Implemented: adoptEarlierBuilds now calls stopPanelsOfRun before retiring the record. The passing restart regression test also verifies that user panels and another build's panel remain running.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Build panels stay out of the user's project menu and are cleaned up without stopping unrelated panels. The restart recovery gap is fixed and covered by a passing regression test. All criteria pass."
  }
}
```

</details>
