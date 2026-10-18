---
id: "0290"
title: "Start and resume Cursor builds from speck run"                # one outcome, no "and"
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
after: ["0289"]               # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T12:05:55.735Z"

---
# 0290 · Start and resume Cursor builds from speck run

**Status:** 🔨 building

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
- Checked 2026-10-18 by running Cursor CLI 2026.10.16-e3cb207 (installed as both `agent` and `cursor-agent`, signed in) in a scratch repo:
  - `agent create-chat` prints only the chat id and a newline, exit 0.
  - `agent -p --force --trust --output-format stream-json --model auto --resume <id> '/alpha-check'` ran a skill from `.agents/skills/` by its slash name, ran its shell command with no prompts, and exited 0. Without `--trust`, a folder it hasn't seen before stops to ask for trust.
  - stream-json lines: `{"type":"system","subtype":"init","session_id":…,"model":…}`; `user`; `thinking` (subtype `delta`/`completed`); `tool_call` with subtype `started`/`completed` (a shell command's is `tool_call.shellToolCall.args.command`, and on completed `tool_call.shellToolCall.result.success.exitCode`, stdout and stderr); `{"type":"assistant","message":{"content":[{"type":"text","text":…}]}}`; and a final `{"type":"result","subtype":"success","is_error":false,"result":…,"session_id":…,"usage":{"inputTokens":…,"outputTokens":…,"cacheReadTokens":…,"cacheWriteTokens":…}}`. No cost field.
  - On a free Cursor plan only the `auto` model works: a named model fails with "ActionRequiredError: Named models unavailable Free plans can only use Auto". A chat keeps the model it was first run with. So when `builder_model` is blank, speck passes `--model auto` rather than no `--model`.
  - `agent models` prints "Available models", a blank line, then one `<id> - <display name>` per line, with "(current, default)" after the default.
- Checked 2026-10-18: a resumed chat remembers earlier turns (two `-p --resume <id>` runs on one chat from `agent create-chat`: the second recalled a word given in the first).
- Failing before this build: none
- With the user's checked facts, a blank `builder_model` starts a Cursor build with `--model auto`, not without `--model` as AC1 reads: a free plan can only use auto, and a chat keeps the model it first ran on. A resumed build passes no `--model`, as AC2 has it.
- Self-check: `agent create-chat` is given 20 seconds rather than a minute, since speck run waits for it on each check; a failed chat is said once per reason and tried again on the next check, with no run record written.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
