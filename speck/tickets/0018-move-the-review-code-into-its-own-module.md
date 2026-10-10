---
id: "0018"
title: Move the panel and build-control code into their own modules                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 4              # 1 (highest) to 5
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
# 0018 · Move the panel and build-control code into their own modules

**Status:** 📋 ready

## Problem
`scripts/speck.mjs` is 2,769 lines in one file, about twice its size when this ticket was first written. Reviewers read large parts of it every round, which is a big share of the reviewer tokens a ticket costs, and an edit in one area risks breaking another. The panel's server and the build controls (`run`, `pause`, `play`, `stop`) are about 750 of those lines and are where it has grown fastest.

## Outcome
The panel's server and the build controls live in their own files under `scripts/`, not in `speck.mjs`, and speck works exactly as before.

## Acceptance criteria
1. The code for `speck panel` (its server, requests and writes) is in one file under `scripts/`, and the code for `speck run`, `pause`, `play` and `stop` is in another. Neither is left in `scripts/speck.mjs`, which keeps the commands' entry point and is at least 600 lines shorter than before.
2. Every name `scripts/speck.mjs` exports today can still be imported from it.
3. Every CLI command gives the same output and exit code as before. The test suite passes with no test changed, except the helpers in `test/support/` that copy the CLI, which may copy the whole `scripts/` folder instead of `speck.mjs` alone.
4. While `speck panel` runs, a change to any `.mjs` file under `scripts/`, the new ones included, makes it hand over to a server on the new code, as a change to `speck.mjs` does today (0067).
5. In a project set up with `speck init`, the new files are in `.speck/scripts/`, and `speck panel` started from `.speck/scripts/speck.mjs` serves its page.

## Out of scope
- Changing any behaviour, message or output.
- The rest of the split (review, review pack, install and doctor, ship): 0078.
- Making the panel's ready and priority writes use `speck set`'s code: 0079.

## Notes
- This is a pure move. Rewritten 2026-10-10: the original scope (review, install and doctor, ship, and a 600-line cap on every file) moved to 0078. A moved line counts twice against `max_changed_lines` (deleted and added), so the whole split in one ticket would come close to 5,000.
- Decided 2026-10-10: the framework and the panel stay in one repo, with a module boundary instead (`speck/ideas/2026-10-10-more-human-gate-actions-in-the-panel.md`).
- Checked 2026-10-10: `speck init` copies the whole `scripts/` folder into `.speck/` (`installTooling`), so new module files install without changes.
- Checked 2026-10-10: the panel's restart watches every `.mjs` file in the CLI's own folder (`panelCode`), and each server process imports the module named in `SPECK_PANEL_CODE_URL`. `cliCopy` in `test/support/panel.mjs` copies only `speck.mjs` today.
- Rough size: about 750 lines move, so about 1,500 counted.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
