---
id: "0333"
title: "Run the Foreman on Cursor"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0330","0332"]                # ticket ids that must be done first
created: 2026-10-20

---
# 0333 · Run the Foreman on Cursor

**Status:** 📋 ready

## Problem
The Foreman runs only on Claude Code or Codex (`FOREMAN_AGENTS` in `scripts/foreman-agent.mjs`). Someone set up with Cursor alone, as on a work laptop, can't use the Foreman at all, and with a Cursor builder and the Foreman left blank it falls back to Claude Code, which may not be installed.

## Outcome
The Foreman can run on Cursor, on `foreman_model` when it's set, and is Cursor by default when the builder is.

## Acceptance criteria
1. `speck config set foreman cursor` and the Settings view accept `cursor` as the Foreman's agent.
2. With `foreman: cursor`, `speck run` starts the Foreman with Cursor's CLI (`agent`, or `cursor-agent` when only that is installed) as `-p --force --trust --output-format stream-json`, with `--model <foreman_model>` when it's set and left out when it's blank, and the brief as the prompt.
3. With `foreman` blank and `builder: cursor`, the Foreman runs on Cursor.
4. With `foreman` blank and any other builder, it runs as today: Codex for a Codex builder, Claude Code otherwise.
5. No test that passed before this change fails.

## Out of scope
- `foreman_effort` for Cursor: Cursor's model names carry the effort, so it isn't passed.
- Limiting which commands a Cursor Foreman may run, as Claude Code's `--allowedTools` does. It runs as Cursor builds do, as a Codex Foreman runs as Codex builds do.

## Notes
- `foremanAgentOf` and `foremanArgv` in `scripts/foreman-agent.mjs`; the Settings view's choices come from `FOREMAN_AGENTS` (`scripts/settings.mjs`). The Foreman's brief points at `.claude/skills/speck-foreman/SKILL.md` for any agent but Codex (`skillPath`), which Cursor reads.
- Cursor builds already start as `agent -p --force --trust --output-format stream-json` (`scripts/cursor-build.mjs`), so the Foreman's output is read like a Cursor build's.
- Checked 2026-10-20: Cursor's CLI takes `--model`, `--force`, `--trust` and `--output-format stream-json` (`agent --help` on this machine).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
