---
id: "0260"
title: "Let a setting apply to this machine only"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-09-edit-settings-from-the-panel.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0258"]                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-17T09:22:07.848Z"

---
# 0260 · Let a setting apply to this machine only

**Status:** 🔨 building

## Problem
Some settings suit a machine rather than a project. `max_parallel_builds` of 4 suits a 16-core Linux box, but an 8 GB laptop needs 1 or 2, and today whatever is committed in `speck/config.yml` applies to every machine that checks the repo out.

## Outcome
`max_parallel_builds` and `max_parallel_tests` can be set for this machine only, kept out of git, and speck uses that value over the committed one on this machine.

## Acceptance criteria
1. `speck config set --machine max_parallel_builds 3` records 3 for this machine in a file git ignores, leaves `speck/config.yml` unchanged, commits nothing and prints `max_parallel_builds (this machine): 1 → 3`, giving the value speck used before.
2. With a machine value set, everything speck reads that setting for uses it instead of `speck/config.yml`'s value, from the main checkout and from every worktree of the repo. For example, `speck run` keeps up to 3 builds going.
3. `speck config set --machine max_parallel_builds ""` removes this machine's value, after which speck uses `speck/config.yml`'s value again.
4. `--machine` with any other setting is refused, naming the settings it can set, and changes nothing. A machine value is checked as `speck config set` checks the same setting.

## Out of scope
- The panel: 0261.
- Other settings for this machine only. Add them later if a case comes up.

## Notes
- `speck/.cache/` is git-ignored. Worktrees must read the main checkout's machine file, as the flaky log in `speck/.cache/flaky/` is shared.
- Config is read by `loadConfig` in `scripts/core.mjs`, and `speck config set` is in `scripts/config.mjs`. Update `speck config set`'s description in `docs/brief.md`.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
