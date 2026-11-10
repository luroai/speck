---
id: "0624"
title: "Show a ticket's facts as tiles"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0617"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T22:59:55.843Z"

---
# 0624 · Show a ticket's facts as tiles

**Status:** 🔨 building

## Problem
Shipped's figures are now even grey tiles that are easy to scan (0606). A ticket's full view still lists its facts (priority, size, risk, whether it ships by itself, builder, reviewer, costs and tokens) as loose labels and values, so the two views look like different designs and the facts are harder to read.

## Outcome
A ticket's facts in its full view are tiles like Shipped's figures.

## Acceptance criteria
1. In a ticket's full view, each fact is a tile in the style of Shipped's figures (0606): the surface colour, no border, every corner rounded alike, even gaps, its label small and muted and its value under it.
2. The tiles are a grid of two columns below 480 px wide and three from 480 px, with every row full or the last tile spanning what's left, so no row ends with a gap.
3. Every fact shown today is still shown, with the same value, and a long value such as a model's name wraps within its tile rather than being cut off.
4. The tiles look right in both looks and at 320 px wide.
5. Tests that checked the full view's old facts layout are changed to check the tiles, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- Which facts are shown.
- The open Plan card's facts.

## Notes
- Asked for 2026-11-10: "I really like what you've done with the stats in the shipped column … I'm wondering if that would be really useful on the expanded ticket views as well for all of the stats."
- Today: `factsOf`, `factCell` in `templates/panel.js`; Shipped's tiles are styled in `templates/panel-cards.css` (0606). Waits for 0617, which changes the full view.
- Relies on nothing outside this repo.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
