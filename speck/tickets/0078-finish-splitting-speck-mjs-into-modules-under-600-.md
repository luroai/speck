---
id: "0078"
title: "Finish splitting speck.mjs into modules under 600 lines"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 4              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0018", "0079", "0080"]                # ticket ids that must be done first
created: 2026-10-10

---
# 0078 · Finish splitting speck.mjs into modules under 600 lines

**Status:** 📋 ready

## Problem
After 0018, `scripts/speck.mjs` still holds about 2,000 lines: ticket parsing, the review loop and review pack, install and doctor, start, ship and status. Reviewers still read large parts of it every round, and an edit in one area risks breaking another.

## Outcome
speck's code is split into files by area under `scripts/`, none over 600 lines, and speck works exactly as before.

## Acceptance criteria
1. The review code (`review`, `record`, `prompt`, `diff`, `next`, `close` and `reviewer-settings`), the review pack, the install and doctor code, and the ship code (including `--auto`) each live outside `scripts/speck.mjs`, which keeps the commands' entry point.
2. No file under `scripts/` is over 600 lines. If `speck.mjs` or a moved area still is, it's split further.
3. Every name `scripts/speck.mjs` exports today can still be imported from it.
4. Every CLI command gives the same output and exit code as before, and the test suite passes with no test changed.
5. A project set up with `speck init` runs `review`, `record`, `pack`, `doctor` and `ship` from `.speck/scripts/speck.mjs`, and re-running `init` there still updates `.speck/`.

## Out of scope
- Changing any behaviour, message or output.
- The panel and the build controls: 0018.
- The test file (0020, cancelled).

## Notes
- This is a pure move. It takes over 0018's original scope, which already included 0019 ("Finish splitting speck.mjs into modules", cancelled when it was merged into 0018).
- The review code is about 720 lines with its commands, so it can't be one file under the cap.
- Rough size: about 1,400–1,500 lines move, so about 3,000 counted against `max_changed_lines`.
- Checked 2026-10-10: `speck init` copies the whole `scripts/` folder into `.speck/` (`installTooling`).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
