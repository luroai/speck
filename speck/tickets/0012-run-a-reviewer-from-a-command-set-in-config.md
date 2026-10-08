---
id: "0012"
title: "Run a reviewer from a command set in config"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-08
started: "2026-10-08T21:31:53.751Z"

---
# 0012 · Run a reviewer from a command set in config

**Status:** 🔨 building

## Problem
`speck review` can only run Codex, and every other reviewer is driven by the builder through skill instructions, with the builder saving the verdict file itself. A Cursor, Gemini or Claude Code user has no reviewer speck can run for them, and outside Codex the builder could record its own approval.

## Outcome
Any reviewer agent with a non-interactive mode can be set up in `speck/config.yml` as a command, and `speck review <id>` runs it and records the verdict itself, so the builder never handles the verdict.

## Acceptance criteria
1. With a reviewer whose entry under `reviewer_options` in `speck/config.yml` has a `command` (for example `reviewer: cursor` with `command: "cursor-agent -p --output-format json"`), `speck review <id>` runs that command from the repo root, sends the full review prompt (the same text `speck prompt <id>` prints, including the verdict schema) on stdin, and records the round with `reviewer: <name>` and the reviewed commit.
2. Placeholders `{model}` and `{effort}` in the command are replaced with the ticket's resolved `reviewer_model` and `reviewer_effort`. A placeholder whose value is blank is removed together with the flag word just before it (for example `--model {model}` disappears entirely), so the reviewer runs on its own default.
3. The verdict is read from the command's stdout: either the whole output as JSON, a ```` ```json ```` fenced block, or a JSON envelope whose `result` string holds the verdict. Anything else, or a non-zero exit, fails with a plain error that quotes the last five lines of stderr, and no round is recorded.
4. Every round after the first sends the full round-1 prompt again, followed by every earlier verdict and builder response in order and the diff since the last review, so a reviewer with no memory of earlier rounds can keep finding ids stable.
5. `reviewer: codex` with no `command` behaves exactly as today, and a reviewer with no `command` and no built-in adapter still points the user at `speck record`, as today.

## Out of scope
- Resuming the reviewer's own session between rounds (0013).
- Moving Codex or `claude-subagent` onto the command adapter.
- Sandboxing the reviewer: read-only stays a prompt instruction for command reviewers, and the docs must say so.

## Notes
- The reviewer prompt template and verdict schema are unchanged; this ticket only adds a way to run them.
- Update README, `docs/brief.md` (reviewer table) and `product.md` with a worked example for Cursor and for Claude Code (`claude -p --output-format json`). Check each tool's current flags rather than copying these.
- **Flags checked (2026-10-08).** Claude Code 2.1.294 (`claude --help`): `-p`, `--output-format json`, `--model`, `--effort` and `--permission-mode plan` (read-only). Its JSON output is an envelope with the reply in `result`, plus `session_id` and `usage`. Cursor (`cursor-agent` isn't installed here, so this comes from the CLI docs at cursor.com/docs/cli/reference/output-format): `-p`, `--output-format json`, `--model`, and `--mode ask` for read-only. It gives the same `result` envelope, and on failure it exits non-zero with no JSON. Cursor has no effort flag, so its example leaves `{effort}` out.
- **Live run.** In a throwaway repo, `reviewer: claude` with `command: "claude -p --output-format json --permission-mode plan --model {model} --effort {effort}"` and `reviewer_model: haiku` reviewed a sample ticket with a planted bug, through this branch's `speck review`. Round 1 found the bug and the missing test and returned `changes_requested`. Round 2 had no session memory and got the full-history prompt with the builder's response; it marked all three findings fixed and approved. Both rounds were recorded as `reviewer: claude, model haiku`, with the envelope's `usage`, and round 2 kept `builder_response`.
- Claude's `usage.input_tokens` leaves out cached input, so the pack undercounts a Claude reviewer's tokens. This is listed as a follow-up.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
