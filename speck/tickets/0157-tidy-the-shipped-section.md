---
id: "0157"
title: "Tidy the Shipped section"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0151"]                # ticket ids that must be done first
created: 2026-10-13
started: "2026-10-14T06:59:20.485Z"

---
# 0157 · Tidy the Shipped section

**Status:** 🔨 building

## Problem
The Shipped section is hard to read, worst on a phone. Its six stats stack as large numbers with long labels that wrap, and they're hard to tell apart. The section has no accent colour, unlike Plan. Shipped tickets run into each other. Each ticket's figures are one long run of values separated by dots, and the time in its bottom left corner has no label, so it isn't clear what it is.

## Outcome
Shipped has a green accent, its stats sit in a tidy grid of small labelled tiles, and each shipped ticket is a card with labelled figures and a labelled ship time.

## Acceptance criteria
1. The Shipped section has a 2 px top border in the panel's green (`--ok`), as Plan's section has a top border in its own colour.
2. The six stats are tiles of equal size, each with its number above a short label (for example "10" over "shipped today", "1.5" over "median review rounds"), with the number of tickets each median covers in smaller, muted text under the label. At a viewport 375 px wide they sit two to a row with no label wrapping onto a third line; at 700 px wide and over they sit in one row.
3. Each shipped ticket is a card with a visible border on all sides, a green left edge and at least 8 px of space between cards, readable in light and dark mode. Its id and title come first, laid out like a Plan card after 0151, with the title still opening the full ticket.
4. Under the title, the card says when it shipped, labelled: "Shipped 21:52" for today and "Shipped 12 Oct, 21:52" for an earlier day. Under that, its figures are label and value pairs in a grid, not a run separated by dots: Time, Review rounds, Reviewer tokens, Builder tokens and Builder cost. A figure the ticket doesn't have is left out. Token counts of 10,000 and over are shortened (for example "108k" and "2.4M"), with the exact number as a tooltip. The Review pack button sits at the bottom of the card and works as before.
5. Nothing overflows a 375 px wide screen, and no test that passed before this change fails, except checks of the old Shipped layout (the dot-separated figures, the unlabelled time, the stats' text), which are changed to check AC1 to AC4.

## Out of scope
- Which tickets are listed (the latest 5) and how the stats are worked out.
- The Plan and Build sections.

## Notes
- Builds on 0151's card styles, so it waits for it.
- The rows are filled by `fill('shipped', …)` and the stats by `$('shipped-stats')` in `templates/panel.html`; the time comes from `shippedAt()`.
- Reported 2026-10-13 from a phone screenshot in dark mode.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
