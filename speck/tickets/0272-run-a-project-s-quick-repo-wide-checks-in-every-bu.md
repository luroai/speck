---
id: "0272"
title: "Run a project's quick repo-wide checks in every build"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0270"]               # ticket ids that must be done first
created: 2026-10-17

---
# 0272 · Run a project's quick repo-wide checks in every build

**Status:** 📋 ready

## Problem
Builds run only the ticket's own test files, and `speck ship` runs the whole suite. That's on purpose, to save the suite's minutes on every build (0113). But some of a project's tests check rules for the whole repo, such as speck's limit of 600 lines per script (0078 AC2) and its ban on commit ids in tests (0085 AC3). A build breaks those without knowing, and they only fail at ship time, costing a hand-back and another review round. Four of the six hand-backs on 2026-10-17 were rules like these.

## Outcome
A project can name the quick test files that check rules for the whole repo, and every build runs them alongside the ticket's own tests, so a broken rule is caught before review rather than at ship time.

## Acceptance criteria
1. A new setting, `commands.checks`, lists test files that check rules for the whole repo. It's in the config template, blank by default, with a comment saying what it's for, and `speck config set` accepts it.
2. When `commands.checks` lists files, the build skill runs them together with the ticket's own test files every time it runs those before a review round, merge rounds included, and treats a failure in them like a failure in the ticket's own tests. When it's blank, builds run as today.
3. A file listed in `commands.checks` that doesn't exist makes the run fail, saying which file is missing.
4. This repo's `speck/config.yml` lists the test files for 0078 AC2 and 0085 AC3, and any other test file that checks a rule for the whole repo and runs in under 5 seconds.
5. `docs/brief.md` describes `commands.checks` beside `commands.test_files`.

## Out of scope
- Running the whole suite during a build.
- The slow-test list, which 0271 makes unnecessary.

## Notes
- `commands.test_files` and `speck test --files` (0113) are the model: see `scripts/config.mjs` for the keys `speck config set` accepts.
- Criterion 2 is about the skill's instructions, so check it by review.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
