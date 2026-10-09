---
id: "0059"
title: "Show panel page changes on a browser reload"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T19:18:33.948Z"

---
# 0059 · Show panel page changes on a browser reload

**Status:** 👍 approved

## Problem
`speck panel` reads `templates/panel.html` once when it starts and keeps sending that copy. After a ticket that changes the page ships, the user has to find and restart the panel process before a browser reload shows the change, which is easy to miss and looks like the ticket didn't work.

## Outcome
Reloading the panel in the browser shows the current `templates/panel.html`, without restarting `speck panel`.

## Acceptance criteria
1. With `speck panel` running, editing `templates/panel.html` and then requesting `/` returns the edited page, with the repo name, base branch and token filled in as before.
2. The token in the page stays the same across reloads for the life of the server, so **Set ready** works from a page loaded before or after the edit.
3. If `templates/panel.html` can't be read when `/` is requested (for example, it's missing), the server replies 500 with a plain-text reason naming the file and keeps running; `/api/state` still works.
4. `/api/state` and the 2-second refresh behave as before.

## Out of scope
- Changes to the server code (`scripts/speck.mjs`, such as new `/api/state` fields): those still need `speck panel` restarted.
- Reloading the page by itself, or a reload button or notice in the panel.
- Watching files or restarting the server automatically.

## Notes
- Today the page is read in `cmdPanel` in `scripts/speck.mjs`, before the server starts.
- product.md's `panel` entry needs to say page changes show on a reload, and server changes need a restart.
- Self-check: the placeholders are now filled with replacement functions, so a page or repo name containing `$&` or `$1` is served as written (test added); a `panel.html` that is a folder also gives the plain-text 500 (test added).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 309,052
- Elapsed since build started: 3 min
- Changed lines: 14 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "520fc06c103257217c8dde37b9c467b417ba0cb7",
    "thread_id": "01a1221c-d6e4-70c0-a304-c7c2cd932149",
    "seconds": 29,
    "usage": {
      "input_tokens": 308264,
      "cached_input_tokens": 221056,
      "cache_write_input_tokens": 0,
      "output_tokens": 788,
      "reasoning_output_tokens": 38
    },
    "saved_at": "2026-10-09T19:21:47.018Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs cmdPanel reads and fills the page on every GET /. test/panel-0059.test.mjs AC1 edits the actual template served by a running CLI and verifies updated content and all placeholders; supplied output passes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cmdPanel generates the token once outside the request handler. The AC2 integration test verifies identical tokens across reloads and an edit, then successfully posts Set ready using both loaded tokens; supplied output passes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "cmdPanel catches page-read errors and returns plain-text 500 naming pageFile. AC3 integration tests remove the template or replace it with a directory, verify the error and functioning /api/state, and verify recovery after restoration; supplied output passes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The /api/state handler and templates/panel.html polling code are unchanged. The new AC4 test exercises fresh state reads; existing test/panel.test.mjs polling, disconnection and recovery tests exercise the page script. Supplied output passes all these tests."
      }
    ],
    "findings": [],
    "product_md": {
      "accurate": true,
      "note": "Accurately documents page reloads, stable tokens, readable errors and the restart requirement for server changes."
    },
    "escalation_question": "",
    "summary": "Browser reloads now show page edits without restarting the panel. Set ready keeps working, and a missing page produces a clear error while the server remains available. The tests exercise the real server and cover all four criteria. No blocking issues found. Tests were inspected alongside the supplied passing results; they were not rerun in this read-only review."
  }
}
```

</details>
