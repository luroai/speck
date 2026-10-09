---
id: "0021"
title: "Close an approved build with one command"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09

---
# 0021 · Close an approved build with one command

**Status:** 📝 draft

## Problem
When the reviewer approves, the builder closes out by hand every time. It writes one review log line per round, copies the rounds, tokens and elapsed time from `speck pack` into the delivery log, counts changed lines, sets `approved` and commits. Nearly all of that is data speck already has, and doing it by hand is slow and easy to get wrong.

## Outcome
One command closes out an approved build: it writes the review log and delivery log figures, sets `approved` and commits the ticket.

## Acceptance criteria
1. `speck close <id>` refuses, changing nothing, unless `speck next <id>` says `ship` and the working tree has no changes outside the ticket file.
2. It replaces the contents of `## Review log` with one line per round: the round number, the reviewer, the verdict, and the id and first sentence of each blocking finding that first appears in that round. A finding carried over from an earlier round isn't repeated.
3. It adds to `## Delivery log` the number of review rounds, the reviewer and model, reviewer tokens, the elapsed time since the build started, and the changed lines with the limit, all from the same data as `speck pack`. Anything already in the Delivery log (for example follow-up ideas the builder wrote) is kept.
4. It sets the status to `approved` and commits only the ticket file, with the message `speck(<id>): approved`.
5. The build skill's approved step uses `speck close <id>` (after the builder adds any follow-up ideas), then `speck ship <id> --auto` as now.

## Out of scope
- Shipping: `speck close` never merges or pushes.
- Writing follow-up ideas, which stay the builder's job.

## Notes
- Pre-check: AC2's "raised in that round" could mean new findings or every finding listed. It now says findings first appearing in that round, and that the Review log is replaced, not appended to.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
