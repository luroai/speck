---
id: "0289"
title: "Start and resume Codex builds from speck run"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T10:41:59.157Z"

---
# 0289 · Start and resume Codex builds from speck run

**Status:** 🔨 building

## Problem
speck run can only start and resume builds with Claude Code: it gives each build a session id up front (`--session-id {session}`) and resumes it by that id. Codex chooses its own session id, so with Codex as the builder, speck run can't resume a build after a hand-back or a stop, and `builder_model` isn't passed to it.

## Outcome
With `builder: codex`, speck run starts each build with Codex, passing `builder_model`, and resumes it after a hand-back or a stop as it does Claude Code builds.

## Acceptance criteria
1. With `builder: codex` and `build_command` blank, speck run starts each build as `codex exec --json --dangerously-bypass-approvals-and-sandbox '$speck-build <id>'`, with `-m <builder_model>` when it's set. A `build_command` that's set is used as it is, as today.
2. speck run reads the build's session id from the first `thread.started` line of its log and keeps it in the build's run record as its session.
3. A hand-back, a stopped build that speck run resumes, and a resume command shown in the panel use `codex exec resume <session> --json --dangerously-bypass-approvals-and-sandbox '<message>'`, so the build carries on its own session.
4. When no session id has been read yet (the build stopped before writing one), speck run says so in one line and treats the build as it does a Claude Code build it can't resume.
5. Builds with `builder: claude` start and resume exactly as today.

## Out of scope
- Cursor: 0290. Reading Codex logs and tokens in the panel: 0291.

## Notes
- From `speck/ideas/2026-10-17-build-with-any-agent.md`. Covers `speck/ideas/2026-10-17-pass-builder-model-to-codex-builds.md`.
- Checked 2026-10-17: in a scratch repo, `codex exec --json --dangerously-bypass-approvals-and-sandbox` ran shell commands with no prompts; `$<skill>` in the prompt ran a skill from `.agents/skills/`; the first `--json` line was `{"type":"thread.started","thread_id":"…"}`; and `codex exec resume <thread_id> '<message>'` carried on that session (codex-cli 0.159.0).
- Starting and resuming are in `scripts/run.mjs` and `resumeArgv` in `scripts/hand-back.mjs`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
