---
id: "0434"
title: Show each collapsed ticket as two single lines                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0428"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T19:48:52.766Z"
blocked_at: ""
waited_seconds: 1637

---
# 0434 · Show each collapsed ticket as two single lines

**Status:** 🔨 building

## Problem
Collapsed tickets are taller and busier than they need to be. A ticket being built starts its details line with a stage sentence such as `Writing tests and code`, then its stage, its time, its priority, size and risk. On a phone each item is a finger-sized box, so the line wraps over three rows. A shipping ticket shows two unlabelled times (`Shipping · 01:08 · 20:12`), and a long title wraps over two lines.

## Outcome
Every collapsed ticket is two single lines: its title, then a short status line. While an agent works on a ticket, a small grid of moving lights shows it's working.

## Acceptance criteria
1. While a ticket's builder or reviewer is at work (writing tests and code, checking its own work, reviewing or fixing a round's findings), its status line starts with a 4 × 4 grid of small dots, no more than 14 px square, with lights moving across it, in place of the stage sentence. The grid's accessible name and tooltip are the sentence it replaces, such as `Writing tests and code`. With reduced motion on, the grid is still, with some of its dots lit. A ticket no agent is working on (queued, blocked, approved, paused, shipping or stopped) shows no grid.
2. A collapsed Build ticket's status line is its grid or words, its stage and one time: the time since its build started, as the card's timer shows it today. For example: `Build · 01:07`, `Review 1 · gpt-6.1-sol · 07:52` (the reviewer's model after the stage), `Shipping · 20:12` or `Queued · waiting on 0426`. A shipping ticket no longer shows how long the ship has been running.
3. A collapsed Build ticket doesn't show its priority, size or risk. An open one shows them, and its priority still opens its menu.
4. Every collapsed ticket in Plan, Build and Shipped shows its title on one line, cut off with an ellipsis when it doesn't fit, with the whole title as its tooltip and in its accessible name. An open ticket shows its whole title, wrapping as needed.
5. At 390 px wide, on a touch screen as well as with a mouse, every collapsed Build ticket is two rows: its title line and its status line.

## Out of scope
- speck's screen (0413, 0414).
- What Plan's and Shipped's second lines show (0419, 0420), apart from their titles.

## Notes
- The user asked for this on 2026-10-23, from phone screenshots of the Build lane: a Cursor-style grid of lights for "working", one time on a shipping ticket, no priority, size or risk on a collapsed Build ticket, and one-line titles on collapsed tickets.
- This replaces 0416's rule that only speck's screen moves, for this grid only. The test for that rule changes to allow it.
- Today: `doing()` gives the stage sentence, and 0419 set out the details line, in `templates/panel.html`.
- Waits for 0428: both change `templates/panel.html`. 0430 waits for it too, as 0430 moves every style.
- Failing before this build: none
- Self-check: kept a closed Build card's bug, fix and document tags, as AC3 names only its priority, size and risk; made the phone rule for a closed Shipped title win over the general one, so its tap area stays 44 px wide; switched the grid's dim dots from see-through to a colour, as no text or mark may be faded (0161).
- Round 1 F1 (an open Build card's priority should open a menu): to dispute in round 2. "Still opens its menu" means as today, and today a Build card's priority shows its tip (0165 AC4); the server only sets a draft's priority (`scripts/panel.mjs`, panelSetPriority), so a menu there would be a new feature.
- Built as: while the reviewer is reviewing, the stage names the round being reviewed (`Review 2` while round 2 runs), as the sentence that named it is now only the grid's name; 0223's test changes to match. A closed Build card's status line is one line, cut off with an ellipsis on a phone when its words don't fit. As the user chose, a closed card hides what was under its two lines (a blocked question, a paused build's hint, a build's message, a finished document's Review pack button) until it's opened, except the Foreman's question.
- Went with the recommendation: hide them until the card is opened, except the Foreman's question (chosen by the user in the panel, 2026-10-23 20:42 UTC).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
A closed Build card can have more under its two lines: a blocked ticket's question and its Go with the recommendation button, the Foreman's question with its Answer box, a paused build's "carry it on with speck play" hint, and a stopped or approved build's message. AC5 says every closed Build card is two rows, but 0419 kept these showing under the two lines. Should a closed card hide them until you open it (the status line already says "Blocked · it has a question for you", "Paused", "The build stopped" and so on), or keep showing them, so only cards without them are two rows? I recommend hiding them until opened, as the ticket's outcome says every closed ticket is two lines, but keeping the Foreman's question showing, as a queued card's status line ("Queued") gives no sign of it.

Recommended: hide them until the card is opened, except the Foreman's question
Changes what you'd notice: yes
Clear winner: no

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "05d33d6002fd10fe46c72ad35eb5004617ead9f4",
    "session": "fresh",
    "thread_id": "01a16a66-51ca-7813-b560-63a7a749f1f6",
    "builder_response": "- Tests run: test/panel-0434.test.mjs test/panel-0041.test.mjs test/panel-0050.test.mjs test/panel-0053.test.mjs test/panel-0055.test.mjs test/panel-0058.test.mjs test/panel-0069.test.mjs test/panel-0071.test.mjs test/panel-0077.test.mjs test/panel-0151.test.mjs test/panel-0153.test.mjs test/panel-0155.test.mjs test/panel-0156.test.mjs test/panel-0157.test.mjs test/panel-0161.test.mjs test/panel-0165.test.mjs test/panel-0168.test.mjs test/panel-0201.test.mjs test/panel-0213.test.mjs test/panel-0416.test.mjs test/panel-0419.test.mjs test/panel-0420.test.mjs test/panel-0427.test.mjs test/review-model-0382.test.mjs test/review-running-0223.test.mjs test/run-provider-0391.test.mjs\n- Pictures: seven, in the review pack: the Build, Plan and Shipped lanes at 390 px on a touch screen, light and dark, and an open Build card.\n- Existing tests changed: the ones whose checks this ticket replaces on purpose: the stage sentence in words (now the grid's name while an agent works, 0156, 0168, 0201, 0223, 0382, 0391, 0416, 0419), the ship's own time (0153, 0201), the priority, size and risk on a closed Build card (0041, 0053, 0058, 0069, 0077, 0165, 0190, 0213, 0224, 0419: they open the card first), wrapped titles on closed cards (0151, 0155, 0157, 0419, 0420: they now check open cards wrap, closed ones cut off), only speck's screen moving (0055, 0416: the grid is allowed, as the ticket's Notes say), and no faded marks (0161: the grid's dots hold no text).\n- Interpretations, also in the ticket's Notes: while a round is being reviewed the stage names that round (\"Review 1\" while round 1 runs), as in AC2's example; 0223's AC4 test changes to match. A closed card keeps its bug, fix or document tag, as AC3 names only priority, size and risk. A blocked, paused or stopped card keeps its question, hint or message under its two lines (0419 AC4); its status line itself is one line.\n",
    "seconds": 33,
    "usage": {
      "input_tokens": 252244,
      "cached_input_tokens": 181120,
      "cache_write_input_tokens": 0,
      "output_tokens": 1091,
      "reasoning_output_tokens": 88
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T20:14:46.246Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: doing(), lights() and motion styles implement the named 16-dot grid and exclude inactive states. Passing 0434 AC1 tests cover its size, animation and reduced motion in a real browser."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "progressOf(), queuedLine() and startCounters() show the stage, reviewer model and existing build timer without the shipping timer. Both 0434 AC2 tests passed."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "progressOf() and queuedLine() hide the specified tags when collapsed, but use tagsOf(t, false) when open, which produces a priority explanation rather than a priority menu. The 0434 AC3 test checks a tooltip instead of the required menu."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "titleLine(), titled(fullLink(t)) and collapsed-only CSS retain full title text and tooltips while applying ellipsis. Passing 0434 AC4 and updated browser layout tests cover collapsed titles and wrapping when open."
      },
      {
        "id": 5,
        "status": "fail",
        "evidence": "queueItem() appends questions, paused hints, exit messages and shipping hints even when collapsed. The 0434 phone fixture explicitly filters out blocked, approved, paused and stopped examples before testing two rows."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "An open Build ticket's priority opens an explanatory tooltip, not the menu required by AC3. The new test substitutes a tooltip assertion for that requirement.",
        "suggested_fix": "Provide the required priority menu on open Build tickets and test that clicking priority exposes its choices and performs the supported priority change.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/panel-0434.test.mjs",
        "issue": "The phone test excludes the states that violate AC5. Collapsed blocked, paused, stopped and approved cards can still contain extra visible rows. The builder's added Notes do not establish an exception to 'every collapsed Build ticket'.",
        "suggested_fix": "Include these states in both phone tests and make their collapsed cards two rows, retaining their additional information when opened. If these messages must remain visible while collapsed, obtain an explicit change to AC5.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The moving lights, shorter timers and single-line titles work in the passing tests. Two requirements remain unmet: priority opens a tooltip instead of a menu, and several collapsed ticket states still show extra rows. The phone tests exclude those states, so their passing result does not cover every Build ticket."
  }
}
```

</details>
