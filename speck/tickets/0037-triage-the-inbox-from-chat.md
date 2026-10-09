---
id: "0037"
title: "Triage the inbox from chat"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0036"]            # ticket ids that must be done first
created: 2026-10-09

---
# 0037 · Triage the inbox from chat

**Status:** 📋 ready

## Problem
Follow-ups from builds pile up in the inbox (0036). Reading every one would overwhelm the user, who wants to decide only what's worth a ticket, from their single shaping chat.

## Outcome
Asking the agent to triage the inbox clears it down to at most three decisions, and follow-ups nobody picks drop out by themselves.

## Acceptance criteria
1. When the user asks to triage the inbox (for example "triage the inbox"), the agent reads every note in `speck/ideas/` whose status is `inbox`. If there are none, it says the inbox is empty in one line and stops.
2. Without asking, it drops each inbox note that's already done or covered by another idea note, a ticket or `speck/product.md`, and keeps one of any notes that duplicate each other, dropping the rest. It names each one dropped, with the reason, in one line.
3. It then puts at most three of the remaining notes to the user, each with its title, the ticket it came from and a one-line reason it's worth doing, and asks whether to ticket it or drop it.
4. "Ticket it" makes a draft ticket from the note with `/speck-ticket`, using the note as `--source`, which sets its status to `ticketed (<id>)`. "Drop it" sets the note's status to `dropped`. Nothing is ever set to `ready`.
5. At the end of each triage, every note still `inbox` gets a `Triaged: <n>` line (added, or its number raised by one). A note that reaches `Triaged: 2` is set to `dropped` instead, and the agent lists those. It commits every note it changed, staged by name, as `speck: triage inbox`.

## Out of scope
- Writing inbox notes (0036) and the panel's Inbox tab (0038).
- Any panel button for triage. The panel stays read-only.

## Notes
- `dropped` is a new idea status. Only triage sets it.
- The builder decides whether this lives in `/speck-ticket` or a new skill installed with the others. `speck/product.md` and the skill count must match either way.
- Mostly skill instructions. Where nothing can be tested automatically, the builder says so in Notes and the reviewer checks it by reading the skill.
- No external facts: everything is in this repo.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
