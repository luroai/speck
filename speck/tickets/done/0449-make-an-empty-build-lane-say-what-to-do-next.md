---
id: "0449"
title: "Make an empty Build lane say what to do next"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0445", "0451"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T08:54:16.316Z"
approved: "2026-10-24T09:05:39.671Z"
finished: "2026-10-24T09:08:33.024Z"

---
# 0449 · Make an empty Build lane say what to do next

**Status:** ✅ done

## Problem
With nothing building or ready, the Build lane says "Nothing in flight or ready" twice, once as its counts line and once as its message, and nothing else. It looks empty and gives no next step.

## Outcome
An empty Build lane says it's clear once, shows what was shipped lately, and points to the next step.

## Acceptance criteria
1. With nothing in flight or ready, the Build lane says `Nothing building` once, without the counts line repeating it.
2. Under it, it says when the last ticket shipped and which, as `Last shipped 0433 · 12 min ago` (or `· today 08:10`, or a date when it wasn't today), and how many shipped today, as `24 shipped today`. With nothing shipped yet, it leaves those lines out.
3. With draft tickets in Plan, it offers a `Go to Plan · <n> drafts` button that opens the Plan tab. With none, it says to talk to your agent to capture an idea or make a ticket.
4. At 375 px and 1280 px wide, in both looks, the message is centred in the lane and meets 0161's contrast.

## Out of scope
- A lane with tickets in it.

## Notes
- For release 0.15.0 (0452). The user asked on 2026-10-24 for everything relevant to the release to be ticketed.
- From the user's phone screenshot on 2026-10-24: "an empty build queue looks a bit boring."
- Today: `fill('queue', …, 'Nothing in flight or ready.')` and `#queue-n` in `templates/panel.js`.
- Waits for 0445 (`templates/panel.css`) and 0451 (`templates/panel.js`).
- Failing before this build: none
- Self-check: no changes

## In plain words
When nothing is building or waiting, the Build tab now says "Nothing building" once, in the middle of the lane, instead of saying "Nothing in flight or ready" twice. Under it, it says which ticket shipped last and when (minutes ago, a time earlier today, or a date), and how many shipped today. Then it offers a "Go to Plan" button with the number of drafts waiting, or, with no drafts, tells you to talk to your agent to capture an idea or make a ticket. To see it, open the panel while nothing is ready or building. Worth a look: the "minutes ago" line moves on every 30 seconds, so it can be up to half a minute behind.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 shippedAgo() shows minutes ago for a shipment yesterday when fewer than 60 minutes have elapsed.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 473,590
- Elapsed since build started: 11 min
- Changed lines: 48 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
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
    "reviewed_sha": "19639aa53abab51623dfa3e3941ac9cb14e3f4c5",
    "session": "fresh",
    "thread_id": "01a16d27-12c6-73c2-936b-32bc4249b8ab",
    "builder_response": "- Tests run: test/panel-0449.test.mjs test/panel-0162.test.mjs test/panel-0410.test.mjs test/panel-0425.test.mjs, with --related bringing in test/panel-0281, 0416, 0430, 0431, 0433 and 0444, and the commands.checks files.\n- Existing tests changed: 0162, 0410 and 0425 asserted the old \"Nothing in flight or ready\" wording on the counts line and in the lane; AC1 replaces that, so they now check the counts line is empty and hidden and the lane says \"Nothing building\" once.\n- Choices the ticket leaves open: under a minute ago it says \"just now\"; a ticket shipped before today shows its day (\"22 Oct\"), as the Shipped cards do; with something shipped but none today, it says \"0 shipped today\" (the lines are left out only with nothing shipped yet, or no shipped time recorded). The minutes move on with a 30-second timer, cleared once the line goes, as the board only re-renders on a change. \"Go to Plan\" also switches Plan to its Tickets view, where the drafts are, and moves the focus to the Plan tab.\n- AC4 is checked in a real browser (one panel, both looks, both widths), measuring the message's centring and each line's computed contrast; 0161's own stylesheet check also covers the new rules. Pictures are in the review pack.\n",
    "seconds": 55,
    "usage": {
      "input_tokens": 186506,
      "cached_input_tokens": 141952,
      "cache_write_input_tokens": 0,
      "output_tokens": 962,
      "reasoning_output_tokens": 78
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T09:04:54.431Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js idleLane() and render() show the heading once and hide queue-n. Both 0449 AC1 tests passed."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The four AC2 tests passed for their fixtures, but shippedAgo() in templates/panel-model.js checks elapsed minutes before the calendar day. Independently reproduced: shipping at 23:58 yesterday and viewing at 00:10 returns '12 min ago', despite the criterion requiring a date when it wasn't today."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "idleLane() supplies the draft count and opens Plan's Tickets view, or supplies the agent hint. Both AC3 tests exercise these paths and passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The passing 0449 AC4 browser test measures centring and computed text contrast at both widths in light and dark looks. The new CSS uses existing colour tokens and button styles."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-model.js",
        "issue": "shippedAgo() shows minutes ago for a shipment yesterday when fewer than 60 minutes have elapsed. For example, at 00:10 a ticket shipped at 23:58 displays '12 min ago' instead of the previous day's date, contrary to AC2.",
        "suggested_fix": "Check whether the shipment was today before selecting the minutes format. Add a test spanning midnight that expects the previous day's date.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The empty Build lane now gives a clear status, shipping information and a useful next step. The reported tests passed, including browser checks for both themes and widths. One date boundary needs fixing: just after midnight, yesterday's shipment uses minutes ago instead of the required date."
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
    "reviewed_sha": "86559b364cf367c1399692bbec26b447eb02b4a6",
    "session": "continued",
    "thread_id": "01a16d27-12c6-73c2-936b-32bc4249b8ab",
    "builder_response": "- Tests run: test/panel-0449.test.mjs test/panel-0162.test.mjs test/panel-0410.test.mjs test/panel-0425.test.mjs, with the commands.checks files.\n- F1: fixed. shippedAgo() in templates/panel-model.js now checks the calendar day first: a ticket shipped before today shows its date however few minutes ago that was, and \"N min ago\" only applies within the hour today. New test \"0449 AC2: a ticket shipped just before midnight shows its date once the day has changed\" ships at 23:58 on 23 Oct, views at 00:10 on 24 Oct, and expects \"Last shipped 0432 · 23 Oct\" and \"0 shipped today\".\n",
    "seconds": 17,
    "usage": {
      "input_tokens": 284686,
      "cached_input_tokens": 234112,
      "cache_write_input_tokens": 0,
      "output_tokens": 1436,
      "reasoning_output_tokens": 78
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T09:05:32.327Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js idleLane() shows 'Nothing building'; render() clears and hides queue-n when empty. Both AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "idleLane() shows the latest shipment and today's count, omitting both without a recorded shipment. shippedAgo() now checks the calendar day first. All five AC2 tests passed, including the new midnight regression test."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "idleLane() provides the counted draft button opening Plan's Tickets view, or the agent hint when no drafts exist. Both AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.css centres the idle message. The AC4 browser test passed, measuring centring and computed contrast at 375 and 1280 px in both looks."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-model.js",
        "issue": "Shipments just before midnight previously displayed minutes ago instead of the previous day's date.",
        "suggested_fix": "Resolved: shippedAgo() checks the calendar day before elapsed minutes, with a regression test covering 23:58 yesterday viewed at 00:10 today.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The empty Build lane now shows its status once, recent shipping information and a useful next step. The midnight date issue is fixed and covered by a passing regression test. All criteria pass, with no blocking concerns remaining."
  }
}
```

</details>
