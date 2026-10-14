---
id: "0158"
title: "Stack review pack tables on a phone"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-13
started: "2026-10-14T00:24:47.550Z"

---
# 0158 · Stack review pack tables on a phone

**Status:** 🔍 reviewing

## Problem
On a phone, the review pack's acceptance criteria table is squeezed into four narrow columns: the "Result" heading breaks into "Re / su / lt", and the criterion and evidence run down the screen a few words at a time, so a pack is hard to read where the user often reads it before shipping.

## Outcome
On a phone, each row of a table in the review pack or a ticket shows as its own block with every cell labelled by its column heading, so nothing is squeezed.

## Acceptance criteria
1. At viewports under 700 px, every Markdown table shown in the full ticket pane (review pack and full ticket) and in opened Plan notes shows each row as a separate block: each cell on its own line, labelled with its column heading in small muted capitals, in the same order as the columns.
2. In a review pack's acceptance criteria table on a phone, each block starts with the criterion's number and its result (for example "1 ✅") on one line, then the criterion, then "Evidence" and its text.
3. Blocks have a visible line or space between them, and no heading or word breaks inside itself (no "Re / su / lt").
4. At 700 px wide and over, tables look as they do today. Copying a table's text still copies every cell's content.
5. No test that passed before this change fails.

## Out of scope
- What the review pack says or how `speck pack` writes it.
- Tables anywhere else in the panel.

## Notes
- Tables come from `markdown(…, { tables: true })` and `mdBlocks()` in `templates/panel.html`; the review pack is `packPane()`. Today at under 700 px a table only scrolls sideways (`display: block; overflow-x: auto`), which the pack's long cells defeat.
- The criteria table's columns are `#`, `Criterion`, `Result` and `Evidence`.
- Reported 2026-10-13 from a phone screenshot of 0149's review pack.
- Failing before this build: none
- The full ticket pane shows a ticket's own sections without formatting tables (0132 formats them only in the review pack), so the tables there are the review pack's. The phone layout applies to every formatted table in the pane and in opened Plan notes.
- In a criteria table, the number, criterion and result go unlabelled on a phone, as AC2's example ("1 ✅", then the criterion) asks; only Evidence carries its label. Every other table labels every cell (AC1).
- Self-check: restored the review pack's 44 px findings summary rule, which an edit had dropped (caught by 0140's tap-target test); no other changes.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "37e7525776d9e60a14107261f8b59c66ba5462ab",
    "thread_id": "01a137d2-f383-79d1-859f-167539d42423",
    "seconds": 31,
    "usage": {
      "input_tokens": 99140,
      "cached_input_tokens": 57472,
      "cache_write_input_tokens": 0,
      "output_tokens": 831,
      "reasoning_output_tokens": 140
    },
    "saved_at": "2026-10-14T00:32:45.487Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: mdBlocks() assigns column headings to cells; mobile CSS stacks rows and labels cells. Passing 0158 AC1 browser test exercises review pack tables and an opened Plan note at 375 px."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "mdBlocks() marks the criteria table; mobile .ac-table rules place number and result together before criterion and evidence. Passing 0158 AC2 browser test measures their positions."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "Mobile rows have spacing and borders, but templates/panel.html:367 explicitly sets overflow-wrap: break-word on cells. Long evidence paths or other words exceeding the available width will split internally. The passing AC3 test uses only words short enough to fit."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Layout changes are confined to the existing media query below 700 px. Passing AC4 browser tests check desktop table layout and drag selection containing every cell at both 375 and 1280 px."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0158-tests.txt: 1403 tests, 1400 passed, zero failures, three skipped; all eight 0158 tests passed. Existing tests were not changed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:367",
        "issue": "Cells still break long words internally because overflow-wrap is set to break-word. File paths in review evidence can readily exceed a phone's available width, violating AC3. The test checks only short words and misses this case.",
        "suggested_fix": "Preserve words in mobile table cells and provide overflow handling for tokens wider than the block. Extend the browser test with a long evidence path or unbroken word and verify it stays on one line while remaining readable and copyable.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Phone tables now form clearly separated blocks, with the requested criteria layout, and desktop layout and copying are covered by passing tests. One requirement remains unmet: long words, including evidence file paths, can still break across lines."
  }
}
```

</details>
