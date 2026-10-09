---
id: "0036"
title: "Save a build's ticket-worthy follow-ups to the inbox"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09

---
# 0036 · Save a build's ticket-worthy follow-ups to the inbox

**Status:** 📝 draft

## Problem
Most builds end with follow-up ideas in the ticket's Delivery log, but once the ticket moves to `speck/tickets/done/` nobody reads them again. The shaping chat, where tickets are made, never sees what a build learned, so real bugs and missing checks are lost.

## Outcome
Each follow-up that would need its own ticket lands in `speck/ideas/` as an inbox note, linked to the ticket it came from, while small tidy-ups stay in the Delivery log only.

## Acceptance criteria
1. When a build writes follow-up ideas to the Delivery log (`/speck-build` section 5 step 1), it also writes each one that would need its own ticket (a behaviour change, a bug or a missing check) as its own note in `speck/ideas/`, named `<YYYY-MM-DD>-<slug>.md`. Tidy-ups (such as unused code) and notes on known limits go only in the Delivery log. If none qualify, it writes no note.
2. Each note uses the `/speck-capture` format: a `# <title>` heading saying the follow-up in a few words, then `Captured: <date> · Status: inbox` on its own line, then a `From ticket: <id>` line, then `## What`, `## Why` and `## Notes` sections.
3. Before writing a note, the build skips any follow-up that clearly duplicates an idea note, a ticket in `speck/tickets/` or `speck/tickets/done/`, or a line in `speck/product.md`. It doesn't stop to ask the user. It lists each skipped follow-up and its match in the Delivery log.
4. The notes are committed on the ticket branch before `speck close`, staged by name, so they ship with the ticket. The build's final report says how many follow-ups went to the inbox, or that none did.
5. `/speck-review`'s rule for minor findings that aren't fixed points to the same step, and `speck/product.md` describes the inbox notes.

## Out of scope
- Triaging the inbox (0037) and showing it in the panel (0038).
- Copying follow-ups from tickets already done.
- Any change to the CLI. `speck status --json` already reads a note's status as `inbox`.

## Notes
- One note per follow-up, so each one can be ticketed or dropped on its own by 0037.
- The duplicate check is the agent's judgement, as in `/speck-capture`, but without asking: an auto-ship build mustn't wait for the user.
- Mostly skill instructions. Where nothing can be tested automatically, the builder says so in Notes and the reviewer checks it by reading the skills.
- No external facts: everything is in this repo.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
