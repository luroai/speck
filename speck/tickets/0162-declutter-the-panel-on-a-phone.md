---
id: "0162"
title: "Declutter the panel on a phone"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0167"]                # ticket ids that must be done first
created: 2026-10-14

---
# 0162 · Declutter the panel on a phone

**Status:** 📋 ready

## Problem
On a phone the panel takes a lot of scrolling for what it says. Three lines of instructions that never change ("Click one to open it", "Builds run in their own worktrees", "Latest 5") repeat on every visit, an empty Build section takes a full block, and Shipped, the least urgent section, is the longest: six large stat tiles with seven-digit numbers, then cards of about 600 px each. Shipped titles are in the accent red, which also means "look at this" elsewhere, and the gaps between a Plan card's tags are uneven.

## Outcome
The panel shows the same information in less space: no fixed instructions, a one-line empty Build, a compact Shipped section with details a tap away, neutral Shipped titles and evenly spaced tags.

## Acceptance criteria
1. The hints "Click one to open it", "Builds run in their own worktrees" and "Latest 5" are no longer shown.
2. When nothing is in flight or ready, the Build section is a single line: its heading and "Nothing in flight or ready". It returns to its full layout as soon as a ticket is ready or in flight.
3. Shipped shows three stat tiles: shipped today, median minutes and median builder cost. A "More stats" button below them shows and hides the other three (median review rounds, reviewer tokens and builder tokens). Every stat over 9,999 is shortened as the cards' figures are (for example "2.4M"), with the exact number as a tooltip.
4. Each shipped card shows its id and title, its ship time and one line of figures ("12 min · 1 round · $2.91"). Tapping the card's "Details" button shows the full labelled figures and the Review pack button; tapping the title still opens the full ticket.
5. The gaps between a card's tags are equal, including beside the priority tag with its tap area, and no test that passed before this change fails, except checks of the removed hints and the old Shipped layout, which are changed to check AC1 to AC4.

## Out of scope
- Colours and contrast (0161).
- The Plan and Build card layouts beyond the tag gaps.

## Notes
- Builds after 0167, which takes colour out of titles and links and builds on 0161, so the style changes don't clash.
- Reported 2026-10-14 from phone screenshots; the user liked the layout but felt it might be cluttered.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
