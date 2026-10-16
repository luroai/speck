---
id: "0245"
title: "Stop speck run's Claude Code builds running commands in the background"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-15-turn-off-background-commands-in-speck-run-builds.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0241","0242","0244"]                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-16T08:33:01.977Z"

---
# 0245 · Stop speck run's Claude Code builds running commands in the background

**Status:** 🔨 building

## Problem
The build skill tells a builder to wait for every command, but a builder that puts a test run or review round in the background anyway and ends its turn ends a build that `speck run` started, partway, with the ticket left `building` or `reviewing`. It's only an instruction, so nothing stops it.

## Outcome
A Claude Code build that `speck run` starts can't run commands in the background.

## Acceptance criteria
1. Every build process `speck run` starts whose command starts Claude Code (its first word is `claude`, or a path ending in `/claude`) has `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` in its environment: new builds, builds it resumes after they were killed, and builds it resumes to hand a ticket back.
2. A build whose command starts any other program gets no such variable. When `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS` is already set in `speck run`'s own environment, the build keeps that value.
3. The brief's description of `speck run` says that its Claude Code builds can't run commands in the background, and why. No test that passed before this change fails.

## Out of scope
- Other builders' settings, if they have any.
- Builds started by hand with `/speck-build` in an open session.
- Changing `build_command` in `speck/config.yml` or its template.

## Notes
- Every build `speck run` starts goes through `startBuild()` in `scripts/run.mjs`, which already adds `SPECK_BUILD_SESSION` to the environment. The brief's `speck run` row is in `docs/brief.md`.
- Checked 2026-10-16: `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS` is in Claude Code 2.1.296, the installed version (`claude --version`). With it set to `1`, a `claude -p` session's Bash tool has no `run_in_background` parameter; without it, it has one (asked of `claude -p` both ways).
- The open question in the idea is settled as any command that starts Claude Code, not only the default `build_command`.
- Failing before this build: none
- Self-check: no changes

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
