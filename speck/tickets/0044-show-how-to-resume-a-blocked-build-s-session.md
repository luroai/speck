---
id: "0044"
title: "Show how to resume a blocked build's session"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-08-speck-board.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0042", "0043"]                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T17:28:07.226Z"

---
# 0044 · Show how to resume a blocked build's session

**Status:** 🔨 building

## Problem
When a build started by `speck run` gets blocked, its session has ended and nobody is in it. To answer the question with the agent's full context, you need to know which session to reopen and which folder to reopen it from.

## Outcome
A blocked ticket in the panel shows the exact command to reopen its build session, with a button that copies it.

## Acceptance criteria
1. `speck status --json` adds `session` to each ticket: `{"id": …, "cwd": …}` from `speck/.cache/runs/<id>.json`, or `null` when there's no such file or it can't be read. Every existing field is unchanged.
2. In the queue, a `blocked` ticket with a `session` shows, under its blocked question, the command `cd <cwd> && <resume_command>` as text, with `{session}` in `resume_command` replaced by the session id. `<cwd>` is quoted for a POSIX shell when it contains anything other than letters, digits, `/`, `.`, `_` and `-`.
3. `resume_command` is a new setting in `speck/config.yml`, `claude --resume {session}` in the config template. When it's blank, the panel shows only "session <id>" instead of a command.
4. A Copy button next to the command copies the command's exact text to the clipboard and says "Copied" for 2 seconds.
5. A blocked ticket with no `session` (built in an ordinary session) shows nothing extra.

## Out of scope
- Opening a terminal from the panel.
- Showing runs, logs or sessions for tickets that aren't blocked.

## Notes
- Builds after 0043, which writes the run records, and 0042, which changes the same page.
- Claude Code keeps sessions by the folder they started in, so the command must `cd` to the folder `speck run` launched from (the main checkout), not the ticket's worktree.
- Checked 2026-10-09: `claude --resume <session-id>` resumes that conversation (`claude --help`, Claude Code 2.1.294), and sessions are stored per starting folder under `~/.claude/projects/` (seen on this machine).
- Checked 2026-10-09: the Clipboard API needs a secure context, and `http://127.0.0.1` and `http://localhost` count as one (W3C Secure Contexts).
- The panel gets `resume_command` from a new top-level field in `status --json` (and so `/api/state`), so the 0030 test that pinned the top-level keys to `tickets` and `ideas` now expects `resume_command` too. A config without the setting gets the default; a blank one shows only the session id.
- Self-check: quoted the session id the same way as the folder (a UUID is unchanged), trimmed `resume_command`, treated a run record with no `session` or `cwd` as no session, and made a refused clipboard say "Couldn't copy" instead of "Copied"; a second copy within 2 seconds no longer gets cut short by the first one's timer.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
