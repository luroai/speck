---
id: "0332"
title: "Review with Cursor without writing a reviewer command"                # one outcome, no "and"
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
after: []                # ticket ids that must be done first
created: 2026-10-20

---
# 0332 · Review with Cursor without writing a reviewer command

**Status:** 📋 ready

## Problem
Claude Code and Codex review with no setup, but a Cursor reviewer needs a command written by hand under `reviewer_options`. The README's example for it also leaves out `--trust`, so in a folder Cursor hasn't been told to trust, the review stops at Cursor's "Workspace Trust Required" prompt with nobody there to answer (found on the user's work laptop, 2026-10-20).

## Outcome
`reviewer: cursor` reviews with no command of the user's own, read-only, on `reviewer_model`, and later rounds carry on the same Cursor chat.

## Acceptance criteria
1. With `reviewer: cursor` and no `reviewer_options.cursor.command`, `speck review <id>` runs Cursor's CLI (`agent`, or `cursor-agent` when only that is installed) with `-p --mode ask --trust --output-format json`, the prompt on stdin, and `--model <reviewer_model>`, leaving `--model` out when `reviewer_model` is blank, and records the verdict it returns.
2. Round 2 and later resume the chat round 1 started, with `--resume <session_id>` from round 1's output.
3. A `reviewer_options.cursor.command` of the user's own is used instead, as today.
4. No reviewer command in the README or `docs/brief.md` runs Cursor's CLI without `--trust`.
5. No test that passed before this change fails.

## Out of scope
- `reviewer_effort` for Cursor: Cursor's model names carry the effort (`claude-opus-5-5-high`), so it isn't passed.
- Recording the Cursor reviewer's tokens.

## Notes
- The built-in reviewers are `BUILT_IN` in `scripts/reviewers.mjs` (Claude Code's is there), and `cmdReview` in `scripts/review.mjs` picks one. `CURSOR_CLIS` in `scripts/install.mjs` finds the CLI, as builds do.
- Not `--sandbox enabled`: it fails to start where the OS doesn't support Cursor's sandbox ("Sandbox mode is enabled but not available on this system", Linux with AppArmor on this machine). Ask mode alone is read-only.
- Checked 2026-10-20 (Cursor CLI on this machine): `agent -p --mode ask --trust --output-format json --model auto` reads the prompt from stdin and prints one JSON object with `result` and `session_id`; `--resume <session_id>` carries on that chat; asked in ask mode to create a file and run `touch`, it refused and nothing was written. Without `--trust`, `agent -p` in an untrusted folder prints "Workspace Trust Required" and stops (user's work laptop).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
