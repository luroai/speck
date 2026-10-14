---
id: "0177"
title: "Keep the panel answering while it reads the board"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-14T21:14:21.689Z"

---
# 0177 · Keep the panel answering while it reads the board

**Status:** 🔨 building

## Problem
The panel server works out the whole board for each `/api/state` request, and while it does (about 750 ms on 2026-10-14) it can't answer anything else. Every open tab asks every 2 seconds, and a request the page has already given up on is still worked out. On a busy machine requests pile up faster than they're answered: on 2026-10-14 the panel stopped answering, with 60 connections queued and its process at 100% CPU.

## Outcome
The panel keeps answering promptly, however many tabs are open and however slow the board is to read.

## Acceptance criteria
1. `/api/state` requests that arrive while the board is being read share that reading: ten requests sent at once cause one reading, not ten.
2. A request whose connection has closed before its reading starts doesn't cause one.
3. While the board is being read, the panel still answers the page, its icons, a build log and every write (Set ready, Back to Plan, priority, Stop build, Ship and the speck run switch) within 1 second, even when one reading takes 5 seconds.
4. After a write, the next `/api/state` answer shows its result, never an answer read before the write.
5. No test that passed before this change fails.

## Out of scope
- How long one reading takes (0176) and how much it sends (0178).
- Pushing changes to the page instead of polling (`speck/ideas/2026-10-11-update-the-panel-in-real-time.md`).

## Notes
- `panelServer()` in `scripts/panel.mjs` calls `statusData(repo)` inside the request handler. The page aborts a request still waiting when the next is due (`poll()` in `templates/panel.html`), but the server carries on working it out.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
