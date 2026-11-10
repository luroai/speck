---
id: "0611"
title: "Name the lane on Decided for you's back link"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-10-name-the-lane-on-decided-for-you-s-back-link.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T09:57:09.392Z"
approved: "2026-11-10T10:01:47.436Z"
finished: "2026-11-10T10:15:17.332Z"

---
# 0611 · Name the lane on Decided for you's back link

**Status:** ✅ done

## Problem
Decided for you's back link reads "‹ Close", while the Pipeline log's and a ticket's full view's name the lane they go back to, such as "‹ Build". Since 0600 the three share one style, so "Close" is the odd one out and says less about where it goes.

## Outcome
Decided for you's back link names the lane it goes back to.

## Acceptance criteria
1. Decided for you's back link reads "‹" and the name of the lane that was open when it was opened, such as "‹ Build", as the other full views' do.
2. A screen reader reads it as "Back to" and the lane's name.
3. Pressing it, or Escape, closes Decided for you and shows that lane, as today.
4. Tests that checked the old behaviour are changed to check the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- Decided for you's content.

## Notes
- Asked for 2026-11-10 for release 1.0.0: "Create them all, set them all ready", from the follow-ups builders filed during the redesign.
- From 0600's build: the button kept "Close" because 0568's tests press a button named Close, which this ticket may change. Today: `renderDecided` in `templates/panel-popups.js`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: the list is drawn again when the open lane changes, so its back link can't keep a stale lane's name.

## In plain words
The link at the top of Decided for you now says where it goes back to, such as "‹ Build" or "‹ Plan", instead of "‹ Close", just like the Pipeline log and a ticket's full view. Screen readers announce it as "Back to" and the lane's name. To see it, open Decided for you from the line under the bar while on any lane: the link names that lane, and pressing it or Escape takes you back there as before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Acceptance criterion 4 requires the Delivery log to list tests changed from the old behaviour, but the log is empty.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 232,285
- Elapsed since build started: 5 min
- Changed lines: 7 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Tests changed for the new behaviour: `test/panel-decided-0568.test.mjs`, "0568 AC4", pressed the button named Close; it now presses the back link named "Back to Build" (renamed "the back link and Escape close the list…").

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
    "reviewed_sha": "e16ee7dec1de386ffda73d5feb2764f6f3b86f7c",
    "session": "fresh",
    "thread_id": "01a1c4e7-0e7b-7ae1-bdb2-16152d1e9c9a",
    "builder_response": "- Tests run: test/panel-decided-0611.test.mjs test/panel-decided-0568.test.mjs, with `speck test --related` (it added the 7 other test files that name templates/panel-popups.js; all passed, browser tests included).\n- The ‹ before the lane's name comes from the existing CSS rule `#decided .top .close::before { content: '‹' }` (templates/panel-popups.css), as the other full views' back links get theirs; only the button's text and aria-label changed.\n- AC4: test/panel-decided-0568.test.mjs \"0568 AC4\" pressed a button named Close; it now presses the back link (aria-label \"Back to Build\"). No other test checked the old text.\n- Pictures: Decided for you opened from Plan, light and dark, kept with `speck picture`.\n",
    "seconds": 29,
    "usage": {
      "input_tokens": 117633,
      "cached_input_tokens": 94592,
      "cache_write_input_tokens": 0,
      "output_tokens": 814,
      "reasoning_output_tokens": 17
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 23041,
      "cached": 94592,
      "write": 0,
      "output": 814
    },
    "cost_usd": 0.0636812,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T10:01:08.168Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "renderDecided in templates/panel-popups.js sets the lane name; templates/panel-popups.css supplies ‹. Passing test '0611 AC1 AC2' checks all four lanes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "renderDecided sets aria-label to 'Back to ${lane}'. Passing test '0611 AC1 AC2' checks each lane's accessible name."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing test '0611 AC3' exercises clicking the back link and pressing Escape, checking that the list closes and Plan remains visible."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "test/panel-decided-0568.test.mjs updates the old Close interaction. The recorded run has 200 passes, zero failures and three skips. However, the ticket's Delivery log remains an empty placeholder and does not list the changed test."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0611-name-the-lane-on-decided-for-you-s-back-link.md",
        "issue": "Acceptance criterion 4 requires the Delivery log to list tests changed from the old behaviour, but the log is empty.",
        "suggested_fix": "Record test/panel-decided-0568.test.mjs and its updated '0568 AC4' test in the Delivery log, explaining that it now presses the lane-named back link.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The back link correctly names the lane, has the requested screen-reader label, and closes correctly by click or Escape. The tests passed. Before approval, the delivery record must list the updated test, as the ticket requires."
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
    "reviewed_sha": "05c8f242253a3dcbbac5dd5e5d26749871acb1d9",
    "session": "continued",
    "thread_id": "01a1c4e7-0e7b-7ae1-bdb2-16152d1e9c9a",
    "builder_response": "- Tests run: none this round: only the ticket file changed, so the round-1 output (test/panel-decided-0611.test.mjs, test/panel-decided-0568.test.mjs and their related files, all passing) still holds.\n- F1: fixed. The ticket's Delivery log now lists test/panel-decided-0568.test.mjs's \"0568 AC4\" test and what changed in it.\n",
    "seconds": 26,
    "usage": {
      "input_tokens": 230834,
      "cached_input_tokens": 204160,
      "cache_write_input_tokens": 0,
      "output_tokens": 1451,
      "reasoning_output_tokens": 17
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 3633,
      "cached": 109568,
      "write": 0,
      "output": 637
    },
    "cost_usd": 0.0245928,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T10:01:41.317Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-popups.js renderDecided sets the current lane's name; templates/panel-popups.css supplies ‹. Passing test '0611 AC1 AC2' checks all four lanes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "renderDecided sets aria-label to 'Back to ${lane}'. Passing test '0611 AC1 AC2' verifies this for every lane."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing test '0611 AC3' exercises the back link and Escape, verifying closure and that Plan remains visible."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The Delivery log now lists the updated '0568 AC4' test in test/panel-decided-0568.test.mjs and explains its change. The unchanged code and tests retain the recorded result: 200 passed, zero failed, three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0611-name-the-lane-on-decided-for-you-s-back-link.md",
        "issue": "The Delivery log previously omitted the test changed from the old Close behaviour.",
        "suggested_fix": "Completed: the Delivery log names the updated test and explains the new back-link interaction.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The back link names the lane, provides the requested screen-reader label, and closes correctly by click or Escape. The delivery record now documents the updated test. All criteria pass."
  }
}
```

</details>
