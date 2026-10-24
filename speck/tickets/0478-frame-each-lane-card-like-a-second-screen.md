---
id: "0478"
title: "Frame each lane card like a second screen"                # one outcome, no "and"
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
after: ["0477"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T15:54:21.320Z"
approved: "2026-10-24T16:05:16.956Z"

---
# 0478 · Frame each lane card like a second screen

**Status:** 👍 approved

## Problem
After 0476, each lane is a card you slide between, but it doesn't look like part of the same device as speck's screen above it. The user wants the panel to read as two screens: speck's screen on top for the overall view, and a second one under it where the tickets live.

## Outcome
Each lane card has a dark frame like speck's screen, thinner, with its lane's name in the same dot-matrix letters and a coloured dot for its stage.

## Acceptance criteria
1. Each lane card (Plan, Build and Shipped) has a frame in the colour of speck's screen's frame (`--bezel`), with the same corner rounding, and a title row in that frame like the screen's, in both looks. Its sides and bottom are thinner than the screen's frame, and its tickets sit inside it on the lane's own background.
2. The card's title row shows the lane's name in the dot-matrix letters and weight of the header's "speck" (Doto), in the frame's light ink, with a coloured dot before it as "speck" has: grey for Plan, blue for Build and purple for Shipped, the colours 0461 gives a step not started, Build and Ship. The lane's line, such as `1 in flight · 8 queued`, moves from above the tickets to the right-hand end of the title row, in the frame's muted ink, and gives way first with `…` when the row is short of room.
3. Every lane's frame is the same colour and size: only the title and the dot change from lane to lane, along with the tickets inside.
4. Sliding between lanes moves the whole framed card, title and frame included. At every width from 320 px, the frame keeps all four sides in view and the title row on one line, checked in a real browser in both looks. No test that passed before this change fails.

## Out of scope
- The lane strip (0477) and how the lanes slide (0476).
- What each lane shows inside its card.

## Notes
- Asked for by the user on 2026-10-24: "a very similar border around the card for plan, build and shipped … two kind of Tamagotchi screens … don't make it as thick, but make the title of the card the same font as the speck dot matrix font, and also have a coloured dot … Don't colour the border for the card, keep it the same colour, just the dot and the title changes."
- Today: `.bezel` in the panel's styles (0413) is speck's screen's frame, `--bezel` with `padding: 5px 7px 7px` and a 2 px border, and `.bezel .name` its "speck" in `Doto` at weight 900 with an 8 px dot before it.
- Mock-up the user approved on 2026-10-24 ("that's exactly what I was thinking"): https://claude.ai/artifact/3sE9DU2PdnsvR6p1tLNw8j. It shows the frame, the title, the dot and the lane's line in the title row.
- The dots match 0461's step colours: grey for a step not reached, `--blue` for Build and the purple 0461 picks for Ship.
- Waits for 0477: both change the lanes' and the header's styles. Built for release 0.15.0.
- Failing before this build: none
- Plan's dot is 0461's grey for a step not reached, `--line`, at the dark look's value (`--bezel-step`) in both looks: the light look's `--line` is dark ink that wouldn't show on the dark frame.
- Existing tests updated for the frame: 0161 (the lane's title row sits on the frame, its dots hold no text), 0427 (the lane title may be Doto), 0438 (speck's frame lines up with the lane's frame, and the cards sit inside it) and 0476 (a sliding lane shows as a grid, not flex).
- Self-check: drew the frame on the lane itself rather than a pseudo-element, so the real-browser contrast check sees the title on the frame; kept the safe-area padding on the column

## In plain words
Plan, Build and Shipped now each sit in a dark frame like speck's screen at the top, so the panel reads as two screens: speck's above, and the lane you're looking at below. The frame is the same for every lane; only its title changes, written in the same dot-matrix letters as "speck", with a coloured dot before it: grey for Plan, blue for Build and purple for Shipped. The lane's count, such as "1 in flight · 8 queued", now sits at the right of that title and is cut short with "…" if there isn't room.

To see it, open the panel and swipe or tap between the lanes: the whole framed card slides. Worth a look on a small phone: the frame takes a little width, so the space round the ticket cards inside it is tighter than before, to keep them nearly as wide.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 151,011
- Elapsed since build started: 11 min
- Changed lines: 25 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - Tidy-up: 0438 AC2's test name still says the frame lines up with "the cards"; it now checks the lane's frame, with the cards inside it.

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
    "reviewed_sha": "7794a2306a48ec9a49c990fa0ef9b0b612f3cc5f",
    "session": "fresh",
    "thread_id": "01a16ea8-1528-70f2-bf27-ed15a76c77ee",
    "builder_response": "- Tests run: test/panel-0478.test.mjs test/panel-0438.test.mjs test/panel-0161.test.mjs test/panel-0427.test.mjs test/panel-0476.test.mjs test/panel-0418.test.mjs test/panel-0477.test.mjs test/panel-0425.test.mjs test/panel-0167.test.mjs test/panel-0160.test.mjs test/panel-0140.test.mjs test/panel-0449.test.mjs test/panel-0410.test.mjs test/panel-0413.test.mjs test/panel-0162.test.mjs test/panel-0453.test.mjs, with --related (which added 0417, 0430, 0469, 0472) and the repo checks.\n- The frame is the lane's own fill, cut to inside its padding (background-clip: content-box), so the lane still fills the column and slides whole (0476) with no border (0418), and the real-browser contrast check (0161) sees the title row on the frame. Its corners are 28px/20px less the 16px/8px padding: 12px, as the screen's.\n- Four existing tests encoded the old design and were updated, each with a 0478 comment: 0161 (the lane's frame and title row sit on --bezel; the dots hold no text), 0427 (.lane-title may be Doto, as .bezel .name), 0438 (speck's frame now lines up with the lane's frame, and the cards sit inside it, which AC1 requires) and 0476 (a sliding lane is shown as grid, not flex: it now checks display isn't none).\n- Plan's dot: 0461's grey for a step not reached is --line; on the frame, which is dark in both looks, it uses the dark look's --line value (--bezel-step), since the light look's would not show.\n- Pictures of all three lanes in both looks are in the review pack.\n",
    "seconds": 26,
    "usage": {
      "input_tokens": 150360,
      "cached_input_tokens": 105728,
      "cache_write_input_tokens": 0,
      "output_tokens": 651,
      "reasoning_output_tokens": 37
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T16:04:57.682Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-cards.css defines the shared --bezel frame, matching corners, thinner sides and bottom, and --panel ticket backgrounds. The 0478 real-browser tests passed in both looks."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The .lane-title, stage-dot and .lane-n rules provide Doto at weight 900, the specified inks and colours, and right-aligned ellipsis. Passing 0478 browser tests check these properties and force an overlong summary to truncate."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "All lanes use the same main > section frame rule. Passing 0478 browser tests compare their frame dimensions, colours and side thicknesses."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing 0478 browser tests check all frame sides and single-line titles at widths from 320 to 1280 px in both looks, plus movement of the frame and title during sliding. The saved test output confirms 304 passed, zero failed and three unrelated skips."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Each lane now looks like a second screen, with a thinner matching frame, dot-matrix title and coloured stage dot. Browser tests confirm the layout and sliding behaviour in both looks, including narrow screens. No blocking issues found."
  }
}
```

</details>
