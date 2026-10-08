---
id: "0011"
title: Keep review rounds in the ticket file                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | done
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: high               # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-08

---
# 0011 · Keep review rounds in the ticket file

**Status:** 📝 draft

## Problem
Review records live in `speck/reviews/<id>/`, apart from the ticket they belong to. When a ticket is filed into `speck/tickets/done/`, its reviews stay behind, so a ticket's history is split across two places, and the planned board would have to put them back together for every card. speck is meant to be lightweight: one ticket should be one file.

## Outcome
Each ticket file holds its own review rounds, so a ticket is the complete record of its work, and `speck/reviews/` no longer exists.

## Acceptance criteria
1. `speck review` and `speck record` add each round to a `## Review rounds` section at the end of the ticket file: one collapsed `<details>` block per round, with a one-line summary (round, reviewer, verdict) and the full round record as a `json` code block. After a round, the ticket file is the only tracked file that has changed.
2. `speck next`, `speck pack`, `speck ship` and round numbering read rounds from the ticket file, and give the same results as they do today for the same rounds.
3. The diff sent to the reviewer and the size count leave out the `## Review rounds` section, but still include any other change to the ticket.
4. `speck lint` reports an error if a block in `## Review rounds` doesn't parse as JSON, or if the round numbers aren't 1, 2, 3… in order.
5. Re-running `speck init` in a repo with the old layout moves each `speck/reviews/<id>/round-N.json` into its ticket (in `speck/tickets/` or `speck/tickets/done/`) and removes `speck/reviews/` once it's empty. Running it again changes nothing. Rounds it can't place, such as an id with no ticket, are left where they are with a message saying which and why, and the rest are still migrated.

## Out of scope
- Generating the hand-written `## Review log` from the rounds (possible follow-up)
- Rebuilding reviewer context when the Codex thread is missing (separate ticket)
- Any board or UI work

## Notes
- Risk is high because `speck init` moves existing review history in users' repos.
- speck owns the `## Review rounds` section. The skills must tell builders never to edit it by hand, as they do for round files today.
- Working files that aren't history (the Codex thread id, `reviewer-settings.json`, `.round-N.out.json`) must no longer be written to `speck/reviews/`. A gitignored `speck/.cache/` is fine. Each round record already stores `thread_id`.
- This repo's own reviews (0004–0007) are migrated on the ticket branch, so the repo matches the new layout as soon as it ships.
- Update `docs/brief.md`, `speck/product.md` and the skills wherever they mention `speck/reviews/`.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
