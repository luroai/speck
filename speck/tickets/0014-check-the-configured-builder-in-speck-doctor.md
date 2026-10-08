---
id: "0014"
title: "Check the configured builder in speck doctor"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0012"]                # ticket ids that must be done first
created: 2026-10-08
started: "2026-10-08T21:48:15.075Z"

---
# 0014 · Check the configured builder in speck doctor

**Status:** 🔨 building

## Problem
`speck doctor` always checks for Claude Code, whatever `builder:` says, and the README lists Claude Code as a requirement. Someone building with Cursor, Codex or Gemini gets a failed check for a tool they don't use, and may think speck won't work for them.

## Outcome
`speck doctor` checks the builder set in `speck/config.yml`, and the docs say speck works with any agent that reads skills.

## Acceptance criteria
1. With `builder: claude`, `cursor`, `codex` or `gemini`, doctor checks that tool's CLI is installed (`claude`, `cursor-agent`, `codex`, `gemini`) under a heading naming that tool, with a plain-English install link on failure. It doesn't check for any other builder.
2. With any other `builder:` value, doctor shows one information line saying it can't check that builder, and this doesn't count as a failure.
3. The reviewer check uses the reviewer's command from config when there is one (its first word must be on the PATH), and keeps today's Codex install and sign-in checks for `reviewer: codex`.
4. The README Requirements section, `doctor`'s line in `product.md` and the "Claude Code is the only tested builder" known limit describe the builder as any agent that reads skills from `.agents/skills/` or `.claude/skills/`, naming Claude Code, Codex and Cursor.

## Out of scope
- Running or testing the builder.
- Changing where skills are installed: Cursor already reads `.agents/skills/` and `.claude/skills/`.

## Notes
- After 0012, so AC3 has a reviewer command to check.
- **Cursor's command name (checked 2026-10-08).** Cursor's install page (cursor.com/docs/cli/installation) now calls the CLI `agent`. Its installer still provides `cursor-agent` as the older name for the same binary, and guides recommend `cursor-agent` in scripts because `agent` can clash with other tools. Doctor checks `cursor-agent`, as this ticket says, and the 0012 reviewer examples stay valid. Gemini installs with `npm install -g @google/gemini-cli` and runs as `gemini`.
- Doctor finds tools on the PATH rather than running `--version`, so it never starts an agent. Codex's sign-in check is the only exception, kept as it was.
- The existing guard test 'no model name is hard-coded' matched `gemini-cli`, the npm package name in Gemini's install link. Its pattern now skips `gemini-cli` only, and every model name it caught before is still caught.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
