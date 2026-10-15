---
id: "0172"
title: "Give the shipping stage its own badge loop"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0196"]                # ticket ids that must be done first
created: 2026-10-14

---
# 0172 · Give the shipping stage its own badge loop

**Status:** 📋 ready

## Problem
While a ticket ships, the builder badge plays the same laptop loop as writing code, or stands still once the build has ended (builds end at approved since 0194), so the user can't tell from the badge that the work is finished and on its way out.

## Outcome
The badge has a shipping loop of its own: the builder pushes the finished block off on a little paper boat.

## Acceptance criteria
1. While a ticket is shipping (by hand, by auto-ship or by `speck run`'s ship queue), its badge plays the shipping loop and not the laptop loop, whether or not its build is still running, and the badge's accessible name stays "The builder is shipping". Writing code still plays the laptop loop.
2. In each loop of about 3 seconds, a finished block with a green tick on it sits on a small paper boat in front of the builder, on a thin line of water. The builder pushes the boat with both arms, and the boat, with the block on it, slides off to the right and out of the tile. A new boat with a ticked block then appears for the next loop.
3. The block is drawn in the same style as the laptop loop's finished block, and the tick in the panel's green (`--ok`). The boat is a simple folded-paper shape in the badge's line style, in light and dark mode. Nothing is clipped by the tile's edge except the boat and block as they leave on the right.
4. With `prefers-reduced-motion: reduce`, the badge shows a still frame of the builder with both hands on the boat carrying the ticked block, and nothing moves.
5. No test that passed before this change fails.

## Out of scope
- The card's border colour while shipping (0171).
- The other stages' loops (0168, 0169).

## Notes
- Asked for 2026-10-14. Changed 2026-10-15: "Can we just have the builder pushing the box with a green tick on it off the screen? Maybe with the box being on what looks like a little paper boat?"
- The design reference is `mockups/builder-badge/index.html` in the main checkout (local only: `mockups/` isn't in git, so it isn't in a build's worktree; `git worktree list` shows the main checkout first). It has no shipping state yet: reuse its builder, block and tick drawing code.
- Today shipping shows the `type` pose (`badgeOf` in `templates/panel.html`); the still frames are in `STILL_AT`.
- Builds after 0196, which makes the panel show a ticket as shipping from its approval until it ships, whether or not its build is running.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
