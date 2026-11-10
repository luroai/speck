---
id: "0608"
title: Show speck asleep in every empty lane                # one outcome, no "and"
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
source: "speck/ideas/done/2026-11-09-show-speck-asleep-in-an-empty-build-and-shipped.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0606"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T10:47:25.480Z"

---
# 0608 · Show speck asleep in every empty lane

**Status:** 🔍 reviewing

## Problem
Since 0586, an empty Capture or Plan shows speck asleep with a line saying what lands there, but an empty Build keeps its older "Nothing building" message and an empty Shipped a plain line, so the four lanes don't look alike when empty.

## Outcome
Every empty lane shows speck asleep with one line saying what lands there.

## Acceptance criteria
1. An empty Build shows speck asleep and "Nothing building" with a line saying ready tickets land there, keeping its line about what shipped last and its button to Plan under them.
2. An empty Shipped shows speck asleep and "Nothing shipped yet" with a line saying approved tickets land there once they ship.
3. Speck, the heading and the line sit and look exactly as they do in an empty Capture or Plan, in both looks and at 320 px wide.
4. Tests that checked the old behaviour are changed to check the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- Capture's and Plan's empty states, which 0586 set.

## Notes
- Asked for 2026-11-10 for release 1.0.0: "Create them all, set them all ready", from the follow-ups builders filed during the redesign.
- Decided: Build keeps its last-shipped line and its Go to Plan button, under speck.
- Today: the empty states are built in `render()` in `templates/panel.js`. Waits for 0606, which changes the Shipped part of the same function.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: no changes (checked a lane emptied, filled and emptied again keeps one set of lines under speck, and the page without the face script still shows the line)

## In plain words
All four lanes now look the same when they're empty: speck asleep, with one line saying what's missing and what lands there. An empty Build says "Nothing building · Ready tickets land here." and still shows when the last ticket shipped and its button to Plan underneath. An empty Shipped says "Nothing shipped yet · Approved tickets land here once they ship." To see it, open Build with nothing building, or Shipped in a project that hasn't shipped anything yet.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Tests changed from the old behaviour to the new one (AC4):
  - test/panel-0449.test.mjs: the `lines()` helper reads speck's line and the lines under it; the 0449 AC1 and AC2 tests expect "Nothing building · Ready tickets land here." where they expected "Nothing building"; 0449 AC4's contrast check measures speck's line and each line under it.
  - test/panel-0162.test.mjs: "0162 AC2: with nothing in flight or ready, Build says "Nothing building"…" expects the lane's class `empty asleep idle` and speck's line; "0162 AC2: at 375/1280 px an empty Build says "Nothing building" at the top of its lane, once" reads speck's line.
  - test/panel.test.mjs and test/panel-0410.test.mjs match "Nothing shipped yet" and "Nothing building" loosely and pass unchanged.
- Follow-ups: none.

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
    "reviewed_sha": "169ec8b6a691a0d519265998b90e8ab008c71946",
    "session": "fresh",
    "thread_id": "01a1c519-80d0-7852-9b2b-98298b58bb87",
    "builder_response": "- Tests run: test/panel-0608.test.mjs test/panel-0449.test.mjs test/panel-0162.test.mjs (with --related, which added the 14 test files that name templates/panel.js or templates/panel-cards.css)\n- Old tests changed to the new behaviour (AC4): panel-0449's `lines()` helper now reads speck's line and the lines under it, and its \"Nothing building\" expectations say \"Nothing building · Ready tickets land here.\"; its contrast check in the browser measures each line rather than the message's direct children. panel-0162's AC2 tests (fake page and browser) read the line under speck. test/panel.test.mjs and test/panel-0410.test.mjs match /Nothing building/ and /Nothing shipped yet/ by regex and pass unchanged.\n- Shipped's list has no top padding of its own, unlike Capture's and Plan's, so its sleeping speck gets a 10 px top margin to sit at the same place; the AC3 browser test compares the face's box, the line's top and the line's type in all four lanes at 320 px in both looks.\n- Pictures: empty Build (with last shipped and Go to Plan), empty Shipped and, for comparison, empty Capture, light and dark.\n",
    "seconds": 31,
    "usage": {
      "input_tokens": 101113,
      "cached_input_tokens": 71680,
      "cache_write_input_tokens": 0,
      "output_tokens": 689,
      "reasoning_output_tokens": 32
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 29433,
      "cached": 71680,
      "write": 0,
      "output": 689
    },
    "cost_usd": 0.072924,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T10:56:16.215Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js idleLane() adds the sleeping face and ready-ticket message while retaining shipment details and Plan navigation. The three 0608 AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.js render() uses asleepLane() for empty Shipped. Both 0608 AC2 tests passed, checking the face, message and replacement by shipped tickets."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel-cards.css shares the existing asleep styling across all four lanes. The passing 0608 AC3 browser test compares face placement and line styling at 320 px in light and dark looks."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "The old expectations in test/panel-0162.test.mjs and test/panel-0449.test.mjs were updated, and the recorded run has 242 passes and no failures. However, the ticket's Delivery log contains only its placeholder and does not list the changed tests."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0608-show-speck-asleep-in-an-empty-build-and-shipped.md",
        "issue": "Acceptance criterion 4 explicitly requires the Delivery log to list the tests updated from the old behaviour, but that section is empty. The builder response lists them outside the ticket only.",
        "suggested_fix": "Add the changed test files and their updated checks to the ticket's Delivery log.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Empty Build and Shipped now show sleeping speck consistently with Capture and Plan, and the relevant tests pass. Before approval, the ticket needs the required record of which existing tests were updated."
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
    "reviewed_sha": "be866a5f05b96e8923e3911e69a337b2c74ff005",
    "session": "continued",
    "thread_id": "01a1c519-80d0-7852-9b2b-98298b58bb87",
    "builder_response": "- Tests run: test/panel-0608.test.mjs test/panel-0449.test.mjs test/panel-0162.test.mjs (unchanged since round 1; this round changes only the ticket)\n- F1: fixed. The ticket's Delivery log now lists each test changed from the old behaviour, in test/panel-0449.test.mjs and test/panel-0162.test.mjs, and the two that pass unchanged.\n",
    "seconds": 26,
    "usage": {
      "input_tokens": 188756,
      "cached_input_tokens": 156544,
      "cache_write_input_tokens": 0,
      "output_tokens": 1204,
      "reasoning_output_tokens": 32
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 2779,
      "cached": 84864,
      "write": 0,
      "output": 515
    },
    "cost_usd": 0.0191944,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T10:56:50.952Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js idleLane() shows sleeping speck and the ready-ticket message, retaining shipment details and Plan navigation underneath. All three 0608 AC1 tests passed; implementation and tests are unchanged since round 1."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.js render() uses asleepLane() for empty Shipped. Both 0608 AC2 tests passed, verifying the face, message and replacement by shipped tickets."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel-cards.css shares asleep styling across all four lanes. The 0608 AC3 browser test passed, comparing face placement and line styling at 320 px in light and dark looks."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The Delivery log now lists the updated checks in test/panel-0449.test.mjs and test/panel-0162.test.mjs. The recorded test run has 242 passes, three skips and no failures; code and tests are unchanged since that run."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0608-show-speck-asleep-in-an-empty-build-and-shipped.md",
        "issue": "The Delivery log previously omitted the tests updated from the old behaviour. It now lists the changed test files and checks, satisfying criterion 4.",
        "suggested_fix": "No further action required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Empty Build and Shipped now show sleeping speck consistently with Capture and Plan. Build retains its shipment details and Plan button. The relevant tests pass, and the required test record is now complete."
  }
}
```

</details>
