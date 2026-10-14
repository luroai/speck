---
id: "0158"
title: "Stack review pack tables on a phone"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
approved: "2026-10-14T00:37:36.588Z"
finished: "2026-10-14T00:39:05.776Z"

---
# 0158 · Stack review pack tables on a phone

**Status:** ✅ done

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
On a phone, tables in the review pack and in opened Plan notes no longer squeeze into narrow columns. Each row now shows as its own block, with a thin line between blocks, and each entry has its column's name above it in small grey capitals. In the acceptance criteria table, each block starts with the criterion's number and its result together (for example "1 ✅"), then the criterion, then the evidence. To see it, open an approved or shipped ticket's review pack on a phone, or in a browser window narrower than 700 pixels. On a wider screen, tables look as they did before. Worth knowing: a single word too long for the screen, such as a long file path, stays whole and can be swiped sideways inside its own entry, and a line may still break after a hyphen, as it would in a sentence.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Cells still break long words internally because overflow-wrap is set to break-word.
Round 2 (codex): changes requested: F2 Phone copying verification now fails, leaving AC4 unverified.
Round 3 (codex): approve.

## Delivery log
- Review rounds: 3
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 589,786
- Elapsed since build started: 13 min
- Changed lines: 27 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (known limits, no inbox notes):
- A word wider than a phone screen (for example a long file path with no spaces or hyphens) scrolls sideways inside its own cell rather than wrapping.
- Lines may break after a hyphen inside a path, as at a space.

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

<details><summary>Round 2 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "539f1b821dda5d8eaf9b45ee5e98400b5fff30cf",
    "thread_id": "01a137d2-f383-79d1-859f-167539d42423",
    "seconds": 22,
    "usage": {
      "input_tokens": 193148,
      "cached_input_tokens": 144256,
      "cache_write_input_tokens": 0,
      "output_tokens": 1437,
      "reasoning_output_tokens": 140
    },
    "saved_at": "2026-10-14T00:35:22.623Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "mdBlocks() retains cell heading labels and scoped mobile stacking rules. Both AC1 tests pass, including browser coverage of the review pack and opened Plan note."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The .ac-table ordering rules remain intact; the AC2 browser test passes with the expanded evidence fixture."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html:367 now uses overflow-wrap: normal and cell-level horizontal scrolling. The passing AC3 browser test includes a long unbroken token and checks word integrity, block separation and absence of page or pane horizontal overflow."
      },
      {
        "id": 4,
        "status": "unclear",
        "evidence": "Desktop layout and desktop copying tests pass. The 375 px copying test fails because selected text omits the rounds table's request_changes cell. Its drag helper does not scroll target text into view, so the expanded fixture may invalidate its coordinates; phone copying needs reliable verification."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The full test log reports 1399 passes, one failure and three skips. The sole failure is the newly added 0158 copying test; no test from before this build fails."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:367",
        "issue": "Long words previously split internally in mobile table cells.",
        "suggested_fix": "Implemented: normal word wrapping with cell-level scrolling, covered by the expanded AC3 browser test.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/panel-0158.test.mjs:220",
        "issue": "Phone copying verification now fails, leaving AC4 unverified. The longer fixture pushes later table content down, while the test drags using bounding coordinates without first ensuring the target table is visible.",
        "suggested_fix": "Make the copy test scroll the target table and selection endpoints into view, handling pane scrolling as needed, while retaining assertions for every cell. If reliable selection still omits content, fix the implementation. Re-run the full suite.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The long-word issue is fixed, and phone blocks and desktop layout still pass their checks. Approval is held because the phone copying test now fails; it needs reliable verification with the longer evidence text."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "5a63d4af2dd53285eaac8746848a88cc62b7103c",
    "thread_id": "01a137d2-f383-79d1-859f-167539d42423",
    "seconds": 21,
    "usage": {
      "input_tokens": 293204,
      "cached_input_tokens": 241664,
      "cache_write_input_tokens": 0,
      "output_tokens": 2026,
      "reasoning_output_tokens": 140
    },
    "saved_at": "2026-10-14T00:37:27.820Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: mdBlocks() supplies column labels; scoped mobile CSS stacks table rows and cells. Passing AC1 browser test covers review pack tables and an opened Plan note at 375 px."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The .ac-table mobile rules place number and result together, followed by criterion and labelled evidence. Passing AC2 browser test verifies positions and labels."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Mobile rows have borders and spacing; cells preserve long words using overflow-wrap: normal and local scrolling. Passing AC3 browser test checks long tokens, labels, separation and page/pane overflow."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Responsive rules apply below 700 px only. AC4 desktop layout and copying tests pass. Updated copy tests scroll tables into view, recompute endpoints and retain assertions that every cell is selected at both 375 and 1280 px."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0158-tests.txt: 1403 tests, 1400 passed, zero failures and three skipped. All eight 0158 tests passed; existing tests were not changed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:367",
        "issue": "Long words previously split internally in mobile table cells.",
        "suggested_fix": "Fixed with normal word wrapping and cell-level scrolling, covered by the expanded AC3 browser test.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/panel-0158.test.mjs:220",
        "issue": "Phone copying verification previously failed because the expanded fixture pushed selection endpoints outside the viewport.",
        "suggested_fix": "Fixed by scrolling each table into view and recomputing endpoints before dragging. Every-cell selection assertions remain and pass at both viewport widths.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Phone tables now display as readable, separated blocks, with criterion numbers and results together. Long words remain intact, desktop tables retain their layout, and copying preserves every cell. All checks pass; both earlier findings are resolved."
  }
}
```

</details>
