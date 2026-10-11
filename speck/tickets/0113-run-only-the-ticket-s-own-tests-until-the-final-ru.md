---
id: "0113"
title: "Run only the ticket's own tests until the final run"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-one-build-at-a-time.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11

---
# 0113 · Run only the ticket's own tests until the final run

**Status:** 📋 ready

## Problem
While writing tests and fixing code, a build re-runs the whole suite each time, though only the ticket's own tests are changing. Each run costs about 100 seconds here, and the full suite only needs to run when the work is finished.

## Outcome
Builds run only the ticket's own test files while they work, and the whole suite only at the points where it counts.

## Acceptance criteria
1. A new setting, `commands.test_files`, holds a command that runs given test files, with `{files}` standing for them (for example `node --test {files}`). It's in the config template with a comment and blank by default, and `speck config set` accepts it.
2. `speck test --files <file>…` runs `commands.test_files` with those files and exits with its exit code. When `commands.test_files` is blank, it runs `commands.test` instead, saying so in one line.
3. The build skill runs only the ticket's own test files, through `speck test --files`, when it checks that the new tests fail and while fixing until they pass.
4. The build skill still runs the whole suite (`speck test`) before the build changes anything (the "failing before" step), once the ticket's own tests pass, before every review round and after merging the base branch in. Shipping still runs the whole suite.

## Out of scope
- Reusing earlier results (0112).
- Making the suite itself faster.

## Notes
- `/speck-setup` doesn't need to ask for `commands.test_files`: blank falls back to the whole suite.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
