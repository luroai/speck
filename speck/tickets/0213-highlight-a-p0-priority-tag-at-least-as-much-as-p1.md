---
id: "0213"
title: "Highlight a P0 priority tag at least as much as P1"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-10-highlight-p0-in-the-panel.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0236"]                # ticket ids that must be done first
created: 2026-10-15

---
# 0213 · Highlight a P0 priority tag at least as much as P1

**Status:** 📝 draft

## Problem
A fix ticket for a broken `main` is the most urgent thing on the board, but its P0 priority tag is plain grey, so it looks less important than a P1, whose tag is highlighted. Someone scanning the panel can miss what to deal with first.

## Outcome
A P0 priority tag stands out more than any other priority tag, wherever the panel shows one.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. Wherever the panel shows a priority tag (Plan, the Build queue and the full ticket pane), a P0 tag's text and border are in the panel's red (`--bad`), in light and dark mode.
2. A P1 tag looks as it does today (text and border in `--text`), and P2 to P5 tags stay grey (`--muted`).
3. A P0 tag's tip and screen-reader wording, its size and its tap area are unchanged, and no test that passed before this change fails.

## Out of scope
- The `fix` tag beside it: it already marks the ticket and keeps its own colour.
- Refusing a type change that leaves P0 on a ticket that's no longer a fix ticket: speck/ideas/2026-10-10-refuse-a-type-change-that-strands-p0.md.

## Notes
- The priority tag is drawn in one place, `fieldTags()` in `templates/panel.html`, which today gives only P1 an extra class (`tag p1`).
- Red for P0 is an assumption: the note asked for P0 to stand out "at least as much" as P1. A high risk tag is also red since 0151.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
