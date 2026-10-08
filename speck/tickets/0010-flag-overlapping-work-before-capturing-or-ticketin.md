---
id: "0010"
title: "Flag overlapping work before capturing or ticketing"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | done
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0008", "0009"]                # ticket ids that must be done first
created: 2026-10-08

---
# 0010 · Flag overlapping work before capturing or ticketing

**Status:** 📋 ready

## Problem
`/speck-capture` writes a new idea note without looking at what already exists. `/speck-ticket` only checks the one-line titles in `speck status`. The same work can be captured or ticketed twice, or picked up again after it has shipped or been turned down.

## Outcome
Before capturing an idea or creating a ticket, the agent checks existing ideas, tickets (including done and cancelled ones) and `speck/product.md`. It tells you about any overlap and lets you decide before anything is written.

## Acceptance criteria
1. Before writing a note, `/speck-capture` checks the idea against every note in `speck/ideas/`, every ticket in `speck/tickets/` and `speck/tickets/done/` (problem, outcome and acceptance criteria, not only titles) and `speck/product.md`.
2. `/speck-ticket` runs the same check before it calls `speck new`.
3. When the check finds an overlap, the agent names each match: the idea's path with its status, the ticket's id with its status (plus the reason, if cancelled) or the line in `speck/product.md` that already covers it. It then asks whether to add to the existing item, go ahead anyway or stop, and writes nothing until you answer.
4. When nothing overlaps, the skill continues as it does today and says in one line that it found no overlap.

## Out of scope
- A CLI command that finds similar text. This ticket changes skill instructions only.
- Merging or deleting existing ideas or tickets automatically.

## Notes
- Built after 0008 (cancelled tickets and their reasons) and 0009 (idea status shows which tickets an idea became), since the check reports both.
- Overlap is the agent's judgement of the same or largely the same outcome, not an exact text match.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
