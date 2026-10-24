---
id: "0479"
title: "Frame the Pipeline log like a lane card that fills the screen"                # one outcome, no "and"
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
after: ["0470", "0478"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T16:16:16.318Z"
approved: "2026-10-24T16:24:29.249Z"

---
# 0479 · Frame the Pipeline log like a lane card that fills the screen

**Status:** 👍 approved

## Problem
Pressing speck's screen opens the Pipeline log as a page that scrolls as a whole, with its title, Close and the log scrolling together. It doesn't look like the rest of the panel after 0478, where each lane is a framed card, and on a phone the whole page moving when you only want to read the log feels loose.

## Outcome
The Pipeline log is one framed card that fills the screen and stays still, and only the log inside it scrolls.

## Acceptance criteria
1. The Pipeline log fills the window's full height, and its full width up to the panel's column width (720 px, centred), inside a frame like a lane card's after 0478: the same `--bezel` colour, thickness and corners, clear of a phone's status bar and home indicator. Its title row shows speck's red dot and `Pipeline log` in the dot-matrix letters, with Close at the row's right-hand end.
2. Nothing but the log scrolls: the page and the frame never move, at every width from 320 px and every height from 480 px, and the log box takes all the room left inside the frame and scrolls on its own. Checked in a real browser at 390 × 844 and 1200 × 800 with 200 lines in the log.
3. While the page is running older code than the panel, a line saying so with its Reload page button sits inside the frame between the title row and the log, and the log box shrinks to make room, so the frame still fits the window and nothing else scrolls. When it goes, the log box grows back.
4. Close, Escape, a click outside and the focus work as before (0415), and the log keeps its lines, times, newest at the bottom and its reader's place (0459, 0460). No test that passed before this change fails.

## Out of scope
- What the log's lines say (0459, 0460).
- The other pop-ups.

## Notes
- Asked for by the user on 2026-10-24: "the same look as a card, so like that same border around it with the dot and the dot matrix text … I want it to be static … the border to go all the way around the full screen … only the log to be the thing that scrolls … when there's a reload … the border to kind of like reduce itself to accommodate it. I don't want any full page scrolling, only the actual console logs."
- The red dot is speck's own, as in the header's "speck", since the log is the whole pipeline's rather than one lane's.
- Mock-up of the lane cards' frame the user approved: https://claude.ai/artifact/3sE9DU2PdnsvR6p1tLNw8j
- The panel stays thin (decided 2026-10-24), so on a wide window the frame is as wide as the panel's column, not the whole window.
- Waits for 0470 (its `Pipeline log` title, in the pop-ups' files) and 0478 (the lane card's frame, which this reuses).
- Failing before this build: none
- The frame lines up with the lane cards' frames: the pop-up's column is the lanes' 720 px column, and the frame sits inside it with the lanes' 16 px sides and 8 px gap above and below, so on a wide window it's 688 px wide, exactly over the lane frames.
- Below 480 px high (outside AC2), the log box keeps at least 12 lines and the pop-up scrolls instead, its title row held at the top, as 0470 AC3's 200 px check expects.
- A stale page's line sits on the frame itself, in the frame's light ink, with Reload page boxed as Close is on the frame, so the log box keeps its own corners (0459).
- Existing tests updated for the frame: 0161 (what's in the Pipeline log's frame sits on --bezel, and its dot holds no text), 0366 (the pop-up no longer shares the document pop-up's layout, only its Close; its column is the lanes'), and 0379 (the Pipeline log no longer scrolls as a whole with a page-coloured top row, which AC2 replaces; the document pop-up and Settings are still checked).
- Self-check: added a real-browser check that the log opens on its newest line in the new layout; no code changes

## In plain words
Pressing speck's screen now opens the Pipeline log as one dark framed card, like the Plan, Build and Shipped cards, with speck's red dot and "Pipeline log" in the dot-matrix letters at the top and Close at the right. The card fills the screen and stays still: only the log inside it scrolls. On a wide window it lines up with the lane cards rather than stretching across. When the page is out of date, the Reload page line appears inside the card above the log, and the log gets shorter to make room. To see it, press speck's screen on a phone and scroll the log. On a very short window (under 480 px high), the whole card scrolls instead, so the log still has room.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 120,971
- Elapsed since build started: 8 min
- Changed lines: 36 (limit 5000)
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
    "reviewed_sha": "0772c8b0b6004596dede101f244d622f6411d4b0",
    "session": "fresh",
    "thread_id": "01a16eb9-ec41-76a2-a599-f0e62bead2cb",
    "builder_response": "- Tests run (speck test --related): test/foreman-0299.test.mjs test/pack-0362.test.mjs test/foreman-asked-0328.test.mjs test/foreman-answer-0318.test.mjs test/foreman-0285.test.mjs test/foreman-0317.test.mjs test/pack-0363.test.mjs test/panel-0161.test.mjs test/panel-0410.test.mjs test/panel-0366.test.mjs test/panel-0424.test.mjs test/panel-0379.test.mjs test/panel-0368.test.mjs test/panel-0417.test.mjs test/panel-0364.test.mjs test/panel-0453.test.mjs test/panel-0434.test.mjs test/panel-0427.test.mjs test/panel-0413.test.mjs test/panel-0428.test.mjs test/panel-0426.test.mjs test/pipeline-0458.test.mjs test/panel-0445.test.mjs test/panel-0454.test.mjs test/pipeline-0479.test.mjs test/panel-0473.test.mjs test/pipeline-0415.test.mjs test/panel-0472.test.mjs test/pipeline-0470.test.mjs test/pipeline-0459.test.mjs  test/panel-0478.test.mjs test/panel-0438.test.mjs, plus the related files and the checks it adds\n- Changes: templates/panel-popups.css only (the Pipeline log's own rules split from the document pop-up's, and framed). Existing tests updated for the frame: 0161, 0366, 0379. The ticket's Notes say why.\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 120327,
      "cached_input_tokens": 70784,
      "cache_write_input_tokens": 0,
      "output_tokens": 644,
      "reasoning_output_tokens": 12
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T16:24:22.366Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-popups.css frames #foreman with lane colours, 4 px sides, 12 px corners, safe-area padding and the centred lanes' column. Passing 0479 AC1 browser tests verify dimensions, title lettering, red dot, Close and safe areas."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing 0479 AC1 and AC2 browser test uses 200 lines at 390 × 844 and 1200 × 800, checks additional sizes from 320 × 480, and verifies that scrolling moves only the log."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0479 AC3 browser test shows and removes the stale-page message and Reload page button at three sizes, verifying that the log shrinks and grows while the frame remains fixed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing 0479 AC4 test exercises Close, Escape, outside click and focus restoration. Existing 0415, 0459 and 0470 coverage remains; the new browser test also verifies opening on the newest line. Recorded run: 407 passed, zero failed, three skipped."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The Pipeline log now fills a stationary frame matching the lane cards, with only its log scrolling. The reload notice fits inside the frame, and existing controls and log behaviour are preserved. Browser checks and regression tests passed; no blocking concerns found."
  }
}
```

</details>
