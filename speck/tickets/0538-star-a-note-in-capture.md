---
id: "0538"
title: "Star a note in Capture"                # one outcome, no "and"
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
after: ["0537"]                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-28T10:44:00.141Z"
approved: "2026-10-28T13:27:02.842Z"
blocked_at: ""
waited_seconds: 8467

---
# 0538 · Star a note in Capture

**Status:** 👍 approved

## Problem
Scrolling through Capture, you can't tell which notes you liked before, so the ideas you care about get lost among dozens of inbox notes and older ideas.

## Outcome
You can star a note in Capture, and a starred note shows a filled star on its card so you can spot it while scrolling.

## Acceptance criteria
1. Every card in Capture has a star button on its closed row. Tapping it stars the note: the star fills, and the note's file gains a `Starred: yes` line on its own line straight after its `Captured:` line. Tapping a starred note's star unstars it: the star empties and that line is removed. Tapping the star doesn't open or close the card.
2. Whether a note is starred is read from its `Starred: yes` line, so a note starred on one device shows as starred after a reload and on any other device that opens the panel. A note without the line, or with any other value, shows as not starred.
3. Starring or unstarring changes nothing else: every other line of the note stays as it was, its status is unchanged, Capture's order is unchanged (a star is only a mark), and no commit is made.
4. If the note is gone, or its status is no longer `idea` or `inbox`, when the star is tapped, the panel changes no file and shows the server's reason on the card. The star button can be reached and pressed with the keyboard, says whether the note is starred to a screen reader, and its filled and empty looks are clear in the light and dark looks (checked by review).
5. No test that passed before this change fails, apart from tests that Capture has no buttons and writes nothing (0520's criterion 3), which change to allow only the star.

## Out of scope
- Sorting or filtering by star: the user wants only a mark (2026-10-27).
- Starring from chat or the command line, and stars on tickets.
- Any other way to change a note from the panel: ticketing, dropping and editing stay in chat.

## Notes
- Asked for by the user 2026-10-27: "I just wanted to visually just put a star on an idea so that when I'm scrolling through I can just visually see which ones I really like." "It's literally just a mark."
- Decided 2026-10-27: this is a narrow exception to 0520's rule that Capture is managed only in chat. The star is the only thing Capture may write, and only the `Starred:` line. The brief says so where it describes Capture.
- Today: Capture's cards are `captureItem` and `noteItem` in `templates/panel.js`; the panel's routes are in `scripts/panel.mjs`; the board feed keeps ideas by path (`KEYED` in `scripts/board-feed.mjs`), so the star shows on the next board update.
- After 0537, which changes Capture's sort and the note formats, and 0536, which changes Capture's lane in `templates/panel.html` and `templates/panel.js`; all three edit the brief's sentence on Capture.
- Failing before this build: none
- Self-check: an earlier star press answered late no longer undoes a later one; a board after the server's answer now wins over the pressed value; the focus goes back to the star after a press; the star is drawn rather than typed, as the panel's fonts have no star character; `Starred:` lines are read and written only in the note's header, before its first `## ` section.
- Handed back by speck run's ship queue 2026-10-28: 0039, 0140, 0161 and 0435's checks failed. Fixed all but 0039's: the star is now a 44 px boxed button, its top level with the title, using the panel's own focus ring. 0039 AC3 needs the user's answer above.
- `scripts/panel.mjs` was at its 600-line limit, so `panelUrl` (the `--url` parsing) moved, unchanged, to `scripts/panel-url.mjs` to make room for the star's route.
- Went with the recommendation: (a) let 0039's check leave out the star (chosen by the user in the panel, 2026-10-28 13:25 UTC).

## In plain words
Every note in Capture now has a star in a small box at the right of its title. Tap it and the star fills in; tap it again and it empties. It's only a mark: the note doesn't move, nothing else about it changes, and nothing is committed. The star is saved in the note itself, so it still shows after a reload and on your phone.

To see it, open Capture in the panel and tap the star on any note. If a note was ticketed or dropped in chat a moment before you tap, the card says why it couldn't be starred instead.

Worth knowing: starring edits the note file in your main checkout, so it shows up as an uncommitted change there until the note is next committed.

## Blocked question
An older check (from ticket 0039) says that pressing anything on a note card's top row opens or closes the card. The star sits on that row and, as this ticket asks, doesn't open the card, so that check fails, and this ticket says no older check may change except 0520's. Which should give way? (a) Let 0039's check leave out the star, the one thing on the row that doesn't open the card (nothing you'd notice changes). (b) Move the star off the top row, which breaks a different older check (0435: a closed card has nothing but its top row), so that check would change instead. (c) Let pressing the star also open or close the card, which goes against this ticket's first criterion. I recommend (a): it keeps the star where it is and keeps the card the same height, and the star not opening the card is what you asked for.

Recommended: (a) let 0039's check leave out the star
Changes what you'd notice: yes
Clear winner: yes

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 400,000
- Elapsed since build started: 163 min
- Changed lines: 199 (limit 5000)
- Follow-ups (Delivery log only, no inbox note): the README's line on Capture still says it lists notes "to read"; it could mention the star next time the README is edited.

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
    "reviewed_sha": "293d2e2864ddad7b8a5448f4b56f22d09d3d9c08",
    "session": "fresh",
    "thread_id": "01a18227-bea6-7c12-be99-a033e89fdf04",
    "builder_response": "- Tests run: speck test --related test/panel-0538.test.mjs test/panel-0520.test.mjs test/panel-0067.test.mjs (the ticket's own file, 0520's changed file, and every existing test file naming a changed file)\n- AC5: 0520 AC3's test now allows exactly one button per Capture card, the star, and still checks nothing else is there and that reading sends nothing.\n- scripts/panel.mjs was at its 600-line limit (test/split-0078), so panelUrl moved unchanged to scripts/panel-url.mjs.\n- Pictures: Capture with one note starred, light and dark looks.\n",
    "seconds": 34,
    "usage": {
      "input_tokens": 139727,
      "cached_input_tokens": 86528,
      "cache_write_input_tokens": 0,
      "output_tokens": 856,
      "reasoning_output_tokens": 94
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 53199,
      "cached": 86528,
      "write": 0,
      "output": 856
    },
    "cost_usd": 0.1236108,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-28T10:57:19.402Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js starButton and setStar provide toggling without bubbling to the card. scripts/panel-star.mjs starredText inserts/removes the header line. Passing 0538 AC1 tests exercise the buttons and disk changes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel-model.js reads the header's Starred: yes line. Passing 0538 AC2 tests cover other values, refreshed boards, reloads and the real server's disk-to-board behaviour."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panelStarNote writes only starredText's result and makes no commit; Capture's sorting remains date-based. Passing 0538 AC3 tests check other lines, status, commit history and order."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "panelStarNote refuses missing or ineligible notes; setStar displays the returned reason. Passing AC4 tests exercise refusals and focus retention. Review confirms native keyboard-accessible buttons, aria-pressed state, visible focus and outlined/filled SVG stars using light and dark theme colours."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The recorded related-test run reports 1,257 passed, zero failed and three skipped. The updated 0520 AC3 test permits only each card's star and continues checking that reading notes sends no writes."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Capture now lets you star and unstar notes without opening them or changing their order. Stars persist in the note files, and refused changes show a reason on the card. The reviewed tests pass, and no blocking concerns were found."
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
    "reviewed_sha": "622072579e307502b3883341dae56904101d2c01",
    "merge": true,
    "session": "continued",
    "thread_id": "01a18227-bea6-7c12-be99-a033e89fdf04",
    "builder_response": "- Tests run: speck test --related test/panel-0039.test.mjs test/panel-0140.test.mjs test/panel-0161.test.mjs test/panel-0435.test.mjs test/panel-0520.test.mjs test/panel-0538.test.mjs test/panel-0067.test.mjs (1297 passed, 0 failed)\n- Why this round: speck run's ship queue handed it back (main had nothing new, so the failures were this ticket's). Failing were 0039 AC3, 0140 AC4 (x2), 0161 AC1-3 (light, dark) and AC4 (x2), and 0435 AC5 (x2).\n- 0140, 0161, 0435: the star is now a 44 px square button boxed with a --muted edge (--warn once starred), its top level with the title and reaching 20 px down beside the second line (margin-bottom -20px), so a closed card is still two rows and no taller. Its own 1 px focus outline is gone: the panel's 2 px :focus-visible ring applies (templates/panel-cards.css).\n- 0039 AC3: its test pressed every node on a note's top row and expected the card to toggle, but 0538 AC1 says the star must not. That contradicts AC5's \"only 0520's test changes\", so the ticket was blocked; the user chose option (a), recorded in the ticket's Notes: 0039's test now skips the star and what's inside it, and checks every other top-row node as before.\n- Pictures retaken (light and dark) with the boxed star.\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 258016,
      "cached_input_tokens": 196608,
      "cache_write_input_tokens": 0,
      "output_tokens": 1401,
      "reasoning_output_tokens": 94
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 8209,
      "cached": 110080,
      "write": 0,
      "output": 545
    },
    "cost_usd": 0.032876,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-28T13:26:59.242Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js starButton stops click propagation and setStar toggles the mark. scripts/panel-star.mjs starredText inserts/removes the header line. Passing 0538 AC1 tests exercise UI toggling and file changes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel-model.js reads Starred: yes from the header. Passing 0538 AC2 tests cover other values, board updates, reloads and the real server's disk-to-board behaviour."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panelStarNote changes only the Starred header lines and makes no commit; Capture sorting remains unchanged. Passing AC3 tests check other lines, status, commit history and order."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 tests cover missing/ineligible notes, displayed server reasons, accessible state and focus retention. Review confirms a native 44px button, the shared 2px focus ring, and distinct outlined/filled stars using light and dark theme colours."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The current recorded run reports 1,297 passed, zero failed and three skipped, including the previously failing files. The ticket records the user's authorisation to exclude the star from 0039's top-row toggle test; all other top-row nodes remain checked."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Starring persists correctly without moving notes or changing their status. The button now meets the panel's size and focus conventions, and the previously failing checks pass. The older card-opening test was adjusted as authorised by the user. No blocking concerns remain."
  }
}
```

</details>
