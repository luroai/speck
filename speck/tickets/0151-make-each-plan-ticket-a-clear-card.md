---
id: "0151"
title: "Make each Plan ticket a clear card"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
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
# 0151 · Make each Plan ticket a clear card

**Status:** 📝 draft

## Problem
In Plan's ticket list the id and title are small and hard to read, the priority, size and risk tags wrap unpredictably beside the title at different heights (the priority tag is much taller, for its tap area), and the faint lines between tickets make it hard to tell where one ticket ends and the next begins.

## Outcome
Each ticket in Plan is its own clearly bounded card: a larger id and title on one line, then the priority, size and risk tags in a row of equal heights, then its criteria count and checks.

## Acceptance criteria
1. In Plan's Tickets list, a ticket's id is 14 px and its title 17 px, and a title is never cut off. At 700 px wide and over, the id and every existing title (up to 68 characters) fit on one line. At a viewport 375 px wide, a title that doesn't fit wraps onto at most one more line, and its second line starts under the start of the title, not under the id.
2. Under the id and title, the priority, size and risk tags (and a bug or fix tag) sit on a row of their own, in that order, all the same height. At viewports under 700 px the priority tag keeps a tap area at least 44 × 44 px, without making it look taller than the other tags. A high risk tag is in the panel's red (`--bad`), not amber, in light and dark mode, wherever the panel shows one (Plan, the Build queue and the full ticket pane).
3. Under the tags, the row with the criteria count, lint result and any warnings, chain or waiting-on note, as today.
4. Every ticket in Plan's Tickets, Ideas and Inbox lists is a separate card with a visible border on all sides and at least 8 px of space between cards, readable in light and dark mode. The draft accent stripe on a ticket's left edge stays.
5. Opening a ticket, the priority menu, Set ready and Full ticket work as before, and no test that passed before this change fails, except checks of the old layout (the tags beside the title, the line between items), which are changed to check AC1 to AC4.

## Out of scope
- The Build and Shipped lists.
- What an opened ticket shows (0142 covers its formatting).
- Colours, other than the card borders and the high risk tag.

## Notes
- Today `.id` is 12 px and `.title` 14 px, a ticket's row is built by `tags()` with the title and tags together, and items are divided by `.item { border-bottom: .5px solid var(--line-soft) }` (`templates/panel.html`).
- The tall priority tag comes from 0140's 44 px tap area (`.tag.pick` in the phone media query).
- Reported 2026-10-13 from a phone screenshot in dark mode.
- The high risk tag uses `--warn` today (`.tag.high` and `.q .tag.high`): `#9c6a10` in light mode, which reads as red-brown, and `#d6a24a` in dark mode, which reads as orange.
- Measured 2026-10-13 in the live panel: titles are 45 characters at the median, 58 at the 90th percentile and 68 at most. At 375 px a card has about 313 px for text; a 48-character title is 319 px wide at 17 px and a 68-character one 473 px, so a larger title can't stay on one line on a phone, but always fits in two. On desktop the card is wide enough for one line.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
