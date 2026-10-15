---
id: "0227"
title: "Keep a build's test runs in the foreground"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T21:25:21.332Z"

---
# 0227 · Keep a build's test runs in the foreground

**Status:** 🔨 building

## Problem
speck runs a build as `claude -p "/speck-build <id>"`, which ends when the builder ends its turn. On a slow machine the full suite takes long enough that the builder ran it in the background and ended its turn to wait. That ended the build and killed the suite, leaving the ticket `building` with nothing to carry it on (0213, 15 October, on an 8 GB MacBook Air).

## Outcome
A build waits for each test run and review round it starts, so it never ends while one is still running.

## Acceptance criteria
1. `/speck-build` tells the builder to run every test run (`speck test`, with or without `--files`) in the foreground and wait for it to finish, however long it takes, and never to end its turn while a command it started is still running in the background. It says why: a build started by `speck run` ends when the builder's turn ends, and whatever is still running is stopped with it.
2. `/speck-review` tells the builder the same for each review round it runs (`speck review`, or a reviewer subagent) and for the test runs between rounds.
3. No test that passed before this change fails.

## Out of scope
- Resuming a build that exited with its ticket still building or reviewing. The panel already says "Build stopped before finishing", and speck run resumes only killed builds today.
- Making the test suite faster.

## Notes
- Seen on 0213: the build's log ends with the builder saying the full suite "is running in the background (~9 min)", then `stop_reason: end_turn`, then the background task marked `killed`. Its run record shows exit code 0. 0215's build also ran commands in the background, three times.
- The steps are in `skills/speck-build/SKILL.md` (sections 1 step 6, 3 step 5 and 4) and `skills/speck-review/SKILL.md`. This repo builds from its installed copies in `.claude/skills/`, so check whether those need updating too, as earlier skill changes did.
- 0219 may also change `skills/speck-build/SKILL.md`. Build this one first.
- Checked 2026-10-15: Claude Code 2.1.296 has an environment variable, `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS`, that turns off background tasks (checked in the installed binary). Its Bash tool also caps a foreground command at `BASH_MAX_TIMEOUT_MS`, 10 minutes by default. Both go in the Delivery log as follow-ups, not here.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
