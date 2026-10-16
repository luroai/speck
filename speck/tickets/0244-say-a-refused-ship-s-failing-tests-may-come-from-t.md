---
id: "0244"
title: "Say a refused ship's failing tests may come from the ticket's own change"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-15-say-a-ship-s-failing-tests-may-be-the-ticket-s-own.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0241","0242"]                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-16T08:28:55.934Z"

---
# 0244 · Say a refused ship's failing tests may come from the ticket's own change

**Status:** 🔨 building

## Problem
When the tests fail on a ticket merged with a base branch that has moved on, while the base branch's own tests pass, `speck ship` says the ticket and the base branch's newer changes "fail together". Since builds run only their own tests, the ticket's own change breaking another test is just as likely, so the message, and the review pack it reaches, can point at the wrong cause.

## Outcome
A ship refused this way names both possible causes.

## Acceptance criteria
1. When the tests fail on the ticket merged with the base branch as it is now, the base branch has new commits since the ticket's branch started, and the base branch's own tests pass, `speck ship`'s message says the tests failed on the ticket as it would land, because of the ticket's own change or because of it with the base branch's newer changes. It still names the failing tests, and says to merge the base branch's newer changes into the ticket, fix the failing tests, get it reviewed, then ship again.
2. The message no longer says "fail together". Everything else is as today: the exit codes (16 with `--auto`, otherwise 1), the message when the base branch hasn't moved on, and the message when the base branch's own tests fail too (exit 14).
3. The brief's description of `speck ship` says the same as AC1. No test that passed before this change fails, except checks of the "fail together" wording, which are changed to check AC1.

## Out of scope
- Renaming the build skill's "Tests fail together" steps, or changing what `speck run` does with exit 16.
- Telling the two causes apart.

## Notes
- The message is in `scripts/ship.mjs`, where `moved` is true (`e.together`). The brief's paragraph on `speck ship` is in `docs/brief.md`.
- Seen on 0223 (2026-10-16), whose own change broke an older panel test.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
