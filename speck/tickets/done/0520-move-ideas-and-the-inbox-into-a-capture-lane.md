---
id: "0520"
title: Give ideas their own Capture lane                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0519"]                # ticket ids that must be done first
created: 2026-10-26
started: "2026-10-26T22:18:48.074Z"
approved: "2026-10-26T22:37:43.995Z"
finished: "2026-10-26T22:41:46.938Z"

---
# 0520 · Give ideas their own Capture lane

**Status:** ✅ done

## Problem
Plan's Tickets, Ideas and Inbox buttons take a whole row at the top of the lane, on a phone where space is short, and show only one of the three lists at a time. Ideas and inbox notes are the roughest stage of the work, and they belong in a lane of their own, to the left of Plan.

## Outcome
The panel has a Capture lane, left of Plan, holding every idea and inbox note, and Plan holds only tickets.

## Acceptance criteria
1. The lanes are Capture, Plan, Build and Shipped, in that order, in the strip and as cards. The panel still opens on Build, and swiping, a sideways trackpad scroll, the arrow keys and the strip move between all four as they do between three today.
2. Capture lists every idea note and inbox note (those whose status is `idea` or `inbox`) in one list, newest captured first, each as a closed card like today's idea cards that opens to the note's whole text. Notes with any other status, such as `ticketed (…)` or `dropped`, aren't listed. With none, the lane says "Nothing captured."
3. Capture changes nothing: it has no buttons, menus or fields, and nothing in it writes to a note or a ticket. Opening and closing a note to read it is all it does.
4. Plan lists only draft tickets, with no Tickets, Ideas or Inbox buttons, and its list starts straight under its title. The brief describes the Capture lane and Plan holding only tickets.
5. No test that passed before this change fails, apart from tests of Plan's Tickets, Ideas and Inbox buttons, which change to check Capture.

## Out of scope
- Labelling ideas an agent raised (0521).
- Any way to ticket, drop or edit a note from the panel: see Notes.
- Card heights (0519).

## Notes
- Asked for and named 2026-10-26: Capture → Plan → Build → Shipped, "clarity is almost less on the left, and it gets sharper as it moves right. A list of ideas that either make it through or get culled."
- Hard rule from the user, 2026-10-26: what's in Capture is managed only in chat ("like having a meeting with my team"), never from the panel. Criterion 3 keeps it so.
- Order decided by the user: newest first, by the `Captured:` date (an idea's status is read from that line, never its body).
- Today: Plan's buttons are `shapingToggle` and `shapingView` in `templates/panel.js`, with `ideaItem`, `inboxItem` and `noteItem`; the lanes are `LANES` and `TAB_ORDER` in `templates/panel-header.js` (0476, 0477); the page is `templates/panel.html`.
- After 0519, which also changes Plan's closed cards in `templates/panel.js` and `templates/panel-cards.css`.
- Failing before this build: none
- Self-check: an impossible Captured date (such as 2026-02-30 or 2026-13-01) now sorts with the undated notes, as its card says "No capture date"; tests of three lanes and of Plan's Tickets, Ideas and Inbox buttons changed to four lanes and Capture (AC1, AC5).
## In plain words
The panel now has four lanes: Capture, Plan, Build and Shipped. Capture is new, on the far left, and lists every idea and inbox note together, newest first. Tap a note to read it in full and tap again to close it. Capture has no buttons: notes are still changed only by talking to your agent. Plan has lost its Tickets, Ideas and Inbox buttons, so its draft tickets now start straight under its title.

To see it, open the panel and swipe right from Plan, or tap Capture in the strip. The panel still opens on Build. A note whose Captured date is missing or impossible goes at the bottom of Capture.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 373,645
- Elapsed since build started: 19 min
- Changed lines: 99 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none sent to the inbox. Noticed while moving the tests over: while a draft's priority menu is open, tapping a lane's name only closes the menu, so it takes a second tap to change lane. 0077 chose that on purpose (a click outside the menu only closes it), so it isn't a new idea.

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
    "reviewed_sha": "08139fcc1596a7c33657faeaebad00ab59e57607",
    "session": "fresh",
    "thread_id": "01a17a5c-23dd-7652-91de-cc3f7cedee4d",
    "builder_response": "- Tests run: speck test --related with the ticket's own test file test/panel-0520.test.mjs and every existing test file it changed (test/panel-0038.test.mjs test/panel-0039.test.mjs test/panel-0040.test.mjs test/panel-0041.test.mjs test/panel-0054.test.mjs test/panel-0056.test.mjs test/panel-0067.test.mjs test/panel-0134.test.mjs test/panel-0135.test.mjs test/panel-0140.test.mjs test/panel-0142.test.mjs test/panel-0151.test.mjs test/panel-0154.test.mjs test/panel-0158.test.mjs test/panel-0161.test.mjs test/panel-0167.test.mjs test/panel-0214.test.mjs test/panel-0410.test.mjs test/panel-0417.test.mjs test/panel-0418.test.mjs test/panel-0425.test.mjs test/panel-0427.test.mjs test/panel-0428.test.mjs test/panel-0435.test.mjs test/panel-0450.test.mjs test/panel-0469.test.mjs test/panel-0472.test.mjs test/panel-0476.test.mjs test/panel-0477.test.mjs test/panel-0478.test.mjs test/panel-0517.test.mjs test/panel.test.mjs ), plus every test file --related brought in for the changed templates and docs: 3147 tests, 0 failing, 3 skipped.\n- AC5 note: besides the tests of Plan's Tickets, Ideas and Inbox buttons, tests that asserted exactly three lanes (Plan, Build, Shipped), the arrow keys going round from Plan, Build at index 1, or three sliding cards changed to four lanes with Capture first, as AC1 requires. Fixtures whose ideas had a blank or other status (such as 'new' or 'parked') were changed to status 'idea' where the test was about an idea card, since AC2 lists only idea and inbox notes. The .toggle/.toggles CSS rules and the empty toggle row were removed with the buttons, so tests of their colours, sizes and borders were removed or now check that no such rule is left.\n- Pictures: Capture closed, Capture with a note open and Plan, in light and dark looks, at 390 px.\n",
    "seconds": 27,
    "usage": {
      "input_tokens": 372952,
      "cached_input_tokens": 273408,
      "cache_write_input_tokens": 0,
      "output_tokens": 693,
      "reasoning_output_tokens": 30
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-26T22:37:27.660Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-header.js LANES, TAB_ORDER and openLane establish four lanes with Build initially open. Passing panel-0520 AC1 tests exercise strip, arrows, trackpad and swipes; updated panel-0476 tests cover browser gestures."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel-model.js panelModel filters Capture to idea/inbox and sorts using capturedAt. templates/panel.js captureItem and noteItem render closed, expandable notes. Passing panel-0520 AC2 tests cover ordering, invalid dates, exclusions, full text and the empty state."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.js noteItem only toggles local openNotes state. Passing panel-0520 AC3 checks opened cards for controls and verifies reading sends no writes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html places Plan's list directly after its title; render uses m.drafts only. Passing panel-0520 AC4 tests cover this structure and the brief's Capture reference. docs/brief.md describes Capture as read-only notes and Plan as only draft tickets."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "/tmp/speck-0520-tests.txt confirms 3,144 passed, zero failed and three skipped. Existing test changes adapt removed toggles, four-lane navigation and eligible note fixtures while retaining relevant behaviour checks."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Capture now holds ideas and inbox notes, newest first, with cards that open for reading. Plan holds only draft tickets. Four-lane navigation is covered by passing tests, and I found no blocking correctness, safety or scope issues."
  }
}
```

</details>
