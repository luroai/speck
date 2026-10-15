---
id: "0225"
title: "Say in the brief that raising max_parallel_builds is supported"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-15-say-how-many-builds-run-at-once-the-same-way-everywhere.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0236"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T23:14:11.526Z"

---
# 0225 · Say in the brief that raising max_parallel_builds is supported

**Status:** 🔨 building

## Problem
The brief's principle 7 says `max_parallel_builds` sets how many builds `speck run` keeps going at once, but its reasons still say tickets are built one after another and that parallel builds would come back only as a deliberately designed feature. Someone reading it can't tell whether raising the setting is supported.

## Outcome
The brief says plainly that one build at a time is the default and raising `max_parallel_builds` is supported.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. The reasons under the brief's principle 7 say that one build at a time is the default and that raising `max_parallel_builds` in `speck/config.yml` is supported, and no longer say that tickets are always built one after another or that parallel builds would come back only as a deliberately designed feature.
2. The brief, the README and `templates/config.yml` agree: one build at a time unless you raise `max_parallel_builds`.
3. No test that passed before this change fails, except 0111's checks of the wording AC1 removes, which are changed to check the new wording.

## Out of scope
- The README, which `9a61857` already brought in line.
- Changing how `speck run` runs builds.

## Notes
- The reasons are in `docs/brief.md` under principle 7; `test/brief-0111.test.mjs` pins their wording and bans some phrases about parallel builds in the brief, README and skills.
- The note's open question (supported, or only allowed) is settled as supported: `speck run` honours the setting and the README and principle 7 already say to raise it.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
