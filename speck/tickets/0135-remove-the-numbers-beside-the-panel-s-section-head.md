---
id: "0135"
title: "Remove the numbers beside the panel's section headings"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-12
started: "2026-10-12T18:53:30.432Z"

---
# 0135 · Remove the numbers beside the panel's section headings

**Status:** 🔨 building

## Problem
0134 put a decorative number (1, 2 and 3) beside the panel's Plan, Build and Shipped headings, copied from the zen mockup. The user doesn't want them: they add clutter without telling you anything.

## Outcome
The Plan, Build and Shipped headings show their names only, with no number beside them. Everything else about the panel looks and works as before.

## Acceptance criteria
1. In a browser, the `h2` is the first visible thing in each of the Plan, Build and Shipped section headers (`.sh`): nothing, number or otherwise, is shown before or beside it apart from what the header showed before 0134 (its live count and its hint).
2. Each section's `h2` heading text is still exactly `Plan`, `Build` or `Shipped`.
3. The page's static HTML has no `<span class="num">` element inside a `.sh` header, and the stylesheet has no rule left for it (`.sh .num`). The `td.num` rule used by the Shipped table is unchanged.
4. Nothing the panel does changes: this ticket's diff changes nothing between `<script>` and `</script>` in `templates/panel.html`, and changes no file in `scripts/`.
5. No test that passed before this change fails, except 0134's checks that the numbers are there (`test/panel-0134.test.mjs` AC3, and the parts of its AC4 and browser test that expect them), which are changed to check that the numbers are gone.

## Out of scope
- Any other part of 0134's zen look: colours, fonts, borders and spacing stay as they are.
- Dark mode: that's 0136.

## Notes
- Undoes 0134 AC3 only. The rest of 0134 stays.
- The section number spans and the `.sh .num` rule are both in `templates/panel.html`. The Shipped table's `td.num` cells are a different thing (right-aligned figures) and stay.
- AC4 is checked by the reviewer against this ticket's diff.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
