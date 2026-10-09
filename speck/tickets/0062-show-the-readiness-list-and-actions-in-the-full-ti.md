---
id: "0062"
title: "Show the open ticket's readiness panel in the full ticket pane"               # one outcome, no "and"
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
after: ["0061"]               # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T20:11:42.960Z"

---
# 0062 · Show the open ticket's readiness panel in the full ticket pane

**Status:** 👍 approved

## Problem
The full ticket pane shows the ticket's text but not its readiness list or **Set ready** button. After reading the whole ticket, the user has to close the pane and find the open ticket in the list to check readiness and act on it.

## Outcome
The full ticket pane shows the same readiness list and action buttons as the open ticket in the list, so the user can read a ticket and set it ready in one place.

## Acceptance criteria
1. The pane shows the ticket's readiness list, the same lines as the open ticket in the list (size and risk, criteria count, each lint error and warning in full or "lint passes", and each `after:` id marked done or not done, or "no after: tickets"), straight after the id and title, before the problem.
2. Below the readiness list, the pane shows the same action buttons as the open ticket in the list, except "Full ticket": today that's **Set ready**. It's disabled, with the same hover text, whenever the list's button is, and shows "Setting ready…" while a request for that ticket is in progress, whichever button sent it.
3. Clicking **Set ready** in the pane leaves the pane open until the next refresh. If the server refuses, the reason shows under the button in the pane and under the button in the list, until the next click on either of them. When it succeeds, the next refresh moves the ticket to the queue and closes the pane, as it does today.
4. The readiness list and button change on the refresh when the ticket's data changes, and text selected elsewhere in the pane stays selected while it's unchanged.

## Out of scope
- Moving the readiness list or button out of the short view: both stay there.
- New actions. Any action added to the open ticket later should appear in the pane too, but that's for the ticket that adds it.
- How the pane's text looks (0061), and how it opens and closes (0060).

## Notes
- After 0061, which comes after 0060: all three change the side pane in `templates/panel.html`, so ordering them keeps the builds from conflicting.
- Readiness at the top, so it's visible without scrolling, is a default chosen while ticketing. To confirm before ready.
- The refusal reasons and pending requests are already kept by ticket id in the page (`refused`, `settingReady`).
- product.md's Shaping description needs updating.
- The pane's readiness list carries the same "Readiness" heading as the list's, so the 0054 and 0061 tests that list the pane's headings now start with it.
- Self-check: the pane's Set ready kept the focus on a node that was replaced, so the keys stopped scrolling the pane after a click; the pane now takes the focus back (browser test added).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 340,645
- Elapsed since build started: 8 min
- Changed lines: 44 (limit 5000)
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
    "reviewed_sha": "5fcd38a220d28929bb01684955c0b08ae41bd987",
    "thread_id": "01a12251-ecac-7a02-ac5d-9a410731c3f4",
    "seconds": 34,
    "usage": {
      "input_tokens": 339788,
      "cached_input_tokens": 248192,
      "cache_write_input_tokens": 0,
      "output_tokens": 857,
      "reasoning_output_tokens": 111
    },
    "saved_at": "2026-10-09T20:19:51.075Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html readiness() is shared by ticketDetail() and fullTicket(), placing identical readiness lines before Problem. Independently reran the AC1 test in test/panel-0062.test.mjs: passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "readiness() omits Full ticket in the pane and uses the shared setReadyButton() and settingReady state. Both AC2 tests independently passed, covering disabled hover text and requests from either button."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "setReady() shares refusals by ticket id; renderFull() closes when the draft leaves the list. Both AC3 tests independently passed, covering success, refusal persistence and clearing from either button."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "renderFull() separates fullText and readyData signatures, replacing only readiness when other pane text is unchanged. Both AC4 tests independently passed. The browser test exercises actual selection preservation and focus; builder output reports it passed, but I did not rerun it because it writes temporary files."
      }
    ],
    "findings": [],
    "product_md": {
      "accurate": true,
      "note": "The Shaping description accurately documents readiness placement, shared button state and refusals, and preservation of selected text outside readiness."
    },
    "escalation_question": "",
    "summary": "The full ticket pane now shows readiness and Set ready, with pending requests and refusal reasons shared with the list. Refreshes update readiness while preserving unchanged ticket text. All seven independently rerun tests passed; the supplied browser test also passed in the builder’s run. No blocking issues found."
  }
}
```

</details>
