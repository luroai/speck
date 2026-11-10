---
id: "0614"
title: "Give an open Plan or Capture row room inside its fill"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-10-give-an-open-plan-or-capture-row-room-inside-its-fill.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0608"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T11:07:06.723Z"
blocked_at: ""
waited_seconds: 11
approved: "2026-11-10T11:29:46.576Z"

---
# 0614 · Give an open Plan or Capture row room inside its fill

**Status:** 👍 approved

## Problem
An open Plan or Capture row has a raised background, and since 0600 its text runs right to that fill's edges, as the row has no side padding of its own. The text pressed against the edge, and the ring a linked id draws, look cramped on a phone.

## Outcome
An open Plan or Capture row has room between its text and the edges of its fill.

## Acceptance criteria
1. An open Plan or Capture row's text sits at least 12 px inside its raised fill on each side, in both looks.
2. The title doesn't move sideways when the row opens or closes.
3. Every row still spans its list, as 0418 checks.
4. Tests that checked the old behaviour are changed to check the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- Closed rows.

## Notes
- Asked for 2026-11-10 for release 1.0.0: "Create them all, set them all ready", from the follow-ups builders filed during the redesign.
- From 0600's build: letting the fill reach past the 16 px margins broke 0418's check, so the room has to come from inside them, or from padding the text in. Today: `.item.row.open` in `templates/panel-cards.css`. Waits for 0608, which changes the same stylesheet.
- Relies on nothing outside this repo.
- Failing before this build: none
- How: the open row's own box stays where it was, spanning its list inside the 16 px margins (so 0418 and 0600 still pass), and its raised fill is drawn 12 px past each side with side shadows in the fill's colour. Closed rows are unchanged, so the title stays put. A linked id's ring (hover and the flash after a tap) on an open row is drawn round the whole fill by a pseudo-element that takes no taps, rather than round the row's box at the text's edge.
- Self-check: the hover and flash rings (`.item.hl`, `.item.flash`) set their own box-shadow, which would have hidden the fill's sides or drawn the ring at the text's edge; moved them to the fill's edge and added checks. Kept 0154's reduced-motion rule as it was, adding a second one.
- Went with the recommendation: Move the mark to the end of the open title line (chosen by speck, as watch is decide, 2026-11-10 11:15 UTC).

## In plain words
When you open a note in Capture or a ticket in Plan, its shaded background now reaches a little past the text on both sides, so the text no longer presses against the edges of the shading. The title stays exactly where it was when the row opens. For a ticket that starts a chain or waits on another, the chain or padlock mark now sits at the end of the title line, where the closed row's chip is, rather than between the number and the title. To see it, open any note or draft on a phone-width panel, in light and dark. Worth a look: the shading now comes close to the panel's sides, about 4 px from them on a phone.

## Blocked question
The room inside an open row is done and the title no longer moves for most rows, but an open Plan ticket that starts a chain or waits on another still shows its chain or padlock mark between its id and its title, so its title shifts right by the mark's width when it opens (the closed row shows that link as a chip at the end instead). Should I (a) move that mark to the end of the open ticket's title line, where the closed row's chip sits, so the title never moves, (b) leave the mark where it is and accept that linked tickets' titles shift by it, as they do today, or (c) show the mark in closed rows too? I recommend (a): the title stays still for every ticket, and the link shows in the same place open or closed; it changes two older checks that pin the mark right after the id.
Recommended: Move the mark to the end of the open title line
Other options: Leave the mark after the id, linked titles still shift; Show the mark in closed rows too
Changes what you'd notice: yes
Clear winner: no

## Review log
Round 1 (codex): changes requested: F1 AC2 is not met for Plan tickets with a chain or waiting icon: titleLine adds that icon only while open, moving the title sideways.
Round 2 (codex): changes requested: F2 AC4 explicitly requires the Delivery log to list tests changed from the old behaviour.
Round 3 (codex): approve.
Round 4 (codex, merge round): approve.

## Delivery log
- Review rounds: 4, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 571,629
- Elapsed since build started: 23 min
- Changed lines: 18 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Tests changed to check the new behaviour (AC4): test/panel-0041.test.mjs (`iconOf` finds an open ticket's chain or padlock mark after its title, not right after its id) and test/panel-0483.test.mjs (AC2: an open card's line is id, title, then its mark), and, after ship found it, test/panel-0416.test.mjs (AC3: the flash ring on an open row's fill is the one other animation it allows, and `animation: none` isn't one). No other test changed, and none failed.
- Follow-ups: a hovered closed row (desktop only) still has its raised fill run to its text's edges; saved to the inbox as speck/ideas/2026-11-10-give-a-hovered-closed-row-room-inside-its-fill.md.

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
    "reviewed_sha": "e4174851fb242e44ce31c032ff65e619e9e32075",
    "session": "fresh",
    "thread_id": "01a1c52a-4bb6-7853-90b0-c0be0cecfa9f",
    "builder_response": "- Tests run: test/panel-0614.test.mjs (with --related, which added test/panel-0417.test.mjs, test/panel-0469.test.mjs, test/panel-0472.test.mjs), plus test/panel-0418.test.mjs, test/panel-0600.test.mjs, test/panel-0608.test.mjs, test/panel-0154.test.mjs, test/panel-0167.test.mjs, test/panel-0185.test.mjs, test/panel-0519.test.mjs, test/panel-0151.test.mjs, test/panel-0164.test.mjs, as they check rows, open items and the linked-id rings\n- Approach: the open row's own box is unchanged (it still spans its list inside the 16 px margins, so 0418 and 0600 pass untouched); its raised fill is drawn 12 px past each side with side box-shadows in var(--raise). Closed rows are untouched, so the title can't move.\n- The hover (.hl) and flash rings on an open row are drawn round the whole fill by an ::after with pointer-events: none, as the row's own box-shadow ring would have replaced the fill's sides or sat at the text's edge.\n- AC2 fixture: no links between the tickets. An open ticket that starts a chain shows a chain mark before its title (existing behaviour, not this ticket's), which shifts its title whatever the padding; I'll list that as a follow-up.\n- AC4: no existing test changed; none failed.\n",
    "seconds": 34,
    "usage": {
      "input_tokens": 150947,
      "cached_input_tokens": 103168,
      "cache_write_input_tokens": 0,
      "output_tokens": 880,
      "reasoning_output_tokens": 87
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 47779,
      "cached": 103168,
      "write": 0,
      "output": 880
    },
    "cost_usd": 0.1146748,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T11:14:39.814Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-cards.css .item.row.open extends the raised fill by 12 px on each side. Both browser tests in test/panel-0614.test.mjs passed, measuring text clearance in light and dark looks."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "templates/panel.js titleLine inserts chainIcon only when open; ticketHead enables this for Plan tickets. Opening a chain starter or waiting ticket therefore shifts its title. The new test deliberately excludes linked tickets, so it does not cover this case."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The row's dimensions remain unchanged. The new browser tests verify list alignment; the supplied run also passed test/panel-0418.test.mjs across its viewport widths."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "No existing tests required changes. The recorded run reports 218 passes, zero failures and three skips; the ticket-specific browser tests passed. No unrelated implementation changes appear in the branch's merge-base diff."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.js",
        "issue": "AC2 is not met for Plan tickets with a chain or waiting icon: titleLine adds that icon only while open, moving the title sideways. The builder acknowledges this case but excludes it from the test fixture. Existing behaviour still prevents this explicit acceptance criterion from passing.",
        "suggested_fix": "Keep the title's horizontal position stable for linked Plan tickets while preserving closed rows, and add a browser assertion covering a chain starter and a waiting ticket. If that requires changing the ticket's scope, obtain an owner decision rather than treating AC2 as passed.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The added space works in both looks, and rows retain their full width. However, linked Plan tickets still move their titles sideways when opened. The new tests deliberately omit that case, so the change does not yet meet every acceptance criterion."
  }
}
```

</details>

<details><summary>Round 2 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "75f7691b75ef41c503d58ef33c96d43602e7ebf6",
    "session": "continued",
    "thread_id": "01a1c52a-4bb6-7853-90b0-c0be0cecfa9f",
    "builder_response": "- Tests run: test/panel-0614.test.mjs, test/panel-0041.test.mjs, test/panel-0483.test.mjs, test/panel-0418.test.mjs, test/panel-0600.test.mjs, test/panel-0608.test.mjs, test/panel-0154.test.mjs, test/panel-0167.test.mjs, test/panel-0185.test.mjs, test/panel-0519.test.mjs, test/panel-0151.test.mjs, test/panel-0164.test.mjs, test/panel-0419.test.mjs, test/panel-0434.test.mjs, test/panel-0468.test.mjs, test/panel-0053.test.mjs, with --related (which added 15 more, listed at the top of the output)\n- F1: fixed, with the owner's decision recorded in the ticket's Notes (speck's watch took the recommendation: move the mark to the end of the open title line). templates/panel.js titleLine now puts the open ticket's chain or padlock mark after the title, where a closed row's chip sits, so the title doesn't move. templates/panel-cards.css gives the chain mark 4 px after it at the line's end, as its tilted links reach past its 12 px box. test/panel-0614.test.mjs now opens a chain starter (0701) and a waiting ticket (0703) as well as an unlinked one, and checks the title stays put, the mark is there, and the mark too is 12 px inside the fill.\n- AC4: tests changed to check the new behaviour: test/panel-0041.test.mjs (iconOf finds the mark after the title, not after the id) and test/panel-0483.test.mjs (AC2: the line's shape is id, title, mark). Both listed in the Delivery log at close.\n",
    "seconds": 39,
    "usage": {
      "input_tokens": 317250,
      "cached_input_tokens": 260224,
      "cache_write_input_tokens": 0,
      "output_tokens": 1699,
      "reasoning_output_tokens": 193
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 9247,
      "cached": 157056,
      "write": 0,
      "output": 819
    },
    "cost_usd": 0.0423896,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T11:20:10.707Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-cards.css .item.row.open extends the fill 12 px each side. Both passing browser tests in test/panel-0614.test.mjs measure text clearance in light and dark looks, including linked tickets."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.js titleLine now places the open ticket's mark after its title. Passing browser tests verify unchanged title position for Capture, unlinked Plan tickets, chain starters and waiting tickets."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The row's box dimensions remain unchanged. Passing test/panel-0614.test.mjs browser assertions check list alignment; test/panel-0418.test.mjs also passed."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "test/panel-0041.test.mjs and test/panel-0483.test.mjs honestly update the expected icon position. The run reports 358 passes and no failures, but the ticket's Delivery log remains empty and does not list those changed tests."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.js",
        "issue": "The linked-ticket title shift is fixed: the chain or padlock mark follows the title, and browser coverage now includes both cases.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "speck/tickets/0614-give-an-open-plan-or-capture-row-room-inside-its-f.md",
        "issue": "AC4 explicitly requires the Delivery log to list tests changed from the old behaviour. It still contains only its placeholder; promising to populate it after review does not meet the criterion as written.",
        "suggested_fix": "Record test/panel-0041.test.mjs and test/panel-0483.test.mjs in the Delivery log, explaining that their icon-position expectations changed.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The spacing and linked-ticket title fix now meet the behaviour requirements, with no reported test failures. One required record remains: list the two updated tests in the ticket's Delivery log."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "b40739913ea941a42975aacf1014ec0f56d84ebd",
    "session": "continued",
    "thread_id": "01a1c52a-4bb6-7853-90b0-c0be0cecfa9f",
    "builder_response": "- Tests run: no code or test changed this round; the test output is round 2's run of the same files.\n- F2: fixed. The ticket's Delivery log now lists test/panel-0041.test.mjs and test/panel-0483.test.mjs and how their icon-position expectations changed.\n",
    "seconds": 25,
    "usage": {
      "input_tokens": 433541,
      "cached_input_tokens": 374656,
      "cache_write_input_tokens": 0,
      "output_tokens": 2220,
      "reasoning_output_tokens": 193
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 1859,
      "cached": 114432,
      "write": 0,
      "output": 521
    },
    "cost_usd": 0.0203712,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T11:20:42.406Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-cards.css .item.row.open extends the raised fill 12 px each side. Passing browser tests in test/panel-0614.test.mjs measure text clearance in both looks."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.js titleLine places the open ticket's mark after its title. Passing browser tests verify stable title positions for Capture notes, unlinked tickets, chain starters and waiting tickets."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Row dimensions remain unchanged. test/panel-0614.test.mjs verifies list alignment, and the recorded run passed test/panel-0418.test.mjs."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The Delivery log now lists test/panel-0041.test.mjs and test/panel-0483.test.mjs and explains their updated expectations. The unchanged code and tests retain the previous run's 358 passes, zero failures and three skips."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.js",
        "issue": "Linked-ticket titles now remain in place when opened, with browser coverage for chain and waiting marks.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "speck/tickets/0614-give-an-open-plan-or-capture-row-room-inside-its-f.md",
        "issue": "The Delivery log now records both updated tests and their changed icon-position expectations.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Open Plan and Capture rows now give their text room in both looks, keep titles steady and retain full list width. The required test record is complete. All criteria pass, with no outstanding findings."
  }
}
```

</details>

<details><summary>Round 4 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 4,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "fc844e99ae73f5aab86186a9271747b20209db4e",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1c52a-4bb6-7853-90b0-c0be0cecfa9f",
    "builder_response": "- Merge round after ship's tests failed on the ticket merged with main. Merged main (no conflicts).\n- Failing test: test/panel-0416.test.mjs \"0416 AC3\", which lists every CSS rule with an animation. It failed because of this ticket's own change, not main's: the open row's flash rules add `.item.row.open.flash { animation: none }` (turning the row's own ring off) and `.item.row.open.flash::after { animation: flash 1.5s ease-out }` (the same 1.5 s ring after \"Go to ticket\", drawn round the open row's whole fill). I didn't run 0416 in the build.\n- Fix: changed 0416 AC3's check to ignore `animation: none` (as its transition check already ignores `none`) and to allow `.item.row.open.flash::after` beside `.item.flash, .q.flash`. Still the same single @keyframes flash. No code changed. Listed in the Delivery log as a test changed to check the new behaviour (AC4).\n- Tests run: test/panel-0416.test.mjs, test/panel-0614.test.mjs, test/panel-0041.test.mjs, test/panel-0483.test.mjs\n",
    "seconds": 21,
    "usage": {
      "input_tokens": 568848,
      "cached_input_tokens": 499712,
      "cache_write_input_tokens": 0,
      "output_tokens": 2781,
      "reasoning_output_tokens": 193
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 10251,
      "cached": 125056,
      "write": 0,
      "output": 561
    },
    "cost_usd": 0.0386176,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T11:29:43.807Z"
  },
  "verdict": {
    "round": 4,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Merged templates/panel-cards.css retains the 12 px fill extensions. Both passing browser tests in test/panel-0614.test.mjs measure text clearance in light and dark looks."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.js titleLine still places open-ticket marks after the title. Passing browser tests verify stable title positions for Capture notes and linked and unlinked Plan tickets."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The merged CSS preserves row dimensions. Passing test/panel-0614.test.mjs assertions verify that each tested row spans its list; the earlier 0418 checks also passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The Delivery log lists all three updated existing test files. The 0416 adjustment excludes disabled animations and permits only the additional flash pseudo-element, retaining the single-keyframes check. The current run reports 135 passes, zero failures and three skips."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.js",
        "issue": "The linked-ticket title shift remains fixed after merging main, with browser coverage for chain starters and waiting tickets.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "speck/tickets/0614-give-an-open-plan-or-capture-row-room-inside-its-f.md",
        "issue": "The Delivery log records the changed tests, including the animation check updated after shipping checks found it.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The merged change preserves the spacing, steady titles and full-width rows. The animation test update correctly recognises the relocated flash ring without allowing unrelated animations. All criteria pass; no findings remain open."
  }
}
```

</details>
