---
id: "0447"
title: "Keep related tests from picking the whole suite"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-keep-related-tests-from-picking-the-whole-suite.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-24

---
# 0447 · Keep related tests from picking the whole suite

**Status:** 📋 ready

## Problem
`speck test --related` (0437) brings in a test through a module under `test/support/` when the module names a changed file. Nearly every support module names `scripts/speck.mjs`, the CLI they run, so any change to it picks almost the whole suite (374 of 390 test files for 0437), and a change to one `SKILL.md` picks every test naming any skill.

## Outcome
`speck test --related` picks the tests that really cover a change, so a build that changes the CLI or a skill runs a small set.

## Acceptance criteria
1. A test file is brought in through a module under `test/support/` only for a changed file that at most a quarter of those modules name. A changed file named by more of them, such as `scripts/speck.mjs`, brings in only the test files that name it themselves.
2. A change to one skill's `SKILL.md` brings in only test files that name that skill, by its folder (such as `skills/speck-build`) or its name (such as `speck-build`).
3. For a branch that changes `scripts/turns.mjs`, `skills/speck-build/SKILL.md` and `docs/brief.md`, as 0437's did, `--related` picks fewer than 100 test files, including every test file that names `scripts/turns.mjs` itself.
4. `docs/brief.md`'s `speck test` row says how `--related` chooses.

## Out of scope
- Running the whole suite at ship.

## Notes
- For release 0.15.0 (0452). The user asked on 2026-10-24 for everything relevant to the release to be ticketed.
- From my own note on 0437's first `--related` run. `speck test` is in `scripts/turns.mjs`.
- Waits for nothing: no open ticket changes these files.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
