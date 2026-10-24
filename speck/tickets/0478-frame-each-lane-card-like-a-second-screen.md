---
id: "0478"
title: "Frame each lane card like a second screen"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0477"]                # ticket ids that must be done first
created: 2026-10-24

---
# 0478 · Frame each lane card like a second screen

**Status:** 📝 draft

## Problem
After 0476, each lane is a card you slide between, but it doesn't look like part of the same device as speck's screen above it. The user wants the panel to read as two screens: speck's screen on top for the overall view, and a second one under it where the tickets live.

## Outcome
Each lane card has a dark frame like speck's screen, thinner, with its lane's name in the same dot-matrix letters and a coloured dot for its stage.

## Acceptance criteria
1. Each lane card (Plan, Build and Shipped) has a frame in the colour of speck's screen's frame (`--bezel`), with the same corner rounding, and a title row in that frame like the screen's, in both looks. Its sides and bottom are thinner than the screen's frame, and its tickets sit inside it on the lane's own background.
2. The card's title row shows the lane's name in the dot-matrix letters and weight of the header's "speck" (Doto), in the frame's light ink, with a coloured dot before it as "speck" has: grey for Plan, blue for Build and purple for Shipped, the colours 0461 gives a step not started, Build and Ship.
3. Every lane's frame is the same colour and size: only the title and the dot change from lane to lane, along with the tickets inside.
4. Sliding between lanes moves the whole framed card, title and frame included. At every width from 320 px, the frame keeps all four sides in view and the title row on one line, checked in a real browser in both looks. No test that passed before this change fails.

## Out of scope
- The lane strip (0477) and how the lanes slide (0476).
- What each lane shows inside its card.

## Notes
- Asked for by the user on 2026-10-24: "a very similar border around the card for plan, build and shipped … two kind of Tamagotchi screens … don't make it as thick, but make the title of the card the same font as the speck dot matrix font, and also have a coloured dot … Don't colour the border for the card, keep it the same colour, just the dot and the title changes."
- Today: `.bezel` in the panel's styles (0413) is speck's screen's frame, `--bezel` with `padding: 5px 7px 7px` and a 2 px border, and `.bezel .name` its "speck" in `Doto` at weight 900 with an 8 px dot before it.
- The dots match 0461's step colours: grey for a step not reached, `--blue` for Build and the purple 0461 picks for Ship.
- Waits for 0477: both change the lanes' and the header's styles. Built for release 0.15.0.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
