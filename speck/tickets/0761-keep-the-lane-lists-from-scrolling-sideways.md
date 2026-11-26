---
id: "0761"
title: "Keep the lane lists from scrolling sideways"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-25
started: "2026-11-26T09:32:41.906Z"

---
# 0761 · Keep the lane lists from scrolling sideways

**Status:** 🔍 reviewing

## Problem
On an iPhone in Safari, the Plan list can scroll sideways: its rows slide left under the finger with a horizontal scrollbar, and the swipe no longer changes lane. The lists scroll up and down (`overflow-y: auto`), which lets them scroll sideways too once anything in them is wider, and the panel hands a swipe to the lanes only when it doesn't start in something that scrolls sideways (`scrollsSideways`).

## Outcome
No lane's list ever scrolls sideways, so a sideways swipe on any list always changes lane.

## Acceptance criteria
1. No lane's list (Capture, Plan, Build or Shipped) can be scrolled sideways, by touch, trackpad or script, even when something in it is wider than the list: what sticks out is cut off at the list's edges rather than scrolled to.
2. With an element in the Plan list wider than the list, a sideways swipe that starts on the list changes lane, as it does on a list with nothing wider.
3. Everything that scrolls sideways on purpose inside a list, such as a code block or a table cell in an open ticket, still scrolls sideways, and a swipe that starts on it still scrolls it rather than changing lane.
4. At 375 and 390 px wide, no row in Plan, open or closed, is wider than its list: in an open row's facts, a long value such as the Builder fact's "Claude Code · Opus · medium" wraps inside its cell rather than running past it.
5. No test that passed before this change fails.

## Out of scope
- How a swipe is measured (0517).

## Notes
- Raised by the user on 2026-11-25 with a screenshot of a project's Plan list in Safari on an iPhone: rows scrolled left, a horizontal scrollbar, and swipes not changing lane. In Chromium with touch at 390 px the same list doesn't overflow and a swipe changes lane, and a second screenshot showed the cause: an open Plan row's Builder fact ("Claude Code · Opus · medium", 0662's picker) runs past its cell and the row, as it doesn't wrap.
- `.lane-list` in `templates/panel-cards.css` has `overflow-y: auto`, so its `overflow-x` computes to `auto`; `scrollsSideways` in `templates/panel-header.js` then keeps the touch for the list.
- Checked 2026-11-26: Safari's behaviour can't be checked here: Playwright's WebKit is downloaded but won't start, as the system libraries it needs (GTK 4, GStreamer and others) are missing, so no WebKit browser is available on this machine; check in Chromium with touch, and by forcing an over-wide element in a test.
- Failing before this build: none
- Self-check: no changes. The script guard is needed as well as the style: with overflow-x hidden alone, a script can still scroll a list sideways (AC1's test fails without it).

## In plain words
On a phone, the Plan, Build, Shipped and Capture lists now only scroll up and down. Before, an open Plan ticket's Builder fact (such as "Claude Code · Opus · medium") could run past the edge of the card, which let the whole list slide sideways under your finger and stopped a swipe from changing lane. Now that fact wraps onto a second line inside its box, anything else too wide for a list is cut off at its edge, and a sideways swipe on a list always changes lane. Code blocks inside an open ticket still scroll sideways on their own.

To see it, open the panel on a phone, open a draft in Plan whose builder is set, and swipe sideways on it: the lane changes rather than the list sliding.

Worth keeping an eye on: this was checked in Chrome with touch, not in Safari itself, as Safari's engine can't run on this machine. If anything wider than a list is added later, it will now be cut off at the edge rather than reachable by scrolling.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - Inbox: speck/ideas/2026-11-26-steady-the-0067-ac4-second-restart-error-test.md, as "0067 AC4: new code that fails to start…" failed once in the related-tests run and passed on rerun unchanged.
  - Safari itself is unchecked: no WebKit browser can start on this machine (Playwright's WebKit lacks its system libraries).

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
    "reviewed_sha": "a6fba226bca98588748ff0d64c1228756824ff33",
    "session": "fresh",
    "thread_id": "01a21742-a5bc-7c00-8402-b5227b3aeb1b",
    "builder_response": "- Tests run: test/panel-0761.test.mjs test/panel-0067.test.mjs (the first run was `speck test --related test/panel-0761.test.mjs`, which ran 4408 tests with one failure, `0067 AC4: new code that fails to start…`, a 5 s wait for the panel's restart error under the load of that 7-minute run; it passes in the run above, unchanged, and this change touches only the panel's page styles and header script).\n- Round 1. What changed:\n  - `templates/panel-cards.css`: `.lane-list { overflow-x: hidden; }`, so a list scrolls only up and down and what's wider is cut off at its edges, and `scrollsSideways` no longer keeps a touch or wheel that starts on the list (it matches only `auto|scroll`). A Builder fact's `.value.pick` (the one holding `.set-builder`) now wraps (`white-space: normal; overflow-wrap: anywhere`) rather than running past its cell, which was the cause the user's screenshot showed.\n  - `templates/panel-header.js`: a scroll listener on each `.lane-list` that sets `scrollLeft` back to 0, as `overflow-x: hidden` still lets a script scroll it (AC1 \"by script\"; the AC1 test fails without it).\n- The tests are in a real headless Chromium with touch emulation (Input.dispatchTouchEvent) at 375 and 390 px, as the criteria are about layout and native scrolling, which the fake page can't show. They share one page and one panel to keep the file at about 5 s. No WebKit browser can start on this machine (see the ticket's Notes), so Safari itself isn't checked.\n- AC5: no test; the whole suite runs at ship.\n- Pictures: the open Plan row with the wrapped Builder fact at 390 px, light and dark.\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 93566,
      "cached_input_tokens": 57600,
      "cache_write_input_tokens": 0,
      "output_tokens": 714,
      "reasoning_output_tokens": 64
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 35966,
      "cached": 57600,
      "write": 0,
      "output": 714
    },
    "cost_usd": 0.084832,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-26T09:49:55.126Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panel-cards.css clips horizontal overflow on .lane-list; panel-header.js resets horizontal scroll offsets. Passing 0761 AC1 exercises all four lists with forced overflow using script, wheel and touch."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing 0761 AC2 uses real touch events to change lanes from Plan with and without forced overflow. scrollsSideways excludes the list's hidden overflow."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0761 AC3 verifies that a wide code block scrolls by script and touch while Plan remains selected. The list listener affects only the list's own offset; scrollsSideways still recognises nested scrollers."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "panel-cards.css allows Builder values to wrap within their cells. Both passing 0761 AC4 tests measure closed and open Plan rows and the long Builder value at 375 and 390 px."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Recorded test output confirms 160 passes, zero failures and three skips. The previously failing 0067 test passed unchanged on rerun. The committed change is confined to the ticket, panel styles, header script and new tests; whole-suite validation remains the ship gate."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The lists now clip wide content, sideways swipes change lane, and long Builder values wrap. Intentional scrolling inside code blocks still works. Browser tests pass at both phone widths. Safari itself remains unverified because WebKit cannot start on this machine."
  }
}
```

</details>
