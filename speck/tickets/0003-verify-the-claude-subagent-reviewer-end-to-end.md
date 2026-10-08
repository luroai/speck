---
id: "0003"
title: "Verify the Claude subagent reviewer end to end"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | done
priority: 2              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-08
started: "2026-10-08T20:46:41.610Z"

---
# 0003 · Verify the Claude subagent reviewer end to end

**Status:** 🔨 building

## Problem
The `claude-subagent` reviewer path (speck prompt, Agent tool, SendMessage, speck record) is written but has never been run, so it may not work.

## Outcome
A ticket can be reviewed end to end with `reviewer: claude-subagent` and `allow_same_model_review: true`.

## Acceptance criteria
1. A sample ticket with a deliberate bug gets `changes_requested` from the subagent in round 1, recorded via `speck record`.
2. Round 2 continues the same subagent through SendMessage and ends in `approve` after the fix.
3. Any instructions in skills/speck-review/SKILL.md that turn out wrong are corrected.

## Out of scope
- Adding other reviewer models

## Notes

## Blocked question

## Review log

## Delivery log
