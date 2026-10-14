---
id: "0171"
title: "Colour a running ticket's border by its build stage"                # one outcome, no "and"
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
after: ["0169"]                # ticket ids that must be done first
created: 2026-10-14

---
# 0171 · Colour a running ticket's border by its build stage

**Status:** 📋 ready

## Problem
Since 0167, a running ticket's card looks the same as a queued one apart from its badge and stage line, so the user can't see at a glance which tickets are being worked on or what stage each has reached.

## Outcome
A ticket an agent is working on has a coloured border that shows its build stage. A coloured fill still means only that the ticket needs the user.

## Acceptance criteria
1. A Build card whose agent is at work has a 2px border in its stage's colour and the normal card background: writing tests and code in `--run` (blue), checking its own work in `--inbox` (teal), being reviewed (any round) in `--warn` (ochre), and shipping (by hand or by auto-ship) in `--ok` (green).
2. When a running ticket moves to its next stage, its border changes to the new stage's colour the next time the panel updates, without a reload.
3. A blocked ticket or a stopped build keeps 0167's crimson border and fill, and a ticket waiting for the user keeps 0167's purple border and fill, whatever stage it stopped or waits in. Every other Build card (ready, queued, paused, or approved and waiting for auto-ship to start) keeps the plain 1px neutral border and its current background.
4. A running card keeps its stage border while it's open and while it flashes from a linked id. In light and dark mode, each stage colour has a contrast of at least 3:1 against the card's background.
5. No test that passed before this change fails.

## Out of scope
- The colour of the stage name and sentence under the badge.
- What an approved ticket that auto-ship is about to ship says (`speck/ideas/2026-10-14-keep-an-auto-shipping-ticket-s-sentence-out-of-purple.md`).
- Plan and Shipped cards.

## Notes
- Agreed 2026-10-14: a coloured border means an agent is at work and nothing is needed from the user; a coloured fill means the ticket needs the user. Running stages never use crimson or purple, and use green only for shipping.
- `--inbox` has been unused since 0167, and the palette checks of 0126, 0134 and 0136 pin it, so reusing it for self-check keeps those checks meaningful.
- Checked 2026-10-14: each stage token has at least 7.9:1 contrast against the card background in both themes (`--run` 8.52/7.99, `--inbox` 8.60/7.98, `--warn` 8.54/7.96, `--ok` 8.54/8.00 against `#ffffff` and `#1f1f1f`; computed from `templates/panel.html`).
- The stage is already worked out for the badge and the sentence under it (`doing` and `badgeOf` in `templates/panel.html`).
- Builds after 0169, which changed the same card.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
