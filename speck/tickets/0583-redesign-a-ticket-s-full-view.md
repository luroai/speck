---
id: "0583"
title: "Redesign a ticket's full view"                # one outcome, no "and"
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
after: ["0577"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T18:34:51.709Z"
approved: "2026-11-09T19:17:22.398Z"

---
# 0583 · Redesign a ticket's full view

**Status:** 👍 approved

## Problem
A ticket's full view (the "side pane", `#full-ticket`) still has the LCD-era look, with tags and bordered boxes. In the redesign it's the one place a ticket's detail lives, so it needs to read clearly on a phone and end in the action that's needed.

## Outcome
A ticket's full view reads top to bottom as in the mock and ends in the action it's waiting for.

## Acceptance criteria
1. The full view starts with a back link to the lane it came from, the ticket's id at the right, a status pill (orange when it waits for you, blue while it's being worked on, grey otherwise) and its title.
2. Below the title, a step track shows four bars, Ready, Built, Reviewed and Ship, filled up to where the ticket is, with a step that waits for you in orange.
3. Its facts are a two-column grid: priority, size, risk, whether it ships by itself (and why not, when it won't), the builder and its model, and the reviewer and its model.
4. Then its outcome, its acceptance criteria as a list with a tick on each one the reviewer passed, and rows that open its review pack and its build log. An approved ticket has a bar fixed to the bottom with Ask for changes and, in the accent colour, Ship.
5. Tests that checked the old look of what this changes are updated to the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- A build's live log and Stop button in the full view (0584).
- What changed in its criteria (0588).

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Today: `fullTicket`, `paneSteps`, `renderFull` in `templates/panel-popups.js`, the track (`trackOf`) and facts (`factsOf`, `factCell`) in `templates/panel.js`, styles in `templates/panel-popups.css` and `templates/panel-cards.css`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: hid the folded note box, which the box's own `display: block` kept on show; drew the tick in CSS, as the checkmark glyph isn't in the panel's fonts; the back link is a link with no border, so the edge checks no longer list it.
- The Build log row also shows a log for a ticket whose card is closed. `--related` doesn't pick the panel test files, as they reach the page through a support module, so this build ran every test file that uses the panel page as well.
- speck (2026-11-09 19:02 UTC) told you: Nothing is stuck and main isn't broken: 0583 is slow because the redesign broke about 37 older tests of the old look, which it has been updating one batch at a time (4 left, all pointing at the old Close button), with about 10 of its 27 minutes in four long runs on a busy machine, one of them a screenshot script that hung until its 3-minute limit. Separately, while clearing up after that hang at 18:56 the build ran a command to kill every speck panel on the machine, and your real panel showed as only seconds old just afterwards, so it was probably restarted by this; 0589's ship still went through. Why: The build's log shows failures falling from 37 to 4 with every one tied to the full view it is changing, four runs of two to three minutes at a load of 20 to 28 on 16 cores, and the kill command followed by a process list showing the panel freshly started.

## In plain words
A ticket's full view has a new, calmer layout that reads well on a phone. At the top is a link back to the lane you came from, the ticket's number, a coloured pill for its status (orange when it needs you, blue while it's being worked on) and its title. Under that, four bars show how far it has got, followed by its priority, size, risk, whether it will ship by itself and why not, and who builds and reviews it. Then come what it should achieve, its acceptance criteria with a tick on each one the reviewer passed, and rows that open its review pack and build log. An approved ticket ends in a bar at the bottom of the screen with Ask for changes and a blue Ship button.

To see it, open any ticket's Full ticket button in the panel, and try an approved one to see the bar. Ask for changes opens a box for your note the first time you press it, and sends the note the next time.

Worth keeping an eye on: a shipped ticket's costs and timings are no longer in this view. They're still on its card in the Shipped lane.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 369,288
- Elapsed since build started: 43 min
- Changed lines: 286 (limit 5000)
Old-look tests updated to the new one (AC5):
- `test/panel-0054`, `0061`, `0063`: Outcome and Acceptance criteria now come before Problem, and the pane closes from its back link. `0063`'s section comparison leaves out the rows.
- `test/panel-0133`: an approved ticket's full view now has Ship, in its bar.
- `test/panel-0143`, `0165`, `0213`, `0424`: priority, size and risk are separate cells in the new grid, for shipped tickets too; type isn't one of its facts.
- `test/panel-0161`, `0453`: the back link is a link with no border, so it's no longer one of the bordered controls they check.
- `test/panel-0423`, `0466`, `panel-focus-0326`: the pane closes from its back link.
- `test/panel-0465`: the full view has its own four bars and six facts rather than its card's track and table, values wrap, and there is no counter in it.

Follow-ups:
- A draft's Set ready is still at the top of its body, in its readiness list, rather than at the end of the view: only an approved ticket has the bar (AC4).
- Skipped, already captured: `speck test --related` doesn't pick the panel tests when a panel script changes (speck/ideas/2026-10-24-bring-in-page-tests-for-a-panel-script-change.md).

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
    "reviewed_sha": "bb0656c06b357eaff690954a44b855cb516cb425",
    "session": "fresh",
    "thread_id": "01a1c1b2-f3a3-7010-a834-01f09e637d96",
    "builder_response": "- Tests run: every test file that uses the panel page (166 files, chosen by content: full-ticket, Full ticket, openFull, boardPage, fakePage, POPUPS or panel-popups), including test/panel-0583.test.mjs and each existing test file this ticket changed, plus the files --related chose. --related alone doesn't pick the panel tests, as they reach the page through a support module.\n- The picture of the real page was checked in Chrome at 390 px, in both looks: the bar sits at the bottom of the window, the note box is folded and nothing overflows sideways.\n",
    "seconds": 40,
    "usage": {
      "input_tokens": 172085,
      "cached_input_tokens": 108032,
      "cache_write_input_tokens": 0,
      "output_tokens": 935,
      "reasoning_output_tokens": 226
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 64053,
      "cached": 108032,
      "write": 0,
      "output": 935
    },
    "cost_usd": 0.1482592,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T19:05:32.643Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "fullTicket, backList and paneTone in templates/panel-popups.js implement the lane link, id, title and status pill. panel-popups.css positions and colours them. The reported passing 0583 AC1 tests cover each lane and waiting, working and neutral states."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "paneTrack renders Ready, Built, Reviewed and Ship, with reached and waiting states. Passing 0583 AC2 tests cover draft through shipped tickets and the four-bar colour rules."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "paneFacts renders all six requested facts; statusData supplies auto_ship_why. Passing 0583 AC3 tests exercise names and models, shipping explanations, missing fields and the two-column grid."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "fullTicket renders outcome, numbered criteria with reviewer ticks and navigation rows. criteriaPassed selects passes from the latest review. shipBar supplies the bottom actions. Passing 0583 AC4 tests exercise pack navigation, log loading, shipping and sending a change request."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The changed older tests reflect the redesigned controls, facts and track, and the Delivery log lists them. The supplied run reports 2,807 passing tests, no failures and three skips, including the changed tests and browser layout coverage."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The full ticket view now has clearer navigation, progress, facts and reviewer ticks, with shipping actions at the bottom of approved tickets. The implementation and reported tests support all five criteria. No blocking issues found."
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
    "reviewed_sha": "a6da0351003f376ea61a82c3d4934ad580441155",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1c1b2-f3a3-7010-a834-01f09e637d96",
    "builder_response": "- Tests run: every test file that uses the panel page or reads its stylesheet (187 files, chosen by content: full-ticket, Full ticket, openFull, boardPage, fakePage, POPUPS, panel-popups, support/css or styles()), including test/panel-0167.test.mjs and test/panel-0583.test.mjs.\n- Merged main, with no conflicts.\n- Failing test: 0167 AC2, which requires that no style rule uses --accent. It failed because of this ticket's own CSS, the first to use that token; the merge with main didn't cause it, and the earlier test selection didn't include that file.\n- Fix: templates/panel-popups.css now uses --run for the accent's text and --blue for its fills and bars, as panel-base.css does for links and the focus ring since 0577. Both have the same value as --accent in the light look (#2F55D4) and the dark look (#86A2FF), so the page looks the same and the pictures still hold. test/panel-0167.test.mjs is unchanged. test/panel-0583.test.mjs now expects those two tokens.\n",
    "seconds": 24,
    "usage": {
      "input_tokens": 367742,
      "cached_input_tokens": 268544,
      "cache_write_input_tokens": 0,
      "output_tokens": 1546,
      "reasoning_output_tokens": 226
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 35145,
      "cached": 160512,
      "write": 0,
      "output": 611
    },
    "cost_usd": 0.0924512,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T19:17:18.541Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "fullTicket, backList and paneTone retain the required navigation, id, title and status pill. Passing 0583 AC1 tests cover the lanes and status colours. panel-base.css confirms --run matches the accent in both themes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "paneTrack renders the four named bars and their progress and waiting states. Passing 0583 AC2 tests cover draft through shipped. The replacement --blue token matches the accent in both themes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "paneFacts renders the six requested facts in two columns, using auto_ship_why from statusData. Passing 0583 AC3 tests cover models, shipping explanations and missing fields."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "fullTicket, criteriaPassed, paneRows and shipBar retain the outcome, reviewer ticks, navigation rows and bottom actions. Passing 0583 AC4 tests exercise pack navigation, log loading, shipping and change requests."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The Delivery log lists the updated old-look tests. The latest supplied run reports 1,829 passes, zero failures and three skips. panel-0167.test.mjs is unchanged; the CSS fix removes the prohibited token usage without changing the colours."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The merged change preserves the redesigned ticket view. The colour fix keeps its appearance while satisfying the existing style checks. All criteria pass, with no blocking issues found."
  }
}
```

</details>
