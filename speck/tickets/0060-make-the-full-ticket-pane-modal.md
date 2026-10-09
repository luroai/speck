---
id: "0060"
title: "Make the full ticket pane modal"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
started: "2026-10-09T19:33:00.080Z"

---
# 0060 · Make the full ticket pane modal

**Status:** 🔍 reviewing

## Problem
While the full ticket pane is open, the page behind it still scrolls, so scrolling past the end of a long ticket moves the panel instead. The only ways to close the pane are its Close button and Escape, so the user has to aim for a small button to get back to the board.

## Outcome
The full ticket pane holds the page still while it's open, and a click anywhere outside it closes it.

## Acceptance criteria
1. While the pane is open, scrolling with the mouse wheel, trackpad, touch or keyboard (for example Page Down or Space) never moves the page behind it, including when the pane is already scrolled to its top or bottom. The pane itself still scrolls when the ticket is longer than the window.
2. When the pane closes, by any means, the page is at the same scroll position as when the pane opened.
3. While the pane is open, a click anywhere outside it closes the pane and does nothing else: it doesn't open or close an item, press a button or follow a link under it. The ticket stays open in the list, as it does when the pane closes with Close.
4. Clicking inside the pane, or selecting text that starts inside it and ends outside it, leaves the pane open.
5. Close, Escape and the 2-second refresh behave as before: the first two close the pane, and the refresh neither closes it nor moves the page.

## Out of scope
- How the pane's text looks (0061).
- The short open view in the Tickets list.
- Ideas and inbox notes, which don't open in the pane.

## Notes
- Changes 0054's rule that clicking "Full ticket" on another ticket replaces the pane's content: with the pane open, that click now only closes it, so switching tickets takes two clicks.
- "Collapse" read as closing the pane, with the ticket left open in the list. To confirm before ready.
- A dimmed backdrop behind the pane is the builder's choice.
- product.md's Shaping description needs updating.
- The panel has no links, so AC3's "follow a link" is covered by the backdrop taking every click outside the pane; the browser test clicks over a ticket row and a toggle button.
- Self-check: no changes

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Inbox: `speck/ideas/2026-10-09-return-focus-after-the-full-ticket-pane-closes.md`: when the pane closes, the focus goes to the page body rather than back to the **Full ticket** button, so a keyboard user starts again from the top.
- Known limit: the scroll lock is tested in headless Chromium only; touch scrolling in iOS Safari, which doesn't always honour `overflow: hidden` on the root, is untested.

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
    "reviewed_sha": "95bd2c8f8728930b73baede71736cfa4b5ceddc8",
    "thread_id": "01a1222b-b836-7701-ac1a-7721192b9f81",
    "seconds": 44,
    "usage": {
      "input_tokens": 307709,
      "cached_input_tokens": 223616,
      "cache_write_input_tokens": 0,
      "output_tokens": 1070,
      "reasoning_output_tokens": 225
    },
    "saved_at": "2026-10-09T19:38:16.807Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "templates/panel.html: fullButton focuses the pane and holdPage sets overflow:hidden, but background controls remain keyboard-focusable. Tabbing past Close can focus a background control and scroll the hidden root to reveal it. The browser test covers scrolling keys but never Tab navigation."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "holdPage records scrollX/scrollY and restores them on closure. The 0060 browser test checks backdrop, Close, Escape and removal during refresh; supplied output reports it passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The fixed backdrop covers background controls and consumes outside clicks. The browser test clicks over a ticket row and the Ideas toggle and verifies neither activates."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The backdrop handler requires the backdrop as click target. The browser test performs an actual selection drag from pane text to outside and verifies the pane remains open."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "closeFull and the Escape handler remain intact; renderFull preserves unchanged pane nodes and holds the page through refresh. The browser test exercises Close, Escape and two refreshes."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Keyboard focus can escape the pane into background buttons. overflow:hidden prevents ordinary scrolling but still allows scrolling caused by focusing off-screen elements, so Tab navigation can move the page behind the open pane. Background buttons can also be activated by keyboard while covered.",
        "suggested_fix": "Make the background inert while the pane is open, or contain focus within the pane and prevent background focus. Add a browser test that repeatedly presses Tab and Shift+Tab while opened at a non-zero page position, checking background controls cannot receive focus or activate and the page stays still.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The claim that keyboard interaction holds the background still needs the focus escape fixed. The remaining changes accurately describe the implementation."
    },
    "escalation_question": "",
    "summary": "Outside clicks, text selection and the usual closing methods are well covered. One keyboard gap remains: Tab can reach buttons behind the pane and move the background page. Fix that before merging. I inspected the code and tests; I did not rerun tests in the read-only environment."
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
    "reviewed_sha": "8e315a402b1066c940b217a9fb97e78fdda10d69",
    "thread_id": "01a1222b-b836-7701-ac1a-7721192b9f81",
    "seconds": 21,
    "usage": {
      "input_tokens": 545273,
      "cached_input_tokens": 424320,
      "cache_write_input_tokens": 0,
      "output_tokens": 1667,
      "reasoning_output_tokens": 225
    },
    "saved_at": "2026-10-09T19:40:58.220Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: holdPage disables root scrolling and makes all background content inert; fullButton focuses the scrollable pane, whose overscroll-behavior prevents chaining. test/panel-0060.test.mjs exercises wheel, touch, scrolling keys, Tab and Shift+Tab in a real browser. Supplied output reports it passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "holdPage saves the opening scroll coordinates and restores them when released. The browser test verifies restoration after backdrop, Close, Escape and automatic closure when the ticket leaves the list."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The fixed backdrop intercepts outside clicks. The browser test clicks over a ticket row and the Ideas toggle, verifying closure without changing background state and leaving the list ticket open."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The backdrop listener closes only for clicks targeting the backdrop itself. The browser test verifies an inside click and a real text-selection drag ending outside both leave the pane open."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "closeFull, the Escape handler and renderFull preserve existing closure and refresh behaviour. Browser tests cover Close, Escape and two refreshes without closure or page movement; supplied output reports all tests passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Keyboard focus previously escaped into background controls, potentially scrolling or activating the page behind the pane.",
        "suggested_fix": "Implemented: holdPage makes the header, offline banner and main inert while open and clears inert on closure. The browser regression test exercises repeated Tab and Shift+Tab navigation and checks focus, scroll position and background state.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The updated description matches the scroll lock, background focus isolation, outside-click closure and preserved refresh behaviour."
    },
    "escalation_question": "",
    "summary": "The keyboard gap is fixed. The pane now holds the background still, blocks interaction behind it and closes safely on outside clicks while preserving the page position. All five criteria have meaningful test coverage, and the supplied run passed all 417 tests. Code inspected; tests were not rerun in the read-only environment."
  }
}
```

</details>
