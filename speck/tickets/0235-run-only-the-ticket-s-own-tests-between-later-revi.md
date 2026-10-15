---
id: "0235"
title: "Run only the ticket's own tests between later review rounds"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0227"]                # ticket ids that must be done first
created: 2026-10-15

---
# 0235 · Run only the ticket's own tests between later review rounds

**Status:** 📝 draft

## Problem
A build runs the whole test suite before it changes anything, before review round 1 and again before every later round, and `speck ship` runs it once more on the merged result before anything lands. On a laptop where the suite takes 8 minutes, each extra round costs a whole run, for every speck user whose suite is slow.

## Outcome
After review round 1, a build runs only the ticket's own tests between rounds, and the full run at ship is the check on everything else.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. `/speck-build` tells the builder, before each review round after the first (merge rounds aside), to run the ticket's own test files and the files of any test that failed in its last whole-suite run (`speck test --files`), instead of the whole suite.
2. Before round 1, and before a merge round, it still runs the whole suite, as today.
3. `/speck-review` says the same, and tells the builder to say in that round's response file which test files it ran, so the reviewer knows it wasn't the whole suite.
4. `docs/brief.md` (the `speck test` row) and `skills/speck-build/SKILL.md` describe when a build runs the whole suite as these criteria do, with no line left saying it runs before every review round.
5. No test that passed before this change fails.

## Out of scope
- Running only the tests related to the changed files, which speck can't work out for every project.
- Changing what `speck ship` runs.

## Notes
- Decided 2026-10-15: a reviewer may approve a round without a whole-suite run since the last changes. The whole-suite run in `speck ship` on the merged result, and its hand-back when tests fail together (exit 16), are what catch a break elsewhere.
- Lines that say otherwise today: `skills/speck-review/SKILL.md` ("from the whole suite… never `speck test --files`", and "This holds for every round"), `skills/speck-build/SKILL.md` section 4 and its step 1 line "Every build runs the whole suite at least once per review round", and the `speck test` row in `docs/brief.md`. `test/brief-0111.test.mjs` may pin some of this wording.
- The steps are in `skills/speck-build/SKILL.md` (section 4) and `skills/speck-review/SKILL.md`; this repo builds from its installed copies in `.claude/skills/`.
- 0227 changes the same skills and comes first.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
