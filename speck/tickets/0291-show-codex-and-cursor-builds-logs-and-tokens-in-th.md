---
id: "0291"
title: "Show Codex and Cursor builds' logs and tokens in the panel"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

**Status:** 🔍 reviewing

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
- Checked 2026-10-18 by running codex-cli 0.159.0 twice in a scratch repo, the second time resumed: `turn.completed` usage is cumulative over the session (output 5, then 10), and `input_tokens` includes `cached_input_tokens`. So a Codex build's tokens are the last `turn.completed`'s `input_tokens` + `output_tokens`.
- Cost "shown as unknown": the panel already leaves out a builder cost that isn't recorded (0120), and shows no $0, so a Codex or Cursor build's card shows its tokens and no cost figure.
- Self-check: no changes
- The reader is `scripts/build-log.mjs`; spend is `scripts/spend.mjs`.

## In plain words
When Codex or Cursor builds a ticket, the panel's live log now reads like a Claude Code one: what the agent says, and one line for each command it runs, with a cross under a command that failed. Before, these logs showed almost nothing useful. Once such a build ends, its tokens are recorded and shown in the shipped ticket's details, as Claude Code's are. Codex and Cursor don't say what a build cost, so no cost figure appears for them, rather than a misleading $0.

To see it, let Codex or Cursor build a ticket with speck run on, open its log in the panel, and once it has shipped, open its Details.

Worth keeping an eye on: if a Cursor build is stopped and picked up again, its token count may only cover the last part. That hasn't been checked yet, and it's in the inbox.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Whether Cursor's usage covers a resumed chat, and what its result text holds: `speck/ideas/2026-10-18-count-a-resumed-cursor-build-s-tokens.md`.
- Codex and Cursor tool calls other than shell commands (file changes, reads) are left out of the log, as the ticket asked. Showing them as Claude Code's tool calls are shown would be a small later change.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · approve</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "38982d1199a3a539742a0d91a64978bef56b0c9d",
    "thread_id": "01a14eea-837f-78d0-8730-e870a238afc7",
    "seconds": 25,
    "usage": {
      "input_tokens": 151895,
      "cached_input_tokens": 105344,
      "cache_write_input_tokens": 0,
      "output_tokens": 676,
      "reasoning_output_tokens": 59
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T12:09:39.499Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/build-log.mjs readable() renders Codex agent_message and command_execution items and omits other events. Passing 0291 AC1 tests cover messages, commands, failures, malformed items and the board's log tail."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/build-log.mjs readable() renders Cursor assistant messages and started shell calls, with completed-call failures. Passing 0291 AC2 tests cover readable output, result handling and failed commands."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/spend.mjs builderSpend() counts the documented Codex and Cursor usage fields. scripts/run.mjs recordExit() saves its output through the existing shared spend path. Passing 0291 AC3 tests verify totals, resumed Codex usage and panel tokens without a $0 cost."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Claude's existing message and usage handling remains intact. The passing 0291 AC4 regression test checks messages, tool calls, failures, result deduplication, modelUsage totals and usage-only totals."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Codex and Cursor build logs now show readable messages and commands, and their token counts use the existing panel reporting path. Unreported costs stay unknown. The supplied tests passed, Claude behaviour is preserved, and I found no blocking issues."
  }
}
```

</details>
