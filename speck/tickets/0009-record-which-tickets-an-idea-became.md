---
id: "0009"
title: "Record which tickets an idea became"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | done
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-08

---
# 0009 · Record which tickets an idea became

**Status:** 📝 draft

## Problem
Idea notes have a `Status:` line, but nothing updates it when tickets are made from the idea. You can't tell from `speck/ideas/` which ideas are still waiting and which have already been ticketed, so the same idea can be ticketed twice.

## Outcome
Every idea note says which tickets were made from it, and `speck status` tells waiting ideas apart from ticketed ones.

## Acceptance criteria
1. `speck new "<title>" --source=speck/ideas/<file>.md` changes the idea's `Status:` value to `ticketed (<id>)`, for example `Captured: 2026-10-08 · Status: ticketed (0011)`. The rest of the note is unchanged.
2. A second ticket from the same idea adds its id to the list, for example `ticketed (0011, 0012)`. An id that's already listed isn't added again.
3. If the source file doesn't exist, `speck new` refuses and creates no ticket. If the file exists but has no `Status:` line, the ticket is still created and speck prints a warning that the idea's status couldn't be updated.
4. `speck status` shows ideas as waiting or ticketed, for example `IDEAS (3: 2 waiting, 1 ticketed) in speck/ideas/`. An idea counts as ticketed when its `Status:` value starts with `ticketed`.

## Out of scope
- Changing an idea's status when its tickets are cancelled or done.
- Finding overlaps between ideas and tickets (0010).
- Moving ticketed ideas into a separate folder.

## Notes
- Idea notes already use the `Captured: <date> · Status: <value>` line written by `/speck-capture`. `speck/ideas/2026-10-08-ship-locally-without-a-pr.md` was set to `ticketed (0006)` by hand, and this matches that format.
- `/speck-ticket` already passes `--source`, so the skill needs no change beyond mentioning that the idea is updated.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
