---
id: "0197"
title: "Run the full test suite once per review round in a build"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T13:17:42.890Z"

---
# 0197 · Run the full test suite once per review round in a build

**Status:** 🔨 building

## Problem
A build runs the full test suite after implementing, again after each fix in its self-check, and again before each review round. With two builds at once each full run took 3 to 5 minutes on 2026-10-15, and full runs were 40 to 65% of every build's time (0180: 15 of 23 minutes). This slows every project that uses speck, more so the bigger its suite.

## Outcome
Between its starting check and its ship, a build runs the full suite only once before each review round, and uses the ticket's own tests the rest of the time.

## Acceptance criteria
1. The build skill tells the builder to run only the ticket's own test files (`speck test --files <file>…`) while implementing and while fixing what the self-check finds, then the full suite (`speck test 2>&1 | tee /tmp/speck-<id>-tests.txt`) once, after the self-check and before the first review round. It no longer tells the builder to run the full suite when the ticket's tests first pass, or after each self-check fix.
2. The build and review skills tell the builder to run the full suite once before each later review round, merge rounds included, after its fixes for that round, and not at any other point between rounds.
3. If that full run fails because of the change, the skills tell the builder to fix it, using the failing tests' own files to check the fix, then run the full suite again before the round. A round is never started on a full run that failed because of the change.
4. The starting check (what fails before the build) and the steps for a ship that's handed back are unchanged, and the copies of both skills that `speck init` installs say the same as `skills/`.
5. No test that passed before this change fails, except checks of the old wording, which change to check AC1 to AC3.

## Out of scope
- Making each full run quicker (0198).
- The tests `speck ship` runs on the merged result, which stay the final check before anything lands.
- Choosing a subset of the suite by what a change touches.

## Notes
- Asked for 2026-10-15: "Builds take too long."
- The full-suite instructions are in `skills/speck-build/SKILL.md` section 3 steps 2 and 4 and section 4, and `skills/speck-review/SKILL.md` ("Your turn"). `.claude/skills/` holds this repo's installed copies.
- The starting check already reuses the saved result for the base branch (0112), so it costs nothing when the last ship tested the same code.
- Expected saving: about one full run per build, more with several review rounds. Not a target.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
