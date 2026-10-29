---
id: "0555"
title: "Make 0430's head check look for the relative stylesheet"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-28-make-0430-s-head-check-look-for-the-relative-stylesheet.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-29
started: "2026-10-29T14:17:16.688Z"
approved: "2026-10-29T14:20:52.185Z"

---
# 0555 · Make 0430's head check look for the relative stylesheet

**Status:** 👍 approved

## Problem
0430 AC1's check that the Settings stylesheet loads in the page's head looks for `/panel-settings.css`, but since 0543 the page links `panel-settings.css`. The search finds nothing, so the check passes without checking anything, and a stylesheet could slip out of the head unnoticed.

## Outcome
0430 AC1's head check finds the page's link to `panel-settings.css`, and fails when it's missing or outside the head.

## Acceptance criteria
1. 0430 AC1's head check looks for the page's `<link rel="stylesheet" href="panel-settings.css">` and passes with `templates/panel.html` as it is.
2. The check fails when that link is missing from the page, and when it comes after `</head>`: the Delivery log says how this was checked.
3. No test that passed before this change fails.

## Out of scope
- The other stylesheets' links, which 0430 AC1 and 0472's tests already check.

## Notes
- Asked for 2026-10-29 for the 0.21.1 patch release.
- From the reviewer's minor finding F1 in 0543's round 1: `test/panel-0430.test.mjs`, line 18, compares `html.indexOf('/panel-settings.css')`, which is -1, with the head's end.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: added a case for a page with no `</head>` at all, which the check also fails.

## In plain words
Nothing changes in the panel itself. One of speck's own checks, which makes sure the Settings view's styles load before the page appears, had been looking for the wrong address and so never really checked anything. It now looks for the right one, and fails if those styles go missing or load too late. There's nothing to see in use; it just guards against a page that briefly shows unstyled.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 AC2 explicitly requires the Delivery log to explain how the missing-link and after-head failure cases were checked, but that section is empty.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 257,644
- Elapsed since build started: 4 min
- Changed lines: 0 (limit 5000)
- How AC2 was checked: 0430 AC1's head check is now `linkedInHead` in `test/support/head.mjs`. The test `0555 AC2` runs that same check on the real `templates/panel.html` with the `panel-settings.css` link removed, with it moved after `</head>`, and with no `</head>` at all, and asserts that each fails. It passes on the page as it is (`0555 AC1`).

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
    "reviewed_sha": "d0009fb5dc2e7ab48d5c35ab11d98d9e33e29466",
    "session": "fresh",
    "thread_id": "01a18807-cfb7-7a12-b9f3-c365e768032a",
    "builder_response": "- Tests run: test/panel-0555.test.mjs test/panel-0430.test.mjs (with --related, which picked no more)\n- The check is now a small helper, linkedInHead in test/support/head.mjs, which 0430 AC1 calls with the page's exact link. 0555 AC2 feeds it the page with the link removed, moved after </head>, and with no </head>, and each fails. No product code changed.\n",
    "seconds": 28,
    "usage": {
      "input_tokens": 79403,
      "cached_input_tokens": 48640,
      "cache_write_input_tokens": 0,
      "output_tokens": 582,
      "reasoning_output_tokens": 20
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 30763,
      "cached": 48640,
      "write": 0,
      "output": 582
    },
    "cost_usd": 0.07221,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-29T14:20:02.962Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/panel-0430.test.mjs calls linkedInHead(html, SETTINGS_LINK). The constant matches templates/panel.html:54, immediately before </head>. The passing 0555 AC1 test exercises the real template."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The passing 0555 AC2 test exercises missing and relocated links, plus a missing </head>. However, the ticket's Delivery log contains only its placeholder and does not explain how these checks were performed, as required."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "/tmp/speck-0555-tests.txt confirms 113 passed, 3 skipped and 0 failed across 116 tests. Changes are limited to the targeted check, its helper, regression tests and ticket metadata."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0555-make-0430-s-head-check-look-for-the-relative-style.md",
        "issue": "AC2 explicitly requires the Delivery log to explain how the missing-link and after-head failure cases were checked, but that section is empty.",
        "suggested_fix": "Add a Delivery log entry identifying the passing 0555 AC2 test and explaining that it removes the link and moves it after </head> to verify rejection.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The corrected check finds the relative stylesheet and rejects missing or misplaced links. The targeted tests pass. Before approval, record those failure checks in the Delivery log as the ticket requires."
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
    "reviewed_sha": "25b1c5642b70cd2dd6d41883353cdcaad3fb51cd",
    "session": "continued",
    "thread_id": "01a18807-cfb7-7a12-b9f3-c365e768032a",
    "builder_response": "- Tests run: test/panel-0555.test.mjs test/panel-0430.test.mjs\n- F1: fixed. The Delivery log now says how AC2 was checked: the 0555 AC2 test runs the head check on the real page with the link removed, moved after </head> and with no </head>, and each fails.\n",
    "seconds": 19,
    "usage": {
      "input_tokens": 176586,
      "cached_input_tokens": 142848,
      "cache_write_input_tokens": 0,
      "output_tokens": 1073,
      "reasoning_output_tokens": 20
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 2975,
      "cached": 94208,
      "write": 0,
      "output": 491
    },
    "cost_usd": 0.0202808,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-29T14:20:44.847Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/panel-0430.test.mjs uses linkedInHead(html, SETTINGS_LINK), whose constant matches the relative stylesheet link. The passing 0555 AC1 test checks the real template."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing 0555 AC2 test rejects the missing link, the link moved after </head>, and a missing </head>. The ticket's Delivery log now explicitly describes these checks."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The latest /tmp/speck-0555-tests.txt records 116 tests: 113 passed, 3 skipped, 0 failed. Only the ticket documentation changed since the previous review."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0555-make-0430-s-head-check-look-for-the-relative-style.md",
        "issue": "The required explanation of the failure checks was missing from the Delivery log.",
        "suggested_fix": "Record how the missing-link and after-head cases were checked.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The stylesheet check now finds the relative link and rejects missing or misplaced links. Tests pass, and the Delivery log records the required checks. All criteria are met."
  }
}
```

</details>
