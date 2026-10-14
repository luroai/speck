---
id: "0169"
title: "Give self-check and review their own badge loops"                # one outcome, no "and"
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
after: ["0168"]                # ticket ids that must be done first
created: 2026-10-14

---
# 0169 · Give self-check and review their own badge loops

**Status:** 📝 draft

## Problem
After 0168, the builder badge plays the same laptop loop through self-check and review, so the user can't tell from the badge whether the builder is checking its own work or being reviewed.

## Outcome
The badge's self-check and reviewing stages have their own loops, both built around a thin cloud of code characters, as in the mockup.

## Acceptance criteria
1. During self-check, nine faint code characters hang in a loose ring around the builder, drifting slightly. Its eye moves to one at random about every 0.65 seconds, its body turning a beat later and an ear twitching now and then; each character it looks at turns green for a moment and fades back. Every seventh glance it gives a small hop and a green tick appears.
2. During review, the reviewer (taller and squarer than the builder, two small eyes and a mouth) slides in from the right, and seven faint code characters float above the two of them. In each loop of about 6.2 seconds there are three exchanges: the reviewer looks at a character and talks (its mouth moves and it leans in) and a ring appears round that character; then the builder looks at the same character and answers with a bounce and an ear flick, and the character turns green. The loop ends with the reviewer smiling and nodding and the builder hopping, and the reviewer slides out.
3. The characters come from the same set as the laptop loop (`{ } < > ; / = ( ) [ ] *`), in the panel's monospace font and faint ink, green once checked. None of them, nor the ring, is clipped by the tile's edge.
4. With `prefers-reduced-motion: reduce`, each stage shows a still frame (self-check: the builder looking at one green character in its ring; review: both looking at one ringed character) and nothing moves.
5. No test that passed before this change fails.

## Out of scope
- The building, waiting and blocked loops (0168).

## Notes
- The design reference is `mockups/builder-badge/index.html` in the main checkout (local only: `mockups/` isn't in git, so it isn't in a build's worktree; `git worktree list` shows the main checkout first) (the Self-check and Reviewing states). Its drawing code and timings can be reused.
- Builds after 0168, which adds the badge.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
