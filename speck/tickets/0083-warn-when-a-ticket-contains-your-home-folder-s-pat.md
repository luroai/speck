---
id: "0083"
title: "Warn when a ticket contains your home folder's path"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10

---
# 0083 · Warn when a ticket contains your home folder's path

**Status:** 📋 ready

## Problem
Tickets are committed and often published, and an absolute path from the writer's machine can slip into one. That path usually contains their username. It happened in 0053, and nobody noticed until much later.

## Outcome
`speck lint` warns when a ticket contains the absolute path of the current user's home folder, so it can be removed before the ticket is committed or shared.

## Acceptance criteria
1. `speck lint <id>` prints a `!` warning when the ticket's text contains the current user's home folder path (as the operating system reports it), either followed by `/` or on its own (followed by a space, punctuation or the end of the line). The warning gives the line number and suggests a `~/` path instead.
2. A ticket without that path gets no such warning. A path that only starts the same way (for example `/home/ann2` when the home folder is `/home/ann`) gets no warning either.
3. As with lint's other warnings, this one doesn't make `speck lint` fail, and it doesn't stop `speck set <id> status ready`.
4. When the home folder can't be found, or is `/`, lint checks nothing for it and prints no error.

## Out of scope
- Checking files other than tickets, such as idea notes or code.
- Changing existing tickets. 0082 removes the one known case.
- Other personal details, such as names or email addresses.

## Notes
- Lint already separates errors (✗, which block `ready`) from warnings (!, which don't), in `lintTicket` in `scripts/core.mjs`.
- Checked 2026-10-10: on Linux and macOS, Node's `os.homedir()` returns `$HOME` when it is set (Node.js `os` docs).
- Tests should set `HOME` (and so the home folder) to a temporary path, so they don't depend on the machine running them.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
