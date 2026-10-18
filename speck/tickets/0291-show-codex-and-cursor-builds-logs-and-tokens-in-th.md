---
id: "0291"
title: "Show Codex and Cursor builds' logs and tokens in the panel"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0291 · Show Codex and Cursor builds' logs and tokens in the panel

**Status:** 📋 ready

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
- Unverified: Cursor's `stream-json` events (Cursor's CLI isn't installed here).
- The reader is `scripts/build-log.mjs`; spend is `scripts/spend.mjs`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
