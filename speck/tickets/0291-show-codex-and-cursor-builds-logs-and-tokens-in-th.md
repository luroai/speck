---
id: "0291"
title: "Show Codex and Cursor builds' logs and tokens in the panel"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T12:05:34.361Z"

---
# 0291 · Show Codex and Cursor builds' logs and tokens in the panel

**Status:** 🔨 building

## Problem
The panel reads build logs and builder spend only from Claude Code's `stream-json` output. A Codex or Cursor build's live log would show raw JSON, and its tokens wouldn't be counted.

## Outcome
The panel shows a Codex or Cursor build's log as readably as a Claude Code one, and counts its tokens.

## Acceptance criteria
1. A Codex build log (`codex exec --json`) reads in the panel as a Claude Code one does: the agent's messages, and one line per command it runs, with other events left out.
2. A Cursor build log (`--output-format stream-json`) reads the same way.
3. A Codex or Cursor build's tokens are recorded and shown wherever a Claude Code build's are. Its cost is shown as unknown, not as $0.
4. Claude Code build logs read and count exactly as today.

## Out of scope
- Working out a cost from tokens.

## Notes
- Checked 2026-10-17: Codex's `--json` lines include `item.completed` events whose `item.type` is `agent_message` (with `text`) or `command_execution` (with `command` and `exit_code`), and turn usage with `input_tokens`, `cached_input_tokens` and `output_tokens` (codex-cli 0.159.0, in a scratch repo).
- Checked 2026-10-18 by running Cursor CLI 2026.10.16-e3cb207 (installed as both `agent` and `cursor-agent`, signed in) in a scratch repo:
  - `agent create-chat` prints only the chat id and a newline, exit 0.
  - `agent -p --force --trust --output-format stream-json --model auto --resume <id> '/alpha-check'` ran a skill from `.agents/skills/` by its slash name, ran its shell command with no prompts, and exited 0. Without `--trust`, a folder it has not seen before stops to ask for trust.
  - `stream-json` lines: `{"type":"system","subtype":"init","session_id":…,"model":…}`; `user`; `thinking` (subtype `delta`/`completed`, leave out); `tool_call` with subtype `started`/`completed`, and for a shell command `tool_call.shellToolCall.args.command`, and on completed `tool_call.shellToolCall.result.success.exitCode` (and stdout/stderr); `{"type":"assistant","message":{"content":[{"type":"text","text":…}]}}`; and a final `{"type":"result","subtype":"success","is_error":false,"result":…,"session_id":…,"usage":{"inputTokens":…,"outputTokens":…,"cacheReadTokens":…,"cacheWriteTokens":…}}`. No cost field.
  - On a free Cursor plan only the `auto` model works: any named model fails with "ActionRequiredError: Named models unavailable Free plans can only use Auto". A chat keeps the model it was first run with, so a chat first run on a named model keeps failing. So when builder_model is blank, pass `--model auto` rather than nothing.
  - `agent models` prints "Available models", a blank line, then one `<id> - <display name>` per line, with "(current, default)" after the default.
- Not checked, and not needed for this ticket: that a resumed Cursor chat remembers earlier turns (a quick check printed no result line).
- Cursor's tokens: `inputTokens` + `outputTokens`, plus the cache fields counted as Claude Code's are. No cost.
- Failing before this build: none
- The reader is `scripts/build-log.mjs`; spend is `scripts/spend.mjs`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
