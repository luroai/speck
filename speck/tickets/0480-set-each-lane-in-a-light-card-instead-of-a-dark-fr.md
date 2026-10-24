---
id: "0480"
title: "Set each lane in a light card instead of a dark frame"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: []                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T18:03:26.428Z"

---
# 0480 · Set each lane in a light card instead of a dark frame

**Status:** 🔨 building

## Problem
Since 0478 each lane sits in a dark frame as heavy as speck's screen above it. On a phone the two black slabs compete, so the screen no longer stands out, and the frame's title bar and edges take room from the tickets.

## Outcome
Each lane is a light card with a thin edge and its name in dark dot-matrix letters, so speck's screen is the only dark frame on the page and the tickets get more room.

## Acceptance criteria
1. Plan, Build and Shipped are each a card on the lane's own background (`--panel`) with a hairline edge in the line colour (`--line`) and rounded corners, 16 px in from the column's sides as today. Nothing in or round a lane is in the screen's frame colour (`--bezel`), in the light and dark looks.
2. Each card's top row has the lane's name in the dot-matrix letters (Doto, as today) in the text colour, after a dot in its stage's colour (grey for Plan, blue for Build, purple for Shipped), with the lane's line (such as `1 in flight · 0 queued`) at the row's right in the muted colour. A thin line in `--line-soft` separates the row from the tickets under it. Every word reaches 0161's contrast on the card in both looks, and Plan's grey dot is at least 3:1 on the card.
3. With the same tickets at 390 × 844, the open lane's ticket list is taller than before this change, in Plan, Build and Shipped, checked in a real browser by comparing its height with and without the change.
4. Swiping, the strip, the ← and → keys and each lane's own scroll place work as before (0476, 0477). No test that passed before this change fails.

## Out of scope
- The strip under speck's screen (0481).
- The Pipeline log's dark frame (0479): it fills the window, so it doesn't sit beside speck's screen.
- The tickets' own cards and what they show.

## Notes
- Asked for by the user on 2026-10-24, from a phone screenshot of the Build lane: "there's too much black border … less space for tickets … it distracts away from the main lcd screen but I like the layout and swipe." From the mock-up's four looks (https://claude.ai/artifact/F9FWtouNDenRB3K4djw47y) the user chose B, the light card with its name.
- Today: `main > section`, `.lane-title`, `.lane-n`, `.sh` and `.lane-list` under 0478's comment in `templates/panel-cards.css`, and `--bezel-step` (Plan's dot on the dark frame) in `templates/panel-base.css`. The Pipeline log (0479, `templates/panel-popups.css`) has its own rules for its frame, so this change leaves it as it is.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
