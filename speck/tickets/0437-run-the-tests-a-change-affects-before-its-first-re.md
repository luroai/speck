---
id: "0437"
title: "Run the tests a change affects before its first review"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: [] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T21:55:26.036Z"

---
# 0437 · Run the tests a change affects before its first review

**Status:** 🔨 building

## Problem
A build runs only its own test files before review, and the whole suite runs only at ship. So a change that breaks an existing test is caught at ship, after the reviewer approved: speck run hands the ticket back, and the build re-tests, fixes and gets another review round. 0427, a font change, lost about 8 of its 25 minutes this way, to layout tests it hadn't run.

## Outcome
Before its first review round, a build also runs the existing tests that cover the files it changed, so it finds what it broke before review rather than at ship.

## Acceptance criteria
1. `speck test --related` runs, in one run as `speck test --files` runs files, every test file under `test/` whose text names a file the branch changed since it left the base branch, or that imports a module under `test/support/` whose text names one. A file is named by its path from the repo root or by its file name. Files under `speck/` don't count as changed.
2. Before it runs anything, `speck test --related` prints each test file it chose, with the changed file that brought it in. With none, it says so in one line, runs no tests and exits with 0. Like `--files`, it also runs `commands.checks`.
3. The `speck-build` skill runs `speck test --related` once before the first review round, as well as the ticket's own test files, and includes its output in that round's test output. The rule that a test failing before the build is never changed or fixed in the build still holds.
4. `docs/brief.md`'s `speck test` row names `--related` and says what it chooses.

## Out of scope
- Running the whole suite during a build: `speck ship` still does that.
- Which tests are slow (0429).

## Notes
- The user asked on 2026-10-23 why 0427 took 25 minutes. Its ship failed on 0140, 0151, 0155 and 0156's layout tests, which it hadn't run (`speck/.cache/runs/run.log`).
- `test/support/panel.mjs` names `templates/panel.html`, so a change to the panel brings in every test that imports it. That's most panel tests, a few minutes, once per build, against an 8-minute hand-back. After the split (0430 to 0433), this picks fewer tests for each change.
- `speck test` is in `scripts/turns.mjs` (0239). The skill is `skills/speck-build/SKILL.md`; `.claude/skills/` links to it.
- Waits for nothing: no open ticket changes these files.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
