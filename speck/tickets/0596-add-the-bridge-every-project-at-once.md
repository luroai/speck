---
id: "0596"
title: "Add the bridge: every project at once"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0595","0592","0587","0581"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T23:37:42.137Z"
approved: "2026-11-09T23:54:09.865Z"

---
# 0596 · Add the bridge: every project at once

**Status:** 👍 approved

## Problem
With several projects running, you check each panel in turn to see what needs you. The redesign's bridge shows every project at once, as the engineering manager's view across all of them.

## Outcome
With two or more projects running, the panel offers the bridge, which shows what needs you and how each project is doing, across all of them.

## Acceptance criteria
1. With two or more speck panels running on this machine, the bar's project menu offers All projects, which opens the bridge; with one, it isn't offered.
2. The bridge's bar shows speck in the busiest mood among them, how many are building in all, how many projects are busy and how many things need you, and three tiles: shipped this week, the median build time and the spend this week, across all projects.
3. Under Needs you, each item is a card with its project, ticket id and why, its title and a one-line reason; pressing it opens that ticket in its own project's panel.
4. Under Projects, each project is a row with a dot for its state, its name, a line with what it's doing and what needs you, and its spend this week; pressing it switches to that project.
5. No test that passed before this change fails.

## Out of scope
- Acting on another project's ticket from the bridge itself.
- A box to tell speck what you want: ideas are still captured in chat.

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Uses 0595's summaries and 0516's switch. Waits for the header, log and lane tickets that change the same files.
- Relies on nothing outside this repo.
- Failing before this build: none
- AC1: All projects is a button beside the project menu's caret, not an entry in its list: 0516's tests compare the list's entries exactly, and AC5 keeps every passing test as it is. It's offered exactly when the menu lists two or more running panels.
- The median covers each project's latest 20 shipped tickets, as the long-build check's usual time does; 0595's summary now also gives each panel's mood, whether it's busy and those build times.
- The ticket pressed on a card is kept in the tab's sessionStorage across the reload that switches project, and opened once that project's board arrives.
- Self-check: a why the page doesn't know, even a built-in name such as constructor, no longer reads off an object's prototype; a project whose port isn't a whole number gets no row; removed a 44 px minimum on the bridge's cards that 0417 forbids and their content already exceeds.

## In plain words
With two or more projects running, the bar now has an All projects button beside the project menu. It opens the bridge: speck in the busiest mood among your projects, how many things are building, how many projects are busy and how many need you, then shipped this week, the median build time and this week's spend across them all. Below that, each thing that needs you is a card, and pressing one takes you to that ticket in its own project. Each project also has a row saying what it's doing and what it has spent; pressing it switches to that project. To see it, start panels for two projects and press All projects, or look at the pictures in this review pack. All projects is a button beside the menu rather than a line in its list, so that is worth a look. A project whose panel doesn't answer stays in the list marked Not answering, and its figures aren't counted.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 openBridge and closeBridge change bridgeOpen without calling holdPage(pageHeld()) or render().
Round 2 (codex): approve.
Round 3 (codex, merge round): approve.

## Delivery log
- Review rounds: 3, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 419,590
- Elapsed since build started: 16 min
- Changed lines: 244 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- All projects could be an entry in the project menu's own list: saved to the inbox as speck/ideas/2026-11-09-put-all-projects-in-the-project-menu-s-list.md.

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
    "reviewed_sha": "ebd3bd545fd4f6649ae341123be68f2e1c6df4b6",
    "session": "fresh",
    "thread_id": "01a1c2b4-80bf-7b93-a05b-2baeb2d89ac0",
    "builder_response": "- Tests run: `speck test --related test/panel-0596.test.mjs` (the ticket's own test file, the repo's checks and the 31 related test files it picked).\n- AC1: All projects is a button beside the project menu's caret, not an entry in the menu's list. 0516's tests (test/panel-0516.test.mjs) compare the list's entries exactly, and AC5 says no test that passed may fail, so an entry in the list can't meet both. It's offered exactly when two or more running panels are listed. Noted in the ticket.\n- Checked in a real browser with two real panels at one address: All projects opens the bridge, Back closes it, and pressing a card switches project and opens that ticket. Pictures are with the review pack.\n",
    "seconds": 33,
    "usage": {
      "input_tokens": 175767,
      "cached_input_tokens": 125056,
      "cache_write_input_tokens": 0,
      "output_tokens": 880,
      "reasoning_output_tokens": 61
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 50711,
      "cached": 125056,
      "write": 0,
      "output": 880
    },
    "cost_usd": 0.1227276,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T23:46:44.821Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panel-header.js drawProjects/openBridge offer the button with two panels; passing 0596 AC1 tests cover visibility, opening and closing."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "projectSummary supplies mood, activity and build times; bridgeModel aggregates them. Passing AC2 tests cover mood ranking, counts, median and spend."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "bridgeParts renders cards; pressBridgeTicket and openAskedTicket switch projects and open the selected ticket. Passing AC3 tests exercise both local and cross-project navigation."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "bridgeParts, bridgeDot and bridgeLine render project rows; passing AC4 tests cover their contents and switching."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reported related-test run passed 397 tests with zero failures and three skips. Existing tests were not weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-header.js",
        "issue": "openBridge and closeBridge change bridgeOpen without calling holdPage(pageHeld()) or render(). Initially, keyboard focus can reach controls behind the modal. If a board update renders while the bridge is open, it makes the background inert; closing the bridge then leaves that background inert and scrolling locked until another render, and the focus-return attempt targets an inert header.",
        "suggested_fix": "Synchronise holdPage(pageHeld()) immediately on both opening and closing, releasing the background before returning focus. Add regression coverage for opening, receiving a board update and closing without another update.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The bridge aggregates projects and supports the requested navigation, with meaningful passing tests. One modal interaction bug needs fixing: background controls can remain accessible while it opens, or become temporarily unusable after it closes."
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
    "reviewed_sha": "84bd1950b2cc811707fa8a8fc89e1f674dd5bf82",
    "session": "continued",
    "thread_id": "01a1c2b4-80bf-7b93-a05b-2baeb2d89ac0",
    "builder_response": "- Tests run: test/panel-0596.test.mjs (and the repo's checks, which every `speck test --files` runs).\n- F1: fixed. openBridge and closeBridge in templates/panel-header.js now call holdPage(pageHeld()): as it opens, and on closing before the focus goes back to All projects. New test \"0596: the page behind is held while the bridge is open, and let go before the focus returns to it\" covers opening, a new board arriving while open, closing and the order on closing.\n",
    "seconds": 19,
    "usage": {
      "input_tokens": 285978,
      "cached_input_tokens": 227968,
      "cache_write_input_tokens": 0,
      "output_tokens": 1380,
      "reasoning_output_tokens": 61
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 7299,
      "cached": 102912,
      "write": 0,
      "output": 500
    },
    "cost_usd": 0.0298892,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T23:47:29.565Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-header.js drawProjects offers All projects for two or more panels; openBridge opens it. Passing AC1 tests cover visibility, opening, polling and closing."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/panel-summary.mjs projectSummary supplies project figures; bridgeModel and bridgeParts aggregate and display them. Passing AC2 tests cover mood, counts, shipped totals, combined median and spend."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "bridgeParts renders ticket cards; pressBridgeTicket and openAskedTicket open tickets locally or after switching projects. Passing AC3 tests cover contents, navigation and failed switches."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "bridgeParts, bridgeDot and bridgeLine render project rows; pressBridgeProject switches projects. Passing AC4 tests cover row contents, states and navigation."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Round 1's related tests reported zero failures. Round 2 reports 137 passing tests, zero failures and three skips; the changes add modal handling and a regression test without weakening existing tests."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-header.js",
        "issue": "The modal interaction defect is fixed: openBridge immediately holds the background, and closeBridge releases it before returning focus.",
        "suggested_fix": "Implemented. The passing regression test covers opening, a board update while open, closing and release before focus returns.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The bridge shows activity, spending and items needing attention across projects, with working project and ticket navigation. The modal interaction bug is fixed and covered by a regression test. All criteria pass; no blocking concerns remain."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "ee76d36a327f8b36d9f7cb63b456fd1a9193925f",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1c2b4-80bf-7b93-a05b-2baeb2d89ac0",
    "builder_response": "- Tests run: test/panel-0134.test.mjs test/panel-0161.test.mjs test/panel-0413.test.mjs test/panel-0596.test.mjs test/panel-0516.test.mjs test/panel-0417.test.mjs test/panel-0474.test.mjs (and the repo's checks, which every `speck test --files` runs).\n- Why this round: `speck ship` refused the ticket because five tests failed on it: 0134 AC4, 0161 AC1 (two) and 0413 AC2 and AC3. Merging main changed nothing (\"Already up to date\"), so this ticket's own change broke them. `--related` hadn't chosen those three test files before the first review.\n- 0134 AC4, 0413 AC2 and AC3: panel.html gained a button with visible text in the bar, and these allow no added static text, exactly two static buttons in the header, and Settings straight after a `</span>`. The All projects button is now made by templates/panel-header.js and inserted before Settings: still a real button, in the same place, with the same words. panel.html no longer has it. No existing test was changed. test/panel-0596.test.mjs finds the button in the bar rather than by id or in the static page.\n- 0161 AC1 (contrast): `#bridge .bridge-tile .label` is in the bar's muted colour, and the check took it as sitting on the light surfaces. The rule now sets the bar's own fill, the colour already behind it.\n- 0161 AC1 (fills): `.bridge-dot` was a filled area with no text colour. The dots are now drawn with a border 4 px deep (8 px across), and the state classes change the border's colour. Same look.\n- Checked in a real browser with two real panels: the button is between the project menu and Settings at 44 px tall, opens the bridge, holds the page behind it, and Back releases the page and returns focus to the button. The look hasn't changed, so the pictures stand.\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 417680,
      "cached_input_tokens": 349056,
      "cache_write_input_tokens": 0,
      "output_tokens": 1910,
      "reasoning_output_tokens": 61
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 10614,
      "cached": 121088,
      "write": 0,
      "output": 530
    },
    "cost_usd": 0.0386368,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T23:54:04.456Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-header.js creates bridgeOpener before Settings; drawProjects offers it with two or more panels. Passing AC1 tests exercise the actual generated button and opening the bridge."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "projectSummary, bridgeModel and bridgeParts still supply and display aggregate mood, counts and all three tiles. Passing AC2 tests cover these calculations; the CSS changes preserve their appearance."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "bridgeParts renders the required card contents; pressBridgeTicket and openAskedTicket support local and cross-project ticket opening. All AC3 tests pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "bridgeParts, bridgeLine and bridgeDot provide project rows, activity, spend and state indicators. Border-based dots preserve the states; all AC4 tests pass."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The reported run passes 196 tests with zero failures and three skips, including the previously failing 0134, 0161 and 0413 files. Existing tests were not modified; fixes address regressions introduced by this ticket."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-header.js",
        "issue": "Resolved: opening immediately holds the background, and closing releases it before returning focus to the generated All projects button.",
        "suggested_fix": "No further change required. The modal regression test remains passing and now exercises the generated button.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The compatibility fixes preserve the bridge’s behaviour and repair the failures found during shipping without weakening existing tests. All acceptance criteria pass, and the earlier modal bug remains fixed. No blocking concerns remain."
  }
}
```

</details>
