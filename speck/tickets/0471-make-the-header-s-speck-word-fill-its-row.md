---
id: "0471"
title: "Make the header's speck word fill its row"                # one outcome, no "and"
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
after: ["0469"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T14:55:28.786Z"
approved: "2026-10-24T14:59:46.246Z"

---
# 0471 · Make the header's speck word fill its row

**Status:** 👍 approved

## Problem
The word "speck" in dot-matrix letters at the top of the panel is 20 px, small for the dark frame's title row it sits in, which is as tall as the 44 px Settings button beside it. It leaves the row looking empty.

## Outcome
The header's "speck" is bigger and fills its row better, without making the dark frame any bigger.

## Acceptance criteria
1. The word "speck" in the header is at least 28 px, in the same Doto lettering and weight, and its red dot grows with it, both centred in the title row.
2. The dark frame and its title row are exactly as tall and as wide as before this change, at every width from 320 px, with a mouse and with a touch screen, checked in a real browser by comparing their sizes with and without the change.
3. The word doesn't overlap the project and base branch or the Settings button: at 320 px the base branch still gives way first, cut short with `…`, as today.
4. No test that passed before this change fails.

## Out of scope
- The LCD screen under the title row, and its words.
- The Pipeline log's title (0470).

## Notes
- Asked for by the user on 2026-10-24, from a phone screenshot: "the title speck in the dot matrix font, I think it could be bigger. Make it bigger so that it doesn't expand the actual black border of the LCD screen, but … fit the space a little bit better."
- Today: `.bezel .name` in `templates/panel.css` is `Doto` at weight 900 and 20 px with `line-height: 1`, and its `::before` dot is 8 px.
- Waits for 0469, which sets the title row's height with a mouse. Re-chained by the user on 2026-10-24 so it builds side by side with 0476: this changes only the word in the screen's title row, in the header's styles, and 0476 the tabs and lanes.
- Failing before this build: none
- Self-check: no changes
- 0304 AC1 pinned the old 20 px size; it now checks the 32 px this ticket sets, as it was moved on by 0413 before.

## In plain words
The word "speck" at the top of the panel is now bigger, about one and a half times its old size, and its red dot has grown with it. It fills the dark frame's top row beside the Settings button, and the frame itself is no bigger than before.

To see it, open the panel on a phone or in a narrow window. On a very narrow screen the project and branch name beside the word is still the part that gets cut short with "…".

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 91,435
- Elapsed since build started: 4 min
- Changed lines: 7 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "12ddcac74217b8fc843992f638696804d16cefa7",
    "session": "fresh",
    "thread_id": "01a16e6c-5997-7d80-80e8-2df1bf200414",
    "builder_response": "- Tests run: test/panel-0471.test.mjs test/panel-0304.test.mjs, with --related (panel-0417, panel-0469, panel-0472), plus every test file that reads the header's name styles: panel-0147, panel-0161, panel-0366, panel-0413, panel-0426, panel-0427, panel-0438, pipeline-0470, release-0307.\n- The change: `.bezel .name` goes from 20 px to 32 px (Doto, 900, line-height 1 unchanged); its dot and gap are now in em (.375em, .25em), so they grow with the word (8 px dot at 20 px is .4em; 12 px at 32 px).\n- test/panel-0304.test.mjs AC1 pinned the old 20 px exactly (already moved once by 0413); it now checks 32 px. AC1 of this ticket requires a bigger size, so this test could not keep passing unchanged.\n- AC2 is checked in a real browser by measuring the frame and title row with the change, then with the old styles put back over it, at 320, 390, 600 and 1000 px, with a mouse and a touch screen.\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 90823,
      "cached_input_tokens": 66688,
      "cache_write_input_tokens": 0,
      "output_tokens": 612,
      "reasoning_output_tokens": 21
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T14:59:40.191Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-header.css sets the word to 32px in Doto at weight 900, with a 12px red dot. Flex alignment centres both. The static and real-browser 0471 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing real-browser test compares frame and title-row dimensions against restored original styles at 320, 390, 600 and 1000px, for mouse and touch. The unchanged flex layout and 44px Settings button keep row dimensions constant between sampled widths."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing real-browser 0471 test checks element boundaries, the whole word remaining visible and ellipsis truncation at 320px. The repo retains min-width: 0 and overflow: hidden while the word and Settings cannot shrink."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "/tmp/speck-0471-tests.txt confirms 209 passes, zero failures and three skips; the 0471 browser test ran and passed. The existing 0304 size assertion was appropriately updated for the requested enlargement."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The header word and red dot are bigger and centred, while the frame keeps its size. Browser checks confirm that narrow layouts still truncate the project and branch without overlapping the word or Settings. The change stays within scope, and the tests run show no failures."
  }
}
```

</details>
