---
id: "0366"
title: "Open the Foreman's detail in a pop-up over the whole panel"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-a-scrolling-dot-matrix-notice-board-in-the-header.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0365"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T16:12:45.625Z"
approved: "2026-10-22T16:21:04.619Z"

---
# 0366 · Open the Foreman's detail in a pop-up over the whole panel

**Status:** 👍 approved

## Problem
Pressing the Foreman's button opens its detail at the top of the page, under the header, where it pushes the page down and scrolls away as you scroll. It should stay in view while you read it.

## Outcome
Pressing the notice board opens the Foreman's detail in a pop-up over the whole panel.

## Acceptance criteria
1. Pressing the notice board (0365) opens a pop-up over the whole panel window, in the same look as a document's pop-up (0362), with a Close button and the Foreman's detail: the same sections and wording as the detail under the header today. The detail no longer opens under the header.
2. While the pop-up is open, nothing behind it can be clicked, scrolled or reached with Tab, and the focus moves into it. A long detail scrolls inside the pop-up.
3. Close and Escape close the pop-up, with the focus back on the notice board.
4. The pop-up stays up to date as the panel refreshes, as the detail does today. An answer being typed into one of the Foreman's questions (0318) keeps its text and focus through a refresh, and the Reload page button still reloads the page.
5. No test that passed before this change fails, except checks that the detail opens under the header, which are changed to check AC1.

## Out of scope
- What the notice board scrolls: 0365.
- What the detail says. Its sections and wording stay as they are.

## Notes
- Today: `#foreman`, `foremanOpen` and `renderForeman()` in `templates/panel.html` (0285, 0299, 0317, 0318, 0328).
- Share the pop-up from 0362 rather than making a second kind.
- Failing before this build: none
- Self-check: no changes

## In plain words
Pressing the Foreman's notice board in the header now opens its detail in a pop-up that fills the panel window, in the same look as a document's pop-up, rather than as a strip under the header that scrolled away. It says the same things as before, keeps itself up to date while it's open, and a long detail scrolls inside it. Close or Escape shuts it and puts you back on the notice board. While it's open, nothing behind it can be clicked or scrolled.

To see it, open the panel and press the notice board.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 106,963
- Elapsed since build started: 8 min
- Changed lines: 68 (limit 5000)
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
    "reviewed_sha": "449f7f07b5909c4197ea1a98290c3f025eccb271",
    "thread_id": "01a16469-f3ad-77c0-954c-87ed97839c57",
    "seconds": 29,
    "usage": {
      "input_tokens": 106150,
      "cached_input_tokens": 61824,
      "cache_write_input_tokens": 0,
      "output_tokens": 813,
      "reasoning_output_tokens": 137
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T16:20:56.959Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html moves #foreman after main and shares the document dialog's layout rules. renderForeman() preserves the existing detail sections and wording and adds Close. Both 0366 AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "renderForeman() moves focus into the dialog; pageHeld()/holdPage() make the background inert and prevent page scrolling. Shared CSS provides internal scrolling. The 0366 AC2 test passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Close and the Escape handler call closeForeman(), which closes the dialog and focuses #run. Both 0366 AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "renderForeman() refreshes the detail while retaining Close; render() restores the answer's text, focus and selection through askDrafts/askBoxes. Reload still calls location.reload(). All three 0366 AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The reported targeted run passed 254 tests with zero failures and three skips, including existing Foreman, answer, notice-board and document-dialog tests. No existing tests were weakened or changed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The Foreman's detail now opens over the whole panel, using the document pop-up's appearance. Closing, background isolation, live updates and typed answers are covered by passing tests. No blocking issues found."
  }
}
```

</details>
