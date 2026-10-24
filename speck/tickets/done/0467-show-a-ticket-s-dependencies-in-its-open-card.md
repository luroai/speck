---
id: "0467"
title: "Show a ticket's dependencies in its open card"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0466"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T12:39:41.469Z"
approved: "2026-10-24T13:04:15.706Z"
finished: "2026-10-24T13:06:56.944Z"

---
# 0467 · Show a ticket's dependencies in its open card

**Status:** ✅ done

## Problem
An open ticket lists the tickets it waits on, or unlocks, as ids in a line of text. A ticket that waits on many, such as a release ticket waiting on 27, runs to three lines or more on a phone, mostly ids that have already shipped, and you can't see how far along they are.

## Outcome
An open ticket shows its dependencies in a small, even box under its facts table, drawn by their shape, so even a release ticket's are easy to read.

## Acceptance criteria
1. An open ticket whose `after` names two or more tickets shows, under its table, a `Waits on` box: a header counting them as `<n> shipped · <n> building · <n> queued` (leaving out a count of 0), a bar with one equal segment per ticket (green shipped, blue building, grey the rest), and a grid of id chips six to a row for each ticket that hasn't shipped, in id order, followed by one `+<n> shipped` chip two columns wide when any have shipped. Pressing that chip shows the shipped tickets' chips too, and pressing it again hides them.
2. An open ticket whose `after` names one ticket, or that one or more tickets name in theirs, shows a `Chain` box instead: one row of five equal slots, a circle over an id in each. They hold up to two tickets before it (the ticket it waits on, then the one that ticket waits on, when that ticket waits on only one), itself, filled in, and up to two after it (a ticket waiting on it, the lowest id first, then one waiting on that). When more lie beyond either end, that end's last slot shows `+<n>`, counting them. A shipped ticket's circle is green with a tick, one building is blue, and the rest are grey. Its header says `<n> before · <n> after`. A ticket with neither shows no box.
3. Pressing a chip or a circle goes to that ticket, as an id link does today, opening its tab. Every chip and circle keeps to its slot with its id on one line at every width from 320 px, checked in a real browser with 27 tickets in `after`.
4. The full ticket shows the same box under its table (0465). The line of ids after `after`, `unlocks` or `waiting on` is gone from open cards. No test that passed before this change fails.

## Out of scope
- Closed cards, which 0468 marks with a chip.
- Shipped tickets.

## Notes
- Asked for by the user on 2026-10-24, choosing option E in the mock-ups (https://claude.ai/artifact/BANvGzKKYy1p4AjBipypTb): the dependency chain on an expanded ticket, laid out so that one with as many as the 0.15.0 release ticket (0452) still looks good.
- Statuses: shipped is `done`; building is `building`, `reviewing`, `blocked` or `approved`; queued is the rest.
- Today: `ticketHead` and `queuedLine` in `templates/panel.js` draw the ids with `idLinks` and `noteIds`; `goTo` goes to a ticket (0154).
- Waits for 0466, the last ticket before it that changes `templates/panel.js` and `templates/panel.css`, and so 0463 and 0465, which this builds on.
- Failing before this build: none
- Self-check: in the full ticket, which covers the page, a chip or circle now shows its ticket in the pane rather than lighting a card hidden behind it; a loop through after: stops rather than going round; repeated ids in after: count once.

## In plain words
An open ticket now shows what it depends on in a small box under its facts table, instead of a line of ticket numbers. A ticket waiting on several others gets a "Waits on" box: a count of how many have shipped, are being built or are queued, a coloured bar, and a grid of the ones still to ship, with a button to show the shipped ones too. A ticket in a simple chain gets a "Chain" box: a row of five circles showing up to two tickets before it, itself and up to two after it, with "+n" when the chain goes further. Pressing a number takes you to that ticket. To see it, open a draft or queued ticket that has an `after:` list, or the full view of one. Worth a look: on a Plan card the box sits just under the line that divides the facts from the details, so there's a little more space above it than on a Build card.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 571,139
- Elapsed since build started: 25 min
- Changed lines: 172 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (Delivery log only, none went to the inbox):
  - On a Plan card the box is the first thing in the card's details, under their dividing line, because 0463's tests fix what the card's top row and second child are. A Build card has it straight under its top row. Moving it up on Plan would mean changing those tests.
  - Which ids have their shipped tickets shown is never cleared once a ticket leaves the board (a tidy-up).
  - A circle for "+n" is filled with the panel colour, a touch lighter than a raised card behind it in the light look.

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
    "reviewed_sha": "52a8a8a40470716d5ddf7e399034f82848e72a9f",
    "session": "fresh",
    "thread_id": "01a16dfd-d30d-78d3-9cce-623785427ede",
    "builder_response": "- Tests run: test/panel-0467.test.mjs, plus (with --related) test/panel-0417.test.mjs test/panel-0419.test.mjs test/panel-0434.test.mjs test/panel-0461.test.mjs test/panel-0462.test.mjs test/panel-0463.test.mjs test/panel-0464.test.mjs test/panel-0465.test.mjs test/panel-0466.test.mjs test/panel-0154.test.mjs test/panel-0164.test.mjs and every test file naming a changed file (0178, 0187, 0188, 0208, 0246, 0281, 0411, 0416, 0430, 0431, 0433, 0444, 0459, ship-0204), as these open cards, the full pane, tap sizes and id links.\n- Notes for the reviewer:\n  - Where the box sits: an existing 0463 test asserts an open card's top row is exactly title, track, table, and that a Plan card's second child is its detail. To keep AC4 (no passing test fails) without changing them, the box is first in a Plan card's detail, and straight after the top row in a Build card. Both put it right under the table. In the full ticket it is the third child of the steps block (0465).\n  - In the full ticket, which covers the page, a chip or circle shows its ticket in the pane rather than lighting a card hidden behind it.\n  - The panel's board cut-down shipped tickets now keep `after:`, so a chain can walk back through old shipped tickets.\n  - The browser test allows a button to reach under 1 px into the 4 px gap: Chrome draws buttons whole pixels wide (measured: 51 px in a 50.33 px column), while plain spans fit exactly.\n",
    "seconds": 33,
    "usage": {
      "input_tokens": 223523,
      "cached_input_tokens": 169728,
      "cache_write_input_tokens": 0,
      "output_tokens": 999,
      "reasoning_output_tokens": 92
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T12:59:06.143Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-model.js depsOf and templates/panel.js depsBox implement the counts, status bar, sorted chips and shipped toggle. Both AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "depsOf builds five chain slots, follows the lowest downstream id and counts hidden tickets. Both AC2 tests passed, covering colours, ticks, branching, empty slots and cycles."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "depNode uses goTo for cards and openFull for the full pane. Navigation tests passed. The real-browser test passed at 320, 390, 768 and 1280 px with 27 dependencies, checking slot boundaries and uncut, single-line ids."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "ticketDetail, queueItem and paneSteps place the box beneath the facts table. The AC4 test verifies matching full-ticket boxes and removal of open-card id lines. Verified test output reports 306 passes, zero failures and three skips."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Open tickets now show compact dependency boxes with progress colours, expandable shipped tickets and links to related tickets. The full ticket shows the same information. The tests cover the requested behaviour and phone-width layout; no blocking issues were found."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "ac5ba914d2420894dcaba7cd68c5d3365dcbc446",
    "merge": true,
    "session": "continued",
    "thread_id": "01a16dfd-d30d-78d3-9cce-623785427ede",
    "builder_response": "- Tests run: test/panel-0161.test.mjs test/panel-0167.test.mjs test/panel-0467.test.mjs test/panel-0417.test.mjs test/panel-0463.test.mjs test/panel-0465.test.mjs, with --related (every test file naming a changed file).\n- Ship ran the whole suite on the ticket merged with main (main had nothing new: the merge was already up to date) and three stylesheet checks failed:\n  - 0161 AC1 (contrast): `.deps .slot .dot` set `color: var(--panel)` on a `--line` fill, 3.29:1. The circles hold no text (the tick is a border on `::after`), so the colour is gone.\n  - 0161 AC1 (fills): `.deps-bar i` and the circles filled with non-surface colours. The bar's segments are now a 4 px `border-top`, as the step track's bars are, and each circle is a 10 px border all round on `--panel` (a surface), so the line behind it still doesn't show through.\n  - 0167 AC2: the ticket's own circle used `--accent`, the speck red, kept for the speck itself. It now uses `--text`: filled, dark in the light look and light in the dark one.\n- No test was changed to get past these; the 0467 test's two CSS assertions follow the new border declarations. Pictures retaken in both looks.\n",
    "seconds": 13,
    "usage": {
      "input_tokens": 345154,
      "cached_input_tokens": 282368,
      "cache_write_input_tokens": 0,
      "output_tokens": 1463,
      "reasoning_output_tokens": 105
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T13:04:13.285Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "depsOf and depsBox retain the counts, equal status segments, sorted chips and shipped toggle. Both AC1 tests passed; panel.css preserves segment colours using borders."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The chain model and five-slot rendering remain unchanged. Both AC2 tests passed. panel.css retains green shipped circles with ticks, blue building circles and a filled current-ticket circle."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Card and full-pane navigation tests passed. The real-browser test with 27 dependencies passed at widths from 320 px, checking slot boundaries and single-line, uncut ids."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The AC4 test passed for matching full-ticket boxes and removal of open-card id lines. The previously failing 0161 and 0167 stylesheet checks now pass. Verified output reports 261 passes, zero failures and three skips."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The dependency boxes still meet all four criteria. The stylesheet changes fix the failures found during shipping while preserving the requested colours, ticks and layout. No blocking issues remain."
  }
}
```

</details>
