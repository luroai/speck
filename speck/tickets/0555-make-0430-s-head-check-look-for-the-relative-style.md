---
id: "0555"
title: "Make 0430's head check look for the relative stylesheet"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0555 · Make 0430's head check look for the relative stylesheet

**Status:** 🔍 reviewing

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
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
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
