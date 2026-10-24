---
id: "0444"
title: "Keep the review pack's Result column readable"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-keep-the-review-pack-s-result-column-readable.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0440"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T07:51:53.232Z"
approved: "2026-10-24T08:05:14.230Z"
finished: "2026-10-24T08:17:58.785Z"

---
# 0444 · Keep the review pack's Result column readable

**Status:** ✅ done

## Problem
In a review pack's acceptance-criteria table, the Result column is squeezed to one letter wide, so its heading reads one letter per line and the header row is very tall.

## Outcome
The Result column is wide enough for its heading and its mark.

## Acceptance criteria
1. In a review pack's acceptance-criteria table, at 1280 px and 1440 px wide, the Result column is at least as wide as its heading and its widest mark, so `Result` reads on one line, and the table doesn't reach past the pack's right edge.
2. On a narrow screen, where 0158 stacks each row, each criterion's result still shows beside its number, as today.

## Out of scope
- The pack's other tables.

## Notes
- For release 0.15.0 (0452). The user asked on 2026-10-24 for everything relevant to the release to be ticketed.
- Seen in the builder's pictures for 0423. The columns share out the width by their text, and Criterion and Evidence take nearly all of it.
- Waits for 0440: both change `templates/panel.css`.
- Failing before this build: none
- Self-check: no changes

## In plain words
In a review pack's table of acceptance criteria, the Result column is now wide enough for its heading and its tick or cross. The heading reads "Result" on one line instead of one letter per line, so the heading row is no longer very tall. To see it, open the review pack of any approved ticket on a laptop-sized window. On a phone the table still stacks each criterion, with its result beside its number.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 123,194
- Elapsed since build started: 13 min
- Changed lines: 3 (limit 5000)
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
    "reviewed_sha": "3a1d8a39252a7b1b824b1d89d5fc829245e6c6b8",
    "session": "fresh",
    "thread_id": "01a16cf0-4fa3-7390-88c4-bd8d6b055a6c",
    "builder_response": "- Tests run: `speck test --related test/panel-0444.test.mjs` (the ticket's own file, plus the 271 existing test files that name templates/panel.css or the ticket; all 2490 pass).\n- Cause: `#full-ticket .md` sets `overflow-wrap: anywhere`, which lets the Result column's min-content width fall to one letter, so table layout gave nearly all the width to Criterion and Evidence. The fix keeps only the criteria table's Result heading and cells from wrapping (`white-space: nowrap; overflow-wrap: normal`), so the column is as wide as `Result` and its mark. The narrow layout (0158) is untouched and still puts the result beside the number.\n- The tests use a real browser because the criteria are about column widths, which only real table layout computes.\n- Pictures at 1280 px in both looks are kept with the pack. The marks show as boxes there only because this machine's headless Chromium has no emoji font.\n",
    "seconds": 56,
    "usage": {
      "input_tokens": 122677,
      "cached_input_tokens": 85248,
      "cache_write_input_tokens": 0,
      "output_tokens": 517,
      "reasoning_output_tokens": 12
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T08:05:06.740Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.css applies nowrap and normal overflow wrapping only to the ac-table's third column. The passing '0444 AC1' browser test measures heading and mark widths, single-line rendering and containment within the pack at 1280 px and 1440 px."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The existing mobile flex layout in templates/panel.css still places the third cell after the number. The passing '0444 AC2' browser test verifies all three results sit beside their numbers at 375 px."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The Result heading and marks stay readable at both desktop widths, and results remain beside criterion numbers on mobile. The change is limited to the acceptance-criteria table. Both browser tests passed; no blocking issues found."
  }
}
```

</details>
