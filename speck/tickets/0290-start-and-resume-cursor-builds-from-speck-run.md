---
id: "0290"
title: "Start and resume Cursor builds from speck run"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0289"]               # ticket ids that must be done first
created: 2026-10-18

---
# 0290 · Start and resume Cursor builds from speck run

**Status:** 📋 ready

## Problem
speck lists Cursor as a builder, but speck run can't start or resume a Cursor build without a hand-written `build_command`, and it can't resume one at all, since it only resumes by Claude Code's `--session-id`.

## Outcome
With `builder: cursor`, speck run starts each build with Cursor's CLI, passing `builder_model`, and resumes it after a hand-back or a stop.

## Acceptance criteria
1. With `builder: cursor` and `build_command` blank, speck run first makes a chat with `agent create-chat` and keeps its id as the build's session, then starts the build as `agent -p --force --trust --output-format stream-json --resume <session> '/speck-build <id>'`, with `--model <builder_model>` when it's set.
2. A hand-back, a resumed build and the panel's resume command use `agent -p --force --trust --output-format stream-json --resume <session> '<message>'`.
3. speck finds Cursor's CLI as `agent`, or as `cursor-agent` when only that is installed.
4. When `agent create-chat` fails, speck run doesn't start the build, says why in one line, and leaves the ticket ready.
5. Builds with other builders start and resume as they do with 0289.

## Out of scope
- Reading Cursor logs and tokens in the panel: 0291.

## Notes
- Checked 2026-10-18: Cursor's CLI is `agent`; `-p`/`--print` runs without a person, `-f`/`--force` allows commands, `--trust` trusts the workspace in headless mode, `--output-format stream-json` works with `--print`, `--model` picks the model, `--resume [chatId]` resumes a chat, and `agent create-chat` makes an empty chat and returns its id (cursor.com/docs/cli/reference/parameters).
- Checked 2026-10-18: Cursor loads skills from `.agents/skills/`, `.cursor/skills/` and `.claude/skills/` (cursor.com/docs/skills).
- Unverified: whether `/speck-build <id>` in a `-p` prompt runs the skill in the CLI, and what `agent create-chat` prints besides the id (Cursor's CLI isn't installed here). Check both before building.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
