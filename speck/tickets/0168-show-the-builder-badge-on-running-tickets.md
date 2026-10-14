---
id: "0168"
title: "Show the builder badge on running tickets"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
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
# 0168 · Show the builder badge on running tickets

**Status:** 📋 ready

## Problem
A running build's progress is shown by 0156's ensō, a red speck circling it and a row of stage dots. It doesn't feel like an agent is doing something, it takes a full block of each card, and on a phone it's hard to read at a glance.

## Outcome
Each in-flight ticket's Build card shows a small builder badge, speck's character, acting out what the build is doing, beside a one-line description of the stage.

## Acceptance criteria
1. Each building, reviewing, blocked or approved ticket's Build card shows a 56 × 56 px badge: a rounded tile with the builder drawn in ink (an ensō-shaped round body open at the top left, two round ears, two short legs and the speck as its one eye), as in the design reference (see Notes). It sits at the left of a row with the stage sentence (as 0156 writes it) and the stage name, below the title, which keeps the card's full width. 0156's ensō, circling speck and stage dots are no longer shown.
2. While an agent is at work on the ticket (building, self-check, reviewing or shipping, and not paused), the badge plays the laptop loop from the mockup, about 2.8 seconds long: the builder behind a laptop lid with an ensō sticker, two round paws slapping the lid's top edge in turn while code characters (`{ } < > ; / = ( ) [ ] *`) fly off both sides, a pause with its eye up and away, both paws up, one slam, and a finished block popping out of the top.
3. While the ticket waits for the user's decision (approved and not covered by auto-ship), the builder faces front waving a small purple flag, with a hop every few seconds, and the tile's edge is purple. While it's blocked or its build has stopped, the builder faces front with a crimson "?" over its head, tilting and now and then glancing side to side, and the tile's edge is crimson. A paused build shows the builder still and facing front.
4. The badge has an accessible name saying what it shows (for example "The builder is writing code" or "The builder needs you"), and ready tickets show no badge. With `prefers-reduced-motion: reduce`, it shows a still pose for each state and nothing moves.
5. The badge is drawn from the panel's colour tokens, so it reads in light and dark mode, nothing in it is clipped by the tile's edge, and no test that passed before this change fails, except checks of 0156's ensō and stage dots, which are changed to check the badge.

## Out of scope
- Self-check's and review's own loops (0169); until then they play the laptop loop.
- The badge in the header's Auto-build button (0163).
- Using the builder as the app icon.

## Notes
- The design reference is `mockups/builder-badge/index.html` in the main checkout (local only: `mockups/` isn't in git, so it isn't in a build's worktree; `git worktree list` shows the main checkout first) (the "At the laptop" building style, and the Waiting for you and Blocked states). Its drawing code and timings can be reused.
- One builder for every project: the version with ears.
- Builds after 0167, so the badge's tile colours follow the "colour only for state" rule.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
