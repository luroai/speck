---
id: "0158"
title: "Stack review pack tables on a phone"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0158 · Stack review pack tables on a phone

**Status:** 📋 ready

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

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
