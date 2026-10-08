---
id: "0015"
title: "Ask the user to confirm before speck ship merges"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-08

---
# 0015 · Ask the user to confirm before speck ship merges

**Status:** 📝 draft

## Problem
Only Claude Code stops an agent starting `/speck-ship`, using `disable-model-invocation`. In Cursor, Codex and other agents, the "only you ship" gate is an instruction the agent is asked to follow, and the CLI ships for anyone who calls it.

## Outcome
`speck ship` asks for the user's confirmation before it changes anything, whichever agent is in use.

## Acceptance criteria
1. Run in an interactive terminal, `speck ship <id>` runs all its current checks, then prints the ticket id, title and changed-line count and asks `Ship <id>? [y/N]`. Anything but `y` or `yes` stops with nothing changed.
2. Run without an interactive terminal (as an agent runs it), `speck ship <id>` refuses with nothing changed unless the user has confirmed (see Notes for the open question on how).
3. All existing ship checks and their order are unchanged, and the tests cover both paths.

## Out of scope
- Making the gate impossible to get round: an agent with a shell can always run git itself. This raises the bar; it doesn't make shipping safe from a determined agent.

## Notes
- **Open question (changes AC2):** in Claude Code, `/speck-ship` runs `speck ship` through the agent's shell, which isn't interactive, so AC2 would break today's flow. Options: (a) `--yes` flag that the ship skill passes, which any agent could also pass; (b) the user runs `speck ship <id>` in their own terminal and `/speck-ship` only prints that command; (c) a one-time code `speck ship` prints that the user must type back to the agent. Recommendation: (b), since it's simplest and actually puts the merge in the user's hands.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
