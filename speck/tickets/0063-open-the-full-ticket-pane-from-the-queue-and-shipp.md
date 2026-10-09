---
id: "0063"
title: "Open the full ticket pane from any ticket in the panel"               # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0052", "0053", "0062"]               # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T20:28:37.503Z"

---
# 0063 · Open the full ticket pane from any ticket in the panel

**Status:** 🔍 reviewing

## Problem
The full ticket pane opens only from a draft in Shaping. Once a ticket is in the queue or has shipped, the user can't read what it was meant to do without opening its file, which is when they most often want a reminder: watching a build, or checking what just shipped.

## Outcome
Any ticket in the queue or the Shipped list can be opened in the full ticket pane.

## Acceptance criteria
1. An open queue ticket (one whose log is showing) has a "Full ticket" button, and each row in the Shipped list has one too. Clicking either opens the pane on that ticket and opens, closes or selects nothing else.
2. For a ticket that isn't a draft, the pane shows the same id, title and sections as for a draft, with no readiness list and no **Set ready** button.
3. The pane stays open on the same ticket while that ticket shows anywhere in the panel (Tickets, the queue or the Shipped list's 5), including when it moves between them: a draft set ready, a queued ticket that starts building, a build that ships. It closes when the ticket shows nowhere, for example when a sixth ticket ships and pushes it off the Shipped list.
4. Opening and closing the pane leaves queue tickets open or closed as they were, and text selected in a queue or Shipped row, and a log's scroll position, stay put through the refresh as they do today.

## Out of scope
- Ready tickets that aren't in flight: the queue opens only in-flight tickets today (0051), and this doesn't change that.
- Cancelled tickets and done tickets beyond the latest 5.
- The review rounds or delivery log in the pane: it shows the same sections as for drafts.

## Notes
- After 0062, as 0060, 0061 and 0062 all change the side pane; and after 0052 and 0053, which change the open queue ticket, all in `templates/panel.html`.
- Changes the rule from 0054 and 0062 that the pane closes when a draft is set ready: with this, it stays open on that ticket in the queue (criterion 3).
- The pane's lookup is in `renderFull`, which looks only in the Tickets list today. Done tickets already come with their sections in `/api/state`.
- product.md's Queue and Shipped descriptions need updating.
- Tests changed by this ticket's rule change: 0054 AC4, 0060's browser test and 0062 AC3 expected the pane to close once a draft is set ready, so they now cancel the ticket (or check it stays open in the queue). 0051 AC2 and 0053 AC4 pin the open queue row's contents and now allow its Full ticket button, and 0050's browser test reads the Shipped time from the third cell, as the button's cell now comes last.
- Self-check: added cover for ids named like built-ins, an id in more than one list (the first in Tickets, the queue, then Shipped), cancelled tickets closing the pane, and the pane keeping the focus after its own Set ready; no code changes needed.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (Delivery log only, none went to the inbox):
- Known limit: the ticket's out of scope says the queue opens only in-flight tickets, but a `ready` queue ticket opens too (it shows its log), so it gets a Full ticket button as well, as criterion 1 asks for any open queue ticket.
- Known limit: when the same id shows in more than one list, the pane shows the first in Tickets, then the queue, then Shipped, even when it was opened from a later list.

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
    "reviewed_sha": "6206952093631e00777842622ecb7365d5acdb4e",
    "thread_id": "01a12265-69e8-71a2-9c6e-baca05be3b08",
    "seconds": 31,
    "usage": {
      "input_tokens": 446974,
      "cached_input_tokens": 353280,
      "cache_write_input_tokens": 0,
      "output_tokens": 822,
      "reasoning_output_tokens": 73
    },
    "saved_at": "2026-10-09T20:41:05.247Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: queueItem and Shipped rendering add fullButton, whose handler stops propagation. test/panel-0063.test.mjs AC1 tests exercise both entry points and unchanged open states; builder reports all passing."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html: fullTicket includes paneReadiness only for drafts and uses the same section renderer otherwise. 0063 AC2 tests compare sections and check absence of readiness and Set ready; reported passing."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html: renderFull searches drafts, queue and the latest five shipped tickets. 0063 AC3 tests exercise status transitions, cancellation and displacement by a sixth shipped ticket; reported passing. Updated 0062 test exercises successful Set ready."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html: fullButton and closeFull change only fullId; keptItems preserves unchanged rows and logs. 0063 AC4 tests verify retained nodes, open states and scroll position across refreshes and closure methods; browser coverage verifies log scroll preservation. Existing 0050 selection tests remain intact and are reported passing."
      }
    ],
    "findings": [],
    "product_md": {
      "accurate": true,
      "note": "Updated pane, Queue and Shipped descriptions match the implementation and ticket scope."
    },
    "escalation_question": "",
    "summary": "Queue and Shipped tickets now open in the full ticket pane, which follows a ticket through building and shipping. Non-drafts hide readiness controls, and existing row state and log positions are preserved. Code and test inspection found no blocking issues. The builder reports all 494 tests passing; I did not rerun tests in the read-only review."
  }
}
```

</details>
