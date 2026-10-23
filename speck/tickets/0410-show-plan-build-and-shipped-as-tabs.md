---
id: "0410"
title: "Show Plan, Build and Shipped as tabs"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []               # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T13:30:04.514Z"
approved: "2026-10-23T13:55:45.094Z"

---
# 0410 · Show Plan, Build and Shipped as tabs

**Status:** 👍 approved

## Problem
The panel stacks Plan and Build side by side with Shipped under them, so the page scrolls as a whole and a long list in one lane pushes the others out of view. On a narrow pane you scroll past one lane to reach the next.

## Outcome
Plan, Build and Shipped are three tabs under the header. One lane shows at a time, and only its tickets scroll.

## Acceptance criteria
1. Under the header are three tabs, Plan, Build and Shipped, and only the open tab's lane shows. Build and Shipped each show the count their section headings show today; Plan shows none, as its Tickets, Ideas and Inbox toggle keeps its own counts. Build is open when the panel loads. The tabs are reached with Tab, and Enter, Space or the left and right arrow keys open another tab.
2. At any window width, the header and the tab row stay where they are while the open lane's list scrolls, and the page itself doesn't scroll.
3. The open tab, and the scroll position of each lane's list, stay as they were through the 2-second refresh.
4. While Plan or Shipped is open and the Foreman's status reads `Needs you <n>`, the Build tab shows `<n> needs you`. With any other Foreman status, it shows nothing extra.
5. Pressing a "Go to ticket" button opens the tab whose lane holds that ticket, then scrolls to it and lights it as today. Closing the full-ticket pane opens the tab holding the element the focus goes back to, as chosen today, before focusing it.

## Out of scope
- Showing more shipped tickets (0411).
- The console at the top of the panel, and the new ticket tiles, from the design in https://claude.ai/artifact/R5CQDZJfMZ2rYcTmZK1B8z (console.html).
- Remembering the open tab across a reload: Build opens each time.
- Plan's own Tickets / Ideas / Inbox toggle, which stays inside the Plan tab as it is.

## Notes
- Replaces the decision behind cancelled 0064, 0065 and 0066 ("keeping the current panel layout"): the user asked for tabs on 2026-10-23.
- Design reference: the tab row in console.html in the artifact above.
- Changes `templates/panel.html`: the `<main>` grid of `#shaping-section`, `#build-section` and `section.shipped`, `goTo` and `returnFocus`.
- Tests written for the old layout, which expect all three sections on screen at once, change with it.
- Failing before this build: none
- Self-check: the tab row is now inert with the rest of the page while a pane covers it, so Tab can't reach it; an arrow key with Alt, Ctrl or Cmd held is left to the browser (Alt+Left goes back).

## In plain words
The panel now has three tabs under its header: Plan, Build and Shipped. Only one shows at a time, and Build opens first. The page itself no longer scrolls: the header and tabs stay put, and only the open tab's list moves. Build and Shipped show their counts in the tab, and while you're on Plan or Shipped, Build says how many things need you when the Foreman does.

To see it, open the panel and switch tabs by clicking, or with the left and right arrow keys once a tab has the focus. Tapping a ticket's id in a "waiting on" note jumps to the tab holding that ticket. Each list keeps its place when you switch away and back.

Worth a look: on a phone, a tab's count sits under its name, so the tab row is two lines high.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Switching tabs through Go to ticket or returning focus can leave the Build tab's needs indicator incorrect until the next refresh.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 590,841
- Elapsed since build started: 26 min
- Changed lines: 105 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (tidy-ups and known limits, no inbox notes):
- The `.sh h2` style rule in the panel is unused now that the lane headings are the tabs' names; it could go.
- The speck run error line (`.run-error`) isn't made inert with the rest of the page while a pane is open. That was already so before this ticket.
- 23 older test files changed with the layout, mostly to open the lane they look at (`openLane` in `test/support/panel.mjs`).

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
    "reviewed_sha": "7f5a0d1be87f3551c5ba1137276c37a77ed533f6",
    "session": "fresh",
    "thread_id": "01a16909-937f-78b2-878c-e9fbbe5c2b42",
    "builder_response": "- Tests run: test/panel-0039.test.mjs test/panel-0040.test.mjs test/panel-0041.test.mjs test/panel-0050.test.mjs test/panel-0060.test.mjs test/panel-0134.test.mjs test/panel-0135.test.mjs test/panel-0137.test.mjs test/panel-0140.test.mjs test/panel-0141.test.mjs test/panel-0142.test.mjs test/panel-0151.test.mjs test/panel-0154.test.mjs test/panel-0157.test.mjs test/panel-0158.test.mjs test/panel-0160.test.mjs test/panel-0161.test.mjs test/panel-0162.test.mjs test/panel-0164.test.mjs test/panel-0165.test.mjs test/panel-0169.test.mjs test/panel-0214.test.mjs test/panel-0410.test.mjs test/panel.test.mjs \n- The ticket's own tests are in test/panel-0410.test.mjs. The other files are older tests written for the layout with all three lanes on screen at once, changed to open the lane they look at (a new openLane helper in test/support/panel.mjs), or to scroll the open lane's list where they scrolled the page, as the ticket's Notes expect. Notable ones: 0060's last step now expects Plan's list at its top after the tall ticket it was scrolled into leaves; 0162 AC2 now checks the empty Build lane says \"Nothing in flight or ready.\" (its heading is the tab now); 0140 and 0161 check each lane in turn; 0169 scrolls the badges into view, as a badge off screen stands still.\n- Beyond these files I also ran every other panel test file (browser and fake page) once while building, to find the older tests the layout affects; all passed after the changes above.\n- Pictures of each tab in the light and dark looks, and on a phone, are kept with the ticket.\n",
    "seconds": 43,
    "usage": {
      "input_tokens": 228162,
      "cached_input_tokens": 179456,
      "cache_write_input_tokens": 0,
      "output_tokens": 1174,
      "reasoning_output_tokens": 189
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T13:54:00.666Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html defines three button tabs, defaults to Build, preserves the existing counts and handles arrow keys. Passing 0410 AC1 tests cover selection, counts, native keyboard controls and arrow navigation."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The viewport flex layout and .lane-list overflow rules constrain scrolling to the lane. The passing 0410 AC2 browser test checks all three lanes at widths from 320 to 1280 px."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "openTab preserves each closed lane's scroll position without resetting openLane during refresh. Passing 0410 AC3 fake-page and browser tests cover refreshes and reopening lanes."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "The needs indicator updates only in render(), whereas goTo() switches lanes through openTab() without rendering. Independently reproduced: with Foreman 'Needs you 2', going from Build to a Plan ticket opens Plan but leaves build-needs empty until the next refresh."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "goTo() and returnFocus() open the destination lane before scrolling or focusing. Passing 0410 AC5 tests check navigation, highlighting, moved tickets and section fallback."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Switching tabs through Go to ticket or returning focus can leave the Build tab's needs indicator incorrect until the next refresh. openTab() updates visibility but not the indicator; returnFocus() also runs after render() has calculated it.",
        "suggested_fix": "Update the needs indicator whenever openTab() changes the lane, using the current Foreman state. Add a test that navigates from Build to Plan through Go to ticket while the Foreman reads 'Needs you 2' and checks the indicator immediately.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The tabs, scrolling and focus navigation work, and the reported tests passed. One interaction needs fixing: following a ticket into another tab can temporarily hide the notice that Build needs your attention."
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
    "reviewed_sha": "156e82065556aae500826210764519f125e66b8f",
    "session": "continued",
    "thread_id": "01a16909-937f-78b2-878c-e9fbbe5c2b42",
    "builder_response": "- Tests run: test/panel-0039.test.mjs test/panel-0040.test.mjs test/panel-0041.test.mjs test/panel-0050.test.mjs test/panel-0060.test.mjs test/panel-0134.test.mjs test/panel-0135.test.mjs test/panel-0137.test.mjs test/panel-0140.test.mjs test/panel-0141.test.mjs test/panel-0142.test.mjs test/panel-0151.test.mjs test/panel-0154.test.mjs test/panel-0157.test.mjs test/panel-0158.test.mjs test/panel-0160.test.mjs test/panel-0161.test.mjs test/panel-0162.test.mjs test/panel-0164.test.mjs test/panel-0165.test.mjs test/panel-0169.test.mjs test/panel-0214.test.mjs test/panel-0410.test.mjs test/panel.test.mjs \n- F1: fixed. Build's \"<n> needs you\" is now worked out in drawTabs() (templates/panel.html), from the Foreman's status in the current state, so every lane change through openTab() (a tab, an arrow key, Go to ticket or the focus going back) updates it straight away; render() calls drawTabs() in its place. The first drawTabs() call now comes after `let state`. New test \"0410 AC4 (review F1)\" goes to a Plan ticket with the Foreman reading \"Needs you 2\" and checks the indicator before any refresh, back to Build, then closes a full ticket whose focus goes back to Plan and checks it again.\n",
    "seconds": 19,
    "usage": {
      "input_tokens": 359725,
      "cached_input_tokens": 304896,
      "cache_write_input_tokens": 0,
      "output_tokens": 1780,
      "reasoning_output_tokens": 189
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T13:55:34.096Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html defines three button tabs, defaults to Build, preserves counts and handles arrow navigation. Passing 0410 AC1 tests cover selection, counts and keyboard controls."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The viewport flex layout and .lane-list overflow constrain scrolling to the open list. The passing 0410 AC2 browser test checks all lanes at widths from 320 to 1280 px."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "openTab() preserves lane scroll positions and refreshes retain openLane. Passing 0410 AC3 tests cover refreshes, reopening lanes and browser scroll preservation."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "drawTabs() now updates the needs indicator from current state on every lane change and refresh. Passing AC4 tests cover statuses, counts and immediate updates through ticket navigation and returning focus."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "goTo() and returnFocus() open the destination lane before scrolling or focusing. Passing 0410 AC5 tests cover highlighting, moved tickets and section fallback."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Ticket navigation and returning focus previously left Build's needs indicator stale until refresh.",
        "suggested_fix": "Implemented: drawTabs() updates the indicator whenever the lane changes; the new AC4 regression test covers both affected paths.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Plan, Build and Shipped now work as tabs, with scrolling confined to each lane and positions preserved through refreshes. The attention notice now updates immediately during ticket navigation. All criteria pass; the reported run has 407 passing tests, three skipped and no failures."
  }
}
```

</details>
