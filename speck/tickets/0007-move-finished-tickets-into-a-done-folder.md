---
id: "0007"
title: "Move finished tickets into a done folder"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | done
priority: 2              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: ""       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0006"]                # ticket ids that must be done first
created: 2026-10-08
started: "2026-10-08T16:20:30.921Z"

---

## Problem
Finished tickets stay in `speck/tickets/` next to live work. Anyone browsing the repo or the code editor's file tree has to open each file to see what's still to do.

## Outcome
`speck/tickets/` holds only tickets still in progress, and finished ones sit in `speck/tickets/done/`. Every speck command still finds tickets wherever they are.

## Acceptance criteria
1. When a ticket's status is set to `done` (by `speck set` or `speck ship`), its file moves to `speck/tickets/done/` with the same name. Setting a done ticket to any other status moves it back to `speck/tickets/`.
2. Every command that takes a ticket id finds it in either folder, `speck status` still lists done tickets, and `speck new` never reuses a number that's in `speck/tickets/done/`.
3. Running `speck init` again moves any `done` tickets still in `speck/tickets/` into `speck/tickets/done/`, and leaves other tickets where they are.

## Out of scope
- Moving review rounds (`speck/reviews/<id>/`) or idea notes.
- Hiding done tickets from `speck status`.

## Notes
- Built after 0006 because both change how tickets reach `done`. It doesn't depend on local ship otherwise.
- Tickets refer to each other by id (`after:`), not by path, so moving files doesn't break those links.
- Update `speck/product.md` and `docs/brief.md` (the repo layout) to show the done folder.
- Build note: the tickets already `done` in this repo (0005, 0006) were moved into `speck/tickets/done/` on this branch, so the layout matches the outcome once this ships. `speck init` does the same job for anyone upgrading.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex, gpt-6.1-sol): changes_requested: F1 `speck init` could overwrite an archived ticket when the same file name was already in `speck/tickets/done/`. Round 2 (codex, gpt-6.1-sol): approved, AC1–AC3 pass and F1 resolved.

## Delivery log
- One sitting on `speck/0007-move-finished-tickets-into-a-done-folder`: tests first from the three acceptance criteria (4 new tests, 2 of them covering the round-1 finding), then the implementation.
- Review rounds: 2, both codex on `gpt-6.1-sol` (effort default). Round 1 asked for changes on F1; round 2 approved. No minor findings.
- Reviewer tokens: 179,325 (round 1: 54,757 in / 664 out, 33s; round 2: 122,762 in / 1,142 out, 24s).
- Wall time: 5 minutes from `building` to `approved`.
- Changed lines: 68 (limit 300), excluding tests, lockfiles and `speck/`. Test suite: 37 tests, all passing.
- The reviewer could not start its sandbox on this machine (the known limit in `speck/product.md`), so both rounds were judged from the diff and the test output.
- Migration on this branch: tickets 0005 and 0006 were moved into `speck/tickets/done/`, so this repo matches the new layout as soon as this ships. `speck init` does the same job for anyone upgrading.
- Follow-up ideas: the `speck-build` skill's pre-flight still spells the ticket path as `speck/tickets/<id>-*.md`, and could mention `speck/tickets/done/` for a finished ticket. Nothing else came up.
