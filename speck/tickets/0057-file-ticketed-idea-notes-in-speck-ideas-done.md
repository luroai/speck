---
id: "0057"
title: "File ticketed idea notes in speck/ideas/done"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09

---
# 0057 · File ticketed idea notes in speck/ideas/done

**Status:** 📋 ready

## Problem
Idea notes stay in `speck/ideas/` forever, so once most ideas are ticketed the folder is mostly finished notes. Tickets already get filed in `speck/tickets/done/` when closed, and ideas have no equivalent, so the folder doesn't show at a glance what's still to shape.

## Outcome
An idea note is filed in `speck/ideas/done/` once it's ticketed, so `speck/ideas/` holds only ideas still waiting.

## Acceptance criteria
1. `speck new "<title>" --source=speck/ideas/<file>.md` sets the note's status to `ticketed (<id>)` as today, moves the note to `speck/ideas/done/<file>.md` under the same name, and writes that new path as the ticket's `source:`.
2. `speck new` with `--source=speck/ideas/done/<file>.md` adds the new id to that note's `ticketed (…)` status and leaves it where it is; with `--source=speck/ideas/<file>.md` for a note that has already moved, it uses the note in `speck/ideas/done/` instead of refusing.
3. Re-running `speck init` moves every note in `speck/ideas/` whose status starts with `ticketed` into `speck/ideas/done/`, and rewrites the `source:` of every ticket (in `speck/tickets/` and `speck/tickets/done/`) that pointed at a moved note to its new path; notes with any other status stay put.
4. `speck status` counts notes in `speck/ideas/done/` as ticketed, alongside those in `speck/ideas/`; `speck status --json` and the panel list only notes in `speck/ideas/`.
5. The overlap check (`speck-capture`), `/speck-ticket` and inbox triage read the notes in `speck/ideas/done/` as well as `speck/ideas/`.

## Out of scope
- Hiding ticketed ideas in the panel (0056).
- Filing `dropped` notes away.
- Moving a note back when its tickets are cancelled: an idea's `ticketed (…)` status is only ever added to.

## Notes
- Mirrors how closed tickets are filed in `speck/tickets/done/` (0007).
- Folder name `speck/ideas/done/`, and filing on the first ticket rather than when all its tickets are done, are defaults chosen while ticketing, to confirm before ready. An idea still being split, such as `speck/ideas/2026-10-08-speck-board.md`, moves on its first ticket and is ticketed from `done/` after that (criterion 2).
- Touches the CLI (`new`, `init`, `status`) and the skill text in `skills/`; product.md and `docs/brief.md` need updating.
- Related inbox note: `speck/ideas/2026-10-09-speck-status-counts-dropped-ideas-as-waiting.md`.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
