---
id: "0092"
title: "Mark the repo as release 0.2.0"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0086", "0087", "0088", "0089", "0090", "0091"]                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T15:41:46.479Z"

---
# 0092 · Mark the repo as release 0.2.0

**Status:** 🔨 building

## Problem
The repo still calls itself the private 0.1 build: `package.json` says 0.1.0, the README says "v0.1, early", and there's no record of what's changed. A first public release needs a version number people can install and a plain list of what's in it.

## Outcome
The repo describes itself as release 0.2.0, ready for the maintainer to tag `v0.2.0`.

## Acceptance criteria
1. `package.json` has version `0.2.0` and `"repository": "github:luroai/speck"`, and `speck init` prints `speck 0.2.0`.
2. A `CHANGELOG.md` has a 0.2.0 section listing, in plain English, what someone installing speck can now do that the private 0.1.0 couldn't, grouped under a few headings.
3. The README's status line and the brief's status line both say 0.2.0, a public preview, instead of v0.1.
4. The README's setup prompt names `v0.2.0` (the test from 0089 passes).

## Out of scope
- Creating the `v0.2.0` tag or a GitHub release, which the maintainer does after this ships.
- Publishing to npm.

## Notes
- Decided 2026-10-10: version 0.2.0, distributed as a GitHub tag only.
- The tests check the changelog's shape (a 0.2.0 section, a few headings, items under them). Whether each line is true and plain English is for the reviewer to check by reading it against the done tickets and the code.
- Self-check: no changes.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
