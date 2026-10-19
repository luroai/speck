---
id: "0326"
title: "Return focus to the Full ticket button when the pane closes"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-09-return-focus-after-the-full-ticket-pane-closes.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-19
started: "2026-10-19T07:09:07.388Z"

---
# 0326 · Return focus to the Full ticket button when the pane closes

**Status:** 🔍 reviewing

## Problem
When the full ticket pane closes, by Close, Escape or a click outside, the keyboard focus falls to the page itself, so someone using the keyboard has to Tab from the top of the page to get back to the ticket they were on.

## Outcome
Closing the full ticket pane puts the keyboard focus back on the Full ticket button that opened it.

## Acceptance criteria
1. Closing the full ticket pane with its Close button, Escape or a click outside puts the focus on the Full ticket button of the ticket it showed.
2. When the board refreshed while the pane was open, so the button was drawn again, the focus goes to that ticket's new button.
3. When that ticket is no longer on the board, the focus goes to the top of its section instead of the page.
4. Nothing else about opening and closing the pane changes.

## Out of scope
- Other panes and dialogs.

## Notes
- From `speck/ideas/2026-10-09-return-focus-after-the-full-ticket-pane-closes.md`. The pane is in `templates/panel.html` (0060).
- Failing before this build: none
- Self-check: focus at the top of a section goes to the Plan or Build section itself rather than its heading, as two tests (0135, panel.test) pin the headings' markup; added a Review pack case to AC4's tests.
- Pictures: none, because nothing looks different: the change only moves the keyboard focus.

## In plain words
When you close a ticket's full view in the panel, with Close, Escape or a click outside it, the keyboard focus now goes back to that ticket's Full ticket button, so you can carry on with the keyboard from where you were. If the board refreshed while it was open, it finds the ticket's button again; if the ticket has left Plan or Build, the focus goes to the top of the section it was in.

To see it, open a ticket in Plan or Build, press Full ticket, press Escape, then press Tab: the focus carries on from that ticket.

Worth knowing: opening the view from a Shipped ticket's title or a Review pack button still leaves the focus on the page when it closes. That's saved as a follow-up idea.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
Follow-ups:
- Return focus to a Shipped title or Review pack button when the pane closes: `speck/ideas/2026-10-19-return-focus-to-a-shipped-title-or-review-pack.md`.
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
    "reviewed_sha": "bd791b9f9321de4bfc2966434171764c315f6972",
    "thread_id": "01a15302-5ae5-7f83-9318-816b482c4f8c",
    "seconds": 24,
    "usage": {
      "input_tokens": 187368,
      "cached_input_tokens": 141568,
      "cache_write_input_tokens": 0,
      "output_tokens": 686,
      "reasoning_output_tokens": 28
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-19T07:14:08.972Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: fullButton records the originating ticket and section; closeFull and returnFocus restore focus after rendering. All six AC1 tests pass, covering Close, Escape and outside clicks in Plan and Build."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html: returnFocus searches the rendered board for the ticket's current button. Both AC2 tests pass and explicitly verify that refresh replaced the original button."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html: returnFocus falls back to the originating section, whose tabindex enables focus; renderFull also handles a ticket disappearing entirely. The four AC3 tests pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Opening still focuses the pane, existing close handlers remain intact, and Shipped links and Review packs clear the return target. Three AC4 tests and existing pane regression tests pass. The recorded run reports 191 passed, zero failed and three skipped."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Closing the full ticket pane returns keyboard focus to the ticket’s current Full ticket button. If the ticket has left the board, focus returns to its Plan or Build section. The tests cover all closing methods, board refreshes and existing pane behaviour. No blocking concerns found."
  }
}
```

</details>
