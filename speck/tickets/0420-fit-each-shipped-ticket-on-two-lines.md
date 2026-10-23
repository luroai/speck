---
id: "0420"
title: "Fit each shipped ticket on two lines"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0419"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T17:34:40.875Z"

---
# 0420 · Fit each shipped ticket on two lines

**Status:** 🔍 reviewing

## Problem
A shipped ticket takes five rows: its title, its bug tag, when it shipped, its figures, then a Details button. Above the list, three stat tiles and a More stats button take another 150 px. With ten shipped tickets (0411), Shipped is mostly empty space.

## Outcome
Each shipped ticket is two lines, and the stats above the list are one line.

## Acceptance criteria
1. Each shipped ticket shows its id and title, with its bug or fix tag after the title, then one line in smaller type: when it shipped, then its figures as the figures line shows them today (minutes, rounds and cost), separated by ` · `.
2. A small Details button at the end of the second line opens and closes the ticket's details as the Details button does today, and the title still opens the full ticket.
3. The stats above the list are one line, such as `24 shipped today · median 10 min · $1.77 median builder cost`, followed by More stats, which opens the other figures as today.
4. A ship that didn't push still shows its warning under its ticket, as today.
5. At 420 px wide, with a mouse as the main pointer, a shipped ticket whose title fits on one line is no more than 56 px tall.

## Out of scope
- How many shipped tickets show (0411).

## Notes
- Asked for by the user on 2026-10-23: the panel is used mostly in a thin side pane, and its tickets are too tall there.
- Today's layout is 0157 and 0162 (`#shipped` in `templates/panel.html`).
- Waits for 0419: both change `templates/panel.html`.
- Failing before this build: none
- Stats line wording: the example in AC3 ("24 shipped today · median 10 min · $1.77 median builder cost") measures about 406 px of 12 px text, and only about 300 px is free beside More stats in a 420 px pane. The line is `24 today · median 10 min, $1.77`, the same three figures, with each one's tooltip saying what it is ("Tickets shipped today", "Median builder cost, over 2 tickets"). "Shipped today" was cut to "today" as it didn't fit beside Fewer stats, which More stats becomes when pressed, with real figures such as 34 tickets.
- Ship time in a card's line: the time alone today, as before, but the day alone ("20 Oct") for an earlier day, without "Shipped" or the time, so a line with every figure fits beside Details at 420 px with a scroll bar. The line's tooltip gives "Shipped 20 Oct, 17:42 · …". On a phone (375 px), a line that still doesn't fit wraps between its parts rather than being cut off (0157 AC5).
- Older tests changed to the new layout: 0035 (panel.test.mjs), 0050, 0058, 0120, 0157, 0161 (the shipped tag is a small box in the title's line, exempted as 0419's in-line tags are) and 0162.
- Self-check: no changes

## In plain words
In the Shipped tab, each ticket is now two lines: its number, title and any bug or fix tag, then a smaller line with when it shipped, how long it took, its review rounds and its cost, ending in a small Details button. Above the list, the stats are one line, such as "34 today · median 10 min, $1.85", with More stats at its end, which still opens the other three figures.

To see it, open the panel in a narrow window and go to Shipped. A ticket shipped today shows its time; one from an earlier day shows just the day, such as "20 Oct". Hover over that line for the full time, and over a stat to see what it means.

Worth a look: the stats line is shorter than the wording in the ticket, because that wording didn't fit a narrow pane. On a phone, a line that doesn't fit now wraps onto a second line rather than being cut off.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none.

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
    "reviewed_sha": "0e169750d53da9abc147352444bae7ee4f6ff88d",
    "session": "fresh",
    "thread_id": "01a169eb-5d94-7c31-96c0-5c36d2ca03b2",
    "builder_response": "- Tests run: test/panel-0420.test.mjs test/panel.test.mjs test/panel-0050.test.mjs test/panel-0058.test.mjs test/spend-0120.test.mjs test/panel-0157.test.mjs test/panel-0161.test.mjs test/panel-0162.test.mjs (and the commands.checks files, which speck test --files adds)\n- Round 1. Deliberate choices, also in the ticket's Notes:\n  - AC3's example wording (\"24 shipped today · median 10 min · $1.77 median builder cost\") is about 406 px of 12 px text; beside More stats in a 420 px pane there's about 300 px. The line is \"24 today · median 10 min, $1.77\": the same three figures, each with a tooltip saying what it is. The browser test checks it stays one line with More stats and with Fewer stats, with room for three more digits.\n  - A card's time: today the time alone, as before; an earlier day shows the day alone (\"20 Oct\"), with \"Shipped 20 Oct, 17:42 · <figures>\" as the line's tooltip, so the line fits beside Details at 420 px with the lane's scroll bar.\n  - On a phone (375 px), a line that still doesn't fit wraps between its parts rather than being cut, so 0157 AC5 (nothing cut off) still holds.\n  - The shipped bug/fix tag is a small box in the title's line (12 px, 16 px tall), exempted in 0161's one-rule check as 0419's in-line tags are. Text stays at 12 px or more (0161), and touch-screen sizes (0140, 0417) are unchanged.\n- Older tests changed to the new layout: 0035 (panel.test.mjs), 0050, 0058, 0120, 0157, 0161, 0162. Each change keeps what the test checked and moves it to where the element now sits; none was deleted.\n",
    "seconds": 30,
    "usage": {
      "input_tokens": 188804,
      "cached_input_tokens": 134784,
      "cache_write_input_tokens": 0,
      "output_tokens": 801,
      "reasoning_output_tokens": 41
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T18:00:24.584Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html render() places tags after the title and combines ship time and existing figures using detailsLine(). Passing 0420 AC1 tests cover tags, missing figures and midnight updates; the browser test checks smaller type and line fit."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing 0420 AC2 test exercises Details opening and closing and the title opening the full ticket. The passing browser test verifies Details sits at the end of the second line."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "render() builds the compact stats line with explanatory tooltips and retains the other three figures under More stats. Passing 0420 AC3 tests cover values, missing data and expansion; the browser test verifies one line at 420 px with both button labels."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "render() retains the unpushed warning after the summary line. Passing 0420 AC4 test verifies its position and message."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The passing 0420 browser test uses a 420 px viewport, verifies a mouse pointer, waits for fonts and measures eligible collapsed cards at no more than 56 px."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Shipped tickets now use compact title and details lines, with the stats condensed above them. Details, full-ticket links and push warnings still work. The targeted run passed 242 tests, including the browser layout check, with three skipped. No blocking issues found."
  }
}
```

</details>
