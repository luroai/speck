---
id: "0341"
title: Show each tool a Cursor or Codex build uses in its log, as for Claude Code                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0340"]                # ticket ids that must be done first
created: 2026-10-20
started: "2026-10-20T20:34:42.371Z"

---
# 0341 · Show each tool a Cursor or Codex build uses in its log, as for Claude Code

**Status:** 🔨 building

## Problem
The panel's build log should read the same whichever agent builds. Today a Cursor build's log shows only its messages: its file reads, edits and searches aren't shown at all, as only its shell commands are read, and those show as `→ Shell: …` where Claude Code's show as `→ Bash: …`. A Codex build's file edits aren't shown, and some of its commands keep Codex's `/bin/bash -lc "…"` wrapper.

## Outcome
Each step a Cursor or Codex build takes shows in its log as the same kind of line a Claude Code build's does.

## Acceptance criteria
1. In a Cursor build's log, a shell command starting shows as `→ Bash: <command>`; a file read as `→ Read: <path>`; an edit as `→ Edit: <path>`; a new file written as `→ Write: <path>`; a content search as `→ Grep: <pattern>`; and a file-name search as `→ Glob: <pattern>`, as Claude Code's tool calls show.
2. In a Codex build's log, a command shows as `→ Bash: <command>`, with Codex's `/bin/bash -lc` wrapper taken off whether the command inside it is in single quotes, double quotes or none, and a file change shows as `→ Edit: <path>` for each file it changes (`→ Write: <path>` for a file it adds).
3. A Cursor or Codex tool call of a kind not listed in 1 or 2 shows as `→ <its name>`, and the rest of the log shows as before.
4. Claude Code build logs show exactly as before.
5. No test that passed before this change fails.

## Out of scope
- Times on these lines (0340 for Cursor, 0342 for Codex).
- Showing what a read, edit or search returned.

## Notes
- The reader is `readable` in `scripts/build-log.mjs`. It handles only Cursor's `shellToolCall` and Codex's `command_execution`; `shellLine` strips only a single-quoted `sh -c '…'` wrapper.
- Claude Code's names are kept as the ones every log uses, so existing logs read as they do.
- After 0340, which changes the same reader.
- Checked 2026-10-20, with the CLIs on this machine: a Cursor build (`agent -p --force --trust --output-format stream-json`) that read, edited and searched a file emitted `tool_call` events holding `readToolCall`, `editToolCall` and `grepToolCall`, each with `args.path` (and `args.pattern` for grep), and speck's reader showed none of them. A Codex build (`codex exec --json`) emitted `command_execution` items with commands such as `/bin/bash -lc 'cat a.md'` and `/bin/bash -lc "rg -n -w --hidden 'doc' ."`, and a `file_change` item with `changes[].path`; the reader showed the double-quoted command with its wrapper and left out the file change.
- Checked 2026-10-20, with Cursor Agent 2026.10.19 and codex-cli 0.159.0: Cursor has no write tool call. It writes a new file with an `editToolCall` too (`args.path`), and only its `completed` event shows the file was new: its `result.success.diffString` starts `--- /dev/null`. Its file-name search is a `globToolCall` with `args.globPattern`. In Codex, each of a `file_change` item's `changes` has a `kind`: `add` for a file it adds, `update` for one it changes.
- The Foreman (2026-10-20 20:32 UTC) asked you: Cursor only shows a file is new once the change finishes: should its file lines be written when they finish, so new files show as Write (recommended), or when they start, always as Edit?. Why: The builder checked Cursor's real output and found new files can't be told apart from edits until they finish, so it stopped to let you choose how those lines should show before starting.
- You answered the Foreman (2026-10-20 20:32 UTC): I’m happy with your recommendation. Its question: Cursor only shows a file is new once the change finishes: should its file lines be written when they finish, so new files show as Write (recommended), or when they start, always as Edit?

- You answered the Foreman (2026-10-20 20:32 UTC): I'm happy with your recommendation. So Cursor's file lines are written when the change finishes, and a new file shows as Write.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
