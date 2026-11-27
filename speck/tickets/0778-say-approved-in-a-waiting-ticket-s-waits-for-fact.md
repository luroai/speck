---
id: "0778"
title: "Say approved in a waiting ticket's Waits for fact"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: "bug"                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "quick"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-25-say-approved-not-building-in-a-waiting-ticket-s-waits-for-fact.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-26
started: "2026-11-27T01:12:54.994Z"

---
# 0778 · Say approved in a waiting ticket's Waits for fact

**Status:** 🔍 reviewing

## Problem
A ready ticket's Waits for fact names each ticket it waits on with its state, and shows one that is approved and waiting to ship as "building", pointing you at the wrong thing to chase.

## Outcome
The Waits for fact says a ticket is approved when it is.

## Acceptance criteria
1. In a ticket's full view and on its card, a ticket it waits on whose status is approved is shown as approved, not building.
2. Building, reviewing and blocked tickets it waits on are still shown as building, and shipped, queued and cancelled ones as today.
3. No test that passed before this change fails.

## Out of scope
- Which tickets count as waited on.

## Notes
- Failing before this build: none
- Self-check: no changes
- 0698 AC3's test expected "0801 building" for an approved ticket, the behaviour AC1 changes, so it now expects "approved".
- From 0737's pictures: 0001 waited on approved 0002 and its full view said "0002 building". The states come from `DEP_WORDS` and `depsOf` in the panel.

## In plain words
When a ticket waits on one that is approved and waiting to ship, it now says "approved" instead of "building", so you know to chase the shipping rather than the build.

To see it, open a ticket in the panel that waits on an approved one, either its card in Plan or its full view. Building, reviewing and blocked tickets still read as "building".

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up, saved to the inbox: no gap above the Waits for tiles in a full view (speck/ideas/2026-11-27-gap-above-the-waits-for-tiles.md).

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
    "reviewed_sha": "978a2f4b8eeab05a36e513522b2f2ae361129a42",
    "session": "fresh",
    "thread_id": "01a21a9d-9eb3-77b2-aa57-e14303d80851",
    "builder_response": "Round 1. Test files run: `speck test --related test/panel-0778.test.mjs` once (4531 tests; the only failure was 0698 AC3, and a mistake in the new test file, both fixed), then `speck test --files test/panel-0778.test.mjs test/panel-0698.test.mjs` (the attached output, all pass).\n\ntest/panel-0698.test.mjs: one assertion changed from \"0801 building\" to \"0801 approved\". The ticket there is approved, so the old text is exactly what AC1 changes.\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 124554,
      "cached_input_tokens": 87808,
      "cache_write_input_tokens": 0,
      "output_tokens": 594,
      "reasoning_output_tokens": 28
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 36746,
      "cached": 87808,
      "write": 0,
      "output": 594
    },
    "cost_usd": 0.0882128,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-27T01:28:09.043Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-model.js depsOf preserves approved as a distinct state; templates/panel.js DEP_WORDS renders it as approved. Both passing 0778 AC1 tests exercise cards and full views with single and multiple dependencies."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "depsOf retains the existing classification for other statuses. Passing test '0778 AC2: building, reviewing and blocked stay building; shipped, queued and cancelled as before' verifies the displayed labels in cards and full views."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The recorded test run reports 152 passed, 3 skipped and no failures. The changed 0698 assertion correctly reflects the approved label required by this ticket. Inspection found no unrelated implementation changes; the whole suite remains the shipping check."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Approved dependencies now say “approved” on ticket cards and in full views. Tests cover single and multiple dependencies and confirm that other status labels retain their behaviour. No blocking issues found."
  }
}
```

</details>
