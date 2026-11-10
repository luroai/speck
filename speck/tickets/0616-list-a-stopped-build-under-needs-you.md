---
id: "0616"
title: "List a stopped build under Needs you"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-09-list-a-stopped-build-under-needs-you.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0615"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T11:52:59.104Z"
waited_seconds: 18338
approved: "2026-11-10T17:10:42.112Z"

---
# 0616 · List a stopped build under Needs you

**Status:** 🔍 reviewing

## Problem
A ticket whose build stopped before finishing sits under Building with a grey dot, among the tickets being worked on, even when nothing is going to carry it on. It needs someone, so it's easy to miss there.

## Outcome
A stopped build that nothing will carry on is listed under Needs you.

## Acceptance criteria
1. A ticket whose build stopped before finishing, and that speck won't resume or look into (with `watch` off or `tell`, or once speck has looked and left it), is listed under Needs you with the orange dot and a line saying its build stopped.
2. A stopped build speck is about to resume or look into stays under Building.
3. The bar's needs-you count includes it.
4. Tests that checked the old behaviour are changed to check the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- Resuming stopped builds.

## Notes
- Asked for 2026-11-10 for release 1.0.0: "Create them all, set them all ready", from the follow-ups builders filed during the redesign.
- Decided: it depends on `watch`, as speck may carry it on with `fix` or `decide`.
- From 0585's build. Today: the grouping in `templates/panel.js` (0585) and the board's facts in `scripts/speck.mjs` and `scripts/foreman.mjs`. Waits for 0615, which changes the same file.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: a watcher resume or decide recorded at a time that can't be read no longer counted as about to carry the stopped build on. Superseded in review round 1: the rule now reads speck run's own list of pending resumes, not the watcher's past actions.
- Pictures: the Build lane in the light and dark looks, from a stubbed board with a stopped build nothing carries on.

## In plain words
When a ticket's build stops partway and nothing is going to pick it up again, the Build lane now lists it under Needs you with an orange dot and "Build stopped", and the bar's Needs you number counts it. Before, it sat under Building with a grey dot, among the work in progress.

A stopped build speck is about to pick up stays under Building: one speck run will restart once after it was killed (unless it can't, which also needs you), or, with watch set to fix or decide, one speck is looking into or is about to resume. If that doesn't happen, it moves to Needs you.

To see it, look at the Build lane while a build has stopped, with watch on off or tell. Worth knowing: the All projects view doesn't count these yet (a follow-up is in the inbox).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 A historical resume/decide action is treated as proof that speck is still about to resume the build.; F2 AC4 explicitly requires the Delivery log to list tests changed from the old behaviour, but that section is empty.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 450,093
- Elapsed since build started: 318 min
- Changed lines: 45 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Tests changed from the old behaviour (a stopped build's grey dot, now orange as it needs you):
  - `test/panel-0155.test.mjs`: "0155 AC2: at … px in the … look, each row's dot is coloured by its state" (0305 now `needs`)
  - `test/panel-0171.test.mjs`: "0171 AC3: blocked, stopped and waiting tickets have no blue dot" (0508 now `needs`)
  - `test/panel-0167.test.mjs`: "0167 AC2 AC5: in the light look, only a ticket's dot is coloured, and a Build row has only a hairline under it and no tint" and its dark-look twin (0304 now `--needs-you`), found when the ship ran the whole suite merged with main
  - `test/panel-0416.test.mjs`: "0416 AC2: each row says its stage in the same words, with its stage under its title and a dot for what it needs" (0907 now `needs`)
- Follow-ups:
  - The bridge (All projects) doesn't count a stopped build under Needs you yet, so it can disagree with a project's bar: speck/ideas/2026-11-10-count-stopped-builds-on-the-bridge.md.
  - Tidy-up: the rule lives twice, in scripts/foreman.mjs (stoppedForYou) and templates/panel-model.js (leftStopped), as the page can't import node modules; a change to one needs the other.

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
    "reviewed_sha": "038dfad3fd2153a5ac68c5b709a140d75493d062",
    "session": "fresh",
    "thread_id": "01a1c66d-4389-71a2-b88b-5357a85cb1e0",
    "builder_response": "- Tests run: `speck test --related` with test/stopped-needs-0616.test.mjs test/panel-0171.test.mjs test/panel-0416.test.mjs test/panel-0155.test.mjs, plus every existing test file naming a changed file (2337 pass, 0 fail).\n- Design: one rule for \"a stopped build nothing will carry on\", `stoppedForYou` in scripts/foreman.mjs (the bar's Needs you count) and `leftStopped` in templates/panel-model.js (Build's groups; the page script can't import node modules, as with atShip in panel-summary.mjs). speck run, while on, resumes a killed build once (new board fact `build_resumed` from its run record's `resumed`), and with watch fix or decide looks into an exited one (agentView: running, waiting, or a latest resume/decide action at or after the exit). Anything else needs you.\n- AC4: changed tests that checked the old behaviour (a stopped build's grey dot): panel-0171 (\"0171 AC3: blocked, stopped and waiting tickets have no blue dot\", 0508 now 'needs'), panel-0416 (\"0416 AC2: each row says its stage…\", 0907 now 'needs'), panel-0155 (\"0155 AC2: … each row's dot is coloured by its state\", 0305 now 'needs').\n- scripts/speck.mjs stays at the 600-line limit (split-0078 check), so the new board fact shares a line.\n- Pictures taken of the Build lane, light and dark.\n",
    "seconds": 46,
    "usage": {
      "input_tokens": 295886,
      "cached_input_tokens": 237312,
      "cache_write_input_tokens": 0,
      "output_tokens": 1035,
      "reasoning_output_tokens": 61
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 58574,
      "cached": 237312,
      "write": 0,
      "output": 1035
    },
    "cost_usd": 0.1512292,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T17:07:37.462Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "The AC1 tests cover normal stopped builds, but stoppedForYou in scripts/foreman.mjs and leftStopped in templates/panel-model.js treat a recent resume/decide action as pending indefinitely, including after its resume fails."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "0616 AC2 tests exercise watcher waiting, watcher running, pending resume/decide and killed builds awaiting their first resume; all passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "0616 AC3 tests exercise foremanView counts, exclusions and question deduplication; all passed."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "The three existing dot tests were updated and the supplied run reports 2337 passes and no failures. However, the ticket's Delivery log still contains only its placeholder and does not list the changed tests."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/foreman.mjs; templates/panel-model.js",
        "issue": "A historical resume/decide action is treated as proof that speck is still about to resume the build. In scripts/foreman-agent.mjs, resume removes the pending request before attempting it and can then return because the command cannot be constructed or its record cannot be saved. The action remains in agentView.did, so both new rules keep this abandoned stopped build under Building and exclude it from the count.",
        "suggested_fix": "Expose actual pending resume state and use that to distinguish a pending request from a failed or discarded one. Add coverage showing that a failed resume returns the stopped build to Needs you and the bar's count.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "speck/tickets/0616-list-a-stopped-build-under-needs-you.md",
        "issue": "AC4 explicitly requires the Delivery log to list tests changed from the old behaviour, but that section is empty. Listing them in the builder response does not fulfil this requirement.",
        "suggested_fix": "List the changed panel-0155, panel-0171 and panel-0416 tests in the Delivery log.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The usual stopped-build cases display correctly and the reported tests pass. One failure path can still hide a stopped build under Building after speck fails to resume it. The required list of changed tests is also missing from the Delivery log."
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
    "reviewed_sha": "4a7123a7dbd5d9051821612f3408e69fc953cfd2",
    "session": "continued",
    "thread_id": "01a1c66d-4389-71a2-b88b-5357a85cb1e0",
    "builder_response": "- Tests run: `speck test --related` with test/stopped-needs-0616.test.mjs test/panel-0171.test.mjs test/panel-0416.test.mjs test/panel-0155.test.mjs, plus every existing test file naming a changed file (2353 pass, 0 fail).\n- F1: fixed. agentView (scripts/foreman-agent.mjs) now gives `resuming`, the ids in speck run's own pending `resumes` list, which resume() takes an entry off before it tries it. Both rules (stoppedForYou in scripts/foreman.mjs, leftStopped in templates/panel-model.js) no longer read the watcher's past actions: a stopped exited build stays under Building only while speck is looking into it, it's in `resuming` (whatever watch is now, as a pending resume runs anyway), or it's waiting to be looked into with watch fix or decide. New tests: \"0616 AC2: agentView lists the builds speck run is to resume, and drops one once it has tried it\" (a failed resume, taken off the list, puts it back under Needs you and in the bar's count), and AC1/AC3 cases where `did` has a resume but `resuming` doesn't. The self-check test about unreadable action times is gone along with the rule it tested.\n- F2: fixed. The Delivery log lists the three tests changed from the old behaviour (panel-0155, panel-0171, panel-0416).\n- The brief's sentence now says speck may resume one it looked into.\n",
    "seconds": 19,
    "usage": {
      "input_tokens": 448447,
      "cached_input_tokens": 369792,
      "cache_write_input_tokens": 0,
      "output_tokens": 1646,
      "reasoning_output_tokens": 61
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 20081,
      "cached": 132480,
      "write": 0,
      "output": 611
    },
    "cost_usd": 0.05952,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T17:10:25.302Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "stoppedForYou in scripts/foreman.mjs and leftStopped in templates/panel-model.js now use actual pending resumes rather than historical actions. Passing AC1 tests cover stopped builds, orange dots and stopped-build text, including builds speck has left."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing AC2 tests cover watcher waiting/running, pending resumes and killed builds awaiting their first resume. agentView exposes s.resumes; the resume handler removes requests before attempting them and persists that removal."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing AC3 tests cover stopped-build counts, pending-resume exclusions and question deduplication in foremanView."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The Delivery log lists the changed panel-0155, panel-0171 and panel-0416 tests. The supplied related-test run reports 2353 passes, zero failures and three skips; no unrelated regression is evident."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/foreman.mjs; templates/panel-model.js",
        "issue": "Historical resume actions previously kept abandoned stopped builds under Building after a failed resume.",
        "suggested_fix": "Implemented: both rules use agentView.resuming, backed by the actual pending resume list. Tests cover pending-list removal and historical actions without pending resumes.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "speck/tickets/0616-list-a-stopped-build-under-needs-you.md",
        "issue": "The Delivery log previously omitted the tests changed from the old behaviour.",
        "suggested_fix": "Implemented: the Delivery log now lists all three changed tests and their updated expectations.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Stopped builds now appear under Needs you when nothing will carry them on, including after a failed resume. Builds awaiting automatic attention stay under Building. Both previous findings are resolved, and all reported tests pass."
  }
}
```

</details>

<details><summary>Round 3 · codex · changes_requested · merge round</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "379155c1a07ff5e22b4116f4af1965bff8908029",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1c66d-4389-71a2-b88b-5357a85cb1e0",
    "builder_response": "- Merge round after speck ship's \"Tests fail together\": main merged into the ticket branch with `git merge main`, no conflicts.\n- Failing tests: \"0167 AC2 AC5: in the light look, only a ticket's dot is coloured, and a Build row has only a hairline under it and no tint\" and its dark-look twin. Why: test/panel-0167.test.mjs expects its stopped build (0304, build_exit, no watcher in the stub) to have the grey dot, the old behaviour this ticket changes, like panel-0155/0171/0416 before. The `speck test --related` run before review didn't include it, as it names none of the changed files.\n- Changed: 0304's expected dot is now `--needs-you`, with a comment. No code changed. The Delivery log lists it with the other tests changed from the old behaviour (AC4).\n- Tests run: `speck test --related` with test/panel-0167.test.mjs test/stopped-needs-0616.test.mjs test/panel-0171.test.mjs test/panel-0416.test.mjs test/panel-0155.test.mjs, plus every existing test file naming a changed file (2367 pass, 0 fail).\n",
    "seconds": 25,
    "usage": {
      "input_tokens": 648289,
      "cached_input_tokens": 546560,
      "cache_write_input_tokens": 0,
      "output_tokens": 2408,
      "reasoning_output_tokens": 76
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 23074,
      "cached": 176768,
      "write": 0,
      "output": 762
    },
    "cost_usd": 0.0714448,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T17:17:12.660Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "The normal AC1 cases pass, but stoppedForYou in scripts/foreman.mjs and leftStopped in templates/panel-model.js exclude every killed build with build_resumed false while run is on. scripts/run.mjs resumeKilled can refuse such a resume, leaving a stopped build that nothing will carry on under Building."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing AC2 tests cover pending watcher investigations, pending resumes and killed builds awaiting their first automatic resume. The merged code retains these rules."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "foremanView counts stopped builds through stoppedForYou, so a killed build whose first resume is refused is also missing from the bar's Needs you count. Other AC3 cases pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The panel-0167 change correctly updates stopped ticket 0304 to the orange dot while retaining its other visual assertions. The Delivery log lists all four updated test files. The supplied run reports 2367 passes and zero failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/foreman.mjs; templates/panel-model.js",
        "issue": "Historical watcher resume actions previously hid stopped builds after a failed resume.",
        "suggested_fix": "Resolved by using agentView.resuming instead of historical actions; the merged code retains this fix.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "speck/tickets/0616-list-a-stopped-build-under-needs-you.md",
        "issue": "The Delivery log previously omitted the changed tests.",
        "suggested_fix": "Resolved: the Delivery log lists the updated tests, including panel-0167.",
        "state": "resolved"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "scripts/run.mjs; scripts/foreman.mjs; templates/panel-model.js",
        "issue": "A killed build whose first automatic resume is refused still stays under Building and is excluded from Needs you. resumeKilled returns without setting resumed when resumeFor cannot produce a command or saving the run record fails. Both classification rules interpret that unchanged record as an upcoming resume indefinitely. The newly added Delivery log acknowledges this limitation, but it contradicts AC1 and AC3.",
        "suggested_fix": "Expose when a killed build cannot be resumed and have both classification rules put it under Needs you and include it in the count. Add a regression test for a refused first resume. This changes reporting, without requiring new resume behaviour.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The merged colour-test update is correct and both previous fixes remain intact. A newly documented gap still hides killed builds when speck cannot restart them, which defeats the ticket's purpose for that failure case. This needs fixing before approval."
  }
}
```

</details>

<details><summary>Round 4 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 4,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "1a03268b6f81e4d84c0a6ec9a1f75ea4ad7ca59c",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1c66d-4389-71a2-b88b-5357a85cb1e0",
    "builder_response": "- Tests run: `speck test --related` with test/panel-0167.test.mjs test/stopped-needs-0616.test.mjs test/panel-0171.test.mjs test/panel-0416.test.mjs test/panel-0155.test.mjs, plus every existing test file naming a changed file (2368 pass, 0 fail).\n- F3: fixed for the refusal that lasts. The board fact `build_resumed` is now `build_wont_resume`: true when speck run has resumed the killed build once already, or can't resume it. That uses resumeFor, the same check resumeKilled makes, through go-with.mjs's cantResume (now exported) and a new `wontResume` in scripts/stop-wait.mjs. Both rules read it. New tests: \"0616 AC1: the board says when speck run won't resume a killed build: resumed once already, or it can't\" (a run record with no session, which resumeFor refuses) and \"0616 AC1 AC3: a killed build speck run can't resume is under Needs you and counted in the bar\". The known-limit note is gone from the Delivery log.\n- F3, the failure to save the run record: not treated as \"won't resume\", on purpose. resumeKilled sets nothing when the save fails, so buildKilled still returns the record without `resumed`, and the next check in run.mjs's loop calls resumeKilled again. Only the log line is said once (stoppedReported). So speck run is still trying to resume it, which AC2 keeps under Building.\n",
    "seconds": 27,
    "usage": {
      "input_tokens": 864036,
      "cached_input_tokens": 753920,
      "cache_write_input_tokens": 0,
      "output_tokens": 3063,
      "reasoning_output_tokens": 76
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 8387,
      "cached": 207360,
      "write": 0,
      "output": 655
    },
    "cost_usd": 0.04406,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T17:20:02.918Z"
  },
  "verdict": {
    "round": 4,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Both classification rules now read build_wont_resume. statusData derives it through wontResume using the runner's resumeFor eligibility check. Passing AC1 tests cover stopped builds, prior resumes and an unresumable record; panel tests cover grouping, orange dots and stopped-build text."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing AC2 tests cover pending investigations, pending resumes and killed builds awaiting automatic resume. The runner retries after a record-save failure: it leaves resumed unset and calls resumeKilled again on subsequent checks."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing AC3 tests cover counts and exclusions, including the new test that an unresumable killed build appears under Needs you and contributes to the bar's count."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The Delivery log lists all four existing test files updated from the old behaviour. The supplied related-test run reports 2368 passes, zero failures and three skips."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/foreman.mjs; templates/panel-model.js",
        "issue": "Historical watcher resume actions previously hid stopped builds after a failed resume.",
        "suggested_fix": "Implemented: classification uses actual pending resumes rather than historical actions.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "speck/tickets/0616-list-a-stopped-build-under-needs-you.md",
        "issue": "The Delivery log previously omitted the changed tests.",
        "suggested_fix": "Implemented: the Delivery log lists the four updated test files.",
        "state": "resolved"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "scripts/stop-wait.mjs; scripts/foreman.mjs; templates/panel-model.js",
        "issue": "Killed builds that could not be resumed previously remained under Building and were omitted from Needs you.",
        "suggested_fix": "Implemented: build_wont_resume includes resume eligibility failures and is used by both rules, with regression coverage. The explanation for retaining Building during retried save failures is supported by the runner's loop.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Stopped builds now appear under Needs you when speck cannot carry them on, including builds it cannot resume. Builds awaiting investigation or retry remain under Building. All previous findings are resolved, and the reported tests pass."
  }
}
```

</details>
