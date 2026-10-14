---
id: "0167"
title: "Use colour only to show state"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0161"]                # ticket ids that must be done first
created: 2026-10-14

---
# 0167 · Use colour only to show state

**Status:** 📝 draft

## Problem
The panel uses colour for decoration as much as for meaning: each Plan tab and the Shipped section have their own accent stripe, every card has a coloured left edge, and ids and links are in the accent red. Red also means blocked and high risk, so colour no longer tells the user where to look.

## Outcome
Cards are plain, set apart by their border, space and type, and colour only appears when it says something: an agent at work, a ticket waiting for the user, something wrong, or something that passed.

## Acceptance criteria
1. No section or card has a decorative coloured stripe: the Plan section's tab-coloured top border, the Shipped section's green top border and the coloured left edges on Plan, Build and Shipped cards are gone. Cards keep a visible border on all sides.
2. Colour appears only for state: a ticket waiting for the user's decision (approved and not covered by auto-ship) has a purple border and a light purple background; a blocked ticket or a stopped build has a crimson border and a light crimson background; passing checks (lint passes, green ticks) stay green; the speck red is used only for the speck itself.
3. Ids, titles, Plan tabs and links (shipped titles, linked ticket ids, the selected Plan tab) are in the normal text colours, with underlines or borders to show what can be clicked, not in the accent colour. Idea and inbox ids are in the normal muted colour.
4. The high risk tag stays red, and the bug and fix tags keep their own colours, as the user asked for on 2026-10-14.
5. All of this holds in light and dark mode with the contrast 0161 sets, and no test that passed before this change fails, except checks of the removed stripes and accent colours, which are changed to check AC1 to AC3.

## Out of scope
- The builder badge (0168) and what moves.
- Layout and spacing beyond removing the stripes.

## Notes
- Agreed 2026-10-14 from the "Colour that means something" section of a mockup: plain cards, red only for the speck, purple for "waiting for you", crimson for "something's wrong".
- Builds after 0161, which sets the colour tokens' contrast.
- Stripes today: `#shaping-section.tickets/.ideas/.inbox { border-top: 2px … }`, the Shipped section's top border (0157), and card left edges from 0151, 0155 and 0157 (`templates/panel.html`).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
