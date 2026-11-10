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
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Tests changed from the old behaviour (a stopped build's grey dot, now orange as it needs you):
  - `test/panel-0155.test.mjs`: "0155 AC2: at … px in the … look, each row's dot is coloured by its state" (0305 now `needs`)
  - `test/panel-0171.test.mjs`: "0171 AC3: blocked, stopped and waiting tickets have no blue dot" (0508 now `needs`)
  - `test/panel-0416.test.mjs`: "0416 AC2: each row says its stage in the same words, with its stage under its title and a dot for what it needs" (0907 now `needs`)

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
