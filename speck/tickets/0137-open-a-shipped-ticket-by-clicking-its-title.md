---
id: "0137"
title: "Open a shipped ticket by clicking its title"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-12
started: "2026-10-12T21:21:57.239Z"

---
# 0137 · Open a shipped ticket by clicking its title

**Status:** 🔍 reviewing

## Problem
Each row in the panel's Shipped table has two buttons, Full ticket and Review pack. Two buttons side by side make every row taller than it needs to be, so the table takes more room and is harder to scan.

## Outcome
In the Shipped table, a ticket's title is a link that opens the full ticket. Review pack is the only button left on each row, and the rows are slimmer.

## Acceptance criteria
1. In each Shipped row, the ticket's title is shown as a link: in the accent colour, underlined on hover, with a pointer cursor. Clicking it opens that ticket in the full ticket pane, exactly as the Full ticket button does today.
2. The title link can be reached with Tab and opened with Enter. Screen readers announce it with the ticket's title as its name.
3. Each Shipped row has exactly one button, Review pack, and no Full ticket button. Review pack works as before.
4. In a browser, a Shipped row whose title fits on one line is no taller than the same row with its Review pack cell left out.
5. No test that passed before this change fails, except checks that a Shipped row has a Full ticket button, which are changed to check that its title opens the full ticket.

## Out of scope
- The Full ticket buttons in the Plan list and the Build queue: they stay as they are.
- Anything about the review pack or the full ticket pane itself.
- Putting focus back on the title when the pane closes: that's the inbox idea `speck/ideas/2026-10-09-return-focus-after-the-full-ticket-pane-closes.md`.

## Notes
- The row is made in `templates/panel.html`, where the Shipped table is filled (`fill('shipped', …)`), using `fullButton` and `packButton`.
- The ticket id and any bug or fix tag stay beside the title and don't need to be part of the link.
- The link opens the pane in the page and doesn't go to another address. The builder chooses the element, as long as AC1 and AC2 hold.
- Failing before this build: none
- AC5: besides the Full ticket checks in the 0063 and 0132 tests, one 0050 browser test found a Shipped row's title as the last text in its first cell, to select part of it. The title is inside the link now, so that test's selector points at the link's text instead. What it checks (the selection is kept through refreshes) is unchanged.
- Self-check: a blank or all-spaces title now shows `Ticket <id>` as the link, so there's always something to click.

## In plain words
In the panel's Shipped list, each ticket's title is now a link: click it (or Tab to it and press Enter) to open the full ticket in the side pane. The Full ticket button has gone from those rows, leaving only Review pack, so the list is a little tidier. To see it, open the panel and click any shipped ticket's title. Worth knowing: opening a title in a new tab (middle-click) just opens the panel again, not the ticket.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Known limit: the title link's address is `#`, so middle-click or "open in new tab" opens the panel itself rather than the ticket. No inbox note: the ticket asked for the link to stay in the page.

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
    "reviewed_sha": "307972a417be80afa1df083267917d70e0550b84",
    "thread_id": "01a13205-87d7-7a42-b60b-2310e8de2922",
    "seconds": 22,
    "usage": {
      "input_tokens": 100393,
      "cached_input_tokens": 60288,
      "cache_write_input_tokens": 0,
      "output_tokens": 611,
      "reasoning_output_tokens": 13
    },
    "saved_at": "2026-10-12T21:30:07.300Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: fullLink creates the accent-coloured title link with hover underline and pointer cursor; openFull preserves the previous pane-opening behaviour. The passing 0137 browser test exercises styling, hover and a real mouse click."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing 0137 browser test uses actual Tab and Enter key events to open the ticket, then checks the accessibility tree for a link named by the ticket title."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "render's Shipped rows contain only packButton. The passing 0137 AC3 test checks exactly one Review pack button per row and verifies that clicking it displays the fetched review pack."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The passing 0137 browser test measures the rendered row height with its Review pack cell present and removed, asserting that the cell adds no height."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0137-tests.txt: 1,228 tests, 1,225 passed, zero failures and three skipped. Changes to 0050, 0063 and 0132 retain their behavioural assertions while targeting the title link. Plan and Build retain Full ticket buttons."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Shipped ticket titles now open the full ticket with a click or keyboard, leaving Review pack as the only row button. Browser tests confirm accessibility, styling and slimmer rows. The full suite has no failures, and I found no blocking issues."
  }
}
```

</details>
