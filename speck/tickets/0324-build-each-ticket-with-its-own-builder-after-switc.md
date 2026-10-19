---
id: "0324"
title: "Build each ticket with its own builder after switching to Claude Code"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-19-build-codex-tickets-with-codex-after-switching-to-claude.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-19

---
# 0324 · Build each ticket with its own builder after switching to Claude Code

**Status:** 📋 ready

## Problem
`speck run` builds each ticket with the builder it records only when `build_command` is blank (0312). Switching the builder to Claude Code sets `build_command` to Claude Code's own command, because a blank one means "don't start builds" for Claude Code. So after switching back to Claude Code, tickets made with Codex or Cursor are built by Claude Code, though the Settings view says tickets keep the builder they were made with.

## Outcome
With Claude Code's own build command, tickets made with Codex or Cursor are still built by Codex or Cursor.

## Acceptance criteria
1. When `build_command` is exactly speck's own command for Claude Code, a ticket whose `builder:` is `codex` or `cursor` is built with that builder's own command, as with a blank `build_command`.
2. A `build_command` that's anything else, a command you've written yourself, is used for every ticket, as today.
3. A blank `build_command` with `builder: claude` still means speck run starts no builds, as today.
4. What the Settings view says about tickets keeping their builder is true in each of these cases, and it says so when a `build_command` you've written yourself means they won't. (checked by review)

## Out of scope
- Builders other than Claude Code, Codex and Cursor.

## Notes
- From `speck/ideas/2026-10-19-build-codex-tickets-with-codex-after-switching-to-claude.md`. Each ticket's builder is chosen in `scripts/ticket-builder.mjs`; Claude Code's own command is `DEFAULT_BUILD_COMMAND` in `scripts/build-model.mjs` and `OWN_BUILD_COMMANDS` in `scripts/builder-switch.mjs`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
