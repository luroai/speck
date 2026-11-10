---
id: "0619"
title: "Let a build stop only the panels it started"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0619 · Let a build stop only the panels it started

**Status:** 🔍 reviewing

## Problem
On 2026-11-09, while clearing up after a screenshot script that hung, 0583's build stopped every speck panel on the machine. The user's speck panel restarted itself, but their Alpha panel didn't, and the project menu disappeared. The same evening 0565's build left a demo panel running in the user's project menu after it ended. Builds should touch only the panels they start.

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
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

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
