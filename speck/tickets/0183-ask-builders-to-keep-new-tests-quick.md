---
id: "0183"
title: "Ask builders to keep new tests quick"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 4              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-14

---
# 0183 · Ask builders to keep new tests quick

**Status:** 📋 ready

## Problem
Every ticket adds about ten tests, and each adds about a second to a full run of speck's own suite, which every build runs three or four times. Most of the suite's time goes on tests that start real browsers, panels or `speck run`: on 2026-10-14, tests over a second each took 73% of the test time, and the 50 real-browser tests 14%. The build instructions say nothing about how quick a test should be, so builders often start a real browser or process when a quicker check would test the same thing.

## Outcome
Builders write each new test the quickest way that still really checks its criterion, so test suites grow more slowly.

## Acceptance criteria
1. `/speck-build`'s instructions, where they say to write a test for each criterion, tell the builder to check each one the quickest way that really checks it. That means calling the code directly, or using a lightweight stand-in, rather than starting a real browser, server or long-running process, unless the criterion is about that real behaviour (for example, text selection in a browser).
2. They also tell the builder to wait for something to happen, with a time limit, rather than pausing for a fixed time, and to keep any pause that shows something doesn't happen as short as the check allows.
3. The words are general, with nothing specific to speck's own repo, since the instructions are installed in every project that uses speck.
4. This repo's `AGENTS.md` names its quick options (the fake page from `fakePage()`, and calling functions in `scripts/` directly) and its slow ones (`browserPage()`, `startPanel()` and starting `speck run`), with one line on when a slow one is worth it.
5. No test that passed before this change fails.

## Out of scope
- Rewriting existing tests to be quicker.
- Having the reviewer check test speed.
- How many times a build runs the full suite.

## Notes
- The place in the instructions: section 2, "Tests first", step 1 of `skills/speck-build/SKILL.md`. `.claude/skills/speck-build` links to it.
- Related: 0182 shares one Chromium per test file, and 0117 split the slowest test file.
- From the 2026-10-14 look at test suite cost. Moving later review rounds off the full suite was considered and left out: `speck ship` has to run the full suite after any fix anyway, so it would save only about a quarter of a run per ticket.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
