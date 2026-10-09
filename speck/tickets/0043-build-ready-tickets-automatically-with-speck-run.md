---
id: "0043"
title: "Build ready tickets automatically with speck run"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-08-speck-board.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T14:27:46.963Z"

---
# 0043 · Build ready tickets automatically with speck run

**Status:** 🔨 building

## Problem
Setting a ticket to ready is meant to start the pipeline, but someone still has to open a session and type `/speck-build <id>` for every ticket. With worktrees, builds can run side by side, but only if someone starts each one.

## Outcome
`speck run` watches the board and starts a non-interactive build for each ready ticket that isn't waiting on another, recording each build's session so it can be picked up later.

## Acceptance criteria
1. `speck run` checks the tickets every 5 seconds and launches a build for each `ready` ticket with an empty `waiting_on`, in `speck status` order, while fewer than `max_parallel_builds` (a new setting in `speck/config.yml`, default 1) of the builds it launched are still running. It prints one line when it launches a build and one when a build exits, with the exit code, and runs until stopped. Stopping it launches nothing more and leaves running builds running.
2. Each build runs `build_command` from `speck/config.yml`, from the repo root and without a shell, with `{id}` replaced by the ticket id and `{session}` by a fresh UUID. The config template's default is `claude -p "/speck-build {id}" --session-id {session} --dangerously-skip-permissions`. A blank or missing `build_command` stops `speck run` with a plain message and a non-zero exit.
3. For each build, speck writes `speck/.cache/runs/<id>.json` with the session id, the folder the command ran from, the start time and the process id, and sends the build's stdout and stderr to `speck/.cache/runs/<id>.log`. Nothing in `speck/tickets/` is changed by `speck run` itself.
4. A ticket is launched at most once by one `speck run`. If a build exits while its ticket is still `ready`, speck says so with the last five lines of its log and doesn't launch it again.
5. `speck run` refuses to start, with a plain message and a non-zero exit, when the checkout isn't on `base_branch` or when another `speck run` is already running in this repo.

## Out of scope
- Showing runs or resume commands in the panel (0044).
- Builders other than through `build_command`.
- Retrying failed builds or stopping running ones.

## Notes
- Decided by the user: builds run with `--dangerously-skip-permissions`, because nobody is there to answer permission prompts. Each build works in its own worktree, but the agent can still run any command on the machine. `speck/product.md` must say so under known limits.
- Decided by the user: `auto_ship` and `auto_ship_risk` are unchanged, so a build that's approved ships as configured.
- A blocked build already writes its question, sets `blocked`, commits and exits, so no extra handling is needed for a build that gets stuck.
- Risk is high: it launches agents that can run any command with no prompts.
- Checked 2026-10-09: `claude -p` runs non-interactively, `--session-id <uuid>` sets the session id and must be a valid UUID, and `--dangerously-skip-permissions` bypasses all permission checks (`claude --help`, Claude Code 2.1.294).
- Unverified: that `claude -p "/speck-build <id>"` runs the skill the same way as typing it in a session (a real build is needed to check it). The builder checks it with one real run on a throwaway repo and records the result here.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
