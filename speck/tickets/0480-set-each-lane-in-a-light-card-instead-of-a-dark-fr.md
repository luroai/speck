---
id: "0480"
title: "Set each lane in a light card instead of a dark frame"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: []                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T18:03:26.428Z"
approved: "2026-10-24T18:12:52.470Z"

---
# 0480 · Set each lane in a light card instead of a dark frame

**Status:** 👍 approved

## Problem
Since 0478 each lane sits in a dark frame as heavy as speck's screen above it. On a phone the two black slabs compete, so the screen no longer stands out, and the frame's title bar and edges take room from the tickets.

## Outcome
Each lane is a light card with a thin edge and its name in dark dot-matrix letters, so speck's screen is the only dark frame on the page and the tickets get more room.

## Acceptance criteria
1. Plan, Build and Shipped are each a card on the lane's own background (`--panel`) with a hairline edge in the line colour (`--line`) and rounded corners, 16 px in from the column's sides as today. Nothing in or round a lane is in the screen's frame colour (`--bezel`), in the light and dark looks.
2. Each card's top row has the lane's name in the dot-matrix letters (Doto, as today) in the text colour, after a dot in its stage's colour (grey for Plan, blue for Build, purple for Shipped), with the lane's line (such as `1 in flight · 0 queued`) at the row's right in the muted colour. A thin line in `--line-soft` separates the row from the tickets under it. Every word reaches 0161's contrast on the card in both looks, and Plan's grey dot is at least 3:1 on the card.
3. With the same tickets at 390 × 844, the open lane's ticket list is taller than before this change, in Plan, Build and Shipped, checked in a real browser by comparing its height with and without the change.
4. Swiping, the strip, the ← and → keys and each lane's own scroll place work as before (0476, 0477). No test that passed before this change fails.

## Out of scope
- The strip under speck's screen (0481).
- The Pipeline log's dark frame (0479): it fills the window, so it doesn't sit beside speck's screen.
- The tickets' own cards and what they show.

## Notes
- Asked for by the user on 2026-10-24, from a phone screenshot of the Build lane: "there's too much black border … less space for tickets … it distracts away from the main lcd screen but I like the layout and swipe." From the mock-up's four looks (https://claude.ai/artifact/F9FWtouNDenRB3K4djw47y) the user chose B, the light card with its name.
- Today: `main > section`, `.lane-title`, `.lane-n`, `.sh` and `.lane-list` under 0478's comment in `templates/panel-cards.css`, and `--bezel-step` (Plan's dot on the dark frame) in `templates/panel-base.css`. The Pipeline log (0479, `templates/panel-popups.css`) has its own rules for its frame, so this change leaves it as it is.
- Failing before this build: none
- Self-check: the card's edge was drawn behind the lane's list, which hid its right side along the list in a real browser, so the edge is now drawn over the lane's contents and the card's fill is the lane's own background cut to inside its padding; a test checks the edge is drawn on top.
- Tests superseded by this change: 0478's checks of the dark frame's colour, corners and light ink, 0161's list of lane rules on the frame, and 0479's check that the Pipeline log's 4 px frame matches a lane's: each now checks the light card, and 0479's keeps its own 4 px.

## In plain words
Plan, Build and Shipped now each sit in a light card with a thin grey edge, instead of a dark frame, so speck's screen at the top is the only dark block on the page. Each lane's name is still in the dot-matrix letters, now dark on the light card, with its coloured dot and its count beside it. The ticket list in each lane is a few pixels taller on a phone. To see it, open the panel on a phone or in a narrow window and swipe between the lanes, in both the light and dark looks. Worth a look: the Pipeline log keeps its dark frame, as the ticket asked, so it no longer matches the lanes.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 113,842
- Elapsed since build started: 9 min
- Changed lines: 33 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none. The Pipeline log (0479) keeps its dark frame by this ticket's scope; whether it should follow the lanes is the user's call.

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
    "reviewed_sha": "3e77d6a981e807bc49e4f341a1612f20cf1df44a",
    "session": "fresh",
    "thread_id": "01a16f1d-1c65-78a1-8ba9-f6d880a27b2e",
    "builder_response": "- Tests run: test/panel-0480.test.mjs test/panel-0478.test.mjs test/panel-0161.test.mjs test/panel-0476.test.mjs test/panel-0477.test.mjs test/panel-0438.test.mjs test/panel-0418.test.mjs test/panel-0427.test.mjs test/panel-0413.test.mjs test/pipeline-0479.test.mjs test/panel-0140.test.mjs test/panel-0151.test.mjs test/panel-0155.test.mjs test/panel-0167.test.mjs test/panel-0160.test.mjs test/panel-0425.test.mjs, with `--related` (which also brought in panel-0417, 0430, 0469 and 0472).\n- The card: the lane's own fill (`--panel`, cut to inside its 8/16 px padding, corners 28/20 less that padding = 12 px) and a `.5px solid var(--line)` edge drawn by `main > section::before`, over the lane's contents (z-index 1, pointer-events none), so the scrolled list never hides the edge. `--bezel-step` is gone; Plan's dot is `--line`.\n- Existing tests changed because this ticket replaces 0478's dark frame: 0478's colour, corner and ink assertions (now the text and muted colours, frame colour checked in 0480's tests instead), and its line-right-end tolerance (the row now has 14 px padding inside the card's edge); 0161's `onFrame` no longer treats lane rules as on `--bezel`, so they're checked against the surfaces; 0479's Pipeline log keeps its own 4 px frame (out of scope here), so its test no longer derives it from the lane list's margin.\n- AC3 test lays 0478's lane rules back over the page to measure \"before\", then compares each lane's list height.\n- AC4: the 0476 and 0477 tests (swipe, strip, keys, scroll places) are in this run and pass.\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 113110,
      "cached_input_tokens": 66816,
      "cache_write_input_tokens": 0,
      "output_tokens": 732,
      "reasoning_output_tokens": 33
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T18:12:43.972Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-cards.css draws each lane with --panel, a .5px --line edge, 12px corners and 16px side gaps. Passing panel-0480 browser tests check all three lanes in both themes and exclude frame colours."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The lane title, dot, count and separator rules use the required fonts and colours. Passing panel-0480 tests check both themes, text contrast and Plan's dot contrast; panel-0478 checks title-row alignment and truncation. panel-0161 checks text contrast throughout the stylesheet."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing panel-0480 AC3 test measures each list in a real browser at 390 × 844, then overlays the previous lane layout rules with the same tickets and confirms every new list is taller. The restored rules match the previous layout's relevant dimensions."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The full recorded output confirms passing 0476 tests for swiping, arrow keys, lane selection and preserved scroll positions, plus 0477 strip tests. The submitted run has 303 passes, zero failures and three skips; the 0480 browser tests ran successfully."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The lanes now use lightly edged cards, leaving the main screen visually prominent and giving every ticket list more height on a phone. Both themes meet the contrast checks, and navigation and scroll behaviour remain covered by passing tests. No blocking concerns found."
  }
}
```

</details>
