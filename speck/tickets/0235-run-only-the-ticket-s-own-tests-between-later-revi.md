---
id: "0235"
title: "Run only the ticket's own tests during a build"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
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
# 0235 · Run only the ticket's own tests during a build

**Status:** 📝 draft

## Problem
A build runs the whole test suite before review round 1, before every later round and after each merge, and `speck ship` runs it again on the merged result before anything lands. On a laptop where the suite takes 8 minutes, that's several whole runs per ticket, and with builds side by side the machine is loaded for hours. The run at ship is the one that decides whether a ticket lands, so the others mostly repeat it.

## Outcome
A build runs only the ticket's own tests, and the whole suite runs once per ticket, in `speck ship`.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. `/speck-build` and `/speck-review` tell the builder, before every review round (round 1, later rounds and merge rounds alike), to run with `speck test --files` the ticket's own test files, any existing test files it changed and the files of any test that failed in its last test run, and never to run the whole suite (`speck test` without `--files`). The builder says in each round's response file which test files it ran.
2. The reviewer prompt says the test output covers only those files, and that a criterion asking that no test that passed before fails is checked by `speck ship`'s whole-suite run: the reviewer judges it from the tests that were run and the change, and doesn't fail it for want of a whole-suite run.
3. After a hand-back for failing tests (exit 16), "Tests fail together" in `/speck-build` runs the files of the failing tests `speck ship` named, plus the ticket's own, not the whole suite. The hand-back message and those steps say the tests failed on the ticket as it would land, whether because of its own change or with the base branch's newer changes, rather than saying only that the two don't work together.
4. `docs/brief.md` and `skills/speck-build/SKILL.md` say the whole suite runs in `speck ship` and not during a build, with no line left saying a build runs it before a review round.
5. No test that passed before this change fails.

## Out of scope
- Running only the tests related to the changed files, which speck can't work out for every project.
- Changing what `speck ship` runs.
- The run before the build changes anything (0238).

## Notes
- Decided 2026-10-15: a reviewer may approve a ticket that hasn't had a whole-suite run since its last changes. The whole-suite run in `speck ship` on the merged result, and its automatic hand-back when the tests fail there while the base branch's own pass (exit 16, `scripts/hand-back.mjs`), are what catch a break elsewhere. After two such hand-backs the build blocks the ticket and asks the user.
- Widened 2026-10-15 from rounds after the first to every round, replacing this ticket's earlier criteria.
- Lines that say otherwise today: `skills/speck-review/SKILL.md` ("from the whole suite… never `speck test --files`", and "This holds for every round"), `skills/speck-build/SKILL.md` section 1 step 1 ("Every build runs the whole suite at least once per review round"), section 3 step 5, section 4 and "Tests fail together" step 2, `templates/reviewer-prompt.md`, `handBackMessage()` in `scripts/hand-back.mjs`, and the `speck test` and `/speck-build` rows in `docs/brief.md`. `test/build-0197.test.mjs` and `test/brief-0111.test.mjs` pin some of this wording; change those tests only where they pin what this ticket changes.
- This repo builds from its installed copies in `.claude/skills/`, which here link to `skills/`.
- 0227 changes the same skills and comes first.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
